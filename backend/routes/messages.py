import uuid
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from db_cassandra import get_collection, cassandra_available
from db_neo4j import get_driver, neo4j_available
from db import supabase_admin

messages_bp = Blueprint("messages", __name__, url_prefix="/messages")


def _msgs():
    return get_collection("messages")


def _convos():
    return get_collection("conversations")


def _convo_id(user1: str, user2: str) -> str:
    """ID determinístico: siempre el mismo sin importar el orden."""
    return "_".join(sorted([user1, user2]))


def _fetch_user(user_id: str) -> dict:
    res = (
        supabase_admin.table("users")
        .select("user_id, name, surname, profile_photo_url")
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    return res.data[0] if res.data else {}


# ─── Endpoints ────────────────────────────────────────────────────────────────

@messages_bp.route("/<user_id>/conversations", methods=["GET"])
def get_conversations(user_id):
    """Lista todas las conversaciones del usuario ordenadas por última actividad."""
    if not cassandra_available():
        return jsonify([]), 200
    try:
        docs = list(_convos().find({"participants": user_id}, sort={"last_sent_at": -1}, limit=50))
        result = []
        for d in docs:
            other_id = next((p for p in d["participants"] if p != user_id), None)
            if not other_id:
                continue
            result.append({
                "conversation_id": str(d["_id"]),
                "other_user_id": other_id,
                "other_name": d.get("names", {}).get(other_id, "Usuario"),
                "other_photo": d.get("photos", {}).get(other_id) or None,
                "last_message": d.get("last_message", ""),
                "last_sent_at": d.get("last_sent_at", ""),
            })
        return jsonify(result), 200
    except Exception as e:
        print(f"[WARN] get_conversations: {e}")
        return jsonify([]), 200


@messages_bp.route("/conversation/<conversation_id>", methods=["GET"])
def get_messages(conversation_id):
    """Devuelve los mensajes de una conversación ordenados cronológicamente."""
    if not cassandra_available():
        return jsonify([]), 200
    try:
        docs = list(_msgs().find({"conversation_id": conversation_id}, sort={"sent_at": 1}, limit=100))
        for d in docs:
            d["_id"] = str(d["_id"])
        return jsonify(docs), 200
    except Exception as e:
        print(f"[WARN] get_messages: {e}")
        return jsonify([]), 200


@messages_bp.route("/send", methods=["POST"])
def send_message():
    """Envía un mensaje y actualiza la conversación."""
    if not cassandra_available():
        return jsonify({"error": "Mensajería no disponible"}), 503

    data = request.get_json() or {}
    from_id = (data.get("from_user_id") or "").strip()
    to_id = (data.get("to_user_id") or "").strip()
    body = (data.get("body") or "").strip()

    if not from_id or not to_id or not body:
        return jsonify({"error": "from_user_id, to_user_id y body requeridos."}), 400
    if from_id == to_id:
        return jsonify({"error": "No podés enviarte mensajes a vos mismo."}), 400

    # RF13: solo contactos pueden enviarse mensajes
    if neo4j_available():
        try:
            driver = get_driver()
            with driver.session() as session:
                connected = session.run(
                    "MATCH (a:User {user_id: $from})-[:CONNECTED_WITH]-(b:User {user_id: $to}) RETURN a LIMIT 1",
                    {"from": from_id, "to": to_id}
                ).single()
            if not connected:
                return jsonify({"error": "Solo podés enviar mensajes a tus contactos."}), 403
        except Exception as e:
            print(f"[WARN] messages contact check: {e}")

    convo_id = _convo_id(from_id, to_id)
    now = datetime.now(timezone.utc).isoformat()

    # Insertar mensaje
    _msgs().insert_one({
        "_id": str(uuid.uuid4()),
        "conversation_id": convo_id,
        "sender_id": from_id,
        "receiver_id": to_id,
        "body": body,
        "sent_at": now,
        "is_read": False,
    })

    # Crear o actualizar conversación
    existing = _convos().find_one({"_id": convo_id})
    if not existing:
        sender = _fetch_user(from_id)
        receiver = _fetch_user(to_id)
        sender_name = f"{sender.get('name', '')} {sender.get('surname') or ''}".strip()
        receiver_name = f"{receiver.get('name', '')} {receiver.get('surname') or ''}".strip()
        _convos().insert_one({
            "_id": convo_id,
            "participants": [from_id, to_id],
            "last_message": body,
            "last_sent_at": now,
            "last_sender_id": from_id,
            "names": {from_id: sender_name, to_id: receiver_name},
            "photos": {
                from_id: sender.get("profile_photo_url") or "",
                to_id: receiver.get("profile_photo_url") or "",
            },
        })
    else:
        _convos().update_one(
            {"_id": convo_id},
            {"$set": {"last_message": body, "last_sent_at": now, "last_sender_id": from_id}},
        )

    return jsonify({"ok": True, "conversation_id": convo_id}), 201


@messages_bp.route("/message/<message_id>/edit", methods=["PUT"])
def edit_message(message_id):
    data = request.get_json() or {}
    body = (data.get("body") or "").strip()
    user_id = (data.get("user_id") or "").strip()
    if not body or not user_id or not cassandra_available():
        return jsonify({"error": "body y user_id requeridos."}), 400
    try:
        _msgs().update_one(
            {"_id": message_id, "sender_id": user_id},
            {"$set": {"body": body, "edited": True}},
        )
        return jsonify({"ok": True}), 200
    except Exception as e:
        print(f"[WARN] edit_message: {e}")
        return jsonify({"error": str(e)}), 500


@messages_bp.route("/message/<message_id>", methods=["DELETE"])
def delete_message(message_id):
    """El emisor elimina su propio mensaje."""
    data = request.get_json() or {}
    user_id = (data.get("user_id") or "").strip()
    if not user_id or not cassandra_available():
        return jsonify({"error": "user_id requerido."}), 400
    try:
        _msgs().delete_one({"_id": message_id, "sender_id": user_id})
        return jsonify({"ok": True}), 200
    except Exception as e:
        print(f"[WARN] delete_message: {e}")
        return jsonify({"error": str(e)}), 500


@messages_bp.route("/<user_id>/unread-count", methods=["GET"])
def unread_count(user_id):
    """Cuenta mensajes no leídos recibidos por el usuario."""
    if not cassandra_available():
        return jsonify({"unread": 0}), 200
    try:
        docs = list(_msgs().find({"receiver_id": user_id, "is_read": False}, limit=100))
        return jsonify({"unread": len(docs)}), 200
    except Exception as e:
        print(f"[WARN] messages unread_count: {e}")
        return jsonify({"unread": 0}), 200


@messages_bp.route("/conversation/<conversation_id>/read", methods=["PUT"])
def mark_conversation_read(conversation_id):
    """Marca como leídos todos los mensajes recibidos en una conversación."""
    data = request.get_json() or {}
    reader_id = (data.get("user_id") or "").strip()
    if not reader_id or not cassandra_available():
        return jsonify({"ok": True}), 200
    try:
        _msgs().update_many(
            {"conversation_id": conversation_id, "receiver_id": reader_id, "is_read": False},
            {"$set": {"is_read": True}},
        )
        return jsonify({"ok": True}), 200
    except Exception as e:
        print(f"[WARN] mark_conversation_read: {e}")
        return jsonify({"ok": True}), 200

import uuid
from datetime import datetime, timezone
from bson import ObjectId
from flask import Blueprint, request, jsonify
from db import supabase_admin
from db_cassandra import get_collection, cassandra_available
from db_mongo import get_db
from routes.notifications import create_notification

groups_bp = Blueprint("groups", __name__, url_prefix="/groups")


def _group_msgs():
    return get_collection("group_chat")


@groups_bp.route("", methods=["GET"])
def list_groups():
    res = (
        supabase_admin.table("groups")
        .select("*")
        .order("created_at", desc=True)
        .execute()
    )
    return jsonify(res.data), 200


@groups_bp.route("", methods=["POST"])
def create_group():
    data = request.get_json()
    user_id = data.get("user_id")
    name = (data.get("name") or "").strip()
    if not user_id or not name:
        return jsonify({"error": "user_id y nombre son requeridos."}), 400

    group_id = str(uuid.uuid4())
    res = supabase_admin.table("groups").insert({
        "group_id": group_id,
        "name": name,
        "description": (data.get("description") or "").strip() or None,
        "admin_id": user_id,
    }).execute()

    if not res.data:
        return jsonify({"error": "Error al crear el grupo."}), 500

    supabase_admin.table("group_members").insert({
        "group_id": group_id,
        "user_id": user_id,
        "role": "admin",
    }).execute()

    return jsonify(res.data[0]), 201


@groups_bp.route("/<group_id>/members", methods=["GET"])
def get_members(group_id):
    res = (
        supabase_admin.table("group_members")
        .select("role, joined_at, users(user_id, name, surname, profile_photo_url)")
        .eq("group_id", group_id)
        .execute()
    )
    return jsonify(res.data), 200


@groups_bp.route("/<group_id>/join", methods=["POST"])
def join_group(group_id):
    data = request.get_json()
    user_id = data.get("user_id")
    if not user_id:
        return jsonify({"error": "user_id requerido."}), 400

    group = supabase_admin.table("groups").select("group_id").eq("group_id", group_id).limit(1).execute()
    if not group.data:
        return jsonify({"error": "Grupo no encontrado."}), 404

    existing = (
        supabase_admin.table("group_members")
        .select("group_id")
        .eq("group_id", group_id)
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    if existing.data:
        return jsonify({"error": "Ya sos miembro de este grupo."}), 409

    supabase_admin.table("group_members").insert({
        "group_id": group_id,
        "user_id": user_id,
        "role": "member",
    }).execute()

    # Notificar al admin del grupo
    try:
        grp = supabase_admin.table("groups").select("admin_id, name").eq("group_id", group_id).limit(1).execute()
        usr = supabase_admin.table("users").select("name, surname").eq("user_id", user_id).limit(1).execute()
        if grp.data and usr.data:
            admin_id = grp.data[0]["admin_id"]
            group_name = grp.data[0]["name"]
            u = usr.data[0]
            joiner = f"{u['name']} {u.get('surname') or ''}".strip()
            create_notification(admin_id, "group_join",
                                f"{joiner} se unió a tu grupo '{group_name}'.", ref_id=group_id)
    except Exception as e:
        print(f"[WARN] notif join_group: {e}")

    return jsonify({"ok": True}), 201


@groups_bp.route("/<group_id>/leave", methods=["DELETE"])
def leave_group(group_id):
    data = request.get_json() or {}
    user_id = data.get("user_id")
    if not user_id:
        return jsonify({"error": "user_id requerido."}), 400

    group = supabase_admin.table("groups").select("admin_id").eq("group_id", group_id).limit(1).execute()
    if group.data and group.data[0]["admin_id"] == user_id:
        return jsonify({"error": "El administrador no puede abandonar el grupo."}), 403

    supabase_admin.table("group_members").delete().eq("group_id", group_id).eq("user_id", user_id).execute()
    return jsonify({"ok": True}), 200


@groups_bp.route("/user/<user_id>", methods=["GET"])
def user_groups(user_id):
    res = (
        supabase_admin.table("group_members")
        .select("role, joined_at, groups(group_id, name, description, admin_id, created_at)")
        .eq("user_id", user_id)
        .execute()
    )
    return jsonify(res.data), 200


@groups_bp.route("/<group_id>/members/<target_user_id>/promote", methods=["PUT"])
def promote_member(group_id, target_user_id):
    """El admin del grupo puede promover a otro miembro a admin."""
    data = request.get_json() or {}
    requester_id = data.get("user_id", "").strip()
    if not requester_id:
        return jsonify({"error": "user_id requerido."}), 400

    group = supabase_admin.table("groups").select("admin_id, name").eq("group_id", group_id).limit(1).execute()
    if not group.data:
        return jsonify({"error": "Grupo no encontrado."}), 404

    # Solo el admin_id original o miembros con rol admin pueden promover
    grp = group.data[0]
    req_member = supabase_admin.table("group_members").select("role").eq("group_id", group_id).eq("user_id", requester_id).limit(1).execute()
    req_role = req_member.data[0]["role"] if req_member.data else None
    if grp["admin_id"] != requester_id and req_role != "admin":
        return jsonify({"error": "Solo un administrador puede promover miembros."}), 403

    supabase_admin.table("group_members").update({"role": "admin"}).eq("group_id", group_id).eq("user_id", target_user_id).execute()

    try:
        usr = supabase_admin.table("users").select("name, surname").eq("user_id", target_user_id).limit(1).execute()
        if usr.data:
            u = usr.data[0]
            create_notification(target_user_id, "group_promoted",
                                f"Ahora sos administrador del grupo '{grp['name']}'.", ref_id=group_id)
    except Exception as e:
        print(f"[WARN] notif promote_member: {e}")

    return jsonify({"ok": True}), 200


@groups_bp.route("/<group_id>/members/<target_user_id>/demote", methods=["PUT"])
def demote_member(group_id, target_user_id):
    """Un admin puede quitarle el rol de admin a otro admin (no al admin principal)."""
    data = request.get_json() or {}
    requester_id = data.get("user_id", "").strip()
    if not requester_id:
        return jsonify({"error": "user_id requerido."}), 400

    group = supabase_admin.table("groups").select("admin_id, name").eq("group_id", group_id).limit(1).execute()
    if not group.data:
        return jsonify({"error": "Grupo no encontrado."}), 404
    grp = group.data[0]

    if target_user_id == grp["admin_id"]:
        return jsonify({"error": "No se puede quitar el rol al administrador principal."}), 403

    req_member = supabase_admin.table("group_members").select("role").eq("group_id", group_id).eq("user_id", requester_id).limit(1).execute()
    req_role = req_member.data[0]["role"] if req_member.data else None
    if grp["admin_id"] != requester_id and req_role != "admin":
        return jsonify({"error": "Solo un administrador puede modificar roles."}), 403

    supabase_admin.table("group_members").update({"role": "member"}).eq("group_id", group_id).eq("user_id", target_user_id).execute()

    try:
        create_notification(target_user_id, "group_promoted",
                            f"Tu rol en el grupo '{grp['name']}' cambió a miembro.", ref_id=group_id)
    except Exception as e:
        print(f"[WARN] notif demote_member: {e}")

    return jsonify({"ok": True}), 200


@groups_bp.route("/<group_id>/members/<target_user_id>/kick", methods=["DELETE"])
def kick_member(group_id, target_user_id):
    """Un admin puede expulsar a cualquier miembro (excepto al admin principal)."""
    data = request.get_json() or {}
    requester_id = data.get("user_id", "").strip()
    if not requester_id:
        return jsonify({"error": "user_id requerido."}), 400

    group = supabase_admin.table("groups").select("admin_id, name").eq("group_id", group_id).limit(1).execute()
    if not group.data:
        return jsonify({"error": "Grupo no encontrado."}), 404
    grp = group.data[0]

    if target_user_id == grp["admin_id"]:
        return jsonify({"error": "No se puede expulsar al administrador principal."}), 403

    req_member = supabase_admin.table("group_members").select("role").eq("group_id", group_id).eq("user_id", requester_id).limit(1).execute()
    req_role = req_member.data[0]["role"] if req_member.data else None
    if grp["admin_id"] != requester_id and req_role != "admin":
        return jsonify({"error": "Solo un administrador puede expulsar miembros."}), 403

    supabase_admin.table("group_members").delete().eq("group_id", group_id).eq("user_id", target_user_id).execute()

    try:
        create_notification(target_user_id, "group_join",
                            f"Fuiste expulsado del grupo '{grp['name']}'.", ref_id=group_id)
    except Exception as e:
        print(f"[WARN] notif kick_member: {e}")

    return jsonify({"ok": True}), 200


@groups_bp.route("/<group_id>/posts", methods=["GET"])
def get_group_posts(group_id):
    """Devuelve las publicaciones del grupo ordenadas por fecha."""
    db = get_db()
    user_id = request.args.get("user_id", "")
    pipeline = [
        {"$match": {"group_id": group_id}},
        {"$sort": {"created_at": -1}},
        {"$limit": 50},
        {"$lookup": {"from": "likes", "localField": "_id", "foreignField": "post_id", "as": "likes_list"}},
        {"$addFields": {
            "likes_count": {"$size": "$likes_list"},
            "user_liked": {"$in": [user_id, "$likes_list.user_id"]} if user_id else False,
        }},
        {"$project": {"likes_list": 0}},
    ]
    docs = list(db.posts.aggregate(pipeline))

    author_ids = list({doc["user_id"] for doc in docs if doc.get("user_id")})
    authors = {}
    if author_ids:
        res = supabase_admin.table("users").select("user_id, name, surname, profile_photo_url").in_("user_id", author_ids).execute()
        authors = {u["user_id"]: u for u in (res.data or [])}

    result = []
    for doc in docs:
        doc = dict(doc)
        doc["_id"] = str(doc["_id"])
        if isinstance(doc.get("created_at"), datetime):
            doc["created_at"] = doc["created_at"].isoformat()
        author = authors.get(doc.get("user_id"), {})
        if author:
            doc["author_name"] = author.get("name", doc.get("author_name", ""))
            doc["author_surname"] = author.get("surname", doc.get("author_surname", ""))
            doc["author_photo_url"] = author.get("profile_photo_url", doc.get("author_photo_url"))
        result.append(doc)
    return jsonify(result), 200


@groups_bp.route("/<group_id>/posts", methods=["POST"])
def create_group_post(group_id):
    """Crea una publicación en el grupo."""
    data = request.get_json() or {}
    user_id = (data.get("user_id") or "").strip()
    content = (data.get("content") or "").strip()
    if not user_id or not content:
        return jsonify({"error": "user_id y content requeridos."}), 400

    member = supabase_admin.table("group_members").select("user_id").eq("group_id", group_id).eq("user_id", user_id).limit(1).execute()
    if not member.data:
        return jsonify({"error": "Solo los miembros pueden publicar en el grupo."}), 403

    usr = supabase_admin.table("users").select("name, surname, profile_photo_url").eq("user_id", user_id).limit(1).execute()
    author = usr.data[0] if usr.data else {}

    db = get_db()
    now = datetime.now(timezone.utc)
    doc = {
        "group_id": group_id,
        "user_id": user_id,
        "author_name": author.get("name", ""),
        "author_surname": author.get("surname") or "",
        "author_photo_url": author.get("profile_photo_url") or None,
        "content": content,
        "created_at": now,
        "updated_at": now,
    }
    result = db.posts.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    doc["created_at"] = now.isoformat()
    doc["likes_count"] = 0
    doc["user_liked"] = False
    return jsonify(doc), 201


@groups_bp.route("/<group_id>/posts/<post_id>", methods=["DELETE"])
def delete_group_post(group_id, post_id):
    """El autor o un admin del grupo puede eliminar una publicación."""
    data = request.get_json() or {}
    user_id = (data.get("user_id") or "").strip()
    try:
        oid = ObjectId(post_id)
    except Exception:
        return jsonify({"error": "post_id inválido."}), 400

    db = get_db()
    post = db.posts.find_one({"_id": oid, "group_id": group_id})
    if not post:
        return jsonify({"error": "Publicación no encontrada."}), 404

    is_author = post["user_id"] == user_id
    admin_check = supabase_admin.table("group_members").select("role").eq("group_id", group_id).eq("user_id", user_id).limit(1).execute()
    is_admin = admin_check.data and admin_check.data[0]["role"] == "admin"

    if not is_author and not is_admin:
        return jsonify({"error": "No tenés permiso para eliminar esta publicación."}), 403

    db.posts.delete_one({"_id": oid})
    db.likes.delete_many({"post_id": oid})
    return jsonify({"ok": True}), 200


@groups_bp.route("/<group_id>/messages", methods=["GET"])
def get_group_messages(group_id):
    """Devuelve los mensajes del grupo ordenados cronológicamente."""
    if not cassandra_available():
        return jsonify([]), 200
    try:
        try:
            docs = list(_group_msgs().find({"group_id": group_id}, sort={"sent_at": 1}, limit=100))
        except Exception:
            docs = list(_group_msgs().find({"group_id": group_id}, limit=100))
        for d in docs:
            d["_id"] = str(d["_id"])
        return jsonify(docs), 200
    except Exception as e:
        print(f"[WARN] get_group_messages: {e}")
        return jsonify([]), 200


@groups_bp.route("/<group_id>/messages", methods=["POST"])
def send_group_message(group_id):
    """Envía un mensaje al grupo."""
    if not cassandra_available():
        return jsonify({"error": "Mensajería no disponible"}), 503

    data = request.get_json() or {}
    user_id = (data.get("user_id") or "").strip()
    body = (data.get("body") or "").strip()
    if not user_id or not body:
        return jsonify({"error": "user_id y body requeridos."}), 400

    try:
        usr = supabase_admin.table("users").select("name, surname, profile_photo_url").eq("user_id", user_id).limit(1).execute()
        sender = usr.data[0] if usr.data else {}
        sender_name = f"{sender.get('name', '')} {sender.get('surname') or ''}".strip()

        now = datetime.now(timezone.utc).isoformat()
        _group_msgs().insert_one({
            "_id": str(uuid.uuid4()),
            "group_id": group_id,
            "sender_id": user_id,
            "sender_name": sender_name,
            "sender_photo": sender.get("profile_photo_url") or "",
            "body": body,
            "sent_at": now,
        })
    except Exception as e:
        print(f"[ERROR] send_group_message: {e}")
        return jsonify({"error": str(e)}), 500

    # Notificar a los demás miembros del grupo
    try:
        grp = supabase_admin.table("groups").select("name").eq("group_id", group_id).limit(1).execute()
        group_name = grp.data[0]["name"] if grp.data else "el grupo"
        members = supabase_admin.table("group_members").select("user_id").eq("group_id", group_id).execute()
        for m in (members.data or []):
            if m["user_id"] != user_id:
                create_notification(
                    m["user_id"], "group_message",
                    f"{sender_name} envió un mensaje en '{group_name}'.",
                    ref_id=group_id
                )
    except Exception as e:
        print(f"[WARN] notif send_group_message: {e}")

    return jsonify({"ok": True}), 201


@groups_bp.route("/<group_id>/messages/<message_id>", methods=["PUT"])
def edit_group_message(group_id, message_id):
    """El emisor puede editar su propio mensaje de grupo."""
    if not cassandra_available():
        return jsonify({"error": "Mensajería no disponible"}), 503
    data = request.get_json() or {}
    user_id = (data.get("user_id") or "").strip()
    body = (data.get("body") or "").strip()
    if not user_id or not body:
        return jsonify({"error": "user_id y body requeridos."}), 400
    try:
        _group_msgs().update_one(
            {"_id": message_id, "group_id": group_id, "sender_id": user_id},
            {"$set": {"body": body, "edited": True}},
        )
        return jsonify({"ok": True}), 200
    except Exception as e:
        print(f"[WARN] edit_group_message: {e}")
        return jsonify({"error": str(e)}), 500


@groups_bp.route("/<group_id>/messages/<message_id>", methods=["DELETE"])
def delete_group_message(group_id, message_id):
    """El emisor elimina su propio mensaje de grupo."""
    if not cassandra_available():
        return jsonify({"error": "Mensajería no disponible"}), 503
    data = request.get_json() or {}
    user_id = (data.get("user_id") or "").strip()
    if not user_id:
        return jsonify({"error": "user_id requerido."}), 400
    try:
        _group_msgs().delete_one({"_id": message_id, "group_id": group_id, "sender_id": user_id})
        return jsonify({"ok": True}), 200
    except Exception as e:
        print(f"[WARN] delete_group_message: {e}")
        return jsonify({"error": str(e)}), 500

import uuid
from datetime import datetime, timezone
from flask import Blueprint, jsonify
from db_cassandra import get_collection, cassandra_available

notifications_bp = Blueprint("notifications", __name__, url_prefix="/notifications")

_COL = "notifications"


def _coll():
    return get_collection(_COL)


def create_notification(user_id: str, notif_type: str, body: str, ref_id: str = None):
    """Inserta una notificación en AstraDB. Llamado desde jobs.py y otros."""
    if not cassandra_available():
        return
    try:
        _coll().insert_one({
            "_id": str(uuid.uuid4()),
            "user_id": user_id,
            "type": notif_type,
            "body": body,
            "ref_id": ref_id or "",
            "is_read": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    except Exception as e:
        print(f"[WARN] Cassandra create_notification: {e}")


@notifications_bp.route("/<user_id>", methods=["GET"])
def get_notifications(user_id):
    if not cassandra_available():
        return jsonify([]), 200
    try:
        docs = list(_coll().find({"user_id": user_id}, sort={"created_at": -1}, limit=50))
        for d in docs:
            d["_id"] = str(d["_id"])
        return jsonify(docs), 200
    except Exception as e:
        print(f"[WARN] get_notifications: {e}")
        return jsonify([]), 200


@notifications_bp.route("/<user_id>/unread-count", methods=["GET"])
def unread_count(user_id):
    if not cassandra_available():
        return jsonify({"unread": 0}), 200
    try:
        docs = list(_coll().find({"user_id": user_id, "is_read": False}, limit=100))
        return jsonify({"unread": len(docs)}), 200
    except Exception as e:
        print(f"[WARN] unread_count: {e}")
        return jsonify({"unread": 0}), 200


@notifications_bp.route("/<user_id>/read-all", methods=["PUT"])
def mark_all_read(user_id):
    if not cassandra_available():
        return jsonify({"ok": True}), 200
    try:
        _coll().update_many(
            {"user_id": user_id, "is_read": False},
            {"$set": {"is_read": True}}
        )
        return jsonify({"ok": True}), 200
    except Exception as e:
        print(f"[WARN] mark_all_read: {e}")
        return jsonify({"ok": True}), 200


@notifications_bp.route("/<notif_id>/read", methods=["PUT"])
def mark_read(notif_id):
    if not cassandra_available():
        return jsonify({"ok": True}), 200
    try:
        _coll().update_one({"_id": notif_id}, {"$set": {"is_read": True}})
        return jsonify({"ok": True}), 200
    except Exception as e:
        print(f"[WARN] mark_read: {e}")
        return jsonify({"ok": True}), 200

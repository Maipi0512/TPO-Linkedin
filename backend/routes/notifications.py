from flask import Blueprint, jsonify

notifications_bp = Blueprint("notifications", __name__, url_prefix="/notifications")

# Notificaciones → Cassandra (pendiente de implementación)
# Los endpoints devuelven respuestas vacías/ok hasta que Cassandra esté configurado.


@notifications_bp.route("/<user_id>", methods=["GET"])
def get_notifications(user_id):
    return jsonify([]), 200


@notifications_bp.route("/<user_id>/unread-count", methods=["GET"])
def unread_count(user_id):
    return jsonify({"unread": 0}), 200


@notifications_bp.route("/<user_id>/read-all", methods=["PUT"])
def mark_all_read(user_id):
    return jsonify({"ok": True}), 200


@notifications_bp.route("/<notif_id>/read", methods=["PUT"])
def mark_read(notif_id):
    return jsonify({"ok": True}), 200


def create_notification(user_id: str, notif_type: str, body: str, ref_id: str = None):
    # Stub — se implementa con Cassandra
    pass

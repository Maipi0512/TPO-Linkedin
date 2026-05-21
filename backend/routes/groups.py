import uuid
from flask import Blueprint, request, jsonify
from db import supabase_admin

groups_bp = Blueprint("groups", __name__, url_prefix="/groups")


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

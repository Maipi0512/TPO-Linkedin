import uuid
import os
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from db import supabase_admin

PHOTOS_DIR = os.path.join(os.path.dirname(__file__), "..", "static", "photos")
os.makedirs(PHOTOS_DIR, exist_ok=True)

profile_bp = Blueprint("profile", __name__, url_prefix="/profile")

WORK_TABLE = "work experience"  # nombre exacto en Supabase (con espacio)


# ─── Perfil completo ──────────────────────────────────────────────────────────

@profile_bp.route("/<user_id>", methods=["GET"])
def get_profile(user_id):
    user_res = (
        supabase_admin.table("users")
        .select("user_id, email, name, surname, dni, profile_photo_url, created_at")
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    if not user_res.data:
        return jsonify({"error": "Usuario no encontrado."}), 404

    roles_res = (
        supabase_admin.table("user_roles")
        .select("roles(name)")
        .eq("user_id", user_id)
        .execute()
    )
    roles = [r["roles"]["name"] for r in roles_res.data if r.get("roles")]

    exp_res = (
        supabase_admin.table(WORK_TABLE)
        .select("*, companies(name)")
        .eq("user_id", user_id)
        .order("from_date", desc=True)
        .execute()
    )

    edu_res = (
        supabase_admin.table("education")
        .select("*")
        .eq("user_id", user_id)
        .order("from_date", desc=True)
        .execute()
    )

    skills_res = (
        supabase_admin.table("user_skill")
        .select("level, skills(skill_id, name, type)")
        .eq("user_id", user_id)
        .execute()
    )

    return jsonify({
        **user_res.data[0],
        "roles": roles,
        "experience": exp_res.data,
        "education": edu_res.data,
        "skills": skills_res.data,
    }), 200


@profile_bp.route("/<user_id>", methods=["PUT"])
def update_profile(user_id):
    data = request.get_json()
    allowed = ["name", "surname", "dni"]
    update = {k: v for k, v in data.items() if k in allowed and v is not None}
    update["updated_at"] = datetime.now(timezone.utc).isoformat()

    supabase_admin.table("users").update(update).eq("user_id", user_id).execute()
    return jsonify({"ok": True}), 200


# ─── Foto de perfil ───────────────────────────────────────────────────────────

@profile_bp.route("/<user_id>/photo", methods=["POST"])
def upload_photo(user_id):
    file = request.files.get("photo")
    if not file:
        return jsonify({"error": "No se recibió ningún archivo."}), 400

    ext = (file.filename or "").rsplit(".", 1)[-1].lower()
    if ext not in ("jpg", "jpeg", "png", "webp"):
        return jsonify({"error": "Formato no soportado. Usá JPG, PNG o WEBP."}), 400

    content = file.read()
    if len(content) > 5 * 1024 * 1024:
        return jsonify({"error": "La imagen no puede superar 5 MB."}), 400

    filename = f"{user_id}.{ext}"
    with open(os.path.join(PHOTOS_DIR, filename), "wb") as f:
        f.write(content)

    url = f"http://localhost:5000/static/photos/{filename}"
    supabase_admin.table("users").update({"profile_photo_url": url}).eq("user_id", user_id).execute()

    return jsonify({"url": url}), 200


# ─── Experiencia laboral ──────────────────────────────────────────────────────

@profile_bp.route("/<user_id>/experience", methods=["POST"])
def add_experience(user_id):
    data = request.get_json()
    if not data.get("title") or not data.get("from_date"):
        return jsonify({"error": "Título y fecha de inicio son requeridos."}), 400

    entry = {
        "user_id": user_id,
        "company_id": data.get("company_id") or None,
        "title": data["title"],
        "description": data.get("description") or None,
        "from_date": data["from_date"],
        "end_date": data.get("end_date") or None,
        "is_current": data.get("is_current", False),
    }
    res = supabase_admin.table(WORK_TABLE).insert(entry).execute()
    return jsonify(res.data[0] if res.data else entry), 201


@profile_bp.route("/<user_id>/experience/<int:we_id>", methods=["PUT"])
def update_experience(user_id, we_id):
    data = request.get_json()
    allowed = ["title", "description", "from_date", "end_date", "is_current", "company_id"]
    update = {k: v for k, v in data.items() if k in allowed}
    supabase_admin.table(WORK_TABLE).update(update).eq("we_id", we_id).eq("user_id", user_id).execute()
    return jsonify({"ok": True}), 200


@profile_bp.route("/<user_id>/experience/<int:we_id>", methods=["DELETE"])
def delete_experience(user_id, we_id):
    supabase_admin.table(WORK_TABLE).delete().eq("we_id", we_id).eq("user_id", user_id).execute()
    return jsonify({"ok": True}), 200


# ─── Educación ────────────────────────────────────────────────────────────────

@profile_bp.route("/<user_id>/education", methods=["POST"])
def add_education(user_id):
    data = request.get_json()
    if not data.get("title") or not data.get("institution"):
        return jsonify({"error": "Título e institución son requeridos."}), 400

    entry = {
        "user_id": user_id,
        "title": data["title"],
        "field": data.get("field") or None,
        "institution": data["institution"],
        "from_date": data.get("from_date") or None,
        "end_date": data.get("end_date") or None,
        "is_actual": data.get("is_actual", False),
    }
    res = supabase_admin.table("education").insert(entry).execute()
    return jsonify(res.data[0] if res.data else entry), 201


@profile_bp.route("/<user_id>/education/<int:edu_id>", methods=["PUT"])
def update_education(user_id, edu_id):
    data = request.get_json()
    allowed = ["title", "field", "institution", "from_date", "end_date", "is_actual"]
    update = {k: v for k, v in data.items() if k in allowed}
    supabase_admin.table("education").update(update).eq("edu_id", edu_id).eq("user_id", user_id).execute()
    return jsonify({"ok": True}), 200


@profile_bp.route("/<user_id>/education/<int:edu_id>", methods=["DELETE"])
def delete_education(user_id, edu_id):
    supabase_admin.table("education").delete().eq("edu_id", edu_id).eq("user_id", user_id).execute()
    return jsonify({"ok": True}), 200


# ─── Habilidades ──────────────────────────────────────────────────────────────

@profile_bp.route("/skills", methods=["GET"])
def list_skills():
    res = supabase_admin.table("skills").select("*").order("name").execute()
    return jsonify(res.data), 200


@profile_bp.route("/<user_id>/skills", methods=["POST"])
def add_skill(user_id):
    data = request.get_json()
    skill_id = data.get("skill_id")
    level = data.get("level", "Principiante")
    name = (data.get("name") or "").strip()

    if not skill_id and not name:
        return jsonify({"error": "skill_id o name son requeridos."}), 400

    if not skill_id:
        # Reutilizar skill existente (búsqueda insensible a mayúsculas)
        existing = supabase_admin.table("skills").select("skill_id").ilike("name", name).limit(1).execute()
        if existing.data:
            skill_id = existing.data[0]["skill_id"]
        else:
            skill_type = (data.get("type") or "técnica").strip()
            res = supabase_admin.table("skills").insert({"name": name, "type": skill_type}).execute()
            if not res.data:
                return jsonify({"error": "Error al crear la habilidad."}), 500
            skill_id = res.data[0]["skill_id"]

    supabase_admin.table("user_skill").upsert(
        {"user_id": user_id, "skill_id": skill_id, "level": level}
    ).execute()
    return jsonify({"ok": True}), 201


@profile_bp.route("/<user_id>/skills/<int:skill_id>", methods=["DELETE"])
def remove_skill(user_id, skill_id):
    supabase_admin.table("user_skill").delete().eq("user_id", user_id).eq("skill_id", skill_id).execute()
    return jsonify({"ok": True}), 200

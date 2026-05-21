import uuid
from flask import Blueprint, request, jsonify
from db import supabase_admin
from routes.notifications import create_notification

jobs_bp = Blueprint("jobs", __name__, url_prefix="/jobs")


@jobs_bp.route("", methods=["GET"])
def list_jobs():
    res = (
        supabase_admin.table("jobs")
        .select("*, companies(name), job_skill(skills(skill_id, name, type))")
        .eq("is_active", True)
        .order("created_at", desc=True)
        .execute()
    )
    return jsonify(res.data), 200


@jobs_bp.route("", methods=["POST"])
def create_job():
    data = request.get_json()
    user_id = data.get("user_id")
    title = (data.get("title") or "").strip()
    if not user_id or not title:
        return jsonify({"error": "user_id y título son requeridos."}), 400

    entry = {
        "job_id": str(uuid.uuid4()),
        "poster_user_id": user_id,
        "company_id": data.get("company_id") or None,
        "title": title,
        "description": data.get("description") or "",
        "location": data.get("location") or None,
        "working_hours": int(data["working_hours"]) if data.get("working_hours") else None,
        "shift": data.get("shift") or "full-time",
        "modality": data.get("modality") or "presencial",
        "employment_type": data.get("employment_type") or "full-time",
        "is_active": True,
    }
    res = supabase_admin.table("jobs").insert(entry).execute()
    if not res.data:
        return jsonify({"error": "Error al crear la oferta."}), 500

    job = res.data[0]
    skill_names = data.get("skill_names") or []
    skill_ids_to_add = []
    for sname in skill_names:
        sname = sname.strip()
        if not sname:
            continue
        existing = supabase_admin.table("skills").select("skill_id").ilike("name", sname).limit(1).execute()
        if existing.data:
            skill_ids_to_add.append(existing.data[0]["skill_id"])
        else:
            new_skill = supabase_admin.table("skills").insert({"name": sname, "type": "técnica"}).execute()
            if new_skill.data:
                skill_ids_to_add.append(new_skill.data[0]["skill_id"])
    if skill_ids_to_add:
        supabase_admin.table("job_skill").insert(
            [{"job_id": job["job_id"], "skill_id": sid} for sid in skill_ids_to_add]
        ).execute()

    return jsonify(job), 201


@jobs_bp.route("/<job_id>", methods=["PUT"])
def update_job(job_id):
    data = request.get_json()
    user_id = data.get("user_id")
    job = supabase_admin.table("jobs").select("poster_user_id").eq("job_id", job_id).limit(1).execute()
    if not job.data:
        return jsonify({"error": "Oferta no encontrada."}), 404
    if job.data[0]["poster_user_id"] != user_id:
        return jsonify({"error": "No tenés permiso para editar esta oferta."}), 403
    allowed = ["title", "description", "location", "working_hours", "modality", "shift", "employment_type", "company_id", "is_active"]
    update = {k: v for k, v in data.items() if k in allowed}
    supabase_admin.table("jobs").update(update).eq("job_id", job_id).execute()
    return jsonify({"ok": True}), 200


@jobs_bp.route("/<job_id>", methods=["DELETE"])
def delete_job(job_id):
    data = request.get_json() or {}
    user_id = data.get("user_id")
    job = supabase_admin.table("jobs").select("poster_user_id").eq("job_id", job_id).limit(1).execute()
    if not job.data:
        return jsonify({"error": "Oferta no encontrada."}), 404
    if job.data[0]["poster_user_id"] != user_id:
        return jsonify({"error": "No tenés permiso para eliminar esta oferta."}), 403
    supabase_admin.table("jobs").delete().eq("job_id", job_id).execute()
    return jsonify({"ok": True}), 200


# ── Postulaciones ─────────────────────────────────────────────────────────────

@jobs_bp.route("/applications/<app_id>", methods=["PUT"])
def update_application(app_id):
    data = request.get_json()
    status = data.get("status")
    valid = ("submitted", "in_review", "in_process", "successful", "rejected")
    if status not in valid:
        return jsonify({"error": f"Estado inválido. Válidos: {valid}"}), 400
    supabase_admin.table("applications").update({"status": status}).eq("application_id", app_id).execute()

    # Notificar al candidato del cambio de estado
    app_res = supabase_admin.table("applications").select("user_id, job_id, jobs(title)").eq("application_id", app_id).limit(1).execute()
    if app_res.data:
        app_data = app_res.data[0]
        job_title = (app_data.get("jobs") or {}).get("title", "la oferta")
        status_labels = {
            "in_review": "en revisión", "in_process": "en proceso",
            "successful": "aceptada", "rejected": "rechazada"
        }
        label = status_labels.get(status, status)
        create_notification(
            app_data["user_id"], "application_update",
            f"Tu postulación a '{job_title}' cambió a: {label}.",
            ref_id=app_data["job_id"]
        )

    return jsonify({"ok": True}), 200


@jobs_bp.route("/<job_id>/apply", methods=["POST"])
def apply_to_job(job_id):
    data = request.get_json()
    user_id = data.get("user_id")
    if not user_id:
        return jsonify({"error": "user_id requerido."}), 400

    existing = (
        supabase_admin.table("applications")
        .select("application_id")
        .eq("job_id", job_id)
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    if existing.data:
        return jsonify({"error": "Ya te postulaste a esta oferta."}), 409

    res = supabase_admin.table("applications").insert({
        "application_id": str(uuid.uuid4()),
        "job_id": job_id,
        "user_id": user_id,
        "status": "submitted",
    }).execute()
    return jsonify(res.data[0] if res.data else {"ok": True}), 201


@jobs_bp.route("/<job_id>/applications", methods=["GET"])
def get_job_applications(job_id):
    res = (
        supabase_admin.table("applications")
        .select("*, users(user_id, name, surname, email, profile_photo_url)")
        .eq("job_id", job_id)
        .order("updated_at", desc=True)
        .execute()
    )
    return jsonify(res.data), 200


@jobs_bp.route("/user/<user_id>/applications", methods=["GET"])
def user_applications(user_id):
    res = (
        supabase_admin.table("applications")
        .select("*, jobs(job_id, title, companies(name))")
        .eq("user_id", user_id)
        .order("updated_at", desc=True)
        .execute()
    )
    return jsonify(res.data), 200


@jobs_bp.route("/user/<user_id>/posted", methods=["GET"])
def user_posted_jobs(user_id):
    res = (
        supabase_admin.table("jobs")
        .select("*, companies(name), job_skill(skills(skill_id, name, type))")
        .eq("poster_user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return jsonify(res.data), 200

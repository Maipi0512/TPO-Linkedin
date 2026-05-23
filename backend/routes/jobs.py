import uuid
from flask import Blueprint, request, jsonify
from db import supabase_admin
from routes.notifications import create_notification
from routes.connections import create_job_node, delete_job_node

jobs_bp = Blueprint("jobs", __name__, url_prefix="/jobs")


@jobs_bp.route("", methods=["GET"])
def list_jobs():
    q = (request.args.get("q") or "").strip()

    base = (
        supabase_admin.table("jobs")
        .select("*, companies(name), job_skill(skills(skill_id, name, type))")
        .eq("is_active", True)
        .order("created_at", desc=True)
    )

    if not q:
        return jsonify(base.execute().data), 200

    pattern = f"%{q}%"

    # job_ids matching by skill name
    skill_res = supabase_admin.table("skills").select("skill_id").ilike("name", pattern).execute()
    skill_ids = [s["skill_id"] for s in (skill_res.data or [])]
    job_ids_by_skill: set = set()
    if skill_ids:
        js_res = supabase_admin.table("job_skill").select("job_id").in_("skill_id", skill_ids).execute()
        job_ids_by_skill = {r["job_id"] for r in (js_res.data or [])}

    # job_ids matching by company name
    company_res = supabase_admin.table("companies").select("company_id").ilike("name", pattern).execute()
    company_ids = [c["company_id"] for c in (company_res.data or [])]

    or_parts = [f"title.ilike.{pattern}", f"location.ilike.{pattern}"]
    if job_ids_by_skill:
        or_parts.append(f"job_id.in.({','.join(job_ids_by_skill)})")
    if company_ids:
        or_parts.append(f"company_id.in.({','.join(company_ids)})")

    res = base.or_(",".join(or_parts)).execute()
    return jsonify(res.data), 200


@jobs_bp.route("", methods=["POST"])
def create_job():
    data = request.get_json()
    user_id = data.get("user_id")
    title = (data.get("title") or "").strip()
    if not user_id or not title:
        return jsonify({"error": "user_id y título son requeridos."}), 400

    # Resolver company_id: puede venir directo o via company_name
    company_id = data.get("company_id") or None
    if not company_id:
        company_name_input = (data.get("company_name") or "").strip()
        if company_name_input:
            existing_co = supabase_admin.table("companies").select("company_id").ilike("name", company_name_input).limit(1).execute()
            if existing_co.data:
                company_id = existing_co.data[0]["company_id"]
            else:
                import uuid as _uuid
                new_co = supabase_admin.table("companies").insert({"company_id": str(_uuid.uuid4()), "name": company_name_input}).execute()
                if new_co.data:
                    company_id = new_co.data[0]["company_id"]

    entry = {
        "job_id": str(uuid.uuid4()),
        "poster_user_id": user_id,
        "company_id": company_id,
        "title": title,
        "description": data.get("description") or "",
        "location": data.get("location") or None,
        "working_hours": int(data["working_hours"]) if data.get("working_hours") else None,
        "shift": data.get("shift") or "mañana",
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

    # Sincronizar con Neo4j: crear nodo :Job y relaciones [:REQUIRES_SKILL]
    create_job_node(job["job_id"], [s.strip() for s in skill_names if s.strip()])

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
    # Eliminar dependencias antes del job (Supabase puede no respetar CASCADE)
    supabase_admin.table("applications").delete().eq("job_id", job_id).execute()
    supabase_admin.table("job_skill").delete().eq("job_id", job_id).execute()
    supabase_admin.table("jobs").delete().eq("job_id", job_id).execute()
    delete_job_node(job_id)
    return jsonify({"ok": True}), 200


# ── Postulaciones ─────────────────────────────────────────────────────────────

@jobs_bp.route("/applications/<app_id>", methods=["DELETE"])
def delete_application(app_id):
    """El candidato cancela su propia postulación."""
    data = request.get_json() or {}
    user_id = data.get("user_id", "").strip()
    if not user_id:
        return jsonify({"error": "user_id requerido."}), 400
    app_res = supabase_admin.table("applications").select("user_id").eq("application_id", app_id).limit(1).execute()
    if not app_res.data:
        return jsonify({"error": "Postulación no encontrada."}), 404
    if app_res.data[0]["user_id"] != user_id:
        return jsonify({"error": "No tenés permiso para cancelar esta postulación."}), 403
    supabase_admin.table("application_status_history").delete().eq("application_id", app_id).execute()
    supabase_admin.table("applications").delete().eq("application_id", app_id).execute()
    return jsonify({"ok": True}), 200


@jobs_bp.route("/applications/<app_id>", methods=["PUT"])
def update_application(app_id):
    data = request.get_json()
    status = data.get("status")
    valid = ("submitted", "in_review", "in_process", "successful", "rejected")
    if status not in valid:
        return jsonify({"error": f"Estado inválido. Válidos: {valid}"}), 400
    supabase_admin.table("applications").update({"status": status}).eq("application_id", app_id).execute()

    # Registrar en historial de estados
    supabase_admin.table("application_status_history").insert({
        "application_id": app_id,
        "status": status,
    }).execute()

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


@jobs_bp.route("/applications/<app_id>/history", methods=["GET"])
def get_application_history(app_id):
    res = (
        supabase_admin.table("application_status_history")
        .select("status, changed_at")
        .eq("application_id", app_id)
        .order("changed_at", desc=False)
        .execute()
    )
    return jsonify(res.data), 200


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

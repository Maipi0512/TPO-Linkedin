import os
import uuid
import bcrypt
import secrets
import random
import smtplib
from email.mime.text import MIMEText
from datetime import datetime, timedelta, timezone

from flask import Blueprint, request, jsonify
from db import supabase, supabase_admin
from db_mongo import get_db
from routes.connections import create_user_node

auth_bp = Blueprint("auth", __name__, url_prefix="/auth")

# Tokens de recuperación en memoria { token: {"user_id": str, "expires_at": datetime} }
_reset_tokens: dict = {}


# ─── Helpers ──────────────────────────────────────────────────────────────────

def get_user_roles(user_id: str) -> list[str]:
    result = (
        supabase_admin.table("user_roles")
        .select("roles(name)")
        .eq("user_id", user_id)
        .execute()
    )
    return [row["roles"]["name"] for row in result.data if row.get("roles")]


def build_user_response(user: dict, roles: list[str]) -> dict:
    return {
        "user_id": user["user_id"],
        "email": user["email"],
        "name": user["name"],
        "surname": user.get("surname"),
        "dni": user.get("dni"),
        "profile_photo_url": user.get("profile_photo_url"),
        "roles": roles,
    }


def send_reset_email(to_email: str, name: str, code: str):
    smtp_host = os.environ.get("SMTP_HOST", "")
    smtp_port = int(os.environ.get("SMTP_PORT", 587))
    smtp_user = os.environ.get("SMTP_USER", "")
    smtp_pass = os.environ.get("SMTP_PASS", "")
    from_email = os.environ.get("SMTP_FROM", smtp_user)

    body = f"""Hola {name},

Recibiste este email porque solicitaste recuperar tu contraseña en LinkPro.

Tu código de verificación es:

    {code}

Ingresalo en la app para crear tu nueva contraseña.
El código es válido por 1 hora y solo puede usarse una vez.

Si no solicitaste esto, ignorá este email.

— El equipo de LinkPro
"""
    msg = MIMEText(body, "plain", "utf-8")
    msg["Subject"] = f"Tu código de recuperación es {code} — LinkPro"
    msg["From"] = from_email
    msg["To"] = to_email

    if not smtp_host or not smtp_user:
        # Sin SMTP configurado: imprime el código en consola (útil en desarrollo)
        print(f"\n{'='*40}")
        print(f"[DEV] Código de recuperación para {to_email}: {code}")
        print(f"{'='*40}\n")
        return

    try:
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.sendmail(from_email, to_email, msg.as_string())
    except Exception as e:
        print(f"[WARN] Email no enviado: {e}")
        print(f"[DEV] Código de recuperación para {to_email}: {code}")


# ─── Endpoints ────────────────────────────────────────────────────────────────

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify({"error": "Email y contraseña son requeridos."}), 400

    result = (
        supabase_admin.table("users")
        .select("user_id, email, name, surname, dni, profile_photo_url, password_hash")
        .eq("email", email)
        .limit(1)
        .execute()
    )

    if not result.data:
        return jsonify({"error": "Email o contraseña incorrectos."}), 401

    user = result.data[0]
    if not bcrypt.checkpw(password.encode("utf-8"), user["password_hash"].encode("utf-8")):
        return jsonify({"error": "Email o contraseña incorrectos."}), 401

    roles = get_user_roles(user["user_id"])
    return jsonify(build_user_response(user, roles)), 200


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    name = (data.get("name") or "").strip()
    surname = (data.get("surname") or "").strip() or None
    dni = (data.get("dni") or "").strip() or None
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    role = data.get("role") or "candidato"
    if role not in ("candidato", "poster"):
        return jsonify({"error": "Rol inválido. Debe ser 'candidato' o 'poster'."}), 400

    if not name or not email or not password:
        return jsonify({"error": "Nombre, email y contraseña son requeridos."}), 400
    if len(password) < 6:
        return jsonify({"error": "La contraseña debe tener al menos 6 caracteres."}), 400

    if supabase_admin.table("users").select("user_id").eq("email", email).limit(1).execute().data:
        return jsonify({"error": "Ya existe una cuenta con ese email."}), 409

    if dni and supabase_admin.table("users").select("user_id").eq("dni", dni).limit(1).execute().data:
        return jsonify({"error": "Ya existe una cuenta con ese DNI."}), 409

    password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    user_id = str(uuid.uuid4())

    insert_result = (
        supabase_admin.table("users")
        .insert({"user_id": user_id, "email": email, "password_hash": password_hash,
                 "name": name, "surname": surname, "dni": dni})
        .execute()
    )
    if not insert_result.data:
        return jsonify({"error": "Error al crear la cuenta."}), 500

    company_name   = (data.get("company_name") or "").strip() or None
    company_slogan = (data.get("company_slogan") or "").strip() or None

    roles_to_assign = {role}  # solo el rol seleccionado, no ambos

    # Auto-seed roles catalog si no existen todavía
    for role_name in roles_to_assign:
        if not supabase_admin.table("roles").select("role_id").eq("name", role_name).limit(1).execute().data:
            supabase_admin.table("roles").insert({"name": role_name}).execute()

    roles_result = (
        supabase_admin.table("roles")
        .select("role_id, name")
        .in_("name", list(roles_to_assign))
        .execute()
    )
    if roles_result.data:
        supabase_admin.table("user_roles").insert(
            [{"user_id": user_id, "role_id": r["role_id"]} for r in roles_result.data]
        ).execute()

    # Crear/buscar empresa si es poster
    company_id = None
    if role == "poster" and company_name:
        existing = supabase_admin.table("companies").select("company_id").ilike("name", company_name).limit(1).execute()
        if existing.data:
            company_id = existing.data[0]["company_id"]
        else:
            company_id = str(uuid.uuid4())
            supabase_admin.table("companies").insert({
                "company_id": company_id,
                "name": company_name,
                "slogan": company_slogan,
            }).execute()

    # Crear nodo Neo4j para este usuario (falla silenciosamente si Neo4j no está configurado)
    create_user_node(user_id, name, surname or "", None)

    actual_roles = get_user_roles(user_id)
    resp = build_user_response(
        {"user_id": user_id, "email": email, "name": name, "surname": surname,
         "dni": dni, "profile_photo_url": None},
        actual_roles,
    )
    if company_id:
        resp["company_id"] = company_id
    return jsonify(resp), 201


@auth_bp.route("/delete-account/<user_id>", methods=["DELETE"])
def delete_account(user_id):
    """Elimina la cuenta y todos sus datos en cascada (ON DELETE CASCADE en SQL)."""
    data = request.get_json() or {}
    password = data.get("password", "")

    user_res = (
        supabase_admin.table("users")
        .select("password_hash")
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    if not user_res.data:
        return jsonify({"error": "Usuario no encontrado."}), 404

    if not bcrypt.checkpw(password.encode("utf-8"), user_res.data[0]["password_hash"].encode("utf-8")):
        return jsonify({"error": "Contraseña incorrecta."}), 401

    # Borrar en orden correcto para evitar FK violations
    # 1. Obtener jobs del poster para borrar sus dependencias
    jobs_res = supabase_admin.table("jobs").select("job_id").eq("poster_user_id", user_id).execute()
    job_ids = [j["job_id"] for j in (jobs_res.data or [])]
    for jid in job_ids:
        supabase_admin.table("applications").delete().eq("job_id", jid).execute()
        supabase_admin.table("job_skill").delete().eq("job_id", jid).execute()

    # 2. Postulaciones del usuario como candidato
    supabase_admin.table("applications").delete().eq("user_id", user_id).execute()

    # 3. Empleos publicados por el usuario
    supabase_admin.table("jobs").delete().eq("poster_user_id", user_id).execute()

    # 4. Datos de perfil
    supabase_admin.table("user_skill").delete().eq("user_id", user_id).execute()
    supabase_admin.table("user_roles").delete().eq("user_id", user_id).execute()
    supabase_admin.table("education").delete().eq("user_id", user_id).execute()
    supabase_admin.table("work experience").delete().eq("user_id", user_id).execute()

    # 5. Grupos
    supabase_admin.table("group_members").delete().eq("user_id", user_id).execute()
    supabase_admin.table("groups").delete().eq("admin_id", user_id).execute()

    # 6. Posts y comentarios en MongoDB
    try:
        mongo_db = get_db()
        mongo_db.posts.delete_many({"user_id": user_id})
        mongo_db.comments.delete_many({"user_id": user_id})
    except Exception as e:
        print(f"[WARN] MongoDB delete user data: {e}")

    # 7. Usuario
    supabase_admin.table("users").delete().eq("user_id", user_id).execute()
    return jsonify({"message": "Cuenta eliminada correctamente."}), 200


@auth_bp.route("/add-role", methods=["POST"])
def add_role():
    data = request.get_json() or {}
    user_id = data.get("user_id", "").strip()
    new_role = data.get("role", "").strip()
    if new_role not in ("candidato", "poster"):
        return jsonify({"error": "Rol inválido. Debe ser 'candidato' o 'poster'."}), 400

    role_res = supabase_admin.table("roles").select("role_id").eq("name", new_role).limit(1).execute()
    if not role_res.data:
        return jsonify({"error": "Rol no encontrado."}), 404
    role_id = role_res.data[0]["role_id"]

    existing = supabase_admin.table("user_roles").select("role_id").eq("user_id", user_id).eq("role_id", role_id).limit(1).execute()
    if existing.data:
        return jsonify({"error": "Ya tenés ese rol asignado."}), 409

    supabase_admin.table("user_roles").insert({"user_id": user_id, "role_id": role_id}).execute()
    roles = get_user_roles(user_id)
    return jsonify({"roles": roles}), 200


@auth_bp.route("/forgot-password", methods=["POST"])
def forgot_password():
    email = (request.get_json().get("email") or "").strip().lower()
    if not email:
        return jsonify({"error": "Email requerido."}), 400

    user_res = (
        supabase_admin.table("users")
        .select("user_id, name")
        .eq("email", email)
        .limit(1)
        .execute()
    )
    # Siempre 200 para no revelar si el email existe
    msg = {"message": "Si el email está registrado, recibirás un enlace de recuperación."}

    if not user_res.data:
        return jsonify(msg), 200

    user = user_res.data[0]
    code = f"{random.SystemRandom().randint(0, 999999):06d}"
    _reset_tokens[code] = {
        "user_id": user["user_id"],
        "expires_at": datetime.now(timezone.utc) + timedelta(hours=1),
    }

    send_reset_email(email, user["name"], code)

    return jsonify({"message": "Código generado correctamente.", "code": code}), 200


@auth_bp.route("/reset-password", methods=["POST"])
def reset_password():
    data = request.get_json()
    token = data.get("token", "").strip()
    password = data.get("password", "")

    if not token or not password or len(password) < 6:
        return jsonify({"error": "Token y contraseña (mín. 6 caracteres) requeridos."}), 400

    token_data = _reset_tokens.get(token)
    if not token_data:
        return jsonify({"error": "Token inválido o ya utilizado."}), 400

    if token_data["expires_at"] < datetime.now(timezone.utc):
        del _reset_tokens[token]
        return jsonify({"error": "El código expiró. Solicitá uno nuevo."}), 400

    new_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    supabase_admin.table("users").update({"password_hash": new_hash}).eq("user_id", token_data["user_id"]).execute()
    del _reset_tokens[token]

    return jsonify({"message": "Contraseña actualizada correctamente."}), 200

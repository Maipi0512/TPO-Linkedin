import os
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

from routes.auth import auth_bp
from routes.profile import profile_bp
from routes.jobs import jobs_bp
from routes.posts import posts_bp
from routes.notifications import notifications_bp
from routes.groups import groups_bp
from routes.connections import connections_bp
from routes.messages import messages_bp
from init_db import init_db
from db_neo4j import neo4j_available, get_driver
from db import supabase_admin

app = Flask(__name__)
CORS(app,
     origins=["http://localhost:5173", "http://127.0.0.1:5173"],
     methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization"],
     supports_credentials=False)

app.register_blueprint(auth_bp)
app.register_blueprint(profile_bp)
app.register_blueprint(jobs_bp)
app.register_blueprint(posts_bp)
app.register_blueprint(notifications_bp)
app.register_blueprint(groups_bp)
app.register_blueprint(connections_bp)
app.register_blueprint(messages_bp)

# Crea las tablas SQL en Supabase al arrancar si no existen
init_db()


def sync_neo4j_users():
    """Al arrancar, sincroniza usuarios de Supabase con Neo4j y elimina nodos huérfanos."""
    if not neo4j_available():
        return
    try:
        users_res = supabase_admin.table("users").select("user_id, name, surname, profile_photo_url").execute()
        all_users = {u["user_id"]: u for u in (users_res.data or [])}

        driver = get_driver()
        with driver.session() as session:
            # Nodos existentes en Neo4j
            neo4j_ids = {r["uid"] for r in session.run("MATCH (u:User) RETURN u.user_id AS uid")}

            # Eliminar huérfanos (nodo en Neo4j pero no en Supabase)
            orphaned = [uid for uid in neo4j_ids if uid and uid not in all_users]
            for uid in orphaned:
                session.run("MATCH (u:User {user_id: $uid}) DETACH DELETE u", uid=uid)
            if orphaned:
                print(f"[INFO] Neo4j: eliminados {len(orphaned)} nodos huérfanos.")

            # Crear nodos faltantes (usuario en Supabase pero sin nodo en Neo4j)
            missing = [u for uid, u in all_users.items() if uid not in neo4j_ids]
            for u in missing:
                session.run(
                    "MERGE (n:User {user_id: $uid}) "
                    "SET n.name = $name, n.surname = $surname, n.photo_url = $photo",
                    uid=u["user_id"],
                    name=u.get("name") or "",
                    surname=u.get("surname") or "",
                    photo=u.get("profile_photo_url") or "",
                )
            if missing:
                print(f"[INFO] Neo4j: creados {len(missing)} nodos de usuarios faltantes.")

            # Sincronizar habilidades de los usuarios faltantes
            if missing:
                missing_ids = [u["user_id"] for u in missing]
                skills_res = (
                    supabase_admin.table("user_skill")
                    .select("user_id, level, skills(name)")
                    .in_("user_id", missing_ids)
                    .execute()
                )
                for row in (skills_res.data or []):
                    skill_name = (row.get("skills") or {}).get("name")
                    if not skill_name:
                        continue
                    session.run(
                        "MERGE (u:User {user_id: $uid}) "
                        "MERGE (s:Skill {name: $name}) "
                        "MERGE (u)-[r:HAS_SKILL]->(s) "
                        "SET r.level = $level",
                        uid=row["user_id"],
                        name=skill_name,
                        level=row.get("level") or "Principiante",
                    )
                if skills_res.data:
                    print(f"[INFO] Neo4j: sincronizadas {len(skills_res.data)} habilidades.")
    except Exception as e:
        print(f"[WARN] Neo4j sync: {e}")


sync_neo4j_users()


@app.route("/admin/sync-neo4j")
def manual_sync_neo4j():
    """Fuerza la sincronización de todos los usuarios de Supabase a Neo4j."""
    if not neo4j_available():
        return jsonify({"error": "Neo4j no configurado"}), 503
    try:
        users_res = supabase_admin.table("users").select("user_id, name, surname, profile_photo_url").execute()
        all_users = {u["user_id"]: u for u in (users_res.data or [])}
        driver = get_driver()
        created = 0
        skills_synced = 0
        deleted = 0
        with driver.session() as session:
            neo4j_ids = {r["uid"] for r in session.run("MATCH (u:User) RETURN u.user_id AS uid")}

            # Borrar nodos de usuarios que ya no existen en Supabase
            orphaned = [uid for uid in neo4j_ids if uid and uid not in all_users]
            for uid in orphaned:
                session.run("MATCH (u:User {user_id: $uid}) DETACH DELETE u", uid=uid)
                deleted += 1

            # Crear nodos faltantes
            missing = [u for uid, u in all_users.items() if uid not in neo4j_ids]
            for u in missing:
                session.run(
                    "MERGE (n:User {user_id: $uid}) "
                    "SET n.name = $name, n.surname = $surname, n.photo_url = $photo",
                    uid=u["user_id"], name=u.get("name") or "",
                    surname=u.get("surname") or "", photo=u.get("profile_photo_url") or "",
                )
                created += 1

            # Sincronizar habilidades de todos los usuarios
            skills_res = supabase_admin.table("user_skill").select("user_id, level, skills(name)").execute()
            for row in (skills_res.data or []):
                skill_name = (row.get("skills") or {}).get("name")
                if not skill_name:
                    continue
                session.run(
                    "MERGE (u:User {user_id: $uid}) "
                    "MERGE (s:Skill {name: $name}) "
                    "MERGE (u)-[r:HAS_SKILL]->(s) SET r.level = $level",
                    uid=row["user_id"], name=skill_name, level=row.get("level") or "Principiante",
                )
                skills_synced += 1

        return jsonify({
            "ok": True,
            "usuarios_eliminados": deleted,
            "usuarios_creados": created,
            "habilidades_sincronizadas": skills_synced,
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/health")
def health():
    """RNF4: Endpoint de disponibilidad con chequeo real de cada servicio."""
    status = {"status": "ok", "services": {}}

    # Supabase (SQL)
    try:
        supabase_admin.table("users").select("user_id").limit(1).execute()
        status["services"]["supabase"] = "ok"
    except Exception as e:
        status["services"]["supabase"] = f"error: {str(e)[:80]}"
        status["status"] = "degraded"

    # MongoDB
    try:
        from db_mongo import get_db as _mongo
        _mongo().command("ping")
        status["services"]["mongodb"] = "ok"
    except Exception as e:
        status["services"]["mongodb"] = f"error: {str(e)[:80]}"
        status["status"] = "degraded"

    # Neo4j
    try:
        if neo4j_available():
            get_driver().verify_connectivity()
            status["services"]["neo4j"] = "ok"
        else:
            status["services"]["neo4j"] = "not_configured"
    except Exception as e:
        status["services"]["neo4j"] = f"error: {str(e)[:80]}"
        status["status"] = "degraded"

    # Cassandra / AstraDB
    try:
        from db_cassandra import cassandra_available, get_db as _cass
        if cassandra_available():
            _cass()
            status["services"]["cassandra"] = "ok"
        else:
            status["services"]["cassandra"] = "not_configured"
    except Exception as e:
        status["services"]["cassandra"] = f"error: {str(e)[:80]}"
        status["status"] = "degraded"

    code = 200 if status["status"] == "ok" else 503
    return jsonify(status), code


@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    return response


if __name__ == "__main__":
    app.run(debug=True, port=5000)

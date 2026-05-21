from flask import Blueprint, request, jsonify
from db_neo4j import get_driver, neo4j_available
from db import supabase_admin

connections_bp = Blueprint("connections", __name__, url_prefix="/connections")


def _stub():
    return jsonify({"error": "Neo4j no configurado. Agrega NEO4J_URI y NEO4J_PASSWORD al .env"}), 503


# ─── Helpers de sesión internos ───────────────────────────────────────────────

def _ensure_user_node(tx, user_id: str, name: str, surname: str, photo_url: str | None):
    tx.run(
        "MERGE (u:User {user_id: $uid}) "
        "SET u.name = $name, u.surname = $surname, u.photo_url = $photo_url",
        uid=user_id, name=name, surname=surname or "", photo_url=photo_url or ""
    )


def _ensure_skill_node(tx, skill_name: str):
    tx.run("MERGE (:Skill {name: $name})", name=skill_name)


# ─── Funciones públicas (importadas desde auth.py, profile.py, jobs.py) ──────

def create_user_node(user_id: str, name: str, surname: str, photo_url: str | None = None):
    """Crea o actualiza el nodo :User en Neo4j. Llamado al registrarse."""
    if not neo4j_available():
        return
    try:
        driver = get_driver()
        with driver.session() as session:
            session.execute_write(_ensure_user_node, user_id, name, surname, photo_url)
    except Exception as e:
        print(f"[WARN] Neo4j create_user_node: {e}")


def add_user_skill(user_id: str, skill_name: str, level: str = "Principiante"):
    """Crea relación [:HAS_SKILL] entre :User y :Skill. Llamado al agregar skill."""
    if not neo4j_available():
        return
    try:
        driver = get_driver()
        with driver.session() as session:
            session.run(
                "MERGE (s:Skill {name: $name}) "
                "WITH s "
                "MATCH (u:User {user_id: $uid}) "
                "MERGE (u)-[r:HAS_SKILL]->(s) "
                "SET r.level = $level",
                name=skill_name, uid=user_id, level=level
            )
    except Exception as e:
        print(f"[WARN] Neo4j add_user_skill: {e}")


def remove_user_skill(user_id: str, skill_name: str):
    """Elimina relación [:HAS_SKILL] entre :User y :Skill. Llamado al quitar skill."""
    if not neo4j_available():
        return
    try:
        driver = get_driver()
        with driver.session() as session:
            session.run(
                "MATCH (u:User {user_id: $uid})-[r:HAS_SKILL]->(s:Skill {name: $name}) DELETE r",
                uid=user_id, name=skill_name
            )
    except Exception as e:
        print(f"[WARN] Neo4j remove_user_skill: {e}")


def create_job_node(job_id: str, skill_names: list[str]):
    """Crea nodo :Job y relaciones [:REQUIRES_SKILL]. Llamado al crear empleo."""
    if not neo4j_available():
        return
    try:
        driver = get_driver()
        with driver.session() as session:
            session.run("MERGE (:Job {job_id: $jid})", jid=job_id)
            for skill_name in skill_names:
                if not skill_name.strip():
                    continue
                session.run(
                    "MERGE (s:Skill {name: $name}) "
                    "WITH s "
                    "MATCH (j:Job {job_id: $jid}) "
                    "MERGE (j)-[:REQUIRES_SKILL]->(s)",
                    name=skill_name.strip(), jid=job_id
                )
    except Exception as e:
        print(f"[WARN] Neo4j create_job_node: {e}")


def delete_job_node(job_id: str):
    """Elimina nodo :Job y todas sus relaciones. Llamado al borrar empleo."""
    if not neo4j_available():
        return
    try:
        driver = get_driver()
        with driver.session() as session:
            session.run(
                "MATCH (j:Job {job_id: $jid}) DETACH DELETE j",
                jid=job_id
            )
    except Exception as e:
        print(f"[WARN] Neo4j delete_job_node: {e}")


# ─── Endpoints de la API ──────────────────────────────────────────────────────

@connections_bp.route("/users", methods=["GET"])
def list_users():
    """Lista todos los usuarios de Neo4j (para discovery)."""
    if not neo4j_available():
        return jsonify([]), 200
    requester = request.args.get("user_id", "")
    driver = get_driver()
    with driver.session() as session:
        result = session.run(
            "MATCH (u:User) WHERE u.user_id <> $uid RETURN u",
            uid=requester
        )
        users = [dict(r["u"]) for r in result]
    return jsonify(users), 200


@connections_bp.route("/<user_id>", methods=["GET"])
def get_connections(user_id):
    """Retorna las conexiones confirmadas de un usuario."""
    if not neo4j_available():
        return jsonify([]), 200
    driver = get_driver()
    with driver.session() as session:
        result = session.run(
            "MATCH (u:User {user_id: $uid})-[:CONNECTED_WITH]->(c:User) RETURN c",
            uid=user_id
        )
        connections = [dict(r["c"]) for r in result]
    return jsonify(connections), 200


@connections_bp.route("/<user_id>/pending", methods=["GET"])
def get_pending(user_id):
    """Solicitudes de conexión recibidas pendientes de aceptar."""
    if not neo4j_available():
        return jsonify([]), 200
    driver = get_driver()
    with driver.session() as session:
        result = session.run(
            "MATCH (sender:User)-[r:PENDING_REQUEST]->(u:User {user_id: $uid}) "
            "RETURN sender, r.created_at AS created_at",
            uid=user_id
        )
        pending = [{"user": dict(r["sender"]), "created_at": str(r["created_at"])} for r in result]
    return jsonify(pending), 200


@connections_bp.route("/<user_id>/sent", methods=["GET"])
def get_sent(user_id):
    """Solicitudes enviadas que aún no fueron aceptadas."""
    if not neo4j_available():
        return jsonify([]), 200
    driver = get_driver()
    with driver.session() as session:
        result = session.run(
            "MATCH (u:User {user_id: $uid})-[:PENDING_REQUEST]->(target:User) RETURN target",
            uid=user_id
        )
        sent = [dict(r["target"]) for r in result]
    return jsonify(sent), 200


@connections_bp.route("/<user_id>/suggestions", methods=["GET"])
def get_suggestions(user_id):
    """
    Personas que quizás conozcas:
    1) Amigos-de-amigos (2do grado) ordenados por contactos en común.
    2) Si no hay suficientes, usuarios sin conexión directa.
    """
    if not neo4j_available():
        return jsonify([]), 200
    driver = get_driver()

    with driver.session() as session:
        result = session.run(
            "MATCH (u:User {user_id: $uid})-[:CONNECTED_WITH]->(:User)-[:CONNECTED_WITH]->(s:User) "
            "WHERE s.user_id <> $uid "
            "  AND NOT (u)-[:CONNECTED_WITH]->(s) "
            "  AND NOT (u)-[:PENDING_REQUEST]->(s) "
            "  AND NOT (s)-[:PENDING_REQUEST]->(u) "
            "RETURN DISTINCT s, count(*) AS mutuals "
            "ORDER BY mutuals DESC LIMIT 10",
            uid=user_id
        )
        suggestions = [{"user": dict(r["s"]), "mutuals": r["mutuals"]} for r in result]

    # Sugerencias por empresa compartida (SQL)
    already_suggested = {s["user"]["user_id"] for s in suggestions}
    try:
        # Obtener empresas donde trabajó el usuario
        we_res = supabase_admin.table("work experience").select("company_id").eq("user_id", user_id).execute()
        company_ids = list({row["company_id"] for row in (we_res.data or []) if row.get("company_id")})

        if company_ids:
            # Otros usuarios que trabajaron en esas empresas
            coworkers_res = (
                supabase_admin.table("work experience")
                .select("user_id, users(user_id, name, surname, profile_photo_url)")
                .in_("company_id", company_ids)
                .neq("user_id", user_id)
                .execute()
            )
            seen = set()
            for row in (coworkers_res.data or []):
                u = row.get("users")
                if not u or u["user_id"] in already_suggested or u["user_id"] in seen:
                    continue
                seen.add(u["user_id"])
                suggestions.append({
                    "user": {
                        "user_id": u["user_id"],
                        "name": u["name"],
                        "surname": u.get("surname") or "",
                        "photo_url": u.get("profile_photo_url") or "",
                    },
                    "mutuals": 0,
                    "reason": "misma empresa"
                })
    except Exception as e:
        print(f"[WARN] Sugerencias por empresa: {e}")

    # Si aún no hay sugerencias, traer cualquier usuario sin conexión de Neo4j
    if not suggestions:
        with driver.session() as session:
            result = session.run(
                "MATCH (u:User {user_id: $uid}), (s:User) "
                "WHERE s.user_id <> $uid "
                "  AND NOT (u)-[:CONNECTED_WITH]->(s) "
                "  AND NOT (u)-[:PENDING_REQUEST]->(s) "
                "  AND NOT (s)-[:PENDING_REQUEST]->(u) "
                "RETURN s, 0 AS mutuals LIMIT 10",
                uid=user_id
            )
            suggestions = [{"user": dict(r["s"]), "mutuals": r["mutuals"]} for r in result]

    return jsonify(suggestions), 200


@connections_bp.route("/<user_id>/job-matches", methods=["GET"])
def job_matches(user_id):
    """
    Empleos que hacen match con las habilidades del usuario en Neo4j.
    Retorna job_id y la lista de skills que coinciden, ordenado por cantidad de matches.
    """
    if not neo4j_available():
        return jsonify([]), 200
    driver = get_driver()
    with driver.session() as session:
        result = session.run(
            "MATCH (u:User {user_id: $uid})-[:HAS_SKILL]->(s:Skill)<-[:REQUIRES_SKILL]-(j:Job) "
            "RETURN j.job_id AS job_id, collect(s.name) AS matching_skills, count(s) AS match_count "
            "ORDER BY match_count DESC LIMIT 20",
            uid=user_id
        )
        matches = [
            {
                "job_id": r["job_id"],
                "matching_skills": list(r["matching_skills"]),
                "match_count": r["match_count"],
            }
            for r in result
        ]
    return jsonify(matches), 200


@connections_bp.route("/request", methods=["POST"])
def send_request():
    """Envía solicitud de conexión de from_user_id a to_user_id."""
    if not neo4j_available():
        return _stub()
    data = request.get_json() or {}
    from_id = data.get("from_user_id", "").strip()
    to_id = data.get("to_user_id", "").strip()
    if not from_id or not to_id or from_id == to_id:
        return jsonify({"error": "from_user_id y to_user_id requeridos y distintos."}), 400

    driver = get_driver()
    with driver.session() as session:
        exists = session.run(
            "MATCH (a:User {user_id: $from})-[r:PENDING_REQUEST|CONNECTED_WITH]->(b:User {user_id: $to}) "
            "RETURN r LIMIT 1",
            {"from": from_id, "to": to_id}
        ).single()
        if exists:
            return jsonify({"error": "Ya existe una solicitud o conexión entre estos usuarios."}), 409

        session.run(
            "MATCH (a:User {user_id: $from}), (b:User {user_id: $to}) "
            "CREATE (a)-[:PENDING_REQUEST {created_at: datetime()}]->(b)",
            {"from": from_id, "to": to_id}
        )
    return jsonify({"ok": True}), 201


@connections_bp.route("/accept", methods=["PUT"])
def accept_request():
    """Acepta solicitud: elimina PENDING_REQUEST y crea CONNECTED_WITH en ambas direcciones."""
    if not neo4j_available():
        return _stub()
    data = request.get_json() or {}
    from_id = data.get("from_user_id", "").strip()
    to_id = data.get("to_user_id", "").strip()
    if not from_id or not to_id:
        return jsonify({"error": "from_user_id y to_user_id requeridos."}), 400

    driver = get_driver()
    with driver.session() as session:
        result = session.run(
            "MATCH (a:User {user_id: $from})-[r:PENDING_REQUEST]->(b:User {user_id: $to}) "
            "DELETE r "
            "CREATE (a)-[:CONNECTED_WITH {since: datetime()}]->(b) "
            "CREATE (b)-[:CONNECTED_WITH {since: datetime()}]->(a) "
            "RETURN a",
            {"from": from_id, "to": to_id}
        ).single()
    if not result:
        return jsonify({"error": "No existe esa solicitud pendiente."}), 404
    return jsonify({"ok": True}), 200


@connections_bp.route("/reject", methods=["DELETE"])
def reject_request():
    """Rechaza o cancela una solicitud pendiente."""
    if not neo4j_available():
        return _stub()
    data = request.get_json() or {}
    from_id = data.get("from_user_id", "").strip()
    to_id = data.get("to_user_id", "").strip()
    if not from_id or not to_id:
        return jsonify({"error": "from_user_id y to_user_id requeridos."}), 400

    driver = get_driver()
    with driver.session() as session:
        session.run(
            "MATCH (a:User {user_id: $from})-[r:PENDING_REQUEST]->(b:User {user_id: $to}) DELETE r",
            {"from": from_id, "to": to_id}
        )
    return jsonify({"ok": True}), 200


@connections_bp.route("/remove", methods=["DELETE"])
def remove_connection():
    """Elimina conexión existente en ambas direcciones."""
    if not neo4j_available():
        return _stub()
    data = request.get_json() or {}
    user_id = data.get("user_id", "").strip()
    other_id = data.get("other_user_id", "").strip()
    if not user_id or not other_id:
        return jsonify({"error": "user_id y other_user_id requeridos."}), 400

    driver = get_driver()
    with driver.session() as session:
        session.run(
            "MATCH (a:User {user_id: $uid})-[r:CONNECTED_WITH]-(b:User {user_id: $oid}) DELETE r",
            {"uid": user_id, "oid": other_id}
        )
    return jsonify({"ok": True}), 200

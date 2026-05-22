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


def cleanup_neo4j_orphans():
    """Al arrancar, elimina nodos de Neo4j que ya no tienen usuario en Supabase."""
    if not neo4j_available():
        return
    try:
        users_res = supabase_admin.table("users").select("user_id").execute()
        valid_ids = {u["user_id"] for u in (users_res.data or [])}
        driver = get_driver()
        with driver.session() as session:
            result = session.run("MATCH (u:User) RETURN u.user_id AS uid")
            neo4j_ids = [r["uid"] for r in result]
            orphaned = [uid for uid in neo4j_ids if uid and uid not in valid_ids]
            for uid in orphaned:
                session.run("MATCH (u:User {user_id: $uid}) DETACH DELETE u", uid=uid)
        if orphaned:
            print(f"[INFO] Neo4j: eliminados {len(orphaned)} nodos huérfanos.")
    except Exception as e:
        print(f"[WARN] Neo4j cleanup: {e}")


cleanup_neo4j_orphans()


@app.route("/health")
def health():
    return jsonify({"status": "ok"}), 200


@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    return response


if __name__ == "__main__":
    app.run(debug=True, port=5000)

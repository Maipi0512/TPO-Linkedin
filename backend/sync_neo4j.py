"""
Sincroniza usuarios, skills y empleos existentes en SQL hacia Neo4j.
Ejecutar una sola vez desde la carpeta backend:
    python sync_neo4j.py
"""
import os
from dotenv import load_dotenv
load_dotenv(override=True)

from db import supabase_admin
from routes.connections import create_user_node, add_user_skill, create_job_node

print("=== Sincronizando SQL → Neo4j ===\n")

# ── Usuarios ──────────────────────────────────────────────────────
users_res = supabase_admin.table("users").select("user_id, name, surname, profile_photo_url").execute()
users = users_res.data or []
print(f"Usuarios encontrados: {len(users)}")
for u in users:
    create_user_node(u["user_id"], u["name"], u.get("surname") or "", u.get("profile_photo_url"))
    print(f"  ✓ :User → {u['name']} {u.get('surname') or ''}")

# ── Skills por usuario ────────────────────────────────────────────
print(f"\nSincronizando skills de usuarios...")
for u in users:
    skills_res = supabase_admin.table("user_skill").select("level, skills(name)").eq("user_id", u["user_id"]).execute()
    for row in (skills_res.data or []):
        skill_name = (row.get("skills") or {}).get("name")
        if skill_name:
            add_user_skill(u["user_id"], skill_name, row.get("level") or "Principiante")
            print(f"  ✓ {u['name']} -[:HAS_SKILL]-> {skill_name}")

# ── Empleos ───────────────────────────────────────────────────────
jobs_res = supabase_admin.table("jobs").select("job_id, job_skill(skills(name))").execute()
jobs = jobs_res.data or []
print(f"\nEmpleos encontrados: {len(jobs)}")
for j in jobs:
    skill_names = [row["skills"]["name"] for row in (j.get("job_skill") or []) if row.get("skills")]
    create_job_node(j["job_id"], skill_names)
    print(f"  ✓ :Job {j['job_id'][:8]}... -[:REQUIRES_SKILL]-> {skill_names}")

print("\n=== Sincronización completa ===")
print("Verificá en AuraDB: MATCH (n) RETURN labels(n), count(n);")

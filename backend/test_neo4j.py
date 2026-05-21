"""
Ejecutar desde la carpeta backend:
    python test_neo4j.py
"""
import os
from dotenv import load_dotenv

load_dotenv(override=True)

user     = os.environ.get("NEO4J_USER", "neo4j")
password = os.environ.get("NEO4J_PASSWORD", "")
base     = os.environ.get("NEO4J_URI", "").replace("neo4j+s://", "").replace("neo4j+ssc://", "").replace("bolt+s://", "").replace("neo4j://", "").replace("bolt://", "")

print(f"Host detectado: {base}")
print(f"User: {user}")
print(f"Password cargada: {'SI' if password else 'NO'}\n")

if not base or not password:
    print("ERROR: NEO4J_URI o NEO4J_PASSWORD no están en el .env")
    exit(1)

from neo4j import GraphDatabase

uris_to_try = [
    f"neo4j+s://{base}",
    f"bolt+s://{base}",
    f"neo4j+ssc://{base}",
    f"bolt+ssc://{base}",
]

driver = None
for u in uris_to_try:
    try:
        print(f"Probando: {u}")
        d = GraphDatabase.driver(u, auth=(user, password))
        d.verify_connectivity()
        driver = d
        print(f"✓ Conexión exitosa con: {u}\n")
        if not os.environ.get("NEO4J_URI", "").startswith(u.split("://")[0]):
            print(f"  → Actualizá NEO4J_URI en el .env a: {u}")
        break
    except Exception as e:
        print(f"  ✗ {type(e).__name__}: {e}\n")

if not driver:
    print("Ninguna URI funcionó.")
    print("Verificá que la instancia esté RUNNING en AuraDB y que el puerto 7687 no esté bloqueado.")
    exit(1)

with driver.session() as session:
    constraints = session.run("SHOW CONSTRAINTS").data()
    print(f"Constraints ({len(constraints)}):")
    for c in constraints:
        print(f"  - {c.get('name')} → {c.get('labelsOrTypes')} :: {c.get('properties')}")

driver.close()
print("\nNeo4j configurado correctamente.")

"""
Elimina TODOS los nodos y relaciones de Neo4j en lotes (evita timeout).
Ejecutar desde la carpeta backend:
    python clear_neo4j.py
"""
from dotenv import load_dotenv
load_dotenv(override=True)

from db_neo4j import get_driver, neo4j_available

if not neo4j_available():
    print("[ERROR] NEO4J_URI o NEO4J_PASSWORD no configurados en .env")
    exit(1)

print("=== Limpiando Neo4j ===")
confirm = input("¿Confirmar borrado de TODOS los nodos? (escribí 'si'): ").strip().lower()
if confirm != "si":
    print("Operación cancelada.")
    exit(0)

driver = get_driver()
total_nodes = 0
total_rels = 0

with driver.session() as session:
    # Borrado en lotes de 1000 para evitar timeout en AuraDB
    while True:
        result = session.run(
            "MATCH (n) WITH n LIMIT 1000 DETACH DELETE n RETURN count(n) AS deleted"
        )
        deleted = result.single()["deleted"]
        total_nodes += deleted
        print(f"  Eliminados {total_nodes} nodos hasta ahora...")
        if deleted == 0:
            break

print(f"\n✓ Total nodos eliminados: {total_nodes}")
print("Verificá en AuraDB: MATCH (n) RETURN count(n);")
print("Para repoblar desde SQL: python sync_neo4j.py")

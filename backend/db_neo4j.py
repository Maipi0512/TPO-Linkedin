import os
from neo4j import GraphDatabase

_driver = None


def _init_indexes(session):
    """Crea índices y restricciones para acelerar las consultas de grafo (RNF1, RNF3)."""
    session.run(
        "CREATE CONSTRAINT user_id_unique IF NOT EXISTS "
        "FOR (u:User) REQUIRE u.user_id IS UNIQUE"
    )
    session.run(
        "CREATE CONSTRAINT job_id_unique IF NOT EXISTS "
        "FOR (j:Job) REQUIRE j.job_id IS UNIQUE"
    )
    session.run(
        "CREATE INDEX skill_name_idx IF NOT EXISTS "
        "FOR (s:Skill) ON (s.name)"
    )



def get_driver():
    global _driver
    if _driver is None:
        uri = os.environ.get("NEO4J_URI", "")
        user = os.environ.get("NEO4J_USER", "neo4j")
        password = os.environ.get("NEO4J_PASSWORD", "")
        if not uri or not password:
            raise RuntimeError("NEO4J_URI y NEO4J_PASSWORD no configurados en .env")
        uri = uri.replace("neo4j+s://", "neo4j+ssc://").replace("bolt+s://", "bolt+ssc://")
        _driver = GraphDatabase.driver(uri, auth=(user, password))
        try:
            with _driver.session() as s:
                _init_indexes(s)
        except Exception as e:
            print(f"[WARN] Neo4j index init: {e}")
    return _driver


def close_driver():
    global _driver
    if _driver:
        _driver.close()
        _driver = None


def neo4j_available():
    """Retorna True si Neo4j está configurado en el entorno."""
    return bool(os.environ.get("NEO4J_URI") and os.environ.get("NEO4J_PASSWORD"))

import os
from astrapy import DataAPIClient

_db = None


def cassandra_available() -> bool:
    return bool(os.environ.get("ASTRA_TOKEN") and os.environ.get("ASTRA_ENDPOINT"))


def get_db():
    global _db
    if _db is None:
        token = os.environ.get("ASTRA_TOKEN", "")
        endpoint = os.environ.get("ASTRA_ENDPOINT", "")
        if not token or not endpoint:
            raise RuntimeError("ASTRA_TOKEN y ASTRA_ENDPOINT no configurados en .env")
        client = DataAPIClient(token)
        _db = client.get_database(endpoint)
    return _db


def get_collection(name: str):
    """Devuelve la colección, creándola solo si no existe."""
    db = get_db()
    existing = {c.name for c in db.list_collections()}
    if name not in existing:
        return db.create_collection(name)
    return db.get_collection(name)

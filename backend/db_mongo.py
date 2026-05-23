import os
from pymongo import MongoClient, ASCENDING, DESCENDING

_client = None
_db = None


def get_db():
    global _client, _db
    if _db is None:
        uri = os.environ.get("MONGO_URI", "")
        if not uri:
            raise RuntimeError("MONGO_URI no configurado en .env")
        _client = MongoClient(
            uri,
            serverSelectionTimeoutMS=8000,
            connectTimeoutMS=8000,
            socketTimeoutMS=8000,
            tls=True,
            tlsAllowInvalidCertificates=True,
        )
        db_name = os.environ.get("MONGO_DB", "linkpro")
        _db = _client[db_name]
        _init_collections(_db)
    return _db


def _init_collections(db):
    """Crea las colecciones e índices de MongoDB si no existen."""

    # ── posts ──────────────────────────────────────────────────
    if "posts" not in db.list_collection_names():
        db.create_collection("posts")

    db.posts.create_index([("created_at", DESCENDING)], name="idx_posts_date")
    db.posts.create_index([("user_id", ASCENDING), ("created_at", DESCENDING)], name="idx_posts_user_date")
    db.posts.create_index([("tags", ASCENDING)], name="idx_posts_tags")
    db.posts.create_index(
        [("group_id", ASCENDING), ("created_at", DESCENDING)],
        name="idx_posts_group_date", sparse=True
    )

    # ── likes ──────────────────────────────────────────────────
    if "likes" not in db.list_collection_names():
        db.create_collection("likes")

    db.likes.create_index(
        [("post_id", ASCENDING), ("user_id", ASCENDING)],
        unique=True,
        name="idx_likes_post_user"
    )
    db.likes.create_index([("user_id", ASCENDING)], name="idx_likes_user")

    # ── comments ───────────────────────────────────────────────
    if "comments" not in db.list_collection_names():
        db.create_collection("comments")

    db.comments.create_index(
        [("post_id", ASCENDING), ("created_at", ASCENDING)],
        name="idx_comments_post_date"
    )
    db.comments.create_index([("user_id", ASCENDING)], name="idx_comments_user")

    # notifications → Cassandra (pendiente)

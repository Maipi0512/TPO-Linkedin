from datetime import datetime, timezone
from bson import ObjectId
from flask import Blueprint, request, jsonify
from db_mongo import get_db

posts_bp = Blueprint("posts", __name__, url_prefix="/posts")


def serialize_post(doc):
    doc = dict(doc)
    doc["_id"] = str(doc["_id"])
    if isinstance(doc.get("created_at"), datetime):
        doc["created_at"] = doc["created_at"].isoformat()
    if isinstance(doc.get("updated_at"), datetime):
        doc["updated_at"] = doc["updated_at"].isoformat()
    return doc


def serialize_comment(doc):
    doc = dict(doc)
    doc["_id"] = str(doc["_id"])
    doc["post_id"] = str(doc["post_id"])
    if isinstance(doc.get("created_at"), datetime):
        doc["created_at"] = doc["created_at"].isoformat()
    return doc


# ── Posts ─────────────────────────────────────────────────────────────────────

@posts_bp.route("", methods=["GET"])
def list_posts():
    db = get_db()
    user_id = request.args.get("user_id", "")

    pipeline = [
        {"$sort": {"created_at": -1}},
        {"$limit": 50},
        {
            "$lookup": {
                "from": "likes",
                "localField": "_id",
                "foreignField": "post_id",
                "as": "likes_list",
            }
        },
        {
            "$lookup": {
                "from": "comments",
                "localField": "_id",
                "foreignField": "post_id",
                "as": "comments_list",
                "pipeline": [{"$sort": {"created_at": 1}}],
            }
        },
        {
            "$addFields": {
                "likes_count": {"$size": "$likes_list"},
                "comments_count": {"$size": "$comments_list"},
                "user_liked": {
                    "$in": [user_id, "$likes_list.user_id"]
                } if user_id else False,
            }
        },
        {"$project": {"likes_list": 0}},
    ]

    docs = list(db.posts.aggregate(pipeline))

    result = []
    for doc in docs:
        doc = serialize_post(doc)
        comments = []
        for c in doc.pop("comments_list", []):
            c = dict(c)
            c["_id"] = str(c["_id"])
            c["post_id"] = str(c["post_id"])
            if isinstance(c.get("created_at"), datetime):
                c["created_at"] = c["created_at"].isoformat()
            comments.append(c)
        doc["comments"] = comments
        result.append(doc)

    return jsonify(result), 200


@posts_bp.route("", methods=["POST"])
def create_post():
    data = request.get_json()
    user_id = data.get("user_id")
    content = (data.get("content") or "").strip()
    if not user_id or not content:
        return jsonify({"error": "user_id y content son requeridos."}), 400

    db = get_db()
    now = datetime.now(timezone.utc)
    doc = {
        "user_id": user_id,
        "author_name": data.get("author_name", ""),
        "author_surname": data.get("author_surname") or "",
        "author_photo_url": data.get("author_photo_url") or None,
        "content": content,
        "media": data.get("media") or None,
        "tags": [t.strip().lstrip("#") for t in (data.get("tags") or []) if t.strip()],
        "created_at": now,
        "updated_at": now,
    }
    result = db.posts.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    doc["created_at"] = now.isoformat()
    doc["updated_at"] = now.isoformat()
    doc["likes_count"] = 0
    doc["comments_count"] = 0
    doc["user_liked"] = False
    doc["comments"] = []
    return jsonify(doc), 201


@posts_bp.route("/<post_id>", methods=["DELETE"])
def delete_post(post_id):
    data = request.get_json() or {}
    user_id = data.get("user_id")
    try:
        oid = ObjectId(post_id)
    except Exception:
        return jsonify({"error": "post_id inválido."}), 400

    db = get_db()
    post = db.posts.find_one({"_id": oid})
    if not post:
        return jsonify({"error": "Post no encontrado."}), 404
    if post["user_id"] != user_id:
        return jsonify({"error": "No tenés permiso para eliminar este post."}), 403

    db.posts.delete_one({"_id": oid})
    db.likes.delete_many({"post_id": oid})
    db.comments.delete_many({"post_id": oid})
    return jsonify({"ok": True}), 200


# ── Likes ─────────────────────────────────────────────────────────────────────

@posts_bp.route("/<post_id>/like", methods=["POST"])
def toggle_like(post_id):
    data = request.get_json()
    user_id = data.get("user_id")
    if not user_id:
        return jsonify({"error": "user_id requerido."}), 400

    try:
        oid = ObjectId(post_id)
    except Exception:
        return jsonify({"error": "post_id inválido."}), 400

    db = get_db()
    existing = db.likes.find_one({"post_id": oid, "user_id": user_id})
    if existing:
        db.likes.delete_one({"_id": existing["_id"]})
        user_liked = False
    else:
        db.likes.insert_one({
            "post_id": oid,
            "user_id": user_id,
            "created_at": datetime.now(timezone.utc),
        })
        user_liked = True

    likes_count = db.likes.count_documents({"post_id": oid})
    return jsonify({"likes_count": likes_count, "user_liked": user_liked}), 200


# ── Comments ──────────────────────────────────────────────────────────────────

@posts_bp.route("/<post_id>/comments", methods=["GET"])
def get_comments(post_id):
    try:
        oid = ObjectId(post_id)
    except Exception:
        return jsonify({"error": "post_id inválido."}), 400

    db = get_db()
    docs = list(db.comments.find({"post_id": oid}).sort("created_at", 1))
    return jsonify([serialize_comment(d) for d in docs]), 200


@posts_bp.route("/<post_id>/comments", methods=["POST"])
def add_comment(post_id):
    data = request.get_json()
    user_id = data.get("user_id")
    text = (data.get("text") or "").strip()
    if not user_id or not text:
        return jsonify({"error": "user_id y text son requeridos."}), 400

    try:
        oid = ObjectId(post_id)
    except Exception:
        return jsonify({"error": "post_id inválido."}), 400

    db = get_db()
    now = datetime.now(timezone.utc)
    comment = {
        "post_id": oid,
        "user_id": user_id,
        "author_name": data.get("author_name", ""),
        "author_surname": data.get("author_surname") or "",
        "text": text,
        "created_at": now,
    }
    result = db.comments.insert_one(comment)
    comment["_id"] = str(result.inserted_id)
    comment["post_id"] = post_id
    comment["created_at"] = now.isoformat()
    comments_count = db.comments.count_documents({"post_id": oid})
    return jsonify({"comment": comment, "comments_count": comments_count}), 201


@posts_bp.route("/<post_id>/comments/<comment_id>", methods=["DELETE"])
def delete_comment(post_id, comment_id):
    data = request.get_json() or {}
    user_id = data.get("user_id")
    try:
        comment_oid = ObjectId(comment_id)
        post_oid = ObjectId(post_id)
    except Exception:
        return jsonify({"error": "ID inválido."}), 400

    db = get_db()
    db.comments.delete_one({"_id": comment_oid, "user_id": user_id})
    comments_count = db.comments.count_documents({"post_id": post_oid})
    return jsonify({"ok": True, "comments_count": comments_count}), 200

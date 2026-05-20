// =============================================================
//  LinkPro - Esquema MongoDB (Atlas / mongosh)
//  Ejecutar en MongoDB Shell (mongosh) o en Atlas → Browse Collections
//
//  Conectarse primero:
//    mongosh "mongodb+srv://Maria:<password>@dato2.v1wfsxe.mongodb.net/linkpro"
// =============================================================

use("linkpro");


// =============================================================
//  COLECCION: posts
//  Almacena las publicaciones del feed social.
// =============================================================

db.createCollection("posts", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["user_id", "author_name", "content", "created_at"],
            properties: {
                user_id: {
                    bsonType: "string",
                    description: "ID del usuario (referencia a users en Supabase)"
                },
                author_name: {
                    bsonType: "string",
                    description: "Nombre del autor al momento de publicar"
                },
                author_surname: {
                    bsonType: ["string", "null"],
                    description: "Apellido del autor"
                },
                author_photo_url: {
                    bsonType: ["string", "null"],
                    description: "URL de la foto de perfil al momento de publicar"
                },
                content: {
                    bsonType: "string",
                    minLength: 1,
                    description: "Texto de la publicacion (obligatorio)"
                },
                media: {
                    bsonType: ["object", "null"],
                    description: "Archivo multimedia adjunto (opcional)",
                    properties: {
                        type: { bsonType: "string", enum: ["image", "video"] },
                        url:  { bsonType: "string" }
                    }
                },
                tags: {
                    bsonType: "array",
                    items: { bsonType: "string" },
                    description: "Etiquetas sin el simbolo #"
                },
                created_at: {
                    bsonType: "date",
                    description: "Fecha y hora de creacion (UTC)"
                },
                updated_at: {
                    bsonType: "date",
                    description: "Fecha y hora de ultima modificacion (UTC)"
                }
            }
        }
    }
});

// Indices para posts
db.posts.createIndex({ created_at: -1 });           // listado del feed (mas recientes primero)
db.posts.createIndex({ user_id: 1, created_at: -1 }); // posts de un usuario especifico
db.posts.createIndex({ tags: 1 });                  // busqueda por etiqueta

print("Coleccion 'posts' creada con indices.");


// =============================================================
//  COLECCION: likes
//  Un documento por cada 'Me gusta' que da un usuario a un post.
//  Se usa como coleccion separada (no embebida en posts) para:
//    - permitir indices eficientes
//    - evitar limite de 16 MB por documento
//    - facilitar borrados individuales
// =============================================================

db.createCollection("likes", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["post_id", "user_id", "created_at"],
            properties: {
                post_id: {
                    bsonType: "objectId",
                    description: "Referencia a posts._id"
                },
                user_id: {
                    bsonType: "string",
                    description: "ID del usuario que dio like (referencia a users en Supabase)"
                },
                created_at: {
                    bsonType: "date",
                    description: "Fecha y hora del like (UTC)"
                }
            }
        }
    }
});

// Indice unico: un usuario solo puede dar like una vez por post
db.likes.createIndex(
    { post_id: 1, user_id: 1 },
    { unique: true, name: "idx_likes_post_user" }
);
db.likes.createIndex({ user_id: 1 });  // todos los likes de un usuario

print("Coleccion 'likes' creada con indices.");


// =============================================================
//  COLECCION: comments
//  Un documento por cada comentario en un post.
//  Coleccion separada para independizar crecimiento y
//  permitir borrado individual sin modificar el post.
// =============================================================

db.createCollection("comments", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["post_id", "user_id", "author_name", "text", "created_at"],
            properties: {
                post_id: {
                    bsonType: "objectId",
                    description: "Referencia a posts._id"
                },
                user_id: {
                    bsonType: "string",
                    description: "ID del usuario que comento (referencia a users en Supabase)"
                },
                author_name: {
                    bsonType: "string",
                    description: "Nombre del autor al momento de comentar"
                },
                author_surname: {
                    bsonType: ["string", "null"],
                    description: "Apellido del autor"
                },
                text: {
                    bsonType: "string",
                    minLength: 1,
                    description: "Texto del comentario (obligatorio)"
                },
                created_at: {
                    bsonType: "date",
                    description: "Fecha y hora del comentario (UTC)"
                }
            }
        }
    }
});

// Indice para obtener comentarios de un post ordenados por fecha
db.comments.createIndex(
    { post_id: 1, created_at: 1 },
    { name: "idx_comments_post_date" }
);
db.comments.createIndex({ user_id: 1 });  // comentarios de un usuario

print("Coleccion 'comments' creada con indices.");


// =============================================================
//  VERIFICACION: listar colecciones e indices creados
// =============================================================

print("\n--- Colecciones en la base de datos 'linkpro' ---");
db.getCollectionNames().forEach(name => print("  " + name));

print("\n--- Indices de 'posts' ---");
db.posts.getIndexes().forEach(idx => print("  " + JSON.stringify(idx.key)));

print("\n--- Indices de 'likes' ---");
db.likes.getIndexes().forEach(idx => print("  " + JSON.stringify(idx.key)));

print("\n--- Indices de 'comments' ---");
db.comments.getIndexes().forEach(idx => print("  " + JSON.stringify(idx.key)));


// =============================================================
//  DATOS DE EJEMPLO (opcional - descomentar para insertar)
// =============================================================

/*
const postId = new ObjectId();

db.posts.insertOne({
    _id: postId,
    user_id: "ejemplo-uuid-supabase",
    author_name: "Maria",
    author_surname: "Paz",
    author_photo_url: null,
    content: "Primera publicacion en LinkPro!",
    media: null,
    tags: ["LinkPro", "MongoDB"],
    created_at: new Date(),
    updated_at: new Date()
});

db.likes.insertOne({
    post_id: postId,
    user_id: "otro-uuid-supabase",
    created_at: new Date()
});

db.comments.insertOne({
    post_id: postId,
    user_id: "otro-uuid-supabase",
    author_name: "Juan",
    author_surname: "Lopez",
    text: "Excelente publicacion!",
    created_at: new Date()
});
*/

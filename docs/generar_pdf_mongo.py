from fpdf import FPDF


class PDF(FPDF):
    def header(self):
        self.set_font("Helvetica", "B", 11)
        self.set_text_color(21, 128, 61)
        self.cell(0, 10, "Justificacion del uso de MongoDB en el TP - LinkPro", align="C", new_x="LMARGIN", new_y="NEXT")
        self.set_draw_color(21, 128, 61)
        self.set_line_width(0.5)
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(4)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(120, 120, 120)
        self.cell(0, 10, f"Pagina {self.page_no()}", align="C")

    def titulo(self, texto):
        self.set_font("Helvetica", "B", 14)
        self.set_text_color(21, 128, 61)
        self.ln(4)
        self.cell(0, 8, texto, new_x="LMARGIN", new_y="NEXT")
        self.set_draw_color(21, 128, 61)
        self.set_line_width(0.3)
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(3)
        self.set_text_color(30, 30, 30)

    def subtitulo(self, texto):
        self.set_font("Helvetica", "B", 11)
        self.set_text_color(22, 163, 74)
        self.ln(2)
        self.cell(0, 7, texto, new_x="LMARGIN", new_y="NEXT")
        self.set_text_color(30, 30, 30)

    def parrafo(self, texto):
        self.set_font("Helvetica", "", 10)
        self.set_text_color(40, 40, 40)
        self.set_x(self.l_margin)
        self.multi_cell(190, 6, texto)
        self.ln(2)

    def bullet(self, texto):
        self.set_font("Helvetica", "", 10)
        self.set_text_color(40, 40, 40)
        self.set_x(self.l_margin)
        self.multi_cell(190, 6, "  - " + texto)

    def codigo(self, texto):
        self.set_font("Courier", "", 9)
        self.set_fill_color(240, 255, 244)
        self.set_text_color(20, 80, 40)
        self.set_x(self.l_margin)
        self.multi_cell(190, 5.5, texto, fill=True, border=0)
        self.ln(2)
        self.set_text_color(40, 40, 40)

    def tabla_encabezado(self, cols, anchos):
        self.set_font("Helvetica", "B", 9)
        self.set_fill_color(21, 128, 61)
        self.set_text_color(255, 255, 255)
        for col, ancho in zip(cols, anchos):
            self.cell(ancho, 7, col, border=1, fill=True)
        self.ln()
        self.set_text_color(40, 40, 40)

    def tabla_fila(self, celdas, anchos, fill=False):
        self.set_font("Helvetica", "", 9)
        if fill:
            self.set_fill_color(220, 252, 231)
        else:
            self.set_fill_color(255, 255, 255)
        for celda, ancho in zip(celdas, anchos):
            self.cell(ancho, 6, celda, border=1, fill=True)
        self.ln()


pdf = PDF()
pdf.set_margins(10, 15, 10)
pdf.set_auto_page_break(auto=True, margin=20)
pdf.add_page()

# ── Titulo principal
pdf.set_font("Helvetica", "B", 16)
pdf.set_text_color(20, 83, 45)
pdf.cell(0, 12, "Justificacion del uso de MongoDB en el Trabajo Practico", align="C", new_x="LMARGIN", new_y="NEXT")
pdf.set_font("Helvetica", "", 11)
pdf.set_text_color(80, 80, 80)
pdf.cell(0, 7, "Trabajo Practico - LinkPro (clon de LinkedIn)", align="C", new_x="LMARGIN", new_y="NEXT")
pdf.ln(6)

# ── 1. Contexto
pdf.titulo("1. Contexto del trabajo practico")
pdf.parrafo(
    "El TP consiste en construir una red social similar a LinkedIn integrando multiples motores de bases de "
    "datos para distintas funcionalidades. Segun la consigna, es obligatorio usar al menos una base de datos "
    "relacional (SQL), una documental (MongoDB) y una de grafos o clave-valor, justificando la eleccion de cada "
    "tecnologia segun las caracteristicas propias de los datos y las operaciones requeridas."
)
pdf.parrafo(
    "El sistema LinkPro distribuye los datos en cuatro motores especializados:"
)
pdf.bullet("PostgreSQL/Supabase (SQL): usuarios, perfiles, empleos, postulaciones y grupos.")
pdf.bullet("MongoDB Atlas (documental): feed social - publicaciones, likes y comentarios.")
pdf.bullet("Cassandra (columnar distribuido): notificaciones y mensajes directos entre usuarios. [pendiente]")
pdf.bullet("Neo4j (grafos): conexiones entre usuarios y matching de habilidades. [pendiente]")
pdf.ln(2)
pdf.parrafo(
    "Este documento justifica el uso de MongoDB para el modulo del feed social: publicaciones, likes y "
    "comentarios. Este modulo concentra el mayor volumen de escrituras y lecturas del sistema y tiene "
    "caracteristicas que lo hacen inadecuado para un modelo relacional estricto."
)

# ── 2. Funcionalidades
pdf.titulo("2. Funcionalidades implementadas con MongoDB")
pdf.parrafo("El modulo del feed utiliza tres colecciones en MongoDB Atlas (base de datos: linkpro):")
pdf.ln(1)

anchos = [45, 50, 95]
pdf.tabla_encabezado(["Coleccion", "Equivalente SQL", "Descripcion"], anchos)
filas = [
    ("posts", "posts (tabla)", "Publicaciones del feed con autor, contenido, media y tags"),
    ("likes", "likes (tabla)", "Registro de 'Me gusta' por usuario y por post"),
    ("comments", "comments (tabla)", "Comentarios de usuarios sobre publicaciones"),
]
for i, fila in enumerate(filas):
    pdf.tabla_fila(list(fila), anchos, fill=(i % 2 == 0))
pdf.ln(4)

pdf.parrafo(
    "Las colecciones likes y comentarios se disenan como colecciones separadas (no embebidas en posts) "
    "para permitir consultas eficientes por usuario, borrado individual y conteos independientes sin "
    "recargar el documento completo del post."
)

# ── 3. Por que MongoDB
pdf.titulo("3. Por que MongoDB para el feed social")

pdf.subtitulo("3.1 Documentos flexibles para contenido heterogeneo")
pdf.parrafo(
    "Las publicaciones del feed tienen una estructura variable: algunas tienen solo texto, otras incluyen "
    "imagenes o videos, otras llevan etiquetas (tags), y el formato puede evolucionar a futuro sin requerir "
    "una migracion de esquema. En MongoDB, cada documento puede tener campos distintos sin romper la coleccion:"
)
pdf.codigo(
    "// Post solo con texto\n"
    "{ _id: ObjectId, user_id: '...', content: 'Texto', tags: [], media: null, created_at: ISODate }\n\n"
    "// Post con imagen y tags\n"
    "{ _id: ObjectId, user_id: '...', content: 'Texto', tags: ['React','MongoDB'],\n"
    "  media: { type: 'image', url: 'https://...' }, created_at: ISODate }"
)
pdf.parrafo(
    "Con SQL, agregar el campo media o tags implicaria alterar la tabla (ALTER TABLE) y posiblemente "
    "crear tablas auxiliares como post_tags o post_media."
)

pdf.subtitulo("3.2 Alto volumen de escrituras - patron de uso del feed")
pdf.parrafo(
    "El feed social es el modulo mas activo de cualquier red profesional. Los usuarios leen, publican, "
    "dan likes y comentan de forma continua y concurrente. MongoDB esta disenado para cargas de alta "
    "escritura con particionamiento horizontal (sharding), lo que lo hace mas adecuado para esta escala "
    "que una base relacional normalizada donde cada like o comentario implicaria bloqueos de fila."
)
pdf.bullet("Cada like es un insert simple en la coleccion likes (no un UPDATE sobre el documento del post).")
pdf.bullet("Cada comentario es un insert en la coleccion comments con referencia al post_id.")
pdf.bullet("No hay locks de tabla ni transacciones complejas para las operaciones del feed.")
pdf.ln(2)

pdf.subtitulo("3.3 Aggregation Pipeline: joins eficientes entre colecciones")
pdf.parrafo(
    "Aunque MongoDB es una base documental, su Aggregation Pipeline permite realizar operaciones "
    "equivalentes a JOINs relacionales mediante el operador $lookup. La consulta GET /posts utiliza "
    "este mecanismo para traer likes y comentarios junto a cada post en una sola operacion:"
)
pdf.codigo(
    "db.posts.aggregate([\n"
    "  { $sort: { created_at: -1 } },\n"
    "  { $limit: 50 },\n"
    "  { $lookup: {\n"
    "      from: 'likes',\n"
    "      localField: '_id',\n"
    "      foreignField: 'post_id',\n"
    "      as: 'likes_list'\n"
    "  }},\n"
    "  { $lookup: {\n"
    "      from: 'comments',\n"
    "      localField: '_id',\n"
    "      foreignField: 'post_id',\n"
    "      pipeline: [{ $sort: { created_at: 1 } }],\n"
    "      as: 'comments_list'\n"
    "  }},\n"
    "  { $addFields: {\n"
    "      likes_count:    { $size: '$likes_list' },\n"
    "      comments_count: { $size: '$comments_list' },\n"
    "      user_liked:     { $in: [user_id, '$likes_list.user_id'] }\n"
    "  }},\n"
    "  { $project: { likes_list: 0 } }\n"
    "])"
)
pdf.parrafo(
    "Este pipeline devuelve en una sola operacion: el post, la cantidad de likes, si el usuario actual "
    "dio like, la cantidad de comentarios y la lista de comentarios ordenada. Esto seria equivalente a "
    "multiples JOINs en SQL pero aprovechando la naturaleza orientada a documentos de MongoDB."
)

pdf.subtitulo("3.4 Colecciones separadas vs. embebido: diseno elegido y su justificacion")
pdf.parrafo(
    "MongoDB permite dos enfoques para modelar likes y comentarios:"
)
pdf.bullet(
    "EMBEBIDO: guardar los arrays de likes y comentarios dentro del documento del post. "
    "Rapido para leer, pero limita el tamano del documento (maximo 16 MB), complica los borrados "
    "individuales y hace ineficiente contar likes de un usuario en todos sus posts."
)
pdf.bullet(
    "COLECCIONES SEPARADAS (enfoque elegido): likes y comments son colecciones independientes "
    "con un campo post_id que referencia al post. Permite indices, consultas por usuario, "
    "borrados atomicos y no tiene limite de tamano."
)
pdf.parrafo(
    "Se eligio el enfoque de colecciones separadas por tres razones principales: "
    "(1) es una buena practica para datos que crecen sin limite (un post puede tener miles de comentarios), "
    "(2) permite consultas eficientes del tipo 'todos los posts que le gustaron a un usuario' sin "
    "recorrer todos los posts, y (3) la eliminacion de un like o comentario es un delete directo "
    "sin necesidad de modificar el documento del post."
)

pdf.subtitulo("3.5 Integracion con MongoDB Atlas")
pdf.parrafo(
    "La aplicacion utiliza MongoDB Atlas, el servicio cloud de MongoDB. Esto permite:"
)
pdf.bullet("Base de datos en la nube sin necesidad de instalar ni configurar un servidor local.")
pdf.bullet("Conexion desde el backend Flask mediante una URI SRV (mongodb+srv://) con autenticacion.")
pdf.bullet("Panel de administracion web para visualizar colecciones, documentos e indices.")
pdf.bullet("Backups automaticos y alta disponibilidad con replica sets.")
pdf.parrafo(
    "La conexion se configura en el archivo .env con las variables MONGO_URI y MONGO_DB, "
    "y se gestiona mediante el modulo db_mongo.py que inicializa el cliente pymongo con timeouts "
    "configurados para evitar bloqueos ante problemas de red."
)
pdf.codigo(
    "# db_mongo.py\n"
    "from pymongo import MongoClient\n\n"
    "def get_db():\n"
    "    client = MongoClient(MONGO_URI,\n"
    "        serverSelectionTimeoutMS=8000,\n"
    "        connectTimeoutMS=8000,\n"
    "        socketTimeoutMS=8000)\n"
    "    return client[MONGO_DB]"
)

# ── 4. Diseno de colecciones
pdf.titulo("4. Diseno de las colecciones")

pdf.subtitulo("4.1 Coleccion: posts")
pdf.codigo(
    "{\n"
    "  _id:              ObjectId (autogenerado),\n"
    "  user_id:          string   (referencia al usuario en SQL/Supabase),\n"
    "  author_name:      string,\n"
    "  author_surname:   string,\n"
    "  author_photo_url: string | null,\n"
    "  content:          string   (texto de la publicacion),\n"
    "  media:            { type: 'image'|'video', url: string } | null,\n"
    "  tags:             [string] (etiquetas sin el # ),\n"
    "  created_at:       ISODate,\n"
    "  updated_at:       ISODate\n"
    "}"
)

pdf.subtitulo("4.2 Coleccion: likes")
pdf.codigo(
    "{\n"
    "  _id:        ObjectId (autogenerado),\n"
    "  post_id:    ObjectId (referencia a posts._id),\n"
    "  user_id:    string   (referencia al usuario en SQL),\n"
    "  created_at: ISODate\n"
    "}"
)
pdf.parrafo("Indice recomendado: { post_id: 1, user_id: 1 } unique, para evitar likes duplicados y acelerar la busqueda.")

pdf.subtitulo("4.3 Coleccion: comments")
pdf.codigo(
    "{\n"
    "  _id:             ObjectId (autogenerado),\n"
    "  post_id:         ObjectId (referencia a posts._id),\n"
    "  user_id:         string   (referencia al usuario en SQL),\n"
    "  author_name:     string,\n"
    "  author_surname:  string,\n"
    "  text:            string,\n"
    "  created_at:      ISODate\n"
    "}"
)
pdf.parrafo("Indice recomendado: { post_id: 1, created_at: 1 } para recuperar comentarios de un post ordenados cronologicamente.")

# ── 5. API REST
pdf.titulo("5. Endpoints de la API REST del feed (Blueprint posts_bp)")
pdf.ln(1)

anchos3 = [15, 60, 115]
pdf.tabla_encabezado(["Metodo", "Endpoint", "Descripcion"], anchos3)
endpoints = [
    ("GET",    "/posts?user_id=X",                   "Lista los 50 posts mas recientes con likes y comentarios (aggregation)"),
    ("POST",   "/posts",                              "Crea una nueva publicacion en la coleccion posts"),
    ("DELETE", "/posts/<post_id>",                    "Elimina el post y en cascada sus likes y comentarios"),
    ("POST",   "/posts/<post_id>/like",               "Toggle de like: inserta o elimina en la coleccion likes"),
    ("GET",    "/posts/<post_id>/comments",           "Lista comentarios de un post ordenados por fecha"),
    ("POST",   "/posts/<post_id>/comments",           "Agrega un comentario en la coleccion comments"),
    ("DELETE", "/posts/<post_id>/comments/<comm_id>", "Elimina un comentario por su _id"),
]
for i, fila in enumerate(endpoints):
    pdf.tabla_fila(list(fila), anchos3, fill=(i % 2 == 0))
pdf.ln(4)

# ── 6. Queries MongoDB ejecutadas desde el backend
pdf.titulo("6. Queries MongoDB ejecutadas desde el backend")
pdf.parrafo(
    "Las colecciones e indices de MongoDB se crean automaticamente al arrancar el servidor (db_mongo.py). "
    "Las operaciones de lectura y escritura se realizan mediante pymongo desde el blueprint posts_bp. "
    "A continuacion se detallan las operaciones por endpoint:"
)

pdf.subtitulo("6.1 GET /posts - Listar publicaciones con likes y comentarios")
pdf.parrafo(
    "Usa el Aggregation Pipeline con $lookup para obtener en una sola consulta los posts "
    "junto con sus likes y comentarios:"
)
pdf.codigo(
    "db.posts.aggregate([\n"
    "  { $sort: { created_at: -1 } },\n"
    "  { $limit: 50 },\n"
    "  { $lookup: {\n"
    "      from: 'likes', localField: '_id',\n"
    "      foreignField: 'post_id', as: 'likes_list'\n"
    "  }},\n"
    "  { $lookup: {\n"
    "      from: 'comments', localField: '_id',\n"
    "      foreignField: 'post_id',\n"
    "      pipeline: [{ $sort: { created_at: 1 } }],\n"
    "      as: 'comments_list'\n"
    "  }},\n"
    "  { $addFields: {\n"
    "      likes_count:    { $size: '$likes_list' },\n"
    "      comments_count: { $size: '$comments_list' },\n"
    "      user_liked:     { $in: [user_id, '$likes_list.user_id'] }\n"
    "  }},\n"
    "  { $project: { likes_list: 0 } }\n"
    "])"
)
pdf.parrafo(
    "El resultado incluye: datos del post, likes_count, si el usuario actual dio like (user_liked), "
    "comments_count y la lista completa de comentarios ordenados cronologicamente."
)

pdf.subtitulo("6.2 POST /posts - Crear publicacion")
pdf.codigo(
    "db.posts.insert_one({\n"
    "    user_id:          user_id,\n"
    "    author_name:      name,\n"
    "    author_surname:   surname,\n"
    "    author_photo_url: photo_url,\n"
    "    content:          content,\n"
    "    media:            { type, url } | None,\n"
    "    tags:             [lista de strings],\n"
    "    created_at:       datetime.utcnow(),\n"
    "    updated_at:       datetime.utcnow()\n"
    "})"
)

pdf.subtitulo("6.3 DELETE /posts/<post_id> - Eliminar post en cascada")
pdf.parrafo("MongoDB no tiene ON DELETE CASCADE, por lo que el backend elimina manualmente las tres colecciones:")
pdf.codigo(
    "db.posts.delete_one({ '_id': ObjectId(post_id) })\n"
    "db.likes.delete_many({ 'post_id': ObjectId(post_id) })\n"
    "db.comments.delete_many({ 'post_id': ObjectId(post_id) })"
)

pdf.subtitulo("6.4 POST /posts/<post_id>/like - Toggle de like")
pdf.parrafo("Si el usuario ya dio like lo elimina, si no lo inserta (toggle). El indice unique previene duplicados:")
pdf.codigo(
    "# Verificar si ya existe el like:\n"
    "db.likes.find_one({ 'post_id': ObjectId(post_id), 'user_id': user_id })\n\n"
    "# Si existe -> eliminar:\n"
    "db.likes.delete_one({ 'post_id': ObjectId(post_id), 'user_id': user_id })\n\n"
    "# Si no existe -> insertar:\n"
    "db.likes.insert_one({\n"
    "    'post_id': ObjectId(post_id),\n"
    "    'user_id': user_id,\n"
    "    'created_at': datetime.utcnow()\n"
    "})"
)

pdf.subtitulo("6.5 GET /posts/<post_id>/comments - Listar comentarios")
pdf.codigo(
    "db.comments.find(\n"
    "    { 'post_id': ObjectId(post_id) }\n"
    ").sort('created_at', 1)"
)

pdf.subtitulo("6.6 POST /posts/<post_id>/comments - Agregar comentario")
pdf.codigo(
    "db.comments.insert_one({\n"
    "    'post_id':        ObjectId(post_id),\n"
    "    'user_id':        user_id,\n"
    "    'author_name':    name,\n"
    "    'author_surname': surname,\n"
    "    'text':           text,\n"
    "    'created_at':     datetime.utcnow()\n"
    "})"
)

pdf.subtitulo("6.7 DELETE /posts/<post_id>/comments/<comm_id> - Eliminar comentario")
pdf.codigo(
    "db.comments.delete_one({\n"
    "    '_id':    ObjectId(comm_id),\n"
    "    'user_id': user_id  # solo el autor puede borrar\n"
    "})"
)

pdf.subtitulo("6.8 Inicializacion automatica de colecciones e indices (db_mongo.py)")
pdf.parrafo("Al arrancar el servidor, get_db() llama a _init_collections() que crea las colecciones e indices si no existen:")
pdf.codigo(
    "# posts\n"
    "db.posts.create_index([('created_at', DESCENDING)], name='idx_posts_date')\n"
    "db.posts.create_index([('user_id', ASC), ('created_at', DESC)], name='idx_posts_user_date')\n"
    "db.posts.create_index([('tags', ASCENDING)], name='idx_posts_tags')\n\n"
    "# likes\n"
    "db.likes.create_index([('post_id', ASC), ('user_id', ASC)],\n"
    "    unique=True, name='idx_likes_post_user')\n"
    "db.likes.create_index([('user_id', ASCENDING)], name='idx_likes_user')\n\n"
    "# comments\n"
    "db.comments.create_index([('post_id', ASC), ('created_at', ASC)],\n"
    "    name='idx_comments_post_date')\n"
    "db.comments.create_index([('user_id', ASCENDING)], name='idx_comments_user')"
)

# ── 7. Comparacion
pdf.titulo("7. Comparacion SQL vs MongoDB para el feed")
pdf.ln(1)

anchos4 = [60, 65, 65]
pdf.tabla_encabezado(["Criterio", "SQL (PostgreSQL)", "MongoDB (elegido para feed)"], anchos4)
comp = [
    ("Esquema",           "Fijo, requiere migraciones",    "Flexible, sin migraciones"),
    ("Posts con media",   "Tabla auxiliar post_media",     "Campo media en el documento"),
    ("Tags por post",     "Tabla auxiliar post_tags",      "Array tags en el documento"),
    ("Alto volumen likes","Locks en UPDATE de contador",   "Insert atomico en coleccion likes"),
    ("Joins",             "JOINs nativos con FK",          "$lookup en aggregation pipeline"),
    ("Escalabilidad",     "Vertical (mayor servidor)",     "Horizontal (sharding en Atlas)"),
    ("Borrado en cascada","ON DELETE CASCADE en FK",       "Delete explicito en 3 colecciones"),
    ("Indices",           "Indices sobre FK y campos",     "Indices compuestos por coleccion"),
]
for i, fila in enumerate(comp):
    pdf.tabla_fila(list(fila), anchos4, fill=(i % 2 == 0))
pdf.ln(4)

# ── 7. Arquitectura
pdf.titulo("8. Integracion en la arquitectura del sistema")
pdf.parrafo(
    "La arquitectura del sistema separa claramente las responsabilidades de cada base de datos:"
)
pdf.codigo(
    "Frontend (React + TypeScript)\n"
    "        |\n"
    "        v\n"
    "Backend Flask (Python)\n"
    "  +-- /auth, /profile, /jobs, /groups  -->  Supabase (PostgreSQL)\n"
    "  |                                         Usuarios, perfiles, empleos,\n"
    "  |                                         postulaciones, grupos\n"
    "  |\n"
    "  +-- /posts                           -->  MongoDB Atlas\n"
    "  |                                         Posts, likes, comentarios (feed)\n"
    "  |\n"
    "  +-- /notifications, /messages        -->  Cassandra [pendiente]\n"
    "  |                                         Notificaciones, mensajes directos\n"
    "  |\n"
    "  +-- /connections                     -->  Neo4j [pendiente]\n"
    "                                            Conexiones entre usuarios"
)
pdf.parrafo(
    "El backend Flask actua como capa de abstraccion: el frontend solo conoce la API REST y no sabe "
    "que hay cuatro bases de datos diferentes detras. Cada blueprint es responsable de comunicarse con "
    "su motor correspondiente: posts_bp usa pymongo para MongoDB, auth_bp/profile_bp/jobs_bp/groups_bp "
    "usan el SDK de Supabase para PostgreSQL, notifications_bp y messages_bp usaran Cassandra, y "
    "connections_bp usara Neo4j."
)

# ── 8. Conclusion
pdf.titulo("9. Conclusion")
pdf.parrafo("La eleccion de MongoDB para el modulo de feed social esta justificada por:")
pdf.bullet(
    "Flexibilidad de esquema: las publicaciones tienen contenido variable (texto, imagen, video, tags) "
    "que se representa naturalmente como un documento sin necesidad de tablas auxiliares."
)
pdf.bullet(
    "Alto volumen de escrituras: likes y comentarios son operaciones de alta frecuencia que se "
    "benefician del modelo de inserts directos en colecciones separadas sin locks de tabla."
)
pdf.bullet(
    "Aggregation Pipeline: el operador $lookup permite combinar posts con likes y comentarios en "
    "una sola consulta eficiente, incluyendo calculos como likes_count y user_liked."
)
pdf.bullet(
    "Colecciones separadas: el diseno con tres colecciones (posts, likes, comments) evita el limite "
    "de 16 MB por documento, facilita los borrados individuales e independiza el crecimiento de cada entidad."
)
pdf.bullet(
    "Integracion con Atlas: MongoDB Atlas proporciona una base de datos cloud gestionada, "
    "accesible mediante URI SRV, sin necesidad de infraestructura local."
)
pdf.bullet(
    "Complementariedad con los demas motores: MongoDB no reemplaza a PostgreSQL, Cassandra ni Neo4j "
    "sino que se suma a ellos, asumiendo exclusivamente el rol del feed social donde sus caracteristicas "
    "lo hacen mas adecuado."
)
pdf.ln(3)
pdf.parrafo(
    "El resultado es un sistema poliglota donde cada motor asume el dominio que mejor maneja: "
    "PostgreSQL garantiza la integridad transaccional de usuarios, empleos y grupos; "
    "MongoDB gestiona el contenido social dinamico del feed con flexibilidad de esquema y "
    "alto rendimiento de escritura; Cassandra (a implementar) manejara el alto volumen de "
    "notificaciones y mensajes con escrituras distribuidas; y Neo4j (a implementar) modelara "
    "las conexiones entre usuarios como un grafo para calcular redes de contacto y matching."
)

out = r"c:\Users\maria\Desktop\tpoLinkedin\TPO-Linkedin\docs\mongo-justificacion.pdf"
pdf.output(out)
print(f"PDF generado: {out}")

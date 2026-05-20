from fpdf import FPDF

class PDF(FPDF):
    def header(self):
        self.set_font("Helvetica", "B", 11)
        self.set_text_color(30, 64, 175)
        self.cell(0, 10, "Justificacion del uso de SQL en el TP - LinkPro", align="C", new_x="LMARGIN", new_y="NEXT")
        self.set_draw_color(30, 64, 175)
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
        self.set_text_color(30, 64, 175)
        self.ln(4)
        self.cell(0, 8, texto, new_x="LMARGIN", new_y="NEXT")
        self.set_draw_color(30, 64, 175)
        self.set_line_width(0.3)
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(3)
        self.set_text_color(30, 30, 30)

    def subtitulo(self, texto):
        self.set_font("Helvetica", "B", 11)
        self.set_text_color(37, 99, 235)
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
        self.set_fill_color(240, 244, 255)
        self.set_text_color(30, 30, 100)
        self.set_x(self.l_margin)
        self.multi_cell(190, 5.5, texto, fill=True, border=0)
        self.ln(2)
        self.set_text_color(40, 40, 40)

    def tabla_encabezado(self, cols, anchos):
        self.set_font("Helvetica", "B", 9)
        self.set_fill_color(30, 64, 175)
        self.set_text_color(255, 255, 255)
        for col, ancho in zip(cols, anchos):
            self.cell(ancho, 7, col, border=1, fill=True)
        self.ln()
        self.set_text_color(40, 40, 40)

    def tabla_fila(self, celdas, anchos, fill=False):
        self.set_font("Helvetica", "", 9)
        if fill:
            self.set_fill_color(235, 241, 255)
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
pdf.set_text_color(15, 23, 100)
pdf.cell(0, 12, "Justificacion del uso de SQL (PostgreSQL / Supabase)", align="C", new_x="LMARGIN", new_y="NEXT")
pdf.set_font("Helvetica", "", 11)
pdf.set_text_color(80, 80, 80)
pdf.cell(0, 7, "Trabajo Practico - LinkPro (clon de LinkedIn)", align="C", new_x="LMARGIN", new_y="NEXT")
pdf.ln(6)

# ── 1. Contexto
pdf.titulo("1. Contexto del trabajo practico")
pdf.parrafo(
    "El TP consiste en construir una red social similar a LinkedIn integrando multiples motores de bases de "
    "datos para distintas funcionalidades. La consigna exige usar al menos una base de datos relacional (SQL), "
    "una documental (MongoDB) y una de grafos o clave-valor. La eleccion de que tecnologia usar para cada modulo "
    "debe estar justificada por las caracteristicas propias de los datos y las operaciones que se realizan sobre ellos."
)

# ── 2. Funcionalidades
pdf.titulo("2. Funcionalidades implementadas sobre SQL")
pdf.parrafo("Las siguientes funcionalidades del sistema se apoyan en tablas SQL gestionadas a traves de Supabase (PostgreSQL):")
pdf.ln(1)

anchos = [55, 135]
pdf.tabla_encabezado(["Modulo", "Tablas involucradas"], anchos)
filas = [
    ("Usuarios y autenticacion", "users, roles, user_roles"),
    ("Perfil profesional", "users, work experience, education, skills, user_skill"),
    ("Empresas", "companies"),
    ("Ofertas de empleo", "jobs, job_skill"),
    ("Postulaciones", "applications"),
]
for i, (m, t) in enumerate(filas):
    pdf.tabla_fila([m, t], anchos, fill=(i % 2 == 0))
pdf.ln(4)

# ── 3. Por que SQL
pdf.titulo("3. Por que SQL para estas funcionalidades")

pdf.subtitulo("3.1 Integridad referencial y relaciones fuertes")
pdf.parrafo(
    "Los datos de usuarios, perfiles, empleos y postulaciones estan fuertemente relacionados entre si. "
    "Las claves foraneas de SQL garantizan que no existan postulaciones huerfanas, ni ofertas que referencien "
    "usuarios o empresas inexistentes. Esto seria mucho mas dificil de garantizar en una base de datos documental "
    "sin logica de aplicacion adicional."
)
pdf.bullet("Una oferta de empleo (jobs) pertenece a un usuario (poster_user_id -> users.user_id) y opcionalmente a una empresa (company_id -> companies).")
pdf.bullet("Una postulacion (applications) vincula un usuario con una oferta (user_id -> users, job_id -> jobs).")
pdf.bullet("Las habilidades del usuario (user_skill) y las requeridas por una oferta (job_skill) referencian el catalogo comun skills.")
pdf.ln(3)

pdf.subtitulo("3.2 Consultas relacionales complejas en una sola operacion")
pdf.parrafo(
    "La API utiliza las capacidades de join de Supabase PostgREST para traer datos de multiples tablas "
    "en una sola consulta. Por ejemplo, al listar ofertas:"
)
pdf.codigo(
    "jobs\n"
    "  +-- companies(name)\n"
    "  +-- job_skill\n"
    "        +-- skills(skill_id, name, type)"
)
pdf.parrafo(
    "Y al listar postulaciones de un usuario:"
)
pdf.codigo(
    "applications\n"
    "  +-- jobs\n"
    "  |     +-- companies(name)\n"
    "  +-- users(user_id, name, surname, email, profile_photo_url)"
)
pdf.parrafo(
    "Con documentos MongoDB habria que hacer multiples consultas o disenar documentos embebidos que no "
    "representan bien la realidad del modelo, ya que las mismas skills son compartidas por usuarios y ofertas, "
    "y las mismas companies son compartidas por experiencias laborales y ofertas."
)

pdf.subtitulo("3.3 Normalizacion: evitar duplicacion de datos")
pdf.parrafo(
    "El catalogo de habilidades (skills) es un claro ejemplo de por que la normalizacion relacional es conveniente:"
)
pdf.bullet('Una habilidad como "Python" existe una sola vez en la tabla skills.')
pdf.bullet("Tanto el perfil de un usuario (user_skill) como una oferta de empleo (job_skill) la referencian mediante su skill_id.")
pdf.bullet("Si el nombre de una habilidad cambiara, se actualiza en un unico lugar.")
pdf.parrafo(
    'Con un modelo documental, "Python" apareceria embebida en el documento de cada usuario y en el de cada oferta, '
    "generando inconsistencias."
)

pdf.subtitulo("3.4 Unicidad y restricciones de negocio")
pdf.parrafo(
    "SQL permite declarar restricciones directamente en el esquema, garantizandolas en la capa de almacenamiento:"
)
pdf.bullet("users.email es UNIQUE: no pueden existir dos cuentas con el mismo email.")
pdf.bullet("users.dni es UNIQUE: no puede haber duplicados de documento.")
pdf.bullet("applications(job_id, user_id) es unico: un usuario no puede postularse dos veces a la misma oferta.")
pdf.bullet("Campos como is_active, status e is_current tienen valores por defecto y restricciones de tipo.")
pdf.ln(2)

pdf.subtitulo("3.5 Transacciones ACID")
pdf.parrafo(
    "Las operaciones criticas del sistema requieren atomicidad:"
)
pdf.bullet("Al registrar un usuario: se inserta en users y se asignan roles en user_roles. Si una operacion falla, la cuenta no queda en estado inconsistente.")
pdf.bullet("Al publicar una oferta con habilidades: se inserta en jobs y luego en job_skill de forma atomica.")
pdf.parrafo(
    "Las garantias ACID (Atomicidad, Consistencia, Aislamiento, Durabilidad) de PostgreSQL aseguran "
    "consistencia incluso bajo fallas parciales o concurrencia de multiples usuarios."
)

pdf.subtitulo("3.6 Esquema predecible para datos estructurados")
pdf.parrafo(
    "Los datos de usuarios, perfiles y empleos tienen una estructura fija y bien definida: todos los usuarios "
    "tienen nombre, email y contrasena; todas las ofertas tienen titulo, modalidad y estado. Esta homogeneidad "
    "favorece el modelo relacional. Un motor documental como MongoDB es mas conveniente cuando los datos son "
    "heterogeneos o evolucionan rapidamente en estructura (por ejemplo, el contenido de posts o comentarios)."
)

# ── 4. Queries ejecutadas desde el backend
pdf.titulo("4. Queries ejecutadas desde el backend")
pdf.parrafo(
    "El backend (Flask) dispara las queries SQL automaticamente al iniciar, creando las tablas si no existen "
    "(via init_db.py con psycopg2). Durante la ejecucion, cada ruta accede a Supabase usando el SDK PostgREST, "
    "que construye y ejecuta las queries SQL internamente. A continuacion se detallan las operaciones por modulo:"
)

pdf.subtitulo("4.1 Modulo de autenticacion (auth.py)")
pdf.parrafo("REGISTRO - Inserta usuario y asigna rol. Si el rol es 'poster', busca o crea la empresa:")
pdf.codigo(
    "INSERT INTO users (user_id, email, password_hash, name, surname, dni)\n"
    "  VALUES ($1, $2, $3, $4, $5, $6)\n\n"
    "SELECT company_id FROM companies WHERE name ILIKE $1 LIMIT 1\n"
    "-- Si no existe:\n"
    "INSERT INTO companies (company_id, name) VALUES ($1, $2)\n\n"
    "INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)"
)
pdf.parrafo("LOGIN - Busca el usuario por email y verifica la contrasena con bcrypt:")
pdf.codigo(
    "SELECT user_id, email, name, surname, dni, profile_photo_url, password_hash\n"
    "  FROM users WHERE email = $1 LIMIT 1\n\n"
    "SELECT roles.name FROM user_roles\n"
    "  JOIN roles ON user_roles.role_id = roles.role_id\n"
    "  WHERE user_roles.user_id = $1"
)
pdf.parrafo("CAMBIAR CONTRASENA (reset):")
pdf.codigo(
    "UPDATE users SET password_hash = $1 WHERE user_id = $2\n"
    "-- Nota: el token de reset se guarda en memoria del servidor (dict Python),\n"
    "-- no en la base de datos, para simplificar el entorno de desarrollo."
)

pdf.subtitulo("4.2 Modulo de perfil (profile.py)")
pdf.parrafo("ACTUALIZAR DATOS PERSONALES:")
pdf.codigo(
    "UPDATE users SET name=$1, surname=$2, dni=$3, updated_at=now()\n"
    "  WHERE user_id = $4\n\n"
    "-- Foto: se guarda en backend/static/photos/ y se actualiza la URL:\n"
    "UPDATE users SET profile_photo_url=$1 WHERE user_id = $2"
)
pdf.parrafo("EXPERIENCIA LABORAL (work experience):")
pdf.codigo(
    "-- Listar:\n"
    "SELECT we.*, companies.name FROM \"work experience\" we\n"
    "  LEFT JOIN companies ON we.company_id = companies.company_id\n"
    "  WHERE we.user_id = $1 ORDER BY from_date DESC\n\n"
    "-- Agregar:\n"
    "INSERT INTO \"work experience\"\n"
    "  (user_id, company_id, title, description, from_date, end_date, is_current)\n"
    "  VALUES ($1, $2, $3, $4, $5, $6, $7)\n\n"
    "-- Eliminar:\n"
    "DELETE FROM \"work experience\" WHERE we_id=$1 AND user_id=$2"
)
pdf.parrafo("EDUCACION:")
pdf.codigo(
    "-- Listar:\n"
    "SELECT * FROM education WHERE user_id=$1 ORDER BY from_date DESC\n\n"
    "-- Agregar:\n"
    "INSERT INTO education\n"
    "  (user_id, title, field, institution, from_date, end_date, is_actual)\n"
    "  VALUES ($1, $2, $3, $4, $5, $6, $7)\n\n"
    "-- Eliminar:\n"
    "DELETE FROM education WHERE edu_id=$1 AND user_id=$2"
)
pdf.parrafo("HABILIDADES (skills / user_skill):")
pdf.codigo(
    "-- Buscar o crear skill en el catalogo:\n"
    "SELECT skill_id FROM skills WHERE name ILIKE $1 LIMIT 1\n"
    "INSERT INTO skills (name, type) VALUES ($1, $2)\n\n"
    "-- Agregar o actualizar nivel de una habilidad en el perfil:\n"
    "INSERT INTO user_skill (user_id, skill_id, level) VALUES ($1, $2, $3)\n"
    "  ON CONFLICT (user_id, skill_id) DO UPDATE SET level=$3\n\n"
    "-- Listar habilidades del perfil:\n"
    "SELECT us.level, s.skill_id, s.name, s.type\n"
    "  FROM user_skill us JOIN skills s ON us.skill_id = s.skill_id\n"
    "  WHERE us.user_id = $1\n\n"
    "-- Eliminar:\n"
    "DELETE FROM user_skill WHERE user_id=$1 AND skill_id=$2"
)

pdf.subtitulo("4.3 Modulo de empleos (jobs.py)")
pdf.parrafo("LISTAR OFERTAS ACTIVAS - JOIN con companies y skills en una sola operacion:")
pdf.codigo(
    "-- El SDK PostgREST ejecuta internamente:\n"
    "SELECT jobs.*, companies.name,\n"
    "       job_skill.skill_id, skills.name, skills.type\n"
    "  FROM jobs\n"
    "  LEFT JOIN companies ON jobs.company_id = companies.company_id\n"
    "  LEFT JOIN job_skill  ON job_skill.job_id = jobs.job_id\n"
    "  LEFT JOIN skills     ON skills.skill_id  = job_skill.skill_id\n"
    "  WHERE jobs.is_active = TRUE\n"
    "  ORDER BY jobs.created_at DESC"
)
pdf.parrafo("CREAR OFERTA Y AGREGAR SKILLS:")
pdf.codigo(
    "INSERT INTO jobs\n"
    "  (job_id, poster_user_id, company_id, title, description,\n"
    "   location, shift, modality, is_active)\n"
    "  VALUES ($1,$2,$3,$4,$5,$6,$7,$8,TRUE)\n\n"
    "-- Para cada skill requerida:\n"
    "INSERT INTO job_skill (job_id, skill_id) VALUES ($1, $2)"
)
pdf.parrafo("ELIMINAR OFERTA - ON DELETE CASCADE elimina automaticamente job_skill y applications:")
pdf.codigo(
    "DELETE FROM jobs WHERE job_id=$1\n"
    "-- Cascade: borra automaticamente job_skill y applications asociadas"
)

pdf.subtitulo("4.4 Modulo de postulaciones (jobs.py)")
pdf.parrafo("POSTULARSE A UNA OFERTA:")
pdf.codigo(
    "INSERT INTO applications (application_id, job_id, user_id, status)\n"
    "  VALUES ($1, $2, $3, 'submitted')\n"
    "-- UNIQUE (job_id, user_id) impide postulaciones duplicadas"
)
pdf.parrafo("VER MIS POSTULACIONES (candidato) - JOIN de 3 tablas:")
pdf.codigo(
    "SELECT applications.*, jobs.job_id, jobs.title,\n"
    "       companies.name, users.user_id, users.name,\n"
    "       users.surname, users.email\n"
    "  FROM applications\n"
    "  LEFT JOIN jobs      ON applications.job_id  = jobs.job_id\n"
    "  LEFT JOIN companies ON jobs.company_id       = companies.company_id\n"
    "  LEFT JOIN users     ON applications.user_id  = users.user_id\n"
    "  WHERE applications.user_id = $1\n"
    "  ORDER BY applications.applied_at DESC"
)
pdf.parrafo("VER POSTULANTES DE UNA OFERTA (poster) Y CAMBIAR ESTADO:")
pdf.codigo(
    "SELECT applications.*, users.name, users.surname,\n"
    "       users.email, users.profile_photo_url\n"
    "  FROM applications\n"
    "  JOIN users ON applications.user_id = users.user_id\n"
    "  WHERE applications.job_id = $1\n\n"
    "UPDATE applications SET status=$1, updated_at=now()\n"
    "  WHERE application_id=$2"
)

# ── 5. Diagrama
pdf.titulo("5. Diagrama de relaciones (simplificado)")
pdf.codigo(
    "users ----------------------- user_roles ---- roles\n"
    "  |\n"
    "  +--- work experience ---- companies\n"
    "  +--- education\n"
    "  +--- user_skill ----------------------------- skills\n"
    "  |                                                |\n"
    "  +--- jobs (poster_user_id) --- companies         |\n"
    "         |                                         |\n"
    "         +--- job_skill --------------------------++\n"
    "         |\n"
    "         +--- applications ---- users"
)

# ── 5. Arquitectura
pdf.titulo("6. Integracion en la arquitectura del sistema")

pdf.subtitulo("Backend: Flask + Supabase Python SDK")
pdf.parrafo(
    "El backend expone una API REST construida con Flask, organizada en blueprints por dominio:"
)
pdf.bullet("/auth  -> auth_bp: registro, login, recuperacion de contrasena.")
pdf.bullet("/profile -> profile_bp: datos del perfil, foto, experiencia, educacion, habilidades.")
pdf.bullet("/jobs -> jobs_bp: listado de ofertas, publicacion, postulaciones, gestion de candidatos.")
pdf.parrafo(
    "Cada blueprint interactua con Supabase mediante el cliente supabase_admin (clave de servicio), "
    "que ejecuta queries sobre PostgreSQL usando la API PostgREST."
)

pdf.subtitulo("Supabase como infraestructura SQL")
pdf.bullet("PostgreSQL gestionado: base de datos relacional con todas las garantias de consistencia.")
pdf.bullet("PostgREST: convierte automaticamente las tablas en endpoints REST con soporte de filtros, joins y paginacion.")
pdf.bullet("Fotos de perfil: se almacenan en el sistema de archivos del servidor Flask (static/photos/) y se sirven como archivos estaticos desde http://localhost:5000/static/photos/. La URL resultante se guarda en el campo profile_photo_url de la tabla users.")
pdf.bullet("Row Level Security (RLS): politicas de acceso a nivel de fila. En el TP se usa la clave service_role desde el backend.")
pdf.bullet("Tokens de recuperacion de contrasena: se almacenan en memoria del servidor (diccionario Python) durante la sesion activa, con expiracion de 1 hora. Este enfoque simplifica el desarrollo evitando una tabla de tokens en la BD.")
pdf.ln(2)

# ── 6. Comparacion
pdf.titulo("7. Comparacion con las otras bases del proyecto")
pdf.ln(1)

anchos2 = [42, 50, 50, 48]
pdf.tabla_encabezado(["Criterio", "SQL (PostgreSQL)", "MongoDB (documental)", "Grafo / Clave-valor"], anchos2)
comp = [
    ("Estructura", "Fija, tabular", "Flexible, anidada", "Relaciones / pares"),
    ("Relaciones", "Claves foraneas, JOINs", "Referencias manuales", "Aristas del grafo"),
    ("Caso de uso TP", "Usuarios, perfiles, empleos", "Posts, comentarios, grupos", "Conexiones entre usuarios"),
    ("Justificacion", "Datos con muchas relaciones", "Contenido heterogeneo", "Traversals de red social"),
]
for i, fila in enumerate(comp):
    pdf.tabla_fila(list(fila), anchos2, fill=(i % 2 == 0))
pdf.ln(4)

# ── 7. Conclusion
pdf.titulo("8. Conclusion")
pdf.parrafo("La eleccion de SQL para los modulos de usuarios, perfiles, empleos y postulaciones esta justificada por:")
pdf.bullet("La naturaleza relacional de los datos: usuarios, empresas, ofertas y postulaciones se interconectan mediante referencias que deben ser consistentes.")
pdf.bullet("La necesidad de integridad referencial: las claves foraneas garantizan que los datos no queden en estados invalidos.")
pdf.bullet("La eficiencia de las consultas con JOINs: se obtienen datos de multiples tablas en una unica operacion.")
pdf.bullet("La normalizacion: skills y companies son entidades compartidas que no deben duplicarse.")
pdf.bullet("Las restricciones de unicidad: email, DNI y postulaciones unicas por usuario/oferta son propiedades del esquema.")
pdf.bullet("Las garantias ACID: operaciones criticas como el registro de usuarios o la publicacion de ofertas son atomicas.")
pdf.ln(3)
pdf.parrafo(
    "Estas caracteristicas hacen de PostgreSQL/Supabase la tecnologia adecuada para el nucleo transaccional "
    "del sistema, mientras que MongoDB y otras bases complementan el sistema para datos menos estructurados "
    "como publicaciones, comentarios y conexiones sociales."
)

out = r"c:\Users\maria\Desktop\tpoLinkedin\TPO-Linkedin\docs\sql-justificacion.pdf"
pdf.output(out)
print(f"PDF generado: {out}")

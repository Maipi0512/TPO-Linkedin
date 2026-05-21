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
    "una documental (MongoDB) y otras tecnologias complementarias (Cassandra, Neo4j). La eleccion de que "
    "tecnologia usar para cada modulo debe estar justificada por las caracteristicas propias de los datos "
    "y las operaciones que se realizan sobre ellos."
)
pdf.parrafo(
    "La arquitectura final del sistema distribuye las responsabilidades de la siguiente manera:"
)
pdf.bullet("SQL (PostgreSQL / Supabase): usuarios, perfiles, empleos, postulaciones y grupos.")
pdf.bullet("MongoDB Atlas: feed social (publicaciones, likes, comentarios).")
pdf.bullet("Cassandra (implementacion futura): notificaciones y mensajes directos.")
pdf.bullet("Neo4j (implementacion futura): red de conexiones entre usuarios.")

# ── 2. Funcionalidades
pdf.titulo("2. Funcionalidades implementadas sobre SQL")
pdf.parrafo("Las siguientes funcionalidades del sistema se apoyan en tablas SQL gestionadas a traves de Supabase (PostgreSQL):")
pdf.ln(1)

anchos = [55, 135]
pdf.tabla_encabezado(["Modulo", "Tablas involucradas"], anchos)
filas = [
    ("Autenticacion (RF1)", "users, roles, user_roles"),
    ("Perfil profesional (RF1)", "users, work experience, education, skills, user_skill"),
    ("Empresas (RF3)", "companies"),
    ("Ofertas de empleo (RF3)", "jobs, job_skill"),
    ("Postulaciones (RF3)", "applications"),
    ("Grupos y miembros (RF5)", "groups, group_members"),
]
for i, (m, t) in enumerate(filas):
    pdf.tabla_fila([m, t], anchos, fill=(i % 2 == 0))
pdf.ln(4)

# ── 3. Por que SQL
pdf.titulo("3. Por que SQL para estas funcionalidades")

pdf.subtitulo("3.1 Integridad referencial y relaciones fuertes")
pdf.parrafo(
    "Los datos de usuarios, perfiles, empleos, postulaciones y grupos estan fuertemente relacionados entre si. "
    "Las claves foraneas de SQL garantizan que no existan postulaciones huerfanas, ni ofertas que referencien "
    "usuarios inexistentes, ni miembros de grupos sin usuario valido. Esto seria mucho mas dificil de garantizar "
    "en una base de datos documental sin logica de aplicacion adicional."
)
pdf.bullet("Una oferta (jobs) pertenece a un usuario poster (ON DELETE CASCADE) y a una empresa.")
pdf.bullet("Una postulacion (applications) vincula usuario y oferta con CASCADE en ambas FKs.")
pdf.bullet("Un grupo (groups) tiene un administrador; group_members vincula usuarios con grupos.")
pdf.bullet("Las skills son compartidas por user_skill y job_skill sin duplicacion.")
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
pdf.parrafo("Al listar miembros de un grupo:")
pdf.codigo(
    "group_members\n"
    "  +-- users(user_id, name, surname, profile_photo_url)"
)

pdf.subtitulo("3.3 Normalizacion: evitar duplicacion de datos")
pdf.parrafo(
    "El catalogo de habilidades (skills) es un claro ejemplo de normalizacion relacional:"
)
pdf.bullet('Una habilidad como "Python" existe una sola vez en la tabla skills.')
pdf.bullet("Tanto user_skill como job_skill la referencian por skill_id.")
pdf.bullet("Las empresas (companies) son referenciadas tanto por jobs como por work experience.")
pdf.parrafo(
    "Con un modelo documental, estas entidades aparecerian duplicadas en cada documento."
)

pdf.subtitulo("3.4 Unicidad y restricciones de negocio")
pdf.bullet("users.email es UNIQUE: no pueden existir dos cuentas con el mismo email.")
pdf.bullet("users.dni es UNIQUE: no puede haber duplicados de documento.")
pdf.bullet("applications(user_id, job_id) es UNIQUE: un usuario no puede postularse dos veces.")
pdf.bullet("skills.name es UNIQUE: no hay habilidades duplicadas en el catalogo.")
pdf.bullet("group_members(group_id, user_id) es PK compuesta: un usuario no puede unirse dos veces.")
pdf.ln(2)

pdf.subtitulo("3.5 ON DELETE CASCADE: integridad en cascada")
pdf.parrafo(
    "Todas las relaciones criticas tienen ON DELETE CASCADE para garantizar que al eliminar "
    "una entidad raiz no queden registros huerfanos en la base de datos:"
)
pdf.bullet("Eliminar usuario -> borra user_roles, work experience, education, user_skill, jobs publicados, applications.")
pdf.bullet("Eliminar oferta -> borra job_skill y applications asociadas.")
pdf.bullet("Eliminar grupo -> borra group_members automaticamente.")
pdf.ln(2)

pdf.subtitulo("3.6 Triggers: updated_at automatico")
pdf.parrafo(
    "Se implementaron triggers en PostgreSQL para mantener el campo updated_at actualizado "
    "automaticamente en las tablas que lo requieren, sin necesidad de hacerlo desde el backend:"
)
pdf.codigo(
    "CREATE OR REPLACE FUNCTION set_updated_at()\n"
    "RETURNS TRIGGER AS $$\n"
    "BEGIN\n"
    "    NEW.updated_at = CURRENT_TIMESTAMP;\n"
    "    RETURN NEW;\n"
    "END;\n"
    "$$ LANGUAGE plpgsql;\n\n"
    "-- Aplicado en: users, jobs, applications"
)

pdf.subtitulo("3.7 Transacciones ACID")
pdf.parrafo(
    "Las operaciones criticas requieren atomicidad: al registrar un usuario se insertan datos "
    "en users y user_roles; al publicar una oferta se insertan en jobs y job_skill. "
    "Las garantias ACID de PostgreSQL aseguran consistencia bajo fallas o concurrencia."
)

# ── 4. Queries
pdf.titulo("4. Queries ejecutadas desde el backend")

pdf.subtitulo("4.1 Autenticacion (auth.py)")
pdf.parrafo("REGISTRO:")
pdf.codigo(
    "INSERT INTO users (user_id, email, password_hash, name, surname, dni) VALUES (...)\n\n"
    "SELECT company_id FROM companies WHERE name ILIKE $1 LIMIT 1\n"
    "INSERT INTO companies (company_id, name, slogan) VALUES (...)\n\n"
    "INSERT INTO user_roles (user_id, role_id) VALUES (...)"
)
pdf.parrafo("LOGIN:")
pdf.codigo(
    "SELECT user_id, email, name, surname, dni, profile_photo_url, password_hash\n"
    "  FROM users WHERE email = $1 LIMIT 1\n\n"
    "SELECT roles.name FROM user_roles\n"
    "  JOIN roles ON user_roles.role_id = roles.role_id\n"
    "  WHERE user_roles.user_id = $1"
)
pdf.parrafo("ELIMINAR CUENTA (ON DELETE CASCADE elimina todo en cascada):")
pdf.codigo("DELETE FROM users WHERE user_id = $1")

pdf.subtitulo("4.2 Perfil (profile.py)")
pdf.parrafo("ACTUALIZAR DATOS / FOTO:")
pdf.codigo(
    "UPDATE users SET name=$1, surname=$2, dni=$3, updated_at=now() WHERE user_id=$4\n"
    "UPDATE users SET profile_photo_url=$1 WHERE user_id=$2\n"
    "-- La foto se sube a Supabase Storage (bucket 'avatars', acceso publico)"
)
pdf.parrafo("EXPERIENCIA LABORAL:")
pdf.codigo(
    "SELECT we.*, companies.name FROM \"work experience\" we\n"
    "  LEFT JOIN companies ON we.company_id = companies.company_id\n"
    "  WHERE we.user_id=$1 ORDER BY from_date DESC\n\n"
    "INSERT INTO \"work experience\" (user_id, company_id, title, description, from_date, end_date, is_current)\n"
    "  VALUES (...)\n\n"
    "DELETE FROM \"work experience\" WHERE we_id=$1 AND user_id=$2"
)
pdf.parrafo("HABILIDADES:")
pdf.codigo(
    "SELECT skill_id FROM skills WHERE name ILIKE $1 LIMIT 1\n"
    "INSERT INTO skills (name, type) VALUES ($1, $2)\n\n"
    "INSERT INTO user_skill (user_id, skill_id, level) VALUES ($1, $2, $3)\n"
    "  ON CONFLICT (user_id, skill_id) DO UPDATE SET level=$3\n\n"
    "DELETE FROM user_skill WHERE user_id=$1 AND skill_id=$2"
)

pdf.subtitulo("4.3 Empleos y postulaciones (jobs.py)")
pdf.parrafo("LISTAR OFERTAS ACTIVAS:")
pdf.codigo(
    "SELECT jobs.*, companies.name, skills.skill_id, skills.name, skills.type\n"
    "  FROM jobs\n"
    "  LEFT JOIN companies ON jobs.company_id = companies.company_id\n"
    "  LEFT JOIN job_skill  ON job_skill.job_id = jobs.job_id\n"
    "  LEFT JOIN skills     ON skills.skill_id  = job_skill.skill_id\n"
    "  WHERE jobs.is_active = TRUE ORDER BY jobs.created_at DESC"
)
pdf.parrafo("CREAR OFERTA (con ownership check en edicion y eliminacion):")
pdf.codigo(
    "INSERT INTO jobs (job_id, poster_user_id, company_id, title, description,\n"
    "  location, working_hours, shift, modality, employment_type, is_active)\n"
    "  VALUES (...)\n\n"
    "INSERT INTO job_skill (job_id, skill_id) VALUES ($1, $2)\n\n"
    "-- Al eliminar: ON DELETE CASCADE borra job_skill y applications"
)
pdf.parrafo("POSTULACIONES:")
pdf.codigo(
    "INSERT INTO applications (application_id, job_id, user_id, status) VALUES (...)\n"
    "-- UNIQUE (user_id, job_id) previene duplicados\n\n"
    "UPDATE applications SET status=$1, updated_at=now() WHERE application_id=$2\n"
    "-- Estados: submitted | in_review | in_process | successful | rejected"
)

pdf.subtitulo("4.4 Grupos (groups.py)")
pdf.parrafo("CREAR GRUPO Y AUTO-UNIRSE COMO ADMIN:")
pdf.codigo(
    "INSERT INTO groups (group_id, name, description, admin_id) VALUES (...)\n\n"
    "INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, 'admin')"
)
pdf.parrafo("UNIRSE / SALIR DEL GRUPO:")
pdf.codigo(
    "-- Verificar si ya es miembro:\n"
    "SELECT group_id FROM group_members\n"
    "  WHERE group_id=$1 AND user_id=$2 LIMIT 1\n\n"
    "-- Unirse:\n"
    "INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, 'member')\n\n"
    "-- Salir (el admin no puede salir):\n"
    "DELETE FROM group_members WHERE group_id=$1 AND user_id=$2"
)
pdf.parrafo("LISTAR MIEMBROS:")
pdf.codigo(
    "SELECT gm.role, gm.joined_at,\n"
    "       users.user_id, users.name, users.surname, users.profile_photo_url\n"
    "  FROM group_members gm\n"
    "  JOIN users ON gm.user_id = users.user_id\n"
    "  WHERE gm.group_id = $1"
)

# ── 5. Diagrama
pdf.titulo("5. Diagrama de relaciones (simplificado)")
pdf.codigo(
    "users -------- user_roles ---- roles\n"
    "  |\n"
    "  +--- work experience ---- companies\n"
    "  +--- education\n"
    "  +--- user_skill ----------------------------- skills\n"
    "  |                                                |\n"
    "  +--- jobs (poster_user_id) --- companies         |\n"
    "  |      |                                         |\n"
    "  |      +--- job_skill --------------------------++\n"
    "  |      |\n"
    "  |      +--- applications\n"
    "  |\n"
    "  +--- groups (admin_id)\n"
    "  |      |\n"
    "  |      +--- group_members\n"
    "  |\n"
    "  (conexiones) -----> Neo4j (implementacion futura)"
)

# ── 6. Arquitectura
pdf.titulo("6. Integracion en la arquitectura del sistema")
pdf.parrafo(
    "El backend Flask expone una API REST organizada en blueprints por dominio. "
    "Cada blueprint interactua con Supabase mediante el cliente supabase_admin:"
)
pdf.bullet("/auth     -> auth_bp:    registro, login, recuperacion de contrasena, eliminacion de cuenta.")
pdf.bullet("/profile  -> profile_bp: perfil, foto (Supabase Storage), experiencia, educacion, habilidades.")
pdf.bullet("/jobs     -> jobs_bp:    ofertas, postulaciones, gestion de candidatos.")
pdf.bullet("/groups   -> groups_bp:  creacion de grupos, membresia, listado de miembros.")
pdf.ln(2)
pdf.parrafo("Las notificaciones (RF6) se implementaran con Cassandra. Las conexiones entre usuarios (RF2) se implementaran con Neo4j.")

# ── 7. Comparacion
pdf.titulo("7. Comparacion con las otras bases del proyecto")
pdf.ln(1)

anchos2 = [38, 38, 38, 38, 38]
pdf.tabla_encabezado(["Criterio", "SQL", "MongoDB", "Cassandra", "Neo4j"], anchos2)
comp = [
    ("Caso de uso", "Usuarios, empleos, grupos", "Feed social", "Notif., mensajes", "Conexiones"),
    ("Relaciones", "FK, JOINs, CASCADE", "Referencias manuales", "Partition key", "Aristas del grafo"),
    ("Esquema", "Fijo, tabular", "Flexible, JSON", "Columnar", "Nodos y aristas"),
    ("Fortaleza", "Integridad, ACID", "Vol. escrituras", "Alta disponib.", "Traversals"),
]
for i, fila in enumerate(comp):
    pdf.tabla_fila(list(fila), anchos2, fill=(i % 2 == 0))
pdf.ln(4)

# ── 8. Conclusion
pdf.titulo("8. Conclusion")
pdf.parrafo("La eleccion de SQL para los modulos de autenticacion, perfiles, empleos y grupos esta justificada por:")
pdf.bullet("Integridad referencial: claves foraneas con ON DELETE CASCADE garantizan consistencia.")
pdf.bullet("Normalizacion: skills y companies son entidades compartidas sin duplicacion.")
pdf.bullet("Unicidad: email, DNI, postulaciones y membresías unicas a nivel de esquema.")
pdf.bullet("Transacciones ACID: operaciones criticas son atomicas bajo fallas o concurrencia.")
pdf.bullet("Triggers: updated_at automatico sin logica adicional en el backend.")
pdf.bullet("Consultas complejas: JOINs eficientes a traves de PostgREST en una sola operacion.")

out = r"c:\Users\maria\Desktop\tpoLinkedin\TPO-Linkedin\docs\sql-justificacion.pdf"
pdf.output(out)
print(f"PDF generado: {out}")

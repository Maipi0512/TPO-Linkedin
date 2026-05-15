# Modelo de datos políglota — Simulación LinkedIn

> Documento de diseño del modelo de datos derivado del **DRL** (Diagrama Relacional Lógico) y los **Requerimientos Funcionales y No Funcionales** del Trabajo Práctico.

## 1. Introducción

El sistema adopta una arquitectura de **persistencia políglota** (polyglot persistence), utilizando 4 motores de bases de datos, cada uno aplicado al subconjunto de datos para el que es óptimo:

- **Cloud SQL** (relacional, MySQL/PostgreSQL gestionado por Google) — datos estructurados, integridad referencial, transacciones ACID
- **MongoDB** (documental) — contenido publicado con esquema flexible y multimedia variable
- **Neo4j** (grafo) — red de relaciones entre personas, empresas y habilidades
- **Apache Cassandra** (columnar / wide-column) — eventos masivos en el tiempo (mensajes, notificaciones, feed)

Cada decisión de asignar una entidad a un motor está justificada por uno o más Requerimientos Funcionales (RF) o No Funcionales (RNF) explícitos del enunciado del TP.

---

## 2. Resumen ejecutivo — matriz de reparto

| Entidad del DRL | Motor asignado | RF / RNF que lo justifican |
|---|---|---|
| User | Cloud SQL | RF1 (auth con email único), RF2 (gestión de roles), RNF9 (bcrypt), RNF10 (eliminación de cuenta requiere ACID) |
| Company | Cloud SQL | Catálogo estable con integridad referencial hacia Job y WorkExperience |
| WorkExperience | Cloud SQL | FK fuerte a User y Company, esquema fijo (cargo, fechas) |
| Education | Cloud SQL | FK fuerte a User, esquema fijo (institución, título, fechas) |
| Skill | Cloud SQL | Catálogo central, integridad N:M con User y Job |
| UserSkill (puente) | Cloud SQL | Relación N:M usuario-habilidad con atributo nivel |
| Job | Cloud SQL | RF15 (publicación de empleos), atributos fijos (título, horario, turno) |
| JobSkill (puente) | Cloud SQL | Relación N:M empleo-habilidad. **Replicado en Neo4j para RF5** |
| Application | Cloud SQL | RF3 (registro de estado), RF14, RF16, transaccionalidad |
| Post | MongoDB | RF10 (multimedia variable: texto/imagen/video/artículo), tags, group_id opcional |
| Comment | MongoDB | RF11, alto volumen, asociado a Post |
| Group | MongoDB | RF12, esquema flexible (tema, descripción, array de miembros embebido) |
| Event | MongoDB | Variante de Post con location + date (decisión de diseño explicada en §6) |
| Connection | Neo4j | RF6 (recomendación de contactos), RF9 (gestión de conexiones), RNF3 (consultas de grafo <1s) |
| Notification | Cassandra | RF4 (generación automática), RF17 (ordenadas por fecha), RNF1 (<500ms), RNF2 (alto volumen) |
| DirectMessage | Cassandra | RF13, RNF1, RNF2 |
| GroupMessage | Cassandra | RF7, RNF2 (mensaje grupal genera N notificaciones) |
| Feed (timeline materializado) | Cassandra | RNF1 (feed <500ms) — vista pre-computada por usuario |

---

## 3. Diseño por motor

### 3.1 Cloud SQL — la fuente de verdad

**Por qué SQL aquí:** los datos identificatorios, las relaciones laborales y las postulaciones requieren **integridad referencial fuerte** y **transacciones ACID**. RNF9 exige almacenar contraseñas con bcrypt. RNF10 (derecho a la eliminación de cuenta) implica cascadas controladas que SQL hace nativamente.

**Esquema lógico:**

```sql
-- Identidad y autenticación
users (
    user_id PK,
    dni UNIQUE,
    email UNIQUE NOT NULL,
    password_hash NOT NULL,   -- bcrypt (RNF9)
    name, surname,
    profile_photo_url,
    created_at, updated_at
)

-- RF2: gestión de roles (un usuario puede tener varios roles)
roles (role_id PK, name UNIQUE)        -- 'candidate', 'poster'
user_roles (user_id FK, role_id FK)    -- N:M

-- Perfil profesional
work_experience (
    we_id PK, user_id FK, company_id FK,
    title, description,
    from_date, end_date NULL,
    is_current
)

education (
    edu_id PK, user_id FK,
    title, field, institution,
    from_date, end_date NULL,
    is_actual
)

-- Catálogo de habilidades
skills (skill_id PK, name UNIQUE, type)  -- type: técnica | blanda
user_skill (user_id FK, skill_id FK, level)

-- Empresas y empleos
companies (company_id PK, name, slogan NULL, num_employees, location)

jobs (
    job_id PK, company_id FK, poster_user_id FK,
    title, description, location,
    working_hours, shift, is_active,
    created_at, updated_at
)
job_skill (job_id FK, skill_id FK)     -- N:M para matching (RF5)

-- Postulaciones
applications (
    application_id PK, user_id FK, job_id FK,
    applied_at, status, updated_at,
    UNIQUE (user_id, job_id)
)
-- status: submitted, in_review, in_process, successful, rejected
```

### 3.2 MongoDB — contenido publicado

**Por qué documental aquí:** el PDF (página 3) describe que un Post puede ser **"un artículo largo, un breve texto o contenido multimedia"**. Eso significa que el esquema **no es fijo**. Forzar esto en SQL implicaría columnas mayormente nulas o herencia de tablas (anti-patrón). En Mongo cada documento adopta la forma que necesita.

**Colecciones y forma de documento:**

```json
// Colección: posts
{
  "_id": ObjectId,
  "tipo": "post" | "event" | "article",
  "autor_id": 42,
  "body": "Texto del post",
  "media_urls": ["https://...", "https://..."],
  "tags": ["#aprendizaje", "#noSQL"],
  "group_id": null,
  "likes_count": 23,
  "created_at": ISODate,
  "event_location": "Buenos Aires",
  "event_date": ISODate
}

// Colección: comments
{
  "_id": ObjectId,
  "post_id": ObjectId,
  "autor_id": 42,
  "body": "¡Felicitaciones!",
  "created_at": ISODate
}

// Colección: groups
{
  "_id": ObjectId,
  "name": "Mongo Lovers",
  "tema": "Bases de datos NoSQL",
  "descripcion": "Grupo para discutir Mongo",
  "admin_id": 42,
  "members": [42, 88, 102],
  "created_at": ISODate
}
```

### 3.3 Neo4j — la red de relaciones

**Por qué grafo aquí:** RF6 pide recomendar contactos basándose en **"contactos en común Y empresas en las que trabajaron o trabajan"**. Esto cruza dos tipos de relaciones (amistad y empleo) en una sola consulta. RNF3 exige consultas de **2do y 3er grado en <1s para 500 contactos**.

**Modelo (nodos y relaciones):**

```cypher
// Nodos — solo IDs + nombre cache
(:Persona {user_id: 42, nombre_cache: "María Paz"})
(:Empresa {company_id: 7, nombre_cache: "Google"})
(:Habilidad {skill_id: 3, nombre_cache: "Python", type: "técnica"})

// Relaciones
(:Persona)-[:CONECTADO_CON {desde, status}]->(:Persona)
(:Persona)-[:TRABAJÓ_EN {cargo, desde, hasta}]->(:Empresa)
(:Persona)-[:ESTUDIÓ_EN {titulo, desde, hasta}]->(:Institucion)
(:Persona)-[:TIENE_HABILIDAD {nivel}]->(:Habilidad)
(:Job {job_id: 99})-[:REQUIERE]->(:Habilidad)
```

**Ejemplo de consulta (RF6 — personas que quizá conozcas):**

```cypher
MATCH (yo:Persona {user_id: $userId})-[:CONECTADO_CON]->(amigo)-[:CONECTADO_CON]->(sugerido)
WHERE NOT (yo)-[:CONECTADO_CON]->(sugerido) AND yo <> sugerido
RETURN sugerido, count(amigo) AS amigos_en_comun
ORDER BY amigos_en_comun DESC LIMIT 10;
```

### 3.4 Apache Cassandra — eventos en el tiempo

**Por qué columnar aquí:** RNF2 dice literalmente que mensajes y notificaciones deben soportar **alto volumen de escritura concurrente sin degradar el tiempo de respuesta**. RNF1 pide feed/notificaciones <500ms.

**Tablas (modeladas por queries):**

```sql
CREATE TABLE notifications_by_user (
    user_id BIGINT,
    created_at TIMEUUID,
    notification_id UUID,
    type TEXT,
    body TEXT,
    is_read BOOLEAN,
    PRIMARY KEY (user_id, created_at)
) WITH CLUSTERING ORDER BY (created_at DESC);

CREATE TABLE direct_messages_by_conversation (
    conversation_id UUID,
    sent_at TIMEUUID,
    sender_id BIGINT,
    body TEXT,
    status TEXT,
    PRIMARY KEY (conversation_id, sent_at)
);

CREATE TABLE group_messages_by_group (
    group_id UUID,
    sent_at TIMEUUID,
    sender_id BIGINT,
    body TEXT,
    PRIMARY KEY (group_id, sent_at)
);

CREATE TABLE feed_by_user (
    user_id BIGINT,
    timestamp TIMEUUID,
    post_id TEXT,
    autor_id BIGINT,
    preview TEXT,
    PRIMARY KEY (user_id, timestamp)
) WITH CLUSTERING ORDER BY (timestamp DESC);
```

---

## 4. El pegamento — cómo se conectan los 4 motores

El `user_id` de Cloud SQL es la **referencia universal**. Aparece como:

| En Cloud SQL | `user_id` (BIGINT, PK) — fuente de verdad |
| En MongoDB | `autor_id` en posts/comments, `members[]` en groups |
| En Neo4j | `user_id` en nodo Persona |
| En Cassandra | Partition key en las 4 tablas |

**Flujo de ejemplo: usuario abre su feed**

1. Cloud SQL → validar sesión, cargar datos del usuario
2. Cassandra → `feed_by_user(user_id)` devuelve IDs de posts
3. MongoDB → `posts.find({_id: {$in: [...]}})` trae contenido
4. Neo4j → personas que quizá conozcas
5. Cassandra → notificaciones recientes

---

## 5. Trazabilidad — RF/RNF → motor

| Req. | Descripción | Motor |
|---|---|---|
| RF1 | Auth y sesión | Cloud SQL |
| RF2 | Gestión de roles | Cloud SQL |
| RF3 | Registro de estado de postulación | Cloud SQL |
| RF4 | Notificaciones automáticas | Cassandra |
| RF5 | Matching de habilidades | Cloud SQL + Neo4j |
| RF6 | Recomendación de contactos | Neo4j |
| RF7 | Mensajería grupal | Cassandra |
| RF8 | Membresías | MongoDB (groups.members) |
| RF9 | Gestión de conexiones | Neo4j + Cassandra |
| RF10 | Publicaciones en el feed | MongoDB + Cassandra |
| RF11 | Comentarios y reacciones | MongoDB |
| RF12 | Grupos | MongoDB |
| RF13 | Mensajería directa | Cassandra |
| RF14-16 | Empleos y postulaciones | Cloud SQL |
| RF17 | Listado de notificaciones | Cassandra |
| RNF1 | Respuesta <500ms | Cassandra (partition key) |
| RNF2 | Escalabilidad escritura | Cassandra |
| RNF3 | Consultas grafo <1s | Neo4j |
| RNF9 | bcrypt para contraseñas | Cloud SQL |
| RNF10 | Privacidad / derecho al olvido | Cloud SQL + jobs NoSQL |
| RNF12 | Mantenibilidad modular | Arquitectura backend |

---

## 6. Decisiones de diseño tomadas

### 6.1 Application sin historial inmutable
La tabla `applications` se actualiza in-place. Justificación: RF3 dice explícitamente "No se requiere un historial del estado de la postulación", prevalece sobre RNF11 por ser más específico.

### 6.2 Event como variante de Post en MongoDB
La entidad Event del DRL se modela como documento con `tipo: "event"` en la colección `posts`. Justificación: el PDF no describe Event como entidad separada; sus atributos son casi iguales a Post.

### 6.3 Matching de habilidades en ambos motores
La relación Job-Skill vive en SQL (fuente de verdad) y se replica en Neo4j para soportar RF5 con Cypher expresivo. Demuestra el paradigma políglota.

---

## 7. Riesgos y trade-offs

- **Consistencia eventual:** los nombres cache en Neo4j y los IDs replicados en Cassandra pueden quedar desincronizados por segundos. Aceptable porque la fuente de verdad es siempre SQL/MongoDB.
- **Sincronización:** cada operación multi-DB se hace con reintentos en memoria, sin transacciones distribuidas (2PC).
- **Costo operativo:** 4 motores corriendo es caro en producción, pero se justifica didácticamente.

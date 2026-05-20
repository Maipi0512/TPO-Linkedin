-- =============================================================
--  LinkPro - Esquema SQL (PostgreSQL / Supabase)
--  Ejecutar en el SQL Editor de Supabase o via init_db.py
-- =============================================================
--
--  CÓMO SE OBTIENEN LOS DATOS
--  El backend usa el SDK de Supabase (PostgREST) para realizar
--  consultas sin escribir SQL raw. Ejemplo de SELECT con JOIN:
--
--    supabase_admin.table("jobs")
--      .select("*, companies(name), job_skill(skills(skill_id, name, type))")
--      .eq("is_active", True)
--      .order("created_at", desc=True)
--      .execute()
--
--  Esto genera internamente:
--    SELECT jobs.*, companies.name, skills.skill_id, skills.name, skills.type
--    FROM jobs
--    LEFT JOIN companies ON jobs.company_id = companies.company_id
--    LEFT JOIN job_skill  ON job_skill.job_id = jobs.job_id
--    LEFT JOIN skills     ON skills.skill_id  = job_skill.skill_id
--    WHERE jobs.is_active = TRUE
--    ORDER BY jobs.created_at DESC
-- =============================================================


-- ── Extensiones ───────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- habilita gen_random_uuid()


-- ── Enum: estados de postulación ──────────────────────────────
-- Usado en la tabla applications.
-- Queries que lo usan:
--   INSERT INTO applications (status) VALUES ('submitted')
--   UPDATE applications SET status = 'in_review' WHERE application_id = $1
DO $$ BEGIN
    CREATE TYPE app_status AS ENUM (
        'submitted',    -- recién enviada
        'in_review',    -- el poster la está revisando
        'in_process',   -- en proceso de selección
        'successful',   -- aceptada
        'rejected'      -- rechazada
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- =============================================================
--  TABLA: users
--  Almacena los datos de cada usuario registrado.
--
--  QUERIES que se ejecutan desde el backend:
--
--  REGISTRO (auth.py):
--    INSERT INTO users (user_id, email, password_hash, name, surname, dni)
--    VALUES ($1, $2, $3, $4, $5, $6)
--
--  LOGIN (auth.py):
--    SELECT user_id, email, name, surname, dni, profile_photo_url, password_hash
--    FROM users WHERE email = $1 LIMIT 1
--
--  ACTUALIZAR PERFIL (profile.py):
--    UPDATE users SET name=$1, surname=$2, dni=$3, updated_at=now()
--    WHERE user_id = $4
--
--  ACTUALIZAR FOTO (profile.py):
--    UPDATE users SET profile_photo_url=$1 WHERE user_id = $2
--
--  CAMBIAR CONTRASEÑA (auth.py - reset):
--    UPDATE users SET password_hash=$1 WHERE user_id = $2
-- =============================================================
CREATE TABLE IF NOT EXISTS users (
    user_id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    email             TEXT        NOT NULL UNIQUE,
    password_hash     TEXT        NOT NULL,
    name              TEXT        NOT NULL,
    surname           TEXT,
    dni               TEXT        UNIQUE,
    profile_photo_url TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- =============================================================
--  TABLAS: roles y user_roles
--  Catálogo de roles ('candidato', 'poster') y su asignación
--  a usuarios. Un usuario puede tener uno o ambos roles.
--
--  QUERIES:
--
--  OBTENER ROLES DE UN USUARIO (auth.py):
--    SELECT roles.name FROM user_roles
--    JOIN roles ON user_roles.role_id = roles.role_id
--    WHERE user_roles.user_id = $1
--
--  ASIGNAR ROL AL REGISTRAR (auth.py):
--    INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)
-- =============================================================
CREATE TABLE IF NOT EXISTS roles (
    role_id  SERIAL PRIMARY KEY,
    name     TEXT   NOT NULL UNIQUE   -- 'candidato' | 'poster'
);

CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID    NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    role_id INTEGER NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

INSERT INTO roles (name) VALUES ('candidato'), ('poster')
ON CONFLICT (name) DO NOTHING;


-- =============================================================
--  TABLA: companies
--  Empresas que pueden estar asociadas a ofertas de empleo
--  y a la experiencia laboral del perfil.
--
--  QUERIES:
--
--  BUSCAR O CREAR EMPRESA AL REGISTRAR POSTER (auth.py):
--    SELECT company_id FROM companies WHERE name ILIKE $1 LIMIT 1
--    INSERT INTO companies (company_id, name) VALUES ($1, $2)
--
--  OBTENER NOMBRE AL LISTAR EMPLEOS (jobs.py):
--    SELECT jobs.*, companies.name FROM jobs
--    LEFT JOIN companies ON jobs.company_id = companies.company_id
-- =============================================================
CREATE TABLE IF NOT EXISTS companies (
    company_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       TEXT NOT NULL
);


-- =============================================================
--  TABLA: "work experience"
--  Experiencia laboral del perfil de cada usuario.
--  Nombre con espacio requerido por el backend.
--
--  QUERIES:
--
--  OBTENER EXPERIENCIA DEL PERFIL (profile.py):
--    SELECT "work experience".*, companies.name
--    FROM "work experience"
--    LEFT JOIN companies ON "work experience".company_id = companies.company_id
--    WHERE user_id = $1
--    ORDER BY from_date DESC
--
--  AGREGAR EXPERIENCIA (profile.py):
--    INSERT INTO "work experience"
--      (user_id, company_id, title, description, from_date, end_date, is_current)
--    VALUES ($1, $2, $3, $4, $5, $6, $7)
--
--  ELIMINAR EXPERIENCIA (profile.py):
--    DELETE FROM "work experience" WHERE we_id=$1 AND user_id=$2
-- =============================================================
CREATE TABLE IF NOT EXISTS "work experience" (
    we_id       SERIAL  PRIMARY KEY,
    user_id     UUID    NOT NULL REFERENCES users(user_id)  ON DELETE CASCADE,
    company_id  UUID    REFERENCES companies(company_id)    ON DELETE SET NULL,
    title       TEXT    NOT NULL,
    description TEXT,
    from_date   DATE    NOT NULL,
    end_date    DATE,
    is_current  BOOLEAN NOT NULL DEFAULT FALSE
);


-- =============================================================
--  TABLA: education
--  Educación formal del perfil de cada usuario.
--
--  QUERIES:
--
--  OBTENER EDUCACIÓN (profile.py):
--    SELECT * FROM education WHERE user_id=$1 ORDER BY from_date DESC
--
--  AGREGAR EDUCACIÓN (profile.py):
--    INSERT INTO education
--      (user_id, title, field, institution, from_date, end_date, is_actual)
--    VALUES ($1, $2, $3, $4, $5, $6, $7)
--
--  ELIMINAR EDUCACIÓN (profile.py):
--    DELETE FROM education WHERE edu_id=$1 AND user_id=$2
-- =============================================================
CREATE TABLE IF NOT EXISTS education (
    edu_id      SERIAL  PRIMARY KEY,
    user_id     UUID    NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    title       TEXT    NOT NULL,
    field       TEXT,
    institution TEXT    NOT NULL,
    from_date   DATE,
    end_date    DATE,
    is_actual   BOOLEAN NOT NULL DEFAULT FALSE
);


-- =============================================================
--  TABLAS: skills y user_skill
--  Catálogo de habilidades compartido entre perfiles y ofertas.
--  user_skill vincula al usuario con sus habilidades y nivel.
--
--  QUERIES:
--
--  BUSCAR O CREAR SKILL (profile.py):
--    SELECT skill_id FROM skills WHERE name ILIKE $1 LIMIT 1
--    INSERT INTO skills (name, type) VALUES ($1, $2)
--
--  AGREGAR HABILIDAD AL PERFIL (profile.py):
--    INSERT INTO user_skill (user_id, skill_id, level) VALUES ($1, $2, $3)
--    ON CONFLICT (user_id, skill_id) DO UPDATE SET level=$3
--
--  OBTENER HABILIDADES DEL PERFIL (profile.py):
--    SELECT user_skill.level, skills.skill_id, skills.name, skills.type
--    FROM user_skill JOIN skills ON user_skill.skill_id = skills.skill_id
--    WHERE user_skill.user_id = $1
--
--  ELIMINAR HABILIDAD (profile.py):
--    DELETE FROM user_skill WHERE user_id=$1 AND skill_id=$2
-- =============================================================
CREATE TABLE IF NOT EXISTS skills (
    skill_id SERIAL PRIMARY KEY,
    name     TEXT   NOT NULL,
    type     TEXT   NOT NULL DEFAULT 'técnica'  -- 'técnica' | 'blanda'
);

CREATE TABLE IF NOT EXISTS user_skill (
    user_id  UUID    NOT NULL REFERENCES users(user_id)   ON DELETE CASCADE,
    skill_id INTEGER NOT NULL REFERENCES skills(skill_id) ON DELETE CASCADE,
    level    TEXT    NOT NULL DEFAULT 'Principiante',      -- 'Principiante' | 'Intermedio' | 'Avanzado'
    PRIMARY KEY (user_id, skill_id)
);


-- =============================================================
--  TABLAS: jobs y job_skill
--  Ofertas de empleo publicadas por usuarios con rol poster.
--  job_skill relaciona cada oferta con sus habilidades requeridas.
--
--  QUERIES:
--
--  LISTAR OFERTAS ACTIVAS (jobs.py):
--    SELECT jobs.*, companies.name,
--           job_skill.skill_id, skills.name, skills.type
--    FROM jobs
--    LEFT JOIN companies ON jobs.company_id = companies.company_id
--    LEFT JOIN job_skill  ON job_skill.job_id = jobs.job_id
--    LEFT JOIN skills     ON skills.skill_id  = job_skill.skill_id
--    WHERE jobs.is_active = TRUE
--    ORDER BY jobs.created_at DESC
--
--  CREAR OFERTA (jobs.py):
--    INSERT INTO jobs
--      (job_id, poster_user_id, company_id, title, description,
--       location, shift, modality, is_active)
--    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,TRUE)
--
--  AGREGAR SKILL A OFERTA (jobs.py):
--    INSERT INTO job_skill (job_id, skill_id) VALUES ($1, $2)
--
--  ELIMINAR OFERTA (jobs.py):
--    DELETE FROM jobs WHERE job_id=$1
--    -- ON DELETE CASCADE elimina automáticamente job_skill y applications
--
--  LISTAR OFERTAS DE UN POSTER (jobs.py):
--    SELECT jobs.*, companies.name FROM jobs
--    LEFT JOIN companies ON jobs.company_id = companies.company_id
--    WHERE jobs.poster_user_id = $1
--    ORDER BY jobs.created_at DESC
-- =============================================================
CREATE TABLE IF NOT EXISTS jobs (
    job_id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    poster_user_id UUID        NOT NULL REFERENCES users(user_id)  ON DELETE CASCADE,
    company_id     UUID        REFERENCES companies(company_id)     ON DELETE SET NULL,
    title          TEXT        NOT NULL,
    description    TEXT,
    location       TEXT,
    shift          TEXT        NOT NULL DEFAULT 'full-time',    -- 'full-time' | 'part-time' | 'freelance'
    modality       TEXT        NOT NULL DEFAULT 'presencial',   -- 'presencial' | 'hibrido' | 'remoto'
    is_active      BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS job_skill (
    job_id   UUID    NOT NULL REFERENCES jobs(job_id)      ON DELETE CASCADE,
    skill_id INTEGER NOT NULL REFERENCES skills(skill_id)  ON DELETE CASCADE,
    PRIMARY KEY (job_id, skill_id)
);


-- =============================================================
--  TABLA: applications
--  Postulaciones de candidatos a ofertas de empleo.
--  UNIQUE (job_id, user_id) impide postulaciones duplicadas.
--
--  QUERIES:
--
--  POSTULARSE A UNA OFERTA (jobs.py):
--    INSERT INTO applications (application_id, job_id, user_id, status)
--    VALUES ($1, $2, $3, 'submitted')
--
--  VER MIS POSTULACIONES (jobs.py - candidato):
--    SELECT applications.*, jobs.job_id, jobs.title, companies.name,
--           users.user_id, users.name, users.surname, users.email
--    FROM applications
--    LEFT JOIN jobs      ON applications.job_id  = jobs.job_id
--    LEFT JOIN companies ON jobs.company_id       = companies.company_id
--    LEFT JOIN users     ON applications.user_id  = users.user_id
--    WHERE applications.user_id = $1
--    ORDER BY applications.applied_at DESC
--
--  VER POSTULANTES DE UNA OFERTA (jobs.py - poster):
--    SELECT applications.*, users.name, users.surname, users.email,
--           users.profile_photo_url
--    FROM applications
--    JOIN users ON applications.user_id = users.user_id
--    WHERE applications.job_id = $1
--
--  CAMBIAR ESTADO (jobs.py - poster):
--    UPDATE applications SET status=$1, updated_at=now()
--    WHERE application_id=$2
-- =============================================================
CREATE TABLE IF NOT EXISTS applications (
    application_id UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id         UUID        NOT NULL REFERENCES jobs(job_id)   ON DELETE CASCADE,
    user_id        UUID        NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    status         app_status  NOT NULL DEFAULT 'submitted',
    applied_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (job_id, user_id)
);


-- =============================================================
--  ÍNDICES
--  Aceleran las consultas más frecuentes del sistema.
-- =============================================================
CREATE INDEX IF NOT EXISTS idx_user_roles_user  ON user_roles (user_id);
CREATE INDEX IF NOT EXISTS idx_work_exp_user     ON "work experience" (user_id);
CREATE INDEX IF NOT EXISTS idx_education_user    ON education (user_id);
CREATE INDEX IF NOT EXISTS idx_user_skill_user   ON user_skill (user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_poster       ON jobs (poster_user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_company      ON jobs (company_id);
CREATE INDEX IF NOT EXISTS idx_job_skill_job     ON job_skill (job_id);
CREATE INDEX IF NOT EXISTS idx_applications_job  ON applications (job_id);
CREATE INDEX IF NOT EXISTS idx_applications_user ON applications (user_id);


-- =============================================================
--  TRIGGER: updated_at automático
--  Se ejecuta automáticamente en cada UPDATE para mantener
--  el campo updated_at sincronizado sin lógica en el backend.
-- =============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE TRIGGER trg_applications_updated_at
    BEFORE UPDATE ON applications
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

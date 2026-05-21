-- =============================================================
--  LinkPro - Esquema SQL (PostgreSQL / Supabase)
--  Sincronizado con el estado real de la nube (Mayo 2026)
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
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- =============================================================
--  1. IDENTIDAD Y AUTENTICACIÓN
-- =============================================================

-- QUERIES (auth.py):
--   INSERT INTO users (user_id, email, password_hash, name, surname, dni) VALUES (...)
--   SELECT user_id, email, name, surname, dni, profile_photo_url, password_hash FROM users WHERE email=$1
--   UPDATE users SET name=$1, surname=$2, dni=$3, updated_at=now() WHERE user_id=$4
--   UPDATE users SET profile_photo_url=$1 WHERE user_id=$2
--   UPDATE users SET password_hash=$1 WHERE user_id=$2
--   DELETE FROM users WHERE user_id=$1  (cascada automática a todas las tablas hijas)
CREATE TABLE IF NOT EXISTS users (
    user_id           VARCHAR(36)  PRIMARY KEY,
    email             VARCHAR(255) NOT NULL UNIQUE,
    password_hash     VARCHAR(255) NOT NULL,
    name              VARCHAR(100) NOT NULL,
    surname           VARCHAR(100),
    dni               VARCHAR(20)  UNIQUE,
    profile_photo_url VARCHAR(512),
    created_at        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- QUERIES (auth.py):
--   SELECT roles.name FROM user_roles JOIN roles ON user_roles.role_id=roles.role_id WHERE user_id=$1
--   INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)
CREATE TABLE IF NOT EXISTS roles (
    role_id SERIAL       PRIMARY KEY,
    name    VARCHAR(50)  NOT NULL UNIQUE   -- 'candidato' | 'poster'
);

CREATE TABLE IF NOT EXISTS user_roles (
    user_id VARCHAR(36) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    role_id INTEGER     NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

INSERT INTO roles (name) VALUES ('candidato'), ('poster')
ON CONFLICT (name) DO NOTHING;


-- =============================================================
--  2. PERFIL PROFESIONAL
-- =============================================================

-- QUERIES (auth.py / profile.py):
--   SELECT company_id FROM companies WHERE name ILIKE $1 LIMIT 1
--   INSERT INTO companies (company_id, name, slogan, num_employees, location) VALUES (...)
--   SELECT jobs.*, companies.name FROM jobs LEFT JOIN companies ON jobs.company_id=companies.company_id
CREATE TABLE IF NOT EXISTS companies (
    company_id    VARCHAR(36)  PRIMARY KEY,
    name          VARCHAR(150) NOT NULL,
    slogan        VARCHAR(255),
    num_employees INTEGER,
    location      VARCHAR(150)
);

-- QUERIES (profile.py):
--   SELECT we.*, companies.name FROM "work experience" we
--     LEFT JOIN companies ON we.company_id=companies.company_id WHERE we.user_id=$1 ORDER BY from_date DESC
--   INSERT INTO "work experience" (user_id, company_id, title, description, from_date, end_date, is_current) VALUES (...)
--   DELETE FROM "work experience" WHERE we_id=$1 AND user_id=$2
CREATE TABLE IF NOT EXISTS "work experience" (
    we_id       SERIAL      PRIMARY KEY,
    user_id     VARCHAR(36) NOT NULL REFERENCES users(user_id)      ON DELETE CASCADE,
    company_id  VARCHAR(36)          REFERENCES companies(company_id) ON DELETE SET NULL,
    title       VARCHAR(100) NOT NULL,
    description TEXT,
    from_date   DATE         NOT NULL,
    end_date    DATE,
    is_current  BOOLEAN      DEFAULT FALSE
);

-- QUERIES (profile.py):
--   SELECT * FROM education WHERE user_id=$1 ORDER BY from_date DESC
--   INSERT INTO education (user_id, title, field, institution, from_date, end_date, is_actual) VALUES (...)
--   DELETE FROM education WHERE edu_id=$1 AND user_id=$2
CREATE TABLE IF NOT EXISTS education (
    edu_id      SERIAL      PRIMARY KEY,
    user_id     VARCHAR(36) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    title       VARCHAR(100) NOT NULL,
    field       VARCHAR(100),
    institution VARCHAR(150) NOT NULL,
    from_date   DATE,
    end_date    DATE,
    is_actual   BOOLEAN DEFAULT FALSE
);

-- QUERIES (profile.py):
--   SELECT skill_id FROM skills WHERE name ILIKE $1 LIMIT 1
--   INSERT INTO skills (name, type) VALUES ($1, $2)
--   INSERT INTO user_skill (user_id, skill_id, level) VALUES (...) ON CONFLICT DO UPDATE SET level=$3
--   SELECT us.level, s.skill_id, s.name, s.type FROM user_skill us JOIN skills s ON us.skill_id=s.skill_id WHERE us.user_id=$1
--   DELETE FROM user_skill WHERE user_id=$1 AND skill_id=$2
CREATE TABLE IF NOT EXISTS skills (
    skill_id SERIAL      PRIMARY KEY,
    name     VARCHAR(100) NOT NULL UNIQUE,
    type     VARCHAR(50)            -- 'técnica' | 'blanda'
);

CREATE TABLE IF NOT EXISTS user_skill (
    user_id  VARCHAR(36) NOT NULL REFERENCES users(user_id)   ON DELETE CASCADE,
    skill_id INTEGER     NOT NULL REFERENCES skills(skill_id) ON DELETE CASCADE,
    level    VARCHAR(50),           -- 'Principiante' | 'Intermedio' | 'Avanzado'
    PRIMARY KEY (user_id, skill_id)
);


-- =============================================================
--  3. EMPRESAS Y EMPLEOS
-- =============================================================

-- QUERIES (jobs.py):
--   INSERT INTO jobs (job_id, poster_user_id, company_id, title, description,
--     location, working_hours, shift, modality, employment_type, is_active) VALUES (...)
--   SELECT jobs.*, companies.name, job_skill.skill_id, skills.name, skills.type FROM jobs
--     LEFT JOIN companies ON jobs.company_id=companies.company_id
--     LEFT JOIN job_skill ON job_skill.job_id=jobs.job_id
--     LEFT JOIN skills    ON skills.skill_id=job_skill.skill_id
--     WHERE jobs.is_active=TRUE ORDER BY jobs.created_at DESC
--   DELETE FROM jobs WHERE job_id=$1  (cascada automática a job_skill y applications)
CREATE TABLE IF NOT EXISTS jobs (
    job_id          VARCHAR(36)  PRIMARY KEY,
    poster_user_id  VARCHAR(36)  NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    company_id      VARCHAR(36)           REFERENCES companies(company_id),
    title           VARCHAR(150) NOT NULL,
    description     TEXT,
    location        VARCHAR(150),
    working_hours   INTEGER,               -- horas semanales
    shift           VARCHAR(50),           -- 'full-time' | 'part-time' | 'freelance'
    modality        VARCHAR(50)  DEFAULT 'presencial',  -- 'presencial' | 'hibrido' | 'remoto'
    employment_type VARCHAR(50)  DEFAULT 'full-time',
    is_active       BOOLEAN      DEFAULT TRUE,
    created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- QUERIES (jobs.py):
--   INSERT INTO job_skill (job_id, skill_id) VALUES ($1, $2)
CREATE TABLE IF NOT EXISTS job_skill (
    job_id   VARCHAR(36) NOT NULL REFERENCES jobs(job_id)      ON DELETE CASCADE,
    skill_id INTEGER     NOT NULL REFERENCES skills(skill_id)  ON DELETE CASCADE,
    PRIMARY KEY (job_id, skill_id)
);


-- =============================================================
--  4. POSTULACIONES
-- =============================================================

-- QUERIES (jobs.py):
--   INSERT INTO applications (application_id, job_id, user_id, status) VALUES (...)
--   SELECT applications.*, jobs.title, companies.name, users.name, users.surname, users.email
--     FROM applications LEFT JOIN jobs ... LEFT JOIN companies ... LEFT JOIN users ...
--     WHERE applications.user_id=$1 ORDER BY applied_at DESC
--   UPDATE applications SET status=$1, updated_at=now() WHERE application_id=$2
CREATE TABLE IF NOT EXISTS applications (
    application_id VARCHAR(36) PRIMARY KEY,
    user_id        VARCHAR(36) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    job_id         VARCHAR(36) NOT NULL REFERENCES jobs(job_id)   ON DELETE CASCADE,
    applied_at     TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    status         VARCHAR(50) DEFAULT 'submitted',  -- submitted | in_review | in_process | successful | rejected
    updated_at     TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unq_user_job UNIQUE (user_id, job_id)
);


-- =============================================================
--  5. GRUPOS (membresía gestionada en SQL)
--     Los mensajes de grupo van a Cassandra (futura implementación)
-- =============================================================

-- QUERIES (futura implementación groups.py):
--   INSERT INTO groups (group_id, name, admin_id) VALUES (...)
--   INSERT INTO group_members (group_id, user_id, role) VALUES (...)
--   SELECT gm.*, users.name, users.surname FROM group_members gm JOIN users ON gm.user_id=users.user_id WHERE gm.group_id=$1
--   DELETE FROM group_members WHERE group_id=$1 AND user_id=$2
CREATE TABLE IF NOT EXISTS groups (
    group_id    VARCHAR(36)  PRIMARY KEY,
    name        VARCHAR(150) NOT NULL,
    description VARCHAR(300),
    admin_id    VARCHAR(36)  NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS group_members (
    group_id  VARCHAR(36) NOT NULL REFERENCES groups(group_id) ON DELETE CASCADE,
    user_id   VARCHAR(36) NOT NULL REFERENCES users(user_id)   ON DELETE CASCADE,
    role      VARCHAR(20) DEFAULT 'member',   -- 'admin' | 'member'
    joined_at TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (group_id, user_id)
);


-- =============================================================
--  ÍNDICES
-- =============================================================
CREATE INDEX IF NOT EXISTS idx_user_roles_user     ON user_roles (user_id);
CREATE INDEX IF NOT EXISTS idx_work_exp_user        ON "work experience" (user_id);
CREATE INDEX IF NOT EXISTS idx_education_user       ON education (user_id);
CREATE INDEX IF NOT EXISTS idx_user_skill_user      ON user_skill (user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_poster          ON jobs (poster_user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_company         ON jobs (company_id);
CREATE INDEX IF NOT EXISTS idx_job_skill_job        ON job_skill (job_id);
CREATE INDEX IF NOT EXISTS idx_applications_job     ON applications (job_id);
CREATE INDEX IF NOT EXISTS idx_applications_user    ON applications (user_id);
CREATE INDEX IF NOT EXISTS idx_groups_admin         ON groups (admin_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user   ON group_members (user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group  ON group_members (group_id);


-- =============================================================
--  TRIGGER: updated_at automático
-- =============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE TRIGGER trg_jobs_updated_at
    BEFORE UPDATE ON jobs
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE TRIGGER trg_applications_updated_at
    BEFORE UPDATE ON applications
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- =============================================================
--  SEGURIDAD: RLS deshabilitado (acceso vía service key)
-- =============================================================
ALTER TABLE users         DISABLE ROW LEVEL SECURITY;
ALTER TABLE roles         DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles    DISABLE ROW LEVEL SECURITY;
ALTER TABLE companies     DISABLE ROW LEVEL SECURITY;
ALTER TABLE "work experience" DISABLE ROW LEVEL SECURITY;
ALTER TABLE education     DISABLE ROW LEVEL SECURITY;
ALTER TABLE skills        DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_skill    DISABLE ROW LEVEL SECURITY;
ALTER TABLE jobs          DISABLE ROW LEVEL SECURITY;
ALTER TABLE job_skill     DISABLE ROW LEVEL SECURITY;
ALTER TABLE applications  DISABLE ROW LEVEL SECURITY;
ALTER TABLE groups        DISABLE ROW LEVEL SECURITY;
ALTER TABLE group_members DISABLE ROW LEVEL SECURITY;

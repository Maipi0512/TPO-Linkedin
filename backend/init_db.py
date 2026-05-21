"""
Inicializa la base de datos SQL en Supabase.

Uso (una sola vez, o cuando se agregan tablas nuevas):
    python init_db.py

Requiere DATABASE_URL en backend/.env:
    DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres
"""

import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ.get("DATABASE_URL", "")

try:
    import psycopg2
except ImportError:
    psycopg2 = None

SQL = """
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── 1. IDENTIDAD Y AUTENTICACIÓN ──────────────────────────────

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

CREATE TABLE IF NOT EXISTS roles (
    role_id SERIAL      PRIMARY KEY,
    name    VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS user_roles (
    user_id VARCHAR(36) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    role_id INTEGER     NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

INSERT INTO roles (name) VALUES ('candidato'), ('poster')
ON CONFLICT (name) DO NOTHING;

-- ── 2. PERFIL PROFESIONAL ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS companies (
    company_id    VARCHAR(36)  PRIMARY KEY,
    name          VARCHAR(150) NOT NULL,
    slogan        VARCHAR(255),
    num_employees INTEGER,
    location      VARCHAR(150)
);

CREATE TABLE IF NOT EXISTS "work experience" (
    we_id       SERIAL       PRIMARY KEY,
    user_id     VARCHAR(36)  NOT NULL REFERENCES users(user_id)       ON DELETE CASCADE,
    company_id  VARCHAR(36)           REFERENCES companies(company_id) ON DELETE SET NULL,
    title       VARCHAR(100) NOT NULL,
    description TEXT,
    from_date   DATE         NOT NULL,
    end_date    DATE,
    is_current  BOOLEAN      DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS education (
    edu_id      SERIAL       PRIMARY KEY,
    user_id     VARCHAR(36)  NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    title       VARCHAR(100) NOT NULL,
    field       VARCHAR(100),
    institution VARCHAR(150) NOT NULL,
    from_date   DATE,
    end_date    DATE,
    is_actual   BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS skills (
    skill_id SERIAL       PRIMARY KEY,
    name     VARCHAR(100) NOT NULL UNIQUE,
    type     VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS user_skill (
    user_id  VARCHAR(36) NOT NULL REFERENCES users(user_id)   ON DELETE CASCADE,
    skill_id INTEGER     NOT NULL REFERENCES skills(skill_id) ON DELETE CASCADE,
    level    VARCHAR(50),
    PRIMARY KEY (user_id, skill_id)
);

-- ── 3. EMPLEOS ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS jobs (
    job_id          VARCHAR(36)  PRIMARY KEY,
    poster_user_id  VARCHAR(36)  NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    company_id      VARCHAR(36)           REFERENCES companies(company_id),
    title           VARCHAR(150) NOT NULL,
    description     TEXT,
    location        VARCHAR(150),
    working_hours   INTEGER,
    shift           VARCHAR(50),
    modality        VARCHAR(50)  DEFAULT 'presencial',
    employment_type VARCHAR(50)  DEFAULT 'full-time',
    is_active       BOOLEAN      DEFAULT TRUE,
    created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS job_skill (
    job_id   VARCHAR(36) NOT NULL REFERENCES jobs(job_id)      ON DELETE CASCADE,
    skill_id INTEGER     NOT NULL REFERENCES skills(skill_id)  ON DELETE CASCADE,
    PRIMARY KEY (job_id, skill_id)
);

-- ── 4. POSTULACIONES ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS applications (
    application_id VARCHAR(36) PRIMARY KEY,
    user_id        VARCHAR(36) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    job_id         VARCHAR(36) NOT NULL REFERENCES jobs(job_id)   ON DELETE CASCADE,
    applied_at     TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    status         VARCHAR(50) DEFAULT 'submitted',
    updated_at     TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unq_user_job UNIQUE (user_id, job_id)
);

-- ── 5. HISTORIAL DE POSTULACIONES ─────────────────────────────

CREATE TABLE IF NOT EXISTS application_status_history (
    history_id     SERIAL      PRIMARY KEY,
    application_id VARCHAR(36) NOT NULL REFERENCES applications(application_id) ON DELETE CASCADE,
    status         VARCHAR(50) NOT NULL,
    changed_at     TIMESTAMP   DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_app_history_app ON application_status_history (application_id);

-- ── 6. GRUPOS ──────────────────────────────────────────────────

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
    role      VARCHAR(20) DEFAULT 'member',
    joined_at TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (group_id, user_id)
);

-- ── ÍNDICES ────────────────────────────────────────────────────

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

-- ── TRIGGERS updated_at ────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE TRIGGER trg_jobs_updated_at
    BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE TRIGGER trg_applications_updated_at
    BEFORE UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── RLS DESHABILITADO (acceso vía service key) ─────────────────

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
ALTER TABLE group_members              DISABLE ROW LEVEL SECURITY;
ALTER TABLE application_status_history DISABLE ROW LEVEL SECURITY;
"""


def init_db():
    if not DATABASE_URL:
        print("[init_db] Sin DATABASE_URL en .env — se omite la inicialización SQL.")
        return
    if psycopg2 is None:
        print("[init_db] psycopg2 no instalado — corré: pip install psycopg2-binary")
        return
    print("[init_db] Creando tablas SQL en Supabase...")
    try:
        conn = psycopg2.connect(DATABASE_URL, connect_timeout=10)
        conn.autocommit = True
        cur = conn.cursor()
        cur.execute(SQL)
        cur.close()
        conn.close()
        print("[init_db] Tablas listas.")
    except Exception as e:
        print(f"[init_db] Error: {e}")


if __name__ == "__main__":
    init_db()

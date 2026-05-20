"""
Inicializa la base de datos SQL en Supabase.

Uso (una sola vez, antes de arrancar el servidor):
    python init_db.py

Requiere DATABASE_URL en backend/.env:
    DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres
    (Settings → Database → Connection string → URI en el dashboard de Supabase)
"""

import os
import sys
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ.get("DATABASE_URL", "")

try:
    import psycopg2
except ImportError:
    psycopg2 = None

SQL = """
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
    CREATE TYPE app_status AS ENUM ('submitted','in_review','in_process','successful','rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

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

CREATE TABLE IF NOT EXISTS roles (
    role_id  SERIAL PRIMARY KEY,
    name     TEXT   NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID    NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    role_id INTEGER NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

INSERT INTO roles (name) VALUES ('candidato'), ('poster')
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS companies (
    company_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "work experience" (
    we_id       SERIAL  PRIMARY KEY,
    user_id     UUID    NOT NULL REFERENCES users(user_id)    ON DELETE CASCADE,
    company_id  UUID    REFERENCES companies(company_id)      ON DELETE SET NULL,
    title       TEXT    NOT NULL,
    description TEXT,
    from_date   DATE    NOT NULL,
    end_date    DATE,
    is_current  BOOLEAN NOT NULL DEFAULT FALSE
);

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

CREATE TABLE IF NOT EXISTS skills (
    skill_id SERIAL PRIMARY KEY,
    name     TEXT   NOT NULL,
    type     TEXT   NOT NULL DEFAULT 'técnica'
);

CREATE TABLE IF NOT EXISTS user_skill (
    user_id  UUID    NOT NULL REFERENCES users(user_id)   ON DELETE CASCADE,
    skill_id INTEGER NOT NULL REFERENCES skills(skill_id) ON DELETE CASCADE,
    level    TEXT    NOT NULL DEFAULT 'Principiante',
    PRIMARY KEY (user_id, skill_id)
);

CREATE TABLE IF NOT EXISTS jobs (
    job_id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    poster_user_id UUID        NOT NULL REFERENCES users(user_id)    ON DELETE CASCADE,
    company_id     UUID        REFERENCES companies(company_id)       ON DELETE SET NULL,
    title          TEXT        NOT NULL,
    description    TEXT,
    location       TEXT,
    shift          TEXT        NOT NULL DEFAULT 'full-time',
    modality       TEXT        NOT NULL DEFAULT 'presencial',
    is_active      BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS job_skill (
    job_id   UUID    NOT NULL REFERENCES jobs(job_id)      ON DELETE CASCADE,
    skill_id INTEGER NOT NULL REFERENCES skills(skill_id)  ON DELETE CASCADE,
    PRIMARY KEY (job_id, skill_id)
);

CREATE TABLE IF NOT EXISTS applications (
    application_id UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id         UUID        NOT NULL REFERENCES jobs(job_id)   ON DELETE CASCADE,
    user_id        UUID        NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    status         app_status  NOT NULL DEFAULT 'submitted',
    applied_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (job_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user   ON user_roles (user_id);
CREATE INDEX IF NOT EXISTS idx_work_exp_user      ON "work experience" (user_id);
CREATE INDEX IF NOT EXISTS idx_education_user     ON education (user_id);
CREATE INDEX IF NOT EXISTS idx_user_skill_user    ON user_skill (user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_poster        ON jobs (poster_user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_company       ON jobs (company_id);
CREATE INDEX IF NOT EXISTS idx_job_skill_job      ON job_skill (job_id);
CREATE INDEX IF NOT EXISTS idx_applications_job   ON applications (job_id);
CREATE INDEX IF NOT EXISTS idx_applications_user  ON applications (user_id);

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

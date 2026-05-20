"""
Crea todas las tablas SQL en Supabase desde la terminal local.

Pasos previos:
  1. En Supabase → Settings → Database → Connection string → URI
     Copiá la URI y pegala en backend/.env como DATABASE_URL=postgresql://...
  2. Instalá psycopg2 si no lo tenés:
       pip install psycopg2-binary
  3. Corré este script desde la carpeta docs/:
       python setup_db.py
"""

import os
import sys
from pathlib import Path

# Cargamos .env del backend
env_path = Path(__file__).parent.parent / "backend" / ".env"
if env_path.exists():
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            key, _, val = line.partition("=")
            os.environ.setdefault(key.strip(), val.strip())

DATABASE_URL = os.environ.get("DATABASE_URL", "")
if not DATABASE_URL:
    print("ERROR: Falta DATABASE_URL en backend/.env")
    print()
    print("  1. Ir a Supabase → Settings → Database → Connection string → URI")
    print("  2. Agregar en backend/.env:")
    print("       DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres")
    sys.exit(1)

try:
    import psycopg2
except ImportError:
    print("ERROR: psycopg2 no instalado. Corré: pip install psycopg2-binary")
    sys.exit(1)

sql_file = Path(__file__).parent / "schema.sql"
sql = sql_file.read_text(encoding="utf-8")

print(f"Conectando a Supabase PostgreSQL...")
try:
    conn = psycopg2.connect(DATABASE_URL, connect_timeout=10)
    conn.autocommit = True
    cur = conn.cursor()
    cur.execute(sql)
    cur.close()
    conn.close()
    print("Tablas creadas correctamente.")
except Exception as e:
    print(f"ERROR: {e}")
    sys.exit(1)

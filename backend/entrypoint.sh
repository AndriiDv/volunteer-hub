#!/bin/sh
set -e

echo "[*] Waiting for PostgreSQL to be accessible..."
python - << 'EOF'
import time
import os
import psycopg2
from urllib.parse import urlparse

db_url = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@postgres:5432/volunteer_hub")
u = urlparse(db_url)

for i in range(30):
    try:
        conn = psycopg2.connect(
            dbname=u.path.lstrip("/"),
            user=u.username,
            password=u.password,
            host=u.hostname,
            port=u.port or 5432,
            connect_timeout=3
        )
        conn.close()
        print("[+] PostgreSQL is ready!")
        break
    except Exception as e:
        print(f"[-] Waiting for Postgres ({i+1}/30)... {e}")
        time.sleep(1)
else:
    print("[-] Timeout waiting for Postgres!")
    exit(1)
EOF

echo "[*] Running Alembic migrations..."
alembic upgrade head

echo "[*] Seeding initial demo data if empty..."
python - << 'EOF'
import os
from app.core.database import SessionLocal
from app.models.user import User
from seed import seed_database

db = SessionLocal()
try:
    count = db.query(User).count()
    if count == 0:
        print("[*] Empty database detected, running initial seed...")
        seed_database()
    else:
        print(f"[*] Database already contains {count} users, skipping initial auto-seed.")
finally:
    db.close()
EOF

echo "[*] Starting FastAPI server on port 8000..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000

# 🇺🇦 Volunteer Hub (Волонтерський Хаб)

> **Volunteer Hub** is an open-source platform that connects Ukrainian Armed Forces combat units with volunteers through **"Friendly Jars" (Дружні банки)**. Large logistical and tactical equipment needs (drones, EW jammers, vehicles, tactical medicine) are broken down into manageable sub-goals that individual volunteers can claim, fundraise for via Monobank / PrivatBank, and verify with transparent receipt proofs stored on Amazon S3.

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?style=flat&logo=FastAPI&logoColor=white)](https://fastapi.tiangolo.com)
[![Python 3.13](https://img.shields.io/badge/python-3.13-blue.svg)](https://www.python.org/downloads/)
[![PostgreSQL 16](https://img.shields.io/badge/PostgreSQL-16-336791.svg?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker Compose](https://img.shields.io/badge/Docker-Compose-2496ED.svg?logo=docker&logoColor=white)](https://www.docker.com/)
[![AWS](https://img.shields.io/badge/AWS-S3%20%7C%20EC2-232F3E.svg?logo=amazon-aws&logoColor=white)](https://aws.amazon.com/)

---

## 🏗 Monorepo Architecture

```
volunteer-hub/
├── API_CONTRACT.md          # Complete REST API specification for frontend teammates
├── docker-compose.yml       # Production-ready orchestration (Nginx, Backend, PostgreSQL)
├── deploy.sh                # Automated remote EC2 provisioning & deployment script
├── backend/                 # Python 3.13 + FastAPI + SQLAlchemy 2.0 + Alembic + Boto3
│   ├── alembic/             # Database migration versions and environments
│   ├── app/
│   │   ├── api/             # REST endpoints (auth, needs, fundraisers, leaderboard, admin)
│   │   ├── core/            # Config, database engine, security (JWT, bcrypt)
│   │   ├── models/          # SQLAlchemy ORM models (User, Need, Fundraiser)
│   │   ├── schemas/         # Pydantic validation models
│   │   ├── services/        # Amazon S3 integration for proof receipt uploads
│   │   └── main.py          # FastAPI application factory & CORS configuration
│   ├── seed.py              # Realistic demo seed data (4 military needs, 6 friendly jars)
│   ├── requirements.txt     # Python production dependencies
│   ├── Dockerfile           # Optimized Python 3.13 container
│   └── entrypoint.sh        # Auto-migration and database wait script
├── frontend/                # Frontend workspace (React + Vite + Tailwind CSS)
│   └── README.md            # Onboarding guide & API integration instructions for frontend team
├── nginx/                   # Reverse proxy configuration
│   ├── default.conf         # Domain routing for volunteer-hub.duckdns.org (/api -> backend)
│   └── html/index.html      # Styled landing page & teammate placeholder
└── scripts/                 # AWS infrastructure and deployment automation
    ├── provision_aws.py     # Idempotent boto3 script for S3 bucket, SG, KeyPair, and EC2
    └── deploy.py            # Automated remote deployment runner
```

---

## ⚡ Quickstart (Local Docker Compose)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/AndriiDv/volunteer-hub.git
   cd volunteer-hub
   ```

2. **Configure environment:**
   Create `.env` or use default values:
   ```env
   POSTGRES_PASSWORD=postgres
   JWT_SECRET=super-secret-key-volunteer-hub-2026-secure
   AWS_ACCESS_KEY_ID=your_key_here
   AWS_SECRET_ACCESS_KEY=your_secret_here
   AWS_DEFAULT_REGION=eu-north-1
   S3_BUCKET_NAME=volunteer-hub-media-andriidv
   ```

3. **Start the stack:**
   ```bash
   docker compose up -d --build
   ```

4. **Access services:**
   - **Web / Landing:** `http://localhost`
   - **Interactive API Documentation:** `http://localhost/docs`
   - **Needs API:** `http://localhost/api/needs`

---

## 🪖 Demo Test Accounts

The platform includes seed data ready for testing (all accounts use password: `Volunteer2026!`):

| Role | Email | Description |
|---|---|---|
| **Admin** | `admin@volunteerhub.ua` | Full access, user verification, receipts verification |
| **Military** | `magura47@military.ua` | 47th Separate Mechanized Brigade ("Magura") |
| **Military** | `kholodnyiyar93@military.ua` | 93rd Mechanized Brigade ("Kholodnyi Yar") |
| **Volunteer** | `serhiy@volunteers.ua` | Top-ranked volunteer fundraiser creator |
| **Volunteer** | `oksana@volunteers.ua` | Active volunteer managing medical and vehicle jars |
| **Volunteer** | `dmytro@volunteers.ua` | Tactical gear & FPV fundraiser |

---

## 📜 REST API Contract

Refer to [`API_CONTRACT.md`](API_CONTRACT.md) for full endpoint specifications, request payloads, and response models.

Key routes:
- `POST /api/auth/register` — Register account (volunteer or military).
- `POST /api/auth/login` — Obtain JWT Bearer token.
- `GET /api/auth/me` — Current user profile.
- `GET /api/needs` — List equipment needs with filters (`category`, `urgency`, `status`) and aggregated `raised_amount`.
- `GET /api/needs/{id}` — Detailed view with linked friendly jars.
- `POST /api/needs` — Create need (*military only*).
- `POST /api/needs/{need_id}/fundraisers` — Open friendly jar slot (*volunteer only*).
- `PATCH /api/fundraisers/{id}` — Update current raised sum or Monobank link.
- `POST /api/fundraisers/{id}/proof` — Upload receipt/invoice screenshot to Amazon S3.
- `POST /api/fundraisers/{id}/verify` — Military owner or admin confirms receipt; awards points and auto-completes target need.
- `GET /api/leaderboard` — Volunteer hall of fame ranked by total verified raised amount.
- `POST /api/admin/users/{id}/verify` — Admin verification of military units.

---

## ☁️ Cloud Infrastructure (AWS Free-Tier `eu-north-1`)

- **S3 Bucket:** `volunteer-hub-media-andriidv` with public read access on `proofs/*` and CORS enabled.
- **Compute:** EC2 `t3.micro` Ubuntu 24.04 LTS instance with 20GB gp3 storage.
- **Networking:** Security group `volunteer-hub-sg` with open ports `22` (SSH), `80` (HTTP), `443` (HTTPS).
- **Reverse Proxy:** Nginx proxying `/api` & `/docs` to FastAPI container on port 8000 and serving the static React frontend.

---

## 🔒 Security Notice

- `.env`, `.env.aws`, and `*.pem` are strictly excluded from source control via `.gitignore`.
- Production credentials are injected securely during EC2 deployment.

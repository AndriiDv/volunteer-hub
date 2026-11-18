# 🇺🇦 Volunteer Hub (Волонтерський Хаб)

> **Volunteer Hub** is an open-source decentralized trust and coordination layer that connects Ukrainian Armed Forces combat units with citizen volunteers through **"Friendly Jars" (Дружні банки)**. 
>
> Large logistical needs (drones, EW jammers, medevac vehicles, tactical medicine) posted by verified military units are decomposed into manageable micro-fundraisers. Volunteers claim sub-goals, raise funds directly through trusted banking providers (**Monobank / PrivatBank**), and submit cryptographic and photographic receipt proof stored on Amazon S3. **Volunteer Hub never holds user funds directly**, serving exclusively as an immutable verification and coordination platform.

[![Live Production](https://img.shields.io/badge/Production-https%3A%2F%2Fvolunteer--hub.duckdns.org-success.svg?style=flat&logo=letsencrypt)](https://volunteer-hub.duckdns.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?style=flat&logo=FastAPI&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3-61DAFB.svg?style=flat&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6.svg?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED.svg?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)
[![AWS](https://img.shields.io/badge/AWS-EC2%20%7C%20S3%20(eu--north--1)-232F3E.svg?style=flat&logo=amazon-aws&logoColor=white)](https://aws.amazon.com/)

---

## 🌐 Live Production Deployments

- **Web Application:** [https://volunteer-hub.duckdns.org](https://volunteer-hub.duckdns.org)
- **Interactive Swagger API Docs:** [https://volunteer-hub.duckdns.org/docs](https://volunteer-hub.duckdns.org/docs)
- **API Health Check:** [https://volunteer-hub.duckdns.org/api/health](https://volunteer-hub.duckdns.org/api/health)
- **Military Needs Feed:** [https://volunteer-hub.duckdns.org/api/needs](https://volunteer-hub.duckdns.org/api/needs)

---

## 🎯 Key Product Capabilities

1. **Military Unit Verification:**
   - Military representatives register with brigade credentials (e.g., 47th OMBr "Magura", 93rd OMBr "Kholodnyi Yar").
   - Administrators verify military credentials before needs are posted publicly.
2. **Decomposed Friendly Jars ("Дружні банки"):**
   - High-cost equipment (e.g. 220,000 UAH for thermal FPV drones) is broken down into small friendly jars.
   - Individual volunteers claim a target slice (e.g. 35,000 UAH) and attach their personal Monobank/PrivatBank jar link.
3. **Transparent Proof & Anti-Fraud Flow:**
   - Volunteers upload purchase receipts/invoices directly to a public Amazon S3 bucket (`proofs/*`).
   - The military recipient or an admin reviews the receipt and confirms verification.
4. **Gamification & Leaderboard:**
   - Volunteers earn points proportional to verified funds delivered to the front lines.
   - Live leaderboard celebrates top volunteers and brigades.
5. **Modern Authentication:**
   - Standard JWT-based registration & login with bcrypt password hashing.
   - **Google Sign-In** via Google ID Token validation (`google-auth`).

---

## 🏗 Repository Structure

The monorepo strictly adheres to our clean multi-tier architecture:

```
volunteer-hub/
├── backend/                 # Python 3.13 + FastAPI + SQLAlchemy 2.0 + Alembic + Boto3
│   ├── alembic/             # Database migrations (PostgreSQL)
│   ├── app/
│   │   ├── api/             # REST endpoints (/auth, /needs, /fundraisers, /leaderboard, /admin)
│   │   ├── core/            # Database engine, JWT, bcrypt, and config
│   │   ├── models/          # SQLAlchemy ORM models (User, Need, Fundraiser)
│   │   ├── schemas/         # Pydantic validation & serialization models
│   │   ├── services/        # Amazon S3 integration for proof receipts
│   │   └── main.py          # FastAPI application factory, CORS & routers
│   ├── seed.py              # Demo database seeder (verified brigades, needs, jars)
│   ├── requirements.txt     # Python dependencies
│   ├── Dockerfile           # Optimized Python 3.13 slim container
│   └── entrypoint.sh        # Startup script (waits for PostgreSQL, runs Alembic & seeds)
│
├── frontend/                # React 18 + TypeScript + Vite + Tailwind CSS SPA
│   ├── src/
│   │   ├── components/      # NeedCard, Layout, ProtectedRoute, CreateFundraiserModal
│   │   ├── context/         # AuthContext (state, JWT storage, role guards)
│   │   ├── lib/             # Typed API client (fetch wrapper with Bearer token injection)
│   │   ├── pages/           # Marketplace, NeedDetail, VolunteerDashboard, MilitaryDashboard, AuthPage
│   │   └── types/           # Shared API contracts & TypeScript definitions
│   ├── package.json         # NPM scripts and dependencies (@react-oauth/google, lucide-react)
│   └── vite.config.ts       # Vite + Tailwind CSS configuration
│
├── infra/                   # DevOps, Containerization & Cloud Infrastructure
│   ├── docker-compose.yml   # Multi-container orchestration (nginx, backend, postgres:16-alpine)
│   ├── deploy.sh            # Automated remote deployment runner for Ubuntu 24.04 LTS
│   ├── aws_setup.py         # Idempotent boto3 script: S3 bucket, Security Group, KeyPair, EC2
│   └── nginx/
│       ├── default.conf     # Reverse proxy (SSL termination, HTTP->HTTPS 301, /api & SPA fallback)
│       └── 50x.html         # Custom error fallback page
│
├── API_CONTRACT.md          # Full REST API specification with request/response schemas
├── .env.example             # Template for environment configuration
└── README.md                # Project documentation and setup guide
```

---

## 🛠 Tech Stack

| Tier | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript 5.6, Vite 6, Tailwind CSS 4, `@react-oauth/google`, `lucide-react`, React Router 7 |
| **Backend** | Python 3.13, FastAPI, Pydantic v2, SQLAlchemy 2.0, Alembic, `google-auth`, `boto3`, Uvicorn |
| **Database** | PostgreSQL 16 (Alpine) with persistent Docker volume |
| **Reverse Proxy** | Nginx Alpine (SSL termination, caching, SPA routing, API proxy) |
| **Cloud (AWS Free-Tier)** | Amazon EC2 (`t3.micro` Ubuntu 24.04 in `eu-north-1`), Amazon S3 (`volunteer-hub-media-andriidv`) |
| **Security & SSL** | Let's Encrypt SSL via Certbot (A+ TLS 1.2/1.3), JWT Bearer auth, bcrypt |

---

## 🚀 How to Run Locally

### Option A: Complete Docker Compose Stack (Recommended)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/AndriiDv/volunteer-hub.git
   cd volunteer-hub
   ```

2. **Prepare Environment File:**
   ```bash
   cp .env.example .env
   ```

3. **Build the Frontend Bundle:**
   ```bash
   cd frontend
   npm install
   npm run build
   cd ..
   ```

4. **Launch the Stack:**
   ```bash
   docker compose -f infra/docker-compose.yml up -d --build
   ```

5. **Access Locally:**
   - Web Application: `http://localhost`
   - API Docs: `http://localhost/docs`
   - API Needs: `http://localhost/api/needs`

---

### Option B: Running Services Separately (Development Mode)

#### 1. Backend:
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
python seed.py             # Seeds SQLite / PostgreSQL with test brigades and needs
uvicorn app.main:app --reload --port 8000
```

#### 2. Frontend:
```bash
cd frontend
npm install
npm run dev                # Starts Vite dev server on http://localhost:5173
```

---

## ☁️ How to Deploy to Production (AWS EC2 & S3)

### 1. Provision Free-Tier AWS Infrastructure
Using Python and `boto3` (credentials in `.env.aws`):
```bash
python infra/aws_setup.py
```
This script idempotently creates:
- An Amazon S3 bucket `volunteer-hub-media-andriidv` in `eu-north-1` with public read access on `proofs/*` and CORS enabled.
- A Security Group `volunteer-hub-sg` with inbound ports `22` (SSH), `80` (HTTP), and `443` (HTTPS).
- An EC2 Key Pair `volunteer-hub-key.pem` (ignored by Git).
- An EC2 `t3.micro` instance running Ubuntu 24.04 LTS with a 20GB gp3 root volume.

### 2. Map DNS (DuckDNS)
Point your domain (e.g. `volunteer-hub.duckdns.org`) to the EC2 Public IPv4 address (`13.60.170.196`) in the [DuckDNS Dashboard](https://www.duckdns.org).

### 3. Deploy via Automated Script
```bash
chmod +x infra/deploy.sh
./infra/deploy.sh 13.60.170.196
```
The script will:
1. Connect via SSH using `volunteer-hub-key.pem`.
2. Install Docker, Docker Compose, and Certbot.
3. Build the React frontend production bundle inside a clean Node container.
4. Issue Let's Encrypt SSL certificates for `volunteer-hub.duckdns.org`.
5. Start the production containers (`postgres`, `backend`, and `nginx`).
6. Perform live health checks.

---

## 🪖 Demo Testing Accounts

All demo accounts share the password: `Volunteer2026!`

| Role | Email | Display Name | Unit / Notes |
|---|---|---|---|
| **Admin** | `admin@volunteerhub.ua` | Platform Administrator | Can verify military units and review receipts |
| **Military** | `magura47@military.ua` | 47th Separate Mechanized Brigade | 47th OMBr "Magura" (verified) |
| **Military** | `kholodnyiyar93@military.ua` | 93rd Mechanized Brigade | 93rd OMBr "Kholodnyi Yar" (verified) |
| **Volunteer** | `serhiy@volunteers.ua` | Serhiy Prytula Fan Club | Top-ranked volunteer fundraiser |
| **Volunteer** | `oksana@volunteers.ua` | Oksana Ivanenko | Active volunteer managing medical jars |
| **Volunteer** | `dmytro@volunteers.ua` | Dmytro Boyko | Tactical gear fundraiser |
| **Google** | *(any Google account)* | *(your Google name)* | Instant OAuth registration & login |

---

## 🔒 Security & Compliance

- **No Secret Leaks:** `.env`, `.env.aws`, and `*.pem` are strictly excluded from source control via `.gitignore`.
- **Zero Custody of Funds:** Donations proceed directly through Ukrainian banking institutions (Monobank / PrivatBank) without intermediary custody.
- **SSL / TLS:** Enforced HTTPS with HTTP-to-HTTPS 301 redirection via Let's Encrypt SSL certificates.

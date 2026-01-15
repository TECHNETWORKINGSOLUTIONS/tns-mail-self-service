
# TNS Mail Portal Pro (React + Express + Worker)

Premium, customer‑facing portal for Mailcow:
- Provision: **Domain**, **DKIM**, **Domain Admin** (+ **ACL**), optional **SSO token**
- Domain Admin dashboard: DNS check, Mailbox/Alias quick actions (v1), spam/quarantine (v2)
- Modern UI (**React + Vite + Tailwind**), API proxy via nginx
- Background jobs (**Redis/BullMQ**) for DNS & SSO tasks
- Portal DB (**Postgres**) for customers/domains/audit (scaffolded)

## Quick start
```bash
cp .env.example .env
# edit .env → MAILCOW_URL, MAILCOW_API_KEY, POSTGRES_PASSWORD

docker compose up -d --build
# UI:  http://<host>/
# Health: http://<host>/api/health
```

## Notes
- Mailcow REST endpoints used: `/api/v1/add/domain`, `/api/v1/add/dkim`, `/api/v1/add/domain-admin`, `/api/v1/edit/da-acl`, plus optional SSO (`/add/sso/domain-admin`).
- DNS helper checks: MX/SPF/DKIM/DMARC/autodiscover/autoconfig.
- Frontend proxies `/api/*` to backend; no CORS issues.
```
frontend (nginx) → /api → backend (express) → Mailcow API
```

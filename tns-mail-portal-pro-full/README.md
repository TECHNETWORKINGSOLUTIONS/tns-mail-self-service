
# TNS Mail Portal Pro (React + Express + Worker)

Premium, customer‑facing portal for Mailcow:
- Provision: **Domain**, **DKIM**, **Domain Admin** (+ **ACL**), optional **SSO token**
- Domain Admin essentials: DNS check, quick mailbox
- Modern UI (**React + Vite + Tailwind**), API proxy via nginx
- Background jobs (**Redis/BullMQ**) foundation, Portal DB (**Postgres**) scaffold

## Quick start
```bash
cp .env.example .env
# edit .env → MAILCOW_URL, MAILCOW_API_KEY, POSTGRES_PASSWORD

docker compose up -d --build
# UI:     http://<host>/
# Health: http://<host>/api/health
```

## Notes
- Mailcow REST endpoints: `/api/v1/add/domain`, `/api/v1/add/dkim`, `/api/v1/add/domain-admin`, `/api/v1/edit/da-acl`, optional SSO `/add/sso/domain-admin` (see your cow’s `/api`).
- DNS assistant checks: MX/SPF/DKIM/DMARC/autodiscover/autoconfig.
```
frontend (nginx) → /api → backend (express) → Mailcow API
```

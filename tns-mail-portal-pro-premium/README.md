
# TNS Mail Portal Pro — Premium Dashboard

Premium dashboard for Mailcow provisioning & domain administration.

**Highlights**
- Clean IA: Dashboard → Domains → Domain Detail (Overview, Mailboxes, Aliases, Security, Policies, Quarantine)
- React + Vite + Tailwind, React Router, TanStack Query
- Backend Express proxies to Mailcow REST API (server-side API key)
- Redis/Worker scaffold for async tasks (future use)

## Run
```bash
cp .env.example .env
# set MAILCOW_URL, MAILCOW_API_KEY, POSTGRES_PASSWORD

docker compose up -d --build
# UI: http://<host>/
# API health: http://<host>/api/health
```


# TNS Mail Portal Pro (React + Express + Worker) — FIX 2

Includes fixes for:
- Vite plugin (`@vitejs/plugin-react`) missing
- Tailwind utility typo (`max-h-[320px]` instead of `max-height-[320px]`)

## Run
```bash
cp .env.example .env
# edit MAILCOW_URL, MAILCOW_API_KEY, POSTGRES_PASSWORD

docker compose up -d --build
```

UI:  http://<host>/  
API: http://<host>/api/health

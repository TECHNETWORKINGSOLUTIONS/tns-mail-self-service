# TNS Mail Portal Pro — Premium (Fixed)

This build includes: explicit React import extensions, frontend Dockerfile + nginx.conf, and all premium dashboard pages.

Run:
```
cp .env.example .env
# set MAILCOW_URL, MAILCOW_API_KEY, POSTGRES_PASSWORD

docker compose up -d --build
```
UI: http://<host>/
API: http://<host>/api/health

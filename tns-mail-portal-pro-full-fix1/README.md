# TNS Mail Portal Pro (React + Express + Worker)

This bundle fixes the frontend build by adding `@vitejs/plugin-react` and ensuring devDependencies are installed during the build stage.

## Run
```
cp .env.example .env
# edit MAILCOW_URL, MAILCOW_API_KEY, POSTGRES_PASSWORD

docker compose up -d --build
```

UI:  http://<host>/  
API: http://<host>/api/health

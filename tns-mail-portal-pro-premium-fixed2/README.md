
# TNS Portal – FusionAuth Login + Tenant Scope Patch

This patch adds **FusionAuth OIDC login (Authorization Code + PKCE)** and tenant scoping so each user only sees and edits their **own domains/mailboxes**. Default issuer is **https://sso.tnsicn.org**.

## What’s included
- `backend/src/auth.js` – OIDC with `openid-client` + Redis sessions (BFF).
- `backend/src/db.js` – Postgres helpers + minimal auto-migrations.
- `backend/src/index.js` – Backend wired with `requireAuth` / `requireScope` on every API.
- `backend/migrations/0001_tenant_scope.sql` – DDL if you prefer manual migrations.
- `frontend/src/components/UserMenu.jsx` – Login/Logout button using `/auth/login` + `/auth/logout`.
- `.env.example.additions` – environment variables to merge into your `.env`.

## Apply
1. Unzip at the repo root (where `backend/` and `frontend/` live):

```bash
unzip tns-portal-fusionauth-login-scope-patch.zip -d .
```

2. Merge env vars:

```bash
cat .env.example.additions >> .env.example
# then copy values into your real .env
```

Required:
```
OIDC_ISSUER=https://sso.tnsicn.org
OIDC_CLIENT_ID=tns-portal
OIDC_CLIENT_SECRET=<secret>
OIDC_REDIRECT_URI=https://<portal-host>/oidc/callback
SESSION_SECRET=<random-long>
```

3. (Optional) Add **UserMenu** to your `Layout.jsx` header:

```jsx
import UserMenu from './UserMenu.jsx'
// ... place <UserMenu/> in your top bar
```

4. Rebuild & run:

```bash
docker compose up -d --build
```

5. Seed tenant scope (domains/mailboxes) for each user:

```sql
-- connect to postgres and insert rows into portal_tenants, portal_users, portal_tenant_domains, portal_tenant_mailboxes
```

## Notes
- If you want refresh tokens, set `OIDC_USE_OFFLINE_ACCESS=true` and send a `device` identifier at login/callback time (the backend can be extended to add this). FusionAuth associates refresh tokens with user+app+device. See vendor discussion. 
- All API routes now require login and enforce per-domain/per-mailbox scope.


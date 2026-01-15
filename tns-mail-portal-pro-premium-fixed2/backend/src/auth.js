
import { Issuer, generators } from 'openid-client';
import session from 'express-session';
import connectRedis from 'connect-redis';
import IORedis from 'ioredis';

let oidcClient;

export async function initOidc() {
  if (oidcClient) return oidcClient;
  const issuer = await Issuer.discover(process.env.OIDC_ISSUER);
  oidcClient = new issuer.Client({
    client_id: process.env.OIDC_CLIENT_ID,
    client_secret: process.env.OIDC_CLIENT_SECRET,
    redirect_uris: [process.env.OIDC_REDIRECT_URI],
    response_types: ['code']
  });
  return oidcClient;
}

export function sessionMiddleware() {
  const RedisStore = connectRedis(session);
  const redis = new IORedis({ host: process.env.REDIS_HOST || 'redis', port: +(process.env.REDIS_PORT||6379) });
  return session({
    store: new RedisStore({ client: redis, prefix: 'sess:' }),
    secret: process.env.SESSION_SECRET || 'dev-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 1000*60*60*8 }
  });
}

export function attachAuthRoutes(app, client, db) {
  app.get('/auth/login', (req, res) => {
    const code_verifier = generators.codeVerifier();
    const code_challenge = generators.codeChallenge(code_verifier);
    req.session.code_verifier = code_verifier;
    const url = client.authorizationUrl({
      scope: (process.env.OIDC_USE_OFFLINE_ACCESS ? 'openid email profile offline_access' : 'openid email profile'),
      code_challenge,
      code_challenge_method: 'S256'
    });
    res.redirect(url);
  });

  app.get('/oidc/callback', async (req, res, next) => {
    try {
      const params = client.callbackParams(req);
      const tokenSet = await client.callback(process.env.OIDC_REDIRECT_URI, params, {
        code_verifier: req.session.code_verifier
      });
      const claims = tokenSet.claims();
      let email;
      try { const ui = await client.userinfo(tokenSet.access_token); email = ui?.email; } catch {}
      const mapped = await db.resolveOrCreateUser({ sub: claims.sub, email });
      req.session.user = {
        sub: mapped.user.sub,
        email: mapped.user.email,
        tenant_id: mapped.tenant.id,
        allowedDomains: mapped.domains,
        allowedMailboxes: mapped.mailboxes
      };
      res.redirect('/');
    } catch (e) { next(e); }
  });

  app.post('/auth/logout', (req, res) => {
    req.session.destroy(()=> res.clearCookie('connect.sid').json({ ok:true }));
  });

  app.get('/me', (req, res) => {
    if (!req.session?.user) return res.status(401).json({ ok:false });
    res.json({ ok:true, user: req.session.user });
  });
}

export function requireAuth(req, res, next){
  if(!req.session?.user) return res.status(401).json({ ok:false, error:'auth_required' });
  next();
}

export function requireScope(field){
  return (req,res,next)=>{
    const u = req.session.user;
    const v = String(req.query[field] || req.body[field] || '').toLowerCase();
    const list = (field === 'mailbox' ? u.allowedMailboxes : u.allowedDomains).map(s=>String(s).toLowerCase());
    if(!v || !list.includes(v)) return res.status(403).json({ ok:false, error:'forbidden_scope' });
    next();
  }
}

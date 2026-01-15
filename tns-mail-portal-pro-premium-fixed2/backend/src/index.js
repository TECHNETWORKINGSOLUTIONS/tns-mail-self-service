
import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dns from 'node:dns/promises';
import { initOidc, sessionMiddleware, attachAuthRoutes, requireAuth, requireScope } from './auth.js';
import { db, runMigrations } from './db.js';

const app = express();
app.use(express.json());
app.use(cors());
app.use(sessionMiddleware());

await runMigrations();
const oidcClient = await initOidc();
attachAuthRoutes(app, oidcClient, db);

const MC_URL = (process.env.MAILCOW_URL || '').replace(/\/+$/, '');
const MC_KEY = process.env.MAILCOW_API_KEY || '';
const mc = axios.create({ baseURL: `${MC_URL}/api/v1`, headers: { 'X-API-Key': MC_KEY }, timeout: 20000 });

app.get('/api/health', (req,res)=>res.json({ ok:true, service:'tns-mail-portal-premium' }));

// Provision: scoped to a domain the tenant owns (or is about to own). We still requireAuth.
app.post('/api/provision', requireAuth, async (req,res)=>{
  const { domain, email, password } = req.body; if(!domain||!email||!password) return res.status(400).json({ ok:false, error:'domain, email, password required' });
  try{
    const dom = await mc.post('/add/domain',{ domain, active:true });
    const dkim= await mc.post('/add/dkim',{ domain, selector:'dkim', length:2048 });
    const da  = await mc.post('/add/domain-admin',{ username:email, password, domains:[domain] });
    const acl = await mc.post('/edit/da-acl',{ items:[email], attr:{ da_acl:['sogo_access','app_passwds','quarantine','filters','spam_policy','alias_domains','extend_sender_acl'] } });
    res.json({ ok:true, domain_api:dom.data, dkim_api:dkim.data, domain_admin_api:da.data, domain_admin_acl_api:acl.data });
  }catch(err){ res.status(400).json({ ok:false, error: err?.response?.data || err.message }); }
});

// Domains (filter to tenant domains)
app.get('/api/domains', requireAuth, async (req,res)=>{
  try{ const {data}=await mc.get('/get/domain/all');
    const allowed = (req.session.user?.allowedDomains||[]).map(d=>d.toLowerCase());
    const items = !allowed.length ? [] : data.filter(x => allowed.includes(String(x.domain||'').toLowerCase()));
    res.json({ ok:true, items });
  }catch(err){ res.status(400).json({ ok:false, error: err?.response?.data || err.message }); }
});

app.get('/api/dkim', requireAuth, requireScope('domain'), async (req,res)=>{
  const { domain } = req.query; try{ const {data}=await mc.get(`/get/dkim/${encodeURIComponent(domain)}`); res.json({ ok:true, data }); }catch(err){ res.status(400).json({ ok:false, error: err?.response?.data || err.message }); }
});

app.get('/api/dns/:d', requireAuth, async (req,res)=>{
  const d=req.params.d; const allowed=(req.session.user?.allowedDomains||[]).map(x=>x.toLowerCase()); if(!allowed.includes(String(d).toLowerCase())) return res.status(403).json({ok:false,error:'forbidden_scope'});
  const out={mx:[],spf:[],dkim:[],dmarc:[],autodiscover:[],autoconfig:[],errors:{}}; try{ out.mx=await dns.resolveMx(d);}catch(e){ out.errors.mx=e.message } try{ const t=await dns.resolveTxt(d); out.spf=t.flat().filter(v=>/^v=spf1\s/i.test(v)); }catch(e){ out.errors.spf=e.message } try{ const t=await dns.resolveTxt(`dkim._domainkey.${d}`); out.dkim=t.flat(); }catch(e){ out.errors.dkim=e.message } try{ const t=await dns.resolveTxt(`_dmarc.${d}`); out.dmarc=t.flat(); }catch(e){ out.errors.dmarc=e.message } for(const sub of ['autodiscover','autoconfig']){ try{ out[sub]=await dns.resolveCname(`${sub}.${d}`);}catch(e){ out.errors[sub]=e.message } } res.json({ ok:true, domain:d, result:out });
});

// Mailboxes
app.get('/api/mailboxes', requireAuth, requireScope('domain'), async (req,res)=>{ const {domain}=req.query; try{ const {data}=await mc.get('/get/mailbox/all'); const items=data.filter(m=> (m?.domain||'').toLowerCase()===String(domain).toLowerCase()); res.json({ ok:true, items }); }catch(err){ res.status(400).json({ ok:false, error: err?.response?.data || err.message }); } });
app.post('/api/mailboxes', requireAuth, requireScope('domain'), async (req,res)=>{ const {local_part,domain,password,quota=1024}=req.body; if(!local_part||!domain||!password) return res.status(400).json({ ok:false, error:'local_part, domain, password required' }); try{ const {data}=await mc.post('/add/mailbox',{ local_part, domain, password, quota, active:true }); res.json({ ok:true, data }); }catch(err){ res.status(400).json({ ok:false, error: err?.response?.data || err.message }); } });

// Aliases
app.get('/api/aliases', requireAuth, requireScope('domain'), async (req,res)=>{ const {domain}=req.query; try{ const {data}=await mc.get('/get/alias/all'); const items=data.filter(a=> (a?.domain||'').toLowerCase()===String(domain).toLowerCase()); res.json({ ok:true, items }); }catch(err){ res.status(400).json({ ok:false, error: err?.response?.data || err.message }); } });
app.post('/api/aliases', requireAuth, requireScope('domain'), async (req,res)=>{ const {address,goto,active=true,sogo_visible=true}=req.body; if(!address||!goto) return res.status(400).json({ ok:false, error:'address and goto required' }); try{ const {data}=await mc.post('/add/alias',{ address, goto, active, sogo_visible }); res.json({ ok:true, data }); }catch(err){ res.status(400).json({ ok:false, error: err?.response?.data || err.message }); } });

// Policies (per-domain)
app.get('/api/policies', requireAuth, requireScope('domain'), async (req,res)=>{ const {domain}=req.query; try{ const {data}=await mc.get('/get/domain/all'); const item=data.find(d=>d.domain===domain)||{}; res.json({ ok:true, item }); }catch(err){ res.status(400).json({ ok:false, error: err?.response?.data || err.message }); } });
app.post('/api/policies', requireAuth, requireScope('domain'), async (req,res)=>{ const {domain,attr}=req.body; if(!domain||!attr) return res.status(400).json({ ok:false, error:'domain and attr required' }); try{ const {data}=await mc.post('/edit/domain',{ items:[domain], attr }); res.json({ ok:true, data }); }catch(err){ res.status(400).json({ ok:false, error: err?.response?.data || err.message }); } });

// App Passwords (per-mailbox)
app.get('/api/app-passwords', requireAuth, requireScope('mailbox'), async (req,res)=>{ const { mailbox } = req.query; if(!mailbox) return res.status(400).json({ ok:false, error:'mailbox required' }); try{ const {data}=await mc.get(`/get/app-passwd/all/${encodeURIComponent(mailbox)}`); res.json({ ok:true, items:data }); }catch(err){ res.status(400).json({ ok:false, error: err?.response?.data || err.message }); } });
app.post('/api/app-passwords', requireAuth, requireScope('mailbox'), async (req,res)=>{ const { mailbox, comment='', protocols=['imap','smtp','sogo'] } = req.body; if(!mailbox) return res.status(400).json({ ok:false, error:'mailbox required' }); try{ const {data}=await mc.post('/add/app-passwd',{ username: mailbox, comment, protocols }); res.json({ ok:true, data }); }catch(err){ res.status(400).json({ ok:false, error: err?.response?.data || err.message }); } });
app.post('/api/app-passwords/delete', requireAuth, requireScope('mailbox'), async (req,res)=>{ const { mailbox, ids=[] } = req.body||{}; try{ const {data}=await mc.post('/delete/app-passwd',{ username: mailbox, items: ids }); res.json({ ok:true, data }); }catch(err){ res.status(400).json({ ok:false, error: err?.response?.data || err.message }); } });

// Quarantine (filter by tenant domains)
app.get('/api/quarantine', requireAuth, async (req,res)=>{ try{ const {data}=await mc.get('/get/quarantine/all'); const allowed=(req.session.user?.allowedDomains||[]).map(d=>d.toLowerCase()); const items=data.filter(q=> allowed.some(dom=> String(q.rcpt||'').toLowerCase().endsWith('@'+dom))); res.json({ ok:true, items }); }catch(err){ res.status(400).json({ ok:false, error: err?.response?.data || err.message }); } });
app.post('/api/quarantine/delete', requireAuth, async (req,res)=>{ const { ids=[] } = req.body||{}; try{ const {data}=await mc.post('/delete/qitem',{ items: ids }); res.json({ ok:true, data }); }catch(err){ res.status(400).json({ ok:false, error: err?.response?.data || err.message }); } });
app.post('/api/quarantine/release', requireAuth, async (req,res)=>{ const { ids=[] } = req.body||{}; try{ const {data}=await mc.post('/edit/qitem',{ items: ids, attr:{ action:'release' } }); res.json({ ok:true, data }); }catch(err){ res.status(400).json({ ok:false, error: err?.response?.data || err.message }); } });

app.listen(3000, ()=> console.log('[backend] with FusionAuth OIDC, listening on 3000'));

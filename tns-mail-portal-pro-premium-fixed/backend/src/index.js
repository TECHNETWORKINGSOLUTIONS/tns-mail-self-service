
import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dns from 'node:dns/promises';

const app = express();
app.use(express.json());
app.use(cors());

const MC_URL = (process.env.MAILCOW_URL || '').replace(/\/+$/, '');
const MC_KEY = process.env.MAILCOW_API_KEY || '';
const mc = axios.create({ baseURL: `${MC_URL}/api/v1`, headers: { 'X-API-Key': MC_KEY }, timeout: 20000 });

app.get('/api/health', (req,res)=>res.json({ ok:true, service:'tns-mail-portal-premium' }));

async function setACL(username, da_acl=[]) { if(!da_acl.length) return { ok:true, skipped:true }; const {data}=await mc.post('/edit/da-acl',{ items:[username], attr:{ da_acl } }); return data; }
async function sso(username){ try{ const {data}=await mc.post('/add/sso/domain-admin',{ username }); if(data?.token) return `${MC_URL}/sso/?token=${data.token}`;}catch{} return null; }

app.post('/api/provision', async (req,res)=>{
  const {domain,email,password} = req.body; if(!domain||!email||!password) return res.status(400).json({ ok:false, error:'domain, email, password required' });
  try{
    const dom = await mc.post('/add/domain',{ domain, active:true });
    const dkim= await mc.post('/add/dkim',{ domain, selector:'dkim', length:2048 });
    const da  = await mc.post('/add/domain-admin',{ username:email, password, domains:[domain] });
    const acl = await setACL(email,['sogo_access','app_passwds','quarantine','filters','spam_policy','alias_domains','extend_sender_acl']);
    const link = await sso(email);
    res.json({ ok:true, domain_api:dom.data, dkim_api:dkim.data, domain_admin_api:da.data, domain_admin_acl_api:acl, sso_link:link });
  }catch(err){ res.status(400).json({ ok:false, error: err?.response?.data || err.message }); }
});

app.get('/api/dns/:d', async (req,res)=>{ const d=req.params.d; const out={mx:[],spf:[],dkim:[],dmarc:[],autodiscover:[],autoconfig:[],errors:{}}; try{out.mx=await dns.resolveMx(d);}catch(e){out.errors.mx=e.message} try{const t=await dns.resolveTxt(d); out.spf=t.flat().filter(v=>/^v=spf1\s/i.test(v));}catch(e){out.errors.spf=e.message} try{const t=await dns.resolveTxt(`dkim._domainkey.${d}`); out.dkim=t.flat();}catch(e){out.errors.dkim=e.message} try{const t=await dns.resolveTxt(`_dmarc.${d}`); out.dmarc=t.flat();}catch(e){out.errors.dmarc=e.message} for(const sub of ['autodiscover','autoconfig']){ try{out[sub]=await dns.resolveCname(`${sub}.${d}`);}catch(e){out.errors[sub]=e.message} } res.json({ ok:true, domain:d, result:out }); });

app.get('/api/domains', async (req,res)=>{ try{const {data}=await mc.get('/get/domain/all'); res.json({ ok:true, items:data });}catch(err){res.status(400).json({ ok:false, error: err?.response?.data || err.message });}});

app.get('/api/mailboxes', async (req,res)=>{ const {domain}=req.query; try{const {data}=await mc.get('/get/mailbox/all'); const items=domain? data.filter(m=> (m?.domain||'').toLowerCase()===String(domain).toLowerCase()):data; res.json({ ok:true, items });}catch(err){res.status(400).json({ ok:false, error: err?.response?.data || err.message });} });
app.post('/api/mailboxes', async (req,res)=>{ const {local_part,domain,password,quota=1024}=req.body; if(!local_part||!domain||!password) return res.status(400).json({ ok:false, error:'local_part, domain, password required' }); try{const {data}=await mc.post('/add/mailbox',{ local_part, domain, password, quota, active:true }); res.json({ ok:true, data });}catch(err){res.status(400).json({ ok:false, error: err?.response?.data || err.message });} });

app.get('/api/aliases', async (req,res)=>{ const {domain}=req.query; try{const {data}=await mc.get('/get/alias/all'); const items=domain? data.filter(a=> (a?.domain||'').toLowerCase()===String(domain).toLowerCase()):data; res.json({ ok:true, items });}catch(err){res.status(400).json({ ok:false, error: err?.response?.data || err.message });} });
app.post('/api/aliases', async (req,res)=>{ const {address,goto,active=true,sogo_visible=true}=req.body; if(!address||!goto) return res.status(400).json({ ok:false, error:'address and goto required' }); try{const {data}=await mc.post('/add/alias',{ address, goto, active, sogo_visible }); res.json({ ok:true, data });}catch(err){res.status(400).json({ ok:false, error: err?.response?.data || err.message });} });

app.get('/api/dkim', async (req,res)=>{ const {domain}=req.query; if(!domain) return res.status(400).json({ ok:false, error:'domain required' }); try{const {data}=await mc.get(`/get/dkim/${encodeURIComponent(domain)}`); res.json({ ok:true, data });}catch(err){res.status(400).json({ ok:false, error: err?.response?.data || err.message });} });

app.get('/api/app-passwords', async (req,res)=>{ const {mailbox}=req.query; if(!mailbox) return res.status(400).json({ ok:false, error:'mailbox required' }); try{const {data}=await mc.get(`/get/app-passwd/all/${encodeURIComponent(mailbox)}`); res.json({ ok:true, items:data });}catch(err){res.status(400).json({ ok:false, error: err?.response?.data || err.message });} });
app.post('/api/app-passwords', async (req,res)=>{ const {mailbox,comment='',protocols=['imap','smtp','sogo']}=req.body; if(!mailbox) return res.status(400).json({ ok:false, error:'mailbox required' }); try{const {data}=await mc.post('/add/app-passwd',{ username:mailbox, comment, protocols }); res.json({ ok:true, data });}catch(err){res.status(400).json({ ok:false, error: err?.response?.data || err.message });} });

app.get('/api/policies', async (req,res)=>{ const {domain}=req.query; if(!domain) return res.status(400).json({ ok:false, error:'domain required' }); try{const {data}=await mc.get('/get/domain/all'); const item=data.find(d=>d.domain===domain)||{}; res.json({ ok:true, item });}catch(err){res.status(400).json({ ok:false, error: err?.response?.data || err.message });} });
app.post('/api/policies', async (req,res)=>{ const {domain,attr}=req.body; if(!domain||!attr) return res.status(400).json({ ok:false, error:'domain and attr required' }); try{const {data}=await mc.post('/edit/domain',{ items:[domain], attr }); res.json({ ok:true, data });}catch(err){res.status(400).json({ ok:false, error: err?.response?.data || err.message });} });

app.get('/api/quarantine', async (req,res)=>{ const {domain}=req.query; try{const {data}=await mc.get('/get/quarantine/all'); const items = domain? data.filter(q=> String(q.rcpt||'').toLowerCase().endsWith(`@${domain.toLowerCase()}`)):data; res.json({ ok:true, items });}catch(err){res.status(400).json({ ok:false, error: err?.response?.data || err.message });} });
app.post('/api/quarantine/delete', async (req,res)=>{ const {ids=[]}=req.body||{}; try{const {data}=await mc.post('/delete/qitem',{ items: ids }); res.json({ ok:true, data });}catch(err){res.status(400).json({ ok:false, error: err?.response?.data || err.message });} });

app.listen(3000, ()=>console.log('[backend] listening on 3000'));

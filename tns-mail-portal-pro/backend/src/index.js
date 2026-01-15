
import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dns from 'node:dns/promises';

const app = express();
app.use(express.json());
app.use(cors());

const MC_URL = (process.env.MAILCOW_URL || '').replace(/\/+$/, '');
const MC_KEY = process.env.MAILCOW_API_KEY || '';
const api = axios.create({ baseURL: `${MC_URL}/api/v1`, headers: { 'X-API-Key': MC_KEY }, timeout: 20000 });

app.get('/api/health', (req, res) => res.json({ ok: true, service: 'tns-mail-portal-pro' }));

async function setACL(username, da_acl = []){
  if(!da_acl.length) return { ok:true, skipped:true };
  const { data } = await api.post('/edit/da-acl', { items:[username], attr:{ da_acl } });
  return data;
}
async function sso(username){
  try{
    const { data } = await api.post('/add/sso/domain-admin', { username });
    if(data?.token) return `${MC_URL}/sso/?token=${data.token}`;
  }catch(e){}
  return null;
}

app.post('/api/provision', async (req,res)=>{
  const { domain, email, password } = req.body;
  if(!domain||!email||!password) return res.status(400).json({ ok:false, error:'domain, email, password required' });
  try{
    const dom = await api.post('/add/domain', { domain, active:true });
    const dkim= await api.post('/add/dkim', { domain, selector:'dkim', length:2048 });
    const da  = await api.post('/add/domain-admin', { username:email, password, domains:[domain] });
    const acl = await setACL(email, ['sogo_access','app_passwds','quarantine','filters','spam_policy','alias_domains','extend_sender_acl']);
    const ssoLink = await sso(email);
    res.json({ ok:true, domain_api:dom.data, dkim_api:dkim.data, domain_admin_api:da.data, domain_admin_acl_api:acl, sso_link:ssoLink });
  }catch(err){
    res.status(400).json({ ok:false, error: err?.response?.data || err.message });
  }
});

app.get('/api/dns/:d', async (req,res)=>{
  const d=req.params.d; const out={mx:[],spf:[],dkim:[],dmarc:[],autodiscover:[],autoconfig:[],errors:{}};
  try{ out.mx = await dns.resolveMx(d);}catch(e){ out.errors.mx=e.message }
  try{ const t=await dns.resolveTxt(d); out.spf=t.flat().filter(v=>/^v=spf1\s/i.test(v)); }catch(e){ out.errors.spf=e.message }
  try{ const t=await dns.resolveTxt(`dkim._domainkey.${d}`); out.dkim=t.flat(); }catch(e){ out.errors.dkim=e.message }
  try{ const t=await dns.resolveTxt(`_dmarc.${d}`); out.dmarc=t.flat(); }catch(e){ out.errors.dmarc=e.message }
  for(const sub of ['autodiscover','autoconfig']){
    try{ out[sub]=await dns.resolveCname(`${sub}.${d}`); }catch(e){ out.errors[sub]=e.message }
  }
  res.json({ ok:true, domain:d, result:out });
});

app.post('/api/mailbox', async (req,res)=>{
  const { local_part, domain, password, quota=1024 } = req.body;
  if(!local_part||!domain||!password) return res.status(400).json({ ok:false, error:'local_part, domain, password required' });
  try{
    const { data } = await api.post('/add/mailbox', { local_part, domain, password, quota, active:true });
    res.json({ ok:true, mailbox_api:data });
  }catch(err){ res.status(400).json({ ok:false, error: err?.response?.data || err.message }); }
});

app.listen(3000, ()=> console.log('[backend] listening on 3000'));

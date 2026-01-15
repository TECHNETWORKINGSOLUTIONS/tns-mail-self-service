
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

app.get('/api/domains', async (req,res)=>{ try{ const {data}=await mc.get('/get/domain/all'); res.json({ ok:true, items:data }); }catch(err){ res.status(400).json({ ok:false, error: err?.response?.data || err.message }); }});

app.get('/api/mailboxes', async (req,res)=>{ const { domain } = req.query; try{ const {data}=await mc.get('/get/mailbox/all'); const items = domain? data.filter(m=> (m?.domain||'').toLowerCase()===(String(domain).toLowerCase())):data; res.json({ ok:true, items }); }catch(err){ res.status(400).json({ ok:false, error: err?.response?.data || err.message }); }});
app.post('/api/mailboxes', async (req,res)=>{ const { local_part, domain, password, quota=1024 } = req.body; if(!local_part||!domain||!password) return res.status(400).json({ ok:false, error:'local_part, domain, password required' }); try{ const {data}=await mc.post('/add/mailbox',{ local_part, domain, password, quota, active:true }); res.json({ ok:true, data }); }catch(err){ res.status(400).json({ ok:false, error: err?.response?.data || err.message }); }});

app.get('/api/aliases', async (req,res)=>{ const { domain } = req.query; try{ const {data}=await mc.get('/get/alias/all'); const items = domain? data.filter(a=> (a?.domain||'').toLowerCase()===(String(domain).toLowerCase())):data; res.json({ ok:true, items }); }catch(err){ res.status(400).json({ ok:false, error: err?.response?.data || err.message }); }});
app.post('/api/aliases', async (req,res)=>{ const { address, goto, active=true, sogo_visible=true } = req.body; if(!address||!goto) return res.status(400).json({ ok:false, error:'address and goto required' }); try{ const {data}=await mc.post('/add/alias',{ address, goto, active, sogo_visible }); res.json({ ok:true, data }); }catch(err){ res.status(400).json({ ok:false, error: err?.response?.data || err.message }); }});

app.get('/api/dkim', async (req,res)=>{ const { domain } = req.query; if(!domain) return res.status(400).json({ ok:false, error:'domain required' }); try{ const {data}=await mc.get(`/get/dkim/${encodeURIComponent(domain)}`); res.json({ ok:true, data }); }catch(err){ res.status(400).json({ ok:false, error: err?.response?.data || err.message }); }});

app.get('/api/dns/:d', async (req,res)=>{ const d=req.params.d; const out={mx:[],spf:[],dkim:[],dmarc:[],autodiscover:[],autoconfig:[],errors:{}}; try{ out.mx=await dns.resolveMx(d);}catch(e){ out.errors.mx=e.message } try{ const t=await dns.resolveTxt(d); out.spf=t.flat().filter(v=>/^v=spf1\s/i.test(v)); }catch(e){ out.errors.spf=e.message } try{ const t=await dns.resolveTxt(`dkim._domainkey.${d}`); out.dkim=t.flat(); }catch(e){ out.errors.dkim=e.message } try{ const t=await dns.resolveTxt(`_dmarc.${d}`); out.dmarc=t.flat(); }catch(e){ out.errors.dmarc=e.message } for(const sub of ['autodiscover','autoconfig']){ try{ out[sub]=await dns.resolveCname(`${sub}.${d}`);}catch(e){ out.errors[sub]=e.message } } res.json({ ok:true, domain:d, result:out }); });

app.get('/api/app-passwords', async (req,res)=>{ const { mailbox } = req.query; if(!mailbox) return res.status(400).json({ ok:false, error:'mailbox required' }); try{ const {data}=await mc.get(`/get/app-passwd/all/${encodeURIComponent(mailbox)}`); res.json({ ok:true, items:data }); }catch(err){ res.status(400).json({ ok:false, error: err?.response?.data || err.message }); }});
app.post('/api/app-passwords', async (req,res)=>{ const { mailbox, comment='' } = req.body; if(!mailbox) return res.status(400).json({ ok:false, error:'mailbox required' }); try{ const {data}=await mc.post('/add/app-passwd',{ username: mailbox, comment }); res.json({ ok:true, data }); }catch(err){ res.status(400).json({ ok:false, error: err?.response?.data || err.message }); }});

app.get('/api/policies', async (req,res)=>{ const { domain } = req.query; if(!domain) return res.status(400).json({ ok:false, error:'domain required' }); try{ const {data}=await mc.get('/get/domain/all'); const item=data.find(d=>d.domain===domain)||{}; res.json({ ok:true, item }); }catch(err){ res.status(400).json({ ok:false, error: err?.response?.data || err.message }); }});

app.get('/api/quarantine', async (req,res)=>{ const { domain } = req.query; try{ const {data}=await mc.get('/get/quarantine/all'); const items = domain? data.filter(q=> String(q.rcpt||'').toLowerCase().endsWith(`@${domain.toLowerCase()}`)) : data; res.json({ ok:true, items }); }catch(err){ res.status(400).json({ ok:false, error: err?.response?.data || err.message }); }});

app.listen(3000, ()=>console.log('[backend] listening on 3000'));

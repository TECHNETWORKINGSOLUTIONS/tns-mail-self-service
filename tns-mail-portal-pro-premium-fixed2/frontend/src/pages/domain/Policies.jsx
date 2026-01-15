
import React, { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'

async function fetchPolicies(domain){ const r=await fetch('/api/policies?domain='+encodeURIComponent(domain)); return r.json() }
async function savePolicies(domain, attr){ return fetch('/api/policies',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ domain, attr })}).then(r=>r.json()) }

export default function Policies(){
  const { domain } = useParams()
  const { data } = useQuery({ queryKey:['policies',domain], queryFn:()=>fetchPolicies(domain) })
  // Seed values (fallbacks); low/high thresholds inspired by Mailcow/Rspamd defaults
  const [low, setLow] = useState(5)
  const [high, setHigh] = useState(15)
  const [action, setAction] = useState('junk') // junk | quarantine | reject
  const [grey, setGrey] = useState(true)
  const [wl, setWl] = useState('')
  const [bl, setBl] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(()=>{
    // If backend returns per-domain values in item, map them in here.
    const item = data?.item||{}
    if(typeof item.lowspamlevel === 'number') setLow(item.lowspamlevel)
    if(typeof item.highspamlevel === 'number') setHigh(item.highspamlevel)
    if(typeof item.greylist_enabled === 'boolean') setGrey(item.greylist_enabled)
    if(typeof item.spam_action === 'string') setAction(item.spam_action)
    if(Array.isArray(item.whitelist)) setWl(item.whitelist.join('
'))
    if(Array.isArray(item.blacklist)) setBl(item.blacklist.join('
'))
  }, [data])

  async function onSave(){
    setSaving(true); setMsg('')
    const attr = {
      lowspamlevel: Number(low),
      highspamlevel: Number(high),
      spam_action: action, // 'junk'|'quarantine'|'reject'
      greylist_enabled: !!grey,
      whitelist: wl.split(/
+/).map(s=>s.trim()).filter(Boolean),
      blacklist: bl.split(/
+/).map(s=>s.trim()).filter(Boolean)
    }
    const res = await savePolicies(domain, attr)
    setSaving(false)
    setMsg(res?.ok? 'Saved!' : ('Failed: '+(res?.error?.message||JSON.stringify(res?.error||res))))
  }

  return (
    <div className="space-y-4">
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card space-y-3">
          <div className="section-title">Spam thresholds</div>
          <label className="block text-sm">Low score (mark as spam / Junk)</label>
          <input type="range" min="1" max="15" step="0.5" value={low} onChange={e=>setLow(e.target.value)} className="w-full"/>
          <div className="text-tnsmuted text-sm">{low}</div>
          <label className="block text-sm mt-2">High score (hard action)</label>
          <input type="range" min="5" max="30" step="0.5" value={high} onChange={e=>setHigh(e.target.value)} className="w-full"/>
          <div className="text-tnsmuted text-sm">{high}</div>
        </div>
        <div className="card space-y-3">
          <div className="section-title">Spam action (≥ high score)</div>
          <div className="seg" role="tablist">
            <button aria-pressed={action==='junk'} onClick={()=>setAction('junk')}>Move to Junk</button>
            <button aria-pressed={action==='quarantine'} onClick={()=>setAction('quarantine')}>Quarantine</button>
            <button aria-pressed={action==='reject'} onClick={()=>setAction('reject')}>Reject</button>
          </div>
          <div className="section-title mt-4">Greylisting</div>
          <button onClick={()=>setGrey(!grey)} className={`toggle ${grey? 'toggle-on':'toggle-off'}`}> 
            <span className={`dot ${grey? 'dot-on':'dot-off'}`}></span>
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card">
          <div className="flex items-center justify-between mb-2"><div className="section-title">Whitelist</div><span className="text-xs text-tnsmuted">one entry per line</span></div>
          <textarea className="input" style={{minHeight:'160px'}} value={wl} onChange={e=>setWl(e.target.value)} placeholder="sender@domain.tld
*.trusted.com
192.0.2.0/24"/>
        </div>
        <div className="card">
          <div className="flex items-center justify-between mb-2"><div className="section-title">Blacklist</div><span className="text-xs text-tnsmuted">one entry per line</span></div>
          <textarea className="input" style={{minHeight:'160px'}} value={bl} onChange={e=>setBl(e.target.value)} placeholder="badguy@example.tld
*.spammy.tld"/>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button disabled={saving} onClick={onSave} className="btn">{saving? 'Saving…':'Save policies'}</button>
        {msg && <div className="text-tnsmuted text-sm">{msg}</div>}
      </div>

      <div className="card">
        <div className="section-title mb-2">Advanced JSON</div>
        <p className="text-tnsmuted text-sm">When you save, we post an <code>attr</code> like:
          <pre className="output">{JSON.stringify({lowspamlevel:low, highspamlevel:high, spam_action:action, greylist_enabled:grey, whitelist:wl.split(/
+/).filter(Boolean), blacklist:bl.split(/
+/).filter(Boolean)}, null, 2)}</pre>
        </p>
      </div>
    </div>
  )
}

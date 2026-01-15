
import React from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'

async function fetchMailboxes(domain){ const r=await fetch(`/api/mailboxes?domain=${encodeURIComponent(domain)}`); return r.json() }

export default function Mailboxes(){
  const { domain } = useParams();
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey:['mailboxes', domain], queryFn: ()=>fetchMailboxes(domain) })
  const items = data?.items || []

  async function createMailbox(e){
    e.preventDefault();
    const fd=new FormData(e.currentTarget)
    const payload=Object.fromEntries(fd.entries());
    payload.domain = domain;
    const r = await fetch('/api/mailboxes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    await r.json();
    qc.invalidateQueries({ queryKey:['mailboxes', domain] })
    e.currentTarget.reset();
  }

  return (
    <div className="grid md:grid-cols-2 gap-3">
      <div className="card">
        <h3 className="font-semibold mb-2">Mailboxes</h3>
        <div className="divide-y divide-white/10">
          {items.map(m=> <div key={m.username} className="py-2">{m.username} <span className="text-tnsmuted">({m.quota || '—'} MB)</span></div>)}
          {!items.length && <div className="py-2 text-tnsmuted">No mailboxes.</div>}
        </div>
      </div>
      <div className="card">
        <h3 className="font-semibold mb-2">Create Mailbox</h3>
        <form onSubmit={createMailbox} className="grid gap-2">
          <input name="local_part" placeholder="local part (e.g., info)" className="input" required />
          <input name="password" type="password" placeholder="password" className="input" required />
          <input name="quota" placeholder="1024" className="input" />
          <button className="btn w-max">Create</button>
        </form>
      </div>
    </div>
  )
}

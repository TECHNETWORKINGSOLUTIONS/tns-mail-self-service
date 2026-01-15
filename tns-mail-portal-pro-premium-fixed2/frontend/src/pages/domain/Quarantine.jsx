
import React from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
async function fetchQ(d){ const r=await fetch('/api/quarantine?domain='+encodeURIComponent(d)); return r.json() }
export default function Quarantine(){ const { domain }=useParams(); const { data }=useQuery({ queryKey:['quarantine',domain], queryFn:()=>fetchQ(domain)}); const items=data?.items||[]; return (<div className="card"><h3 className="font-semibold mb-2">Quarantine</h3><div className="divide-y divide-white/10">{items.map(q=> <div key={q.id} className="py-2">[{q.score}] {q.sender} → {q.rcpt} — <span className="text-tnsmuted">{q.subject}</span></div>)}{!items.length && <div className="py-2 text-tnsmuted">No quarantined messages.</div>}</div></div>) }

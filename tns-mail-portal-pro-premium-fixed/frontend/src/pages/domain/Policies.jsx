
import React from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
async function fetchPolicies(domain){ const r=await fetch(`/api/policies?domain=${encodeURIComponent(domain)}`); return r.json() }
export default function Policies(){ const { domain } = useParams(); const qc=useQueryClient(); const { data }=useQuery({ queryKey:['policies',domain], queryFn:()=>fetchPolicies(domain)}); const item=data?.item||{}; async function save(e){ e.preventDefault(); const fd=new FormData(e.currentTarget); const attr={ description: fd.get('description') }; const r=await fetch('/api/policies',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ domain, attr })}); await r.json(); qc.invalidateQueries({ queryKey:['policies',domain]}); } return (<div className="card"><h3 className="font-semibold mb-2">Domain Policies</h3><form onSubmit={save} className="grid gap-2 max-w-xl"><input name="description" defaultValue={item?.description||''} placeholder="Description (example)" className="input"/><button className="btn w-max">Save</button></form></div>) }

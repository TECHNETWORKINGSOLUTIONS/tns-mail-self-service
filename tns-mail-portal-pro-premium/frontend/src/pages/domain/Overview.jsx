
import React from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'

async function fetchDKIM(domain){ const r=await fetch(`/api/dkim?domain=${encodeURIComponent(domain)}`); return r.json() }
async function fetchDNS(domain){ const r=await fetch(`/api/dns/${encodeURIComponent(domain)}`); return r.json() }

export default function Overview(){
  const { domain } = useParams()
  const { data: dkim } = useQuery({ queryKey:['dkim', domain], queryFn: ()=>fetchDKIM(domain) })
  const { data: dns }  = useQuery({ queryKey:['dns', domain],  queryFn: ()=>fetchDNS(domain) })
  return (
    <div className="grid md:grid-cols-2 gap-3">
      <div className="card">
        <h3 className="font-semibold mb-2">DKIM</h3>
        <pre className="output">{JSON.stringify(dkim?.data || {}, null, 2)}</pre>
      </div>
      <div className="card">
        <h3 className="font-semibold mb-2">DNS Status</h3>
        <pre className="output">{JSON.stringify(dns?.result || {}, null, 2)}</pre>
      </div>
    </div>
  )
}

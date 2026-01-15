
import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

async function fetchDomains(){
  const r = await fetch('/api/domains'); return r.json();
}

export default function Domains(){
  const { data } = useQuery({ queryKey:['domains'], queryFn: fetchDomains })
  const items = data?.items || []
  return (
    <div className="space-y-4">
      <div className="card">
        <h2 className="text-lg font-semibold mb-3">Domains</h2>
        <div className="divide-y divide-white/10">
          {items.map(d => (
            <Link key={d.domain} to={`/domains/${d.domain}/overview`} className="flex items-center justify-between py-2 hover:bg-white/5 px-2 rounded">
              <div>{d.domain}</div>
              <div className="text-tnsmuted text-sm">click to manage</div>
            </Link>
          ))}
          {!items.length && <div className="py-2 text-tnsmuted">No domains yet.</div>}
        </div>
      </div>
    </div>
  )
}

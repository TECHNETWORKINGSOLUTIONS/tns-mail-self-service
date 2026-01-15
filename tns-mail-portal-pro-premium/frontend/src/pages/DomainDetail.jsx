
import React from 'react'
import { Routes, Route, Link, useParams, Navigate } from 'react-router-dom'
import Overview from './domain/Overview'
import Mailboxes from './domain/Mailboxes'
import Aliases from './domain/Aliases'
import Security from './domain/Security'
import Policies from './domain/Policies'
import Quarantine from './domain/Quarantine'

function TabLink({to, children}){
  return <Link to={to} className="px-3 py-2 rounded-md bg-white/5 hover:bg-white/10">{children}</Link>
}

export default function DomainDetail(){
  const { domain } = useParams()
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{domain}</h2>
      </div>
      <div className="flex gap-2">
        <TabLink to={`overview`}>Overview</TabLink>
        <TabLink to={`mailboxes`}>Mailboxes</TabLink>
        <TabLink to={`aliases`}>Aliases</TabLink>
        <TabLink to={`security`}>Security</TabLink>
        <TabLink to={`policies`}>Policies</TabLink>
        <TabLink to={`quarantine`}>Quarantine</TabLink>
      </div>
      <Routes>
        <Route path="overview" element={<Overview/>} />
        <Route path="mailboxes" element={<Mailboxes/>} />
        <Route path="aliases" element={<Aliases/>} />
        <Route path="security" element={<Security/>} />
        <Route path="policies" element={<Policies/>} />
        <Route path="quarantine" element={<Quarantine/>} />
        <Route path="*" element={<Navigate to="overview" replace/>} />
      </Routes>
    </div>
  )
}

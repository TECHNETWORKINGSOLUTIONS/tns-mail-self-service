
import React from 'react'
import { Link, useLocation } from 'react-router-dom'
function NavLink({to, children}){ const loc=useLocation(); const active=loc.pathname.startsWith(to); return <Link to={to} className={`block px-3 py-2 rounded-md ${active? 'bg-white/10 text-white':'text-tnsink/80 hover:text-white'}`}>{children}</Link> }
export default function Layout({children}){ return (<div className="min-h-screen bg-tnsbg text-tnsink flex"><aside className="w-64 p-4 border-r border-white/10"><div className="text-xl font-bold mb-4">TNS Mail</div><nav className="space-y-1"><NavLink to="/">Dashboard</NavLink><NavLink to="/domains">Domains</NavLink><NavLink to="/tools">Tools</NavLink></nav></aside><main className="flex-1 p-6">{children}</main></div>) }

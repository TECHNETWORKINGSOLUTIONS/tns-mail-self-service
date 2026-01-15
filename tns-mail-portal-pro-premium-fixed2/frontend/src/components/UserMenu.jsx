
import React, { useEffect, useState } from 'react'

export default function UserMenu(){
  const [user,setUser]=useState(null)
  useEffect(()=>{ fetch('/me').then(r=> r.ok? r.json():Promise.resolve(null)).then(x=> setUser(x?.user||null)).catch(()=>{}) },[])
  if(!user) return <button className="btn-ghost" onClick={()=> window.location.href='/auth/login'}>Login</button>
  return (
    <div className="flex items-center gap-2">
      <div className="text-sm text-tnsmuted">{user.email||user.sub}</div>
      <button className="btn-ghost" onClick={async()=>{ await fetch('/auth/logout',{method:'POST'}); window.location.reload(); }}>Logout</button>
    </div>
  )
}

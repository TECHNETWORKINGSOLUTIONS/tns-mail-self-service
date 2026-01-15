
import React from 'react'
export default function Topbar({title, actions}){
  return (
    <div className="flex items-center justify-between mb-4">
      <h1 className="text-xl font-bold">{title}</h1>
      <div className="flex items-center gap-2">{actions}</div>
    </div>
  )
}

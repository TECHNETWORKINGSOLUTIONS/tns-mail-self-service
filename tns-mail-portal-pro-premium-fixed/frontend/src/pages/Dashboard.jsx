
import React from 'react'
export default function Dashboard(){ return (<div className="space-y-4"><div className="card"><h2 className="text-lg font-semibold mb-2">Welcome</h2><p>Provision domains, manage mailboxes and aliases, check DNS, and more.</p></div><div className="grid md:grid-cols-3 gap-3"><div className="card"><b>Step 1</b><div>Provision a domain in Domains → New</div></div><div className="card"><b>Step 2</b><div>Add mailboxes & aliases</div></div><div className="card"><b>Step 3</b><div>Copy DKIM & set DNS</div></div></div></div>) }

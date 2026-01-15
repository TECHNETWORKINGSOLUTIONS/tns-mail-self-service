
import React from 'react'
import { createRoot } from 'react-dom/client'
import './theme.css'

function Section({title, children}){
  return (
    <section className="bg-tnspanel/100 border border-white/10 rounded-xl p-4 my-4">
      <h2 className="text-lg font-semibold mb-2">{title}</h2>
      {children}
    </section>
  )
}

function App(){
  const [prov, setProv] = React.useState(null)
  const [dns, setDns] = React.useState(null)
  const [mbx, setMbx] = React.useState(null)

  async function provision(e){
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const payload = Object.fromEntries(fd.entries())
    setProv('Processing...')
    const r = await fetch('/api/provision',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
    setProv(await r.json())
  }

  async function checkDns(e){
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const d = fd.get('domain')
    setDns('Checking...')
    const r = await fetch('/api/dns/'+encodeURIComponent(d))
    setDns(await r.json())
  }

  async function createMailbox(e){
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const payload = Object.fromEntries(fd.entries())
    setMbx('Creating...')
    const r = await fetch('/api/mailbox',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
    setMbx(await r.json())
  }

  return (
    <div className="min-h-screen bg-tnsbg text-tnsink">
      <div className="max-w-5xl mx-auto p-4">
        <header className="my-4">
          <h1 className="text-2xl font-bold">TNS Mail Service</h1>
          <p className="text-tnsmuted">Provision domains, verify DNS, manage basics—fast.</p>
        </header>

        <Section title="Provision Domain">
          <form onSubmit={provision} className="grid gap-2 md:grid-cols-3">
            <input name="domain" placeholder="domain.tld" className="input" required />
            <input name="email" placeholder="admin@domain.tld" className="input" required />
            <input name="password" type="password" placeholder="Admin password" className="input" required />
            <div className="md:col-span-3">
              <button className="btn">Provision</button>
            </div>
          </form>
          <pre className="output">{prov ? JSON.stringify(prov,null,2) : ''}</pre>
        </Section>

        <Section title="DNS Check">
          <form onSubmit={checkDns} className="grid gap-2 md:grid-cols-3">
            <input name="domain" placeholder="domain.tld" className="input" required />
            <div className="md:col-span-3"><button className="btn">Check</button></div>
          </form>
          <pre className="output">{dns ? JSON.stringify(dns,null,2) : ''}</pre>
        </Section>

        <Section title="Create Mailbox (Quick)">
          <form onSubmit={createMailbox} className="grid gap-2 md:grid-cols-4">
            <input name="domain" placeholder="domain.tld" className="input" required />
            <input name="local_part" placeholder="info" className="input" required />
            <input name="password" type="password" placeholder="Mailbox password" className="input" required />
            <input name="quota" placeholder="1024" className="input" />
            <div className="md:col-span-4"><button className="btn">Create</button></div>
          </form>
          <pre className="output">{mbx ? JSON.stringify(mbx,null,2) : ''}</pre>
        </Section>
      </div>
    </div>
  )
}

createRoot(document.getElementById('root')).render(<App />)

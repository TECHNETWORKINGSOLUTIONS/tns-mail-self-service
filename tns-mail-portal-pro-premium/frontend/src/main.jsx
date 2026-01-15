
import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import toast, { Toaster } from 'react-hot-toast'
import './theme.css'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Domains from './pages/Domains'
import DomainDetail from './pages/DomainDetail'
import Tools from './pages/Tools'

const qc = new QueryClient()

function App(){
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard/>} />
            <Route path="/domains" element={<Domains/>} />
            <Route path="/domains/:domain/*" element={<DomainDetail/>} />
            <Route path="/tools" element={<Tools/>} />
            <Route path="*" element={<Navigate to="/" replace/>} />
          </Routes>
        </Layout>
      </BrowserRouter>
      <Toaster position="bottom-right"/>
    </QueryClientProvider>
  )
}
createRoot(document.getElementById('root')).render(<App />)

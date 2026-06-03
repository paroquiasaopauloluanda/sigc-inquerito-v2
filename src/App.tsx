import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { PaginaInquerito } from './pages/PaginaInquerito'
import { PaginaAdmin } from './pages/PaginaAdmin'
import { PaginaRoot } from './pages/PaginaRoot'
import { PaginaQR } from './pages/PaginaQR'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PaginaInquerito />} />
        <Route path="/admin" element={<PaginaAdmin />} />
        <Route path="/root" element={<PaginaRoot />} />
        <Route path="/qr" element={<PaginaQR />} />
      </Routes>
    </BrowserRouter>
  )
}

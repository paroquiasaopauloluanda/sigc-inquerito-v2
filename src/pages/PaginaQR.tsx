import React, { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { NOME_SISTEMA, ANO_CATEQUETICO } from '../lib/config'

export function PaginaQR() {
  const url = typeof window !== 'undefined'
    ? window.location.origin + '/'
    : 'https://inquerito.netlify.app/'
  const [tamanho, setTamanho] = useState(220)

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,var(--purple-50) 0%,var(--gray-50) 60%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: '28px 22px', width: '100%', maxWidth: 400, boxShadow: '0 8px 32px rgba(0,0,0,.1)', textAlign: 'center' }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--purple-600)', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 6 }}>QR Code do inquérito</div>
        <h1 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 4 }}>{NOME_SISTEMA}</h1>
        <p style={{ fontSize: '0.82rem', color: 'var(--gray-400)', marginBottom: 20 }}>{ANO_CATEQUETICO}</p>
        <div style={{ display: 'inline-flex', padding: 14, background: '#fff', border: '3px solid var(--purple-200)', borderRadius: 14, marginBottom: 16 }}>
          <QRCodeSVG value={url} size={tamanho} level="H" fgColor="#4c1d95" bgColor="#ffffff" />
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginBottom: 18, wordBreak: 'break-all' }}>{url}</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 18 }}>
          {[160, 220, 280].map(s => (
            <button key={s} onClick={() => setTamanho(s)} style={{ padding: '7px 14px', borderRadius: 8, border: `2px solid ${tamanho === s ? 'var(--purple-600)' : 'var(--gray-200)'}`, background: tamanho === s ? 'var(--purple-50)' : '#fff', color: tamanho === s ? 'var(--purple-700)' : 'var(--gray-600)', fontWeight: tamanho === s ? 600 : 400, fontSize: '0.82rem', cursor: 'pointer' }}>
              {s === 160 ? 'P' : s === 220 ? 'M' : 'G'}
            </button>
          ))}
        </div>
        <button onClick={() => window.print()} style={{ width: '100%', padding: '13px', borderRadius: 12, background: 'linear-gradient(135deg,var(--purple-600),var(--purple-800))', color: '#fff', fontWeight: 700, fontSize: '0.95rem', border: 'none', cursor: 'pointer' }}>
          🖨️ Imprimir QR Code
        </button>
      </div>
    </div>
  )
}

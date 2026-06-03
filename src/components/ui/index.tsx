import React, { useState } from 'react'

// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 16,
      border: '1px solid var(--gray-200)',
      overflow: 'hidden', ...style,
    }}>{children}</div>
  )
}

// ── CardHeader ────────────────────────────────────────────────────────────────
export function CardHeader({ title, subtitle, action }: {
  title: string; subtitle?: string; action?: React.ReactNode
}) {
  return (
    <div style={{
      padding: '16px 16px 12px',
      borderBottom: '1px solid var(--gray-100)',
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8,
    }}>
      <div>
        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--gray-900)' }}>{title}</div>
        {subtitle && <div style={{ fontSize: '0.78rem', color: 'var(--gray-500)', marginTop: 2 }}>{subtitle}</div>}
      </div>
      {action}
    </div>
  )
}

// ── Btn ───────────────────────────────────────────────────────────────────────
type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant; size?: 'sm' | 'md'; full?: boolean; loading?: boolean
}
const btnStyles: Record<BtnVariant, React.CSSProperties> = {
  primary: { background: 'linear-gradient(135deg,var(--purple-600),var(--purple-800))', color: '#fff', border: 'none', boxShadow: '0 3px 10px rgba(109,40,217,.3)' },
  secondary: { background: '#fff', color: 'var(--purple-700)', border: '1.5px solid var(--purple-300)' },
  ghost: { background: 'transparent', color: 'var(--gray-600)', border: '1.5px solid var(--gray-200)' },
  danger: { background: '#fff', color: '#dc2626', border: '1.5px solid #fca5a5' },
}
export function Btn({ variant = 'primary', size = 'md', full, loading, children, disabled, style, ...rest }: BtnProps) {
  return (
    <button
      disabled={disabled || loading}
      style={{
        fontFamily: 'inherit', cursor: disabled || loading ? 'not-allowed' : 'pointer',
        borderRadius: 10, fontWeight: 600, transition: 'all .18s',
        opacity: disabled || loading ? .55 : 1,
        padding: size === 'sm' ? '7px 14px' : '12px 20px',
        fontSize: size === 'sm' ? '0.82rem' : '0.93rem',
        width: full ? '100%' : undefined,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        ...btnStyles[variant], ...style,
      }}
      {...rest}
    >
      {loading ? '⏳' : children}
    </button>
  )
}

// ── Input ─────────────────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string; error?: string; hint?: string
}
export function Input({ label, error, hint, style, ...rest }: InputProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && <label style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--gray-700)' }}>{label}</label>}
      <input
        style={{
          padding: '11px 13px', borderRadius: 10, fontFamily: 'inherit',
          border: `1.5px solid ${error ? '#fca5a5' : 'var(--gray-200)'}`,
          fontSize: '0.95rem', outline: 'none', width: '100%',
          color: 'var(--gray-800)', background: '#fff', ...style,
        }}
        {...rest}
      />
      {error && <span style={{ fontSize: '0.78rem', color: '#dc2626' }}>{error}</span>}
      {hint && !error && <span style={{ fontSize: '0.78rem', color: 'var(--gray-400)' }}>{hint}</span>}
    </div>
  )
}

// ── Textarea ──────────────────────────────────────────────────────────────────
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string; error?: string
}
export function Textarea({ label, error, style, ...rest }: TextareaProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && <label style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--gray-700)' }}>{label}</label>}
      <textarea
        style={{
          padding: '11px 13px', borderRadius: 10, fontFamily: 'inherit',
          border: `1.5px solid ${error ? '#fca5a5' : 'var(--gray-200)'}`,
          fontSize: '0.95rem', outline: 'none', width: '100%', resize: 'vertical',
          color: 'var(--gray-800)', minHeight: 80, lineHeight: 1.6, ...style,
        }}
        {...rest}
      />
      {error && <span style={{ fontSize: '0.78rem', color: '#dc2626' }}>{error}</span>}
    </div>
  )
}

// ── Select ────────────────────────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string; error?: string; options: { value: string; label: string }[]
}
export function Select({ label, error, options, style, ...rest }: SelectProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && <label style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--gray-700)' }}>{label}</label>}
      <select
        style={{
          padding: '11px 13px', borderRadius: 10, fontFamily: 'inherit',
          border: `1.5px solid ${error ? '#fca5a5' : 'var(--gray-200)'}`,
          fontSize: '0.95rem', outline: 'none', width: '100%',
          color: 'var(--gray-800)', background: '#fff', ...style,
        }}
        {...rest}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error && <span style={{ fontSize: '0.78rem', color: '#dc2626' }}>{error}</span>}
    </div>
  )
}

// ── Badge ─────────────────────────────────────────────────────────────────────
export function Badge({ children, color = 'purple' }: { children: React.ReactNode; color?: 'purple' | 'green' | 'amber' | 'red' | 'gray' }) {
  const colors = {
    purple: { bg: 'var(--purple-50)', color: 'var(--purple-700)', border: 'var(--purple-200)' },
    green: { bg: '#ecfdf5', color: '#065f46', border: '#a7f3d0' },
    amber: { bg: '#fffbeb', color: '#92400e', border: '#fde68a' },
    red: { bg: '#fef2f2', color: '#991b1b', border: '#fca5a5' },
    gray: { bg: 'var(--gray-100)', color: 'var(--gray-600)', border: 'var(--gray-200)' },
  }
  const c = colors[color]
  return (
    <span style={{
      padding: '3px 8px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600,
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
    }}>{children}</span>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode
}) {
  if (!open) return null
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 999,
        background: 'rgba(0,0,0,.5)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        padding: '0 0 0 0',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: '#fff', borderRadius: '20px 20px 0 0',
        width: '100%', maxWidth: 560, maxHeight: '92vh',
        display: 'flex', flexDirection: 'column',
        animation: 'slideUp .3s ease',
      }}>
        <div style={{
          padding: '16px 16px 12px',
          borderBottom: '1px solid var(--gray-100)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexShrink: 0,
        }}>
          <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--gray-900)' }}>{title}</span>
          <button onClick={onClose} style={{
            background: 'var(--gray-100)', border: 'none', borderRadius: '50%',
            width: 32, height: 32, cursor: 'pointer', fontSize: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>×</button>
        </div>
        <div style={{ overflowY: 'auto', padding: '16px', flex: 1 }}>{children}</div>
      </div>
    </div>
  )
}

// ── Estrelas (input) ──────────────────────────────────────────────────────────
export function Estrelas({ valor, onChange, label, required }: {
  valor: number; onChange: (v: number) => void; label?: string; required?: boolean
}) {
  const [hover, setHover] = useState(0)
  const labels = ['', 'Muito fraco', 'Fraco', 'Razoável', 'Bom', 'Excelente']
  const activo = hover || valor
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {label && <span style={{ fontSize: '0.93rem', fontWeight: 500, color: 'var(--gray-700)' }}>
        {label}{required && <span style={{ color: '#dc2626', marginLeft: 2 }}>*</span>}
      </span>}
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        {[1, 2, 3, 4, 5].map(n => (
          <button key={n} type="button"
            onClick={() => onChange(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            style={{ background: 'none', border: 'none', padding: 3, cursor: 'pointer', fontSize: 34, lineHeight: 1, transition: 'transform .15s', transform: activo >= n ? 'scale(1.15)' : 'scale(1)' }}
          >
            <span style={{ color: activo >= n ? '#f59e0b' : '#d1d5db' }}>★</span>
          </button>
        ))}
        {activo > 0 && <span style={{ fontSize: '0.82rem', color: 'var(--gray-500)', marginLeft: 4 }}>{labels[activo]}</span>}
      </div>
    </div>
  )
}

// ── OpcaoCard ─────────────────────────────────────────────────────────────────
export function OpcaoCard({ opcoes, valor, onChange, label, required, multi, colunas = 2 }: {
  opcoes: string[]; valor: string; onChange: (v: string) => void
  label?: string; required?: boolean; multi?: boolean; colunas?: number
}) {
  function toggle(op: string) {
    if (!multi) { onChange(op); return }
    const sel = valor ? valor.split('|') : []
    const idx = sel.indexOf(op)
    if (idx >= 0) sel.splice(idx, 1); else sel.push(op)
    onChange(sel.join('|'))
  }
  function isSelected(op: string) {
    if (!multi) return valor === op
    return valor?.split('|').includes(op)
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {label && <span style={{ fontSize: '0.93rem', fontWeight: 500, color: 'var(--gray-700)' }}>
        {label}{required && <span style={{ color: '#dc2626', marginLeft: 2 }}>*</span>}
      </span>}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(colunas, opcoes.length)}, 1fr)`, gap: 8 }}>
        {opcoes.map(op => {
          const sel = isSelected(op)
          return (
            <button key={op} type="button" onClick={() => toggle(op)} style={{
              padding: '11px 8px', borderRadius: 10, textAlign: 'center',
              border: `2px solid ${sel ? 'var(--purple-600)' : 'var(--gray-200)'}`,
              background: sel ? 'var(--purple-50)' : '#fff',
              color: sel ? 'var(--purple-800)' : 'var(--gray-700)',
              fontWeight: sel ? 600 : 400, fontSize: '0.88rem',
              cursor: 'pointer', transition: 'all .18s', lineHeight: 1.4,
            }}>{op}</button>
          )
        })}
      </div>
    </div>
  )
}

// ── Progress ──────────────────────────────────────────────────────────────────
export function ProgressBar({ atual, total, label }: { atual: number; total: number; label?: string }) {
  const pct = Math.round((atual / total) * 100)
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.8rem' }}>
        <span style={{ color: 'var(--gray-500)' }}>{label ?? `${atual} de ${total}`}</span>
        <span style={{ color: 'var(--purple-600)', fontWeight: 600 }}>{pct}%</span>
      </div>
      <div style={{ height: 6, borderRadius: 99, background: 'var(--gray-200)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: 'linear-gradient(90deg,var(--purple-500),var(--purple-700))', transition: 'width .4s ease' }} />
      </div>
    </div>
  )
}

// ── KpiCard ───────────────────────────────────────────────────────────────────
export function KpiCard({ valor, label, icon, cor }: { valor: string | number; label: string; icon: string; cor?: string }) {
  return (
    <div style={{ background: '#fff', borderRadius: 14, padding: 14, border: '1px solid var(--gray-200)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        {cor && <span style={{ width: 8, height: 8, borderRadius: '50%', background: cor, marginTop: 4 }} />}
      </div>
      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--gray-900)', lineHeight: 1 }}>{valor}</div>
      <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: 4 }}>{label}</div>
    </div>
  )
}

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner() {
  return (
    <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--gray-400)' }}>
      <div style={{ fontSize: 28, marginBottom: 8, animation: 'pulse 1.5s ease-in-out infinite' }}>⏳</div>
      <div style={{ fontSize: '0.85rem' }}>A carregar…</div>
    </div>
  )
}

// ── TabBar ────────────────────────────────────────────────────────────────────
export function TabBar({ tabs, active, onChange }: {
  tabs: { id: string; label: string; icon?: string }[]
  active: string; onChange: (id: string) => void
}) {
  return (
    <div style={{
      display: 'flex', overflowX: 'auto', gap: 2,
      borderBottom: '2px solid var(--gray-200)',
      marginBottom: 16, scrollbarWidth: 'none',
    }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)} style={{
          padding: '10px 14px', border: 'none', background: 'none', cursor: 'pointer',
          fontWeight: active === t.id ? 700 : 400, whiteSpace: 'nowrap',
          color: active === t.id ? 'var(--purple-700)' : 'var(--gray-500)',
          fontSize: '0.85rem', flexShrink: 0,
          borderBottom: `3px solid ${active === t.id ? 'var(--purple-600)' : 'transparent'}`,
          marginBottom: -2, transition: 'all .18s',
        }}>
          {t.icon && <span style={{ marginRight: 4 }}>{t.icon}</span>}{t.label}
        </button>
      ))}
    </div>
  )
}

// ── EmptyState ────────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, subtitle, action }: {
  icon: string; title: string; subtitle?: string; action?: React.ReactNode
}) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontWeight: 600, color: 'var(--gray-700)', marginBottom: 4 }}>{title}</div>
      {subtitle && <div style={{ fontSize: '0.85rem', color: 'var(--gray-400)', marginBottom: 16 }}>{subtitle}</div>}
      {action}
    </div>
  )
}

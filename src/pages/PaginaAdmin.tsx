import React, { useState, useEffect, useCallback } from 'react'
import type { Centro, Catequista, FaixaEtaria, Seccao, Pergunta, PerguntaDesactivada, Resposta, NivelAcesso } from '../types'
import {
  getCentros, getCatequistas, getFaixas, getSeccoes, getPerguntas,
  getPerguntasDesactivadas, getRespostas,
  saveSeccao, deleteSeccao, savePergunta, deletePergunta,
  savePerguntasDesactivadas, getDefaultSeccoes, getDefaultPerguntas,
} from '../lib/api'
import { getPerguntasParaCentro } from '../lib/stats'
import { StatsDashboard } from '../components/admin/StatsDashboard'
import { EditorPerguntas } from '../components/admin/EditorPerguntas'
import { Btn, TabBar, Spinner, EmptyState, Badge, Modal, Input } from '../components/ui'
import { NOME_SISTEMA } from '../lib/config'

const SESSION_KEY = '_sigc_admin_sess'

interface Sessao { centro_id: string; nivel: NivelAcesso }

export function PaginaAdmin() {
  const [sessao, setSessao] = useState<Sessao | null>(() => {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? 'null') } catch { return null }
  })
  const [centros, setCentros] = useState<Centro[]>([])
  const [catequistas, setCatequistas] = useState<Catequista[]>([])
  const [faixas, setFaixas] = useState<FaixaEtaria[]>([])
  const [seccoes, setSeccoes] = useState<Seccao[]>([])
  const [perguntas, setPerguntas] = useState<Pergunta[]>([])
  const [desactivadas, setDesactivadas] = useState<PerguntaDesactivada[]>([])
  const [respostas, setRespostas] = useState<Resposta[]>([])
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState('stats')
  const [carregando, setCarregando] = useState(true)

  // Login state
  const [loginCentroId, setLoginCentroId] = useState('')
  const [loginSenha, setLoginSenha] = useState('')
  const [loginErro, setLoginErro] = useState('')

  useEffect(() => {
    async function init() {
      const [cs, cats, fxs, secs, pergs, desact, resps] = await Promise.all([
        getCentros(), getCatequistas(), getFaixas(),
        getSeccoes(), getPerguntas(), getPerguntasDesactivadas(), getRespostas(),
      ])
      setCentros(cs.filter(c => c.activo))
      setCatequistas(cats)
      setFaixas(fxs.filter(f => f.activo).sort((a, b) => a.ordem - b.ordem))
      setSeccoes(secs.length ? secs : getDefaultSeccoes())
      setPerguntas(pergs.length ? pergs : getDefaultPerguntas())
      setDesactivadas(desact)
      setRespostas(resps)
      setCarregando(false)
    }
    init()
  }, [])

  function login() {
    const centro = centros.find(c => c.id === loginCentroId)
    if (!centro) { setLoginErro('Selecciona um centro'); return }
    if (loginSenha === centro.senha_coord) {
      const s: Sessao = { centro_id: centro.id, nivel: 'coordenador' }
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(s))
      setSessao(s); setLoginErro('')
    } else if (loginSenha === centro.senha_cat) {
      const s: Sessao = { centro_id: centro.id, nivel: 'catequista' }
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(s))
      setSessao(s); setLoginErro('')
    } else {
      setLoginErro('Senha incorrecta. Tenta novamente.')
      setLoginSenha('')
    }
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY)
    setSessao(null)
    setLoginSenha('')
    setLoginErro('')
  }

  if (carregando) return <Shell title="Admin"><Spinner /></Shell>

  if (!sessao) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#1e1b4b 0%,#312e81 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div style={{ background: '#fff', borderRadius: 20, padding: '32px 22px', width: '100%', maxWidth: 380, boxShadow: '0 20px 60px rgba(0,0,0,.3)' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg,var(--purple-600),var(--purple-800))', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>⚙️</div>
            <h1 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Portal do Centro</h1>
            <p style={{ fontSize: '0.82rem', color: 'var(--gray-400)', marginTop: 3 }}>{NOME_SISTEMA}</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--gray-700)', display: 'block', marginBottom: 5 }}>
                Centro de catequese
              </label>
              <select
                value={loginCentroId}
                onChange={e => setLoginCentroId(e.target.value)}
                style={{ width: '100%', padding: '11px 13px', borderRadius: 10, border: '1.5px solid var(--gray-200)', fontFamily: 'inherit', fontSize: '0.95rem', outline: 'none', background: '#fff' }}
              >
                <option value="">— Seleccionar centro —</option>
                {centros.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--gray-700)', display: 'block', marginBottom: 5 }}>
                Senha
              </label>
              <input
                type="password" value={loginSenha} placeholder="••••••••"
                onChange={e => { setLoginSenha(e.target.value); setLoginErro('') }}
                onKeyDown={e => e.key === 'Enter' && login()}
                style={{ width: '100%', padding: '11px 13px', borderRadius: 10, border: `1.5px solid ${loginErro ? '#fca5a5' : 'var(--gray-200)'}`, fontFamily: 'inherit', fontSize: '1rem', outline: 'none' }}
                autoFocus
              />
              {loginErro && <p style={{ fontSize: '0.78rem', color: '#dc2626', marginTop: 4 }}>{loginErro}</p>}
            </div>

            <Btn full onClick={login}>Entrar</Btn>

            <p style={{ fontSize: '0.75rem', color: 'var(--gray-400)', textAlign: 'center', lineHeight: 1.5 }}>
              Usa a senha de coordenador ou de catequista<br />conforme o teu papel.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!sessao) return null
  const centro = centros.find(c => c.id === sessao.centro_id)
  const isCoord = sessao.nivel === 'coordenador'
  const respostasCentro = respostas.filter(r => r.centro_id === sessao.centro_id)
  const desactivadasCentro = desactivadas.filter(d => d.centro_id === sessao.centro_id).map(d => d.pergunta_id)
  const perguntasParaCentro = getPerguntasParaCentro(perguntas, seccoes, sessao.centro_id, desactivadasCentro)
    .flatMap(s => s.perguntas)

  const tabs = [
    { id: 'stats', label: 'Estatísticas', icon: '📊' },
    ...(isCoord ? [{ id: 'inquerito', label: 'Inquérito', icon: '📝' }] : []),
  ]

  async function handleSaveSeccao(s: Seccao) {
    await saveSeccao(s)
    setSeccoes(prev => {
      const idx = prev.findIndex(x => x.id === s.id)
      if (idx >= 0) { const n = [...prev]; n[idx] = s; return n }
      return [...prev, s]
    })
  }

  async function handleDeleteSeccao(id: string) {
    if (!confirm('Eliminar esta secção e todas as suas perguntas?')) return
    await deleteSeccao(id)
    setSeccoes(prev => prev.filter(s => s.id !== id))
    setPerguntas(prev => prev.filter(p => p.seccao_id !== id))
  }

  async function handleSavePergunta(p: Pergunta) {
    await savePergunta(p)
    setPerguntas(prev => {
      const idx = prev.findIndex(x => x.id === p.id)
      if (idx >= 0) { const n = [...prev]; n[idx] = p; return n }
      return [...prev, p]
    })
  }

  async function handleDeletePergunta(id: string) {
    if (!confirm('Eliminar esta pergunta?')) return
    await deletePergunta(id)
    setPerguntas(prev => prev.filter(p => p.id !== id))
  }

  async function handleToggleDesactivada(pid: string, estaDesactivada: boolean) {
    if (!sessao) return
    const novas = estaDesactivada
      ? desactivadasCentro.filter(x => x !== pid)
      : [...desactivadasCentro, pid]
    await savePerguntasDesactivadas(sessao.centro_id, novas)
    setDesactivadas(prev => [
      ...prev.filter(d => d.centro_id !== sessao!.centro_id),
      ...novas.map(p => ({ centro_id: sessao!.centro_id, pergunta_id: p })),
    ])
  }

  return (
    <Shell
      title={centro?.nome ?? 'Centro'}
      subtitle={isCoord ? 'Coordenador' : 'Catequista'}
      onLogout={logout}
    >
      <TabBar tabs={tabs} active={tab} onChange={setTab} />

      {tab === 'stats' && (
        <StatsDashboard
          respostas={respostasCentro}
          perguntas={perguntasParaCentro}
          seccoes={seccoes}
          catequistas={catequistas.filter(c => c.centros_ids.includes(sessao!.centro_id))}
          centros={centros}
          faixas={faixas}
          mostrarFiltroCentro={false}
          centroFixo={sessao!.centro_id}
        />
      )}

      {tab === 'inquerito' && isCoord && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ padding: '12px 14px', background: 'var(--purple-50)', border: '1px solid var(--purple-200)', borderRadius: 10, fontSize: '0.82rem', color: 'var(--purple-700)', lineHeight: 1.5 }}>
            ℹ️ As perguntas <strong>base</strong> aparecem em todos os centros — activa ou desactiva com a checkbox.
            Podes adicionar perguntas próprias ao teu centro em cada secção.
          </div>
          <EditorPerguntas
            seccoes={seccoes}
            perguntas={perguntas}
            centro_id={sessao.centro_id}
            desactivadas={desactivadasCentro}
            onSaveSeccao={handleSaveSeccao}
            onDeleteSeccao={handleDeleteSeccao}
            onSavePergunta={handleSavePergunta}
            onDeletePergunta={handleDeletePergunta}
            onToggleDesactivada={handleToggleDesactivada}
          />
        </div>
      )}
    </Shell>
  )
}

function Shell({ title, subtitle, onLogout, children }: { title: string; subtitle?: string; onLogout?: () => void; children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--gray-50)' }}>
      <div style={{ background: 'linear-gradient(135deg,var(--purple-700),var(--purple-900))', padding: '13px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 12px rgba(0,0,0,.2)' }}>
        <div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem' }}>✝️ {title}</div>
          {subtitle && <div style={{ color: 'rgba(255,255,255,.65)', fontSize: '0.75rem' }}>{subtitle}</div>}
        </div>
        {onLogout && (
          <Btn size="sm" onClick={onLogout} style={{ background: 'rgba(255,255,255,.15)', color: '#fff', border: 'none' }}>
            Sair
          </Btn>
        )}
      </div>
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '18px 14px 48px' }}>
        {children}
      </div>
    </div>
  )
}

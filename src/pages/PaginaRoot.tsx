import React, { useState, useEffect } from 'react'
import type { Centro, Catequista, FaixaEtaria, Seccao, Pergunta, Resposta } from '../types'
import {
  getCentros, saveCentro, deleteCentro,
  getCatequistas, saveCatequista, deleteCatequista,
  getFaixas, saveFaixa, deleteFaixa,
  getSeccoes, getPerguntas, getRespostas,
  saveSeccao, deleteSeccao, savePergunta, deletePergunta,
  getDefaultSeccoes, getDefaultPerguntas,
} from '../lib/api'
import { ROOT_PASSWORD, NOME_SISTEMA } from '../lib/config'
import { StatsDashboard } from '../components/admin/StatsDashboard'
import { EditorPerguntas } from '../components/admin/EditorPerguntas'
import { Btn, TabBar, Spinner, Modal, Input, Textarea, EmptyState, Badge, Card, CardHeader } from '../components/ui'

const SESSION_KEY = '_sigc_root'

export function PaginaRoot() {
  const [auth, setAuth] = useState(() => sessionStorage.getItem(SESSION_KEY) === '1')
  const [senha, setSenha] = useState('')
  const [senhaErro, setSenhaErro] = useState(false)

  const [centros, setCentros] = useState<Centro[]>([])
  const [catequistas, setCatequistas] = useState<Catequista[]>([])
  const [faixas, setFaixas] = useState<FaixaEtaria[]>([])
  const [seccoes, setSeccoes] = useState<Seccao[]>([])
  const [perguntas, setPerguntas] = useState<Pergunta[]>([])
  const [respostas, setRespostas] = useState<Resposta[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('stats')

  useEffect(() => {
    if (!auth) return
    async function init() {
      const [cs, cats, fxs, secs, pergs, resps] = await Promise.all([
        getCentros(), getCatequistas(), getFaixas(),
        getSeccoes(), getPerguntas(), getRespostas(),
      ])
      setCentros(cs)
      setCatequistas(cats)
      setFaixas(fxs.sort((a, b) => a.ordem - b.ordem))
      setSeccoes(secs.length ? secs : getDefaultSeccoes())
      setPerguntas(pergs.length ? pergs : getDefaultPerguntas())
      setRespostas(resps)
      setLoading(false)
    }
    init()
  }, [auth])

  function login() {
    if (senha === ROOT_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, '1')
      setAuth(true); setSenhaErro(false)
    } else {
      setSenhaErro(true); setSenha('')
    }
  }

  function logout() { sessionStorage.removeItem(SESSION_KEY); setAuth(false) }

  if (!auth) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#0f172a 0%,#1e1b4b 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div style={{ background: '#fff', borderRadius: 20, padding: '32px 22px', width: '100%', maxWidth: 360, boxShadow: '0 20px 60px rgba(0,0,0,.4)' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>🔐</div>
            <h1 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Gestão Root</h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--gray-400)', marginTop: 3 }}>{NOME_SISTEMA}</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              type="password" value={senha} placeholder="Senha root"
              onChange={e => { setSenha(e.target.value); setSenhaErro(false) }}
              onKeyDown={e => e.key === 'Enter' && login()}
              autoFocus
              style={{ padding: '12px 14px', borderRadius: 10, fontFamily: 'inherit', border: `1.5px solid ${senhaErro ? '#fca5a5' : 'var(--gray-200)'}`, fontSize: '1rem', outline: 'none', width: '100%' }}
            />
            {senhaErro && <p style={{ fontSize: '0.78rem', color: '#dc2626' }}>Senha incorrecta.</p>}
            <Btn full onClick={login}>Entrar</Btn>
          </div>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'stats', label: 'Estatísticas', icon: '📊' },
    { id: 'centros', label: 'Centros', icon: '🏛️' },
    { id: 'catequistas', label: 'Catequistas', icon: '👤' },
    { id: 'faixas', label: 'Faixas etárias', icon: '👥' },
    { id: 'inquerito', label: 'Inquérito base', icon: '📝' },
  ]

  async function handleSaveSeccao(s: Seccao) {
    await saveSeccao(s)
    setSeccoes(prev => { const n = [...prev]; const i = n.findIndex(x => x.id === s.id); if (i >= 0) n[i] = s; else n.push(s); return n })
  }
  async function handleDeleteSeccao(id: string) {
    if (!confirm('Eliminar secção?')) return
    await deleteSeccao(id)
    setSeccoes(prev => prev.filter(x => x.id !== id))
    setPerguntas(prev => prev.filter(p => p.seccao_id !== id))
  }
  async function handleSavePergunta(p: Pergunta) {
    await savePergunta(p)
    setPerguntas(prev => { const n = [...prev]; const i = n.findIndex(x => x.id === p.id); if (i >= 0) n[i] = p; else n.push(p); return n })
  }
  async function handleDeletePergunta(id: string) {
    if (!confirm('Eliminar pergunta?')) return
    await deletePergunta(id)
    setPerguntas(prev => prev.filter(p => p.id !== id))
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--gray-50)' }}>
      <div style={{ background: 'linear-gradient(135deg,#0f172a,#1e1b4b)', padding: '13px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
        <div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem' }}>🔐 Gestão Root</div>
          <div style={{ color: 'rgba(255,255,255,.55)', fontSize: '0.72rem' }}>{NOME_SISTEMA}</div>
        </div>
        <Btn size="sm" onClick={logout} style={{ background: 'rgba(255,255,255,.12)', color: '#fff', border: 'none' }}>Sair</Btn>
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '16px 14px 48px' }}>
        {loading ? <Spinner /> : (
          <>
            <TabBar tabs={tabs} active={tab} onChange={setTab} />

            {tab === 'stats' && (
              <StatsDashboard
                respostas={respostas}
                perguntas={perguntas.filter(p => p.centro_id === null)}
                seccoes={seccoes}
                catequistas={catequistas}
                centros={centros}
                faixas={faixas}
                mostrarFiltroCentro={true}
                
              />
            )}

            {tab === 'centros' && (
              <CrudCentros
                centros={centros} catequistas={catequistas}
                onSave={async c => { await saveCentro(c); setCentros(prev => { const n = [...prev]; const i = n.findIndex(x => x.id === c.id); if (i >= 0) n[i] = c; else n.push(c); return n }) }}
                onDelete={async id => { if (!confirm('Eliminar centro?')) return; await deleteCentro(id); setCentros(prev => prev.filter(x => x.id !== id)) }}
              />
            )}

            {tab === 'catequistas' && (
              <CrudCatequistas
                catequistas={catequistas} centros={centros}
                onSave={async c => { await saveCatequista(c); setCatequistas(prev => { const n = [...prev]; const i = n.findIndex(x => x.id === c.id); if (i >= 0) n[i] = c; else n.push(c); return n }) }}
                onDelete={async id => { if (!confirm('Eliminar catequista?')) return; await deleteCatequista(id); setCatequistas(prev => prev.filter(x => x.id !== id)) }}
              />
            )}

            {tab === 'faixas' && (
              <CrudFaixas
                faixas={faixas}
                onSave={async f => { await saveFaixa(f); setFaixas(prev => { const n = [...prev]; const i = n.findIndex(x => x.id === f.id); if (i >= 0) n[i] = f; else n.push(f); return [...n].sort((a, b) => a.ordem - b.ordem) }) }}
                onDelete={async id => { if (!confirm('Eliminar faixa etária?')) return; await deleteFaixa(id); setFaixas(prev => prev.filter(x => x.id !== id)) }}
              />
            )}

            {tab === 'inquerito' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ padding: '12px 14px', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 10, fontSize: '0.82rem', color: '#92400e', lineHeight: 1.5 }}>
                  ⚠️ Aqui gerem-se as <strong>perguntas base</strong> que aparecem em todos os centros. Alterações afectam imediatamente todos os inquéritos.
                </div>
                <EditorPerguntas
                  seccoes={seccoes}
                  perguntas={perguntas}
                  centro_id={null}
                  onSaveSeccao={handleSaveSeccao}
                  onDeleteSeccao={handleDeleteSeccao}
                  onSavePergunta={handleSavePergunta}
                  onDeletePergunta={handleDeletePergunta}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ── CRUD Centros ──────────────────────────────────────────────────────────────
function CrudCentros({ centros, catequistas, onSave, onDelete }: {
  centros: Centro[]; catequistas: Catequista[]
  onSave: (c: Centro) => Promise<void>; onDelete: (id: string) => Promise<void>
}) {
  const [modal, setModal] = useState<Centro | null>(null)
  const [saving, setSaving] = useState(false)
  const empty: Centro = { id: crypto.randomUUID(), nome: '', descricao: '', senha_coord: '', senha_cat: '', activo: true }

  async function guardar() {
    if (!modal || !modal.nome.trim() || !modal.senha_coord || !modal.senha_cat) return
    setSaving(true); await onSave(modal); setSaving(false); setModal(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Btn variant="secondary" size="sm" onClick={() => setModal({ ...empty, id: crypto.randomUUID() })}>+ Novo centro</Btn>
      {centros.length === 0 && <EmptyState icon="🏛️" title="Sem centros" subtitle="Cria o primeiro centro" />}
      {centros.map(c => {
        const nCats = catequistas.filter(ct => ct.centros_ids.includes(c.id)).length
        return (
          <div key={c.id} style={{ background: '#fff', borderRadius: 14, border: '1px solid var(--gray-200)', padding: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--gray-900)', marginBottom: 4 }}>{c.nome}</div>
                {c.descricao && <div style={{ fontSize: '0.82rem', color: 'var(--gray-500)', marginBottom: 6 }}>{c.descricao}</div>}
                <div style={{ display: 'flex', gap: 6 }}>
                  <Badge color={c.activo ? 'green' : 'gray'}>{c.activo ? 'Activo' : 'Inactivo'}</Badge>
                  <Badge color="gray">{nCats} catequista{nCats !== 1 ? 's' : ''}</Badge>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <Btn size="sm" variant="ghost" onClick={() => setModal({ ...c })}>✏️</Btn>
                <Btn size="sm" variant="danger" onClick={() => onDelete(c.id)}>🗑️</Btn>
              </div>
            </div>
          </div>
        )
      })}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal && centros.some(c => c.id === modal.id) ? 'Editar centro' : 'Novo centro'}>
        {modal && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Input label="Nome do centro" required value={modal.nome} onChange={e => setModal(p => p ? { ...p, nome: e.target.value } : null)} />
            <Textarea label="Descrição (opcional)" value={modal.descricao} onChange={e => setModal(p => p ? { ...p, descricao: e.target.value } : null)} style={{ minHeight: 60 }} />
            <Input label="Senha do coordenador" required type="password" value={modal.senha_coord} onChange={e => setModal(p => p ? { ...p, senha_coord: e.target.value } : null)} />
            <Input label="Senha dos catequistas" required type="password" value={modal.senha_cat} onChange={e => setModal(p => p ? { ...p, senha_cat: e.target.value } : null)} />
            <label style={{ display: 'flex', gap: 10, alignItems: 'center', cursor: 'pointer' }}>
              <input type="checkbox" checked={modal.activo} onChange={e => setModal(p => p ? { ...p, activo: e.target.checked } : null)} style={{ width: 18, height: 18, accentColor: 'var(--purple-600)' }} />
              <span style={{ fontSize: '0.9rem' }}>Centro activo (aparece no inquérito)</span>
            </label>
            <div style={{ display: 'flex', gap: 10 }}>
              <Btn variant="ghost" full onClick={() => setModal(null)}>Cancelar</Btn>
              <Btn full loading={saving} disabled={!modal.nome.trim() || !modal.senha_coord || !modal.senha_cat} onClick={guardar}>Guardar</Btn>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

// ── CRUD Catequistas ──────────────────────────────────────────────────────────
function CrudCatequistas({ catequistas, centros, onSave, onDelete }: {
  catequistas: Catequista[]; centros: Centro[]
  onSave: (c: Catequista) => Promise<void>; onDelete: (id: string) => Promise<void>
}) {
  const [modal, setModal] = useState<Catequista | null>(null)
  const [saving, setSaving] = useState(false)

  async function guardar() {
    if (!modal || !modal.nome.trim()) return
    setSaving(true); await onSave(modal); setSaving(false); setModal(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Btn variant="secondary" size="sm" onClick={() => setModal({ id: crypto.randomUUID(), nome: '', centros_ids: [] })}>+ Novo catequista</Btn>
      {catequistas.length === 0 && <EmptyState icon="👤" title="Sem catequistas" subtitle="Regista o primeiro catequista" />}
      {catequistas.map(c => {
        const centrosNome = centros.filter(ct => c.centros_ids.includes(ct.id)).map(ct => ct.nome)
        return (
          <div key={c.id} style={{ background: '#fff', borderRadius: 14, border: '1px solid var(--gray-200)', padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--gray-900)', marginBottom: 6 }}>{c.nome}</div>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' as const }}>
                {centrosNome.length > 0
                  ? centrosNome.map(n => <Badge key={n} color="purple">{n}</Badge>)
                  : <Badge color="gray">Sem centro</Badge>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              <Btn size="sm" variant="ghost" onClick={() => setModal({ ...c, centros_ids: [...c.centros_ids] })}>✏️</Btn>
              <Btn size="sm" variant="danger" onClick={() => onDelete(c.id)}>🗑️</Btn>
            </div>
          </div>
        )
      })}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal && catequistas.some(c => c.id === modal.id) ? 'Editar catequista' : 'Novo catequista'}>
        {modal && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Input label="Nome completo" required value={modal.nome} onChange={e => setModal(p => p ? { ...p, nome: e.target.value } : null)} />
            <div>
              <label style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--gray-700)', display: 'block', marginBottom: 8 }}>Centros</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {centros.map(ct => (
                  <label key={ct.id} style={{ display: 'flex', gap: 10, alignItems: 'center', cursor: 'pointer', padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${modal.centros_ids.includes(ct.id) ? 'var(--purple-400)' : 'var(--gray-200)'}`, background: modal.centros_ids.includes(ct.id) ? 'var(--purple-50)' : '#fff', transition: 'all .15s' }}>
                    <input type="checkbox" checked={modal.centros_ids.includes(ct.id)}
                      onChange={e => {
                        const ids = e.target.checked
                          ? [...modal.centros_ids, ct.id]
                          : modal.centros_ids.filter(x => x !== ct.id)
                        setModal(p => p ? { ...p, centros_ids: ids } : null)
                      }}
                      style={{ width: 17, height: 17, accentColor: 'var(--purple-600)' }}
                    />
                    <span style={{ fontSize: '0.9rem', fontWeight: modal.centros_ids.includes(ct.id) ? 600 : 400, color: modal.centros_ids.includes(ct.id) ? 'var(--purple-800)' : 'var(--gray-700)' }}>{ct.nome}</span>
                  </label>
                ))}
                {centros.length === 0 && <p style={{ fontSize: '0.82rem', color: 'var(--gray-400)' }}>Cria centros primeiro.</p>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <Btn variant="ghost" full onClick={() => setModal(null)}>Cancelar</Btn>
              <Btn full loading={saving} disabled={!modal.nome.trim()} onClick={guardar}>Guardar</Btn>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

// ── CRUD Faixas Etárias ───────────────────────────────────────────────────────
function CrudFaixas({ faixas, onSave, onDelete }: {
  faixas: FaixaEtaria[]
  onSave: (f: FaixaEtaria) => Promise<void>; onDelete: (id: string) => Promise<void>
}) {
  const [modal, setModal] = useState<FaixaEtaria | null>(null)
  const [saving, setSaving] = useState(false)

  async function guardar() {
    if (!modal || !modal.label.trim()) return
    setSaving(true); await onSave(modal); setSaving(false); setModal(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Btn variant="secondary" size="sm" onClick={() => setModal({ id: crypto.randomUUID(), label: '', ordem: faixas.length + 1, activo: true })}>+ Nova faixa etária</Btn>
      {faixas.length === 0 && <EmptyState icon="👥" title="Sem faixas etárias" subtitle="Cria as faixas para o inquérito" />}
      {faixas.map(f => (
        <div key={f.id} style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--gray-200)', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--gray-400)', minWidth: 20 }}>#{f.ordem}</span>
            <span style={{ fontWeight: 600, color: 'var(--gray-900)' }}>{f.label}</span>
            <Badge color={f.activo ? 'green' : 'gray'}>{f.activo ? 'Activa' : 'Inactiva'}</Badge>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <Btn size="sm" variant="ghost" onClick={() => setModal({ ...f })}>✏️</Btn>
            <Btn size="sm" variant="danger" onClick={() => onDelete(f.id)}>🗑️</Btn>
          </div>
        </div>
      ))}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal && faixas.some(f => f.id === modal.id) ? 'Editar faixa' : 'Nova faixa etária'}>
        {modal && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Input label="Label (ex: 17 – 25 anos)" required value={modal.label} onChange={e => setModal(p => p ? { ...p, label: e.target.value } : null)} />
            <Input label="Ordem de apresentação" type="number" min={1} value={modal.ordem} onChange={e => setModal(p => p ? { ...p, ordem: Number(e.target.value) } : null)} />
            <label style={{ display: 'flex', gap: 10, alignItems: 'center', cursor: 'pointer' }}>
              <input type="checkbox" checked={modal.activo} onChange={e => setModal(p => p ? { ...p, activo: e.target.checked } : null)} style={{ width: 18, height: 18, accentColor: 'var(--purple-600)' }} />
              <span style={{ fontSize: '0.9rem' }}>Activa (aparece no inquérito)</span>
            </label>
            <div style={{ display: 'flex', gap: 10 }}>
              <Btn variant="ghost" full onClick={() => setModal(null)}>Cancelar</Btn>
              <Btn full loading={saving} disabled={!modal.label.trim()} onClick={guardar}>Guardar</Btn>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

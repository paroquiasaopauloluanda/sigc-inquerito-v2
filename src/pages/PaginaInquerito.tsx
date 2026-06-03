import React, { useState, useEffect } from 'react'
import type { Centro, Catequista, FaixaEtaria, Seccao, Pergunta, PerguntaDesactivada } from '../types'
import {
  getCentros, getCatequistas, getFaixas, getSeccoes, getPerguntas,
  getPerguntasDesactivadas, submeterResposta, jaSubmeteu, verificarDuplicado, getDeviceId
} from '../lib/api'
import { getPerguntasParaCentro } from '../lib/stats'
import { ETAPAS, NOME_SISTEMA, ANO_CATEQUETICO } from '../lib/config'
import { Btn, ProgressBar, Estrelas, OpcaoCard, Spinner } from '../components/ui'

type Estado = 'verificando' | 'intro' | 'identificacao' | 'questionario' | 'sucesso' | 'ja-submeteu' | 'erro'

interface Identificacao {
  centro_id: string
  catequistas_ids: string[]
  etapa: string
  faixa_etaria_id: string
}

export function PaginaInquerito() {
  const [estado, setEstado] = useState<Estado>('verificando')
  const [submetendo, setSubmetendo] = useState(false)
  const [centros, setCentros] = useState<Centro[]>([])
  const [catequistas, setCatequistas] = useState<Catequista[]>([])
  const [faixas, setFaixas] = useState<FaixaEtaria[]>([])
  const [seccoes, setSeccoes] = useState<Seccao[]>([])
  const [perguntas, setPerguntas] = useState<Pergunta[]>([])
  const [desactivadas, setDesactivadas] = useState<PerguntaDesactivada[]>([])
  const [searchCat, setSearchCat] = useState('')

  const [ident, setIdent] = useState<Partial<Identificacao>>({ catequistas_ids: [] })
  const [respostas, setRespostas] = useState<Record<string, string>>({})
  const [seccaoIdx, setSeccaoIdx] = useState(0)
  const [errMsg, setErrMsg] = useState('')

  useEffect(() => {
    async function init() {
      if (jaSubmeteu()) { setEstado('ja-submeteu'); return }
      const [dup, cs, cats, fxs, secs, pergs, desact] = await Promise.all([
        verificarDuplicado(getDeviceId()),
        getCentros(), getCatequistas(), getFaixas(),
        getSeccoes(), getPerguntas(), getPerguntasDesactivadas(),
      ])
      if (dup) { setEstado('ja-submeteu'); return }
      setCentros(cs.filter(c => c.activo))
      setCatequistas(cats)
      setFaixas(fxs.filter(f => f.activo).sort((a, b) => a.ordem - b.ordem))
      setSeccoes(secs)
      setPerguntas(pergs)
      setDesactivadas(desact)
      setEstado('intro')
    }
    init()
  }, [])

  const cataquistasDocentro = catequistas.filter(c =>
    ident.centro_id && c.centros_ids.includes(ident.centro_id)
  ).filter(c => !searchCat || c.nome.toLowerCase().includes(searchCat.toLowerCase()))

  const seccoesComPerguntas = ident.centro_id
    ? getPerguntasParaCentro(
        perguntas, seccoes, ident.centro_id,
        desactivadas.filter(d => d.centro_id === ident.centro_id).map(d => d.pergunta_id)
      )
    : []

  const identCompleto = !!(ident.centro_id && (ident.catequistas_ids?.length ?? 0) > 0 && ident.etapa && ident.faixa_etaria_id)

  function responder(pid: string, val: string) {
    setRespostas(prev => ({ ...prev, [pid]: val }))
  }

  function podeAvancarSeccao() {
    if (seccaoIdx >= seccoesComPerguntas.length) return false
    const { perguntas: ps } = seccoesComPerguntas[seccaoIdx]
    return ps.every(p => {
      if (!p.obrigatoria) return true
      const val = respostas[p.id] ?? ''
      if (p.tipo === 'texto') return val.trim().length >= (p.min_chars || 0)
      return val.trim().length > 0
    })
  }

  async function submeter() {
    setSubmetendo(true)
    try {
      await submeterResposta({
        centro_id: ident.centro_id!,
        catequistas_ids: ident.catequistas_ids!,
        etapa: ident.etapa!,
        faixa_etaria_id: ident.faixa_etaria_id!,
        respostas,
      })
      setEstado('sucesso')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (e) {
      setErrMsg(e instanceof Error ? e.message : 'Erro desconhecido')
      setEstado('erro')
    } finally {
      setSubmetendo(false)
    }
  }

  if (estado === 'verificando') return <Shell><Spinner /></Shell>

  if (estado === 'ja-submeteu') return (
    <Shell>
      <div style={{ textAlign: 'center', padding: '32px 0' }}>
        <div style={{ fontSize: 52, marginBottom: 14 }}>🙏</div>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 8 }}>Já participaste</h2>
        <p style={{ color: 'var(--gray-500)', lineHeight: 1.7 }}>
          A tua resposta já foi registada.<br />Muito obrigado pela tua contribuição!
        </p>
      </div>
    </Shell>
  )

  if (estado === 'sucesso') return (
    <Shell>
      <div className="fade-in" style={{ textAlign: 'center', padding: '32px 0' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#059669', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, color: '#fff' }}>✓</div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 8 }}>Obrigado!</h2>
        <p style={{ color: 'var(--gray-500)', lineHeight: 1.7 }}>
          A tua opinião foi registada e vai ajudar-nos a melhorar a catequese. Que Deus te abençoe! 🙏
        </p>
      </div>
    </Shell>
  )

  if (estado === 'erro') return (
    <Shell>
      <div style={{ textAlign: 'center', padding: '32px 0' }}>
        <div style={{ fontSize: 44, marginBottom: 12 }}>😕</div>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 8 }}>Ocorreu um erro</h2>
        <p style={{ color: 'var(--gray-500)', marginBottom: 20, fontSize: '0.9rem' }}>{errMsg}</p>
        <Btn onClick={submeter}>Tentar novamente</Btn>
      </div>
    </Shell>
  )

  return (
    <Shell>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg,var(--purple-600),var(--purple-800))', margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>✝️</div>
        <h1 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--gray-900)', marginBottom: 2 }}>{NOME_SISTEMA}</h1>
        <p style={{ fontSize: '0.78rem', color: 'var(--gray-400)' }}>Avaliação {ANO_CATEQUETICO}</p>
      </div>

      {/* Intro */}
      {estado === 'intro' && (
        <div className="slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'linear-gradient(135deg,var(--purple-600),var(--purple-800))', borderRadius: 14, padding: '20px 18px', color: '#fff', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 6 }}>Inquérito de avaliação</h2>
            <p style={{ fontSize: '0.88rem', opacity: .9, lineHeight: 1.6 }}>A tua opinião é fundamental. Leva cerca de <strong>5 minutos</strong>.</p>
          </div>
          {[
            { icon: '🔒', t: 'Totalmente anónimo — não pedimos o teu nome' },
            { icon: '⏱️', t: '5 minutos — secções curtas e simples' },
            { icon: '💡', t: 'Ajuda a melhorar a catequese para todos' },
          ].map(({ icon, t }) => (
            <div key={t} style={{ display: 'flex', gap: 12, padding: '12px 14px', borderRadius: 10, background: '#fff', border: '1px solid var(--gray-200)', alignItems: 'center' }}>
              <span style={{ fontSize: 20 }}>{icon}</span>
              <span style={{ fontSize: '0.88rem', color: 'var(--gray-600)', lineHeight: 1.5 }}>{t}</span>
            </div>
          ))}
          <Btn full style={{ marginTop: 8 }} onClick={() => setEstado('identificacao')}>Começar →</Btn>
        </div>
      )}

      {/* Identificação */}
      {estado === 'identificacao' && (
        <div className="slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 4 }}>A tua participação</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)', lineHeight: 1.6 }}>
              Não pedimos o teu nome. Estes dados servem apenas para organizar os resultados.
            </p>
          </div>

          {/* Centro */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: '0.93rem', fontWeight: 600, color: 'var(--gray-700)' }}>
              Centro de catequese<span style={{ color: '#dc2626', marginLeft: 2 }}>*</span>
            </span>
            {centros.map(c => (
              <RadioItem key={c.id} label={c.nome} subtitle={c.descricao}
                selected={ident.centro_id === c.id}
                onClick={() => { setIdent(prev => ({ ...prev, centro_id: c.id, catequistas_ids: [] })); setSearchCat('') }}
              />
            ))}
            {centros.length === 0 && <p style={{ fontSize: '0.85rem', color: 'var(--gray-400)', padding: 8 }}>Nenhum centro disponível.</p>}
          </div>

          {/* Catequistas — multi-selecção com pesquisa */}
          {ident.centro_id && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }} className="fade-in">
              <span style={{ fontSize: '0.93rem', fontWeight: 600, color: 'var(--gray-700)' }}>
                Os teus catequistas<span style={{ color: '#dc2626', marginLeft: 2 }}>*</span>
              </span>
              <p style={{ fontSize: '0.8rem', color: 'var(--gray-400)', margin: 0 }}>
                Podes seleccionar mais de um catequista se a tua turma tiver vários.
              </p>
              <input
                value={searchCat} onChange={e => setSearchCat(e.target.value)}
                placeholder="🔍 Pesquisar catequista…"
                style={{ padding: '9px 12px', borderRadius: 10, border: '1.5px solid var(--gray-200)', fontFamily: 'inherit', fontSize: '0.9rem', outline: 'none' }}
              />
              {cataquistasDocentro.map(c => {
                const sel = (ident.catequistas_ids ?? []).includes(c.id)
                return (
                  <button key={c.id} onClick={() => {
                    const ids = ident.catequistas_ids ?? []
                    setIdent(prev => ({ ...prev, catequistas_ids: sel ? ids.filter(x => x !== c.id) : [...ids, c.id] }))
                  }}
                    style={{
                      padding: '12px 14px', borderRadius: 11, textAlign: 'left', cursor: 'pointer', width: '100%',
                      border: `2px solid ${sel ? 'var(--purple-600)' : 'var(--gray-200)'}`,
                      background: sel ? 'var(--purple-50)' : '#fff',
                      display: 'flex', alignItems: 'center', gap: 12, transition: 'all .18s',
                    }}
                  >
                    <span style={{ width: 20, height: 20, borderRadius: 4, flexShrink: 0, border: `2px solid ${sel ? 'var(--purple-600)' : 'var(--gray-300)'}`, background: sel ? 'var(--purple-600)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {sel && <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>✓</span>}
                    </span>
                    <span style={{ fontSize: '0.93rem', fontWeight: sel ? 600 : 400, color: sel ? 'var(--purple-800)' : 'var(--gray-700)' }}>{c.nome}</span>
                  </button>
                )
              })}
              {cataquistasDocentro.length === 0 && (
                <p style={{ fontSize: '0.85rem', color: 'var(--gray-400)', padding: 8 }}>
                  {searchCat ? 'Nenhum catequista encontrado.' : 'Nenhum catequista registado neste centro.'}
                </p>
              )}
            </div>
          )}

          {/* Etapa */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: '0.93rem', fontWeight: 600, color: 'var(--gray-700)' }}>
              Etapa<span style={{ color: '#dc2626', marginLeft: 2 }}>*</span>
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {ETAPAS.map(e => (
                <button key={e.id} onClick={() => setIdent(prev => ({ ...prev, etapa: e.id }))}
                  style={{
                    padding: '11px 10px', borderRadius: 10, textAlign: 'center', cursor: 'pointer',
                    border: `2px solid ${ident.etapa === e.id ? 'var(--purple-600)' : 'var(--gray-200)'}`,
                    background: ident.etapa === e.id ? 'var(--purple-50)' : '#fff',
                    color: ident.etapa === e.id ? 'var(--purple-800)' : 'var(--gray-700)',
                    fontWeight: ident.etapa === e.id ? 600 : 400, fontSize: '0.85rem',
                    transition: 'all .18s',
                  }}
                >{e.label}</button>
              ))}
            </div>
          </div>

          {/* Faixa etária */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: '0.93rem', fontWeight: 600, color: 'var(--gray-700)' }}>
              Faixa etária<span style={{ color: '#dc2626', marginLeft: 2 }}>*</span>
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {faixas.map(f => (
                <button key={f.id} onClick={() => setIdent(prev => ({ ...prev, faixa_etaria_id: f.id }))}
                  style={{
                    padding: '12px 8px', borderRadius: 10, textAlign: 'center', cursor: 'pointer',
                    border: `2px solid ${ident.faixa_etaria_id === f.id ? 'var(--purple-600)' : 'var(--gray-200)'}`,
                    background: ident.faixa_etaria_id === f.id ? 'var(--purple-50)' : '#fff',
                    color: ident.faixa_etaria_id === f.id ? 'var(--purple-800)' : 'var(--gray-700)',
                    fontWeight: ident.faixa_etaria_id === f.id ? 600 : 400, fontSize: '0.88rem',
                    transition: 'all .18s',
                  }}
                >{f.label}</button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 8, display: 'flex', gap: 10 }}>
            <Btn variant="ghost" onClick={() => setEstado('intro')}>← Voltar</Btn>
            <Btn full disabled={!identCompleto}
              onClick={() => { setSeccaoIdx(0); setEstado('questionario') }}
            >Continuar →</Btn>
          </div>
        </div>
      )}

      {/* Questionário dinâmico */}
      {estado === 'questionario' && seccoesComPerguntas.length > 0 && (
        <div className="slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <ProgressBar
            atual={seccaoIdx + 1}
            total={seccoesComPerguntas.length}
            label={seccoesComPerguntas[seccaoIdx].seccao.titulo}
          />

          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--purple-600)', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 3 }}>
              Secção {seccaoIdx + 1} de {seccoesComPerguntas.length}
            </div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
              {seccoesComPerguntas[seccaoIdx].seccao.titulo}
            </h2>
            {seccoesComPerguntas[seccaoIdx].seccao.subtitulo && (
              <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)', marginTop: 4, lineHeight: 1.6 }}>
                {seccoesComPerguntas[seccaoIdx].seccao.subtitulo}
              </p>
            )}
          </div>

          {seccoesComPerguntas[seccaoIdx].perguntas.map(p => (
            <PerguntaRender key={p.id} pergunta={p} valor={respostas[p.id] ?? ''} onChange={val => responder(p.id, val)} />
          ))}

          <div style={{ display: 'flex', gap: 10, paddingTop: 8, borderTop: '1px solid var(--gray-200)' }}>
            <Btn variant="ghost"
              onClick={() => {
                if (seccaoIdx === 0) { setEstado('identificacao'); return }
                setSeccaoIdx(i => i - 1)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
            >← Anterior</Btn>
            {seccaoIdx < seccoesComPerguntas.length - 1 ? (
              <Btn full disabled={!podeAvancarSeccao()}
                onClick={() => { setSeccaoIdx(i => i + 1); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
              >Continuar →</Btn>
            ) : (
              <Btn full disabled={!podeAvancarSeccao()} loading={submetendo} onClick={submeter}>
                ✓ Submeter
              </Btn>
            )}
          </div>
        </div>
      )}
    </Shell>
  )
}

// ── PerguntaRender ────────────────────────────────────────────────────────────
function PerguntaRender({ pergunta: p, valor, onChange }: { pergunta: Pergunta; valor: string; onChange: (v: string) => void }) {
  const faltaMin = p.tipo === 'texto' && p.min_chars > 0 && valor.trim().length < p.min_chars

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {p.tipo === 'estrelas' && (
        <Estrelas label={p.texto} required={p.obrigatoria} valor={Number(valor) || 0} onChange={v => onChange(String(v))} />
      )}
      {(p.tipo === 'opcao_unica' || p.tipo === 'multipla_escolha') && (
        <OpcaoCard
          label={p.texto} required={p.obrigatoria}
          opcoes={p.opcoes} valor={valor} onChange={onChange}
          multi={p.tipo === 'multipla_escolha'}
          colunas={p.opcoes.length <= 2 ? 2 : p.opcoes.length <= 4 ? 2 : 3}
        />
      )}
      {p.tipo === 'texto' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: '0.93rem', fontWeight: 500, color: 'var(--gray-700)' }}>
            {p.texto}{p.obrigatoria && <span style={{ color: '#dc2626', marginLeft: 2 }}>*</span>}
          </span>
          <textarea
            value={valor} onChange={e => onChange(e.target.value)}
            rows={4} placeholder={p.placeholder || (p.obrigatoria ? 'Escreve aqui a tua resposta…' : 'Opcional…')}
            style={{
              padding: '11px 13px', borderRadius: 10, fontFamily: 'inherit',
              border: `1.5px solid ${faltaMin ? '#fca5a5' : 'var(--gray-200)'}`,
              fontSize: '0.93rem', outline: 'none', resize: 'vertical',
              color: 'var(--gray-800)', lineHeight: 1.6,
            }}
          />
          {p.min_chars > 0 && (
            <span style={{ fontSize: '0.75rem', color: faltaMin ? '#dc2626' : 'var(--gray-400)' }}>
              {valor.trim().length}/{p.min_chars} caracteres mínimos
            </span>
          )}
        </div>
      )}
    </div>
  )
}

// ── RadioItem ─────────────────────────────────────────────────────────────────
function RadioItem({ label, subtitle, selected, onClick }: { label: string; subtitle?: string; selected: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: '13px 14px', borderRadius: 11, textAlign: 'left', cursor: 'pointer', width: '100%',
      border: `2px solid ${selected ? 'var(--purple-600)' : 'var(--gray-200)'}`,
      background: selected ? 'var(--purple-50)' : '#fff',
      display: 'flex', alignItems: 'center', gap: 12, transition: 'all .18s',
    }}>
      <span style={{
        width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
        border: `2px solid ${selected ? 'var(--purple-600)' : 'var(--gray-300)'}`,
        background: selected ? 'var(--purple-600)' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {selected && <span style={{ color: '#fff', fontSize: 11 }}>✓</span>}
      </span>
      <div>
        <div style={{ fontSize: '0.93rem', fontWeight: selected ? 600 : 400, color: selected ? 'var(--purple-800)' : 'var(--gray-700)' }}>{label}</div>
        {subtitle && <div style={{ fontSize: '0.78rem', color: 'var(--gray-400)', marginTop: 2 }}>{subtitle}</div>}
      </div>
    </button>
  )
}

// ── Shell ─────────────────────────────────────────────────────────────────────
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,var(--purple-50) 0%,var(--gray-50) 60%)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 14px 48px' }}>
      <div style={{ width: '100%', maxWidth: 480, background: '#fff', borderRadius: 20, padding: '24px 18px', boxShadow: '0 8px 32px rgba(0,0,0,.1)', border: '1px solid var(--gray-100)' }}>
        {children}
      </div>
    </div>
  )
}

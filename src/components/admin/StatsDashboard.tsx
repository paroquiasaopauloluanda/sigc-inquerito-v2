import type { RelatorioAnalise, EstatisticasGerais } from '../../types'
import React, { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Cell, PieChart, Pie, LabelList,
} from 'recharts'
import type { Resposta, Pergunta, Seccao, Catequista, Centro, FaixaEtaria } from '../../types'
import { getCatequistasIds } from '../../types'
import { calcularEstatisticas, filtrarRespostas, exportarCSV, gerarAnalise } from '../../lib/stats'
import { CHART_COLORS, getStarColor, getStarColorByPct, ETAPAS } from '../../lib/config'
import { TabBar, KpiCard, EmptyState, Btn, Select } from '../ui'

interface Props {
  respostas: Resposta[]
  perguntas: Pergunta[]
  seccoes: Seccao[]
  catequistas: Catequista[]
  centros: Centro[]
  faixas: FaixaEtaria[]
  mostrarFiltroCentro?: boolean
}

export function StatsDashboard({ respostas, perguntas, seccoes, catequistas, centros, faixas, mostrarFiltroCentro = false }: Props) {
  const [tab, setTab] = useState('geral')
  const [filtroCentro, setFiltroCentro] = useState('todas')
  const [filtroCatequista, setFiltroCatequista] = useState('')
  const [searchCat, setSearchCat] = useState('')

  const respostasFiltradas = respostas.filter(r => filtroCentro === 'todas' || r.centro_id === filtroCentro)
  const stats = calcularEstatisticas(respostasFiltradas, perguntas)

  const respostasCat = filtroCatequista
    ? filtrarRespostas(respostas, { catequista_id: filtroCatequista })
    : []
  const statsCat = filtroCatequista ? calcularEstatisticas(respostasCat, perguntas) : null

  const catDisponiveis = (filtroCentro === 'todas'
    ? catequistas
    : catequistas.filter(c => c.centros_ids.includes(filtroCentro))
  ).filter(c => !searchCat || c.nome.toLowerCase().includes(searchCat.toLowerCase()))

  const analise = gerarAnalise(stats, perguntas, centros, catequistas, faixas)

  const tabs = [
    { id: 'geral', label: 'Geral', icon: '📊' },
    { id: 'perguntas', label: 'Perguntas', icon: '📋' },
    { id: 'abertas', label: 'Abertas', icon: '💬' },
    { id: 'catequista', label: 'Por catequista', icon: '👤' },
    { id: 'analise', label: 'Análise', icon: '🔍' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Filtros */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' as const, alignItems: 'flex-end' }}>
        {mostrarFiltroCentro && (
          <div style={{ flex: '1 1 160px', minWidth: 0 }}>
            <Select label="Centro" value={filtroCentro}
              onChange={e => { setFiltroCentro(e.target.value); setFiltroCatequista('') }}
              options={[
                { value: 'todas', label: `Todos (${respostas.length})` },
                ...centros.map(c => ({ value: c.id, label: `${c.nome} (${respostas.filter(r => r.centro_id === c.id).length})` })),
              ]}
            />
          </div>
        )}
        <Btn variant="secondary" size="sm" onClick={() => exportarCSV(respostasFiltradas, perguntas, centros, catequistas, faixas)}>
          ⬇️ CSV
        </Btn>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
        <KpiCard valor={stats.total} label="Respostas" icon="📋" cor="var(--purple-600)" />
        <KpiCard valor={Object.keys(stats.por_catequista).length} label="Catequistas c/ respostas" icon="👤" cor="#059669" />
        <KpiCard valor={Object.keys(stats.por_etapa).length} label="Etapas representadas" icon="📚" cor="#f59e0b" />
        <KpiCard
          valor={analise.score_global > 0 ? `${analise.score_global}%` : '—'}
          label="Score global" icon="⭐"
          cor={getStarColor(Math.round(analise.score_global / 20))}
        />
      </div>

      <TabBar tabs={tabs} active={tab} onChange={setTab} />

      {/* ── Tab: Geral ── */}
      {tab === 'geral' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Radar */}
          <ChartCard titulo="Perfil de avaliação (médias)">
            {(() => {
              const data = perguntas.filter(p => p.tipo === 'estrelas' && stats.medias_por_pergunta[p.id] !== undefined)
                .map(p => ({ tema: p.texto.slice(0, 22), valor: stats.medias_por_pergunta[p.id] }))
              if (!data.length) return <EmptyState icon="📊" title="Sem dados ainda" />
              return (
                <ResponsiveContainer width="100%" height={240}>
                  <RadarChart data={data}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="tema" tick={{ fontSize: 10 }} />
                    <PolarRadiusAxis domain={[0, 5]} tick={{ fontSize: 9 }} />
                    <Radar dataKey="valor" stroke="var(--purple-600)" fill="var(--purple-600)" fillOpacity={0.3} />
                    <Tooltip formatter={(v: number) => v.toFixed(1)} />
                  </RadarChart>
                </ResponsiveContainer>
              )
            })()}
          </ChartCard>

          {/* Participação por catequista */}
          <ChartCard titulo="Participação por catequista">
            {(() => {
              const data = Object.entries(stats.por_catequista).map(([id, n]) => ({ nome: catequistas.find(c => c.id === id)?.nome ?? id, n })).sort((a, b) => b.n - a.n)
              if (!data.length) return <EmptyState icon="👤" title="Sem dados" />
              return (
                <ResponsiveContainer width="100%" height={Math.max(180, data.length * 42)}>
                  <BarChart data={data} layout="vertical" margin={{ right: 40 }}>
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                    <YAxis dataKey="nome" type="category" width={100} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="n" name="Respostas" radius={[0, 6, 6, 0]}>
                      <LabelList dataKey="n" position="right" style={{ fontSize: 11, fontWeight: 700, fill: 'var(--gray-700)' }} />
                      {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )
            })()}
          </ChartCard>

          {/* Participação por centro (só no root) */}
          {mostrarFiltroCentro && (
            <ChartCard titulo="Participação por centro">
              {(() => {
                const data = Object.entries(stats.por_centro).map(([id, n]) => ({ nome: centros.find(c => c.id === id)?.nome ?? id, n })).sort((a, b) => b.n - a.n)
                if (!data.length) return <EmptyState icon="🏛️" title="Sem dados" />
                return (
                  <ResponsiveContainer width="100%" height={Math.max(160, data.length * 42)}>
                    <BarChart data={data} layout="vertical" margin={{ right: 40 }}>
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                      <YAxis dataKey="nome" type="category" width={110} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="n" name="Respostas" radius={[0, 6, 6, 0]}>
                        <LabelList dataKey="n" position="right" style={{ fontSize: 11, fontWeight: 700, fill: 'var(--gray-700)' }} />
                        {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )
              })()}
            </ChartCard>
          )}

          {/* Por etapa */}
          <ChartCard titulo="Respostas por etapa">
            {(() => {
              const data = Object.entries(stats.por_etapa).map(([id, n]) => ({ etapa: ETAPAS.find(e => e.id === id)?.label ?? id, n }))
              if (!data.length) return <EmptyState icon="📚" title="Sem dados" />
              return (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={data} margin={{ top: 20 }}>
                    <XAxis dataKey="etapa" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" height={55} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="n" name="Respostas" radius={[6, 6, 0, 0]}>
                      <LabelList dataKey="n" position="top" style={{ fontSize: 11, fontWeight: 700, fill: 'var(--gray-700)' }} />
                      {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )
            })()}
          </ChartCard>

          {/* Por faixa etária */}
          <ChartCard titulo="Por faixa etária">
            {(() => {
              const data = Object.entries(stats.por_faixa).map(([id, n]) => ({ faixa: faixas.find(f => f.id === id)?.label ?? id, n }))
              if (!data.length) return <EmptyState icon="👥" title="Sem dados" />
              return (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={data} dataKey="n" nameKey="faixa" cx="50%" cy="50%" outerRadius={75} label={({ faixa, n }) => `${String(faixa).split('–')[0].trim()}: ${n}`} labelLine={false}>
                      {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )
            })()}
          </ChartCard>
        </div>
      )}

      {/* ── Tab: Perguntas ── */}
      {tab === 'perguntas' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {seccoes.sort((a, b) => a.ordem - b.ordem).map(s => {
            const pSec = perguntas.filter(p => p.seccao_id === s.id && (p.tipo !== 'texto'))
            if (!pSec.length) return null
            return (
              <ChartCard key={s.id} titulo={s.titulo}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  {pSec.map(p => <PerguntaStats key={p.id} pergunta={p} stats={stats} respostas={respostasFiltradas} />)}
                </div>
              </ChartCard>
            )
          })}
        </div>
      )}

      {/* ── Tab: Abertas ── */}
      {tab === 'abertas' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {perguntas.filter(p => p.tipo === 'texto').map(p => {
            const rs = stats.respostas_abertas_por_pergunta[p.id] ?? []
            if (!rs.length) return null
            return (
              <ChartCard key={p.id} titulo={`${p.texto} (${rs.length})`}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 260, overflowY: 'auto' }}>
                  {rs.map((r, i) => (
                    <div key={i} style={{ padding: '9px 12px', borderRadius: 8, background: 'var(--gray-50)', border: '1px solid var(--gray-200)', fontSize: '0.85rem', color: 'var(--gray-700)', lineHeight: 1.6 }}>{r}</div>
                  ))}
                </div>
              </ChartCard>
            )
          })}
          {perguntas.every(p => p.tipo !== 'texto' || !(stats.respostas_abertas_por_pergunta[p.id]?.length)) && (
            <EmptyState icon="💬" title="Sem respostas abertas ainda" />
          )}
        </div>
      )}

      {/* ── Tab: Por catequista ── */}
      {tab === 'catequista' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', flex: 1, flexDirection: 'column', gap: 8 }}>
            <input
              value={searchCat} onChange={e => setSearchCat(e.target.value)}
              placeholder="🔍 Pesquisar catequista…"
              style={{ padding: '10px 13px', borderRadius: 10, border: '1.5px solid var(--gray-200)', fontFamily: 'inherit', fontSize: '0.9rem', outline: 'none', width: '100%' }}
            />
            <Select label="" value={filtroCatequista} onChange={e => setFiltroCatequista(e.target.value)}
              options={[
                { value: '', label: '— Escolhe um catequista —' },
                ...catDisponiveis.map(c => ({ value: c.id, label: `${c.nome} (${Object.entries(stats.por_catequista).find(([k]) => k === c.id)?.[1] ?? 0} resp.)` })),
              ]}
            />
          </div>

          {filtroCatequista && statsCat && (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* KPIs do catequista */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
                <KpiCard valor={statsCat.total} label="Respostas" icon="📋" />
                <KpiCard valor={(() => { const v = Object.values(statsCat.medias_por_pergunta); return v.length ? (v.reduce((a,b)=>a+b,0)/v.length).toFixed(1) : '—' })()} label="Média (/5)" icon="⭐" />
              </div>

              {/* Centros do catequista (só root) */}
              {mostrarFiltroCentro && (() => {
                const cat = catequistas.find(c => c.id === filtroCatequista)
                if (!cat?.centros_ids.length) return null
                return (
                  <div style={{ padding: '12px 14px', background: 'var(--purple-50)', border: '1px solid var(--purple-200)', borderRadius: 10 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--purple-700)', marginBottom: 6 }}>Distribuição por centro</div>
                    {cat.centros_ids.map(cid => {
                      const n = respostas.filter(r => r.centro_id === cid && getCatequistasIds(r).includes(filtroCatequista)).length
                      return (
                        <div key={cid} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--gray-700)', padding: '3px 0' }}>
                          <span>{centros.find(c => c.id === cid)?.nome ?? cid}</span>
                          <span style={{ fontWeight: 700, color: 'var(--purple-700)' }}>{n} resp.</span>
                        </div>
                      )
                    })}
                  </div>
                )
              })()}

              {/* Radar do catequista */}
              {(() => {
                const data = perguntas.filter(p => p.tipo === 'estrelas' && statsCat.medias_por_pergunta[p.id] !== undefined)
                  .map(p => ({ tema: p.texto.slice(0, 20), valor: statsCat.medias_por_pergunta[p.id] }))
                if (!data.length) return null
                return (
                  <ChartCard titulo="Perfil de avaliação">
                    <ResponsiveContainer width="100%" height={230}>
                      <RadarChart data={data}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="tema" tick={{ fontSize: 10 }} />
                        <PolarRadiusAxis domain={[0, 5]} tick={{ fontSize: 9 }} />
                        <Radar dataKey="valor" stroke="#059669" fill="#059669" fillOpacity={0.3} />
                        <Tooltip formatter={(v: number) => v.toFixed(1)} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </ChartCard>
                )
              })()}

              {/* Perguntas do catequista */}
              {perguntas.filter(p => p.tipo !== 'texto').some(p => statsCat.medias_por_pergunta[p.id] !== undefined || statsCat.distribuicoes_por_pergunta[p.id]) && (
                <ChartCard titulo="Detalhe das perguntas">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {perguntas.filter(p => p.tipo !== 'texto').map(p => (
                      <PerguntaStats key={p.id} pergunta={p} stats={statsCat} respostas={respostasCat} />
                    ))}
                  </div>
                </ChartCard>
              )}

              {/* Respostas abertas do catequista */}
              {perguntas.filter(p => p.tipo === 'texto').some(p => (statsCat.respostas_abertas_por_pergunta[p.id]?.length ?? 0) > 0) && (
                <ChartCard titulo="Respostas abertas">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {perguntas.filter(p => p.tipo === 'texto').map(p => {
                      const rs = statsCat.respostas_abertas_por_pergunta[p.id] ?? []
                      if (!rs.length) return null
                      return (
                        <div key={p.id}>
                          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--gray-700)', marginBottom: 6 }}>{p.texto}</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto' }}>
                            {rs.map((r, i) => (
                              <div key={i} style={{ padding: '8px 12px', borderRadius: 8, background: 'var(--gray-50)', border: '1px solid var(--gray-200)', fontSize: '0.83rem', color: 'var(--gray-700)', lineHeight: 1.6 }}>{r}</div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </ChartCard>
              )}
            </div>
          )}
          {!filtroCatequista && <EmptyState icon="👤" title="Selecciona um catequista" subtitle="para ver as suas estatísticas" />}
        </div>
      )}

      {/* ── Tab: Análise ── */}
      {tab === 'analise' && <AnaliseTab analise={analise} />}
    </div>
  )
}

// ── PerguntaStats ─────────────────────────────────────────────────────────────
function PerguntaStats({ pergunta: p, stats, respostas }: { pergunta: Pergunta; stats: EstatisticasGerais; respostas: Resposta[] }) {
  if (p.tipo === 'estrelas') {
    const m = stats.medias_por_pergunta[p.id] ?? 0
    const cor = getStarColor(Math.round(m))
    return (
      <div>
        <div style={{ fontSize: '0.82rem', color: 'var(--gray-600)', marginBottom: 6 }}>{p.texto}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, height: 8, borderRadius: 99, background: 'var(--gray-100)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(m / 5) * 100}%`, background: cor, borderRadius: 99, transition: 'width .4s' }} />
          </div>
          <span style={{ fontWeight: 800, fontSize: '1rem', color: cor, minWidth: 32 }}>{m > 0 ? m.toFixed(1) : '—'}</span>
        </div>
        {/* Distribuição 1-5 */}
        <div style={{ display: 'flex', gap: 3, marginTop: 8 }}>
          {[1,2,3,4,5].map(n => {
            const cnt = respostas.filter(r => Number(r.respostas[p.id]) === n).length
            const pct = respostas.length ? Math.round((cnt / respostas.length) * 100) : 0
            return (
              <div key={n} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <div style={{ width: '100%', height: Math.max(4, pct * 1.2), borderRadius: '3px 3px 0 0', background: getStarColor(n), minHeight: 4 }} />
                <span style={{ fontSize: '0.7rem', color: 'var(--gray-500)' }}>{n}★</span>
                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--gray-700)' }}>{cnt > 0 ? cnt : ''}</span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  if (p.tipo === 'opcao_unica' || p.tipo === 'multipla_escolha') {
    const dist = stats.distribuicoes_por_pergunta[p.id] ?? {} as Record<string, number>
    const total = (Object.values(dist) as number[]).reduce((a, b) => a + b, 0)
    return (
      <div>
        <div style={{ fontSize: '0.82rem', color: 'var(--gray-600)', marginBottom: 8 }}>{p.texto}</div>
        {(p.opcoes.length ? p.opcoes : Object.keys(dist)).map((op, i) => {
          const n = dist[op] ?? 0
          const pct = total ? Math.round((n / total) * 100) : 0
          const cor = getStarColorByPct(pct)
          return (
            <div key={op} style={{ marginBottom: 7 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 3 }}>
                <span style={{ color: 'var(--gray-600)' }}>{op}</span>
                <span style={{ fontWeight: 700, color: cor }}>{n} ({pct}%)</span>
              </div>
              <div style={{ height: 6, borderRadius: 99, background: 'var(--gray-100)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: cor, borderRadius: 99, transition: 'width .4s' }} />
              </div>
            </div>
          )
        })}
      </div>
    )
  }
  return null
}

// ── AnaliseTab ────────────────────────────────────────────────────────────────
function AnaliseTab({ analise }: { analise: RelatorioAnalise }) {
  const corScore = analise.score_global >= 80 ? '#22c55e' : analise.score_global >= 60 ? '#3b82f6' : analise.score_global >= 40 ? '#eab308' : '#ef4444'
  const tipoColors: Record<string, { bg: string; border: string; icon: string }> = {
    positivo: { bg: '#f0fdf4', border: '#86efac', icon: '✅' },
    atencao: { bg: '#fffbeb', border: '#fde68a', icon: '⚠️' },
    critico: { bg: '#fef2f2', border: '#fca5a5', icon: '🚨' },
    info: { bg: 'var(--purple-50)', border: 'var(--purple-200)', icon: 'ℹ️' },
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Score global */}
      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid var(--gray-200)', padding: 16, textAlign: 'center' }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 6 }}>Score global de satisfação</div>
        <div style={{ fontSize: '3rem', fontWeight: 900, color: corScore, lineHeight: 1 }}>{analise.score_global > 0 ? `${analise.score_global}%` : '—'}</div>
        <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)', marginTop: 8, lineHeight: 1.6 }}>{analise.resumo_geral}</div>
      </div>

      {/* Participação */}
      <InsightCard insight={analise.participacao} tipoColors={tipoColors} />

      {/* Destaques positivos */}
      {analise.destaques_positivos.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--gray-700)' }}>✅ Pontos fortes</div>
          {analise.destaques_positivos.map((ins, i) => <InsightCard key={i} insight={ins} tipoColors={tipoColors} />)}
        </div>
      )}

      {/* Áreas de melhoria */}
      {analise.areas_melhoria.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--gray-700)' }}>⚠️ Áreas a melhorar</div>
          {analise.areas_melhoria.map((ins, i) => <InsightCard key={i} insight={ins} tipoColors={tipoColors} />)}
        </div>
      )}

      {/* Insights catequistas */}
      {analise.insights_catequistas.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--gray-700)' }}>👤 Catequistas</div>
          {analise.insights_catequistas.map((ins, i) => <InsightCard key={i} insight={ins} tipoColors={tipoColors} />)}
        </div>
      )}

      {/* Sugestões */}
      {analise.sugestoes.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--gray-200)', overflow: 'hidden' }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--gray-100)', fontWeight: 700, fontSize: '0.88rem' }}>💡 Sugestões de acção</div>
          <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {analise.sugestoes.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>→</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--gray-700)', lineHeight: 1.6 }}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {analise.score_global === 0 && (
        <EmptyState icon="🔍" title="Análise indisponível" subtitle="Precisa de pelo menos algumas respostas para gerar a análise." />
      )}
    </div>
  )
}

function InsightCard({ insight: ins, tipoColors }: { insight: { tipo: string; titulo: string; descricao: string; valor?: string }; tipoColors: Record<string, { bg: string; border: string; icon: string }> }) {
  const c = tipoColors[ins.tipo] ?? tipoColors.info
  return (
    <div style={{ padding: '12px 14px', borderRadius: 10, background: c.bg, border: `1px solid ${c.border}`, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <span style={{ fontSize: 18, flexShrink: 0 }}>{c.icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--gray-800)', marginBottom: 3 }}>{ins.titulo}</div>
        <div style={{ fontSize: '0.83rem', color: 'var(--gray-600)', lineHeight: 1.6 }}>{ins.descricao}</div>
      </div>
      {ins.valor && <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--gray-800)', flexShrink: 0 }}>{ins.valor}</span>}
    </div>
  )
}

function ChartCard({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', border: '1px solid var(--gray-200)' }}>
      <div style={{ padding: '11px 14px', borderBottom: '1px solid var(--gray-100)', fontWeight: 700, fontSize: '0.88rem', color: 'var(--gray-800)' }}>{titulo}</div>
      <div style={{ padding: '14px' }}>{children}</div>
    </div>
  )
}

// Re-export for convenience
export { ChartCard }

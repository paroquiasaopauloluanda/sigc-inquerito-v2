import React, { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Cell, PieChart, Pie,
} from 'recharts'
import type { Resposta, Pergunta, Seccao, Catequista, Centro, FaixaEtaria } from '../../types'
import { calcularEstatisticas } from '../../lib/stats'
import { exportarCSV, CHART_COLORS } from '../../lib/stats'
import { TabBar, Card, CardHeader, KpiCard, EmptyState, Btn, Select } from '../ui'
import { ETAPAS } from '../../lib/config'

interface Props {
  respostas: Resposta[]
  perguntas: Pergunta[]
  seccoes: Seccao[]
  catequistas: Catequista[]
  centros: Centro[]
  faixas: FaixaEtaria[]
  mostrarFiltroCentro?: boolean
  mostrarAbaCatequista?: boolean
}

export function StatsDashboard({
  respostas, perguntas, seccoes, catequistas, centros, faixas,
  mostrarFiltroCentro = false, mostrarAbaCatequista = true,
}: Props) {
  const [tab, setTab] = useState('geral')
  const [filtroCentro, setFiltroCentro] = useState('todas')
  const [filtroCatequista, setFiltroCatequista] = useState('')

  const respostasFiltradas = respostas.filter(r => {
    if (filtroCentro !== 'todas' && r.centro_id !== filtroCentro) return false
    return true
  })

  const respostasCatequista = filtroCatequista
    ? respostas.filter(r => r.catequista_id === filtroCatequista)
    : []

  const stats = calcularEstatisticas(respostasFiltradas, perguntas)
  const statsCat = filtroCatequista
    ? calcularEstatisticas(respostasCatequista, perguntas)
    : null

  const cataquistasDisponiveis = filtroCentro === 'todas'
    ? catequistas
    : catequistas.filter(c => c.centros_ids.includes(filtroCentro))

  const tabs = [
    { id: 'geral', label: 'Geral', icon: '📊' },
    { id: 'perguntas', label: 'Perguntas', icon: '📋' },
    { id: 'abertas', label: 'Abertas', icon: '💬' },
    ...(mostrarAbaCatequista ? [{ id: 'catequista', label: 'Por catequista', icon: '👤' }] : []),
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Filtros */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' as const, alignItems: 'flex-end' }}>
        {mostrarFiltroCentro && (
          <div style={{ flex: '1 1 160px', minWidth: 0 }}>
            <Select
              label="Centro"
              value={filtroCentro}
              onChange={e => { setFiltroCentro(e.target.value); setFiltroCatequista('') }}
              options={[
                { value: 'todas', label: `Todos os centros (${respostas.length})` },
                ...centros.map(c => ({
                  value: c.id,
                  label: `${c.nome} (${respostas.filter(r => r.centro_id === c.id).length})`,
                })),
              ]}
            />
          </div>
        )}
        <Btn variant="secondary" size="sm" onClick={() => exportarCSV(respostasFiltradas, perguntas)}>
          ⬇️ CSV
        </Btn>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
        <KpiCard valor={stats.total} label="Respostas" icon="📋" cor="var(--purple-600)" />
        <KpiCard valor={Object.keys(stats.por_catequista).length} label="Catequistas c/ respostas" icon="👤" cor="#059669" />
        <KpiCard valor={Object.keys(stats.por_etapa).length} label="Etapas representadas" icon="📚" cor="#f59e0b" />
        <KpiCard
          valor={(() => {
            const vals = Object.values(stats.medias_por_pergunta)
            return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : '—'
          })()}
          label="Média geral (/5)" icon="⭐" cor="var(--purple-500)"
        />
      </div>

      <TabBar tabs={tabs} active={tab} onChange={setTab} />

      {/* Tab: Geral */}
      {tab === 'geral' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Radar médias estrelas */}
          <ChartCard titulo="Perfil de avaliação (médias)">
            {(() => {
              const data = perguntas
                .filter(p => p.tipo === 'estrelas' && stats.medias_por_pergunta[p.id] !== undefined)
                .map(p => ({ tema: p.texto.slice(0, 25), valor: stats.medias_por_pergunta[p.id] }))
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

          {/* Respostas por catequista */}
          <ChartCard titulo="Participação por catequista">
            {(() => {
              const data = Object.entries(stats.por_catequista).map(([id, n]) => ({
                nome: catequistas.find(c => c.id === id)?.nome ?? id,
                respostas: n,
              })).sort((a, b) => b.respostas - a.respostas)
              if (!data.length) return <EmptyState icon="👤" title="Sem dados ainda" />
              return (
                <ResponsiveContainer width="100%" height={Math.max(200, data.length * 40)}>
                  <BarChart data={data} layout="vertical">
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                    <YAxis dataKey="nome" type="category" width={110} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="respostas" name="Respostas" radius={[0, 6, 6, 0]}>
                      {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )
            })()}
          </ChartCard>

          {/* Por etapa */}
          <ChartCard titulo="Respostas por etapa">
            {(() => {
              const data = Object.entries(stats.por_etapa).map(([id, n]) => ({
                etapa: ETAPAS.find(e => e.id === id)?.label ?? id,
                n,
              }))
              if (!data.length) return <EmptyState icon="📚" title="Sem dados ainda" />
              return (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={data}>
                    <XAxis dataKey="etapa" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" height={55} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="n" name="Respostas" radius={[6, 6, 0, 0]}>
                      {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )
            })()}
          </ChartCard>

          {/* Por faixa */}
          <ChartCard titulo="Respostas por faixa etária">
            {(() => {
              const data = Object.entries(stats.por_faixa).map(([id, n]) => ({
                faixa: faixas.find(f => f.id === id)?.label ?? id, n,
              }))
              if (!data.length) return <EmptyState icon="👥" title="Sem dados ainda" />
              return (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={data} dataKey="n" nameKey="faixa" cx="50%" cy="50%" outerRadius={75} label={({ faixa, n }) => `${faixa.split('–')[0].trim()}: ${n}`} labelLine={false}>
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

      {/* Tab: Perguntas */}
      {tab === 'perguntas' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {seccoes
            .filter(s => s.centro_id === null)
            .sort((a, b) => a.ordem - b.ordem)
            .map(s => {
              const pSec = perguntas.filter(p => p.seccao_id === s.id && (p.tipo === 'opcao_unica' || p.tipo === 'estrelas'))
              if (!pSec.length) return null
              return (
                <ChartCard key={s.id} titulo={s.titulo}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {pSec.map(p => {
                      if (p.tipo === 'estrelas') {
                        const m = stats.medias_por_pergunta[p.id]
                        return (
                          <div key={p.id}>
                            <div style={{ fontSize: '0.82rem', color: 'var(--gray-600)', marginBottom: 6 }}>{p.texto}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ flex: 1, height: 8, borderRadius: 99, background: 'var(--gray-100)', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${(m / 5) * 100}%`, background: 'linear-gradient(90deg,var(--purple-500),var(--purple-700))', borderRadius: 99 }} />
                              </div>
                              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--purple-700)', minWidth: 30 }}>{m?.toFixed(1) ?? '—'}</span>
                            </div>
                          </div>
                        )
                      }
                      if (p.tipo === 'opcao_unica') {
                        const dist = stats.distribuicoes_por_pergunta[p.id] ?? {}
                        const total = Object.values(dist).reduce((a, b) => a + b, 0)
                        return (
                          <div key={p.id}>
                            <div style={{ fontSize: '0.82rem', color: 'var(--gray-600)', marginBottom: 8 }}>{p.texto}</div>
                            {p.opcoes.map((op, i) => {
                              const n = dist[op] ?? 0
                              const pct = total ? Math.round((n / total) * 100) : 0
                              return (
                                <div key={op} style={{ marginBottom: 6 }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 2 }}>
                                    <span style={{ color: 'var(--gray-600)' }}>{op}</span>
                                    <span style={{ fontWeight: 600, color: 'var(--gray-800)' }}>{n} ({pct}%)</span>
                                  </div>
                                  <div style={{ height: 5, borderRadius: 99, background: 'var(--gray-100)', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: `${pct}%`, background: CHART_COLORS[i % CHART_COLORS.length], borderRadius: 99 }} />
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )
                      }
                      return null
                    })}
                  </div>
                </ChartCard>
              )
            })}
        </div>
      )}

      {/* Tab: Respostas abertas */}
      {tab === 'abertas' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {perguntas.filter(p => p.tipo === 'texto').map(p => {
            const rs = stats.respostas_abertas_por_pergunta[p.id] ?? []
            if (!rs.length) return null
            return (
              <ChartCard key={p.id} titulo={`${p.texto} (${rs.length})`}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, overflowY: 'auto' }}>
                  {rs.map((r, i) => (
                    <div key={i} style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--gray-50)', border: '1px solid var(--gray-200)', fontSize: '0.85rem', color: 'var(--gray-700)', lineHeight: 1.6 }}>
                      {r}
                    </div>
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

      {/* Tab: Por catequista */}
      {tab === 'catequista' && mostrarAbaCatequista && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Select
            label="Seleccionar catequista"
            value={filtroCatequista}
            onChange={e => setFiltroCatequista(e.target.value)}
            options={[
              { value: '', label: '— Escolhe um catequista —' },
              ...cataquistasDisponiveis.map(c => ({
                value: c.id,
                label: `${c.nome} (${respostas.filter(r => r.catequista_id === c.id).length} respostas)`,
              })),
            ]}
          />

          {filtroCatequista && statsCat && (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
                <KpiCard valor={statsCat.total} label="Respostas" icon="📋" />
                <KpiCard
                  valor={(() => {
                    const vals = Object.values(statsCat.medias_por_pergunta)
                    return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : '—'
                  })()}
                  label="Média (/5)" icon="⭐"
                />
              </div>

              {/* Info de centros se for root (mostrarFiltroCentro) */}
              {mostrarFiltroCentro && (
                <div style={{ padding: '12px 14px', background: 'var(--purple-50)', border: '1px solid var(--purple-200)', borderRadius: 10 }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--purple-700)', marginBottom: 6 }}>Centros do catequista</div>
                  {catequistas.find(c => c.id === filtroCatequista)?.centros_ids.map(cid => {
                    const centro = centros.find(ct => ct.id === cid)
                    const n = respostas.filter(r => r.catequista_id === filtroCatequista && r.centro_id === cid).length
                    return (
                      <div key={cid} style={{ fontSize: '0.85rem', color: 'var(--gray-700)', padding: '4px 0', display: 'flex', justifyContent: 'space-between' }}>
                        <span>{centro?.nome ?? cid}</span>
                        <span style={{ fontWeight: 600, color: 'var(--purple-700)' }}>{n} resp.</span>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Médias do catequista */}
              {(() => {
                const data = perguntas
                  .filter(p => p.tipo === 'estrelas' && statsCat.medias_por_pergunta[p.id] !== undefined)
                  .map(p => ({ tema: p.texto.slice(0, 20), valor: statsCat.medias_por_pergunta[p.id] }))
                if (!data.length) return null
                return (
                  <ChartCard titulo="Médias de avaliação">
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
            </div>
          )}

          {!filtroCatequista && <EmptyState icon="👤" title="Selecciona um catequista" subtitle="para ver as estatísticas" />}
        </div>
      )}
    </div>
  )
}

function ChartCard({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', border: '1px solid var(--gray-200)' }}>
      <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--gray-100)', fontWeight: 700, fontSize: '0.88rem', color: 'var(--gray-800)' }}>{titulo}</div>
      <div style={{ padding: '14px' }}>{children}</div>
    </div>
  )
}

// Re-export Card for convenience
export { Card, CardHeader }

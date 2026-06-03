import type { Resposta, Pergunta, Seccao, EstatisticasGerais, RelatorioAnalise, InsightAnalise, Centro, Catequista, FaixaEtaria } from '../types'
import { getCatequistasIds } from '../types'
import { CHART_COLORS } from './config'

// ── Calcular estatísticas ─────────────────────────────────────────────────────

export function calcularEstatisticas(respostas: Resposta[], perguntas: Pergunta[]): EstatisticasGerais {
  const por_centro: Record<string, number> = {}
  const por_catequista: Record<string, number> = {}
  const por_etapa: Record<string, number> = {}
  const por_faixa: Record<string, number> = {}
  const somas: Record<string, number[]> = {}
  const distribuicoes: Record<string, Record<string, number>> = {}
  const abertas: Record<string, string[]> = {}

  for (const r of respostas) {
    por_centro[r.centro_id] = (por_centro[r.centro_id] ?? 0) + 1
    por_etapa[r.etapa] = (por_etapa[r.etapa] ?? 0) + 1
    por_faixa[r.faixa_etaria_id] = (por_faixa[r.faixa_etaria_id] ?? 0) + 1
    // compatibilidade legado + novo formato
    for (const cid of getCatequistasIds(r)) {
      por_catequista[cid] = (por_catequista[cid] ?? 0) + 1
    }
  }

  for (const p of perguntas) {
    const vals = respostas.map(r => r.respostas[p.id]).filter(Boolean)
    if (p.tipo === 'estrelas') {
      const nums = vals.map(Number).filter(v => !isNaN(v) && v > 0)
      if (!somas[p.id]) somas[p.id] = []
      somas[p.id].push(...nums)
    }
    if (p.tipo === 'opcao_unica' || p.tipo === 'multipla_escolha') {
      const dist: Record<string, number> = {}
      for (const v of vals) {
        for (const item of v.split('|').map(s => s.trim()).filter(Boolean)) {
          dist[item] = (dist[item] ?? 0) + 1
        }
      }
      distribuicoes[p.id] = dist
    }
    if (p.tipo === 'texto') {
      abertas[p.id] = vals.filter(v => v.trim().length > 0)
    }
  }

  const medias: Record<string, number> = {}
  for (const [pid, nums] of Object.entries(somas)) {
    medias[pid] = nums.length ? Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10 : 0
  }

  return { total: respostas.length, por_centro, por_catequista, por_etapa, por_faixa, medias_por_pergunta: medias, distribuicoes_por_pergunta: distribuicoes, respostas_abertas_por_pergunta: abertas }
}

export function filtrarRespostas(respostas: Resposta[], filtros: { centro_id?: string; catequista_id?: string }): Resposta[] {
  return respostas.filter(r => {
    if (filtros.centro_id && r.centro_id !== filtros.centro_id) return false
    if (filtros.catequista_id && !getCatequistasIds(r).includes(filtros.catequista_id)) return false
    return true
  })
}

// Normaliza centro_id: '' ou undefined -> null (Google Sheets devolve '' para campos vazios)
function normCentro(v: string | null | undefined): string | null {
  return v === '' || v == null ? null : v
}

export function getPerguntasParaCentro(perguntas: Pergunta[], seccoes: Seccao[], centro_id: string, desactivadas: string[]): { seccao: Seccao; perguntas: Pergunta[] }[] {
  const permitidas = perguntas.filter(p => {
    const cid = normCentro(p.centro_id)
    if (cid !== null && cid !== centro_id) return false
    if (desactivadas.includes(p.id)) return false
    return true
  })
  return seccoes
    .filter(s => normCentro(s.centro_id) === null || s.centro_id === centro_id)
    .sort((a, b) => a.ordem - b.ordem)
    .map(s => ({ seccao: s, perguntas: permitidas.filter(p => p.seccao_id === s.id).sort((a, b) => a.ordem - b.ordem) }))
    .filter(s => s.perguntas.length > 0)
}

// ── Exportar CSV (com nomes em vez de UUIDs) ──────────────────────────────────

export function exportarCSV(
  respostas: Resposta[],
  perguntas: Pergunta[],
  centros: Centro[],
  catequistas: Catequista[],
  faixas: FaixaEtaria[]
): void {
  const centroMap = Object.fromEntries(centros.map(c => [c.id, c.nome]))
  const catMap = Object.fromEntries(catequistas.map(c => [c.id, c.nome]))
  const faixaMap = Object.fromEntries(faixas.map(f => [f.id, f.label]))
  const etapaMap: Record<string, string> = {
    'pre-catecumenato': 'Pré-catecumenato', '1-catecumenato': '1.º Catecumenato',
    '2-catecumenato': '2.º Catecumenato', '3-catecumenato': '3.º Catecumenato',
    '1-crisma': '1.º Crisma', '2-crisma': '2.º Crisma', 'intensivo': 'Intensivo',
  }

  const cabecalho = ['ID', 'Data/Hora', 'Centro', 'Catequista(s)', 'Etapa', 'Faixa Etária', ...perguntas.map(p => p.texto.slice(0, 50))]

  const linhas = respostas.map(r => {
    const cats = getCatequistasIds(r).map(id => catMap[id] ?? id).join('; ')
    return [
      r.id, r.timestamp,
      centroMap[r.centro_id] ?? r.centro_id,
      cats,
      etapaMap[r.etapa] ?? r.etapa,
      faixaMap[r.faixa_etaria_id] ?? r.faixa_etaria_id,
      ...perguntas.map(p => r.respostas[p.id] ?? ''),
    ].map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')
  })

  const csv = [cabecalho.join(','), ...linhas].join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `inquerito-${new Date().toISOString().slice(0, 10)}.csv` })
  a.click(); URL.revokeObjectURL(a.href)
}

// ── Motor de análise ──────────────────────────────────────────────────────────

export function gerarAnalise(
  stats: EstatisticasGerais,
  perguntas: Pergunta[],
  centros: Centro[],
  catequistas: Catequista[],
  faixas: FaixaEtaria[],
  totalEsperado?: number
): RelatorioAnalise {
  const insights: InsightAnalise[] = []
  const medias = stats.medias_por_pergunta
  const vals = Object.values(medias).filter(v => v > 0)
  const mediaGlobal = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
  const score = Math.round((mediaGlobal / 5) * 100)

  // ── Participação ────────────────────────────────────────────────────────────
  const taxaParticipacao = totalEsperado ? Math.round((stats.total / totalEsperado) * 100) : null
  const participacao: InsightAnalise = {
    tipo: stats.total === 0 ? 'critico' : stats.total < 5 ? 'atencao' : 'positivo',
    titulo: 'Participação no inquérito',
    descricao: stats.total === 0
      ? 'Ainda não há respostas registadas.'
      : `Foram recolhidas ${stats.total} resposta${stats.total !== 1 ? 's' : ''}${taxaParticipacao ? ` (${taxaParticipacao}% do esperado)` : ''}.`,
    valor: `${stats.total}`,
  }

  // ── Pontos positivos ────────────────────────────────────────────────────────
  const destaques_positivos: InsightAnalise[] = []
  for (const [pid, m] of Object.entries(medias)) {
    if (m >= 4.2) {
      const p = perguntas.find(x => x.id === pid)
      if (p) destaques_positivos.push({ tipo: 'positivo', titulo: 'Avaliação muito positiva', descricao: `"${p.texto.slice(0, 60)}…" obteve uma média de ${m.toFixed(1)}/5.`, valor: `${m.toFixed(1)}/5` })
    }
  }

  // ── Áreas de melhoria ───────────────────────────────────────────────────────
  const areas_melhoria: InsightAnalise[] = []
  for (const [pid, m] of Object.entries(medias)) {
    if (m > 0 && m < 3.0) {
      const p = perguntas.find(x => x.id === pid)
      if (p) areas_melhoria.push({ tipo: m < 2 ? 'critico' : 'atencao', titulo: 'Área que precisa de atenção', descricao: `"${p.texto.slice(0, 60)}…" teve uma média de ${m.toFixed(1)}/5. Recomenda-se análise e acção imediata.`, valor: `${m.toFixed(1)}/5` })
    }
  }

  // ── Insights catequistas ────────────────────────────────────────────────────
  const insights_catequistas: InsightAnalise[] = []
  const totalCats = Object.keys(stats.por_catequista).length
  if (totalCats > 0) {
    const sorted = Object.entries(stats.por_catequista).sort((a, b) => b[1] - a[1])
    const top = sorted[0]
    const catNome = catequistas.find(c => c.id === top[0])?.nome ?? top[0]
    insights_catequistas.push({ tipo: 'info', titulo: 'Maior participação', descricao: `O catequista ${catNome} tem o maior número de respostas (${top[1]}).`, valor: `${top[1]}` })

    const semRespostas = catequistas.filter(c => !stats.por_catequista[c.id])
    if (semRespostas.length > 0) {
      insights_catequistas.push({ tipo: 'atencao', titulo: 'Catequistas sem respostas', descricao: `${semRespostas.length} catequista(s) ainda não têm respostas: ${semRespostas.slice(0, 3).map(c => c.nome).join(', ')}${semRespostas.length > 3 ? '…' : ''}.`, valor: `${semRespostas.length}` })
    }
  }

  // ── Distribuições notáveis ──────────────────────────────────────────────────
  for (const [pid, dist] of Object.entries(stats.distribuicoes_por_pergunta)) {
    const p = perguntas.find(x => x.id === pid)
    if (!p) continue
    const total = Object.values(dist).reduce((a, b) => a + b, 0)
    if (total === 0) continue
    for (const [op, n] of Object.entries(dist)) {
      const pct = Math.round((n / total) * 100)
      if (pct >= 60 && op !== 'Adequada' && op !== 'Adequadas') {
        insights.push({ tipo: pct >= 80 ? 'critico' : 'atencao', titulo: 'Tendência marcada', descricao: `Para "${p.texto.slice(0, 50)}…", ${pct}% respondeu "${op}".`, valor: `${pct}%` })
      }
    }
  }

  // ── Sugestões automáticas ───────────────────────────────────────────────────
  const sugestoes: string[] = []
  if (mediaGlobal < 3.0 && vals.length > 0) sugestoes.push('A satisfação geral está abaixo do esperado. Recomenda-se uma reunião urgente com os catequistas para identificar as causas.')
  if (mediaGlobal >= 4.0) sugestoes.push('O nível de satisfação é muito bom. Partilhe estes resultados com os catequistas como reconhecimento do seu esforço.')
  if (stats.total < 10) sugestoes.push('O número de respostas ainda é reduzido. Considere promover o inquérito nas próximas aulas com QR Code projetado.')

  const abertasCount = Object.values(stats.respostas_abertas_por_pergunta).flat().length
  if (abertasCount > 0) sugestoes.push(`Existem ${abertasCount} respostas escritas que merecem leitura atenta — podem conter informação qualitativa valiosa.`)

  const resumo = vals.length === 0
    ? 'Ainda não há dados suficientes para análise.'
    : `Com base em ${stats.total} resposta${stats.total !== 1 ? 's' : ''}, a avaliação global é de ${mediaGlobal.toFixed(1)}/5 (${score >= 80 ? 'excelente' : score >= 60 ? 'boa' : score >= 40 ? 'razoável' : 'fraca'}). ${destaques_positivos.length > 0 ? `Há ${destaques_positivos.length} ponto(s) muito positivo(s).` : ''} ${areas_melhoria.length > 0 ? `Identificaram-se ${areas_melhoria.length} área(s) a melhorar.` : ''}`

  return {
    resumo_geral: resumo,
    participacao,
    destaques_positivos,
    areas_melhoria,
    insights_catequistas,
    sugestoes,
    score_global: score,
  }
}

export { CHART_COLORS }
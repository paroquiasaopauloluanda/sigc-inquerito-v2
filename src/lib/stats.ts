import type { Resposta, Pergunta, Seccao, EstatisticasGerais } from '../types'
import { CHART_COLORS } from './config'

export function calcularEstatisticas(
  respostas: Resposta[],
  perguntas: Pergunta[]
): EstatisticasGerais {
  const n = respostas.length

  const por_centro: Record<string, number> = {}
  const por_catequista: Record<string, number> = {}
  const por_etapa: Record<string, number> = {}
  const por_faixa: Record<string, number> = {}
  const medias: Record<string, number> = {}
  const distribuicoes: Record<string, Record<string, number>> = {}
  const abertas: Record<string, string[]> = {}

  for (const r of respostas) {
    por_centro[r.centro_id] = (por_centro[r.centro_id] ?? 0) + 1
    por_catequista[r.catequista_id] = (por_catequista[r.catequista_id] ?? 0) + 1
    por_etapa[r.etapa] = (por_etapa[r.etapa] ?? 0) + 1
    por_faixa[r.faixa_etaria_id] = (por_faixa[r.faixa_etaria_id] ?? 0) + 1
  }

  for (const p of perguntas) {
    const vals = respostas.map(r => r.respostas[p.id]).filter(Boolean)

    if (p.tipo === 'estrelas') {
      const nums = vals.map(Number).filter(v => !isNaN(v) && v > 0)
      medias[p.id] = nums.length
        ? Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10
        : 0
    }

    if (p.tipo === 'opcao_unica' || p.tipo === 'multipla_escolha') {
      const dist: Record<string, number> = {}
      for (const v of vals) {
        // multipla_escolha pode ter várias separadas por |
        const items = v.split('|').map(s => s.trim()).filter(Boolean)
        for (const item of items) dist[item] = (dist[item] ?? 0) + 1
      }
      distribuicoes[p.id] = dist
    }

    if (p.tipo === 'texto') {
      abertas[p.id] = vals.filter(v => v.trim().length > 0)
    }
  }

  return {
    total: n,
    por_centro,
    por_catequista,
    por_etapa,
    por_faixa,
    medias_por_pergunta: medias,
    distribuicoes_por_pergunta: distribuicoes,
    respostas_abertas_por_pergunta: abertas,
  }
}

export function filtrarRespostas(
  respostas: Resposta[],
  filtros: { centro_id?: string; catequista_id?: string }
): Resposta[] {
  return respostas.filter(r => {
    if (filtros.centro_id && r.centro_id !== filtros.centro_id) return false
    if (filtros.catequista_id && r.catequista_id !== filtros.catequista_id) return false
    return true
  })
}

export function getPerguntasParaCentro(
  perguntas: Pergunta[],
  seccoes: Seccao[],
  centro_id: string,
  desactivadas: string[]
): { seccao: Seccao; perguntas: Pergunta[] }[] {
  // Base + do centro, excluindo desactivadas
  const permitidas = perguntas.filter(p =>
    (p.centro_id === null || p.centro_id === centro_id) &&
    !desactivadas.includes(p.id)
  )

  // Secções base + do centro
  const seccoesCentro = seccoes
    .filter(s => s.centro_id === null || s.centro_id === centro_id)
    .sort((a, b) => a.ordem - b.ordem)

  return seccoesCentro
    .map(s => ({
      seccao: s,
      perguntas: permitidas
        .filter(p => p.seccao_id === s.id)
        .sort((a, b) => a.ordem - b.ordem),
    }))
    .filter(s => s.perguntas.length > 0)
}

export function exportarCSV(respostas: Resposta[], perguntas: Pergunta[]): void {
  const cabecalho = ['ID', 'Data/Hora', 'Centro', 'Catequista', 'Etapa', 'Faixa Etária',
    ...perguntas.map(p => p.texto.slice(0, 40))]

  const linhas = respostas.map(r => [
    r.id, r.timestamp, r.centro_id, r.catequista_id, r.etapa, r.faixa_etaria_id,
    ...perguntas.map(p => r.respostas[p.id] ?? ''),
  ].map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))

  const csv = [cabecalho.join(','), ...linhas].join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(blob),
    download: `inquerito-${new Date().toISOString().slice(0, 10)}.csv`,
  })
  a.click()
  URL.revokeObjectURL(a.href)
}

export { CHART_COLORS }

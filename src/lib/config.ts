export const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL ?? ''
export const ROOT_PASSWORD = 'rootroot'
export const NOME_SISTEMA = import.meta.env.VITE_NOME_SISTEMA ?? 'SIGC Catequese'
export const ANO_CATEQUETICO = import.meta.env.VITE_ANO_CATEQUETICO ?? '2024/2025'

export const ETAPAS = [
  { id: 'pre-catecumenato', label: 'Pré-catecumenato' },
  { id: '1-catecumenato', label: '1.º Catecumenato' },
  { id: '2-catecumenato', label: '2.º Catecumenato' },
  { id: '3-catecumenato', label: '3.º Catecumenato' },
  { id: '1-crisma', label: '1.º Crisma' },
  { id: '2-crisma', label: '2.º Crisma' },
  { id: 'intensivo', label: 'Intensivo' },
]

export const TIPO_PERGUNTA_LABEL: Record<string, string> = {
  estrelas: '⭐ Avaliação por estrelas',
  opcao_unica: '🔘 Selecção única',
  multipla_escolha: '☑️ Múltipla escolha',
  texto: '✏️ Resposta escrita',
}

// Cores para estrelas: 1=vermelho, 2=laranja, 3=amarelo, 4=azul, 5=verde
export const STAR_COLORS: Record<number, string> = {
  1: '#ef4444',
  2: '#f97316',
  3: '#eab308',
  4: '#3b82f6',
  5: '#22c55e',
}

export function getStarColor(valor: number): string {
  const v = Math.round(valor)
  return STAR_COLORS[Math.min(5, Math.max(1, v))] ?? '#9ca3af'
}

export function getStarColorByPct(pct: number): string {
  if (pct >= 80) return STAR_COLORS[5]
  if (pct >= 60) return STAR_COLORS[4]
  if (pct >= 40) return STAR_COLORS[3]
  if (pct >= 20) return STAR_COLORS[2]
  return STAR_COLORS[1]
}

export const CHART_COLORS = [
  '#7c3aed','#059669','#f59e0b','#ef4444','#3b82f6',
  '#ec4899','#14b8a6','#f97316','#8b5cf6','#10b981',
]

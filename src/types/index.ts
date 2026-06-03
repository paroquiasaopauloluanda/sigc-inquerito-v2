// ── Entidades base ─────────────────────────────────────────────────────────

export interface Centro {
  id: string
  nome: string
  descricao: string
  senha_coord: string
  senha_cat: string
  activo: boolean
}

export interface Catequista {
  id: string
  nome: string
  centros_ids: string[]
}

export interface FaixaEtaria {
  id: string
  label: string
  ordem: number
  activo: boolean
}

export type TipoPergunta = 'estrelas' | 'opcao_unica' | 'multipla_escolha' | 'texto'

export interface Pergunta {
  id: string
  seccao_id: string
  centro_id: string | null
  tipo: TipoPergunta
  texto: string
  opcoes: string[]
  min_chars: number
  placeholder: string       // ← novo
  obrigatoria: boolean
  ordem: number
}

export interface Seccao {
  id: string
  centro_id: string | null
  titulo: string
  subtitulo: string         // ← novo
  ordem: number
}

export interface PerguntaDesactivada {
  centro_id: string
  pergunta_id: string
}

// ── Resposta (retrocompatível: catequista_id legado OU catequistas_ids novo) ─

export interface Resposta {
  id: string
  device_id: string
  timestamp: string
  centro_id: string
  catequistas_ids: string[]   // ← múltiplos (novo)
  catequista_id?: string      // ← legado (respostas antigas)
  etapa: string
  faixa_etaria_id: string
  respostas: Record<string, string>
}

// Helper: obtém lista de catequistas de uma resposta (compatível c/ ambos os formatos)
export function getCatequistasIds(r: Resposta): string[] {
  if (r.catequistas_ids?.length) return r.catequistas_ids
  if (r.catequista_id) return [r.catequista_id]
  return []
}

// ── Auth ────────────────────────────────────────────────────────────────────

export type NivelAcesso = 'catequista' | 'coordenador' | 'root'

// ── Stats ───────────────────────────────────────────────────────────────────

export interface EstatisticasGerais {
  total: number
  por_centro: Record<string, number>
  por_catequista: Record<string, number>
  por_etapa: Record<string, number>
  por_faixa: Record<string, number>
  medias_por_pergunta: Record<string, number>
  distribuicoes_por_pergunta: Record<string, Record<string, number>>
  respostas_abertas_por_pergunta: Record<string, string[]>
}

// ── Análise ─────────────────────────────────────────────────────────────────

export interface InsightAnalise {
  tipo: 'positivo' | 'atencao' | 'critico' | 'info'
  titulo: string
  descricao: string
  valor?: string
}

export interface RelatorioAnalise {
  resumo_geral: string
  participacao: InsightAnalise
  destaques_positivos: InsightAnalise[]
  areas_melhoria: InsightAnalise[]
  insights_catequistas: InsightAnalise[]
  sugestoes: string[]
  score_global: number // 0-100
}

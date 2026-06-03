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
  centros_ids: string[] // pode pertencer a vários centros
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
  centro_id: string | null // null = pergunta base (todos os centros)
  tipo: TipoPergunta
  texto: string
  opcoes: string[]         // para estrelas, opcao_unica, multipla_escolha
  min_chars: number        // para tipo texto
  obrigatoria: boolean
  ordem: number
}

export interface Seccao {
  id: string
  centro_id: string | null // null = secção base
  titulo: string
  ordem: number
}

export interface PerguntaDesactivada {
  centro_id: string
  pergunta_id: string
}

// ── Resposta ────────────────────────────────────────────────────────────────

export interface Resposta {
  id: string
  device_id: string
  timestamp: string
  centro_id: string
  catequista_id: string
  etapa: string
  faixa_etaria_id: string
  // Respostas dinâmicas: chave = pergunta_id, valor = string (serializado)
  respostas: Record<string, string>
}

// ── Auth ────────────────────────────────────────────────────────────────────

export type NivelAcesso = 'catequista' | 'coordenador' | 'root'

export interface SessaoAdmin {
  centro_id: string
  nivel: NivelAcesso
}

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

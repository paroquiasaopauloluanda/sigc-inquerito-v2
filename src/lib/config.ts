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

// Cores para gráficos
export const CHART_COLORS = [
  '#7c3aed', '#059669', '#f59e0b', '#ef4444', '#3b82f6',
  '#ec4899', '#14b8a6', '#f97316', '#8b5cf6', '#10b981',
]

// Perguntas base (id fixo para compatibilidade)
export const SECCAO_BASE_IDS = {
  catequese: 'base-s1',
  catequistas: 'base-s2',
  atividades: 'base-s3',
  expectativas: 'base-s4',
  sugestoes: 'base-s5',
}

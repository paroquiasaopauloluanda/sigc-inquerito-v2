import { APPS_SCRIPT_URL } from './config'
import type { Centro, Catequista, FaixaEtaria, Seccao, Pergunta, PerguntaDesactivada, Resposta } from '../types'

// ── Dev mode ──────────────────────────────────────────────────────────────────
function devGet<T>(key: string, def: T): T {
  try { return JSON.parse(localStorage.getItem(key) ?? 'null') ?? def } catch { return def }
}
function devSet(key: string, val: unknown) { localStorage.setItem(key, JSON.stringify(val)) }

// ── HTTP ──────────────────────────────────────────────────────────────────────
// Google Apps Script não suporta CORS preflight — enviamos tudo via GET com
// payload em base64 na query string. doGet no script trata tanto leituras como escritas.
async function call<T = { success: boolean }>(params: Record<string, string>): Promise<T> {
  if (!APPS_SCRIPT_URL) throw new Error('No APPS_SCRIPT_URL')
  const url = APPS_SCRIPT_URL + '?' + new URLSearchParams(params).toString()
  const r = await fetch(url)
  const j = await r.json()
  if (j.error) throw new Error(j.error)
  return j
}

// Para escritas: envia via GET com payload JSON codificado em base64url
// base64url usa - e _ em vez de + e / e sem = no fim — seguro em query strings
function toBase64Url(str: string): string {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

async function write(action: string, data: unknown): Promise<void> {
  if (!APPS_SCRIPT_URL) throw new Error('No APPS_SCRIPT_URL')
  const payload = toBase64Url(JSON.stringify(data))
  // Usa encodeURIComponent explícito para garantir que - e _ não são alterados
  const url = `${APPS_SCRIPT_URL}?action=${encodeURIComponent(action)}&payload=${payload}`
  try {
    const r = await fetch(url)
    const j = await r.json()
    if (j.error) throw new Error(j.error)
  } catch (e) {
    // Apps Script às vezes não devolve CORS headers em escritas — se chegou ao servidor é suficiente
    // Só relança se for um erro de rede real (não CORS)
    if (e instanceof TypeError && e.message.includes('fetch')) throw e
  }
}

// ── Device ────────────────────────────────────────────────────────────────────
const DEVICE_KEY = '_sigc_did'
const SUBMITTED_KEY = '_sigc_submitted'

export function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_KEY)
  if (!id) { id = crypto.randomUUID(); localStorage.setItem(DEVICE_KEY, id) }
  return id
}
export function jaSubmeteu(): boolean { return localStorage.getItem(SUBMITTED_KEY) === '1' }
function marcarSubmetido() { localStorage.setItem(SUBMITTED_KEY, '1') }

export async function verificarDuplicado(deviceId: string): Promise<boolean> {
  if (!APPS_SCRIPT_URL) return jaSubmeteu()
  try {
    const r = await call<{ data: { exists: boolean } }>({ action: 'checkDevice', device_id: deviceId })
    return r.data.exists
  } catch { return jaSubmeteu() }
}

// ── Centros ───────────────────────────────────────────────────────────────────
export async function getCentros(): Promise<Centro[]> {
  if (!APPS_SCRIPT_URL) return devGet<Centro[]>('_sigc_centros', [])
  return (await call<{ data: Centro[] }>({ action: 'getCentros' })).data
}
export async function saveCentro(c: Centro): Promise<void> {
  if (!APPS_SCRIPT_URL) { const l = devGet<Centro[]>('_sigc_centros', []); const i = l.findIndex(x => x.id === c.id); if (i >= 0) l[i] = c; else l.push(c); devSet('_sigc_centros', l); return }
  await write('saveCentro', c)
}
export async function deleteCentro(id: string): Promise<void> {
  if (!APPS_SCRIPT_URL) { devSet('_sigc_centros', devGet<Centro[]>('_sigc_centros', []).filter(x => x.id !== id)); return }
  await write('deleteCentro', { id })
}

// ── Catequistas ───────────────────────────────────────────────────────────────
export async function getCatequistas(): Promise<Catequista[]> {
  if (!APPS_SCRIPT_URL) return devGet<Catequista[]>('_sigc_catequistas', [])
  return (await call<{ data: Catequista[] }>({ action: 'getCatequistas' })).data
}
export async function saveCatequista(c: Catequista): Promise<void> {
  if (!APPS_SCRIPT_URL) { const l = devGet<Catequista[]>('_sigc_catequistas', []); const i = l.findIndex(x => x.id === c.id); if (i >= 0) l[i] = c; else l.push(c); devSet('_sigc_catequistas', l); return }
  await write('saveCatequista', c)
}
export async function deleteCatequista(id: string): Promise<void> {
  if (!APPS_SCRIPT_URL) { devSet('_sigc_catequistas', devGet<Catequista[]>('_sigc_catequistas', []).filter(x => x.id !== id)); return }
  await write('deleteCatequista', { id })
}

// ── Faixas ────────────────────────────────────────────────────────────────────
export async function getFaixas(): Promise<FaixaEtaria[]> {
  if (!APPS_SCRIPT_URL) return devGet<FaixaEtaria[]>('_sigc_faixas', [
    { id: 'f1', label: '17 – 25 anos', ordem: 1, activo: true },
    { id: 'f2', label: '26 – 35 anos', ordem: 2, activo: true },
    { id: 'f3', label: '36 – 45 anos', ordem: 3, activo: true },
    { id: 'f4', label: '46 – 60 anos', ordem: 4, activo: true },
  ])
  return (await call<{ data: FaixaEtaria[] }>({ action: 'getFaixas' })).data
}
export async function saveFaixa(f: FaixaEtaria): Promise<void> {
  if (!APPS_SCRIPT_URL) { const l = devGet<FaixaEtaria[]>('_sigc_faixas', []); const i = l.findIndex(x => x.id === f.id); if (i >= 0) l[i] = f; else l.push(f); devSet('_sigc_faixas', l); return }
  await write('saveFaixa', f)
}
export async function deleteFaixa(id: string): Promise<void> {
  if (!APPS_SCRIPT_URL) { devSet('_sigc_faixas', devGet<FaixaEtaria[]>('_sigc_faixas', []).filter(x => x.id !== id)); return }
  await write('deleteFaixa', { id })
}

// ── Secções ───────────────────────────────────────────────────────────────────
export async function getSeccoes(): Promise<Seccao[]> {
  if (!APPS_SCRIPT_URL) return devGet<Seccao[]>('_sigc_seccoes', getDefaultSeccoes())
  return (await call<{ data: Seccao[] }>({ action: 'getSeccoes' })).data
}
export async function saveSeccao(s: Seccao): Promise<void> {
  if (!APPS_SCRIPT_URL) { const l = devGet<Seccao[]>('_sigc_seccoes', getDefaultSeccoes()); const i = l.findIndex(x => x.id === s.id); if (i >= 0) l[i] = s; else l.push(s); devSet('_sigc_seccoes', l); return }
  await write('saveSeccao', s)
}
export async function deleteSeccao(id: string): Promise<void> {
  if (!APPS_SCRIPT_URL) { devSet('_sigc_seccoes', devGet<Seccao[]>('_sigc_seccoes', []).filter(x => x.id !== id)); return }
  await write('deleteSeccao', { id })
}

// ── Perguntas ─────────────────────────────────────────────────────────────────
export async function getPerguntas(): Promise<Pergunta[]> {
  if (!APPS_SCRIPT_URL) return devGet<Pergunta[]>('_sigc_perguntas', getDefaultPerguntas())
  return (await call<{ data: Pergunta[] }>({ action: 'getPerguntas' })).data
}
export async function savePergunta(p: Pergunta): Promise<void> {
  if (!APPS_SCRIPT_URL) { const l = devGet<Pergunta[]>('_sigc_perguntas', getDefaultPerguntas()); const i = l.findIndex(x => x.id === p.id); if (i >= 0) l[i] = p; else l.push(p); devSet('_sigc_perguntas', l); return }
  await write('savePergunta', p)
}
export async function deletePergunta(id: string): Promise<void> {
  if (!APPS_SCRIPT_URL) { devSet('_sigc_perguntas', devGet<Pergunta[]>('_sigc_perguntas', []).filter(x => x.id !== id)); return }
  await write('deletePergunta', { id })
}

// ── Perguntas desactivadas ────────────────────────────────────────────────────
export async function getPerguntasDesactivadas(): Promise<PerguntaDesactivada[]> {
  if (!APPS_SCRIPT_URL) return devGet<PerguntaDesactivada[]>('_sigc_desactivadas', [])
  return (await call<{ data: PerguntaDesactivada[] }>({ action: 'getPerguntasDesactivadas' })).data
}
export async function savePerguntasDesactivadas(centro_id: string, pergunta_ids: string[]): Promise<void> {
  if (!APPS_SCRIPT_URL) {
    const all = devGet<PerguntaDesactivada[]>('_sigc_desactivadas', []).filter(x => x.centro_id !== centro_id)
    pergunta_ids.forEach(pid => all.push({ centro_id, pergunta_id: pid }))
    devSet('_sigc_desactivadas', all)
    return
  }
  await write('savePerguntasDesactivadas', { centro_id, pergunta_ids })
}

// ── Respostas ─────────────────────────────────────────────────────────────────
export async function submeterResposta(r: Omit<Resposta, 'id' | 'device_id' | 'timestamp'>): Promise<void> {
  const payload: Resposta = { ...r, id: crypto.randomUUID(), device_id: getDeviceId(), timestamp: new Date().toISOString() }
  if (!APPS_SCRIPT_URL) {
    const l = devGet<Resposta[]>('_sigc_respostas', [])
    l.push(payload); devSet('_sigc_respostas', l); marcarSubmetido(); return
  }
  await write('submitResposta', payload)
  marcarSubmetido()
}
export async function getRespostas(): Promise<Resposta[]> {
  if (!APPS_SCRIPT_URL) return devGet<Resposta[]>('_sigc_respostas', [])
  return (await call<{ data: Resposta[] }>({ action: 'getRespostas' })).data
}

// ── Defaults ──────────────────────────────────────────────────────────────────
export function getDefaultSeccoes(): Seccao[] {
  return [
    { id: 'base-s1', centro_id: null, titulo: 'A catequese em geral', subtitulo: '', ordem: 1 },
    { id: 'base-s2', centro_id: null, titulo: 'Os catequistas', subtitulo: 'Avalia os catequistas da tua turma de forma geral.', ordem: 2 },
    { id: 'base-s3', centro_id: null, titulo: 'Dinâmicas e actividades', subtitulo: '', ordem: 3 },
    { id: 'base-s4', centro_id: null, titulo: 'Expectativas e realidade', subtitulo: 'A tua opinião sincera é muito importante para nós.', ordem: 4 },
    { id: 'base-s5', centro_id: null, titulo: 'Sugestões', subtitulo: 'Todas as perguntas desta secção são opcionais.', ordem: 5 },
  ]
}

export function getDefaultPerguntas(): Pergunta[] {
  return [
    { id: 'bp-01', seccao_id: 'base-s1', centro_id: null, tipo: 'estrelas', texto: 'No geral, como avalias a catequese este ano?', opcoes: [], min_chars: 0, placeholder: '', obrigatoria: true, ordem: 1 },
    { id: 'bp-02', seccao_id: 'base-s1', centro_id: null, tipo: 'opcao_unica', texto: 'Como consideras a duração das aulas?', opcoes: ['Muito curta', 'Adequada', 'Demasiado longa'], min_chars: 0, placeholder: '', obrigatoria: true, ordem: 2 },
    { id: 'bp-03', seccao_id: 'base-s1', centro_id: null, tipo: 'opcao_unica', texto: 'A frequência das aulas por semana é…', opcoes: ['Pouca', 'Adequada', 'Demasiada'], min_chars: 0, placeholder: '', obrigatoria: true, ordem: 3 },
    { id: 'bp-04', seccao_id: 'base-s1', centro_id: null, tipo: 'estrelas', texto: 'Como avalias os conteúdos abordados?', opcoes: [], min_chars: 0, placeholder: '', obrigatoria: true, ordem: 4 },
    { id: 'bp-05', seccao_id: 'base-s1', centro_id: null, tipo: 'estrelas', texto: 'Os materiais usados são adequados?', opcoes: [], min_chars: 0, placeholder: '', obrigatoria: true, ordem: 5 },
    { id: 'bp-06', seccao_id: 'base-s1', centro_id: null, tipo: 'opcao_unica', texto: 'As aulas começam a horas?', opcoes: ['Quase nunca', 'Às vezes', 'Sempre'], min_chars: 0, placeholder: '', obrigatoria: true, ordem: 6 },
    { id: 'bp-07', seccao_id: 'base-s1', centro_id: null, tipo: 'texto', texto: 'Tens algum comentário sobre a catequese em geral?', opcoes: [], min_chars: 0, placeholder: 'Partilha o que quiseres…', obrigatoria: false, ordem: 7 },
    { id: 'bp-08', seccao_id: 'base-s2', centro_id: null, tipo: 'estrelas', texto: 'Com que clareza explicam os conteúdos?', opcoes: [], min_chars: 0, placeholder: '', obrigatoria: true, ordem: 1 },
    { id: 'bp-09', seccao_id: 'base-s2', centro_id: null, tipo: 'estrelas', texto: 'Estão disponíveis para tirar dúvidas fora da aula?', opcoes: [], min_chars: 0, placeholder: '', obrigatoria: true, ordem: 2 },
    { id: 'bp-10', seccao_id: 'base-s2', centro_id: null, tipo: 'estrelas', texto: 'Como é a relação deles contigo e com o grupo?', opcoes: [], min_chars: 0, placeholder: '', obrigatoria: true, ordem: 3 },
    { id: 'bp-11', seccao_id: 'base-s2', centro_id: null, tipo: 'estrelas', texto: 'Sentes que chegam bem preparados para as aulas?', opcoes: [], min_chars: 0, placeholder: '', obrigatoria: true, ordem: 4 },
    { id: 'bp-12', seccao_id: 'base-s2', centro_id: null, tipo: 'texto', texto: 'Tens algum comentário sobre os catequistas?', opcoes: [], min_chars: 0, placeholder: 'Podes partilhar o que achares relevante…', obrigatoria: false, ordem: 5 },
    { id: 'bp-13', seccao_id: 'base-s3', centro_id: null, tipo: 'opcao_unica', texto: 'A quantidade de orações durante as aulas é…', opcoes: ['Poucas', 'Adequadas', 'Muitas'], min_chars: 0, placeholder: '', obrigatoria: true, ordem: 1 },
    { id: 'bp-14', seccao_id: 'base-s3', centro_id: null, tipo: 'estrelas', texto: 'Como avalias as actividades práticas?', opcoes: [], min_chars: 0, placeholder: '', obrigatoria: true, ordem: 2 },
    { id: 'bp-15', seccao_id: 'base-s3', centro_id: null, tipo: 'estrelas', texto: 'Como são os momentos de partilha no grupo?', opcoes: [], min_chars: 0, placeholder: '', obrigatoria: true, ordem: 3 },
    { id: 'bp-16', seccao_id: 'base-s3', centro_id: null, tipo: 'opcao_unica', texto: 'Houve retiro ou saída este ano catequético?', opcoes: ['Sim, gostei', 'Sim, mas não gostei', 'Não houve', 'Não é necessário'], min_chars: 0, placeholder: '', obrigatoria: true, ordem: 4 },
    { id: 'bp-17', seccao_id: 'base-s3', centro_id: null, tipo: 'texto', texto: 'Que actividade gostarias de ver nas aulas?', opcoes: [], min_chars: 0, placeholder: 'Ex: visitas, grupos de oração, debates, testemunhos…', obrigatoria: false, ordem: 5 },
    { id: 'bp-18', seccao_id: 'base-s4', centro_id: null, tipo: 'texto', texto: 'Quando começaste a catequese, o que esperavas? Correspondeu à realidade?', opcoes: [], min_chars: 10, placeholder: 'Escreve com à vontade. Quanto mais detalhe, mais útil será para nós…', obrigatoria: true, ordem: 1 },
    { id: 'bp-19', seccao_id: 'base-s5', centro_id: null, tipo: 'texto', texto: 'O que gostarias de ver acrescentado à catequese?', opcoes: [], min_chars: 0, placeholder: 'Novas actividades, temas, recursos…', obrigatoria: false, ordem: 1 },
    { id: 'bp-20', seccao_id: 'base-s5', centro_id: null, tipo: 'texto', texto: 'Há algo que deveríamos remover ou reduzir?', opcoes: [], min_chars: 0, placeholder: 'O que consideras desnecessário ou demasiado?', obrigatoria: false, ordem: 2 },
    { id: 'bp-21', seccao_id: 'base-s5', centro_id: null, tipo: 'texto', texto: 'O que poderíamos melhorar?', opcoes: [], min_chars: 0, placeholder: 'Organização, comunicação, espaço, horários…', obrigatoria: false, ordem: 3 },
  ]
}
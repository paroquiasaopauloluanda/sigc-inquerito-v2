import React, { useState } from 'react'
import type { Pergunta, Seccao, TipoPergunta } from '../../types'
import { Btn, Input, Textarea, Select, Modal, Badge, Estrelas, OpcaoCard, EmptyState } from '../ui'
import { TIPO_PERGUNTA_LABEL } from '../../lib/config'

interface Props {
  seccoes: Seccao[]
  perguntas: Pergunta[]
  centro_id: string | null
  soLeitura?: boolean
  desactivadas?: string[]
  onSaveSeccao: (s: Seccao) => Promise<void>
  onDeleteSeccao: (id: string) => Promise<void>
  onSavePergunta: (p: Pergunta) => Promise<void>
  onDeletePergunta: (id: string) => Promise<void>
  onToggleDesactivada?: (pid: string, estaDesactivada: boolean) => void
}

const TIPOS: { value: TipoPergunta; label: string }[] = [
  { value: 'estrelas', label: '⭐ Avaliação por estrelas (1–5)' },
  { value: 'opcao_unica', label: '🔘 Selecção única' },
  { value: 'multipla_escolha', label: '☑️ Múltipla escolha' },
  { value: 'texto', label: '✏️ Resposta escrita' },
]

function novaPergunta(seccao_id: string, centro_id: string | null, ordem: number): Pergunta {
  return { id: crypto.randomUUID(), seccao_id, centro_id, tipo: 'estrelas', texto: '', opcoes: [], min_chars: 0, placeholder: '', obrigatoria: true, ordem }
}

function novaSeccao(centro_id: string | null, ordem: number): Seccao {
  return { id: crypto.randomUUID(), centro_id, titulo: '', subtitulo: '', ordem }
}

// Normalise centro_id: '' from Google Sheets → null
function normalizeCentroId(v: string | null | undefined): string | null {
  return v === '' || v == null ? null : v
}

export function EditorPerguntas({ seccoes, perguntas, centro_id, soLeitura, desactivadas = [], onSaveSeccao, onDeleteSeccao, onSavePergunta, onDeletePergunta, onToggleDesactivada }: Props) {
  const [modalSeccao, setModalSeccao] = useState<Seccao | null>(null)
  const [modalPergunta, setModalPergunta] = useState<Pergunta | null>(null)
  const [saving, setSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  // Normalise all incoming centro_ids
  const seccoesNorm = seccoes.map(s => ({ ...s, centro_id: normalizeCentroId(s.centro_id) }))
  const perguntasNorm = perguntas.map(p => ({ ...p, centro_id: normalizeCentroId(p.centro_id) }))

  const seccoesVisiveis = seccoesNorm
    .filter(s => s.centro_id === null || s.centro_id === centro_id)
    .sort((a, b) => a.ordem - b.ordem)

  async function guardarSeccao() {
    if (!modalSeccao || !modalSeccao.titulo.trim()) return
    setSaving(true)
    await onSaveSeccao(modalSeccao)
    setSaving(false); setModalSeccao(null)
  }

  async function guardarPergunta() {
    if (!modalPergunta || !modalPergunta.texto.trim()) return
    if ((modalPergunta.tipo === 'opcao_unica' || modalPergunta.tipo === 'multipla_escolha') && modalPergunta.opcoes.filter(o => o.trim()).length < 2) return
    setSaving(true)
    await onSavePergunta({ ...modalPergunta, centro_id: normalizeCentroId(modalPergunta.centro_id) })
    setSaving(false); setModalPergunta(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {!soLeitura && centro_id !== undefined && (
        <Btn variant="secondary" size="sm"
          onClick={() => setModalSeccao(novaSeccao(centro_id, seccoesVisiveis.length + 1))}
        >+ Nova secção</Btn>
      )}

      {seccoesVisiveis.map(s => {
        const psBase = perguntasNorm.filter(p => p.seccao_id === s.id && p.centro_id === null)
        const psCentro = perguntasNorm.filter(p => p.seccao_id === s.id && p.centro_id === centro_id && centro_id !== null)
        const isBase = s.centro_id === null
        const podeEditarSeccao = !soLeitura && (centro_id === null ? isBase : !isBase)

        return (
          <div key={s.id} style={{ border: '1px solid var(--gray-200)', borderRadius: 14, overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ padding: '12px 14px', background: isBase ? 'var(--purple-50)' : 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' as const }}>
                  <span style={{ fontWeight: 700, fontSize: '0.93rem', color: 'var(--gray-900)' }}>{s.titulo}</span>
                  <Badge color={isBase ? 'purple' : 'green'}>{isBase ? 'Base' : 'Do centro'}</Badge>
                </div>
                {s.subtitulo && <div style={{ fontSize: '0.78rem', color: 'var(--gray-500)', marginTop: 3 }}>{s.subtitulo}</div>}
              </div>
              {podeEditarSeccao && (
                <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                  <Btn size="sm" variant="ghost" onClick={() => setModalSeccao({ ...s })}>✏️</Btn>
                  <Btn size="sm" variant="danger" onClick={() => onDeleteSeccao(s.id)}>🗑️</Btn>
                </div>
              )}
            </div>

            {psBase.map(p => (
              <PerguntaItem key={p.id} pergunta={p} isBase={true}
                desactivada={desactivadas.includes(p.id)}
                soLeitura={soLeitura}
                isRoot={centro_id === null}
                onEdit={() => setModalPergunta({ ...p })}
                onDelete={() => onDeletePergunta(p.id)}
                onToggle={onToggleDesactivada ? () => onToggleDesactivada(p.id, desactivadas.includes(p.id)) : undefined}
              />
            ))}

            {psCentro.map(p => (
              <PerguntaItem key={p.id} pergunta={p} isBase={false}
                desactivada={false}
                soLeitura={soLeitura || centro_id === null}
                onEdit={() => setModalPergunta({ ...p })}
                onDelete={() => onDeletePergunta(p.id)}
              />
            ))}

            {!soLeitura && centro_id !== null && (
              <div style={{ padding: '10px 14px', borderTop: (psBase.length + psCentro.length > 0) ? '1px solid var(--gray-100)' : undefined }}>
                <Btn size="sm" variant="ghost"
                  onClick={() => setModalPergunta(novaPergunta(s.id, centro_id, psCentro.length + 100))}
                >+ Adicionar pergunta a esta secção</Btn>
              </div>
            )}

            {!soLeitura && centro_id === null && isBase && (
              <div style={{ padding: '10px 14px', borderTop: psBase.length > 0 ? '1px solid var(--gray-100)' : undefined }}>
                <Btn size="sm" variant="ghost"
                  onClick={() => setModalPergunta(novaPergunta(s.id, null, psBase.length + 1))}
                >+ Adicionar pergunta base</Btn>
              </div>
            )}
          </div>
        )
      })}

      {seccoesVisiveis.length === 0 && <EmptyState icon="📋" title="Sem secções" subtitle="Cria a primeira secção para começar" />}

      {/* Modal Secção */}
      <Modal open={!!modalSeccao} onClose={() => setModalSeccao(null)}
        title={modalSeccao && seccoesNorm.some(s => s.id === modalSeccao.id) ? 'Editar secção' : 'Nova secção'}
      >
        {modalSeccao && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Input label="Título da secção" required value={modalSeccao.titulo}
              onChange={e => setModalSeccao(p => p ? { ...p, titulo: e.target.value } : null)}
              placeholder="Ex: A catequese em geral"
            />
            <Input label="Subtítulo (opcional)" value={modalSeccao.subtitulo ?? ''}
              onChange={e => setModalSeccao(p => p ? { ...p, subtitulo: e.target.value } : null)}
              placeholder="Ex: Avalia de forma honesta e construtiva"
            />
            <Input label="Ordem" type="number" min={1} value={modalSeccao.ordem}
              onChange={e => setModalSeccao(p => p ? { ...p, ordem: Number(e.target.value) } : null)}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <Btn variant="ghost" full onClick={() => setModalSeccao(null)}>Cancelar</Btn>
              <Btn full loading={saving} disabled={!modalSeccao.titulo.trim()} onClick={guardarSeccao}>Guardar</Btn>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Pergunta */}
      <Modal open={!!modalPergunta} onClose={() => setModalPergunta(null)}
        title={modalPergunta && perguntasNorm.some(p => p.id === modalPergunta.id) ? 'Editar pergunta' : 'Nova pergunta'}
      >
        {modalPergunta && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Select label="Tipo de resposta" value={modalPergunta.tipo}
              onChange={e => setModalPergunta(p => p ? { ...p, tipo: e.target.value as TipoPergunta, opcoes: [] } : null)}
              options={TIPOS}
            />
            <Textarea label="Texto da pergunta" required value={modalPergunta.texto}
              onChange={e => setModalPergunta(p => p ? { ...p, texto: e.target.value } : null)}
              placeholder="Escreve a pergunta aqui…"
              style={{ minHeight: 70 }}
            />

            {/* Obrigatória */}
            <label style={{ display: 'flex', gap: 10, alignItems: 'center', cursor: 'pointer' }}>
              <input type="checkbox" checked={modalPergunta.obrigatoria}
                onChange={e => setModalPergunta(p => p ? { ...p, obrigatoria: e.target.checked } : null)}
                style={{ width: 18, height: 18, accentColor: 'var(--purple-600)' }}
              />
              <span style={{ fontSize: '0.9rem', color: 'var(--gray-700)' }}>Resposta obrigatória</span>
            </label>

            {/* Opções */}
            {(modalPergunta.tipo === 'opcao_unica' || modalPergunta.tipo === 'multipla_escolha') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--gray-700)' }}>
                  Opções de resposta <span style={{ color: '#dc2626' }}>*</span>
                </span>
                {modalPergunta.opcoes.map((op, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8 }}>
                    <input value={op}
                      onChange={e => { const ops = [...modalPergunta.opcoes]; ops[i] = e.target.value; setModalPergunta(p => p ? { ...p, opcoes: ops } : null) }}
                      placeholder={`Opção ${i + 1}`}
                      style={{ flex: 1, padding: '9px 12px', borderRadius: 8, border: '1.5px solid var(--gray-200)', fontFamily: 'inherit', fontSize: '0.9rem', outline: 'none' }}
                    />
                    <Btn size="sm" variant="danger"
                      onClick={() => setModalPergunta(p => p ? { ...p, opcoes: p.opcoes.filter((_, j) => j !== i) } : null)}>✕</Btn>
                  </div>
                ))}
                <Btn size="sm" variant="ghost"
                  onClick={() => setModalPergunta(p => p ? { ...p, opcoes: [...p.opcoes, ''] } : null)}>+ Adicionar opção</Btn>
                {modalPergunta.opcoes.filter(o => o.trim()).length < 2 && <span style={{ fontSize: '0.75rem', color: '#dc2626' }}>Mínimo 2 opções</span>}
              </div>
            )}

            {/* Texto: min chars + placeholder */}
            {modalPergunta.tipo === 'texto' && (
              <>
                <Input label="Placeholder (texto de ajuda na caixa)" value={modalPergunta.placeholder ?? ''}
                  onChange={e => setModalPergunta(p => p ? { ...p, placeholder: e.target.value } : null)}
                  placeholder="Ex: Descreve com à vontade…"
                />
                <Input label="Mínimo de caracteres (0 = sem mínimo)" type="number" min={0}
                  value={modalPergunta.min_chars}
                  onChange={e => setModalPergunta(p => p ? { ...p, min_chars: Number(e.target.value) } : null)}
                />
              </>
            )}

            {/* Preview */}
            <div>
              <Btn size="sm" variant="ghost" onClick={() => setShowPreview(v => !v)}>
                {showPreview ? '🙈 Ocultar pré-visualização' : '👁️ Pré-visualizar'}
              </Btn>
            </div>
            {showPreview && modalPergunta.texto && (
              <div style={{ padding: '14px', background: 'var(--purple-50)', border: '1.5px dashed var(--purple-300)', borderRadius: 12 }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--purple-500)', textTransform: 'uppercase', marginBottom: 8 }}>Pré-visualização</div>
                <PerguntaPreview pergunta={modalPergunta} />
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <Btn variant="ghost" full onClick={() => setModalPergunta(null)}>Cancelar</Btn>
              <Btn full loading={saving}
                disabled={!modalPergunta.texto.trim() ||
                  ((modalPergunta.tipo === 'opcao_unica' || modalPergunta.tipo === 'multipla_escolha') &&
                    modalPergunta.opcoes.filter(o => o.trim()).length < 2)}
                onClick={guardarPergunta}>Guardar</Btn>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

// ── PerguntaItem ──────────────────────────────────────────────────────────────
function PerguntaItem({ pergunta, isBase, desactivada, soLeitura, isRoot, onEdit, onDelete, onToggle }: {
  pergunta: Pergunta; isBase: boolean; desactivada: boolean; soLeitura?: boolean; isRoot?: boolean
  onEdit: () => void; onDelete: () => void; onToggle?: () => void
}) {
  return (
    <div style={{ padding: '11px 14px', borderTop: '1px solid var(--gray-100)', display: 'flex', alignItems: 'flex-start', gap: 10, opacity: desactivada ? .45 : 1, background: desactivada ? 'var(--gray-50)' : '#fff' }}>
      {onToggle && (
        <button
          type="button"
          onClick={onToggle}
          style={{
            flexShrink: 0, marginTop: 1,
            width: 44, height: 44,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'none', border: 'none', cursor: 'pointer',
            borderRadius: 8,
            WebkitTapHighlightColor: 'transparent',
          }}
          aria-label={desactivada ? 'Activar pergunta' : 'Desactivar pergunta'}
        >
          <span style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 22, height: 22, borderRadius: 6,
            border: `2.5px solid ${!desactivada ? 'var(--purple-600)' : 'var(--gray-300)'}`,
            background: !desactivada ? 'var(--purple-600)' : '#fff',
            transition: 'all .15s',
            fontSize: 14,
          }}>
            {!desactivada && <span style={{ color: '#fff', fontWeight: 800, lineHeight: 1 }}>✓</span>}
          </span>
        </button>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.88rem', color: 'var(--gray-800)', marginBottom: 4, lineHeight: 1.5 }}>{pergunta.texto}</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
          <Badge color="gray">{TIPO_PERGUNTA_LABEL[pergunta.tipo]?.split(' ').slice(1).join(' ')}</Badge>
          {pergunta.obrigatoria && <Badge color="red">Obrigatória</Badge>}
          {isBase && <Badge color="purple">Base</Badge>}
        </div>
      </div>
      {!soLeitura && (isRoot || !isBase) && (
        <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
          <Btn size="sm" variant="ghost" onClick={onEdit}>✏️</Btn>
          <Btn size="sm" variant="danger" onClick={onDelete}>🗑️</Btn>
        </div>
      )}
    </div>
  )
}

// ── PerguntaPreview ───────────────────────────────────────────────────────────
function PerguntaPreview({ pergunta }: { pergunta: Pergunta }) {
  const [val, setVal] = useState('')
  if (pergunta.tipo === 'estrelas') {
    return <Estrelas label={pergunta.texto} required={pergunta.obrigatoria} valor={Number(val) || 0} onChange={v => setVal(String(v))} />
  }
  if (pergunta.tipo === 'opcao_unica' || pergunta.tipo === 'multipla_escolha') {
    return pergunta.opcoes.filter(o => o.trim()).length >= 2
      ? <OpcaoCard label={pergunta.texto} required={pergunta.obrigatoria} opcoes={pergunta.opcoes.filter(o => o.trim())} valor={val} onChange={setVal} multi={pergunta.tipo === 'multipla_escolha'} colunas={pergunta.opcoes.length <= 4 ? 2 : 3} />
      : <p style={{ fontSize: '0.82rem', color: 'var(--gray-400)' }}>Adiciona pelo menos 2 opções para pré-visualizar</p>
  }
  if (pergunta.tipo === 'texto') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--gray-700)' }}>
          {pergunta.texto}{pergunta.obrigatoria && <span style={{ color: '#dc2626', marginLeft: 2 }}>*</span>}
        </span>
        <textarea rows={3} placeholder={pergunta.placeholder || 'Opcional…'} value={val} onChange={e => setVal(e.target.value)}
          style={{ padding: '10px 12px', borderRadius: 10, border: '1.5px solid var(--gray-200)', fontFamily: 'inherit', fontSize: '0.9rem', outline: 'none', resize: 'vertical' }} />
        {pergunta.min_chars > 0 && (
          <span style={{ fontSize: '0.75rem', color: val.trim().length < pergunta.min_chars ? '#dc2626' : 'var(--gray-400)' }}>
            {val.trim().length}/{pergunta.min_chars} mínimo
          </span>
        )}
      </div>
    )
  }
  return null
}

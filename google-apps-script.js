// ═══════════════════════════════════════════════════════════════════════════
// SIGC — Inquérito Multi-Centro · Google Apps Script v4
// Cola este código em script.google.com → Extensões → Apps Script
// Depois: Implementar → Nova implementação → Aplicação Web
//   Executar como: Eu | Quem tem acesso: Qualquer pessoa
//
// MUDANÇA v4: Todas as operações (leitura E escrita) chegam via GET.
// As escritas chegam com ?action=X&payload=BASE64_JSON
// Isto elimina o problema do no-cors que impedia as escritas de chegar.
// ═══════════════════════════════════════════════════════════════════════════

function doGet(e) {
  const action = e.parameter.action
  try {
    // ── Leituras ───────────────────────────────────────────────────────────
    if (action === 'getCentros')    return ok(getSheet('Centros', centrosCols()).map(rowToObj))
    if (action === 'getCatequistas') return ok(getSheet('Catequistas', cateqCols()).map(r => ({
      ...rowToObj(r), centros_ids: (r.centros_ids || '').split(',').filter(Boolean)
    })))
    if (action === 'getFaixas')    return ok(getSheet('FaixasEtarias', faixasCols()).map(r => ({
      ...rowToObj(r), activo: r.activo === 'true' || r.activo === true, ordem: Number(r.ordem)
    })))
    if (action === 'getSeccoes')   return ok(getSheet('Seccoes', secCols()).map(r => ({
      ...rowToObj(r), centro_id: r.centro_id || null, ordem: Number(r.ordem)
    })))
    if (action === 'getPerguntas') return ok(getSheet('Perguntas', pergCols()).map(r => ({
      ...rowToObj(r), centro_id: r.centro_id || null,
      opcoes: (r.opcoes || '').split('|').filter(Boolean),
      min_chars: Number(r.min_chars) || 0,
      obrigatoria: r.obrigatoria === 'true' || r.obrigatoria === true,
      ordem: Number(r.ordem), placeholder: r.placeholder || ''
    })))
    if (action === 'getPerguntasDesactivadas') return ok(getSheet('PergDesact', desactCols()).map(rowToObj))
    if (action === 'getRespostas') return ok(getRespostas())
    if (action === 'checkDevice')  return ok({ exists: checkDevice(e.parameter.device_id) })

    // ── Escritas via GET + payload base64 ──────────────────────────────────
    const raw = e.parameter.payload
    if (!raw) return err('Payload em falta')
    const data = JSON.parse(decodeURIComponent(escape(Utilities.newBlob(Utilities.base64Decode(raw)).getDataAsString())))

    if (action === 'saveCentro')    { upsert('Centros', centrosCols(), data); return ok({ success: true }) }
    if (action === 'deleteCentro')  { deleteRow('Centros', data.id); return ok({ success: true }) }
    if (action === 'saveCatequista') {
      upsert('Catequistas', cateqCols(), { ...data, centros_ids: (data.centros_ids || []).join(',') })
      return ok({ success: true })
    }
    if (action === 'deleteCatequista') { deleteRow('Catequistas', data.id); return ok({ success: true }) }
    if (action === 'saveFaixa')     { upsert('FaixasEtarias', faixasCols(), data); return ok({ success: true }) }
    if (action === 'deleteFaixa')   { deleteRow('FaixasEtarias', data.id); return ok({ success: true }) }
    if (action === 'saveSeccao')    {
      upsert('Seccoes', secCols(), { ...data, centro_id: data.centro_id || '', subtitulo: data.subtitulo || '' })
      return ok({ success: true })
    }
    if (action === 'deleteSeccao')  { deleteRow('Seccoes', data.id); return ok({ success: true }) }
    if (action === 'savePergunta')  {
      upsert('Perguntas', pergCols(), {
        ...data, centro_id: data.centro_id || '',
        opcoes: (data.opcoes || []).join('|'), placeholder: data.placeholder || ''
      })
      return ok({ success: true })
    }
    if (action === 'deletePergunta') { deleteRow('Perguntas', data.id); return ok({ success: true }) }
    if (action === 'savePerguntasDesactivadas') {
      savePergDesact(data.centro_id, data.pergunta_ids)
      return ok({ success: true })
    }
    if (action === 'submitResposta') { saveResposta(data); return ok({ success: true }) }

    return err('Acção inválida: ' + action)
  } catch(ex) {
    return err(ex.message + ' | stack: ' + ex.stack)
  }
}

// Manter doPost por compatibilidade com versões anteriores
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents)
    // Redireciona para doGet simulando os parâmetros
    const fakeE = {
      parameter: {
        action: body.action,
        payload: Utilities.base64Encode(Utilities.newBlob(JSON.stringify(body.data)).getBytes())
      }
    }
    return doGet(fakeE)
  } catch(ex) { return err(ex.message) }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function ok(data) {
  return ContentService
    .createTextOutput(JSON.stringify({ data }))
    .setMimeType(ContentService.MimeType.JSON)
}
function err(msg) {
  return ContentService
    .createTextOutput(JSON.stringify({ error: msg }))
    .setMimeType(ContentService.MimeType.JSON)
}
function ss() { return SpreadsheetApp.getActiveSpreadsheet() }

function ensureSheet(name, cols) {
  let sh = ss().getSheetByName(name)
  if (!sh) {
    sh = ss().insertSheet(name)
    sh.appendRow(cols)
    sh.getRange(1, 1, 1, cols.length).setFontWeight('bold').setBackground('#ede9fe')
    sh.setFrozenRows(1)
  }
  return sh
}

function getSheet(name, cols) {
  const sh = ensureSheet(name, cols)
  if (sh.getLastRow() < 2) return []
  const rows = sh.getRange(2, 1, sh.getLastRow() - 1, cols.length).getValues()
  return rows
    .map(r => { const obj = {}; cols.forEach((c, i) => obj[c] = r[i]); return obj })
    .filter(r => r.id)
}

function rowToObj(r) { return r }

function upsert(shName, cols, data) {
  const sh = ensureSheet(shName, cols)
  const allIds = sh.getLastRow() > 1
    ? sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues().flat()
    : []
  const idx = allIds.findIndex(id => String(id) === String(data.id))
  const row = cols.map(c => (data[c] !== undefined && data[c] !== null) ? data[c] : '')
  if (idx >= 0) sh.getRange(idx + 2, 1, 1, cols.length).setValues([row])
  else sh.appendRow(row)
}

function deleteRow(shName, id) {
  const sh = ss().getSheetByName(shName)
  if (!sh || sh.getLastRow() < 2) return
  const ids = sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues().flat()
  const idx = ids.findIndex(r => String(r) === String(id))
  if (idx >= 0) sh.deleteRow(idx + 2)
}

function checkDevice(deviceId) {
  if (!deviceId) return false
  const sh = ss().getSheetByName('Dispositivos')
  if (!sh || sh.getLastRow() < 2) return false
  return sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues().flat()
    .some(id => String(id) === String(deviceId))
}

function saveResposta(data) {
  if (checkDevice(data.device_id)) return
  const sh = ensureSheet('Respostas', [
    'id','timestamp','centro_id','catequistas_ids','etapa','faixa_etaria_id','device_id','respostas_json'
  ])
  const cats = data.catequistas_ids
    ? (Array.isArray(data.catequistas_ids) ? data.catequistas_ids.join(',') : data.catequistas_ids)
    : (data.catequista_id || '')
  sh.appendRow([
    data.id, data.timestamp, data.centro_id, cats,
    data.etapa, data.faixa_etaria_id, data.device_id,
    JSON.stringify(data.respostas || {})
  ])
  const dsh = ensureSheet('Dispositivos', ['device_id', 'timestamp'])
  dsh.appendRow([data.device_id, data.timestamp])
}

function getRespostas() {
  const sh = ss().getSheetByName('Respostas')
  if (!sh || sh.getLastRow() < 2) return []
  const cols = ['id','timestamp','centro_id','catequistas_ids','etapa','faixa_etaria_id','device_id','respostas_json']
  const rows = sh.getRange(2, 1, sh.getLastRow() - 1, cols.length).getValues()
  return rows.map(r => {
    const obj = {}; cols.forEach((c, i) => obj[c] = r[i])
    obj['catequistas_ids'] = obj['catequistas_ids']
      ? String(obj['catequistas_ids']).split(',').filter(Boolean)
      : []
    try { obj['respostas'] = JSON.parse(obj['respostas_json'] || '{}') } catch { obj['respostas'] = {} }
    delete obj['respostas_json']
    delete obj['device_id']
    return obj
  }).filter(r => r.id)
}

function savePergDesact(centro_id, pergunta_ids) {
  const sh = ensureSheet('PergDesact', ['centro_id', 'pergunta_id'])
  // Remove todas as linhas deste centro
  if (sh.getLastRow() > 1) {
    const ids = sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues().flat()
    for (let i = ids.length - 1; i >= 0; i--) {
      if (String(ids[i]) === String(centro_id)) sh.deleteRow(i + 2)
    }
  }
  // Insere as novas
  pergunta_ids.forEach(pid => sh.appendRow([centro_id, pid]))
}

// ── Column definitions ────────────────────────────────────────────────────────
function centrosCols() { return ['id','nome','descricao','senha_coord','senha_cat','activo'] }
function cateqCols()   { return ['id','nome','centros_ids'] }
function faixasCols()  { return ['id','label','ordem','activo'] }
function secCols()     { return ['id','centro_id','titulo','subtitulo','ordem'] }
function pergCols()    { return ['id','seccao_id','centro_id','tipo','texto','opcoes','min_chars','placeholder','obrigatoria','ordem'] }
function desactCols()  { return ['centro_id','pergunta_id'] }
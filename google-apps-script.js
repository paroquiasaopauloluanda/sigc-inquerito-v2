// ═══════════════════════════════════════════════════════════════════════════
// SIGC — Inquérito Multi-Centro · Google Apps Script v2
// Cola este código em script.google.com → Extensões → Apps Script
// Depois: Implementar → Nova implementação → Aplicação Web
//   Executar como: Eu | Quem tem acesso: Qualquer pessoa
// ═══════════════════════════════════════════════════════════════════════════

function doGet(e) {
  const action = e.parameter.action
  try {
    if (action === 'getCentros')    return ok(getSheet('Centros', centrosCols()).map(rowToObj))
    if (action === 'getCatequistas') return ok(getSheet('Catequistas', cateqCols()).map(r => ({ ...rowToObj(r), centros_ids: (r.centros_ids || '').split(',').filter(Boolean) })))
    if (action === 'getFaixas')     return ok(getSheet('FaixasEtarias', faixasCols()).map(rowToObj))
    if (action === 'getSeccoes')    return ok(getSheet('Seccoes', secCols()).map(r => ({ ...rowToObj(r), centro_id: r.centro_id || null })))
    if (action === 'getPerguntas')  return ok(getSheet('Perguntas', pergCols()).map(r => ({ ...rowToObj(r), centro_id: r.centro_id || null, opcoes: (r.opcoes || '').split('|').filter(Boolean), min_chars: Number(r.min_chars) || 0, obrigatoria: r.obrigatoria === 'true' || r.obrigatoria === true, ordem: Number(r.ordem) })))
    if (action === 'getPerguntasDesactivadas') return ok(getSheet('PergDesact', desactCols()).map(rowToObj))
    if (action === 'getRespostas')  return ok(getRespostas())
    if (action === 'checkDevice')   return ok({ exists: checkDevice(e.parameter.device_id) })
    return err('Acção inválida')
  } catch(ex) { return err(ex.message) }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents)
    const { action, data } = body
    if (action === 'submitResposta')           { saveResposta(data); return ok({ success: true }) }
    if (action === 'saveCentro')               { upsert('Centros', centrosCols(), data); return ok({ success: true }) }
    if (action === 'deleteCentro')             { deleteRow('Centros', data.id); return ok({ success: true }) }
    if (action === 'saveCatequista')           { upsert('Catequistas', cateqCols(), { ...data, centros_ids: (data.centros_ids || []).join(',') }); return ok({ success: true }) }
    if (action === 'deleteCatequista')         { deleteRow('Catequistas', data.id); return ok({ success: true }) }
    if (action === 'saveFaixa')                { upsert('FaixasEtarias', faixasCols(), data); return ok({ success: true }) }
    if (action === 'deleteFaixa')              { deleteRow('FaixasEtarias', data.id); return ok({ success: true }) }
    if (action === 'saveSeccao')               { upsert('Seccoes', secCols(), { ...data, centro_id: data.centro_id || '' }); return ok({ success: true }) }
    if (action === 'deleteSeccao')             { deleteRow('Seccoes', data.id); return ok({ success: true }) }
    if (action === 'savePergunta')             { upsert('Perguntas', pergCols(), { ...data, centro_id: data.centro_id || '', opcoes: (data.opcoes || []).join('|') }); return ok({ success: true }) }
    if (action === 'deletePergunta')           { deleteRow('Perguntas', data.id); return ok({ success: true }) }
    if (action === 'savePerguntasDesactivadas') { savePergDesact(data.centro_id, data.pergunta_ids); return ok({ success: true }) }
    return err('Acção inválida')
  } catch(ex) { return err(ex.message) }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function ok(data) { return ContentService.createTextOutput(JSON.stringify({ data })).setMimeType(ContentService.MimeType.JSON) }
function err(msg) { return ContentService.createTextOutput(JSON.stringify({ error: msg })).setMimeType(ContentService.MimeType.JSON) }

function ss() { return SpreadsheetApp.getActiveSpreadsheet() }

function ensureSheet(name, cols) {
  let sh = ss().getSheetByName(name)
  if (!sh) { sh = ss().insertSheet(name); sh.appendRow(cols); sh.getRange(1,1,1,cols.length).setFontWeight('bold').setBackground('#ede9fe'); sh.setFrozenRows(1) }
  return sh
}

function getSheet(name, cols) {
  const sh = ensureSheet(name, cols)
  if (sh.getLastRow() < 2) return []
  const rows = sh.getRange(2, 1, sh.getLastRow()-1, cols.length).getValues()
  return rows.map(r => { const obj = {}; cols.forEach((c,i) => obj[c] = r[i]); return obj }).filter(r => r.id)
}

function rowToObj(r) { return r }

function upsert(shName, cols, data) {
  const sh = ensureSheet(shName, cols)
  const ids = sh.getLastRow() > 1 ? sh.getRange(2,1,sh.getLastRow()-1,1).getValues().flat() : []
  const idx = ids.indexOf(data.id)
  const row = cols.map(c => data[c] !== undefined ? data[c] : '')
  if (idx >= 0) sh.getRange(idx+2, 1, 1, cols.length).setValues([row])
  else sh.appendRow(row)
}

function deleteRow(shName, id) {
  const sh = ss().getSheetByName(shName)
  if (!sh || sh.getLastRow() < 2) return
  const ids = sh.getRange(2,1,sh.getLastRow()-1,1).getValues().flat()
  const idx = ids.indexOf(id)
  if (idx >= 0) sh.deleteRow(idx+2)
}

function checkDevice(deviceId) {
  if (!deviceId) return false
  const sh = ss().getSheetByName('Dispositivos')
  if (!sh || sh.getLastRow() < 2) return false
  return sh.getRange(2,1,sh.getLastRow()-1,1).getValues().flat().includes(deviceId)
}

function saveResposta(data) {
  if (checkDevice(data.device_id)) return
  // Guardar resposta
  const sh = ensureSheet('Respostas', ['id','timestamp','centro_id','catequista_id','etapa','faixa_etaria_id','device_id','respostas_json'])
  sh.appendRow([data.id, data.timestamp, data.centro_id, data.catequista_id, data.etapa, data.faixa_etaria_id, data.device_id, JSON.stringify(data.respostas || {})])
  // Registar device
  const dsh = ensureSheet('Dispositivos', ['device_id','timestamp'])
  dsh.appendRow([data.device_id, data.timestamp])
}

function getRespostas() {
  const sh = ss().getSheetByName('Respostas')
  if (!sh || sh.getLastRow() < 2) return []
  const cols = ['id','timestamp','centro_id','catequista_id','etapa','faixa_etaria_id','device_id','respostas_json']
  const rows = sh.getRange(2,1,sh.getLastRow()-1,cols.length).getValues()
  return rows.map(r => {
    const obj = {}; cols.forEach((c,i) => obj[c] = r[i])
    try { obj['respostas'] = JSON.parse(obj['respostas_json'] || '{}') } catch { obj['respostas'] = {} }
    delete obj['respostas_json']
    delete obj['device_id']
    return obj
  }).filter(r => r.id)
}

function savePergDesact(centro_id, pergunta_ids) {
  const sh = ensureSheet('PergDesact', ['centro_id','pergunta_id'])
  // Remove existentes do centro
  if (sh.getLastRow() > 1) {
    const data = sh.getRange(2,1,sh.getLastRow()-1,1).getValues().flat()
    for (let i = data.length-1; i >= 0; i--) {
      if (data[i] === centro_id) sh.deleteRow(i+2)
    }
  }
  // Adicionar novas
  pergunta_ids.forEach(pid => sh.appendRow([centro_id, pid]))
}

// ── Column definitions ────────────────────────────────────────────────────────
function centrosCols() { return ['id','nome','descricao','senha_coord','senha_cat','activo'] }
function cateqCols()   { return ['id','nome','centros_ids'] }
function faixasCols()  { return ['id','label','ordem','activo'] }
function secCols()     { return ['id','centro_id','titulo','ordem'] }
function pergCols()    { return ['id','seccao_id','centro_id','tipo','texto','opcoes','min_chars','obrigatoria','ordem'] }
function desactCols()  { return ['centro_id','pergunta_id'] }

{\rtf1\ansi\ansicpg1252\cocoartf2867
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 // app.js - Frontend logic for FoodLog PWA\
\
const DEFAULT_RDIs = \{\
  "Vitamin A (\'b5g)": 800,\
  "Vitamin C (mg)": 80,\
  "Vitamin D (\'b5g)": 5,\
  "Vitamin E (mg)": 12,\
  "Vitamin K (\'b5g)": 75,\
  "Thiamine B1 (mg)": 1.1,\
  "Riboflavin B2 (mg)": 1.4,\
  "Niacin B3 (mg)": 16,\
  "Pantothenic acid B5 (mg)": 6,\
  "Vitamin B6 (mg)": 1.4,\
  "Folate (\'b5g)": 200,\
  "Vitamin B12 (\'b5g)": 2.5,\
  "Biotin (\'b5g)": 50,\
  "Calcium (mg)": 1000,\
  "Magnesium (mg)": 300,\
  "Phosphorus (mg)": 700,\
  "Iron (mg)": 14,\
  "Zinc (mg)": 10,\
  "Copper (mg)": 1,\
  "Manganese (mg)": 2,\
  "Selenium (\'b5g)": 55,\
  "Chromium (\'b5g)": 40,\
  "Molybdenum (\'b5g)": 50,\
  "Iodine (\'b5g)": 150,\
  "Lutein (\'b5g)": 1000\
\};\
\
const STORAGE_KEY = 'foodlog_unified_v1';\
\
function uid() \{ return Math.random().toString(36).slice(2, 9); \}\
\
function loadState() \{\
  try \{\
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || \{ logs: [], favorites: [], rdi: DEFAULT_RDIs, settings: \{\} \};\
  \} catch (e) \{\
    return \{ logs: [], favorites: [], rdi: DEFAULT_RDIs, settings: \{\} \};\
  \}\
\}\
\
function saveState(state) \{\
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));\
\}\
\
let state = loadState();\
\
// Tab switching\
document.querySelectorAll('.tab-btn').forEach(btn => \{\
  btn.addEventListener('click', () => \{\
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));\
    btn.classList.add('active');\
    const tab = btn.dataset.tab;\
    document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));\
    document.getElementById('tab-' + tab).classList.add('active');\
    \
    if (tab === 'dashboard') renderDashboard();\
    if (tab === 'history') renderHistory();\
  \});\
\});\
\
// Toast notification\
function showToast(msg, ms = 2200) \{\
  const t = document.getElementById('toast');\
  t.textContent = msg;\
  t.classList.remove('hidden');\
  setTimeout(() => t.classList.add('hidden'), ms);\
\}\
\
// Dark mode toggle\
document.getElementById('darkToggle').addEventListener('click', () => \{\
  document.body.classList.toggle('dark');\
  localStorage.setItem('darkMode', document.body.classList.contains('dark'));\
\});\
if (localStorage.getItem('darkMode') === 'true') \{\
  document.body.classList.add('dark');\
\}\
\
// Export/Import\
document.getElementById('exportBtn').addEventListener('click', () => \{\
  const blob = new Blob([JSON.stringify(state, null, 2)], \{ type: 'application/json' \});\
  const url = URL.createObjectURL(blob);\
  const a = document.createElement('a');\
  a.href = url;\
  a.download = `foodlog-export-$\{new Date().toISOString().slice(0, 10)\}.json`;\
  a.click();\
  showToast('Exported!');\
\});\
\
document.getElementById('importBtn').addEventListener('click', () => \{\
  const input = document.createElement('input');\
  input.type = 'file';\
  input.accept = '.json';\
  input.onchange = e => \{\
    const file = e.target.files[0];\
    if (!file) return;\
    const reader = new FileReader();\
    reader.onload = evt => \{\
      try \{\
        const imported = JSON.parse(evt.target.result);\
        state = imported;\
        saveState(state);\
        renderLogs();\
        showToast('Imported!');\
      \} catch (err) \{\
        alert('Import failed: ' + err.message);\
      \}\
    \};\
    reader.readAsText(file);\
  \};\
  input.click();\
\});\
\
// Render today's logs\
function renderLogs() \{\
  const list = document.getElementById('logList');\
  list.innerHTML = '';\
  const logs = state.logs.filter(l => (new Date(l.date)).toDateString() === (new Date()).toDateString());\
  \
  if (logs.length === 0) \{\
    list.innerHTML = '<div class="small">No logs for today</div>';\
    return;\
  \}\
  \
  logs.forEach(entry => \{\
    const el = document.createElement('div');\
    el.className = 'log-entry';\
    el.innerHTML = `\
      <div>\
        <div class="font-semibold">$\{escapeHtml(entry.name)\}</div>\
        <div class="small">$\{entry.qty\} $\{entry.unit\}</div>\
      </div>\
      <div class="flex gap-2">\
        <button class="fav-btn" data-id="$\{entry.id\}">$\{entry.fav ? '\uc0\u11088 ' : '\u9734 '\}</button>\
        <button class="btn-secondary" onclick="editLog('$\{entry.id\}')">Edit</button>\
        <button class="btn-secondary" onclick="deleteLog('$\{entry.id\}')">Delete</button>\
      </div>\
    `;\
    list.appendChild(el);\
  \});\
  \
  // Favorite toggle\
  document.querySelectorAll('.fav-btn').forEach(btn => \{\
    btn.addEventListener('click', () => \{\
      const id = btn.dataset.id;\
      const entry = state.logs.find(l => l.id === id);\
      if (entry) \{\
        entry.fav = !entry.fav;\
        if (entry.fav) \{\
          state.favorites = state.favorites.filter(f => f !== entry.name);\
          state.favorites.push(entry.name);\
        \} else \{\
          state.favorites = state.favorites.filter(f => f !== entry.name);\
        \}\
        saveState(state);\
        renderLogs();\
        showToast(entry.fav ? 'Added to favorites' : 'Removed from favorites');\
      \}\
    \});\
  \});\
\}\
\
window.editLog = function(id) \{\
  const entry = state.logs.find(l => l.id === id);\
  if (!entry) return alert('Not found');\
  openAddModal(entry, true);\
\};\
\
window.deleteLog = function(id) \{\
  if (!confirm('Delete this log?')) return;\
  state.logs = state.logs.filter(l => l.id !== id);\
  saveState(state);\
  renderLogs();\
  showToast('Deleted');\
\};\
\
// Manual add modal\
document.getElementById('manualAddBtn').addEventListener('click', () => openAddModal());\
\
function openAddModal(prefill = \{\}, editing = false) \{\
  const data = prefill.id ? prefill : \{ name: '', qty: 100, unit: 'g', micros: \{\} \};\
  \
  const html = `\
    <h3 class="text-lg font-semibold mb-3">$\{editing ? 'Edit Food' : 'Add Food'\}</h3>\
    <div class="space-y-3">\
      <div>\
        <label class="small">Name</label>\
        <input id="m_name" class="input" value="$\{escapeHtml(data.name || '')\}">\
      </div>\
      <div class="flex gap-2">\
        <div class="flex-1">\
          <label class="small">Quantity</label>\
          <input id="m_qty" type="number" class="input" value="$\{data.qty || 100\}" min="1">\
        </div>\
        <div style="width:140px">\
          <label class="small">Unit</label>\
          <select id="m_unit" class="input">\
            <option value="g" $\{data.unit === 'g' ? 'selected' : ''\}>g</option>\
            <option value="ml" $\{data.unit === 'ml' ? 'selected' : ''\}>ml</option>\
            <option value="portion" $\{data.unit === 'portion' ? 'selected' : ''\}>portion</option>\
            <option value="oz" $\{data.unit === 'oz' ? 'selected' : ''\}>oz</option>\
          </select>\
        </div>\
      </div>\
      <div class="small">Optional nutrition (kcal, protein, carbs, fat in grams):</div>\
      <div class="grid grid-cols-2 gap-2">\
        <input id="m_cal" class="input" placeholder="kcal" value="$\{data.micros?.calories || ''\}">\
        <input id="m_pro" class="input" placeholder="protein (g)" value="$\{data.micros?.protein || ''\}">\
        <input id="m_carb" class="input" placeholder="carbs (g)" value="$\{data.micros?.carbs || ''\}">\
        <input id="m_fat" class="input" placeholder="fat (g)" value="$\{data.micros?.fat || ''\}">\
      </div>\
      <div class="flex gap-2 justify-end">\
        <button id="m_cancel" class="btn-secondary">Cancel</button>\
        <button id="m_save" class="btn">Save</button>\
      </div>\
    </div>\
  `;\
  \
  openModal(html);\
  \
  document.getElementById('m_cancel').addEventListener('click', closeModal);\
  document.getElementById('m_save').addEventListener('click', () => \{\
    const name = document.getElementById('m_name').value.trim();\
    const qty = parseFloat(document.getElementById('m_qty').value) || 0;\
    const unit = document.getElementById('m_unit').value;\
    const micros = \{\
      calories: parseFloat(document.getElementById('m_cal').value) || undefined,\
      protein: parseFloat(document.getElementById('m_pro').value) || undefined,\
      carbs: parseFloat(document.getElementById('m_carb').value) || undefined,\
      fat: parseFloat(document.getElementById('m_fat').value) || undefined\
    \};\
    \
    if (!name) return alert('Please enter food name');\
    \
    if (editing && data.id) \{\
      const entry = state.logs.find(l => l.id === data.id);\
      if (entry) \{\
        entry.name = name;\
        entry.qty = qty;\
        entry.unit = unit;\
        entry.micros = micros;\
      \}\
      showToast('Updated');\
    \} else \{\
      const entry = \{\
        id: uid(),\
        name,\
        qty,\
        unit,\
        micros,\
        date: new Date().toISOString(),\
        fav: false\
      \};\
      state.logs.push(entry);\
      showToast('Logged');\
    \}\
    \
    saveState(state);\
    renderLogs();\
    closeModal();\
  \});\
\}\
\
// Favorites modal\
document.getElementById('favoritesBtn').addEventListener('click', () => \{\
  const favs = state.favorites || [];\
  const html = `\
    <h3 class="text-lg font-semibold mb-3">Favorites</h3>\
    <div class="space-y-2">\
      $\{favs.length ? favs.map((f, i) => `\
        <div class="flex justify-between items-center p-2 bg-gray-100 rounded">\
          <div>$\{escapeHtml(f)\}</div>\
          <button class="btn fav-add" data-index="$\{i\}">Add</button>\
        </div>\
      `).join('') : '<div class="small">No favorites yet</div>'\}\
    </div>\
    <div class="flex justify-end mt-3">\
      <button id="favClose" class="btn-secondary">Close</button>\
    </div>\
  `;\
  \
  openModal(html);\
  \
  document.getElementById('favClose').addEventListener('click', closeModal);\
  document.querySelectorAll('.fav-add').forEach(btn => \{\
    btn.addEventListener('click', () => \{\
      const name = favs[btn.dataset.index];\
      const entry = \{\
        id: uid(),\
        name,\
        qty: 100,\
        unit: 'g',\
        micros: \{\},\
        date: new Date().toISOString(),\
        fav: true\
      \};\
      state.logs.push(entry);\
      saveState(state);\
      renderLogs();\
      showToast('Added from favorites');\
      closeModal();\
    \});\
  \});\
\});\
\
// Modal helpers\
const modalBg = document.getElementById('modalRoot');\
const modalContent = document.getElementById('modalContent');\
\
function openModal(html) \{\
  modalContent.innerHTML = html;\
  modalBg.classList.add('active');\
\}\
\
function closeModal() \{\
  modalBg.classList.remove('active');\
  modalContent.innerHTML = '';\
\}\
\
modalBg.addEventListener('click', e => \{\
  if (e.target === modalBg) closeModal();\
\});\
\
// Dashboard\
function renderDashboard() \{\
  const summary = document.getElementById('dashboardSummary');\
  const today = state.logs.filter(l => (new Date(l.date)).toDateString() === (new Date()).toDateString());\
  const totals = \{ calories: 0, protein: 0, carbs: 0, fat: 0 \};\
  const microsTotals = \{\};\
  \
  today.forEach(e => \{\
    const m = e.micros || \{\};\
    totals.calories += (m.calories || 0);\
    totals.protein += (m.protein || 0);\
    totals.carbs += (m.carbs || 0);\
    totals.fat += (m.fat || 0);\
    \
    Object.keys(m).forEach(k => \{\
      if (['calories', 'protein', 'carbs', 'fat'].includes(k)) return;\
      microsTotals[k] = (microsTotals[k] || 0) + (m[k] || 0);\
    \});\
  \});\
  \
  summary.innerHTML = `\
    <div class="flex gap-4 justify-between">\
      <div>\
        <div class="small">Today</div>\
        <div class="text-2xl font-bold">$\{today.length\} items</div>\
      </div>\
      <div class="text-right">\
        <div class="small">kcal</div>\
        <div class="text-2xl font-bold">$\{Math.round(totals.calories)\}</div>\
      </div>\
    </div>\
  `;\
  \
  const g = document.getElementById('microGrid');\
  g.innerHTML = '';\
  const rdi = state.rdi || DEFAULT_RDIs;\
  \
  Object.keys(rdi).forEach(k => \{\
    const val = microsTotals[k] || 0;\
    const pct = rdi[k] ? Math.round((val / rdi[k]) * 100) : 0;\
    const item = document.createElement('div');\
    item.className = 'p-2 bg-gray-100 rounded';\
    item.innerHTML = `<strong>$\{k\}</strong><div class="small">$\{val\} \'95 $\{pct\}% of RDI</div>`;\
    g.appendChild(item);\
  \});\
\}\
\
// History\
function renderHistory(dateStr) \{\
  const d = dateStr ? new Date(dateStr) : new Date(document.getElementById('historyDate').value || new Date().toISOString().slice(0, 10));\
  const day = d.toDateString();\
  const content = document.getElementById('historyContent');\
  const logs = state.logs.filter(l => (new Date(l.date)).toDateString() === day);\
  \
  let html = `<h3 class="small mb-2">$\{day\}</h3>`;\
  \
  if (!logs.length) \{\
    html += '<div class="small">No logs</div>';\
  \} else \{\
    logs.forEach(l => \{\
      html += `\
        <div class="flex justify-between p-2 bg-gray-100 rounded mb-2">\
          <div>\
            <strong>$\{escapeHtml(l.name)\}</strong>\
            <div class="small">$\{l.qty\} $\{l.unit\}</div>\
          </div>\
          <div>$\{l.fav ? '\uc0\u11088 ' : ''\}</div>\
        </div>\
      `;\
    \});\
    \
    const totals = \{ calories: 0, protein: 0, carbs: 0, fat: 0 \};\
    logs.forEach(l => \{\
      const m = l.micros || \{\};\
      totals.calories += (m.calories || 0);\
      totals.protein += (m.protein || 0);\
      totals.carbs += (m.carbs || 0);\
      totals.fat += (m.fat || 0);\
    \});\
    \
    html += `<div class="card mt-3"><strong>Summary</strong><div class="small">kcal: $\{Math.round(totals.calories)\} \'95 protein: $\{Math.round(totals.protein)\}g</div></div>`;\
  \}\
  \
  content.innerHTML = html;\
\}\
\
document.getElementById('historyToday').addEventListener('click', () => \{\
  const today = new Date().toISOString().slice(0, 10);\
  document.getElementById('historyDate').value = today;\
  renderHistory(today);\
\});\
\
document.getElementById('historyPrev').addEventListener('click', () => \{\
  const inp = document.getElementById('historyDate');\
  const d = new Date(inp.value || new Date().toISOString().slice(0, 10));\
  d.setDate(d.getDate() - 1);\
  inp.value = d.toISOString().slice(0, 10);\
  renderHistory(inp.value);\
\});\
\
document.getElementById('historyNext').addEventListener('click', () => \{\
  const inp = document.getElementById('historyDate');\
  const d = new Date(inp.value || new Date().toISOString().slice(0, 10));\
  d.setDate(d.getDate() + 1);\
  inp.value = d.toISOString().slice(0, 10);\
  renderHistory(inp.value);\
\});\
\
document.getElementById('historyDate').addEventListener('change', () => \{\
  renderHistory(document.getElementById('historyDate').value);\
\});\
\
// Settings\
document.getElementById('resetRdiBtn').addEventListener('click', () => \{\
  state.rdi = DEFAULT_RDIs;\
  saveState(state);\
  showToast('RDIs reset');\
\});\
\
// API Integration - Quick Log\
document.getElementById('quick-go').addEventListener('click', async () => \{\
  const q = document.getElementById('quick-input').value.trim();\
  if (!q) return alert('Enter text');\
  \
  const result = document.getElementById('quick-result');\
  result.classList.remove('hidden');\
  result.textContent = 'Loading...';\
  \
  try \{\
    const res = await fetch('/api/edamam/food-parser', \{\
      method: 'POST',\
      headers: \{ 'Content-Type': 'application/json' \},\
      body: JSON.stringify(\{ text: q \})\
    \});\
    const json = await res.json();\
    result.textContent = JSON.stringify(json, null, 2);\
  \} catch (err) \{\
    result.textContent = 'Error: ' + err.message;\
  \}\
\});\
\
// Packaged Foods\
document.getElementById('pack-search').addEventListener('click', async () => \{\
  const q = document.getElementById('pack-query').value.trim();\
  if (!q) return alert('Enter query');\
  \
  const result = document.getElementById('pack-result');\
  result.classList.remove('hidden');\
  result.textContent = 'Loading...';\
  \
  try \{\
    const res = await fetch('/api/fatsecret/search', \{\
      method: 'POST',\
      headers: \{ 'Content-Type': 'application/json' \},\
      body: JSON.stringify(\{ query: q \})\
    \});\
    const json = await res.json();\
    result.textContent = JSON.stringify(json, null, 2);\
  \} catch (err) \{\
    result.textContent = 'Error: ' + err.message;\
  \}\
\});\
\
// Home-Cooked\
document.getElementById('home-analyze').addEventListener('click', async () => \{\
  const q = document.getElementById('home-input').value.trim();\
  if (!q) return alert('Enter ingredients');\
  \
  const result = document.getElementById('home-result');\
  result.classList.remove('hidden');\
  result.textContent = 'Loading...';\
  \
  try \{\
    const res = await fetch('/api/edamam/nutrition', \{\
      method: 'POST',\
      headers: \{ 'Content-Type': 'application/json' \},\
      body: JSON.stringify(\{ ingredients: [q] \})\
    \});\
    const json = await res.json();\
    result.textContent = JSON.stringify(json, null, 2);\
  \} catch (err) \{\
    result.textContent = 'Error: ' + err.message;\
  \}\
\});\
\
// Recipes\
document.getElementById('recipe-search').addEventListener('click', async () => \{\
  const q = document.getElementById('recipe-ingredients').value.trim();\
  if (!q) return alert('Enter ingredients');\
  \
  const result = document.getElementById('recipe-result');\
  result.classList.remove('hidden');\
  result.textContent = 'Loading...';\
  \
  try \{\
    const res = await fetch('/api/spoonacular/search-recipes', \{\
      method: 'POST',\
      headers: \{ 'Content-Type': 'application/json' \},\
      body: JSON.stringify(\{ ingredients: q \})\
    \});\
    const json = await res.json();\
    result.textContent = JSON.stringify(json, null, 2);\
  \} catch (err) \{\
    result.textContent = 'Error: ' + err.message;\
  \}\
\});\
\
// Vision Scan\
document.getElementById('vision-scan').addEventListener('click', async () => \{\
  const f = document.getElementById('vision-file').files[0];\
  if (!f) return alert('Choose image');\
  \
  const result = document.getElementById('vision-result');\
  result.classList.remove('hidden');\
  result.textContent = 'Loading...';\
  \
  try \{\
    const fd = new FormData();\
    fd.append('image', f);\
    const res = await fetch('/api/vision/scan', \{\
      method: 'POST',\
      body: fd\
    \});\
    const json = await res.json();\
    result.textContent = JSON.stringify(json, null, 2);\
  \} catch (err) \{\
    result.textContent = 'Error: ' + err.message;\
  \}\
\});\
\
// Utils\
function escapeHtml(s) \{\
  return String(s).replace(/[&<>"']/g, ch => (\{ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' \}[ch]));\
\}\
\
// Initial render\
document.getElementById('historyDate').value = new Date().toISOString().slice(0, 10);\
renderLogs();\
renderDashboard();}

const COLUMNS = ['key', 'id', 'type', 'title', 'year', 'runtime', 'genres', 'rating', 'status', 'addedAt', 'poster', 'overview']

const esc = (v) => {
  const s = v == null ? '' : String(v)
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function itemsToCsv(items) {
  const rows = items.map((it) =>
    COLUMNS.map((c) => esc(c === 'genres' ? it.genres.join('|') : it[c])).join(',')
  )
  return [COLUMNS.join(','), ...rows].join('\r\n')
}

function parseRows(text) {
  const rows = []
  let row = []
  let cell = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++ }
      else if (ch === '"') quoted = false
      else cell += ch
    } else if (ch === '"') quoted = true
    else if (ch === ',') { row.push(cell); cell = '' }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++
      row.push(cell); cell = ''
      rows.push(row); row = []
    } else cell += ch
  }
  if (cell || row.length) { row.push(cell); rows.push(row) }
  return rows.filter((r) => r.some((c) => c !== ''))
}

const num = (v) => (v === '' || v == null || isNaN(Number(v)) ? null : Number(v))

export function csvToItems(text) {
  const rows = parseRows(text.replace(/^\uFEFF/, ''))
  if (rows.length < 2) throw new Error('The file has no rows.')
  const header = rows[0].map((h) => h.trim())
  for (const needed of ['id', 'type', 'title', 'status']) {
    if (!header.includes(needed)) throw new Error(`Missing "${needed}" column. Is this a Watchlist export?`)
  }
  const items = []
  for (const r of rows.slice(1)) {
    const o = Object.fromEntries(header.map((h, i) => [h, r[i] ?? '']))
    if (!['movie', 'tv'].includes(o.type) || !['want', 'watched'].includes(o.status) || num(o.id) == null) continue
    items.push({
      key: `${o.type}-${o.id}`,
      id: num(o.id),
      type: o.type,
      title: o.title,
      year: num(o.year),
      runtime: num(o.runtime),
      genres: o.genres ? o.genres.split('|').filter(Boolean) : [],
      rating: num(o.rating),
      status: o.status,
      addedAt: o.addedAt || new Date().toISOString(),
      poster: o.poster || null,
      overview: o.overview || '',
    })
  }
  return items
}

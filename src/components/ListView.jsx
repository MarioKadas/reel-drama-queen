import { useMemo, useState } from 'react'
import { Poster } from './Search.jsx'
import { fmtRuntime } from './Detail.jsx'

const RUNTIMES = {
  any: ['Any runtime', () => true],
  short: ['Under 90 min', (r) => r != null && r < 90],
  mid: ['90 to 120 min', (r) => r != null && r >= 90 && r <= 120],
  long: ['Over 120 min', (r) => r != null && r > 120],
}

const SORTS = {
  added: 'Date added',
  year: 'Year',
  runtime: 'Runtime',
  title: 'Title',
}

export default function ListView({ status, items, onSave, onRemove }) {
  const [genre, setGenre] = useState('')
  const [type, setType] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [runtime, setRuntime] = useState('any')
  const [sort, setSort] = useState('added')
  const [dir, setDir] = useState('desc')

  const list = useMemo(() => items.filter((i) => i.status === status), [items, status])
  const genres = useMemo(() => [...new Set(list.flatMap((i) => i.genres))].sort(), [list])

  const shown = useMemo(() => {
    const out = list.filter(
      (i) =>
        (!genre || i.genres.includes(genre)) &&
        (!type || i.type === type) &&
        (!from || (i.year != null && i.year >= Number(from))) &&
        (!to || (i.year != null && i.year <= Number(to))) &&
        RUNTIMES[runtime][1](i.runtime)
    )
    const mul = dir === 'asc' ? 1 : -1
    return out.sort((a, b) => {
      if (sort === 'title') return mul * a.title.localeCompare(b.title)
      if (sort === 'added') return mul * a.addedAt.localeCompare(b.addedAt)
      const x = a[sort], y = b[sort]
      if (x == null && y == null) return 0
      if (x == null) return 1 // unknown values always last
      if (y == null) return -1
      return mul * (x - y)
    })
  }, [list, genre, type, from, to, runtime, sort, dir])

  const filtered = genre || type || from || to || runtime !== 'any'
  const reset = () => { setGenre(''); setType(''); setFrom(''); setTo(''); setRuntime('any') }
  const other = status === 'want' ? 'watched' : 'want'

  return (
    <section>
      <h1>{status === 'want' ? 'Want to watch' : 'Watched'}</h1>

      {list.length === 0 ? (
        <p className="muted">
          Nothing here yet. <a href="#/search">Search for a title</a> to add one.
        </p>
      ) : (
        <>
          <div className="filters">
            <label>Genre
              <select value={genre} onChange={(e) => setGenre(e.target.value)}>
                <option value="">All genres</option>
                {genres.map((g) => <option key={g}>{g}</option>)}
              </select>
            </label>
            <label>Type
              <select value={type} onChange={(e) => setType(e.target.value)}>
                <option value="">Movies and TV</option>
                <option value="movie">Movies</option>
                <option value="tv">TV shows</option>
              </select>
            </label>
            <label>Year from
              <input type="number" min="1870" max="2100" value={from} onChange={(e) => setFrom(e.target.value)} placeholder="Any" />
            </label>
            <label>Year to
              <input type="number" min="1870" max="2100" value={to} onChange={(e) => setTo(e.target.value)} placeholder="Any" />
            </label>
            <label>Runtime
              <select value={runtime} onChange={(e) => setRuntime(e.target.value)}>
                {Object.entries(RUNTIMES).map(([k, [label]]) => <option key={k} value={k}>{label}</option>)}
              </select>
            </label>
            <label>Sort by
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                {Object.entries(SORTS).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
              </select>
            </label>
            <button className="ghost" onClick={() => setDir(dir === 'asc' ? 'desc' : 'asc')} aria-label="Toggle sort direction">
              {dir === 'asc' ? 'Ascending ↑' : 'Descending ↓'}
            </button>
            {filtered && <button className="ghost" onClick={reset}>Clear filters</button>}
          </div>

          <p className="muted">Showing {shown.length} of {list.length}</p>
          {shown.length === 0 && <p className="muted">No titles match these filters.</p>}

          <ul className="rows">
            {shown.map((i) => (
              <li key={i.key} className="row">
                <a href={`#/title/${i.type}/${i.id}`}><Poster path={i.poster} title={i.title} size="w154" /></a>
                <div className="row-main">
                  <h3><a href={`#/title/${i.type}/${i.id}`}>{i.title}</a></h3>
                  <p className="meta">
                    {i.type === 'tv' ? 'TV' : 'Movie'}
                    {i.year ? `, ${i.year}` : ''}, {fmtRuntime(i.runtime)}
                    {i.rating ? `, ★ ${i.rating}` : ''}
                  </p>
                  <ul className="chips">{i.genres.map((g) => <li key={g}>{g}</li>)}</ul>
                  <p className="meta small">Added {new Date(i.addedAt).toLocaleDateString()}</p>
                </div>
                <div className="row-actions">
                  <button className="secondary" onClick={() => onSave(i, other)}>
                    {status === 'want' ? 'Mark as Watched' : 'Move to Want to watch'}
                  </button>
                  <button className="danger" onClick={() => onRemove(i.key)}>Remove</button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}

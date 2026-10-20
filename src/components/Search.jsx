import { useState } from 'react'
import { posterUrl } from '../api.js'

export default function Search({ state, onSearch, items }) {
  const [text, setText] = useState(state.query)
  const submit = (e) => {
    e.preventDefault()
    if (text.trim()) onSearch(text.trim())
  }
  const statusOf = (key) => items.find((i) => i.key === key)?.status

  return (
    <section>
      <h1>Find something to watch</h1>
      <form className="searchbar" onSubmit={submit}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Search movies and TV shows by title"
          aria-label="Title"
          autoFocus
        />
        <button className="primary" disabled={state.loading}>Search</button>
      </form>

      {state.loading && <p className="muted">Searching…</p>}
      {state.error && <p className="error">{state.error}</p>}
      {state.results && state.results.length === 0 && (
        <p className="muted">No movies or shows matched “{state.query}”. Try a different spelling.</p>
      )}
      {!state.results && !state.loading && !state.error && (
        <p className="muted">Type a title above, then open a result to add it to a list.</p>
      )}

      <ul className="grid">
        {state.results?.map((r) => (
          <li key={r.key}>
            <a className="card" href={`#/title/${r.type}/${r.id}`}>
              <Poster path={r.poster} title={r.title} />
              <div className="card-body">
                <h3>{r.title}</h3>
                <p className="meta">
                  {r.type === 'tv' ? 'TV' : 'Movie'}
                  {r.year ? `, ${r.year}` : ''}
                  {r.rating ? `, ★ ${r.rating}` : ''}
                </p>
                {statusOf(r.key) && (
                  <span className="badge">{statusOf(r.key) === 'want' ? 'Want to watch' : 'Watched'}</span>
                )}
              </div>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function Poster({ path, title, size }) {
  const src = posterUrl(path, size)
  return src ? (
    <img className="poster" src={src} alt={`Poster for ${title}`} loading="lazy" />
  ) : (
    <div className="poster noposter">{title}</div>
  )
}

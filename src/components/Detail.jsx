import { useEffect, useState } from 'react'
import { getDetails } from '../api.js'
import { Poster } from './Search.jsx'

export const fmtRuntime = (m) => (m ? (m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`) : 'Runtime unknown')

export default function Detail({ type, id, items, onSave, onRemove }) {
  const [d, setD] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    if (type !== 'movie' && type !== 'tv') {
      setError('That title could not be found.')
      return
    }
    getDetails(type, id)
      .then((x) => !cancelled && setD(x))
      .catch((e) => !cancelled && setError(e.message))
    return () => { cancelled = true }
  }, [type, id])

  const back = (
    <button className="ghost" onClick={() => (window.history.length > 1 ? window.history.back() : (window.location.hash = '#/search'))}>
      Back
    </button>
  )

  if (error) return <section>{back}<p className="error">{error}</p></section>
  if (!d) return <section>{back}<p className="muted">Loading…</p></section>

  const current = items.find((i) => i.key === d.key)?.status

  return (
    <section className="detail">
      {back}
      <div className="detail-grid">
        <Poster path={d.poster} title={d.title} size="w500" />
        <div>
          <h1>{d.title}</h1>
          {d.tagline && <p className="tagline">{d.tagline}</p>}
          <p className="meta big">
            {d.type === 'tv' ? 'TV show' : 'Movie'}
            {d.year ? `, ${d.year}` : ''}, {fmtRuntime(d.runtime)}
            {d.type === 'tv' && d.runtime ? ' per episode' : ''}
            {d.seasons ? `, ${d.seasons} season${d.seasons > 1 ? 's' : ''}` : ''}
          </p>
          <p className="rating">★ {d.rating ?? 'Not rated'}{d.rating ? <small> / 10 on TMDb</small> : null}</p>
          <ul className="chips">
            {d.genres.map((g) => <li key={g}>{g}</li>)}
          </ul>
          <p className="overview">{d.overview || 'No synopsis available.'}</p>

          <div className="actions">
            <button className={current === 'want' ? 'primary on' : 'primary'} onClick={() => onSave(d, 'want')} disabled={current === 'want'}>
              {current === 'want' ? 'On your Want to watch list' : 'Add to Want to watch'}
            </button>
            <button className={current === 'watched' ? 'primary on' : 'secondary'} onClick={() => onSave(d, 'watched')} disabled={current === 'watched'}>
              {current === 'watched' ? 'On your Watched list' : 'Mark as Watched'}
            </button>
            {current && <button className="danger" onClick={() => onRemove(d.key)}>Remove from lists</button>}
          </div>
        </div>
      </div>
    </section>
  )
}

import { useEffect, useState } from 'react'
import { useWatchlist } from './useWatchlist.js'
import { searchTitles } from './api.js'
import { itemsToCsv, csvToItems } from './csv.js'
import Search from './components/Search.jsx'
import Detail from './components/Detail.jsx'
import ListView from './components/ListView.jsx'

function useHash() {
  const [hash, setHash] = useState(window.location.hash || '#/search')
  useEffect(() => {
    const on = () => setHash(window.location.hash || '#/search')
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return hash
}

export default function App() {
  const hash = useHash()
  const { items, save, remove, merge } = useWatchlist()
  const [search, setSearch] = useState({ query: '', results: null, loading: false, error: '' })
  const [notice, setNotice] = useState('')

  const parts = hash.replace(/^#\//, '').split('/')
  const page = parts[0] || 'search'

  const runSearch = async (query) => {
    setSearch({ query, results: null, loading: true, error: '' })
    try {
      const results = await searchTitles(query)
      setSearch({ query, results, loading: false, error: '' })
    } catch (e) {
      setSearch({ query, results: null, loading: false, error: e.message })
    }
  }

  const exportCsv = () => {
    const blob = new Blob(['\uFEFF' + itemsToCsv(items)], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `watchlist-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const importCsv = async (e) => {
    const file = e.target.files[0]
    e.target.value = ''
    if (!file) return
    try {
      const incoming = csvToItems(await file.text())
      merge(incoming)
      setNotice(`Imported ${incoming.length} title${incoming.length === 1 ? '' : 's'}.`)
    } catch (err) {
      setNotice(`Import failed: ${err.message}`)
    }
    setTimeout(() => setNotice(''), 5000)
  }

  const count = (s) => items.filter((i) => i.status === s).length
  const nav = (id, label, n) => (
    <a href={`#/${id}`} className={page === id ? 'active' : ''}>
      {label}
      {n != null && <span className="count">{n}</span>}
    </a>
  )

  return (
    <div className="app">
      <header className="top">
        <a href="#/search" className="brand">Reel Drama Queen</a>
        <nav>
          {nav('search', 'Search')}
          {nav('want', 'Want to watch', count('want'))}
          {nav('watched', 'Watched', count('watched'))}
        </nav>
        <div className="backup">
          <button className="ghost" onClick={exportCsv} disabled={!items.length}>Export CSV</button>
          <label className="ghost btn">
            Import CSV
            <input type="file" accept=".csv,text/csv" onChange={importCsv} hidden />
          </label>
        </div>
      </header>

      {notice && <p className="notice" role="status">{notice}</p>}

      <main>
        {page === 'search' && <Search state={search} onSearch={runSearch} items={items} />}
        {page === 'title' && (
          <Detail key={parts[2]} type={parts[1]} id={parts[2]} items={items} onSave={save} onRemove={remove} />
        )}
        {(page === 'want' || page === 'watched') && (
          <ListView key={page} status={page} items={items} onSave={save} onRemove={remove} />
        )}
      </main>

      <footer>
        <p>Film data from <a href="https://www.themoviedb.org/" target="_blank" rel="noopener noreferrer">The Movie Database (TMDB)</a></p>
      </footer>
    </div>
  )
}

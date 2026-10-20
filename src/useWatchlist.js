import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'watchlist.items.v1'

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function useWatchlist() {
  const [items, setItems] = useState(load)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      /* storage full or blocked: the app keeps working in memory */
    }
  }, [items])

  const save = useCallback((detail, status) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.key === detail.key)
      if (existing) return prev.map((i) => (i.key === detail.key ? { ...i, status } : i))
      const { tagline, seasons, ...rest } = detail
      return [...prev, { ...rest, status, addedAt: new Date().toISOString() }]
    })
  }, [])

  const remove = useCallback((key) => setItems((prev) => prev.filter((i) => i.key !== key)), [])

  const merge = useCallback((incoming) => {
    setItems((prev) => {
      const map = new Map(prev.map((i) => [i.key, i]))
      incoming.forEach((i) => map.set(i.key, i))
      return [...map.values()]
    })
  }, [])

  return { items, save, remove, merge }
}

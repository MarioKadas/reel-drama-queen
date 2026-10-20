const KEY = import.meta.env.VITE_TMDB_API_KEY
const BASE = 'https://api.themoviedb.org/3'
const IMG = 'https://image.tmdb.org/t/p/'

export const posterUrl = (path, size = 'w342') => (path ? `${IMG}${size}${path}` : null)

async function get(path, params = {}) {
  if (!KEY) throw new Error('Missing API key. Add VITE_TMDB_API_KEY to your .env file.')
  const url = new URL(BASE + path)
  url.searchParams.set('api_key', KEY)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(res.status === 401 ? 'TMDb rejected the API key.' : `TMDb request failed (${res.status}).`)
  }
  return res.json()
}

const yearOf = (d) => (d ? Number(d.slice(0, 4)) : null)

export async function searchTitles(query) {
  const data = await get('/search/multi', { query, include_adult: 'false' })
  return data.results
    .filter((r) => r.media_type === 'movie' || r.media_type === 'tv')
    .map((r) => ({
      key: `${r.media_type}-${r.id}`,
      id: r.id,
      type: r.media_type,
      title: r.title || r.name,
      year: yearOf(r.release_date || r.first_air_date),
      poster: r.poster_path,
      rating: r.vote_average ? Math.round(r.vote_average * 10) / 10 : null,
    }))
}

export async function getDetails(type, id) {
  const d = await get(`/${type}/${id}`)
  const runtime =
    type === 'movie'
      ? d.runtime || null
      : d.episode_run_time?.[0] || d.last_episode_to_air?.runtime || null
  return {
    key: `${type}-${id}`,
    id: Number(id),
    type,
    title: d.title || d.name,
    year: yearOf(d.release_date || d.first_air_date),
    runtime,
    genres: (d.genres || []).map((g) => g.name),
    poster: d.poster_path,
    overview: d.overview || '',
    rating: d.vote_average ? Math.round(d.vote_average * 10) / 10 : null,
    tagline: d.tagline || '',
    seasons: type === 'tv' ? d.number_of_seasons : null,
  }
}

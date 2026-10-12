import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useApi } from '../api/useApi.js'
import { ErrorMessage, Loading } from '../components/Status.jsx'
import { CURRENT_YEAR, FIRST_GRAD_YEAR } from '../data/options.js'

const YEARS = Array.from({ length: CURRENT_YEAR - FIRST_GRAD_YEAR + 1 }, (_, i) => CURRENT_YEAR - i)

export default function Directory() {
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = useState(params.get('q') || '')
  const faculties = useApi('/faculties')

  const page = Number(params.get('page') || 1)
  const query = new URLSearchParams()
  for (const key of ['q', 'faculty', 'year', 'page']) {
    if (params.get(key)) query.set(key, params.get(key))
  }
  const { data, error, loading, reload } = useApi(`/directory?${query}`)

  function update(key, value) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key !== 'page') next.delete('page')
    setParams(next, { replace: true })
  }

  // Search as the user types, but wait until they pause.
  useEffect(() => {
    const t = setTimeout(() => {
      if ((params.get('q') || '') !== search.trim()) update('q', search.trim())
    }, 350)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.page_size)) : 1

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold text-maroon">Alumni Directory</h1>
      <p className="mt-2 text-sm text-gray-600">
        Verified alumni who chose to be listed. Only name, faculty and batch are shown.
      </p>

      <div className="card mt-6 grid gap-3 p-4 md:grid-cols-[2fr_2fr_1fr]">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input mt-0"
          placeholder="Search by name"
          aria-label="Search by name"
        />
        <select
          value={params.get('faculty') || ''}
          onChange={(e) => update('faculty', e.target.value)}
          className="input mt-0"
          aria-label="Faculty"
        >
          <option value="">All faculties</option>
          {faculties.data?.faculties.map((f) => (
            <option key={f.slug} value={f.slug}>
              {f.name}
            </option>
          ))}
        </select>
        <select
          value={params.get('year') || ''}
          onChange={(e) => update('year', e.target.value)}
          className="input mt-0"
          aria-label="Graduation year"
        >
          <option value="">All years</option>
          {YEARS.map((y) => (
            <option key={y}>{y}</option>
          ))}
        </select>
      </div>

      {loading && <Loading />}
      {error && <ErrorMessage error={error} onRetry={reload} />}
      {data && (
        <>
          <p className="mt-6 text-sm text-gray-500">
            {data.total} {data.total === 1 ? 'alumnus' : 'alumni'} found
          </p>
          {data.alumni.length === 0 ? (
            <p className="mt-8 text-center text-gray-500">No alumni match your search.</p>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.alumni.map((a) => (
                <div key={a.id} className="card flex items-center gap-4 p-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-maroon/10 font-bold text-maroon">
                    {a.preferred_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{a.full_name}</div>
                    <div className="truncate text-xs text-gray-500">{a.faculty?.name || '—'}</div>
                    {a.grad_year && <div className="text-xs font-semibold text-maroon">Batch of {a.grad_year}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-4 text-sm">
              <button className="btn-ghost" disabled={page <= 1} onClick={() => update('page', String(page - 1))}>
                ← Previous
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button
                className="btn-ghost"
                disabled={page >= totalPages}
                onClick={() => update('page', String(page + 1))}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </section>
  )
}

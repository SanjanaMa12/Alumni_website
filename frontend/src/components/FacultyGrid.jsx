import { Link } from 'react-router-dom'
import { useApi } from '../api/useApi.js'
import { ErrorMessage, Loading } from './Status.jsx'

/** The faculty cards; each one opens the registration form for that faculty. */
export default function FacultyGrid() {
  const { data, error, loading, reload } = useApi('/faculties')

  if (loading) return <Loading />
  if (error) return <ErrorMessage error={error} onRetry={reload} />

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {data.faculties.map((f) => (
        <Link
          key={f.slug}
          to={`/register/${f.slug}`}
          className="overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
        >
          {f.image ? (
            <img src={`/${f.image}`} className="h-48 w-full object-cover" alt={f.name} loading="lazy" />
          ) : (
            <div className="h-48 bg-linear-to-br from-maroon to-maroon-deep" />
          )}
          <div className="p-4">
            <h3 className="font-bold text-maroon">{f.name}</h3>
          </div>
        </Link>
      ))}
    </div>
  )
}

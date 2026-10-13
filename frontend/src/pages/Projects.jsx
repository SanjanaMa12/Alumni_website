import { useApi } from '../api/useApi.js'
import { ErrorMessage, Loading } from '../components/Status.jsx'

const THEMES = {
  green: { border: 'border-green-500', badge: 'bg-green-100 text-green-700', bar: 'bg-green-500' },
  blue: { border: 'border-blue-500', badge: 'bg-blue-100 text-blue-700', bar: 'bg-blue-500' },
  purple: { border: 'border-purple-500', badge: 'bg-purple-100 text-purple-700', bar: 'bg-purple-500' },
  orange: { border: 'border-orange-500', badge: 'bg-orange-100 text-orange-700', bar: 'bg-orange-500' },
}

function OngoingProject({ project }) {
  const theme = THEMES[project.theme]
  return (
    <div className={`rounded-2xl border-l-4 bg-white p-6 shadow-sm ${theme.border}`}>
      <div className="flex justify-between gap-3">
        <h3 className="font-bold">{project.title}</h3>
        <span className={`h-fit rounded-full px-2 py-1 text-xs ${theme.badge}`}>ONGOING</span>
      </div>
      <p className="mt-2 text-sm text-gray-600">{project.description}</p>
      {project.progress !== null && (
        <div className="mt-4">
          <div className="flex justify-between text-xs">
            <span>Progress</span>
            <span>{project.progress}% complete</span>
          </div>
          <div className="mt-1 h-2 w-full rounded-full bg-gray-200">
            <div className={`h-2 rounded-full ${theme.bar}`} style={{ width: `${project.progress}%` }} />
          </div>
        </div>
      )}
      <a
        href={`mailto:aro@pdn.ac.lk?subject=${encodeURIComponent(`Supporting: ${project.title}`)}`}
        className="btn-primary mt-4 px-4 py-2 text-xs"
      >
        Support this project
      </a>
    </div>
  )
}

function CompletedProject({ project }) {
  return (
    <div className="card p-6">
      <div className="flex justify-between gap-3">
        <h3 className="text-sm font-bold">{project.title}</h3>
        <span className="h-fit rounded-full bg-gray-100 px-2 py-1 text-xs">COMPLETED</span>
      </div>
      <p className="mt-2 text-xs text-gray-600">{project.description}</p>
      <div className="mt-3 text-xs font-bold text-green-700">✓ Completed</div>
    </div>
  )
}

export default function Projects() {
  const { data, error, loading, reload } = useApi('/projects')
  const ongoing = data?.projects.filter((p) => p.status === 'ongoing') ?? []
  const completed = data?.projects.filter((p) => p.status === 'completed') ?? []

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold text-maroon">Projects</h1>
      {loading && <Loading />}
      {error && <ErrorMessage error={error} onRetry={reload} />}

      {ongoing.length > 0 && (
        <>
          <h2 className="mt-10 mb-4 flex items-center gap-2 text-xl font-bold">
            <span className="h-3 w-3 animate-pulse rounded-full bg-green-500" /> Ongoing Projects
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {ongoing.map((p) => (
              <OngoingProject key={p.id} project={p} />
            ))}
          </div>
        </>
      )}

      {completed.length > 0 && (
        <>
          <h2 className="mt-12 mb-4 flex items-center gap-2 text-xl font-bold">
            <span className="h-3 w-3 rounded-full bg-gray-400" /> Completed Projects
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {completed.map((p) => (
              <CompletedProject key={p.id} project={p} />
            ))}
          </div>
        </>
      )}
    </section>
  )
}

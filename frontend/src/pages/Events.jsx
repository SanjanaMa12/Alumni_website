import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client.js'
import { useApi } from '../api/useApi.js'
import { ErrorMessage, Loading } from '../components/Status.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const BANNERS = {
  maroon: 'from-maroon to-maroon-deep',
  blue: 'from-blue-500 to-purple-600',
  green: 'from-green-500 to-teal-600',
  orange: 'from-orange-400 to-red-500',
}

const BADGES = {
  maroon: 'bg-gold text-maroon-deep',
  blue: 'bg-blue-100 text-blue-700',
  green: 'bg-green-100 text-green-700',
  orange: 'bg-orange-100 text-orange-700',
}

function formatDate(isoDate) {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function EventCard({ event, onChange }) {
  const { user } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  async function toggle() {
    setBusy(true)
    setError(null)
    try {
      const path = `/events/${event.id}/register`
      const data = event.registered ? await api.delete(path) : await api.post(path)
      onChange(data.event)
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  let action
  if (event.is_past) {
    action = <p className="mt-4 text-center text-sm font-semibold text-gray-400">This event has ended</p>
  } else if (!user) {
    action = (
      <Link to="/login" state={{ from: '/events' }} className="btn-primary mt-4 w-full">
        Log in to confirm attendance
      </Link>
    )
  } else if (event.registered) {
    action = (
      <div className="mt-4 flex items-center gap-3">
        <span className="flex-1 rounded-full bg-green-50 py-2 text-center text-sm font-bold text-green-700">
          ✓ You're attending
        </span>
        <button onClick={toggle} disabled={busy} className="btn-ghost">
          Cancel
        </button>
      </div>
    )
  } else {
    action = (
      <button onClick={toggle} disabled={busy} className="btn-primary mt-4 w-full">
        {busy ? 'Confirming…' : 'Confirm attendance'}
      </button>
    )
  }

  return (
    <div className={`card overflow-hidden ${event.is_past ? 'opacity-70' : ''}`}>
      <div
        className={`flex h-48 items-center justify-center bg-linear-to-br px-4 text-center text-2xl font-bold text-white ${BANNERS[event.theme]}`}
      >
        {event.banner_text}
      </div>
      <div className="p-6">
        {event.category && (
          <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold uppercase ${BADGES[event.theme]}`}>
            {event.category}
          </span>
        )}
        <h3 className="mt-3 text-xl font-bold">{event.title}</h3>
        <div className="mt-1 text-sm text-gray-500">
          📅 {formatDate(event.event_date)} | 📍 {event.location}
        </div>
        <p className="mt-3 text-sm text-gray-600">{event.description}</p>
        {event.attendees > 0 && (
          <p className="mt-2 text-xs text-gray-500">
            {event.attendees} {event.attendees === 1 ? 'alumnus' : 'alumni'} attending
          </p>
        )}
        {action}
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      </div>
    </div>
  )
}

export default function Events() {
  const { data, error, loading, reload, setData } = useApi('/events')

  function replaceEvent(updated) {
    setData({ events: data.events.map((e) => (e.id === updated.id ? updated : e)) })
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold text-maroon">Events</h1>
      {loading && <Loading />}
      {error && <ErrorMessage error={error} onRetry={reload} />}
      {data && data.events.length === 0 && <p className="mt-8 text-gray-500">No events have been announced yet.</p>}
      {data && (
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {data.events.map((event) => (
            <EventCard key={event.id} event={event} onChange={replaceEvent} />
          ))}
        </div>
      )}
    </section>
  )
}

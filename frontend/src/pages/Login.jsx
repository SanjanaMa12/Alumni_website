import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import Field from '../components/Field.jsx'
import { Alert } from '../components/Status.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const ROLES = [
  { value: 'alumni', label: 'Alumni Login' },
  { value: 'student', label: 'Student Login' },
]

export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = location.state?.from || '/profile'

  const [role, setRole] = useState('alumni')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to={redirectTo} replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await login(email.trim(), password, role)
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <div className="card p-8">
        <h1 className="text-center text-2xl font-bold text-maroon">Login</h1>

        <div className="mt-6 flex gap-2 rounded-full bg-gray-100 p-1" role="tablist">
          {ROLES.map((r) => (
            <button
              key={r.value}
              type="button"
              role="tab"
              aria-selected={role === r.value}
              onClick={() => setRole(r.value)}
              className={`flex-1 rounded-full py-2 text-sm ${
                role === r.value ? 'bg-maroon font-bold text-white' : 'text-gray-600'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Field label="Email *">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder={role === 'student' ? 'Student email' : 'Email'}
              autoComplete="email"
            />
          </Field>
          <Field label="Password *">
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="Password"
              autoComplete="current-password"
            />
          </Field>

          <Alert>{error}</Alert>

          <button type="submit" disabled={busy} className="btn-primary w-full py-3">
            {busy ? 'Logging in…' : 'Login'}
          </button>

          <div className="text-center text-xs">
            <a
              href="mailto:aro@pdn.ac.lk?subject=Password%20reset%20request"
              className="text-maroon underline"
            >
              Forgot Password?
            </a>{' '}
            | Don't have an account?{' '}
            <Link to="/register" className="font-bold">
              Register Now
            </Link>
          </div>
        </form>

        <div className="mt-8 rounded-lg border bg-cream p-4">
          <div className="text-xs font-bold text-maroon">LOGIN INFO:</div>
          <div className="mt-1 text-xs text-gray-600">
            • Alumni: Email + Password → See alumni details, events and directory
            <br />• Students: Student email + Password → See directory and events
          </div>
        </div>
      </div>
    </section>
  )
}

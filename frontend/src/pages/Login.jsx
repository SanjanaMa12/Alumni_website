import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import Field from '../components/Field.jsx'
import OtpInput, { sentMessage, useCooldown } from '../components/OtpInput.jsx'
import { Alert } from '../components/Status.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const TABS = {
  student: {
    label: 'Student Login',
    placeholder: 'yourname@sci.pdn.ac.lk',
    hint: 'Use your university email (@pdn.ac.lk or your faculty address, e.g. @sci.pdn.ac.lk).',
  },
  alumni: {
    label: 'Alumni Login',
    placeholder: 'The email you registered with',
    hint: 'Only alumni verified by the Alumni Relations Office can log in.',
  },
}

// Mirrors the server rule so students get instant feedback; the server still decides.
const isUniversityEmail = (email) => /@([a-z0-9-]+\.)*pdn\.ac\.lk$/i.test(email.trim())

export default function Login() {
  const { user, requestLoginCode, verifyLogin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = location.state?.from || '/profile'

  const [role, setRole] = useState('alumni')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [cooldown, startCooldown] = useCooldown()

  if (user) return <Navigate to={redirectTo} replace />

  function switchTab(next) {
    setRole(next)
    setCodeSent(false)
    setCode('')
    setMessage(null)
    setError(null)
  }

  async function sendCode(e) {
    e?.preventDefault()
    if (role === 'student' && !isUniversityEmail(email)) {
      setError(TABS.student.hint)
      return
    }
    setBusy(true)
    setError(null)
    try {
      const data = await requestLoginCode(email.trim(), role)
      setCodeSent(true)
      setCode('')
      setMessage(sentMessage(data))
      startCooldown()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function verify(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await verifyLogin(email.trim(), role, code)
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
          {['student', 'alumni'].map((r) => (
            <button
              key={r}
              type="button"
              role="tab"
              aria-selected={role === r}
              onClick={() => switchTab(r)}
              className={`flex-1 rounded-full py-2 text-sm ${role === r ? 'bg-maroon font-bold text-white' : 'text-gray-600'}`}
            >
              {TABS[r].label}
            </button>
          ))}
        </div>

        {!codeSent ? (
          <form onSubmit={sendCode} className="mt-6 space-y-4">
            <Field label="Email *">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder={TABS[role].placeholder}
                autoComplete="email"
                autoFocus
              />
              <p className="mt-1 text-xs text-gray-500">{TABS[role].hint}</p>
            </Field>
            <Alert>{error}</Alert>
            <button type="submit" disabled={busy || !email.trim()} className="btn-primary w-full py-3">
              {busy ? 'Sending…' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={verify} className="mt-6 space-y-4">
            <Alert type="success">{message}</Alert>
            <Field label="Enter the code from your email *">
              <OtpInput value={code} onChange={setCode} className="input text-center text-lg" autoFocus />
            </Field>
            <Alert>{error}</Alert>
            <button type="submit" disabled={busy || code.length !== 6} className="btn-primary w-full py-3">
              {busy ? 'Verifying…' : 'Verify & Login'}
            </button>
            <div className="flex justify-between text-xs">
              <button type="button" onClick={() => switchTab(role)} className="text-gray-600 underline">
                ← Use a different email
              </button>
              <button
                type="button"
                onClick={sendCode}
                disabled={busy || cooldown > 0}
                className="font-bold text-maroon underline disabled:text-gray-400 disabled:no-underline"
              >
                {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
              </button>
            </div>
          </form>
        )}

        {role === 'alumni' && (
          <p className="mt-6 text-center text-xs">
            Not registered yet?{' '}
            <Link to="/register" className="font-bold text-maroon">
              Register Now
            </Link>
          </p>
        )}

        <div className="mt-8 rounded-lg border bg-cream p-4">
          <div className="text-xs font-bold text-maroon">HOW LOGIN WORKS:</div>
          <div className="mt-1 text-xs text-gray-600">
            No password needed. Enter your email, we send you a 6-digit code (valid for 5 minutes), and you
            type it in to log in.
            <br />• Students: university email → events and directory
            <br />• Alumni: registered and verified email → profile, events and directory
          </div>
        </div>
      </div>
    </section>
  )
}

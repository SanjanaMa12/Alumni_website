import { useState } from 'react'
import { api } from '../api/client.js'
import Field, { CheckboxGroup } from '../components/Field.jsx'
import { Alert } from '../components/Status.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { CONTACT_BY, CONTRIBUTE, COUNTRIES } from '../data/options.js'

const STATUS = {
  pending: {
    style: 'border-yellow-200 bg-yellow-50 text-yellow-800',
    text: 'Your registration is pending verification by the Alumni Relations Office. You will appear in the directory once verified.',
  },
  verified: { style: 'border-green-200 bg-green-50 text-green-700', text: '✓ Your alumni record is verified.' },
  rejected: {
    style: 'border-red-200 bg-red-50 text-red-700',
    text: 'We could not verify your record. Please contact aro@pdn.ac.lk.',
  },
}

function editableFields(user) {
  return {
    full_name: user.full_name || '',
    preferred_name: user.preferred_name || '',
    phone: user.phone || '',
    directory_consent: user.directory_consent,
    current_country: user.current_country || '',
    linkedin: user.linkedin || '',
    profession_org: user.profession_org || '',
    alumni_membership: user.alumni_membership || '',
    contact_by: user.contact_by,
    contribute: user.contribute,
  }
}

function Detail({ label, children }) {
  return (
    <div>
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className="font-medium">{children || '—'}</dd>
    </div>
  )
}

export default function Profile() {
  const { user, setUser } = useAuth()
  const [form, setForm] = useState(() => editableFields(user))
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState(null)
  const [busy, setBusy] = useState(false)

  const isAlumni = user.role === 'alumni'
  const isStudent = user.role === 'student'
  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }))

  async function save(e) {
    e.preventDefault()
    setBusy(true)
    setStatus(null)
    setErrors({})
    try {
      const data = await api.put('/profile', form)
      setUser(data.user)
      setForm(editableFields(data.user))
      setStatus({ type: 'success', text: 'Your details have been saved.' })
    } catch (err) {
      setErrors(err.fields || {})
      setStatus({ type: 'error', text: err.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold text-maroon">Hello, {user.preferred_name}</h1>
      <p className="mt-1 text-sm text-gray-500">{user.email}</p>

      {status && (
        <div className="mt-6">
          <Alert type={status.type}>{status.text}</Alert>
        </div>
      )}
      {isAlumni && (
        <div className={`mt-4 rounded-xl border p-3 text-sm ${STATUS[user.verification_status].style}`}>
          {STATUS[user.verification_status].text}
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_2fr]">
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-bold text-maroon">Record</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <Detail label="Full name">{user.full_name}</Detail>
              <Detail label="Faculty">{user.faculty?.name}</Detail>
              <Detail label="Year of graduation">{user.grad_year}</Detail>
              <Detail label="Registration number">
                {user.reg_no || (user.has_degree_cert ? 'Degree certificate uploaded' : null)}
              </Detail>
              <Detail label="Account type">
                <span className="capitalize">{user.role}</span>
              </Detail>
            </dl>
            {isAlumni && (
              <p className="mt-4 text-xs text-gray-500">
                To correct these details, contact{' '}
                <a href="mailto:aro@pdn.ac.lk" className="underline">
                  aro@pdn.ac.lk
                </a>
                .
              </p>
            )}
          </div>
        </div>

        <form onSubmit={save} className="card p-6" noValidate>
          <h2 className="text-lg font-bold text-maroon">Your Details</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            {isStudent && (
              <Field label="Full Name *" error={errors.full_name} className="md:col-span-2">
                <input
                  value={form.full_name}
                  onChange={(e) => set('full_name', e.target.value)}
                  className={`input ${errors.full_name ? 'input-error' : ''}`}
                />
              </Field>
            )}
            <Field label="Preferred Name *" error={errors.preferred_name}>
              <input
                value={form.preferred_name}
                onChange={(e) => set('preferred_name', e.target.value)}
                className={`input ${errors.preferred_name ? 'input-error' : ''}`}
              />
            </Field>
            <Field label="Phone Number" error={errors.phone}>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                className={`input ${errors.phone ? 'input-error' : ''}`}
              />
            </Field>

            {isAlumni && (
              <>
                <Field label="Current Country of Residence">
                  <select
                    value={form.current_country}
                    onChange={(e) => set('current_country', e.target.value)}
                    className="input"
                  >
                    <option value="">Select country</option>
                    {COUNTRIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </Field>
                <Field label="LinkedIn Profile" error={errors.linkedin}>
                  <input
                    type="url"
                    value={form.linkedin}
                    onChange={(e) => set('linkedin', e.target.value)}
                    className={`input ${errors.linkedin ? 'input-error' : ''}`}
                    placeholder="https://linkedin.com/in/..."
                  />
                </Field>
                <Field label="Current Profession / Organization" className="md:col-span-2">
                  <input
                    value={form.profession_org}
                    onChange={(e) => set('profession_org', e.target.value)}
                    className="input"
                  />
                </Field>
                <Field label="Alumni Association Membership" className="md:col-span-2">
                  <input
                    value={form.alumni_membership}
                    onChange={(e) => set('alumni_membership', e.target.value)}
                    className="input"
                  />
                </Field>
                <Field label="Willing to be contacted by" className="md:col-span-2">
                  <CheckboxGroup
                    options={CONTACT_BY}
                    value={form.contact_by}
                    onChange={(v) => set('contact_by', v)}
                    className="grid"
                  />
                </Field>
                <Field label="How you would like to contribute" className="md:col-span-2">
                  <CheckboxGroup
                    options={CONTRIBUTE}
                    value={form.contribute}
                    onChange={(v) => set('contribute', v)}
                    className="grid grid-cols-1 md:grid-cols-2"
                  />
                </Field>
                <label className="flex cursor-pointer items-start gap-2 rounded-xl border border-blue-100 bg-blue-50 p-3 md:col-span-2">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={form.directory_consent}
                    onChange={(e) => set('directory_consent', e.target.checked)}
                  />
                  <span className="text-sm">
                    <b>Show me in the Alumni Directory</b>
                    <br />
                    <span className="text-xs text-gray-600">Name, faculty, batch visible in Directory</span>
                  </span>
                </label>
              </>
            )}
          </div>
          <button type="submit" disabled={busy} className="btn-primary mt-6">
            {busy ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </div>
    </section>
  )
}

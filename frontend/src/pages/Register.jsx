import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/client.js'
import { useApi } from '../api/useApi.js'
import Field, { CheckboxGroup } from '../components/Field.jsx'
import { Alert, ErrorMessage, Loading } from '../components/Status.jsx'
import YearPicker from '../components/YearPicker.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { CONTACT_BY, CONTRIBUTE, COUNTRIES } from '../data/options.js'

const STEPS = ['Basic', 'Contact', 'Academic', 'More Details']

// Which step each server-side field error belongs to, so we can jump back to it.
const FIELD_STEP = {
  full_name: 0, preferred_name: 0,
  email: 1, phone: 1, password: 1,
  faculty: 2, grad_year: 2, reg_no: 2, degree_cert: 2,
  current_country: 3, linkedin: 3, profession_org: 3, contact_by: 3, contribute: 3,
}

const EMPTY_FORM = {
  full_name: '', preferred_name: '',
  email: '', phone: '', password: '', password_confirm: '',
  grad_year: null, remember_reg_no: '', reg_no: '', degree_cert: null, directory_consent: false,
  current_country: '', linkedin: '', profession_org: '', alumni_membership: '', contact_by: [], contribute: [],
}

function validateStep(step, form, otpVerified) {
  const e = {}
  if (step === 0) {
    if (!form.full_name.trim()) e.full_name = 'Enter your full name.'
    if (!form.preferred_name.trim()) e.preferred_name = 'Enter your preferred name.'
  }
  if (step === 1) {
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) e.email = 'Enter a valid email address.'
    if (!/^\+?[0-9 ()-]{7,20}$/.test(form.phone.trim())) e.phone = 'Enter a valid phone number.'
    if (form.password.length < 8 || !/[A-Za-z]/.test(form.password) || !/\d/.test(form.password)) {
      e.password = 'At least 8 characters, with letters and numbers.'
    }
    if (form.password !== form.password_confirm) e.password_confirm = 'Passwords do not match.'
  }
  if (step === 2) {
    if (!form.grad_year) e.grad_year = 'Select your year of graduation.'
    if (!form.remember_reg_no) e.remember_reg_no = 'Choose an option.'
    if (form.remember_reg_no === 'yes' && !form.reg_no.trim()) e.reg_no = 'Enter your registration number.'
    if (form.remember_reg_no === 'no' && !form.degree_cert) e.degree_cert = 'Upload your degree certificate.'
    if (!otpVerified) e.otp = 'Verify your email with the OTP code.'
  }
  if (step === 3) {
    if (!form.current_country) e.current_country = 'Select your country of residence.'
    if (!form.profession_org.trim()) e.profession_org = 'Enter your current profession or organization.'
    if (form.contact_by.length === 0) e.contact_by = 'Choose at least one option.'
    if (form.contribute.length === 0) e.contribute = 'Choose at least one option.'
  }
  return e
}

function StepIndicator({ step }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-center gap-2 text-xs">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          {i > 0 && <div className={`h-0.5 w-6 sm:w-10 ${i <= step ? 'bg-green-600' : 'bg-gray-200'}`} />}
          <div className={`flex items-center gap-2 ${i > step ? 'opacity-50' : ''}`}>
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full font-bold ${
                i < step ? 'bg-green-600 text-white' : i === step ? 'bg-maroon text-white' : 'bg-gray-200'
              }`}
            >
              {i < step ? '✓' : i + 1}
            </div>
            <span className={i === step ? 'font-semibold' : ''}>{label}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function SectionTitle({ number, title, hint }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-maroon text-xs text-white">{number}</div>
      <h3 className="font-bold">{title}</h3>
      {hint && <span className="ml-auto hidden text-xs text-gray-400 sm:inline">{hint}</span>}
    </div>
  )
}

function OtpBox({ email, verified, onVerified, error }) {
  const [code, setCode] = useState('')
  const [status, setStatus] = useState(null)
  const [busy, setBusy] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  async function send() {
    setBusy(true)
    setStatus(null)
    try {
      const data = await api.post('/auth/otp/send', { email })
      const devNote = data.dev_code ? ` (Development mode — your code is ${data.dev_code})` : ''
      setStatus({ type: 'success', text: data.message + devNote })
      setCooldown(60)
    } catch (e) {
      setStatus({ type: 'error', text: e.message })
    } finally {
      setBusy(false)
    }
  }

  async function verify() {
    setBusy(true)
    setStatus(null)
    try {
      await api.post('/auth/otp/verify', { email, code })
      onVerified(email)
      setStatus(null)
    } catch (e) {
      setStatus({ type: 'error', text: e.message })
    } finally {
      setBusy(false)
    }
  }

  if (verified) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm font-bold text-green-700">
        ✓ {email} is verified
      </div>
    )
  }

  return (
    <div className={`rounded-xl border bg-yellow-50 p-3 ${error ? 'border-red-400' : 'border-yellow-200'}`}>
      <label className="label">Email OTP Verification *</label>
      <p className="text-xs text-gray-600">We'll send a 6-digit code to {email}.</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" onClick={send} disabled={busy || cooldown > 0} className="btn-primary px-4 py-2 text-xs">
          {cooldown > 0 ? `Resend in ${cooldown}s` : 'Send OTP'}
        </button>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          inputMode="numeric"
          autoComplete="one-time-code"
          className="min-w-32 flex-1 rounded-lg border bg-white p-2 text-sm"
          placeholder="Enter OTP"
        />
        <button
          type="button"
          onClick={verify}
          disabled={busy || code.length !== 6}
          className="btn-outline px-4 py-2 text-xs"
        >
          Verify
        </button>
      </div>
      {status && <p className={`mt-2 text-xs ${status.type === 'error' ? 'text-red-600' : 'text-green-700'}`}>{status.text}</p>}
      {error && !status && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  )
}

export default function Register() {
  const { faculty: facultySlug } = useParams()
  const { data, error: loadError, loading, reload } = useApi('/faculties')
  const { user, setUser } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState(0)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [verifiedEmail, setVerifiedEmail] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  const otpVerified = verifiedEmail !== null && verifiedEmail === form.email.trim().toLowerCase()

  if (user) return <Navigate to="/profile" replace />
  if (loading) return <Loading />
  if (loadError) return <ErrorMessage error={loadError} onRetry={reload} />

  const faculty = data.faculties.find((f) => f.slug === facultySlug)
  if (!faculty) return <Navigate to="/register" replace />

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
    setErrors((e) => ({ ...e, [field]: undefined }))
  }

  function next() {
    const e = validateStep(step, form, otpVerified)
    setErrors(e)
    if (Object.keys(e).length === 0) {
      setStep((s) => s + 1)
      window.scrollTo(0, 0)
    }
  }

  function onEnter(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      next()
    }
  }

  async function submit(includeDetails) {
    const stepErrors = validateStep(step, form, otpVerified)
    setErrors(stepErrors)
    if (Object.keys(stepErrors).length > 0) return

    const body = new FormData()
    body.append('faculty', faculty.slug)
    for (const key of ['full_name', 'preferred_name', 'email', 'phone', 'remember_reg_no']) {
      body.append(key, form[key].trim())
    }
    body.append('password', form.password)
    body.append('grad_year', String(form.grad_year))
    body.append('directory_consent', form.directory_consent ? '1' : '0')
    if (form.remember_reg_no === 'yes') body.append('reg_no', form.reg_no.trim())
    if (form.remember_reg_no === 'no' && form.degree_cert) body.append('degree_cert', form.degree_cert)
    if (includeDetails) {
      body.append('include_details', '1')
      for (const key of ['current_country', 'linkedin', 'profession_org', 'alumni_membership']) {
        body.append(key, form[key].trim())
      }
      form.contact_by.forEach((v) => body.append('contact_by[]', v))
      form.contribute.forEach((v) => body.append('contribute[]', v))
    }

    setSubmitting(true)
    setSubmitError(null)
    try {
      const result = await api.post('/auth/register', body)
      setUser(result.user)
      navigate('/profile', { replace: true, state: { welcome: true } })
    } catch (e) {
      setSubmitError(e.message)
      setErrors(e.fields || {})
      const firstStep = Math.min(...Object.keys(e.fields || {}).map((f) => FIELD_STEP[f] ?? step))
      if (Number.isFinite(firstStep) && firstStep < step) setStep(firstStep)
    } finally {
      setSubmitting(false)
    }
  }

  const err = (field) => errors[field]
  const inputClass = (field) => `input ${err(field) ? 'input-error' : ''}`

  return (
    <section className="mx-auto max-w-4xl px-4 py-6">
      <StepIndicator step={step} />

      <div className="card p-6 md:p-8">
        <h1 className="text-xl font-bold">Alumni Registration</h1>
        <p className="text-sm text-gray-500">
          Faculty: <span className="font-bold text-maroon">{faculty.name}</span>
          <Link to="/register" className="ml-2 text-xs underline">
            Change
          </Link>
        </p>

        <form className="mt-6" onSubmit={(e) => e.preventDefault()} noValidate>
          {step === 0 && (
            <div>
              <SectionTitle number={1} title="Your Name" hint="Press Enter to continue →" />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Full Name (as in certificate) *" error={err('full_name')}>
                  <input
                    value={form.full_name}
                    onChange={(e) => set('full_name', e.target.value)}
                    onKeyDown={onEnter}
                    className={inputClass('full_name')}
                    placeholder="Kasun Sampath Perera"
                    autoComplete="name"
                    autoFocus
                  />
                </Field>
                <Field label="Preferred Name *" error={err('preferred_name')}>
                  <input
                    value={form.preferred_name}
                    onChange={(e) => set('preferred_name', e.target.value)}
                    onKeyDown={onEnter}
                    className={inputClass('preferred_name')}
                    placeholder="Kasun"
                    autoComplete="nickname"
                  />
                </Field>
              </div>
              <button type="button" onClick={next} className="btn-primary mt-4">
                Next: Contact Details →
              </button>
            </div>
          )}

          {step === 1 && (
            <div>
              <SectionTitle number={2} title="Contact Details" hint="Press Enter to continue →" />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Email *" error={err('email')}>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => set('email', e.target.value)}
                    onKeyDown={onEnter}
                    className={inputClass('email')}
                    placeholder="kasun@gmail.com"
                    autoComplete="email"
                    autoFocus
                  />
                </Field>
                <Field label="Phone Number *" error={err('phone')}>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => set('phone', e.target.value)}
                    onKeyDown={onEnter}
                    className={inputClass('phone')}
                    placeholder="+94 77 XXX XXXX"
                    autoComplete="tel"
                  />
                </Field>
                <Field label="Password *" error={err('password')}>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => set('password', e.target.value)}
                    onKeyDown={onEnter}
                    className={inputClass('password')}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                  />
                </Field>
                <Field label="Confirm Password *" error={err('password_confirm')}>
                  <input
                    type="password"
                    value={form.password_confirm}
                    onChange={(e) => set('password_confirm', e.target.value)}
                    onKeyDown={onEnter}
                    className={inputClass('password_confirm')}
                    placeholder="Re-enter password"
                    autoComplete="new-password"
                  />
                </Field>
              </div>
              <div className="mt-4 flex gap-3">
                <button type="button" onClick={() => setStep(0)} className="btn-ghost">
                  ← Back
                </button>
                <button type="button" onClick={next} className="btn-primary">
                  Next →
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <SectionTitle number={3} title="Academic Details" />
              <div className="space-y-5">
                <Field label="Year of Graduation *" error={err('grad_year')}>
                  <YearPicker value={form.grad_year} onChange={(y) => set('grad_year', y)} error={err('grad_year')} />
                </Field>

                <Field label="Do you remember your Registration Number? *" error={err('remember_reg_no')}>
                  <div className="mt-2 flex gap-4">
                    {['yes', 'no'].map((v) => (
                      <label key={v} className="flex items-center gap-1 text-sm capitalize">
                        <input
                          type="radio"
                          name="remember_reg_no"
                          value={v}
                          checked={form.remember_reg_no === v}
                          onChange={() => set('remember_reg_no', v)}
                        />
                        {v}
                      </label>
                    ))}
                  </div>
                </Field>

                {form.remember_reg_no === 'yes' && (
                  <Field label="Registration Number *" error={err('reg_no')}>
                    <input
                      value={form.reg_no}
                      onChange={(e) => set('reg_no', e.target.value)}
                      className={inputClass('reg_no')}
                      placeholder="E/16/123"
                    />
                  </Field>
                )}
                {form.remember_reg_no === 'no' && (
                  <Field label="Upload Degree Certificate * (PDF, JPG or PNG, max 5 MB)" error={err('degree_cert')}>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => set('degree_cert', e.target.files[0] || null)}
                      className={`${inputClass('degree_cert')} bg-white`}
                    />
                  </Field>
                )}

                <label className="flex cursor-pointer items-start gap-2 rounded-xl border border-blue-100 bg-blue-50 p-3">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={form.directory_consent}
                    onChange={(e) => set('directory_consent', e.target.checked)}
                  />
                  <span className="text-sm">
                    <b>Would you like to share your details in the Alumni Relations website directory?</b>
                    <br />
                    <span className="text-xs text-gray-600">Name, faculty, batch visible in Directory</span>
                  </span>
                </label>

                <OtpBox
                  email={form.email.trim().toLowerCase()}
                  verified={otpVerified}
                  onVerified={(email) => {
                    setVerifiedEmail(email)
                    setErrors((e) => ({ ...e, otp: undefined }))
                  }}
                  error={err('otp')}
                />

                <Alert>{submitError}</Alert>

                <div className="flex flex-wrap gap-3">
                  <button type="button" onClick={() => setStep(1)} className="btn-ghost">
                    ← Back
                  </button>
                  <button type="button" onClick={() => submit(false)} disabled={submitting} className="btn-outline">
                    {submitting ? 'Submitting…' : 'Submit'}
                  </button>
                  <button type="button" onClick={next} className="btn-primary">
                    More Details →
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h3 className="text-lg font-bold text-maroon">More Details - Professional & Alumni Network</h3>
              <p className="mb-4 text-xs text-gray-500">You can edit these later after login.</p>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Current Country of Residence *" error={err('current_country')}>
                  <select
                    value={form.current_country}
                    onChange={(e) => set('current_country', e.target.value)}
                    className={inputClass('current_country')}
                  >
                    <option value="">Select country</option>
                    {COUNTRIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </Field>
                <Field label="LinkedIn Profile" error={err('linkedin')}>
                  <input
                    type="url"
                    value={form.linkedin}
                    onChange={(e) => set('linkedin', e.target.value)}
                    className={inputClass('linkedin')}
                    placeholder="https://linkedin.com/in/..."
                  />
                </Field>
                <Field label="Current Profession / Organization *" error={err('profession_org')} className="md:col-span-2">
                  <input
                    value={form.profession_org}
                    onChange={(e) => set('profession_org', e.target.value)}
                    className={inputClass('profession_org')}
                    placeholder="e.g. Software Engineer at Virtusa, Colombo"
                  />
                </Field>
                <Field label="Alumni Association Membership (If any)" className="md:col-span-2">
                  <input
                    value={form.alumni_membership}
                    onChange={(e) => set('alumni_membership', e.target.value)}
                    className="input"
                    placeholder="e.g. Member of Engineering Alumni Association 2020"
                  />
                </Field>
                <Field label="Are you willing to be contacted by? *" error={err('contact_by')} className="md:col-span-2">
                  <CheckboxGroup
                    options={CONTACT_BY}
                    value={form.contact_by}
                    onChange={(v) => set('contact_by', v)}
                    className="grid"
                  />
                </Field>
                <Field label="How would you like to contribute? *" error={err('contribute')} className="md:col-span-2">
                  <CheckboxGroup
                    options={CONTRIBUTE}
                    value={form.contribute}
                    onChange={(v) => set('contribute', v)}
                    className="grid grid-cols-1 md:grid-cols-2"
                  />
                </Field>
              </div>

              <div className="mt-4">
                <Alert>{submitError}</Alert>
              </div>

              <div className="mt-6 flex gap-3">
                <button type="button" onClick={() => setStep(2)} className="btn-ghost">
                  ← Back
                </button>
                <button type="button" onClick={() => submit(true)} disabled={submitting} className="btn-primary flex-1 py-3">
                  {submitting ? 'Submitting…' : 'Final Submit →'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </section>
  )
}

import { useEffect, useState } from 'react'

export const RESEND_SECONDS = 60

/** Countdown used to stop "Resend code" being clicked repeatedly. */
export function useCooldown() {
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    if (seconds <= 0) return
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [seconds])

  return [seconds, () => setSeconds(RESEND_SECONDS)]
}

/** Text shown after a code is sent; in development the API also returns the code itself. */
export function sentMessage(response) {
  return response.dev_code
    ? `${response.message} (Development mode: your code is ${response.dev_code})`
    : response.message
}

/** Six-digit code box that only accepts numbers. */
export default function OtpInput({ value, onChange, className = '', ...props }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
      inputMode="numeric"
      autoComplete="one-time-code"
      placeholder="6-digit code"
      maxLength={6}
      className={`tracking-[0.3em] ${className}`}
      {...props}
    />
  )
}

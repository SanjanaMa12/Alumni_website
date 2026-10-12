export function Loading({ label = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-sm text-gray-500">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-maroon border-t-transparent" />
      {label}
    </div>
  )
}

export function ErrorMessage({ error, onRetry }) {
  return (
    <div className="mx-auto my-10 max-w-lg rounded-xl border border-red-200 bg-red-50 p-5 text-center text-sm text-red-700">
      <p>{error?.message || 'Something went wrong.'}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-3 font-bold underline">
          Try again
        </button>
      )}
    </div>
  )
}

export function Alert({ type = 'error', children }) {
  if (!children) return null
  const styles = {
    error: 'border-red-200 bg-red-50 text-red-700',
    success: 'border-green-200 bg-green-50 text-green-700',
    info: 'border-blue-100 bg-blue-50 text-blue-800',
  }
  return (
    <div className={`rounded-xl border p-3 text-sm ${styles[type]}`} role={type === 'error' ? 'alert' : 'status'}>
      {children}
    </div>
  )
}

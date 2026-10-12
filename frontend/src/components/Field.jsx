/** Form field wrapper: label, control and the server's validation message. */
export default function Field({ label, error, className = '', children }) {
  return (
    <div className={className}>
      {label && <label className="label">{label}</label>}
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}

export function CheckboxGroup({ options, value, onChange, className = '' }) {
  function toggle(option) {
    onChange(value.includes(option) ? value.filter((v) => v !== option) : [...value, option])
  }
  return (
    <div className={`mt-2 gap-2 rounded-xl border bg-gray-50 p-3 ${className}`}>
      {options.map((o) => (
        <label key={o.value} className="flex cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" checked={value.includes(o.value)} onChange={() => toggle(o.value)} />
          {o.label}
        </label>
      ))}
    </div>
  )
}

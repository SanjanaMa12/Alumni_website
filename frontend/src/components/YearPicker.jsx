import { useState } from 'react'
import { CURRENT_YEAR, FIRST_GRAD_YEAR } from '../data/options.js'

const decadeOf = (year) => Math.floor(year / 10) * 10
const DECADES = []
for (let d = decadeOf(FIRST_GRAD_YEAR); d <= decadeOf(CURRENT_YEAR); d += 10) DECADES.push(d)

/** Graduation year picker: decade tabs, a year grid and a "type a year" box. */
export default function YearPicker({ value, onChange, error }) {
  const [decade, setDecade] = useState(value ? decadeOf(value) : 2010)
  const [typed, setTyped] = useState(value ? String(value) : '')

  const years = []
  for (let y = Math.max(decade, FIRST_GRAD_YEAR); y <= Math.min(decade + 9, CURRENT_YEAR); y++) years.push(y)

  function select(year) {
    onChange(year)
    setTyped(String(year))
    setDecade(decadeOf(year))
  }

  function handleTyped(text) {
    setTyped(text)
    const year = parseInt(text, 10)
    if (year >= FIRST_GRAD_YEAR && year <= CURRENT_YEAR) select(year)
  }

  return (
    <div className={`mt-2 rounded-xl border-2 bg-white p-3 ${error ? 'border-red-400' : 'border-gray-200'}`}>
      <div className="mb-2 flex flex-wrap gap-1">
        {DECADES.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDecade(d)}
            className={`rounded-full border px-2.5 py-1 text-xs font-bold ${
              d === decade ? 'bg-maroon text-white' : 'bg-gray-100'
            }`}
          >
            {d === decadeOf(CURRENT_YEAR) ? `${d}-${String(CURRENT_YEAR).slice(2)}` : `${d}s`}
          </button>
        ))}
      </div>
      <div className="mb-2 flex flex-wrap items-center gap-3">
        <input
          type="number"
          value={typed}
          onChange={(e) => handleTyped(e.target.value)}
          placeholder="Type year e.g. 1985"
          min={FIRST_GRAD_YEAR}
          max={CURRENT_YEAR}
          className="w-40 rounded-lg border p-2 text-xs"
        />
        {value && <span className="text-sm font-bold text-maroon">Selected: {value}</span>}
      </div>
      <div className="grid grid-cols-5 gap-1.5">
        {years.map((y) => (
          <button
            key={y}
            type="button"
            onClick={() => select(y)}
            className={`rounded-xl border p-2 text-xs font-bold transition hover:bg-maroon hover:text-white ${
              y === value ? 'bg-maroon text-white' : 'bg-gray-50'
            }`}
          >
            {y}
          </button>
        ))}
      </div>
    </div>
  )
}

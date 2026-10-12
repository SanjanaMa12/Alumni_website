import { useCallback, useEffect, useState } from 'react'
import { api } from './client.js'

/** Loads a GET endpoint and tracks loading / error state. */
export function useApi(path) {
  const [state, setState] = useState({ data: null, error: null, loading: true })

  const load = useCallback(() => {
    let cancelled = false
    setState((s) => ({ ...s, loading: true, error: null }))
    api
      .get(path)
      .then((data) => !cancelled && setState({ data, error: null, loading: false }))
      .catch((error) => !cancelled && setState({ data: null, error, loading: false }))
    return () => {
      cancelled = true
    }
  }, [path])

  useEffect(() => load(), [load])

  return { ...state, reload: load, setData: (data) => setState((s) => ({ ...s, data })) }
}

import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../services/api';

/** Load data from a GET endpoint with loading / error state and a reload() function. */
export function useApi(path, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(Boolean(path));
  const [error, setError] = useState(null);
  const ctrl = useRef(null);

  const load = useCallback(async () => {
    if (!path) return;
    ctrl.current?.abort();
    const c = new AbortController();
    ctrl.current = c;
    setLoading(true);
    setError(null);
    try {
      const d = await api.get(path, { signal: c.signal });
      if (!c.signal.aborted) setData(d);
    } catch (e) {
      if (e.name !== 'AbortError') setError(e.message);
    } finally {
      if (!c.signal.aborted) setLoading(false);
    }
  }, [path]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); return () => ctrl.current?.abort(); }, [load, ...deps]); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, setData, loading, error, reload: load };
}

import { useState, useEffect } from 'react';
import { initDuckDB } from '../lib/duckdb';

interface DuckDBState { ready: boolean; loading: boolean; error: string | null; }

export function useDuckDB(): DuckDBState {
  const [state, setState] = useState<DuckDBState>({ ready: false, loading: true, error: null });

  useEffect(() => {
    let cancelled = false;
    initDuckDB()
      .then(() => { if (!cancelled) setState({ ready: true, loading: false, error: null }); })
      .catch((err: Error) => { if (!cancelled) setState({ ready: false, loading: false, error: err.message }); });
    return () => { cancelled = true; };
  }, []);

  return state;
}

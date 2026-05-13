import { useState, useEffect } from 'react';
import axios from 'axios';

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Minimal data-fetch hook used by every dashboard and list page.
 * Handles loading state, error extraction, and cleanup on unmount.
 *
 * Usage:
 *   const { data, loading, error } = useApiFetch(() => assignmentsApi.getAll());
 */
export function useApiFetch<T>(
  fetcher: () => Promise<{ data: T }>,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  deps: unknown[] = [],
): FetchState<T> {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    setState({ data: null, loading: true, error: null });

    fetcher()
      .then((res) => {
        if (!cancelled) setState({ data: res.data, loading: false, error: null });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        let msg = 'An unexpected error occurred';
        if (axios.isAxiosError(err)) {
          msg =
            (err.response?.data as { message?: string } | undefined)?.message ??
            err.message;
        }
        console.error('[SafeSubmit API Error]', err);
        setState({ data: null, loading: false, error: msg });
      });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}

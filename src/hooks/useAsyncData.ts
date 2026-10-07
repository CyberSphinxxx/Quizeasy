import { useCallback, useEffect, useRef, useState } from 'react';

export interface AsyncState<T> {
  data: T | undefined;
  loading: boolean;
  error: string | undefined;
  reload: () => void;
}

function describeError(cause: unknown): string {
  return cause instanceof Error
    ? cause.message
    : 'Something went wrong while reading your local data.';
}

/**
 * Loads data from the repository layer.
 *
 * Every screen uses this so loading, error, and empty states stay consistent
 * and no component talks to IndexedDB directly.
 */
export function useAsyncData<T>(
  loader: () => Promise<T>,
  deps: readonly unknown[] = [],
): AsyncState<T> {
  const [data, setData] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [nonce, setNonce] = useState(0);
  const loaderRef = useRef(loader);

  // Keep the newest loader available to the effect without re-running it.
  useEffect(() => {
    loaderRef.current = loader;
  });

  useEffect(() => {
    let active = true;

    const run = async () => {
      setLoading(true);
      setError(undefined);
      try {
        const result = await loaderRef.current();
        if (!active) return;
        setData(result);
      } catch (cause) {
        if (!active) return;
        setError(describeError(cause));
      } finally {
        if (active) setLoading(false);
      }
    };

    void run();

    return () => {
      active = false;
    };
    // `deps` is a caller-supplied list, so the spread cannot be checked
    // statically. The loader itself is read through a ref above, which is why
    // the effect must not depend on it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  const reload = useCallback(() => setNonce((value) => value + 1), []);

  return { data, loading, error, reload };
}

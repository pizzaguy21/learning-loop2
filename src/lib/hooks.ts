"use client";

import { onSnapshot, type DocumentReference, type Query } from "firebase/firestore";
import { useEffect, useState } from "react";

type Live<T> = { data: T; loading: boolean; error: Error | null };

// Callers must memoize the ref/query (useMemo); a new object resubscribes.

/** Live document. `data` is null while loading, missing, or unreadable. */
export function useDoc<T>(ref: DocumentReference | null): Live<T | null> {
  const [state, setState] = useState<{ src: unknown; data: T | null; error: Error | null }>({
    src: null,
    data: null,
    error: null,
  });
  useEffect(() => {
    if (!ref) return;
    return onSnapshot(
      ref,
      (snap) =>
        setState({
          src: ref,
          data: snap.exists() ? ({ id: snap.id, ...snap.data() } as T) : null,
          error: null,
        }),
      (error) => setState({ src: ref, data: null, error }),
    );
  }, [ref]);
  const fresh = ref !== null && state.src === ref;
  return {
    data: fresh ? state.data : null,
    loading: ref !== null && !fresh,
    error: fresh ? state.error : null,
  };
}

/** Live query result. */
export function useCollection<T>(q: Query | null): Live<T[]> {
  const [state, setState] = useState<{ src: unknown; data: T[]; error: Error | null }>({
    src: null,
    data: [],
    error: null,
  });
  useEffect(() => {
    if (!q) return;
    return onSnapshot(
      q,
      (snap) =>
        setState({
          src: q,
          data: snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T),
          error: null,
        }),
      (error) => setState({ src: q, data: [], error }),
    );
  }, [q]);
  const fresh = q !== null && state.src === q;
  return {
    data: fresh ? state.data : [],
    loading: q !== null && !fresh,
    error: fresh ? state.error : null,
  };
}

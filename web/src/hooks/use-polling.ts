import { useCallback, useEffect, useEffectEvent, useRef, useState } from "react"

export interface PollingState<T> {
  data: T | undefined
  error: Error | undefined
  /** A request is in flight (initial load or refresh). */
  fetching: boolean
  /** Start of the request in flight. */
  fetchingSince: number | undefined
  updatedAt: number | undefined
  refresh: () => void
}

type Snapshot<T> = Omit<PollingState<T>, "refresh"> & { key: string | null }

const initial = <T,>(key: string | null): Snapshot<T> => ({
  key,
  data: undefined,
  error: undefined,
  fetching: key !== null,
  fetchingSince: key !== null ? Date.now() : undefined,
  updatedAt: undefined,
})

/**
 * Calls `fetcher` now and every `intervalMs`, while the page is visible.
 * Previous data is kept on refresh errors. Pass `key = null` to disable.
 */
export function usePolling<T>(
  key: string | null,
  fetcher: (key: string) => Promise<T>,
  intervalMs: number,
): PollingState<T> {
  const [snapshot, setSnapshot] = useState<Snapshot<T>>(() => initial(key))
  const fetch = useEffectEvent(fetcher)
  const runRef = useRef<() => void>(() => {})

  useEffect(() => {
    if (key === null) return

    let cancelled = false
    let inFlight = false
    let timer: ReturnType<typeof setTimeout> | undefined
    // Updates for a stale key are dropped; a new key starts from scratch.
    const update = (fn: (s: Snapshot<T>) => Snapshot<T>) =>
      setSnapshot((s) => fn(s.key === key ? s : initial(key)))

    const run = async () => {
      if (inFlight) return
      inFlight = true
      clearTimeout(timer)
      const since = Date.now()
      update((s) => ({ ...s, fetching: true, fetchingSince: since }))
      try {
        const data = await fetch(key)
        if (!cancelled) {
          update(() => ({
            key,
            data,
            error: undefined,
            fetching: false,
            fetchingSince: undefined,
            updatedAt: Date.now(),
          }))
        }
      } catch (err) {
        if (!cancelled) update((s) => ({ ...s, error: err as Error, fetching: false, fetchingSince: undefined }))
      }
      inFlight = false
      if (!cancelled && document.visibilityState === "visible") {
        timer = setTimeout(run, intervalMs)
      }
    }
    runRef.current = run

    const onVisibility = () => {
      if (document.visibilityState === "visible") run()
      else clearTimeout(timer)
    }
    document.addEventListener("visibilitychange", onVisibility)
    run()

    return () => {
      cancelled = true
      clearTimeout(timer)
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [key, intervalMs])

  const refresh = useCallback(() => runRef.current(), [])
  const { key: _, ...state } = snapshot.key === key ? snapshot : initial<T>(key)
  return { ...state, refresh }
}

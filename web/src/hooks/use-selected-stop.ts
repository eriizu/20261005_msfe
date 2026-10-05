import { useCallback, useState } from "react"

const STORAGE_KEY = "morningstar.stop"

/** Selected stop, persisted in the `?stop=` query param and localStorage. */
export function useSelectedStop() {
  const [stop, setStopState] = useState<string | null>(
    () => new URLSearchParams(location.search).get("stop") ?? localStorage.getItem(STORAGE_KEY),
  )

  const setStop = useCallback((next: string | null) => {
    setStopState(next)
    const url = new URL(location.href)
    if (next) {
      url.searchParams.set("stop", next)
      localStorage.setItem(STORAGE_KEY, next)
    } else {
      url.searchParams.delete("stop")
      localStorage.removeItem(STORAGE_KEY)
    }
    history.replaceState(null, "", url)
  }, [])

  return [stop, setStop] as const
}

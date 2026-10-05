import { useState } from "react"

import type { StopTimeDto } from "@/api"
import { recordSightings, type Sighting } from "@/lib/departures"

interface State {
  key: string | null
  fetchedAt: number | undefined
  history: Map<string, Sighting>
}

/**
 * Last realtime value seen for each call of the stop `key`, accumulated over
 * polls so that buses can be shown as passed once the backend drops them.
 * Kept in memory only: it starts empty on page load and on stop change.
 */
export function useSightings(
  key: string | null,
  data: StopTimeDto[] | undefined,
  fetchedAt: number | undefined,
): ReadonlyMap<string, Sighting> {
  const [state, setState] = useState<State>(() => ({ key, fetchedAt: undefined, history: new Map() }))

  if (state.key !== key || state.fetchedAt !== fetchedAt) {
    const history = state.key === key ? new Map(state.history) : new Map<string, Sighting>()
    if (data && fetchedAt !== undefined) recordSightings(history, data, fetchedAt)
    setState({ key, fetchedAt, history })
    return history
  }
  return state.history
}

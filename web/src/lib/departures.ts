import type { StopTimeDto } from "@/api"
import { parseZoned } from "@/lib/time"

/** How long a bus stays listed as "passed" after its last realtime value. */
export const PASSED_VISIBLE_MS = 5 * 60_000
/**
 * Realtime that disappears while the bus was further away than this is a
 * dropout, not a pass: the call falls back to its scheduled time.
 */
const PASS_THRESHOLD_MS = 2 * 60_000
/** Scheduled-only calls stay listed this long after their time. */
const SCHEDULED_GRACE_MS = 60_000

export interface Departure {
  key: string
  dto: StopTimeDto
  aimed: number
  /** Current realtime estimate, or the last one seen for a passed bus. */
  expected: number | null
  /** Current realtime status, or the last one seen for a passed bus. */
  status: string | null
  /** Expected time when known, aimed time otherwise. */
  effective: number
  passed: boolean
}

/** Last realtime value seen for a call. */
export interface Sighting {
  expected: number
  status: string | null
  /** When the backend last reported it (fetch time). */
  seenAt: number
}

/** Calls are identified by their scheduled time and destination. */
export const departureKey = (dto: StopTimeDto) => `${dto.aimed_arrival}|${dto.destination}`

/** Records the realtime values of a fresh response in `history`. */
export function recordSightings(
  history: Map<string, Sighting>,
  dtos: StopTimeDto[],
  fetchedAt: number,
) {
  for (const dto of dtos) {
    const expected = parseZoned(dto.expected_arrival)
    if (expected !== null) {
      history.set(departureKey(dto), { expected, status: dto.status, seenAt: fetchedAt })
    }
  }
}

/**
 * Departures to show, soonest first: buses with realtime, buses that passed
 * (lost realtime close to their call) in the last 5 minutes, and scheduled
 * calls that are not gone for more than a minute.
 */
export function upcomingDepartures(
  dtos: StopTimeDto[],
  history: ReadonlyMap<string, Sighting>,
  now: number,
): Departure[] {
  return dtos
    .flatMap((dto): Departure[] => {
      const aimed = parseZoned(dto.aimed_arrival)
      if (aimed === null) return []
      const key = departureKey(dto)
      const expected = parseZoned(dto.expected_arrival)
      if (expected !== null) {
        return [{ key, dto, aimed, expected, status: dto.status, effective: expected, passed: false }]
      }

      const last = history.get(key)
      if (last && last.expected - last.seenAt <= PASS_THRESHOLD_MS) {
        if (now - last.seenAt > PASSED_VISIBLE_MS) return []
        const { expected, status } = last
        return [{ key, dto, aimed, expected, status, effective: expected, passed: true }]
      }

      if (aimed < now - SCHEDULED_GRACE_MS) return []
      return [{ key, dto, aimed, expected: null, status: null, effective: aimed, passed: false }]
    })
    .sort((a, b) => a.effective - b.effective)
}

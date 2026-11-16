import type { StopTimeDto } from "@/api"
import { parseZoned } from "@/lib/time"

/** How long a bus stays listed after it passed. */
export const PASSED_VISIBLE_MS = 10 * 60_000
/**
 * Realtime is stale when it was last collected more than this long before its
 * expected time (or before now, while that time is still ahead): the bus
 * stopped being reported while it was still on its way.
 */
const STALE_MS = 2 * 60_000

export interface Departure {
  key: string
  dto: StopTimeDto
  aimed: number
  /** Realtime estimate, when the backend has one. */
  expected: number | null
  /** Time the wait counts down to and the list is sorted by. */
  effective: number
  passed: boolean
  /** The realtime estimate stopped being updated ahead of its expected time. */
  stale: boolean
  /** Stale realtime that is still being relied on: shown with a warning. */
  unreliable: boolean
}

/** Calls are identified by their scheduled time and destination. */
export const departureKey = (dto: StopTimeDto) => `${dto.aimed_arrival}|${dto.destination}`

/**
 * Departures to show, soonest first, up to 10 minutes after they passed.
 *
 * A call passes:
 * - at its scheduled time when it has no realtime;
 * - at its realtime time when it has one;
 * - at its scheduled time when its realtime is early but stale;
 * - at its realtime time when its realtime is late but stale, flagged as
 *   unreliable.
 */
export function upcomingDepartures(dtos: StopTimeDto[], now: number): Departure[] {
  return dtos
    .flatMap((dto): Departure[] => {
      const aimed = parseZoned(dto.aimed_arrival)
      if (aimed === null) return []
      const key = departureKey(dto)
      const expected = parseZoned(dto.expected_arrival)
      if (expected === null) {
        if (now - aimed > PASSED_VISIBLE_MS) return []
        const passed = aimed <= now
        return [
          { key, dto, aimed, expected, effective: aimed, passed, stale: false, unreliable: false },
        ]
      }

      const collectedAt = parseZoned(dto.expected_arrival_collected_at)
      const stale = collectedAt !== null && collectedAt < Math.min(now, expected) - STALE_MS
      const early = expected < aimed
      const passAt = stale && early ? aimed : expected
      if (now - passAt > PASSED_VISIBLE_MS) return []
      const passed = passAt <= now
      return [
        {
          key,
          dto,
          aimed,
          expected,
          // A stale early bus falls back to its scheduled time once its
          // realtime time has gone by.
          effective: expected > now ? expected : passAt,
          passed,
          stale,
          // An early bus that reached its scheduled time has passed for sure.
          unreliable: stale && !(passed && early),
        },
      ]
    })
    .sort((a, b) => a.effective - b.effective)
}

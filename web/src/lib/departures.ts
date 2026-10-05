import type { StopTimeDto } from "@/api"
import { parseZoned } from "@/lib/time"

export interface Departure {
  dto: StopTimeDto
  aimed: number
  expected: number | null
  /** Expected time when known, aimed time otherwise. */
  effective: number
}

/** Upcoming departures (anything not gone for more than a minute), soonest first. */
export function upcomingDepartures(dtos: StopTimeDto[], now: number): Departure[] {
  return dtos
    .flatMap((dto) => {
      const aimed = parseZoned(dto.aimed_arrival)
      if (aimed === null) return []
      const expected = parseZoned(dto.expected_arrival)
      return [{ dto, aimed, expected, effective: expected ?? aimed }]
    })
    .filter((d) => d.effective >= now - 60_000)
    .sort((a, b) => a.effective - b.effective)
}

/**
 * Mirrors `StopTimeDto` from morningstar_rt (src/web_api/state.rs).
 *
 * Datetimes are jiff `Zoned` values serialized by serde, e.g.
 * `2026-10-05T14:30:00+02:00[Europe/Paris]`.
 */
export interface StopTimeDto {
  /** Real-time estimated call time from Siri. */
  expected_arrival: string | null
  /** Theorical call time from GTFS. */
  aimed_arrival: string
  destination: string | null
  /** Number of stops between this stop and destination. */
  stops_to_destination: number | null
  /** Real-time status from Siri: "on time", "late by N'", "early by N'". */
  status: string | null
}

export interface MorningstarApi {
  /** `GET /served_today` */
  servedToday(): Promise<string[]>
  /** `GET /stop/:name` — rejects with `StopNotServedError` on 404. */
  stopTimes(stopName: string): Promise<StopTimeDto[]>
}

export class StopNotServedError extends Error {
  constructor(stopName: string) {
    super(`“${stopName}” is not served today`)
    this.name = "StopNotServedError"
  }
}

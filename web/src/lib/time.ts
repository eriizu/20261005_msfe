/** Timezone of the bus network; times are displayed in it regardless of the viewer's. */
export const NETWORK_TZ = "Europe/Paris"

/**
 * Parse a jiff `Zoned` string (`2026-10-05T14:30:00+02:00[Europe/Paris]`) or a
 * plain RFC 3339 datetime into epoch milliseconds.
 */
export function parseZoned(value: string | null | undefined): number | null {
  if (!value) return null
  const ms = Date.parse(value.replace(/\[[^\]]*\]$/, ""))
  return Number.isNaN(ms) ? null : ms
}

const hhmm = new Intl.DateTimeFormat("fr-FR", {
  timeZone: NETWORK_TZ,
  hour: "2-digit",
  minute: "2-digit",
})

const hhmmss = new Intl.DateTimeFormat("fr-FR", {
  timeZone: NETWORK_TZ,
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
})

export const formatTime = (ms: number) => hhmm.format(ms)
export const formatClock = (ms: number) => hhmmss.format(ms)

/** Whole seconds from `now` until `ms`, rounded down. */
export const secondsUntil = (ms: number, now: number) => Math.floor((ms - now) / 1000)

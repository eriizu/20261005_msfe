import { StopNotServedError, type MorningstarApi, type StopTimeDto } from "./types"

const TZ = "Europe/Paris"
const MINUTE = 60_000

/** Stops of the mocked line, in order from one terminus to the other. */
const STOPS = [
  "Ferrières-en-Brie – Mairie",
  "Les Hauts de Ferrières",
  "Jossigny – Église",
  "Le Clos Fleuri",
  "Collège Claude Monet",
  "Parc du Bel-Air",
  "Place de la Fontaine",
  "Rue du Moulin",
  "Gare de Bussy-St-Georges",
]
const MINUTES_BETWEEN_STOPS = 3

/** Departure minutes (from local midnight) at each terminus. */
function departuresOfTheDay(): number[] {
  const out: number[] = []
  for (let m = 5 * 60 + 45; m <= 22 * 60 + 15; ) {
    out.push(m)
    const peak = (m >= 6 * 60 + 30 && m < 9 * 60 + 30) || (m >= 16 * 60 + 30 && m < 19 * 60 + 30)
    m += peak ? 12 : 25
  }
  return out
}

/** UTC offset of `TZ` at `epochMs`, in minutes. */
function tzOffsetMinutes(epochMs: number): number {
  const name = new Intl.DateTimeFormat("en-US", { timeZone: TZ, timeZoneName: "longOffset" })
    .formatToParts(epochMs)
    .find((p) => p.type === "timeZoneName")!.value // "GMT+02:00"
  const match = /([+-])(\d{2}):(\d{2})/.exec(name)
  if (!match) return 0
  return (match[1] === "-" ? -1 : 1) * (Number(match[2]) * 60 + Number(match[3]))
}

/** Epoch ms of local midnight in `TZ` for the day containing `now`. */
function localMidnight(now: number): number {
  const [y, mo, d] = new Intl.DateTimeFormat("en-CA", { timeZone: TZ })
    .format(now)
    .split("-")
    .map(Number)
  const utcMidnight = Date.UTC(y, mo - 1, d)
  return utcMidnight - tzOffsetMinutes(utcMidnight) * MINUTE
}

/** Format like jiff's `Zoned` serde output. */
function toZoned(epochMs: number): string {
  const offset = tzOffsetMinutes(epochMs)
  const local = new Date(epochMs + offset * MINUTE).toISOString().slice(0, 19)
  const sign = offset < 0 ? "-" : "+"
  const abs = Math.abs(offset)
  const hh = String(Math.floor(abs / 60)).padStart(2, "0")
  const mm = String(abs % 60).padStart(2, "0")
  return `${local}${sign}${hh}:${mm}[${TZ}]`
}

/** Small deterministic hash so delays are stable for a given trip. */
function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}

/** Realtime data is only "available" for calls in this window around now. */
const RT_WINDOW = { before: 10 * MINUTE, after: 75 * MINUTE }

function realtimeFor(tripKey: string, aimed: number, now: number) {
  if (aimed < now - RT_WINDOW.before || aimed > now + RT_WINDOW.after) return null
  const h = hash(tripKey)
  if (h % 7 === 0) return null // some vehicles do not report
  // Base delay in [-90, 420] seconds, drifting by up to a minute every 30 s.
  const base = (h % 511) - 90
  const drift = (hash(`${tripKey}:${Math.floor(now / 30_000)}`) % 61) - 30
  const delaySeconds = base + drift
  // Like morningstar_rt: whole minutes, truncated toward zero.
  const delay = Math.trunc(delaySeconds / 60)
  const status = delay === 0 ? "on time" : delay > 0 ? `late by ${delay}'` : `early by ${-delay}'`
  return { expected: aimed + delaySeconds * 1000, status }
}

function buildStopTimes(stopName: string, now: number): StopTimeDto[] {
  const index = STOPS.indexOf(stopName)
  if (index === -1) throw new StopNotServedError(stopName)
  const midnight = localMidnight(now)
  const last = STOPS.length - 1
  const directions = [
    { destination: STOPS[last], stopsToDestination: last - index, stopsFromOrigin: index },
    { destination: STOPS[0], stopsToDestination: index, stopsFromOrigin: last - index },
  ]

  const result: StopTimeDto[] = []
  for (const dir of directions) {
    // Like the backend, skip calls where this stop is the terminus.
    if (dir.stopsToDestination <= 0) continue
    for (const departure of departuresOfTheDay()) {
      const aimed = midnight + (departure + dir.stopsFromOrigin * MINUTES_BETWEEN_STOPS) * MINUTE
      const rt = realtimeFor(`${dir.destination}@${departure}`, aimed, now)
      result.push({
        aimed_arrival: toZoned(aimed),
        expected_arrival: rt ? toZoned(rt.expected) : null,
        destination: dir.destination,
        stops_to_destination: dir.stopsToDestination,
        status: rt?.status ?? null,
      })
    }
  }
  return result.sort((a, b) => a.aimed_arrival.localeCompare(b.aimed_arrival))
}

function latency<T>(value: () => T): Promise<T> {
  return new Promise((resolve, reject) =>
    setTimeout(() => {
      try {
        resolve(value())
      } catch (err) {
        reject(err)
      }
    }, 150 + Math.random() * 350),
  )
}

/** In-browser stand-in for morningstar_rt, following the same JSON contract. */
export const mockApi: MorningstarApi = {
  servedToday: () => latency(() => [...STOPS]),
  stopTimes: (stopName) => latency(() => buildStopTimes(stopName, Date.now())),
}

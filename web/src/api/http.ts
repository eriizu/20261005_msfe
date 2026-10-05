import { StopNotServedError, type MorningstarApi, type StopTimeDto } from "./types"

/** Client for a running morningstar_rt instance. */
export function httpApi(baseUrl: string): MorningstarApi {
  const base = baseUrl.replace(/\/+$/, "")

  async function get<T>(path: string): Promise<T> {
    const res = await fetch(`${base}${path}`)
    if (!res.ok) throw Object.assign(new Error(`HTTP ${res.status}`), { status: res.status })
    return res.json() as Promise<T>
  }

  return {
    servedToday: () => get<string[]>("/served_today"),
    async stopTimes(stopName) {
      try {
        return await get<StopTimeDto[]>(`/stop/${encodeURIComponent(stopName)}`)
      } catch (err) {
        if ((err as { status?: number }).status === 404) throw new StopNotServedError(stopName)
        throw err
      }
    },
  }
}

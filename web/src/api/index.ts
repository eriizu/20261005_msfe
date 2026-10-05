import { httpApi } from "./http"
import { mockApi } from "./mock"
import type { MorningstarApi } from "./types"

export * from "./types"

declare global {
  interface Window {
    MORNINGSTAR_CONFIG?: { apiUrl?: string }
  }
}

/**
 * Backend base URL: runtime `config.js` first, then build-time `VITE_API_URL`.
 * Unset or "mock" uses the in-browser mock.
 */
const apiUrl =
  window.MORNINGSTAR_CONFIG?.apiUrl || (import.meta.env.VITE_API_URL as string | undefined) || "mock"

export const usingMock = apiUrl === "mock"
export const api: MorningstarApi = usingMock ? mockApi : httpApi(apiUrl)

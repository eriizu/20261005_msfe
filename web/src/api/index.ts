import { httpApi } from "./http"
import { mockApi } from "./mock"
import type { MorningstarApi } from "./types"

export * from "./types"

/** Set `VITE_API_URL` to talk to a real morningstar_rt; mocked data otherwise. */
const apiUrl = import.meta.env.VITE_API_URL as string | undefined

export const api: MorningstarApi = apiUrl ? httpApi(apiUrl) : mockApi
export const usingMock = !apiUrl

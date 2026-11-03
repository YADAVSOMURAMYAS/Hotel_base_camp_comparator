import type {
  City,
  CitySummary,
  CompareRequest,
  ComparisonResult,
  DemoPreset,
} from '../types/contracts'

// "" = same origin, served through the Vite dev proxy.
const BASE: string = (import.meta.env.VITE_API_BASE as string | undefined) ?? ''

/** Network failures and non-2xx responses. The message is safe to show to the user. */
export class ApiError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

export function isAbortError(error: unknown): boolean {
  return (
    typeof error === 'object' && error !== null && (error as Error).name === 'AbortError'
  )
}

async function errorMessage(response: Response): Promise<string> {
  const prefix = `Server returned ${response.status}`
  try {
    const body: unknown = await response.json()
    const detail = (body as { detail?: unknown }).detail
    if (typeof detail === 'string') return `${prefix}: ${detail}`
  } catch {
    // body was not JSON; the status alone is the message
  }
  return prefix
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${BASE}${path}`, init)
  } catch (error) {
    if (isAbortError(error)) throw error
    throw new ApiError('Could not reach the server. Is the backend running?')
  }
  if (!response.ok) throw new ApiError(await errorMessage(response))
  try {
    return (await response.json()) as T
  } catch (error) {
    if (isAbortError(error)) throw error
    throw new ApiError('The server sent a response that could not be read.')
  }
}

export async function getCities(signal?: AbortSignal): Promise<CitySummary[]> {
  const body = await request<{ cities: CitySummary[] }>('/api/cities', { signal })
  return body.cities
}

export function getCity(cityId: string, signal?: AbortSignal): Promise<City> {
  return request<City>(`/api/cities/${encodeURIComponent(cityId)}`, { signal })
}

export function getDemoPreset(cityId: string, signal?: AbortSignal): Promise<DemoPreset> {
  return request<DemoPreset>(`/api/cities/${encodeURIComponent(cityId)}/presets/demo`, {
    signal,
  })
}

/** INVALID and NO_AFFORDABLE_HOTEL are normal 200 results, not errors. */
export function compare(
  body: CompareRequest,
  signal?: AbortSignal,
): Promise<ComparisonResult> {
  return request<ComparisonResult>('/api/compare', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  })
}

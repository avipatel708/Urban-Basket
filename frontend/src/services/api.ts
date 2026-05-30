const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('ub-token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function getApiErrorMessage(err: Record<string, unknown>, fallback: string): string {
  const message = err.error || err.message
  return typeof message === 'string' && message.trim() ? message : fallback
}

function wrapNetworkError(err: unknown, fallback: string): Error {
  if (err instanceof TypeError && /fetch|network|failed/i.test(err.message)) {
    return new Error(
      'Cannot reach the server. Start the backend: open a terminal in the backend folder and run npm run dev (port 5000).'
    )
  }
  if (err instanceof Error) return err
  return new Error(fallback)
}

async function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(input, init)
  } catch (err) {
    throw wrapNetworkError(err, 'Request failed')
  }
}

export async function apiGet<T = any>(path: string): Promise<T> {
  const res = await apiFetch(`${API_URL}${path}`, {
    headers: { ...getAuthHeaders() },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(getApiErrorMessage(err, 'Request failed'))
  }
  return res.json()
}

export async function apiPost<T = any>(path: string, body?: any, init?: RequestInit): Promise<T> {
  const res = await apiFetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: body ? JSON.stringify(body) : undefined,
    ...init,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(getApiErrorMessage(err, 'Request failed'))
  }
  return res.json()
}

export async function apiPut<T = any>(path: string, body?: any): Promise<T> {
  const res = await apiFetch(`${API_URL}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(getApiErrorMessage(err, 'Request failed'))
  }
  return res.json()
}

export async function apiPatch<T = any>(path: string, body?: any): Promise<T> {
  const res = await apiFetch(`${API_URL}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(getApiErrorMessage(err, 'Request failed'))
  }
  return res.json()
}

export async function apiDelete<T = any>(path: string): Promise<T> {
  const res = await apiFetch(`${API_URL}${path}`, {
    method: 'DELETE',
    headers: { ...getAuthHeaders() },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(getApiErrorMessage(err, 'Request failed'))
  }
  return res.json()
}

export function setToken(token: string) {
  localStorage.setItem('ub-token', token)
}

export function removeToken() {
  localStorage.removeItem('ub-token')
}

export function getToken(): string | null {
  return localStorage.getItem('ub-token')
}

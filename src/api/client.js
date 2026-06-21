// API client seam.
//
// Every resource function in this folder returns its data through `mock()` today.
// When the FastAPI backend is ready, set VITE_API_URL and swap each resource
// function's `return mock(...)` for a `return request("/path")` call — a
// one-line change per function, no component changes required.
import { API_URL } from "../config";

// Wrap local mock data in a Promise so components exercise the same async
// loading/error flow they will use against the real API. `delay` can be set to
// simulate latency while developing loading states.
export function mock(data, { delay = 0 } = {}) {
  if (!delay) return Promise.resolve(data);
  return new Promise((resolve) => setTimeout(() => resolve(data), delay));
}

// Real request helper, used once resource functions point at the backend.
export async function request(path, options) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...(options?.headers) },
    ...options,
  });
  if (!res.ok) throw new Error(`API ${res.status} ${res.statusText} for ${path}`);
  return res.json();
}

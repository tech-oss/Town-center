// Central runtime config.
//
// VITE_API_URL points at the FastAPI backend once it exists (e.g.
// "https://api.maidenhead.example" or "http://localhost:8000"). While it is
// unset, the app serves mock data from src/Data via the src/api layer.
export const API_URL = import.meta.env.VITE_API_URL ?? "";

// True while no backend is configured — the api/ layer returns local mock data.
// Flip automatically once VITE_API_URL is provided.
export const USE_MOCKS = API_URL === "";

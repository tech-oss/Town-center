# API layer

Single seam between the UI and data. Components never import from `src/Data`
directly — they call resource functions here, consumed through the `useFetch`
hook (`src/hooks/useFetch.js`).

## Resources

| Module | Functions | Future endpoint |
|--------|-----------|-----------------|
| `properties.js` | `getProperties({status})`, `getPropertyBySlug(slug)` | `/properties` |
| `buildings.js` | `getBuildings()`, `getBuildingBySlug(slug)` | `/buildings` |
| `events.js` | `getEvents()`, `getEventBySlug(slug)` | `/events` |
| `businesses.js` | `getBusinesses({section,category})`, `getBusinessBySlug(slug)` | `/businesses` |
| `articles.js` | `getArticles()`, `getArticleBySlug(slug)` | `/articles` |
| `attractions.js` | `getAttractions()`, `getAttractionBySlug(slug)` | `/attractions` |
| `developments.js` | `getWorkplaceDevelopments()`, `getWorkplaceDevelopmentBySlug(slug)` | `/developments` |
| `stories.js` | `getStories()`, `getStoryBySlug(slug)` | `/stories` |

## Mocks → real backend

Each function currently returns local mock data via `mock(...)` (from
`client.js`). When the FastAPI backend exists:

1. Set `VITE_API_URL` in `.env.local` (see `.env.example`). `USE_MOCKS`
   (`src/config.js`) flips to `false` automatically.
2. Replace each function body's `return mock(localData)` with a `request(...)`
   call, e.g.

   ```js
   export function getProperties({ status } = {}) {
     return request(`/properties${status ? `?status=${status}` : ""}`);
   }
   ```

That is the only change needed — components and the `useFetch` hook stay the
same, since they already handle the async loading/error contract.

## Note on static chrome

Site-shell config (header, footer, hero, nav menus) stays imported directly
from `src/Data` — it is configuration, not a fetched resource, and does not need
loading states.

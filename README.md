# Maidenhead Town Centre

Marketing and directory website for Maidenhead town centre — a Vite + React + Tailwind CSS v4 single-page app.

## Features

- **Home** — auto-rotating hero, lifestyle sections, events, traders, newsletter
- **Directory** — Shop, Eat & Drink and See & Do sections with mega-menu dropdowns, category pages, detail pages, and per-business News & Offers article pages
- **Live** (residential) — Why Live Here, property search (For Sale / For Rent) with filters, building pages, property detail pages with booking forms, and an enquiry page
- **Attractions** — rich editorial pages (Boulter's Lock & Ray Mill Island, Waterfront Dining, H&W Taplow) with galleries, maps and "you might like" listings
- Live weather widget, embedded maps, and a newsletter modal

## Tech stack

- [Vite](https://vitejs.dev/) + [React](https://react.dev/) (React Router for client-side routing)
- [Tailwind CSS v4](https://tailwindcss.com/)
- Deployed on [Vercel](https://vercel.com/)

## Getting started

```bash
npm install
npm run dev      # start the dev server
npm run build    # production build to /dist
npm run preview  # preview the production build
```

## Project structure

- `src/components/` — UI and page components
- `src/Data/` — editable content (`content.js`, `pages.js`, `live.js`, `attractions.js`)
- `public/images/` — image assets

## Branches

- `main` — production
- `develop` — integration / work in progress

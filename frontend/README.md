# AEGIS Frontend

React analyst dashboard for the AEGIS fraud detection platform: live KPIs, fraud alerts, risk analysis, compliance posture, and an interactive fraud-ring graph.

## Stack

- **React 18** + **Vite 5**, **React Router** for navigation
- **Tailwind CSS** with a custom cyber theme, **lucide-react** icons
- **Recharts** for charts, **vis-network** for graph visualization
- **Axios** API client, **Vitest** + Testing Library, **ESLint**

## Getting started

```bash
cd frontend
cp .env.example .env
npm install
npm run dev          # http://localhost:3000 (proxies /api to :8000)
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Vite dev server with API proxy to `http://localhost:8000` |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Preview the production build |
| `npm run lint` | ESLint over the project |
| `npm test` | Vitest unit tests |

## Environment variables

| Variable | Default | Description |
| --- | --- | --- |
| `VITE_API_URL` | `/api/v1` | API base URL (the dev server and nginx both proxy `/api`) |
| `VITE_API_KEY` | — | Must match the backend `API_KEY`; sent as `X-API-Key` |

## Presentation mode

The sidebar has a presentation toggle that switches every page to bundled demo data (`src/data/mockData.js`) so the UI can be shown without a running backend. The setting persists in `localStorage` and pages react to it live via the `usePresentationMode` hook (`src/utils/presentationMode.js`).

## Theming

`src/utils/uiSettings.js` persists UI preferences (accent color, panel opacity, glow, radius, background grid/orbs, reduced motion) to `localStorage` and applies them as CSS variables. The settings panel is reachable from the header.

## Layout

```
src/
├── pages/         # Dashboard, FraudAlerts, RiskAnalysis, Compliance, ...
├── components/    # Header, Sidebar, MetricCard, GraphView, ...
├── services/      # Axios API client (api.js)
├── data/          # Demo datasets for presentation mode
├── utils/         # presentationMode, uiSettings
└── test/          # Vitest setup and unit tests
```

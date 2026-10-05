# Morningstar web

React + shadcn/ui frontend for [morningstar_rt](https://github.com/eriizu/morningstar/tree/main/morningstar_rt):
pick a stop, see its next calls (scheduled time, realtime time and status when
available, stops to destination). Refreshes every 20 s while the tab is visible.

## Data source

By default the app uses an in-browser mock (`src/api/mock.ts`) that follows the
backend's JSON contract (`GET /served_today`, `GET /stop/:name` → `StopTimeDto[]`).
To use a real backend:

```sh
VITE_API_URL=http://gaufrette:3000 npm run build
```

## Run

```sh
npm install
npm run dev                  # dev server, http://<host>:5280
npm run build && npm run preview   # production build, same port
```

Both bind to all interfaces on port 5280, so the app is reachable from the
tailnet at http://gaufrette.tail5bf4da.ts.net:5280 (or http://gaufrette:5280).

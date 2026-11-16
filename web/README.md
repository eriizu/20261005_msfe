# Morningstar web

React + shadcn/ui frontend for [morningstar_rt](https://github.com/eriizu/morningstar/tree/main/morningstar_rt):
pick a stop, see its next calls (scheduled time, realtime time and status when
available, stops to destination). Refreshes every 5 s while the tab is visible.
A live indicator pulses green on each update, turns orange while a request
takes over 3 s, and red after a failed one (requests time out after 10 s).

Waits are shown in whole minutes, then "due" under a minute (flashing under
30 s). A bus is shown as "passed" for 10 minutes, starting:

- at its scheduled time when it has no realtime;
- at its realtime time when it has one;
- at its scheduled time when its realtime is early but stale;
- at its realtime time when its realtime is late but stale, with an
  "unreliable" flag and a footnote.

Realtime is stale when the backend last collected it
(`expected_arrival_collected_at`) more than 2 minutes before its expected time,
or before now while that time is still ahead: the bus stopped being reported
while still on its way. A stale estimate that is still to come is flagged
"unreliable" too. The backend keeps realtime after the upstream drops it, so
the page holds no history of its own.

## Pointing to a backend

The app calls a [morningstar_rt](https://github.com/eriizu/morningstar/tree/main/morningstar_rt)
instance from the browser (`GET /served_today`, `GET /stop/:name`), so the URL
must be reachable from the user's device and the backend must allow the
frontend's origin (CORS). The base URL is resolved in this order:

1. **Runtime**: `apiUrl` in `config.js`, served next to `index.html`. The repo
   ships `public/config.js` empty. The Docker image writes it at startup
   from `$API_URL`. For any other static host, edit `dist/config.js`:
   ```js
   window.MORNINGSTAR_CONFIG = { apiUrl: "http://gaufrette:3000" }
   ```
2. **Build time**: `VITE_API_URL`, either in the environment or in an `.env.local`
   file (git-ignored):
   ```sh
   echo 'VITE_API_URL=http://gaufrette:3000' > .env.local
   # or: VITE_API_URL=http://gaufrette:3000 npm run build
   ```
3. **Neither set** (or the value `mock`): the in-browser mock in
   `src/api/mock.ts`, which follows the same JSON contract. When it's active,
   the header shows a "mock data" badge.

## Run

```sh
npm install
npm run dev                  # dev server, http://<host>:5280
npm run build && npm run preview   # production build, same port
```

Both bind to all interfaces on port 5280, so the app is reachable from the
tailnet at http://gaufrette.tail5bf4da.ts.net:5280 (or http://gaufrette:5280).

## Docker

The image builds the app and serves it with
[darkhttpd](https://hub.docker.com/r/alpinelinux/darkhttpd) on port 8080:

```sh
docker build -t morningstar-web .
docker run -d --name morningstar-web -p 5280:8080 \
  -e API_URL=http://gaufrette:3000 morningstar-web
```

`API_URL` is read when the container starts, so the same image works with any
backend. You can also bake in a default with
`--build-arg VITE_API_URL=…`. Extra `docker run` arguments go to darkhttpd
(e.g. `--port 9000`).

## Possible improvements

These would need changes in morningstar_rt:

- **Expose a trip ID.** Calls are matched across polls by scheduled time and
  destination, which breaks if two trips share both or if a scheduled time is
  revised.

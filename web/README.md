# Morningstar web

React + shadcn/ui frontend for [morningstar_rt](https://github.com/eriizu/morningstar/tree/main/morningstar_rt):
pick a stop, see its next calls (scheduled time, realtime time and status when
available, stops to destination). Refreshes every 5 s while the tab is visible.

Waits are shown in whole minutes, then "due" under a minute (flashing under
30 s). A bus whose realtime disappears within 2 minutes of its expected time is
shown as "passed" for 5 minutes after its last realtime value. This history
lives in the page only: it starts empty on load and when switching stops.

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

- **Report passed calls.** The frontend infers "passed" from realtime
  disappearing, and remembers it only in the open page. After a reload or a
  stop change, buses that already passed show as scheduled again, then vanish
  a minute after their scheduled time. An early bus can therefore look like it
  is still coming. A passed flag (or the last realtime time) in `StopTimeDto`
  would remove the guesswork, including the 2-minute threshold used to tell a
  pass from a realtime dropout.
- **Expose a trip ID.** Calls are matched across polls by scheduled time and
  destination, which breaks if two trips share both or if a scheduled time is
  revised.

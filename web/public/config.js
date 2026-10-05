// Runtime configuration, loaded before the app. Overwritten by the Docker
// entrypoint from $API_URL; edit it in place for other static deployments.
//   apiUrl: base URL of morningstar_rt (e.g. "http://gaufrette:3000"), or "mock".
// Leave it unset to fall back to the build-time VITE_API_URL.
window.MORNINGSTAR_CONFIG = {}

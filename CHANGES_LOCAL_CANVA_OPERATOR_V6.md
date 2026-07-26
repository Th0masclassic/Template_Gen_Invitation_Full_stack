# V6 - Canva Connect API restricted to the local atelier operator

## What changed

- The Canva Connect API OAuth belongs only to the atelier account.
- At server startup, the backend verifies the saved Connect API token, refreshes it when possible, and introspects it against Canva.
- When authorization is missing or invalid, the system opens the local OAuth route automatically.
- The OAuth start, callback, logout, and Canva MCP authorization actions are protected by the local-operator middleware.
- Requests made through the public Cloudflare hostname receive `LOCAL_OPERATOR_ONLY`.
- `CANVA_REDIRECT_URI` is required to be exactly local:

  `http://127.0.0.1:<PORT>/api/canva/auth/callback`

- The public customer OAuth route remains disabled.
- The local operator page now shows both ChatGPT session status and Canva Connect API authorization status.

## Required Canva Developer Portal redirect

For the default port 3000, register exactly:

`http://127.0.0.1:3000/api/canva/auth/callback`

Do not register the temporary `trycloudflare.com` address for the atelier OAuth callback.

## Startup behavior

With a valid token:

`Canva Connect operator session at startup: ready`

Without a valid token:

`Canva Connect operator session at startup: login_required`

The default browser opens the local authorization page. Jobs and customers never receive that login URL.

## Environment

```env
CANVA_REDIRECT_URI=http://127.0.0.1:3000/api/canva/auth/callback
CANVA_OPERATOR_AUTH_AT_STARTUP=1
```

Set `CANVA_OPERATOR_AUTH_AT_STARTUP=0` only when automatic browser opening is not desired. The login routes remain local even with that option disabled.

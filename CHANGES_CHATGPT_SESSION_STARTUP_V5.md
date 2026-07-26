# V5 — ChatGPT session verification at startup

## What changed

- The server launches the persistent ChatGPT browser profile during startup.
- It verifies that the ChatGPT account is authenticated and that the message composer is ready before processing Canva jobs.
- The verification no longer trusts the `chatgpt.com` URL by itself.
- Authentication is checked through the ChatGPT session endpoints, authenticated account controls and a persistent session-cookie fallback.
- If the session is missing, the login window is opened automatically.
- The Canva automation queue remains paused while the session is not ready.
- The server checks again every 5 seconds while waiting for login.
- After login is detected, jobs stopped in `chatgpt_canva_login_required` resume automatically.
- While the session is ready, it is rechecked periodically so an expired session does not consume automation attempts.

## Startup log

A correct authenticated startup prints:

```text
Build: chatgpt_canva_session_startup_v5
ChatGPT session at startup: ready
```

When login is required, the server opens the ChatGPT window and prints:

```text
ChatGPT session at startup: login_required
A sessao do ChatGPT nao esta pronta. A janela de login foi aberta e a fila Canva esta pausada ate a autenticacao ser confirmada.
```

No restart is required after completing the login. The monitor detects the session and resumes the queue automatically.

import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const server = fs.readFileSync(new URL("../server.mjs", import.meta.url), "utf8");
const config = fs.readFileSync(new URL("../server-config.mjs", import.meta.url), "utf8");

test("Canva Connect OAuth is restricted to the local operator host", () => {
  assert.match(server, /app\.get\("\/api\/canva\/auth\/start", requireLocalOperator/);
  assert.match(server, /app\.get\("\/api\/canva\/auth\/callback", requireLocalOperator/);
  assert.match(server, /app\.post\("\/api\/canva\/logout", requireLocalOperator/);
});

test("the Connect API redirect is forced to 127.0.0.1", () => {
  assert.match(config, /CANVA_REDIRECT_URI = process\.env\.CANVA_REDIRECT_URI \|\| `http:\/\/127\.0\.0\.1:\$\{PORT\}\/api\/canva\/auth\/callback`/);
  assert.match(server, /url\.hostname === "127\.0\.0\.1"/);
  assert.match(server, /url\.pathname === "\/api\/canva\/auth\/callback"/);
});

test("startup verifies the operator token and opens local OAuth when needed", () => {
  const verify = server.indexOf("await verifyCanvaOperatorAuthorization()");
  const listen = server.indexOf("app.listen", verify);
  const open = server.indexOf("openUrlInDefaultBrowser(localCanvaAuthUrl)", listen);
  assert.ok(verify >= 0);
  assert.ok(listen > verify);
  assert.ok(open > listen);
  assert.match(server, /oauth\/introspect/);
});

test("the public customer OAuth route remains disabled", () => {
  assert.match(server, /CUSTOMER_CANVA_AUTH_DISABLED/);
  assert.match(server, /Os clientes nao ligam a propria conta Canva/);
});

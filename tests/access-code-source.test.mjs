import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("server and client wire the access code gate into one-time generation", async () => {
  const [server, client, config, packageJson] = await Promise.all([
    fs.readFile(path.join(root, "server.mjs"), "utf8"),
    fs.readFile(path.join(root, "public", "event-builder.html"), "utf8"),
    fs.readFile(path.join(root, "server-config.mjs"), "utf8"),
    fs.readFile(path.join(root, "package.json"), "utf8"),
  ]);

  assert.match(config, /ACCESS_CODE_REQUIRED/);
  assert.match(config, /ACCESS_CODE_STORE_PATH/);
  assert.match(server, /createAccessCodeStore/);
  assert.match(server, /renderAccessCodeGatePage/);
  assert.match(server, /\/api\/customer\/access-code/);
  assert.match(server, /requireUnusedCustomerAccessCode/);
  assert.match(server, /accessCodeStore\.claim\(request\.customerAccessCode, requestId\)/);
  assert.match(server, /ACCESS_CODE_ALREADY_USED/);
  assert.match(server, /`\/results\/\$\{encodeURIComponent\(record\.requestId\)\}`/);
  assert.match(server, /\/operator\/access-codes/);
  assert.match(server, /localHost && loopbackClient/);
  assert.match(client, /data\?\.error\?\.redirectUrl/);
  assert.match(client, /window\.location\.assign\(data\.error\.redirectUrl\)/);

  const parsedPackage = JSON.parse(packageJson);
  assert.equal(parsedPackage.scripts["token:create"], "node scripts/access-codes.mjs create");
  assert.equal(parsedPackage.scripts["token:list"], "node scripts/access-codes.mjs list");
  assert.equal(parsedPackage.scripts["token:revoke"], "node scripts/access-codes.mjs revoke");
});

import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const server = fs.readFileSync(new URL("../server.mjs", import.meta.url), "utf8");

test("Canva OAuth refresh is single-flight and preserves rotating refresh credentials", () => {
  const tokenStart = server.indexOf("async function saveCanvaToken");
  const tokenEnd = server.indexOf("\nasync function getCanvaAccessToken()", tokenStart);
  const tokenFlow = server.slice(tokenStart, tokenEnd);
  assert.match(server, /const canvaTokenRefreshPromises = new Map\(\)/);
  assert.match(tokenFlow, /previous\?\.refresh_token/);
  assert.match(tokenFlow, /canvaTokenRefreshPromises\.get\(refreshKey\)/);
  assert.match(tokenFlow, /canvaTokenRefreshPromises\.set\(refreshKey, operation\)/);
  assert.match(tokenFlow, /const latest = await loadCanvaToken\(tokenPath\)/);
  assert.doesNotMatch(tokenFlow, /const tempPath = `\$\{tokenPath\}\.tmp`/);
});

test("an invalid Canva access token is refreshed instead of deleting the OAuth file", () => {
  const invalidStart = server.indexOf("async function handleInvalidCanvaToken");
  const invalidEnd = server.indexOf("\nfunction extractCanvaDesigns", invalidStart);
  const invalidFlow = server.slice(invalidStart, invalidEnd);
  assert.match(invalidFlow, /expires_at: 0/);
  assert.match(invalidFlow, /await getCanvaAccessTokenInfo\(CANVA_TOKEN_PATH, "operator_oauth"\)/);
  assert.doesNotMatch(invalidFlow, /fs\.rm\(CANVA_TOKEN_PATH/);
  assert.match(invalidFlow, /sendAutomationFailureAlert/);
});

test("startup introspection refreshes an inactive access token before requesting reauthorization", () => {
  const verifyStart = server.indexOf("async function verifyCanvaOperatorAuthorization");
  const verifyEnd = server.indexOf("\nfunction openUrlInDefaultBrowser", verifyStart);
  const verify = server.slice(verifyStart, verifyEnd);
  assert.match(verify, /if \(!introspection\.active && tokenInfo\.source !== "manual_env"\)/);
  assert.match(verify, /expires_at: 0/);
  assert.match(verify, /introspection = await introspectCanvaAccessToken\(tokenInfo\.accessToken\)/);
});

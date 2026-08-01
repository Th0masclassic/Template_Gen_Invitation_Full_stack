import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";

const [clientSource, serverSource] = await Promise.all([
  fs.readFile(new URL("../public/event-builder.html", import.meta.url), "utf8"),
  fs.readFile(new URL("../server.mjs", import.meta.url), "utf8"),
]);

test("a claimed customer can reopen, prefill, and resubmit the existing project", () => {
  assert.match(serverSource, /\/wedding\?redo=/);
  assert.match(serverSource, /\/api\/customer\/jobs\/:requestId\/restart-data/);
  assert.match(serverSource, /\/api\/customer\/jobs\/:requestId\/restart/);
  assert.match(serverSource, /loadCustomerOwnedJob\(request, response\)/);
  assert.match(serverSource, /attemptsUsed:\s*1,[\s\S]*envelopeAttemptsUsed:\s*0/);

  assert.match(clientSource, /searchParams\.get\('redo'\)/);
  assert.match(clientSource, /\/restart-data/);
  assert.match(clientSource, /\/restart`/);
  assert.match(clientSource, /applyRestartProject\(body\.data\)/);
  assert.match(clientSource, /packTypeSelect\.disabled = true/);
  assert.match(clientSource, /state\.retainedCustomTemplate/);
  assert.match(clientSource, /details:\s*state\.packType === 'Full_pack'[\s\S]{0,220}websiteDetailsFromForm\(\)/);
  assert.match(clientSource, /Criar nova versão/);
});

test("the main editor browser script parses after restart support", () => {
  const inlineScripts = [...clientSource.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((match) => match[1]);
  assert.ok(inlineScripts.length > 0);
  assert.doesNotThrow(() => new Function(inlineScripts.at(-1)));
});

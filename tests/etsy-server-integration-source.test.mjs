import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const serverPath = path.join(projectRoot, "server.mjs");
const configPath = path.join(projectRoot, "server-config.mjs");
const envExamplePath = path.join(projectRoot, ".env.example");

function sourceBlock(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  assert.ok(start >= 0, `Missing source marker: ${startMarker}`);
  assert.ok(end > start, `Missing source marker after ${startMarker}: ${endMarker}`);
  return source.slice(start, end);
}

test("server captures Etsy's exact JSON bytes and forwards the official signature headers", async () => {
  const source = await fs.readFile(serverPath, "utf8");
  const jsonParser = sourceBlock(
    source,
    "app.use(express.json({",
    "app.use(securityHeaders);",
  );
  const route = sourceBlock(
    source,
    'app.post(\n  ["/api/integrations/etsy/webhook", "/api/integrations/etsy/webhooks"]',
    'app.post(\n  "/api/integrations/youform/webhook"',
  );

  assert.match(jsonParser, /request\.originalUrl\?\.startsWith\("\/api\/integrations\/etsy\/webhook"\)/);
  assert.match(jsonParser, /request\.rawBody = Buffer\.from\(buffer\)/);
  assert.ok(
    source.indexOf("app.use(express.json({") < source.indexOf('["/api/integrations/etsy/webhook"'),
    "Raw-body capture must be installed before the Etsy route.",
  );

  assert.match(route, /if \(!ETSY_INTEGRATION_ENABLED \|\| !etsyFulfillmentService\)/);
  assert.match(route, /status\(503\)/);
  assert.match(route, /etsyFulfillmentService\.handleWebhook\(\{/);
  assert.match(route, /rawBody: request\.rawBody/);
  assert.match(route, /webhookId: request\.get\("webhook-id"\)/);
  assert.match(route, /webhookTimestamp: request\.get\("webhook-timestamp"\)/);
  assert.match(route, /webhookSignature: request\.get\("webhook-signature"\)/);
  assert.match(route, /response\.status\(202\)\.json\(/);
  assert.doesNotMatch(route, /JSON\.stringify\(request\.body\)/);
});

test("Etsy startup is feature-gated and binds persisted OAuth, API, email, and fulfillment config", async () => {
  const source = await fs.readFile(serverPath, "utf8");
  const setup = sourceBlock(
    source,
    "async function prepareEtsyFulfillmentSystem()",
    "function parseCookies(request)",
  );

  assert.match(source, /createCustomerEmailService.*"\.\/customer-email\.mjs"/s);
  assert.match(source, /createEtsyApiClient[\s\S]*createEtsyFulfillmentService[\s\S]*createEtsyOAuthTokenProvider[\s\S]*from "\.\/etsy-fulfillment\.mjs"/);
  assert.match(setup, /if \(!ETSY_INTEGRATION_ENABLED\)/);
  assert.match(setup, /etsyFulfillmentService = null/);
  assert.match(setup, /const persistedToken = await loadPersistedEtsyToken\(\)/);
  assert.match(setup, /accessToken: persistedToken\?\.accessToken \|\| ETSY_OAUTH_ACCESS_TOKEN/);
  assert.match(setup, /refreshToken: persistedToken\?\.refreshToken \|\| ETSY_OAUTH_REFRESH_TOKEN/);
  assert.match(setup, /expiresAt: persistedToken\?\.expiresAt \|\| ETSY_OAUTH_EXPIRES_AT/);
  assert.match(setup, /onToken: persistEtsyToken/);
  assert.match(setup, /apiKey: RESEND_API_KEY/);
  assert.match(setup, /from: RESEND_FROM_EMAIL/);
  assert.match(setup, /replyTo: RESEND_REPLY_TO_EMAIL/);
  assert.match(setup, /portalUrl: CUSTOMER_PORTAL_URL/);
  assert.match(setup, /supportEmail: CUSTOMER_SUPPORT_EMAIL/);
  assert.match(setup, /sharedSecret: ETSY_API_SHARED_SECRET/);
  assert.match(setup, /const listingPackMap = parseEtsyListingPackMap\(ETSY_LISTING_PACK_MAP\)/);
  assert.match(setup, /ETSY_FULL_PACK_HOSTING_NOT_CONFIGURED/);
  assert.match(setup, /listingPackMap,/);
  assert.match(setup, /webhookSecret: ETSY_WEBHOOK_SIGNING_SECRET/);
  assert.match(setup, /webhookToleranceSeconds: ETSY_WEBHOOK_TOLERANCE_SECONDS/);

  const storageIndex = source.indexOf("await prepareStorage();");
  const accessIndex = source.indexOf("await prepareAccessCodeSystem();");
  const etsyIndex = source.indexOf("await prepareEtsyFulfillmentSystem();");
  const listenIndex = source.indexOf("const server = app.listen(");
  assert.ok(storageIndex >= 0 && storageIndex < accessIndex);
  assert.ok(accessIndex < etsyIndex);
  assert.ok(etsyIndex < listenIndex);
});

test("rotated Etsy tokens use a private atomic file and are loaded before environment fallbacks", async () => {
  const source = await fs.readFile(serverPath, "utf8");
  const persistence = sourceBlock(
    source,
    "async function loadPersistedEtsyToken()",
    "async function prepareEtsyFulfillmentSystem()",
  );

  assert.match(source, /const ETSY_DIR = path\.join\(GENERATED_DIR, "etsy"\)/);
  assert.match(source, /const ETSY_TOKEN_PATH = path\.join\(ETSY_DIR, "oauth-token\.json"\)/);
  assert.match(persistence, /JSON\.parse\(await fs\.readFile\(ETSY_TOKEN_PATH, "utf8"\)\)/);
  assert.match(persistence, /if \(error\?\.code === "ENOENT"\) return null/);
  assert.match(persistence, /const tempPath = `\$\{ETSY_TOKEN_PATH\}\.\$\{process\.pid\}\.\$\{crypto\.randomBytes\(6\)\.toString\("hex"\)\}\.tmp`/);
  assert.match(persistence, /mode: 0o600/);
  assert.match(persistence, /flag: "wx"/);
  assert.match(persistence, /await fs\.rename\(tempPath, ETSY_TOKEN_PATH\)/);
  assert.match(persistence, /await fs\.chmod\(ETSY_TOKEN_PATH, 0o600\)\.catch/);
  assert.match(persistence, /await fs\.rm\(tempPath, \{ force: true \}\)\.catch/);
  assert.doesNotMatch(source, /express\.static\(GENERATED_DIR/);
});

test("server config and the environment example expose the complete Etsy fulfillment contract", async () => {
  const relevantKeys = [
    "PUBLIC_BASE_URL",
    "CUSTOMER_PORTAL_URL",
    "CUSTOMER_SUPPORT_EMAIL",
    "ETSY_API_KEYSTRING",
    "ETSY_API_SHARED_SECRET",
    "ETSY_API_TIMEOUT_MS",
    "ETSY_INTEGRATION_ENABLED",
    "ETSY_LISTING_PACK_MAP",
    "ETSY_OAUTH_ACCESS_TOKEN",
    "ETSY_OAUTH_EXPIRES_AT",
    "ETSY_OAUTH_REFRESH_TOKEN",
    "ETSY_SHOP_ID",
    "ETSY_WEBHOOK_SIGNING_SECRET",
    "ETSY_WEBHOOK_TOLERANCE_SECONDS",
    "RESEND_API_KEY",
    "RESEND_FROM_EMAIL",
    "RESEND_REPLY_TO_EMAIL",
  ];
  const previous = new Map(relevantKeys.map((key) => [key, process.env[key]]));
  for (const key of relevantKeys) delete process.env[key];
  Object.assign(process.env, {
    PUBLIC_BASE_URL: "https://invitelab.example/base/",
    CUSTOMER_SUPPORT_EMAIL: " support@invitelab.example ",
    ETSY_API_KEYSTRING: " etsy-key ",
    ETSY_API_SHARED_SECRET: " etsy-secret ",
    ETSY_API_TIMEOUT_MS: "1",
    ETSY_INTEGRATION_ENABLED: "1",
    ETSY_LISTING_PACK_MAP: '{"100":{"packType":"invite_only_pack","creationMode":"template"},"200":{"packType":"Full_pack","creationMode":"both"}}',
    ETSY_OAUTH_ACCESS_TOKEN: " access-token ",
    ETSY_OAUTH_EXPIRES_AT: "1785236400000",
    ETSY_OAUTH_REFRESH_TOKEN: " refresh-token ",
    ETSY_SHOP_ID: " 12345678 ",
    ETSY_WEBHOOK_SIGNING_SECRET: " whsec_test ",
    ETSY_WEBHOOK_TOLERANCE_SECONDS: "99999",
    RESEND_API_KEY: " resend-key ",
    RESEND_FROM_EMAIL: " InviteLab <orders@invitelab.example> ",
    RESEND_REPLY_TO_EMAIL: " support@invitelab.example ",
  });

  try {
    const config = await import(
      `${pathToFileURL(configPath).href}?etsy-config-test=${Date.now()}`
    );
    assert.equal(config.ETSY_INTEGRATION_ENABLED, true);
    assert.equal(config.ETSY_SHOP_ID, "12345678");
    assert.equal(config.ETSY_API_KEYSTRING, "etsy-key");
    assert.equal(config.ETSY_API_SHARED_SECRET, "etsy-secret");
    assert.equal(config.ETSY_OAUTH_ACCESS_TOKEN, "access-token");
    assert.equal(config.ETSY_OAUTH_REFRESH_TOKEN, "refresh-token");
    assert.equal(config.ETSY_OAUTH_EXPIRES_AT, "1785236400000");
    assert.equal(config.ETSY_API_TIMEOUT_MS, 1_000);
    assert.equal(config.ETSY_WEBHOOK_TOLERANCE_SECONDS, 900);
    assert.equal(config.CUSTOMER_PORTAL_URL, "https://invitelab.example/base/wedding");
    assert.equal(config.CUSTOMER_SUPPORT_EMAIL, "support@invitelab.example");
    assert.equal(config.RESEND_FROM_EMAIL, "InviteLab <orders@invitelab.example>");
  } finally {
    for (const key of relevantKeys) {
      const value = previous.get(key);
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }

  const envExample = await fs.readFile(envExamplePath, "utf8");
  for (const key of relevantKeys.filter((key) => key !== "PUBLIC_BASE_URL")) {
    assert.match(envExample, new RegExp(`^${key}=`, "m"), `${key} is missing from .env.example`);
  }
  assert.match(
    envExample,
    /^ETSY_LISTING_PACK_MAP=\{.*"invite_only_pack".*"creationMode".*"digital_pdf_pack".*"Full_pack".*\}$/m,
  );
});

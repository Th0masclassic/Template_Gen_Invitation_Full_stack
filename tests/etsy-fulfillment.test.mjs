import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { createAccessCodeStore } from "../access-code-store.mjs";
import {
  EtsyFulfillmentError,
  createEtsyApiClient,
  createEtsyFulfillmentService,
  createEtsyOAuthTokenProvider,
  parseEtsyListingPackMap,
  parseEtsyReceiptResourceUrl,
  parseEtsyWebhookPayload,
  verifyEtsyWebhookSignature,
} from "../etsy-fulfillment.mjs";

const SHOP_ID = "12345678";
const RECEIPT_ID = "987654321";
const LISTING_ID = "111222333";
const WEBHOOK_ID = "msg_etsy_test_1";
const WEBHOOK_TIMESTAMP = "1785232800";
const NOW_MS = Number(WEBHOOK_TIMESTAMP) * 1000;
const SECRET_BYTES = Buffer.from("0123456789abcdef0123456789abcdef", "utf8");
const WEBHOOK_SECRET = `whsec_${SECRET_BYTES.toString("base64")}`;

function paidBody(eventType = "order.paid") {
  return Buffer.from(JSON.stringify({
    event_type: eventType,
    resource_url: `https://openapi.etsy.com/v3/application/shops/${SHOP_ID}/receipts/${RECEIPT_ID}`,
    shop_id: Number(SHOP_ID),
  }));
}

function signature(body, {
  webhookId = WEBHOOK_ID,
  timestamp = WEBHOOK_TIMESTAMP,
} = {}) {
  return crypto
    .createHmac("sha256", SECRET_BYTES)
    .update(Buffer.concat([
      Buffer.from(`${webhookId}.${timestamp}.`),
      body,
    ]))
    .digest("base64");
}

function signedWebhook(body, options = {}) {
  const webhookId = options.webhookId || WEBHOOK_ID;
  const webhookTimestamp = options.webhookTimestamp || WEBHOOK_TIMESTAMP;
  return {
    rawBody: body,
    webhookId,
    webhookTimestamp,
    webhookSignature: `v1,invalid-base64 v1,${signature(body, {
      webhookId,
      timestamp: webhookTimestamp,
    })}`,
  };
}

test("Etsy webhook verification uses raw bytes, accepts v1 signature entries, and rejects replay/tampering", () => {
  const body = paidBody("ORDER_PAID");
  const request = signedWebhook(body);

  assert.equal(verifyEtsyWebhookSignature({
    ...request,
    signingSecret: WEBHOOK_SECRET,
    now: NOW_MS,
  }), true);
  assert.equal(verifyEtsyWebhookSignature({
    ...request,
    rawBody: Buffer.from(`${body.toString("utf8")} `),
    signingSecret: WEBHOOK_SECRET,
    now: NOW_MS,
  }), false);
  assert.equal(verifyEtsyWebhookSignature({
    ...request,
    signingSecret: WEBHOOK_SECRET,
    now: NOW_MS + (301 * 1000),
  }), false);

  const payload = parseEtsyWebhookPayload(body, { expectedShopId: SHOP_ID });
  assert.equal(payload.eventType, "order.paid");
  assert.equal(payload.shopId, SHOP_ID);
  assert.equal(payload.receiptId, RECEIPT_ID);
  assert.equal(
    payload.resourceUrl,
    `https://api.etsy.com/v3/application/shops/${SHOP_ID}/receipts/${RECEIPT_ID}`,
  );
});

test("listing pack map is listing-ID based and receipt resource URLs reject SSRF shapes", () => {
  const mapping = parseEtsyListingPackMap(JSON.stringify({
    [LISTING_ID]: "normal",
    444555666: "Full_pack",
  }));
  assert.deepEqual(mapping.get(LISTING_ID), { packType: "invite_only_pack", creationMode: "template" });
  assert.deepEqual(mapping.get("444555666"), { packType: "Full_pack", creationMode: "both" });

  assert.throws(
    () => parseEtsyReceiptResourceUrl(
      `https://attacker.example/v3/application/shops/${SHOP_ID}/receipts/${RECEIPT_ID}`,
      SHOP_ID,
    ),
    (error) => error instanceof EtsyFulfillmentError
      && error.code === "ETSY_RESOURCE_URL_REJECTED",
  );
  assert.throws(
    () => parseEtsyReceiptResourceUrl(
      `https://api.etsy.com/v3/application/shops/${SHOP_ID}/receipts/${RECEIPT_ID}?redirect=https://attacker.example`,
      SHOP_ID,
    ),
    (error) => error instanceof EtsyFulfillmentError
      && error.code === "ETSY_RESOURCE_URL_REJECTED",
  );
});

test("paid Etsy order creates a pack-bound code and sends exactly one idempotent email", async (context) => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "invitelab-etsy-store-"));
  context.after(() => fs.rm(tempDir, { recursive: true, force: true }));
  const accessCodeStore = createAccessCodeStore({
    filePath: path.join(tempDir, "access-codes.json"),
  });
  await accessCodeStore.initialize();

  let receiptStatus = "paid";
  const etsyApiClient = {
    async fetchReceipt() {
      return {
        receipt_id: Number(RECEIPT_ID),
        shop_id: Number(SHOP_ID),
        status: receiptStatus,
        is_paid: receiptStatus === "paid",
        is_canceled: receiptStatus === "canceled",
        buyer_email: "buyer@example.com",
        name: "Ana & Tiago",
        transactions: [{
          transaction_id: 998877,
          listing_id: Number(LISTING_ID),
          quantity: 1,
        }],
      };
    },
  };
  const sent = [];
  const emailService = {
    async sendPurchaseAccessEmail(input) {
      sent.push(input);
      return { providerMessageId: "resend_message_1" };
    },
  };
  const fulfillment = createEtsyFulfillmentService({
    shopId: SHOP_ID,
    webhookSecret: WEBHOOK_SECRET,
    listingPackMap: { [LISTING_ID]: { packType: "invite_only_pack", creationMode: "template" } },
    accessCodeStore,
    emailService,
    etsyApiClient,
    now: () => NOW_MS,
  });

  const request = signedWebhook(paidBody());
  const first = await fulfillment.handleWebhook(request);
  const duplicate = await fulfillment.handleWebhook(request);

  assert.equal(first.status, "fulfilled");
  assert.equal(first.codesCreated, 1);
  assert.equal(first.emailsDelivered, 1);
  assert.equal(duplicate.codesCreated, 0);
  assert.equal(duplicate.emailsAlreadyDelivered, 1);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].to, "buyer@example.com");
  assert.equal(sent[0].packType, "invite_only_pack");
  assert.equal(sent[0].eventType, "wedding");
  assert.match(sent[0].accessCode, /^\d{6}$/);
  assert.equal(
    sent[0].idempotencyKey,
    `etsy-order-paid/etsy:${SHOP_ID}:${RECEIPT_ID}:998877:1/purchase-access-v1`,
  );

  let [record] = await accessCodeStore.list();
  assert.equal(record.source, "etsy");
  assert.equal(record.packType, "invite_only_pack");
  assert.equal(record.creationMode, "template");
  assert.equal(record.eventType, "wedding");
  assert.equal(record.emailDelivery.state, "delivered");

  receiptStatus = "canceled";
  const canceledBody = paidBody("order.canceled");
  const canceled = await fulfillment.handleWebhook(signedWebhook(canceledBody));
  assert.equal(canceled.status, "canceled");
  assert.equal(canceled.revoked, 1);
  [record] = await accessCodeStore.list();
  assert.equal(record.state, "revoked");
});

test("failed purchase email is recorded and the same stable email can be retried", async (context) => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "invitelab-etsy-retry-"));
  context.after(() => fs.rm(tempDir, { recursive: true, force: true }));
  const accessCodeStore = createAccessCodeStore({
    filePath: path.join(tempDir, "access-codes.json"),
  });
  await accessCodeStore.initialize();
  const receipt = {
    receipt_id: Number(RECEIPT_ID),
    shop_id: Number(SHOP_ID),
    status: "paid",
    is_paid: true,
    buyer_email: "buyer@example.com",
    transactions: [{
      transaction_id: 445566,
      listing_id: Number(LISTING_ID),
      quantity: 1,
    }],
  };
  let shouldFail = true;
  const idempotencyKeys = [];
  const fulfillment = createEtsyFulfillmentService({
    shopId: SHOP_ID,
    webhookSecret: WEBHOOK_SECRET,
    listingPackMap: { [LISTING_ID]: "Full_pack" },
    accessCodeStore,
    etsyApiClient: { async fetchReceipt() { return receipt; } },
    emailService: {
      async sendPurchaseAccessEmail(input) {
        idempotencyKeys.push(input.idempotencyKey);
        if (shouldFail) {
          shouldFail = false;
          throw Object.assign(new Error("temporary"), {
            code: "RESEND_RATE_LIMITED",
            statusCode: 502,
            retryable: true,
          });
        }
        return { providerMessageId: "resend_after_retry" };
      },
    },
    now: () => NOW_MS,
  });
  const request = signedWebhook(paidBody());

  await assert.rejects(
    fulfillment.handleWebhook(request),
    (error) => error instanceof EtsyFulfillmentError
      && error.code === "ETSY_PURCHASE_EMAIL_FAILED"
      && error.retryable,
  );
  let [record] = await accessCodeStore.list();
  assert.equal(record.emailDelivery.state, "failed");

  const retried = await fulfillment.handleWebhook(request);
  assert.equal(retried.emailsDelivered, 1);
  assert.equal(idempotencyKeys.length, 2);
  assert.equal(idempotencyKeys[0], idempotencyKeys[1]);
  [record] = await accessCodeStore.list();
  assert.equal(record.emailDelivery.state, "delivered");
});

test("an idempotent Etsy retry cannot silently change the stored pack", async (context) => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "invitelab-etsy-pack-mismatch-"));
  context.after(() => fs.rm(tempDir, { recursive: true, force: true }));
  const accessCodeStore = createAccessCodeStore({
    filePath: path.join(tempDir, "access-codes.json"),
  });
  await accessCodeStore.initialize();
  const receipt = {
    receipt_id: Number(RECEIPT_ID),
    shop_id: Number(SHOP_ID),
    status: "paid",
    is_paid: true,
    buyer_email: "buyer@example.com",
    transactions: [{
      transaction_id: 778899,
      listing_id: Number(LISTING_ID),
      quantity: 1,
    }],
  };
  const request = signedWebhook(paidBody());
  const shared = {
    shopId: SHOP_ID,
    webhookSecret: WEBHOOK_SECRET,
    accessCodeStore,
    etsyApiClient: { async fetchReceipt() { return receipt; } },
    now: () => NOW_MS,
  };
  const first = createEtsyFulfillmentService({
    ...shared,
    listingPackMap: { [LISTING_ID]: "invite_only_pack" },
    emailService: {
      async sendPurchaseAccessEmail() {
        throw Object.assign(new Error("temporary"), { code: "RESEND_RATE_LIMITED", retryable: true });
      },
    },
  });
  await assert.rejects(first.handleWebhook(request), /purchase email/i);

  let secondEmailCalled = false;
  const remapped = createEtsyFulfillmentService({
    ...shared,
    listingPackMap: { [LISTING_ID]: "Full_pack" },
    emailService: {
      async sendPurchaseAccessEmail() {
        secondEmailCalled = true;
        return { providerMessageId: "must-not-send" };
      },
    },
  });
  await assert.rejects(
    remapped.handleWebhook(request),
    (error) => error instanceof EtsyFulfillmentError
      && error.code === "ETSY_EXTERNAL_ORDER_PACK_MISMATCH"
      && error.retryable === false,
  );
  assert.equal(secondEmailCalled, false);
  const [record] = await accessCodeStore.list();
  assert.equal(record.packType, "invite_only_pack");
});

test("Etsy API client uses x-api-key and OAuth, canonicalizes the URL, and fetches missing transactions", async () => {
  const requests = [];
  const apiClient = createEtsyApiClient({
    shopId: SHOP_ID,
    keystring: "etsy_key",
    sharedSecret: "etsy_secret",
    tokenProvider: {
      async getAccessToken() {
        return "123456.oauth-token";
      },
    },
    fetchImpl: async (url, options) => {
      requests.push({ url, options });
      if (String(url).endsWith("/transactions")) {
        return new Response(JSON.stringify({
          count: 1,
          results: [{ transaction_id: 1, listing_id: Number(LISTING_ID), quantity: 1 }],
        }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({
        receipt_id: Number(RECEIPT_ID),
        shop_id: Number(SHOP_ID),
        status: "paid",
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    },
  });

  const receipt = await apiClient.fetchReceipt(
    `https://openapi.etsy.com/v3/application/shops/${SHOP_ID}/receipts/${RECEIPT_ID}`,
  );
  assert.equal(requests.length, 2);
  assert.equal(
    requests[0].url,
    `https://api.etsy.com/v3/application/shops/${SHOP_ID}/receipts/${RECEIPT_ID}`,
  );
  assert.equal(requests[0].options.redirect, "error");
  assert.equal(requests[0].options.headers["x-api-key"], "etsy_key:etsy_secret");
  assert.equal(requests[0].options.headers.Authorization, "Bearer 123456.oauth-token");
  assert.equal(receipt.transactions.length, 1);
});

test("Etsy OAuth token provider refreshes with PKCE-issued refresh token credentials", async () => {
  let captured = null;
  const provider = createEtsyOAuthTokenProvider({
    keystring: "etsy_key",
    refreshToken: "123.refresh-token",
    now: () => NOW_MS,
    fetchImpl: async (url, options) => {
      captured = { url, options };
      return new Response(JSON.stringify({
        access_token: "123.new-access-token",
        refresh_token: "123.new-refresh-token",
        expires_in: 3600,
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    },
  });

  assert.equal(await provider.getAccessToken(), "123.new-access-token");
  assert.equal(captured.url, "https://api.etsy.com/v3/public/oauth/token");
  assert.match(captured.options.body, /grant_type=refresh_token/);
  assert.match(captured.options.body, /client_id=etsy_key/);
  assert.match(captured.options.body, /refresh_token=123\.refresh-token/);
  assert.equal(provider.snapshot().refreshToken, "123.new-refresh-token");
  assert.equal(await provider.getAccessToken(), "123.new-access-token");
});

test("Etsy OAuth token provider retries persistence before exposing a rotated token", async () => {
  let refreshRequests = 0;
  let persistenceAttempts = 0;
  let persistedToken = null;
  const provider = createEtsyOAuthTokenProvider({
    keystring: "etsy_key",
    refreshToken: "123.original-refresh-token",
    now: () => NOW_MS,
    fetchImpl: async () => {
      refreshRequests += 1;
      return new Response(JSON.stringify({
        access_token: "123.rotated-access-token",
        refresh_token: "123.rotated-refresh-token",
        expires_in: 3600,
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    },
    async onToken(token) {
      persistenceAttempts += 1;
      if (persistenceAttempts === 1) throw new Error("temporary disk failure");
      persistedToken = token;
    },
  });

  await assert.rejects(
    provider.getAccessToken(),
    (error) => error instanceof EtsyFulfillmentError
      && error.code === "ETSY_OAUTH_TOKEN_PERSIST_FAILED"
      && error.retryable,
  );
  assert.equal(refreshRequests, 1);
  assert.equal(persistenceAttempts, 1);

  assert.equal(await provider.getAccessToken(), "123.rotated-access-token");
  assert.equal(refreshRequests, 1, "A persistence retry must not rotate the OAuth token again.");
  assert.equal(persistenceAttempts, 2);
  assert.deepEqual(persistedToken, {
    accessToken: "123.rotated-access-token",
    refreshToken: "123.rotated-refresh-token",
    expiresAt: NOW_MS + 3_600_000,
  });
});

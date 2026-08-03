import assert from "node:assert/strict";
import crypto from "node:crypto";
import test from "node:test";

import {
  createStripeCheckoutHandoffToken,
  createStripeCheckoutService,
  verifyStripeCheckoutHandoffToken,
  verifyStripeWebhookSignature,
} from "../stripe-checkout.mjs";

test("Stripe browser handoff is signed, browser-bound and expires", () => {
  const secret = crypto.randomBytes(32);
  const now = 1_800_000_000_000;
  const handoff = {
    checkoutToken: "3e65ccdf-67ad-4df3-8777-4b55b32b6ed0",
    packType: "digital_pdf_pack",
    eventType: "wedding",
  };
  const token = createStripeCheckoutHandoffToken(handoff, secret, { now, maxAgeSeconds: 600 });

  assert.deepEqual(
    verifyStripeCheckoutHandoffToken(token, secret, { now: now + 599_000 }),
    { ...handoff, exp: Math.floor(now / 1000) + 600 },
  );
  assert.equal(verifyStripeCheckoutHandoffToken(`${token}x`, secret, { now }), null);
  assert.equal(verifyStripeCheckoutHandoffToken(token, crypto.randomBytes(32), { now }), null);
  assert.equal(verifyStripeCheckoutHandoffToken(token, secret, { now: now + 600_000 }), null);
});

test("Stripe webhook verification accepts only the exact fresh raw payload", () => {
  const secret = "whsec_invitelab_test_secret";
  const payload = Buffer.from('{"id":"evt_test","type":"checkout.session.completed"}');
  const timestamp = 1_800_000_000;
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.`)
    .update(payload)
    .digest("hex");
  const header = `t=${timestamp},v1=${signature}`;

  assert.equal(verifyStripeWebhookSignature(payload, header, secret, { now: timestamp * 1000 }), true);
  assert.equal(verifyStripeWebhookSignature(Buffer.from(`${payload} `), header, secret, { now: timestamp * 1000 }), false);
  assert.equal(verifyStripeWebhookSignature(payload, header, secret, { now: (timestamp + 301) * 1000 }), false);
});

test("Checkout uses one server-selected Price and a stable idempotency key", async () => {
  const calls = [];
  const fetchImpl = async (url, options = {}) => {
    calls.push({ url, options });
    if (String(url).includes("/checkout/sessions/cs_test_")) {
      return new Response(JSON.stringify({
        id: "cs_test_abcdefghijklmnop",
        payment_status: "paid",
        customer_details: { email: "buyer@example.com" },
        line_items: { data: [{ quantity: 1, price: { id: "price_abcdefgh1234" } }] },
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify({
      id: "cs_test_abcdefghijklmnop",
      url: "https://checkout.stripe.com/c/pay/cs_test_abcdefghijklmnop",
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  };
  const service = createStripeCheckoutService({
    secretKey: "sk_test_invitelab_test_key",
    webhookSecret: "whsec_invitelab_test_secret",
    fetchImpl,
  });

  const created = await service.createCheckoutSession({
    priceId: "price_abcdefgh1234",
    successUrl: "https://invitelab.example/?checkout=success",
    cancelUrl: "https://invitelab.example/?checkout=cancelled",
    clientReferenceId: "3e65ccdf-67ad-4df3-8777-4b55b32b6ed0",
    metadata: { packType: "digital_pdf_pack", eventType: "wedding" },
    idempotencyKey: "checkout-stable-key",
  });
  assert.equal(created.id, "cs_test_abcdefghijklmnop");
  assert.equal(calls[0].options.headers["Idempotency-Key"], "checkout-stable-key");
  const form = new URLSearchParams(calls[0].options.body);
  assert.equal(form.get("mode"), "payment");
  assert.equal(form.get("payment_method_types[0]"), null);
  assert.equal(form.get("line_items[0][price]"), "price_abcdefgh1234");
  assert.equal(form.get("line_items[0][quantity]"), "1");
  assert.equal(form.get("customer_creation"), "always");
  assert.equal(form.get("metadata[packType]"), "digital_pdf_pack");

  const retrieved = await service.retrieveCheckoutSession(created.id);
  assert.equal(retrieved.payment_status, "paid");
  assert.equal(retrieved.line_items.data[0].price.id, "price_abcdefgh1234");
  assert.match(calls[1].url, /expand%5B%5D=line_items/);
});

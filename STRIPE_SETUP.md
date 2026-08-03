# Stripe Checkout setup

InviteLab uses Stripe-hosted Checkout with one-time Prices. A successful website purchase creates one pack entitlement and opens the correct wedding or baby-shower builder automatically in the same browser. The six-digit code is still emailed as a fallback for another browser or device.

## 1. Create the three Stripe products and Prices

In Stripe Dashboard, select **Test mode** first and open **Product catalog**.

Create these three products, each with one **one-time** Price:

1. `Template Generator Only`
2. `Template + Digital Invite`
3. `Full Pack`

Copy each `price_...` ID. The amount and currency are controlled entirely by these Stripe Prices; the browser cannot choose a price.

## 2. Configure the local `.env`

Copy the relevant values from `.env.example` into `.env`:

```dotenv
PUBLIC_BASE_URL=http://127.0.0.1:3000
ACCESS_CODE_REQUIRED=1
ACCESS_CODE_SESSION_SECRET=replace-with-a-long-random-secret

STRIPE_ENABLED=1
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_TEMPLATE_ONLY=price_...
STRIPE_PRICE_DIGITAL_INVITE=price_...
STRIPE_PRICE_FULL_PACK=price_...
STRIPE_API_TIMEOUT_MS=15000
STRIPE_WEBHOOK_TOLERANCE_SECONDS=300
```

Keep `ACCESS_CODE_REQUIRED=1`. Website buyers do not type a code, but the same signed access system enforces the pack they paid for.

For fallback purchase emails, also configure:

```dotenv
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=InviteLab <orders@your-domain.example>
RESEND_REPLY_TO_EMAIL=support@your-domain.example
CUSTOMER_SUPPORT_EMAIL=support@your-domain.example
CUSTOMER_PORTAL_URL=https://your-domain.example
```

## 3. Test the webhook locally

Install and authenticate the Stripe CLI, then run:

```powershell
stripe login
stripe listen --events checkout.session.completed,checkout.session.async_payment_succeeded --forward-to http://127.0.0.1:3000/api/integrations/stripe/webhook
```

The CLI prints a temporary `whsec_...` secret. Put that exact value in `STRIPE_WEBHOOK_SECRET` for the local test and restart the server:

```powershell
npm start
```

Open `http://127.0.0.1:3000`, choose an event and pack, and pay with Stripe's test card:

- Card: `4242 4242 4242 4242`
- Expiry: any future date
- CVC: any three digits
- Postal code: any valid value

Expected result:

1. Stripe emits `checkout.session.completed`.
2. InviteLab validates the raw signed webhook and retrieves the Session from Stripe.
3. The server maps the purchased `price_...` to one pack and creates one idempotent entitlement.
4. Stripe returns the browser to InviteLab.
5. InviteLab verifies the signed browser handoff, sets the private access cookie and redirects to `/wedding` or `/babyshower`.
6. The builder shows the purchased pack and does not ask for a code.
7. A fallback code email is sent once.

## 4. Create the production webhook

In Stripe Dashboard, switch to **Live mode**, then open **Workbench → Webhooks** and create an account webhook endpoint:

```text
https://YOUR_PUBLIC_DOMAIN/api/integrations/stripe/webhook
```

Subscribe only to:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`

Reveal the endpoint's live `whsec_...` secret and use it as the production `STRIPE_WEBHOOK_SECRET`. The test/CLI webhook secret and production webhook secret are different.

## 5. Configure production values

Use the live keys and live Price IDs:

```dotenv
PUBLIC_BASE_URL=https://YOUR_PUBLIC_DOMAIN
ACCESS_CODE_REQUIRED=1
ACCESS_CODE_SESSION_SECRET=a-long-stable-production-secret
STRIPE_ENABLED=1
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_TEMPLATE_ONLY=price_...
STRIPE_PRICE_DIGITAL_INVITE=price_...
STRIPE_PRICE_FULL_PACK=price_...
```

`PUBLIC_BASE_URL` must be the public HTTPS origin that Stripe should return customers to. Restart or redeploy after changing environment variables.

## 6. Production verification

Complete one low-value live purchase for each pack and confirm:

- the correct amount and currency appear in Stripe Checkout;
- the browser returns directly to the correct builder;
- the purchased pack is fixed in the creation page;
- no code form appears in that browser;
- the fallback email arrives once;
- Stripe Dashboard shows HTTP `200` for the webhook;
- repeating a webhook delivery does not create another entitlement or email.

Do not grant access from browser metadata or from the success URL alone. InviteLab grants access only after retrieving a paid Checkout Session, validating its server-configured Price, and matching the signed browser handoff.


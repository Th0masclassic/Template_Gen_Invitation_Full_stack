/**
 * Server configuration.
 *
 * Keep secrets out of source code. In PowerShell:
 *   $env:OPENAI_API_KEY="sk-..."
 *   $env:CANVA_MCP_ENABLED="1"
 *   $env:CANVA_MCP_TRANSPORT="stdio"
 *   $env:CANVA_MCP_REMOTE_DEBUG="1"  # optional
 *   $env:CANVA_CHATGPT_HANDOFF_ENABLED="1"
 *   npm start
 */
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
export const PORT = Number(process.env.PORT || 3000);
export const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || "";

// Etsy/customer access-code gate. Enabled by default; set to 0 only for controlled local testing.
export const ACCESS_CODE_REQUIRED = process.env.ACCESS_CODE_REQUIRED !== "0";
export const ACCESS_CODE_STORE_PATH = String(process.env.ACCESS_CODE_STORE_PATH || "generated/access-codes.json").trim();
export const ACCESS_CODE_SESSION_SECRET = String(process.env.ACCESS_CODE_SESSION_SECRET || "").trim();
export const ACCESS_CODE_COOKIE_NAME = String(process.env.ACCESS_CODE_COOKIE_NAME || "invitelab_access").trim() || "invitelab_access";
export const ACCESS_CODE_SESSION_MAX_AGE_SECONDS = Math.max(3600, Math.min(365 * 24 * 60 * 60, Number.parseInt(process.env.ACCESS_CODE_SESSION_MAX_AGE_SECONDS || String(180 * 24 * 60 * 60), 10) || 180 * 24 * 60 * 60));

// Etsy order webhooks and purchase-fulfillment email.
export const ETSY_INTEGRATION_ENABLED = process.env.ETSY_INTEGRATION_ENABLED === "1";
export const ETSY_SHOP_ID = String(process.env.ETSY_SHOP_ID || "").trim();
export const ETSY_API_KEYSTRING = String(process.env.ETSY_API_KEYSTRING || "").trim();
export const ETSY_API_SHARED_SECRET = String(process.env.ETSY_API_SHARED_SECRET || "").trim();
export const ETSY_WEBHOOK_SIGNING_SECRET = String(process.env.ETSY_WEBHOOK_SIGNING_SECRET || "").trim();
export const ETSY_OAUTH_ACCESS_TOKEN = String(process.env.ETSY_OAUTH_ACCESS_TOKEN || "").trim();
export const ETSY_OAUTH_REFRESH_TOKEN = String(process.env.ETSY_OAUTH_REFRESH_TOKEN || "").trim();
export const ETSY_OAUTH_EXPIRES_AT = String(process.env.ETSY_OAUTH_EXPIRES_AT || "").trim();
export const ETSY_LISTING_PACK_MAP = String(process.env.ETSY_LISTING_PACK_MAP || "").trim();
export const ETSY_API_TIMEOUT_MS = Math.max(
  1_000,
  Math.min(60_000, Number.parseInt(process.env.ETSY_API_TIMEOUT_MS || "15000", 10) || 15_000),
);
export const ETSY_WEBHOOK_TOLERANCE_SECONDS = Math.max(
  30,
  Math.min(900, Number.parseInt(process.env.ETSY_WEBHOOK_TOLERANCE_SECONDS || "300", 10) || 300),
);

// Stripe Checkout. Each Price ID must point to a one-time Price in the same
// Stripe account as STRIPE_SECRET_KEY. Fulfilment maps the purchased line item
// back to these server-side IDs; product metadata supplied by the browser is
// never trusted.
export const STRIPE_ENABLED = process.env.STRIPE_ENABLED === "1";
export const STRIPE_SECRET_KEY = String(process.env.STRIPE_SECRET_KEY || "").trim();
export const STRIPE_WEBHOOK_SECRET = String(process.env.STRIPE_WEBHOOK_SECRET || "").trim();
export const STRIPE_PRICE_TEMPLATE_ONLY = String(process.env.STRIPE_PRICE_TEMPLATE_ONLY || "").trim();
export const STRIPE_PRICE_DIGITAL_INVITE = String(process.env.STRIPE_PRICE_DIGITAL_INVITE || "").trim();
export const STRIPE_PRICE_FULL_PACK = String(process.env.STRIPE_PRICE_FULL_PACK || "").trim();
export const STRIPE_API_TIMEOUT_MS = Math.max(
  1_000,
  Math.min(60_000, Number.parseInt(process.env.STRIPE_API_TIMEOUT_MS || "15000", 10) || 15_000),
);
export const STRIPE_WEBHOOK_TOLERANCE_SECONDS = Math.max(
  30,
  Math.min(900, Number.parseInt(process.env.STRIPE_WEBHOOK_TOLERANCE_SECONDS || "300", 10) || 300),
);
export const RESEND_API_KEY = String(process.env.RESEND_API_KEY || "").trim();
export const RESEND_FROM_EMAIL = String(process.env.RESEND_FROM_EMAIL || "").trim();
export const RESEND_REPLY_TO_EMAIL = String(process.env.RESEND_REPLY_TO_EMAIL || "").trim();
export const CUSTOMER_SUPPORT_EMAIL = String(process.env.CUSTOMER_SUPPORT_EMAIL || "").trim();
export const AUTOMATION_ALERT_EMAIL = String(
  process.env.AUTOMATION_ALERT_EMAIL || "tomascoelhorocha@gmail.com",
).trim();
export const ETSY_REVIEW_URL = String(
  process.env.ETSY_REVIEW_URL || "https://www.etsy.com/your/purchases",
).trim();
export const CUSTOMER_PORTAL_URL = String(
  process.env.CUSTOMER_PORTAL_URL || `${PUBLIC_BASE_URL.replace(/\/+$/, "")}/wedding`,
).trim();

export const OPENAI_IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || "gpt-image-2";
export const OPENAI_WEBSITE_COPY_MODEL = process.env.OPENAI_WEBSITE_COPY_MODEL || "gpt-5.6-luna";
export const OPENAI_WEBSITE_COPY_TIMEOUT_MS = Math.max(10_000, Number.parseInt(process.env.OPENAI_WEBSITE_COPY_TIMEOUT_MS || "45000", 10) || 45_000);
export const OPENAI_MAPS_VERIFIER_MODEL = process.env.OPENAI_MAPS_VERIFIER_MODEL || "gpt-5.6-luna";
export const OPENAI_LAYER_PLANNER_MODEL = process.env.OPENAI_LAYER_PLANNER_MODEL || "gpt-5.6-luna";
export const OPENAI_PDF_HOTSPOT_FALLBACK_MODEL = process.env.OPENAI_PDF_HOTSPOT_FALLBACK_MODEL || "gpt-5.6-luna";
export const OPENAI_PPTX_QA_MODEL = process.env.OPENAI_PPTX_QA_MODEL || OPENAI_LAYER_PLANNER_MODEL;
export const OPENAI_LAYER_IMAGE_MODEL = process.env.OPENAI_LAYER_IMAGE_MODEL || OPENAI_IMAGE_MODEL;
export const OPENAI_LAYER_CONCURRENCY = Math.max(1, Math.min(3, Number(process.env.OPENAI_LAYER_CONCURRENCY || 2)));

export const OUTPUT_SIZE = process.env.OUTPUT_SIZE || "1024x1824";
export const OUTPUT_QUALITY = process.env.OUTPUT_QUALITY || "high";

const parsedGenerationConcurrency = Number.parseInt(process.env.MAX_CONCURRENT_GENERATIONS ?? "2", 10);
export const MAX_CONCURRENT_GENERATIONS = Number.isInteger(parsedGenerationConcurrency)
  ? Math.max(0, Math.min(4, parsedGenerationConcurrency))
  : 2;
export const MAX_GENERATION_QUEUE = Math.max(
  1,
  Math.min(30, Number.parseInt(process.env.MAX_GENERATION_QUEUE || "10", 10) || 10),
);
export const MAX_CONCURRENT_OPENAI_IMAGE_REQUESTS = Math.max(
  1,
  Math.min(3, Number.parseInt(process.env.MAX_CONCURRENT_OPENAI_IMAGE_REQUESTS || "2", 10) || 2),
);

export const FAL_KEY = String(process.env.FAL_KEY || process.env.FAL_API_KEY || "").trim();
export const FAL_QUEUE_BASE_URL = String(process.env.FAL_QUEUE_BASE_URL || "https://queue.fal.run").trim();
export const FAL_LAYER_MODEL_ID = String(process.env.FAL_LAYER_MODEL_ID || "fal-ai/qwen-image-layered").trim();
export const FAL_NUM_LAYERS = Math.min(10, Math.max(1, Number.parseInt(process.env.FAL_NUM_LAYERS || "8", 10) || 8));
export const FAL_NUM_INFERENCE_STEPS = Math.min(50, Math.max(1, Number.parseInt(process.env.FAL_NUM_INFERENCE_STEPS || "28", 10) || 28));
export const FAL_GUIDANCE_SCALE = Math.min(20, Math.max(1, Number(process.env.FAL_GUIDANCE_SCALE || 5) || 5));
export const FAL_ACCELERATION = ["none", "regular", "high"].includes(process.env.FAL_ACCELERATION)
  ? process.env.FAL_ACCELERATION
  : "regular";
export const FAL_ALPHA_TRIM_THRESHOLD = Math.min(64, Math.max(1, Number.parseInt(process.env.FAL_ALPHA_TRIM_THRESHOLD || "8", 10) || 8));
export const FAL_ALPHA_TRIM_PADDING = Math.min(32, Math.max(0, Number.parseInt(process.env.FAL_ALPHA_TRIM_PADDING || "3", 10) || 3));
export const FAL_LAYER_TIMEOUT_MS = Math.max(60_000, Number.parseInt(process.env.FAL_LAYER_TIMEOUT_MS || "300000", 10) || 300_000);
export const FAL_POLL_INTERVAL_MS = Math.max(500, Number.parseInt(process.env.FAL_POLL_INTERVAL_MS || "1500", 10) || 1_500);

export const YOUFORM_DEFAULT_FORM_URL = process.env.YOUFORM_DEFAULT_FORM_URL || "";
export const YOUFORM_WEBHOOK_SECRET = process.env.YOUFORM_WEBHOOK_SECRET || "";

export const R2_ACCOUNT_ID = String(process.env.R2_ACCOUNT_ID || "").trim();
export const R2_ACCESS_KEY_ID = String(process.env.R2_ACCESS_KEY_ID || "").trim();
export const R2_SECRET_ACCESS_KEY = String(process.env.R2_SECRET_ACCESS_KEY || "").trim();
export const R2_BUCKET_NAME = String(process.env.R2_BUCKET_NAME || "invitelab-invites-sites").trim();
export const R2_PUBLIC_BASE_URL = String(process.env.R2_PUBLIC_BASE_URL || "").trim().replace(/\/+$/, "");
export const MAX_CONCURRENT_SITE_PUBLISHES = Math.max(
  1,
  Math.min(3, Number(process.env.MAX_CONCURRENT_SITE_PUBLISHES || 2)),
);
export const SITE_PUBLISH_MAX_ATTEMPTS = Math.max(1, Math.min(5, Number.parseInt(process.env.SITE_PUBLISH_MAX_ATTEMPTS || "3", 10) || 3));
export const SITE_PUBLISH_RETRY_DELAY_MS = Math.max(1_000, Math.min(60_000, Number.parseInt(process.env.SITE_PUBLISH_RETRY_DELAY_MS || "5000", 10) || 5_000));

export const CANVA_IMPORT_ENABLED = process.env.CANVA_IMPORT_ENABLED === "1";
export const CANVA_ACCESS_TOKEN = process.env.CANVA_ACCESS_TOKEN || "";
export const CANVA_CLIENT_ID = process.env.CANVA_CLIENT_ID || "";
export const CANVA_CLIENT_SECRET = process.env.CANVA_CLIENT_SECRET || "";
export const CANVA_REDIRECT_URI = process.env.CANVA_REDIRECT_URI || `http://127.0.0.1:${PORT}/api/canva/auth/callback`;
export const CANVA_OPERATOR_AUTH_AT_STARTUP = process.env.CANVA_OPERATOR_AUTH_AT_STARTUP !== "0";
const canvaRequiredScopes = ["profile:read", "asset:read", "asset:write", "design:meta:read", "design:content:write", "brandtemplate:meta:read", "brandtemplate:content:write"];
export const CANVA_SCOPES = [...new Set([
  ...String(process.env.CANVA_SCOPES || "").split(/\s+/).filter(Boolean),
  ...canvaRequiredScopes,
])].join(" ");

export const CANVA_CHATGPT_HANDOFF_ENABLED = process.env.CANVA_CHATGPT_HANDOFF_ENABLED === undefined
  ? CANVA_IMPORT_ENABLED
  : process.env.CANVA_CHATGPT_HANDOFF_ENABLED === "1";
export const CANVA_CHATGPT_AUTOMATION_ENABLED = process.env.CANVA_CHATGPT_AUTOMATION_ENABLED === undefined
  ? CANVA_CHATGPT_HANDOFF_ENABLED
  : process.env.CANVA_CHATGPT_AUTOMATION_ENABLED === "1";
export const CANVA_CHATGPT_BROWSER_EXECUTABLE = String(process.env.CANVA_CHATGPT_BROWSER_EXECUTABLE || "").trim();
export const CANVA_CHATGPT_PROFILE_DIR = String(process.env.CANVA_CHATGPT_PROFILE_DIR || "").trim();
export const CANVA_CHATGPT_HEADLESS = process.env.CANVA_CHATGPT_HEADLESS === "1";
export const CANVA_CHATGPT_MANUAL_EDGE_CDP = process.env.CANVA_CHATGPT_MANUAL_EDGE_CDP !== "0";
export const CANVA_CHATGPT_TIMEOUT_MS = Math.max(
  120_000,
  Number.parseInt(process.env.CANVA_CHATGPT_TIMEOUT_MS || "600000", 10) || 600_000,
);
export const CANVA_CHATGPT_MAX_ATTEMPTS = Math.max(
  1,
  Math.min(5, Number.parseInt(process.env.CANVA_CHATGPT_MAX_ATTEMPTS || "3", 10) || 3),
);
export const CANVA_CHATGPT_PUBLISH_TEMPLATE = process.env.CANVA_CHATGPT_PUBLISH_TEMPLATE !== "0";
export const CANVA_PRIVATE_TEMPLATE_LINK_ENABLED = process.env.CANVA_PRIVATE_TEMPLATE_LINK_ENABLED !== "0";
export const CANVA_TEMPLATE_SHORTENING_ENABLED = process.env.CANVA_TEMPLATE_SHORTENING_ENABLED !== "0";
export const CANVA_TEMPLATE_LINK_TIMEOUT_MS = Math.max(
  5_000,
  Math.min(120_000, Number.parseInt(process.env.CANVA_TEMPLATE_LINK_TIMEOUT_MS || "30000", 10) || 30_000),
);
export const CANVA_TEMPLATE_LINK_MAX_ATTEMPTS = Math.max(
  1,
  Math.min(3, Number.parseInt(process.env.CANVA_TEMPLATE_LINK_MAX_ATTEMPTS || "3", 10) || 3),
);

/**
 * Canva MCP generation.
 *
 * MCP is now opt-in. The default Canva flow is a ChatGPT + @Canva Image To
 * Design handoff, because that path keeps Canva's own layer reconstruction in
 * control instead of recreating layers through MCP.
 */
export const CANVA_MCP_ENABLED = process.env.CANVA_MCP_ENABLED === undefined
  ? false
  : process.env.CANVA_MCP_ENABLED === "1";
export const CANVA_MCP_TRANSPORT = ["stdio", "http"].includes(String(process.env.CANVA_MCP_TRANSPORT || "stdio").toLowerCase())
  ? String(process.env.CANVA_MCP_TRANSPORT || "stdio").toLowerCase()
  : "stdio";
export const CANVA_MCP_REMOTE_COMMAND = String(process.env.CANVA_MCP_REMOTE_COMMAND || "").trim();
export const CANVA_MCP_REMOTE_PACKAGE = String(process.env.CANVA_MCP_REMOTE_PACKAGE || "mcp-remote@latest").trim();
export const CANVA_MCP_REMOTE_CALLBACK_PORT = Math.max(
  1024,
  Math.min(65535, Number.parseInt(process.env.CANVA_MCP_REMOTE_CALLBACK_PORT || "3334", 10) || 3334),
);
export const CANVA_MCP_REMOTE_AUTH_TIMEOUT_MS = Math.max(
  60_000,
  Number.parseInt(process.env.CANVA_MCP_REMOTE_AUTH_TIMEOUT_MS || "300000", 10) || 300_000,
);
export const CANVA_MCP_REMOTE_DEBUG = process.env.CANVA_MCP_REMOTE_DEBUG === "1";
export const CANVA_MCP_SERVER_URL = String(process.env.CANVA_MCP_SERVER_URL || "https://mcp.canva.com/mcp").trim();
export const CANVA_MCP_AUTHORIZE_URL = String(process.env.CANVA_MCP_AUTHORIZE_URL || "https://mcp.canva.com/authorize").trim();
export const CANVA_MCP_TOKEN_URL = String(process.env.CANVA_MCP_TOKEN_URL || "https://mcp.canva.com/token").trim();
export const CANVA_MCP_CLIENT_ID = String(process.env.CANVA_MCP_CLIENT_ID || "").trim();
export const CANVA_MCP_CLIENT_SECRET = String(process.env.CANVA_MCP_CLIENT_SECRET || "").trim();
export const CANVA_MCP_ACCESS_TOKEN = String(process.env.CANVA_MCP_ACCESS_TOKEN || "").trim();
export const CANVA_MCP_REDIRECT_URI = String(
  process.env.CANVA_MCP_REDIRECT_URI || `http://127.0.0.1:${PORT}/api/canva/mcp/auth/callback`,
).trim();
export const CANVA_MCP_SCOPES = String(process.env.CANVA_MCP_SCOPES || "").trim();
export const CANVA_MCP_PROTOCOL_VERSION = String(process.env.CANVA_MCP_PROTOCOL_VERSION || "2025-06-18").trim();
export const CANVA_MCP_DESIGN_TYPE = String(process.env.CANVA_MCP_DESIGN_TYPE || "card").trim();
export const CANVA_MCP_TIMEOUT_MS = Math.max(
  60_000,
  Number.parseInt(process.env.CANVA_MCP_TIMEOUT_MS || "120000", 10) || 120_000,
);
export const CANVA_MCP_PUBLISH_TEMPLATE = process.env.CANVA_MCP_PUBLISH_TEMPLATE !== "0";

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE_DIR = path.join(MODULE_DIR, "email-templates");
const RESEND_EMAILS_URL = "https://api.resend.com/emails";
const FIXED_PDF_DATE = new Date("2026-01-01T00:00:00.000Z");
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ACCESS_CODE_RE = /^\d{6}$/;
const ETSY_RECEIPT_RE = /^[1-9]\d{0,19}$/;

const PACK_DEFINITIONS = Object.freeze({
  invite_only_pack: Object.freeze({
    key: "template-only",
    name: "Template Generator Only",
    subject: "Your InviteLab access code — Template Generator Only",
    templateFile: "wedding.html",
    attachmentFile: "invitelab-template-generator-guide.pdf",
    accent: rgb(0.36, 0.42, 0.32),
    inclusions: Object.freeze([
      "Main invitation and localised Agenda artwork",
      "Editable Canva invitation template",
      "Up to 5 shared revision requests during the 24-hour creation window",
    ]),
  }),
  digital_pdf_pack: Object.freeze({
    key: "template-digital-invite",
    name: "Template + Digital Invite",
    subject: "Your InviteLab access code — Template + Digital Invite",
    templateFile: "wedding.html",
    attachmentFile: "invitelab-template-digital-invite-guide.pdf",
    accent: rgb(0.36, 0.42, 0.32),
    inclusions: Object.freeze([
      "Main invitation and localised Agenda artwork",
      "Editable Canva invitation and layered envelope preview",
      "Interactive digital PDF with location and calendar links",
    ]),
  }),
  Full_pack: Object.freeze({
    key: "full",
    name: "Full Pack",
    subject: "Your InviteLab access code — Full Pack",
    templateFile: "wedding.html",
    attachmentFile: "invitelab-full-pack-guide.pdf",
    accent: rgb(0.36, 0.42, 0.32),
    inclusions: Object.freeze([
      "Curated template or custom artwork, plus a localised Agenda",
      "Interactive PDF and layered gold-seal envelope",
      "Published event website with music, calendar, location and private RSVP administration",
    ]),
  }),
});

export class CustomerEmailError extends Error {
  constructor(code, message, {
    statusCode = 500,
    providerStatus = null,
    retryable = false,
    cause,
  } = {}) {
    super(message, cause ? { cause } : undefined);
    this.name = "CustomerEmailError";
    this.code = code;
    this.statusCode = statusCode;
    this.providerStatus = providerStatus;
    this.retryable = retryable;
  }
}

function cleanText(value, maxLength) {
  return String(value ?? "")
    .normalize("NFC")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function normalizeEmail(value, field) {
  const email = cleanText(value, 254).toLowerCase();
  if (!EMAIL_RE.test(email)) {
    throw new CustomerEmailError(
      "INVALID_EMAIL_ADDRESS",
      `${field} must be a valid email address.`,
      { statusCode: 400 },
    );
  }
  return email;
}

function normalizeFromAddress(value) {
  const from = cleanText(value, 320);
  const bracketMatch = from.match(/<([^<>]+)>$/);
  const address = bracketMatch ? bracketMatch[1] : from;
  if (!from || !EMAIL_RE.test(address.toLowerCase())) {
    throw new CustomerEmailError(
      "INVALID_FROM_ADDRESS",
      "The Resend sender address is invalid.",
      { statusCode: 500 },
    );
  }
  return from;
}

function normalizePackType(value) {
  if (["invite_only_pack", "template_only_pack", "normal", "invite-only"].includes(value)) return "invite_only_pack";
  if (["digital_pdf_pack", "digital", "digital-pdf"].includes(value)) return "digital_pdf_pack";
  if (value === "Full_pack" || String(value || "").toLowerCase() === "full") return "Full_pack";
  throw new CustomerEmailError(
    "INVALID_PURCHASE_PACK",
    "The purchase pack must be Template Generator Only, Template + Digital Invite, or Full Pack.",
    { statusCode: 400 },
  );
}

function normalizeEventType(value) {
  const eventType = String(value || "wedding").trim().toLowerCase().replaceAll("-", "_");
  return eventType === "baby_shower" ? "baby_shower" : "wedding";
}

function normalizePortalUrl(value) {
  let url;
  try {
    url = new URL(String(value || "").trim());
  } catch {
    throw new CustomerEmailError(
      "INVALID_CUSTOMER_PORTAL_URL",
      "The customer portal URL is invalid.",
      { statusCode: 500 },
    );
  }
  const localHttp = url.protocol === "http:"
    && ["127.0.0.1", "localhost", "::1"].includes(url.hostname);
  if (url.protocol !== "https:" && !localHttp) {
    throw new CustomerEmailError(
      "INVALID_CUSTOMER_PORTAL_URL",
      "The customer portal URL must use HTTPS.",
      { statusCode: 500 },
    );
  }
  url.username = "";
  url.password = "";
  url.hash = "";
  return url.toString();
}

function normalizeOptionalHttpsUrl(value, field) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new CustomerEmailError(
      "INVALID_EMAIL_LINK",
      `${field} must be a valid HTTPS URL.`,
      { statusCode: 500 },
    );
  }
  if (url.protocol !== "https:" || url.username || url.password) {
    throw new CustomerEmailError(
      "INVALID_EMAIL_LINK",
      `${field} must be a valid HTTPS URL.`,
      { statusCode: 500 },
    );
  }
  url.username = "";
  url.password = "";
  return url.toString();
}

function normalizeAccessCode(value) {
  const code = String(value ?? "").replace(/\D/g, "");
  if (!ACCESS_CODE_RE.test(code)) {
    throw new CustomerEmailError(
      "INVALID_ACCESS_CODE",
      "The purchase access code must contain exactly six digits.",
      { statusCode: 400 },
    );
  }
  return code;
}

function normalizeEtsyReceiptNumber(value) {
  const receiptNumber = String(value ?? "").trim();
  if (!ETSY_RECEIPT_RE.test(receiptNumber)) {
    throw new CustomerEmailError(
      "INVALID_ETSY_RECEIPT_NUMBER",
      "The Etsy receipt number must contain digits only.",
      { statusCode: 400 },
    );
  }
  return receiptNumber;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

function fillTemplate(template, values) {
  const unresolved = new Set();
  const rendered = template.replace(/\{\{([A-Z0-9_]+)\}\}/g, (_match, key) => {
    if (!(key in values)) {
      unresolved.add(key);
      return "";
    }
    return values[key];
  });
  if (unresolved.size) {
    throw new CustomerEmailError(
      "EMAIL_TEMPLATE_VARIABLE_MISSING",
      `Email template variables are missing: ${[...unresolved].join(", ")}.`,
      { statusCode: 500 },
    );
  }
  if (/\{\{[A-Z0-9_]+\}\}/.test(rendered)) {
    throw new CustomerEmailError(
      "EMAIL_TEMPLATE_NOT_FULLY_RENDERED",
      "The email template contains unresolved variables.",
      { statusCode: 500 },
    );
  }
  return rendered;
}

function splitLongWord(font, word, size, maxWidth) {
  const pieces = [];
  let current = "";
  for (const character of word) {
    const candidate = `${current}${character}`;
    if (current && font.widthOfTextAtSize(candidate, size) > maxWidth) {
      pieces.push(current);
      current = character;
    } else {
      current = candidate;
    }
  }
  if (current) pieces.push(current);
  return pieces;
}

function wrapPdfText(font, text, size, maxWidth) {
  const rawWords = String(text || "").split(/\s+/).filter(Boolean);
  const words = rawWords.flatMap((word) => (
    font.widthOfTextAtSize(word, size) > maxWidth
      ? splitLongWord(font, word, size, maxWidth)
      : [word]
  ));
  const lines = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && font.widthOfTextAtSize(candidate, size) > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

function drawWrappedText(page, text, {
  x,
  y,
  maxWidth,
  font,
  size,
  lineHeight,
  color,
}) {
  const lines = wrapPdfText(font, text, size, maxWidth);
  for (const line of lines) {
    page.drawText(line, { x, y, font, size, color });
    y -= lineHeight;
  }
  return y;
}

export async function createInstructionPdf({
  accessCode,
  packType,
  portalUrl,
  supportEmail,
} = {}) {
  const code = normalizeAccessCode(accessCode);
  const normalizedPackType = normalizePackType(packType);
  const definition = PACK_DEFINITIONS[normalizedPackType];
  const safePortalUrl = normalizePortalUrl(portalUrl);
  const safeSupportEmail = normalizeEmail(supportEmail, "supportEmail");

  const pdf = await PDFDocument.create();
  pdf.setTitle(`InviteLab guide - ${definition.name}`);
  pdf.setAuthor("InviteLab");
  pdf.setCreator("InviteLab");
  pdf.setProducer("InviteLab");
  pdf.setSubject("How to use the access code and create an InviteLab event invitation.");
  pdf.setKeywords(["InviteLab", "event", "invitation", "agenda", "guide"]);
  pdf.setCreationDate(FIXED_PDF_DATE);
  pdf.setModificationDate(FIXED_PDF_DATE);

  const page = pdf.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();
  const serif = await pdf.embedFont(StandardFonts.TimesRoman);
  const serifBold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const sans = await pdf.embedFont(StandardFonts.Helvetica);
  const sansBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const paper = rgb(0.985, 0.974, 0.935);
  const ink = rgb(0.12, 0.15, 0.12);
  const muted = rgb(0.36, 0.39, 0.35);
  const gold = rgb(0.72, 0.57, 0.29);
  const white = rgb(1, 1, 1);

  page.drawRectangle({ x: 0, y: 0, width, height, color: paper });
  page.drawRectangle({
    x: 0,
    y: height - 180,
    width,
    height: 180,
    color: definition.accent,
  });
  page.drawText("INVITELAB", {
    x: 48,
    y: height - 64,
    font: sansBold,
    size: 11,
    color: white,
    characterSpacing: 2.4,
  });
  page.drawText("Your invitation starts here.", {
    x: 48,
    y: height - 118,
    font: serif,
    size: 29,
    color: white,
  });
  page.drawText(definition.name, {
    x: 49,
    y: height - 148,
    font: sansBold,
    size: 12,
    color: rgb(0.94, 0.88, 0.72),
  });

  let y = height - 222;
  page.drawText("ACCESS CODE", {
    x: 48,
    y,
    font: sansBold,
    size: 9,
    color: definition.accent,
    characterSpacing: 1.4,
  });
  y -= 58;
  page.drawRectangle({
    x: 48,
    y: y - 8,
    width: width - 96,
    height: 64,
    color: white,
    borderColor: gold,
    borderWidth: 1,
  });
  const codeWidth = sansBold.widthOfTextAtSize(code, 27);
  page.drawText(code, {
    x: (width - codeWidth) / 2,
    y: y + 12,
    font: sansBold,
    size: 27,
    color: definition.accent,
    characterSpacing: 4,
  });
  y -= 44;
  y = drawWrappedText(page, "Keep this code safe. After the first use, it remains linked to your project while access is active.", {
    x: 48,
    y,
    maxWidth: width - 96,
    font: sans,
    size: 10.5,
    lineHeight: 15,
    color: muted,
  });

  y -= 22;
  page.drawText("HOW TO START", {
    x: 48,
    y,
    font: sansBold,
    size: 9,
    color: definition.accent,
    characterSpacing: 1.4,
  });
  y -= 25;
  const steps = definition.key === "full"
    ? [
      `Open ${safePortalUrl}, enter code ${code}, and add the event and Agenda details.`,
      "Review the invitation, Agenda and layered envelope together. You can request up to 5 shared revisions during the 24-hour creation window.",
      "Approve both and wait for the editable Canva link. Open it if you would like to make any final adjustments.",
      "Return to InviteLab and finish the Full Pack: keep or upload the final invitation, then complete the website copy and photos.",
      "InviteLab creates the interactive PDF and publishes the website. The finished links are also sent by email.",
    ]
    : definition.key === "template-digital-invite"
      ? [
        `Open ${safePortalUrl}, enter code ${code}, choose a template, and add the event and Agenda details.`,
        "Review the invitation, Agenda and layered envelope together, then approve the design.",
        "Open the Canva invitation template if you would like to make final adjustments.",
        "Download the interactive PDF, which includes the location and add-to-calendar links.",
      ]
    : [
      `Open ${safePortalUrl}, enter code ${code}, choose a template, and add the event and Agenda details.`,
      "Review the main invitation, Agenda and layered envelope preview together.",
      "Approve the design and wait for the editable Canva invitation link.",
      "Download the main invitation and Agenda artwork from your results page.",
    ];
  for (const [index, step] of steps.entries()) {
    page.drawCircle({
      x: 58,
      y: y + 4,
      size: 10,
      color: definition.accent,
    });
    const number = String(index + 1);
    const numberWidth = sansBold.widthOfTextAtSize(number, 8);
    page.drawText(number, {
      x: 58 - (numberWidth / 2),
      y: y + 1,
      font: sansBold,
      size: 8,
      color: white,
    });
    y = drawWrappedText(page, step, {
      x: 82,
      y,
      maxWidth: width - 130,
      font: sans,
      size: 10.2,
      lineHeight: 14.5,
      color: ink,
    });
    y -= 11;
  }

  y -= 5;
  page.drawText("YOUR PACK INCLUDES", {
    x: 48,
    y,
    font: sansBold,
    size: 9,
    color: definition.accent,
    characterSpacing: 1.4,
  });
  y -= 25;
  for (const inclusion of definition.inclusions) {
    page.drawRectangle({
      x: 51,
      y: y + 2,
      width: 5,
      height: 5,
      color: gold,
    });
    y = drawWrappedText(page, inclusion, {
      x: 68,
      y,
      maxWidth: width - 116,
      font: sans,
      size: 10.2,
      lineHeight: 14.5,
      color: ink,
    });
    y -= 7;
  }

  const footerY = 56;
  page.drawLine({
    start: { x: 48, y: footerY + 34 },
    end: { x: width - 48, y: footerY + 34 },
    color: rgb(0.83, 0.79, 0.68),
    thickness: 0.7,
  });
  page.drawText("Need help?", {
    x: 48,
    y: footerY + 12,
    font: serifBold,
    size: 11,
    color: ink,
  });
  page.drawText(safeSupportEmail, {
    x: 154,
    y: footerY + 12,
    font: sans,
    size: 9.5,
    color: definition.accent,
  });
  page.drawText("Please do not share your access code outside this project.", {
    x: 48,
    y: footerY - 8,
    font: sans,
    size: 8.5,
    color: muted,
  });

  return Buffer.from(await pdf.save({
    useObjectStreams: false,
    addDefaultPage: false,
  }));
}

export async function renderPurchaseAccessEmail({
  to,
  customerName = "",
  accessCode,
  packType,
  eventType = "wedding",
  portalUrl,
  supportEmail,
} = {}) {
  const recipient = normalizeEmail(to, "to");
  const code = normalizeAccessCode(accessCode);
  const normalizedPackType = normalizePackType(packType);
  const definition = PACK_DEFINITIONS[normalizedPackType];
  const normalizedEventType = normalizeEventType(eventType);
  const safePortalUrl = normalizePortalUrl(portalUrl);
  const safeSupportEmail = normalizeEmail(supportEmail, "supportEmail");
  const safeCustomerName = cleanText(customerName, 100);
  const greetingHtml = safeCustomerName
    ? `Hello <strong>${escapeHtml(safeCustomerName)}</strong>,`
    : "Hello,";
  const greetingText = safeCustomerName ? `Hello ${safeCustomerName},` : "Hello,";
  const template = await fs.readFile(
    path.join(TEMPLATE_DIR, definition.templateFile),
    "utf8",
  );
  const inclusionItems = definition.inclusions
    .map((item) => `<li style="margin:0 0 9px;">${escapeHtml(item)}</li>`)
    .join("");
  const html = fillTemplate(template, {
    ACCESS_CODE: escapeHtml(code),
    CUSTOMER_GREETING: greetingHtml,
    PACK_NAME: escapeHtml(definition.name),
    PACK_INCLUSIONS: inclusionItems,
    PORTAL_URL: escapeHtml(safePortalUrl),
    SUPPORT_EMAIL: escapeHtml(safeSupportEmail),
  });
  const inclusions = definition.inclusions.map((item) => `- ${item}`).join("\n");
  const text = `${greetingText}

Thank you for choosing InviteLab. Your ${definition.name} purchase is confirmed, and we are so happy to help make your celebration feel special.

Your access code is: ${code}

Open ${safePortalUrl} and enter the six digits manually. After the first use, the code stays linked to your project while access is active.

Your pack includes:
${inclusions}

A simple step-by-step guide is attached as a PDF.

Need help? ${safeSupportEmail}

The term 'Etsy' is a trademark of Etsy, Inc. This application uses the Etsy API but is not endorsed or certified by Etsy, Inc.`;
  const instructionPdf = await createInstructionPdf({
    accessCode: code,
    packType: normalizedPackType,
    portalUrl: safePortalUrl,
    supportEmail: safeSupportEmail,
  });

  return {
    recipient,
    packType: normalizedPackType,
    eventType: normalizedEventType,
    subject: definition.subject,
    html,
    text,
    attachments: [{
      filename: definition.attachmentFile,
      content: instructionPdf.toString("base64"),
    }],
  };
}

export function renderEtsyReceiptAccessEmail({
  to,
  customerName = "",
  receiptNumber,
  packType,
  portalUrl,
  supportEmail,
} = {}) {
  const recipient = normalizeEmail(to, "to");
  const receipt = normalizeEtsyReceiptNumber(receiptNumber);
  const normalizedPackType = normalizePackType(packType);
  const definition = PACK_DEFINITIONS[normalizedPackType];
  const safePortalUrl = normalizePortalUrl(portalUrl);
  const receiptPortalUrl = new URL("/etsy", safePortalUrl).toString();
  const safeSupportEmail = normalizeEmail(supportEmail, "supportEmail");
  const name = cleanText(customerName, 100);
  const inclusionsHtml = definition.inclusions
    .map((item) => `<li style="margin:0 0 9px;">${escapeHtml(item)}</li>`)
    .join("");
  const inclusionsText = definition.inclusions.map((item) => `- ${item}`).join("\n");
  return {
    recipient,
    packType: normalizedPackType,
    receiptNumber: receipt,
    subject: `Your InviteLab Etsy purchase is connected - ${definition.name}`,
    html: `<!doctype html>
<html lang="en">
<body style="margin:0;padding:0;background:#eef1e9;color:#293127;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#eef1e9;">
    <tr><td align="center" style="padding:30px 12px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:620px;background:#fffef9;border:1px solid #d9dfd3;border-radius:26px;overflow:hidden;">
        <tr><td style="padding:42px 42px 36px;background:#596b52;color:#fff;">
          <div style="font-size:11px;line-height:16px;letter-spacing:3px;font-weight:700;color:#e6ecdf;">INVITELAB &nbsp;·&nbsp; ETSY PURCHASE</div>
          <h1 style="margin:22px 0 10px;font-family:Georgia,'Times New Roman',serif;font-size:38px;line-height:44px;font-weight:400;">Your purchase is connected.</h1>
          <p style="margin:0;color:#eef2e9;font-size:15px;line-height:24px;">Your ${escapeHtml(definition.name)} is ready to start.</p>
        </td></tr>
        <tr><td style="padding:34px 42px 10px;">
          <p style="margin:0 0 14px;font-size:16px;line-height:26px;">Hello${name ? ` <strong>${escapeHtml(name)}</strong>` : ""},</p>
          <p style="margin:0;color:#5c6559;font-size:15px;line-height:25px;">We confirmed your paid Etsy order. The receipt number below is your private InviteLab credential; no separate six-digit code is required.</p>
        </td></tr>
        <tr><td style="padding:22px 42px;">
          <div style="padding:20px;border:1px solid #d7dece;border-radius:16px;background:#f3f6ef;text-align:center;">
            <div style="font-size:10px;line-height:14px;letter-spacing:2px;text-transform:uppercase;font-weight:700;color:#727d6d;">ETSY RECEIPT NUMBER</div>
            <div style="margin-top:8px;font-size:27px;line-height:34px;font-weight:800;letter-spacing:2px;color:#3f4e3a;">${escapeHtml(receipt)}</div>
          </div>
        </td></tr>
        <tr><td style="padding:4px 42px 28px;text-align:center;">
          <a href="${escapeHtml(receiptPortalUrl)}" style="display:inline-block;background:#596b52;color:#fff;padding:14px 24px;border-radius:999px;text-decoration:none;font-size:14px;font-weight:700;">Open your wedding studio</a>
          <p style="margin:16px 0 0;color:#687064;font-size:13px;line-height:21px;">Use the same receipt number whenever you return and to open RSVP Admin if your pack includes a wedding website.</p>
        </td></tr>
        <tr><td style="padding:24px 42px 28px;border-top:1px solid #e1e5dc;">
          <p style="margin:0 0 13px;font-size:14px;font-weight:700;">Your pack includes</p>
          <ul style="margin:0;padding-left:20px;color:#5c6559;font-size:14px;line-height:22px;">${inclusionsHtml}</ul>
        </td></tr>
        <tr><td style="padding:22px 42px;background:#e5eadf;color:#63705f;text-align:center;font-size:12px;line-height:19px;">Need help? ${escapeHtml(safeSupportEmail)}</td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    text: `Your InviteLab Etsy purchase is connected.\n\nHello${name ? ` ${name}` : ""},\n\nWe confirmed your paid Etsy order for ${definition.name}.\n\nYour Etsy receipt number is: ${receipt}\n\nThis receipt number is your private InviteLab credential. Open ${receiptPortalUrl} and enter it whenever you return. Use the same receipt number for RSVP Admin if your pack includes a wedding website.\n\nYour pack includes:\n${inclusionsText}\n\nNeed help? ${safeSupportEmail}`,
  };
}

export function renderDeliveryEmail({
  to,
  customerName = "",
  pdfUrl = "",
  canvaUrl = "",
  agendaUrl = "",
  websiteUrl = "",
  rsvpAdminUrl = "",
  packType = "",
  rsvpCredentialType = "access_code",
  rsvpCredentialValue = "",
  etsyReviewUrl = "https://www.etsy.com/your/purchases",
} = {}) {
  const recipient = normalizeEmail(to, "to");
  const name = cleanText(customerName, 100);
  const safeCanvaUrl = normalizeOptionalHttpsUrl(canvaUrl, "canvaUrl");
  const safeAgendaUrl = normalizeOptionalHttpsUrl(agendaUrl, "agendaUrl");
  const safePdfUrl = normalizeOptionalHttpsUrl(pdfUrl, "pdfUrl");
  const safeWebsiteUrl = normalizeOptionalHttpsUrl(websiteUrl, "websiteUrl");
  const safeRsvpAdminUrl = normalizeOptionalHttpsUrl(rsvpAdminUrl, "rsvpAdminUrl");
  const safeEtsyReviewUrl = normalizeOptionalHttpsUrl(etsyReviewUrl, "etsyReviewUrl");
  const hasRsvpAdmin = packType === "Full_pack" && safeWebsiteUrl && safeRsvpAdminUrl;
  const etsyReceiptNumber = rsvpCredentialType === "etsy_receipt"
    ? normalizeEtsyReceiptNumber(rsvpCredentialValue)
    : "";
  const rsvpCredentialHtml = etsyReceiptNumber
    ? `<strong>Private RSVP area:</strong> use Etsy receipt number <strong>${escapeHtml(etsyReceiptNumber)}</strong> to view responses and download the guest list.`
    : "<strong>Private RSVP area:</strong> use the same six-digit access code from your purchase email to view responses and download the guest list.";
  const rsvpCredentialText = etsyReceiptNumber
    ? `Your RSVP Admin is private. Use Etsy receipt number ${etsyReceiptNumber}.`
    : "Your RSVP Admin is private. Use the same six-digit access code from your purchase email.";
  const links = [
    ["Open your editable Canva invitation", safeCanvaUrl, "Canva"],
    ["Download your Agenda artwork", safeAgendaUrl, "Agenda"],
    ["Visit your event website", safeWebsiteUrl, "Website"],
    ["Open RSVP Admin", hasRsvpAdmin ? safeRsvpAdminUrl : "", "Private"],
    ["Open your interactive PDF", safePdfUrl, "PDF"],
  ].filter(([, url]) => Boolean(url));
  if (!links.length) {
    throw new CustomerEmailError(
      "DELIVERY_LINKS_NOT_READY",
      "At least one finished project link is required before sending the delivery email.",
      { statusCode: 409, retryable: true },
    );
  }
  const buttons = links.map(([label, url, eyebrow]) => `
    <tr>
      <td style="padding:0 0 12px;">
        <a href="${escapeHtml(url)}" style="display:block;border:1px solid #d9dfd3;border-radius:16px;padding:16px 18px;text-decoration:none;color:#263126;background:#fbfcf8;">
          <span style="display:block;color:#76816f;font-size:10px;line-height:14px;letter-spacing:2px;text-transform:uppercase;font-weight:700;">${escapeHtml(eyebrow)}</span>
          <span style="display:block;margin-top:4px;font-size:15px;line-height:22px;font-weight:700;">${escapeHtml(label)} &nbsp;→</span>
        </a>
      </td>
    </tr>`).join("");
  return {
    recipient,
    subject: "Your InviteLab invitation is ready 💚",
    html: `<!doctype html>
<html lang="en">
<body style="margin:0;padding:0;background:#eef1e9;color:#293127;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#eef1e9;">
    <tr><td align="center" style="padding:30px 12px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:620px;background:#fffef9;border:1px solid #d9dfd3;border-radius:26px;overflow:hidden;">
        <tr><td style="padding:42px 42px 36px;background:#596b52;color:#fff;">
          <div style="font-size:11px;line-height:16px;letter-spacing:3px;font-weight:700;color:#e6ecdf;">INVITELAB &nbsp;·&nbsp; MADE WITH CARE</div>
          <h1 style="margin:22px 0 10px;font-family:Georgia,'Times New Roman',serif;font-size:39px;line-height:45px;font-weight:400;">Your invitation is ready.</h1>
          <p style="margin:0;color:#eef2e9;font-size:15px;line-height:24px;">A little piece of your celebration, beautifully finished. ♡</p>
        </td></tr>
        <tr><td style="padding:34px 42px 8px;">
          <p style="margin:0 0 14px;font-size:16px;line-height:26px;">Hello${name ? ` <strong>${escapeHtml(name)}</strong>` : ""},</p>
          <p style="margin:0;color:#5c6559;font-size:15px;line-height:25px;">Thank you for trusting InviteLab with such a special moment. Everything that is ready for your order is collected below, so this email can stay as your simple way back to it.</p>
        </td></tr>
        <tr><td style="padding:24px 42px 12px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">${buttons}</table>
        </td></tr>
        ${hasRsvpAdmin ? `<tr><td style="padding:2px 42px 24px;"><div style="padding:15px 17px;border-radius:15px;background:#f2f5ee;color:#556050;font-size:13px;line-height:21px;">${rsvpCredentialHtml}</div></td></tr>` : ""}
        <tr><td style="padding:24px 42px 36px;">
          <div style="border-top:1px solid #e0e4da;padding-top:24px;text-align:center;">
            <p style="margin:0 0 14px;font-family:Georgia,'Times New Roman',serif;font-size:21px;line-height:29px;">Did we make your day a little easier?</p>
            <p style="margin:0 0 18px;color:#697165;font-size:13px;line-height:21px;">A kind Etsy review means the world to our small studio and helps another couple find us.</p>
            <a href="${escapeHtml(safeEtsyReviewUrl)}" style="display:inline-block;background:#596b52;color:#fff;padding:13px 22px;border-radius:999px;text-decoration:none;font-size:14px;font-weight:700;">Leave a lovely Etsy review ♡</a>
          </div>
        </td></tr>
        <tr><td style="padding:22px 42px;background:#e5eadf;color:#63705f;text-align:center;font-size:12px;line-height:19px;">Made with care in Portugal for your special day.</td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    text: `Your InviteLab invitation is ready.\n\nHello${name ? ` ${name}` : ""},\n\nThank you for trusting InviteLab with your celebration.\n\n${hasRsvpAdmin ? `${rsvpCredentialText}\n\n` : ""}${links.map(([label, url]) => `${label}: ${url}`).join("\n")}\n\nIf InviteLab made your day a little easier, we would be grateful for your Etsy review: ${safeEtsyReviewUrl}`,
  };
}

function normalizeIdempotencyKey(value) {
  const key = String(value || "").trim();
  if (!key || key.length > 256 || /[^\x21-\x7E]/.test(key)) {
    throw new CustomerEmailError(
      "INVALID_EMAIL_IDEMPOTENCY_KEY",
      "The email idempotency key must contain 1-256 visible ASCII characters.",
      { statusCode: 500 },
    );
  }
  return key;
}

function timeoutSignal(timeoutMs) {
  if (typeof AbortSignal?.timeout === "function") return AbortSignal.timeout(timeoutMs);
  return undefined;
}

function providerErrorCode(payload) {
  const value = payload && typeof payload === "object"
    ? payload.name || payload.code
    : "";
  return cleanText(value, 100).replace(/[^A-Za-z0-9_-]/g, "") || "unknown";
}

export function createCustomerEmailService({
  apiKey,
  from,
  replyTo = "",
  portalUrl,
  supportEmail,
  etsyReviewUrl = "https://www.etsy.com/your/purchases",
  alertEmail = "",
  fetchImpl = globalThis.fetch,
  endpoint = RESEND_EMAILS_URL,
  timeoutMs = 15_000,
} = {}) {
  const safeApiKey = String(apiKey || "").trim();
  if (!safeApiKey) {
    throw new CustomerEmailError(
      "RESEND_API_KEY_NOT_CONFIGURED",
      "RESEND_API_KEY is not configured.",
      { statusCode: 503 },
    );
  }
  if (typeof fetchImpl !== "function") {
    throw new TypeError("fetchImpl must be a function.");
  }
  const safeFrom = normalizeFromAddress(from);
  const safeReplyTo = replyTo ? normalizeEmail(replyTo, "replyTo") : "";
  const safePortalUrl = normalizePortalUrl(portalUrl);
  const safeSupportEmail = normalizeEmail(supportEmail, "supportEmail");
  const safeEtsyReviewUrl = normalizeOptionalHttpsUrl(etsyReviewUrl, "etsyReviewUrl");
  const safeAlertEmail = alertEmail ? normalizeEmail(alertEmail, "alertEmail") : "";
  const safeTimeoutMs = Math.max(1_000, Math.min(60_000, Number(timeoutMs) || 15_000));

  async function sendPurchaseAccessEmail({
    to,
    customerName = "",
    accessCode,
    packType,
    eventType = "wedding",
    idempotencyKey,
  } = {}) {
    const safeIdempotencyKey = normalizeIdempotencyKey(idempotencyKey);
    const email = await renderPurchaseAccessEmail({
      to,
      customerName,
      accessCode,
      packType,
      eventType,
      portalUrl: safePortalUrl,
      supportEmail: safeSupportEmail,
    });
    const payload = {
      from: safeFrom,
      to: [email.recipient],
      subject: email.subject,
      html: email.html,
      text: email.text,
      attachments: email.attachments,
      tags: [
        { name: "message_type", value: "etsy_purchase_access" },
        { name: "pack", value: PACK_DEFINITIONS[email.packType].key },
        { name: "event", value: email.eventType },
      ],
    };
    if (safeReplyTo) payload.reply_to = safeReplyTo;

    let response;
    try {
      response = await fetchImpl(endpoint, {
        method: "POST",
        redirect: "error",
        headers: {
          Authorization: `Bearer ${safeApiKey}`,
          "Content-Type": "application/json; charset=utf-8",
          "Idempotency-Key": safeIdempotencyKey,
        },
        body: JSON.stringify(payload),
        signal: timeoutSignal(safeTimeoutMs),
      });
    } catch (error) {
      throw new CustomerEmailError(
        "RESEND_REQUEST_FAILED",
        "The purchase email provider could not be reached.",
        { statusCode: 502, retryable: true, cause: error },
      );
    }

    let responsePayload = null;
    try {
      responsePayload = await response.json();
    } catch {
      responsePayload = null;
    }
    if (!response.ok) {
      const errorCode = providerErrorCode(responsePayload);
      const retryable = response.status === 408
        || response.status === 409
        || response.status === 429
        || response.status >= 500;
      throw new CustomerEmailError(
        `RESEND_${errorCode.toUpperCase()}`,
        `Resend rejected the purchase email (${response.status}, ${errorCode}).`,
        {
          statusCode: 502,
          providerStatus: response.status,
          retryable,
        },
      );
    }
    const providerMessageId = cleanText(responsePayload?.id, 200);
    if (!providerMessageId) {
      throw new CustomerEmailError(
        "RESEND_MESSAGE_ID_MISSING",
        "Resend accepted the request without returning an email id.",
        { statusCode: 502, retryable: true },
      );
    }
    return {
      provider: "resend",
      providerMessageId,
      idempotencyKey: safeIdempotencyKey,
      recipient: email.recipient,
      packType: email.packType,
      eventType: email.eventType,
    };
  }

  async function sendEtsyReceiptAccessEmail({
    to,
    customerName = "",
    receiptNumber,
    packType,
    idempotencyKey,
  } = {}) {
    const safeIdempotencyKey = normalizeIdempotencyKey(idempotencyKey);
    const email = renderEtsyReceiptAccessEmail({
      to,
      customerName,
      receiptNumber,
      packType,
      portalUrl: safePortalUrl,
      supportEmail: safeSupportEmail,
    });
    const payload = {
      from: safeFrom,
      to: [email.recipient],
      subject: email.subject,
      html: email.html,
      text: email.text,
      tags: [
        { name: "message_type", value: "etsy_receipt_access" },
        { name: "pack", value: PACK_DEFINITIONS[email.packType].key },
      ],
    };
    if (safeReplyTo) payload.reply_to = safeReplyTo;
    let response;
    try {
      response = await fetchImpl(endpoint, {
        method: "POST",
        redirect: "error",
        headers: {
          Authorization: `Bearer ${safeApiKey}`,
          "Content-Type": "application/json; charset=utf-8",
          "Idempotency-Key": safeIdempotencyKey,
        },
        body: JSON.stringify(payload),
        signal: timeoutSignal(safeTimeoutMs),
      });
    } catch (cause) {
      throw new CustomerEmailError(
        "RESEND_REQUEST_FAILED",
        "The Etsy receipt email provider could not be reached.",
        { statusCode: 502, retryable: true, cause },
      );
    }
    const body = await response.json().catch(() => null);
    if (!response.ok || !body?.id) {
      throw new CustomerEmailError(
        "RESEND_ETSY_RECEIPT_EMAIL_REJECTED",
        "Resend rejected the Etsy receipt confirmation email.",
        {
          statusCode: 502,
          providerStatus: response.status,
          retryable: response.status === 408
            || response.status === 409
            || response.status === 429
            || response.status >= 500,
        },
      );
    }
    const providerMessageId = cleanText(body.id, 200);
    if (!providerMessageId) {
      throw new CustomerEmailError(
        "RESEND_MESSAGE_ID_MISSING",
        "Resend accepted the Etsy receipt email without returning an email id.",
        { statusCode: 502, retryable: true },
      );
    }
    return {
      provider: "resend",
      providerMessageId,
      idempotencyKey: safeIdempotencyKey,
      recipient: email.recipient,
      receiptNumber: email.receiptNumber,
      packType: email.packType,
    };
  }

  async function sendDeliveryEmail({
    to,
    customerName,
    pdfUrl,
    canvaUrl,
    agendaUrl,
    websiteUrl,
    rsvpAdminUrl,
    packType,
    rsvpCredentialType,
    rsvpCredentialValue,
    idempotencyKey,
  } = {}) {
    const safeIdempotencyKey = normalizeIdempotencyKey(idempotencyKey);
    const email = renderDeliveryEmail({
      to,
      customerName,
      pdfUrl,
      canvaUrl,
      agendaUrl,
      websiteUrl,
      rsvpAdminUrl,
      packType,
      rsvpCredentialType,
      rsvpCredentialValue,
      etsyReviewUrl: safeEtsyReviewUrl,
    });
    const payload = { from: safeFrom, to: [email.recipient], subject: email.subject, html: email.html, text: email.text, tags: [{ name: "message_type", value: "project_delivery" }] };
    if (safeReplyTo) payload.reply_to = safeReplyTo;
    let response;
    try { response = await fetchImpl(endpoint, { method: "POST", redirect: "error", headers: { Authorization: `Bearer ${safeApiKey}`, "Content-Type": "application/json; charset=utf-8", "Idempotency-Key": safeIdempotencyKey }, body: JSON.stringify(payload), signal: timeoutSignal(safeTimeoutMs) }); }
    catch (cause) { throw new CustomerEmailError("RESEND_REQUEST_FAILED", "The delivery email provider could not be reached.", { statusCode: 502, retryable: true, cause }); }
    const body = await response.json().catch(() => null);
    if (!response.ok || !body?.id) throw new CustomerEmailError("RESEND_DELIVERY_REJECTED", "Resend rejected the delivery email.", { statusCode: 502, retryable: response.status >= 500 || response.status === 429 });
    return { provider: "resend", providerMessageId: body.id, recipient: email.recipient };
  }

  async function sendAutomationAlert({
    stage,
    code = "AUTOMATION_ERROR",
    message = "",
    requestId = "",
    details = "",
    idempotencyKey,
  } = {}) {
    if (!safeAlertEmail) {
      throw new CustomerEmailError(
        "AUTOMATION_ALERT_EMAIL_NOT_CONFIGURED",
        "The automation alert recipient is not configured.",
        { statusCode: 503 },
      );
    }
    const safeIdempotencyKey = normalizeIdempotencyKey(idempotencyKey);
    const safeStage = cleanText(stage, 120) || "Automation initialization";
    const safeCode = cleanText(code, 120) || "AUTOMATION_ERROR";
    const safeMessage = cleanText(message, 1_000) || "No additional error message was available.";
    const safeRequestId = cleanText(requestId, 120);
    const safeDetails = cleanText(details, 1_500);
    const occurredAt = new Date().toISOString();
    const payload = {
      from: safeFrom,
      to: [safeAlertEmail],
      subject: `[InviteLab alert] ${safeStage} — ${safeCode}`,
      html: `<!doctype html><html lang="en"><body style="margin:0;background:#eef1e9;color:#293127;font-family:Arial,sans-serif;padding:26px"><main style="max-width:620px;margin:auto;background:#fff;border:1px solid #d9dfd3;border-radius:20px;overflow:hidden"><div style="padding:26px 30px;background:#596b52;color:#fff"><div style="font-size:11px;letter-spacing:2px;font-weight:700">INVITELAB AUTOMATION</div><h1 style="margin:14px 0 0;font:400 28px/35px Georgia,serif">${escapeHtml(safeStage)}</h1></div><div style="padding:28px 30px"><p style="margin:0 0 8px"><strong>Error code:</strong> ${escapeHtml(safeCode)}</p>${safeRequestId ? `<p style="margin:0 0 8px"><strong>Project:</strong> ${escapeHtml(safeRequestId)}</p>` : ""}<p style="margin:0 0 8px"><strong>Detected:</strong> ${escapeHtml(occurredAt)}</p><p style="margin:18px 0 0;padding:15px;border-radius:12px;background:#f4f6f1;line-height:22px">${escapeHtml(safeMessage)}</p>${safeDetails ? `<p style="margin:12px 0 0;color:#687064;font-size:13px;line-height:20px">${escapeHtml(safeDetails)}</p>` : ""}<p style="margin:22px 0 0;color:#687064;font-size:12px">No access tokens, cookies, passwords, or customer files are included in this alert.</p></div></main></body></html>`,
      text: `InviteLab automation alert\n\nStage: ${safeStage}\nCode: ${safeCode}${safeRequestId ? `\nProject: ${safeRequestId}` : ""}\nDetected: ${occurredAt}\n\n${safeMessage}${safeDetails ? `\n\n${safeDetails}` : ""}\n\nNo access tokens, cookies, passwords, or customer files are included in this alert.`,
      tags: [{ name: "message_type", value: "automation_alert" }],
    };
    if (safeReplyTo) payload.reply_to = safeReplyTo;
    let response;
    try {
      response = await fetchImpl(endpoint, {
        method: "POST",
        redirect: "error",
        headers: {
          Authorization: `Bearer ${safeApiKey}`,
          "Content-Type": "application/json; charset=utf-8",
          "Idempotency-Key": safeIdempotencyKey,
        },
        body: JSON.stringify(payload),
        signal: timeoutSignal(safeTimeoutMs),
      });
    } catch (cause) {
      throw new CustomerEmailError(
        "RESEND_AUTOMATION_ALERT_REQUEST_FAILED",
        "The automation alert email provider could not be reached.",
        { statusCode: 502, retryable: true, cause },
      );
    }
    const body = await response.json().catch(() => null);
    if (!response.ok || !body?.id) {
      throw new CustomerEmailError(
        "RESEND_AUTOMATION_ALERT_REJECTED",
        "Resend rejected the automation alert email.",
        { statusCode: 502, retryable: response.status >= 500 || response.status === 429 },
      );
    }
    return { provider: "resend", providerMessageId: body.id, recipient: safeAlertEmail };
  }

  return {
    provider: "resend",
    sendAutomationAlert,
    sendPurchaseAccessEmail,
    sendEtsyReceiptAccessEmail,
    sendDeliveryEmail,
  };
}

export const CUSTOMER_EMAIL_PACKS = PACK_DEFINITIONS;

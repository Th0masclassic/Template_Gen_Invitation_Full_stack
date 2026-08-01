const CANVA_WEB_ORIGIN = "https://www.canva.com";
const CANVA_IDENTIFIER_RE = /^[A-Za-z0-9_-]{6,120}$/;
const CANVA_TEMPLATE_TOKEN_RE = /^[A-Za-z0-9_-]{6,256}$/;
const MAX_RETRY_ATTEMPTS = 5;

export const CANVA_TEMPLATE_LINK_ERROR_CODES = Object.freeze({
  INVALID_URL: "CANVA_INVALID_OR_UNSUPPORTED_URL",
  REDIRECT_NOT_EDITOR: "CANVA_REDIRECT_NOT_EDITOR",
  AUTH_SESSION_MISSING: "CANVA_AUTH_SESSION_MISSING",
  PRIVATE_ENDPOINT_DISABLED: "CANVA_PRIVATE_ENDPOINT_DISABLED",
  ACL_REJECTED: "CANVA_ACL_REQUEST_REJECTED",
  TEMPLATE_TOKEN_MISSING: "CANVA_TEMPLATE_TOKEN_MISSING",
  TEMPLATE_TOKEN_DUPLICATE: "CANVA_TEMPLATE_TOKEN_DUPLICATE",
  RESPONSE_SCHEMA_CHANGED: "CANVA_RESPONSE_SCHEMA_CHANGED",
  SHORTENER_FAILED: "CANVA_SHORTENER_FAILED",
  SHORTENER_DESTINATION_MISMATCH: "CANVA_SHORTENER_DESTINATION_MISMATCH",
  REQUEST_TIMEOUT: "CANVA_REQUEST_TIMEOUT",
  PAGE_REQUEST_FAILED: "CANVA_PAGE_REQUEST_FAILED",
  PERSISTENCE_FAILED: "CANVA_TEMPLATE_LINK_PERSISTENCE_FAILED",
});

const ERROR_MESSAGES = Object.freeze({
  [CANVA_TEMPLATE_LINK_ERROR_CODES.INVALID_URL]:
    "The Canva URL is invalid or unsupported; an HTTPS editor URL containing both a design ID and extension is required.",
  [CANVA_TEMPLATE_LINK_ERROR_CODES.REDIRECT_NOT_EDITOR]:
    "The Canva create URL did not redirect to a supported editor URL.",
  [CANVA_TEMPLATE_LINK_ERROR_CODES.AUTH_SESSION_MISSING]:
    "An authenticated Canva browser session is required.",
  [CANVA_TEMPLATE_LINK_ERROR_CODES.PRIVATE_ENDPOINT_DISABLED]:
    "Canva private-endpoint template-link automation is disabled.",
  [CANVA_TEMPLATE_LINK_ERROR_CODES.ACL_REJECTED]:
    "Canva rejected the template-link ACL request.",
  [CANVA_TEMPLATE_LINK_ERROR_CODES.TEMPLATE_TOKEN_MISSING]:
    "Canva did not return a VIEWER/C template token.",
  [CANVA_TEMPLATE_LINK_ERROR_CODES.TEMPLATE_TOKEN_DUPLICATE]:
    "Canva returned more than one VIEWER/C template token.",
  [CANVA_TEMPLATE_LINK_ERROR_CODES.RESPONSE_SCHEMA_CHANGED]:
    "Canva returned an unsupported response schema.",
  [CANVA_TEMPLATE_LINK_ERROR_CODES.SHORTENER_FAILED]:
    "Canva could not shorten the verified template URL.",
  [CANVA_TEMPLATE_LINK_ERROR_CODES.SHORTENER_DESTINATION_MISMATCH]:
    "Canva's short-link response points at a different destination.",
  [CANVA_TEMPLATE_LINK_ERROR_CODES.REQUEST_TIMEOUT]:
    "The Canva browser request timed out.",
  [CANVA_TEMPLATE_LINK_ERROR_CODES.PAGE_REQUEST_FAILED]:
    "The authenticated Canva browser request failed.",
  [CANVA_TEMPLATE_LINK_ERROR_CODES.PERSISTENCE_FAILED]:
    "The generated Canva template link could not be persisted.",
});

export class CanvaTemplateLinkError extends Error {
  constructor(code, {
    category = "unknown",
    phase = null,
    statusCode = null,
    retryable = false,
    schemaSummary = null,
  } = {}) {
    super(ERROR_MESSAGES[code] || "Canva template-link automation failed.");
    this.name = "CanvaTemplateLinkError";
    this.code = code;
    this.category = category;
    this.phase = phase;
    this.statusCode = Number.isInteger(statusCode) ? statusCode : null;
    this.retryable = Boolean(retryable);
    this.schemaSummary = isRecord(schemaSummary) ? schemaSummary : null;
  }
}

function templateLinkError(code, options) {
  return new CanvaTemplateLinkError(code, options);
}

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizePrivateResponseMeta(value) {
  if (!isRecord(value)) return null;
  const bodyKinds = new Set([
    "empty",
    "html",
    "json_like",
    "prefixed_json",
    "xssi_prefixed",
    "other",
  ]);
  const contentTypeCategories = new Set(["json", "html", "text", "other", "missing"]);
  const prefixKinds = new Set([
    "bracket_quote",
    "for_compact",
    "for_spaced",
    "while_compact",
    "while_spaced",
    "other_text_prefix",
  ]);
  return {
    bodyKind: bodyKinds.has(value.bodyKind) ? value.bodyKind : "other",
    bodyLength: Number.isInteger(value.bodyLength) && value.bodyLength >= 0
      ? value.bodyLength
      : null,
    contentTypeCategory: contentTypeCategories.has(value.contentTypeCategory)
      ? value.contentTypeCategory
      : "other",
    prefixKind: prefixKinds.has(value.prefixKind) ? value.prefixKind : null,
  };
}

function asUrl(value) {
  try {
    if (value instanceof URL) return new URL(value.toString());
    if (typeof value !== "string" || !value.trim()) return null;
    return new URL(value.trim());
  } catch {
    return null;
  }
}

function isCanvaWebHost(hostname) {
  const host = String(hostname || "").toLowerCase();
  return host === "canva.com" || host.endsWith(".canva.com");
}

function isAllowedCanvaNavigationUrl(url) {
  if (
    !url
    || url.protocol !== "https:"
    || url.username
    || url.password
    || url.port
  ) {
    return false;
  }
  const host = url.hostname.toLowerCase();
  return isCanvaWebHost(host) || host === "canva.link" || host === "www.canva.link";
}

function decodeIdentifier(value, pattern) {
  try {
    const decoded = decodeURIComponent(value);
    return pattern.test(decoded) ? decoded : null;
  } catch {
    return null;
  }
}

/**
 * Parses only Canva editor URLs. In particular, a public /view URL is not
 * accepted because its second path value can be a share token rather than the
 * document extension required by the ACL endpoint.
 */
export function parseCanvaEditorUrl(value) {
  const url = asUrl(value);
  if (
    !url
    || url.protocol !== "https:"
    || !isCanvaWebHost(url.hostname)
    || url.username
    || url.password
    || url.port
  ) {
    return null;
  }

  const match = url.pathname.match(/^\/design\/([^/]+)\/([^/]+)\/edit\/?$/i);
  if (!match) return null;

  const designId = decodeIdentifier(match[1], CANVA_IDENTIFIER_RE);
  const extension = decodeIdentifier(match[2], CANVA_IDENTIFIER_RE);
  if (!designId || !extension) return null;

  return {
    designId,
    extension,
    editorUrl: url.toString(),
  };
}

function assertTemplateComponent(value, pattern) {
  if (typeof value !== "string" || !pattern.test(value)) {
    throw templateLinkError(CANVA_TEMPLATE_LINK_ERROR_CODES.INVALID_URL, {
      category: "validation",
      phase: "build_long_url",
    });
  }
  return value;
}

/**
 * Selects the one exact VIEWER/C token. Other valid share-token types may be
 * present and are ignored. An unrelated legacy/malformed entry cannot make an
 * otherwise valid exact token unusable, while malformed VIEWER/C candidates
 * are still rejected.
 */
export function describeCanvaAclSchema(payload) {
  const valueType = (value) => {
    if (value === null) return "null";
    if (Array.isArray(value)) return "array";
    return typeof value;
  };
  const acl = isRecord(payload) ? payload.acl : undefined;
  const shareTokens = isRecord(acl) ? acl.shareTokens : undefined;
  const tokenEntries = Array.isArray(shareTokens)
    ? shareTokens.slice(0, 8).map((token) => {
      if (!isRecord(token)) return { entryType: valueType(token) };
      return {
        entryType: "object",
        hasA: Object.hasOwn(token, "A"),
        hasB: Object.hasOwn(token, "B"),
        hasC: Object.hasOwn(token, "C"),
        hasD: Object.hasOwn(token, "D"),
        aType: valueType(token.A),
        aLength: typeof token.A === "string" ? token.A.length : null,
        aPatternValid: typeof token.A === "string"
          ? CANVA_TEMPLATE_TOKEN_RE.test(token.A)
          : false,
        bType: valueType(token.B),
        bIsViewer: token.B === "VIEWER",
        cType: valueType(token.C),
        cIsTemplateKind: token.C === "C",
        dType: valueType(token.D),
      };
    })
    : [];

  return {
    payloadType: valueType(payload),
    aclType: valueType(acl),
    shareTokensType: valueType(shareTokens),
    shareTokenCount: Array.isArray(shareTokens) ? shareTokens.length : null,
    tokenEntriesTruncated: Array.isArray(shareTokens) && shareTokens.length > tokenEntries.length,
    tokenEntries,
  };
}

export function selectCanvaTemplateToken(payload) {
  const schemaSummary = describeCanvaAclSchema(payload);
  if (!isRecord(payload) || !isRecord(payload.acl) || !Array.isArray(payload.acl.shareTokens)) {
    throw templateLinkError(CANVA_TEMPLATE_LINK_ERROR_CODES.RESPONSE_SCHEMA_CHANGED, {
      category: "schema",
      phase: "acl",
      schemaSummary,
    });
  }

  const shareTokens = payload.acl.shareTokens;
  if (shareTokens.length === 0) {
    throw templateLinkError(CANVA_TEMPLATE_LINK_ERROR_CODES.TEMPLATE_TOKEN_MISSING, {
      category: "token_missing",
      phase: "acl",
    });
  }

  const matches = [];
  let malformedUnrelatedEntries = 0;
  for (const token of shareTokens) {
    if (!isRecord(token)) {
      malformedUnrelatedEntries += 1;
      continue;
    }

    const hasRequiredFields = ["A", "B", "C"].every((field) => Object.hasOwn(token, field));
    const hasValidFieldTypes = (
      typeof token.A === "string"
      && typeof token.B === "string"
      && typeof token.C === "string"
    );
    const isExactCandidate = token.B === "VIEWER" && token.C === "C";

    if (isExactCandidate) {
      if (
        !hasRequiredFields
        || !hasValidFieldTypes
        || !CANVA_TEMPLATE_TOKEN_RE.test(token.A)
      ) {
        throw templateLinkError(CANVA_TEMPLATE_LINK_ERROR_CODES.RESPONSE_SCHEMA_CHANGED, {
          category: "schema",
          phase: "acl",
          schemaSummary,
        });
      }
      matches.push({
        value: token.A,
        // Canva's current ACL response includes D as the token creation time.
        // When older template links already exist, the newest VIEWER/C token is
        // the one just requested by this operation.
        createdAt: typeof token.D === "number" && Number.isFinite(token.D) ? token.D : null,
      });
      continue;
    }

    if (
      !hasRequiredFields
      || !hasValidFieldTypes
      || !CANVA_TEMPLATE_TOKEN_RE.test(token.A)
    ) {
      malformedUnrelatedEntries += 1;
    }
  }

  const distinctValues = [...new Set(matches.map((match) => match.value))];
  if (distinctValues.length === 1) return distinctValues[0];
  const timestamped = matches.filter((match) => match.createdAt !== null);
  if (timestamped.length) {
    const newestTime = Math.max(...timestamped.map((match) => match.createdAt));
    const newestValues = [...new Set(timestamped
      .filter((match) => match.createdAt === newestTime)
      .map((match) => match.value))];
    if (newestValues.length === 1) return newestValues[0];
  }
  if (matches.length > 1) {
    throw templateLinkError(CANVA_TEMPLATE_LINK_ERROR_CODES.TEMPLATE_TOKEN_DUPLICATE, {
      category: "token_duplicate",
      phase: "acl",
      schemaSummary,
    });
  }
  if (matches.length === 1) return matches[0].value;
  if (malformedUnrelatedEntries > 0) {
    throw templateLinkError(CANVA_TEMPLATE_LINK_ERROR_CODES.RESPONSE_SCHEMA_CHANGED, {
      category: "schema",
      phase: "acl",
      schemaSummary,
    });
  }
  if (matches.length === 0) {
    throw templateLinkError(CANVA_TEMPLATE_LINK_ERROR_CODES.TEMPLATE_TOKEN_MISSING, {
      category: "token_missing",
      phase: "acl",
    });
  }
  return matches[0].value;
}

export function buildCanvaTemplateLongUrl({ designId, templateToken }) {
  const safeDesignId = assertTemplateComponent(designId, CANVA_IDENTIFIER_RE);
  const safeTemplateToken = assertTemplateComponent(templateToken, CANVA_TEMPLATE_TOKEN_RE);
  const url = new URL(CANVA_WEB_ORIGIN);
  url.pathname = `/design/${encodeURIComponent(safeDesignId)}/${encodeURIComponent(safeTemplateToken)}/view`;
  url.search = new URLSearchParams([
    ["utm_content", safeDesignId],
    ["utm_campaign", "designshare"],
    ["utm_medium", "link"],
    ["utm_source", "publishsharelink"],
    ["mode", "preview"],
  ]).toString();
  return url.toString();
}

function comparableUrl(value) {
  const url = asUrl(value);
  if (!url) return null;
  const sorted = [...url.searchParams.entries()]
    .sort(([leftKey, leftValue], [rightKey, rightValue]) => (
      leftKey.localeCompare(rightKey) || leftValue.localeCompare(rightValue)
    ));
  url.search = "";
  for (const [key, valuePart] of sorted) url.searchParams.append(key, valuePart);
  return url.toString();
}

export function isSameUrlDestination(left, right) {
  const normalizedLeft = comparableUrl(left);
  const normalizedRight = comparableUrl(right);
  return Boolean(normalizedLeft && normalizedRight && normalizedLeft === normalizedRight);
}

export function parseCanvaShortlinkResponse(payload, longTemplateUrl) {
  if (
    !isRecord(payload)
    || !isRecord(payload.A)
    || typeof payload.A.A !== "string"
  ) {
    throw templateLinkError(CANVA_TEMPLATE_LINK_ERROR_CODES.RESPONSE_SCHEMA_CHANGED, {
      category: "schema",
      phase: "shortener",
    });
  }

  if (
    Object.hasOwn(payload.A, "B")
    && (
      typeof payload.A.B !== "string"
      || !isSameUrlDestination(payload.A.B, longTemplateUrl)
    )
  ) {
    throw templateLinkError(CANVA_TEMPLATE_LINK_ERROR_CODES.SHORTENER_DESTINATION_MISMATCH, {
      category: "shortener_destination",
      phase: "shortener",
    });
  }

  const shortUrl = asUrl(payload.A.A);
  const shortHost = shortUrl?.hostname.toLowerCase();
  if (
    !shortUrl
    || shortUrl.protocol !== "https:"
    || !["canva.link", "www.canva.link"].includes(shortHost)
    || shortUrl.username
    || shortUrl.password
    || shortUrl.port
    || shortUrl.pathname === "/"
  ) {
    throw templateLinkError(CANVA_TEMPLATE_LINK_ERROR_CODES.RESPONSE_SCHEMA_CHANGED, {
      category: "schema",
      phase: "shortener",
    });
  }

  return shortUrl.toString();
}

function pageUrl(page) {
  try {
    return typeof page?.url === "function" ? page.url() : "";
  } catch {
    return "";
  }
}

async function closePageSafely(page) {
  try {
    if (typeof page?.close === "function") await page.close();
  } catch {
    // A cleanup failure must not hide the generation or authentication result.
  }
}

function looksLikeCanvaAuthenticationUrl(value) {
  const url = asUrl(value);
  return Boolean(
    url
    && isCanvaWebHost(url.hostname)
    && /\/(?:login|signup|auth)(?:\/|$)/i.test(url.pathname),
  );
}

function isTimeoutError(error) {
  if (!error) return false;
  return error.name === "TimeoutError"
    || error.name === "AbortError"
    || /\b(?:timed out|timeout)\b/i.test(String(error.message || ""));
}

function boundedAttemptCount(value) {
  const parsed = Number.isFinite(Number(value)) ? Math.trunc(Number(value)) : 3;
  return Math.min(MAX_RETRY_ATTEMPTS, Math.max(1, parsed));
}

async function defaultSleep(delayMs) {
  await new Promise((resolve) => setTimeout(resolve, delayMs));
}

async function withBoundedRetries(operation, {
  maxAttempts = 3,
  retryBaseDelayMs = 150,
  sleep = defaultSleep,
  onAttemptFailure = null,
} = {}) {
  const attempts = boundedAttemptCount(maxAttempts);
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation(attempt);
    } catch (error) {
      onAttemptFailure?.(error, attempt);
      if (!(error instanceof CanvaTemplateLinkError) || !error.retryable || attempt >= attempts) {
        throw error;
      }
      await sleep(Math.max(0, Number(retryBaseDelayMs) || 0) * (2 ** (attempt - 1)));
    }
  }
  throw new Error("unreachable");
}

function navigationStatus(response) {
  try {
    return typeof response?.status === "function" ? response.status() : null;
  } catch {
    return null;
  }
}

/**
 * Navigates a Playwright Page through a Canva create/short URL and returns the
 * final editor URL. Only Canva-controlled HTTPS hosts are accepted.
 */
export async function resolveCanvaEditorUrl(page, value, {
  navigationTimeoutMs = 30_000,
  maxAttempts = 3,
  retryBaseDelayMs = 150,
  sleep = defaultSleep,
} = {}) {
  const sourceUrl = asUrl(value);
  if (!isAllowedCanvaNavigationUrl(sourceUrl)) {
    throw templateLinkError(CANVA_TEMPLATE_LINK_ERROR_CODES.INVALID_URL, {
      category: "validation",
      phase: "redirect",
    });
  }
  if (!page || typeof page.goto !== "function" || typeof page.url !== "function") {
    throw templateLinkError(CANVA_TEMPLATE_LINK_ERROR_CODES.AUTH_SESSION_MISSING, {
      category: "authentication",
      phase: "redirect",
    });
  }

  return withBoundedRetries(async () => {
    let response;
    try {
      response = await page.goto(sourceUrl.toString(), {
        waitUntil: "domcontentloaded",
        timeout: navigationTimeoutMs,
      });
    } catch (error) {
      if (isTimeoutError(error)) {
        throw templateLinkError(CANVA_TEMPLATE_LINK_ERROR_CODES.REQUEST_TIMEOUT, {
          category: "timeout",
          phase: "redirect",
          retryable: true,
        });
      }
      throw templateLinkError(CANVA_TEMPLATE_LINK_ERROR_CODES.REDIRECT_NOT_EDITOR, {
        category: "redirect",
        phase: "redirect",
      });
    }

    const statusCode = navigationStatus(response);
    if (statusCode === 401) {
      throw templateLinkError(CANVA_TEMPLATE_LINK_ERROR_CODES.AUTH_SESSION_MISSING, {
        category: "authentication",
        phase: "redirect",
        statusCode,
      });
    }
    if (statusCode >= 500 && statusCode <= 599) {
      throw templateLinkError(CANVA_TEMPLATE_LINK_ERROR_CODES.REDIRECT_NOT_EDITOR, {
        category: "redirect",
        phase: "redirect",
        statusCode,
        retryable: true,
      });
    }

    let finalUrl = pageUrl(page);
    let parsed = parseCanvaEditorUrl(finalUrl);
    if (!parsed && typeof page.waitForURL === "function") {
      try {
        await page.waitForURL(
          (candidate) => Boolean(parseCanvaEditorUrl(candidate?.toString?.() || candidate)),
          { timeout: navigationTimeoutMs, waitUntil: "domcontentloaded" },
        );
      } catch {
        // The explicit final-state checks below provide the stable error category.
      }
      finalUrl = pageUrl(page);
      parsed = parseCanvaEditorUrl(finalUrl);
    }

    if (parsed) {
      const parsedUrl = asUrl(parsed.editorUrl);
      if (parsedUrl.origin === CANVA_WEB_ORIGIN) return parsed;

      // The private requests below target www.canva.com. Keep the evaluated
      // fetch same-origin even when a valid canva.com/subdomain editor variant
      // was supplied or returned by a create URL.
      const canonicalUrl = new URL(parsedUrl.toString());
      canonicalUrl.hostname = "www.canva.com";
      let canonicalResponse;
      try {
        canonicalResponse = await page.goto(canonicalUrl.toString(), {
          waitUntil: "domcontentloaded",
          timeout: navigationTimeoutMs,
        });
      } catch (error) {
        if (isTimeoutError(error)) {
          throw templateLinkError(CANVA_TEMPLATE_LINK_ERROR_CODES.REQUEST_TIMEOUT, {
            category: "timeout",
            phase: "redirect",
            retryable: true,
          });
        }
        throw templateLinkError(CANVA_TEMPLATE_LINK_ERROR_CODES.REDIRECT_NOT_EDITOR, {
          category: "redirect",
          phase: "redirect",
        });
      }

      const canonicalStatusCode = navigationStatus(canonicalResponse);
      if (canonicalStatusCode === 401) {
        throw templateLinkError(CANVA_TEMPLATE_LINK_ERROR_CODES.AUTH_SESSION_MISSING, {
          category: "authentication",
          phase: "redirect",
          statusCode: canonicalStatusCode,
        });
      }
      if (canonicalStatusCode >= 500 && canonicalStatusCode <= 599) {
        throw templateLinkError(CANVA_TEMPLATE_LINK_ERROR_CODES.REDIRECT_NOT_EDITOR, {
          category: "redirect",
          phase: "redirect",
          statusCode: canonicalStatusCode,
          retryable: true,
        });
      }

      const canonicalFinalUrl = pageUrl(page);
      const canonicalParsed = parseCanvaEditorUrl(canonicalFinalUrl);
      if (looksLikeCanvaAuthenticationUrl(canonicalFinalUrl)) {
        throw templateLinkError(CANVA_TEMPLATE_LINK_ERROR_CODES.AUTH_SESSION_MISSING, {
          category: "authentication",
          phase: "redirect",
          statusCode: canonicalStatusCode,
        });
      }
      if (
        !canonicalParsed
        || asUrl(canonicalParsed.editorUrl)?.origin !== CANVA_WEB_ORIGIN
        || canonicalParsed.designId !== parsed.designId
        || canonicalParsed.extension !== parsed.extension
      ) {
        throw templateLinkError(CANVA_TEMPLATE_LINK_ERROR_CODES.REDIRECT_NOT_EDITOR, {
          category: "redirect",
          phase: "redirect",
          statusCode: canonicalStatusCode,
        });
      }
      return canonicalParsed;
    }
    if (looksLikeCanvaAuthenticationUrl(finalUrl)) {
      throw templateLinkError(CANVA_TEMPLATE_LINK_ERROR_CODES.AUTH_SESSION_MISSING, {
        category: "authentication",
        phase: "redirect",
        statusCode,
      });
    }
    throw templateLinkError(CANVA_TEMPLATE_LINK_ERROR_CODES.REDIRECT_NOT_EDITOR, {
      category: "redirect",
      phase: "redirect",
      statusCode,
    });
  }, {
    maxAttempts,
    retryBaseDelayMs,
    sleep,
  });
}

function requestErrorForStatus(phase, statusCode) {
  if (statusCode === 401) {
    return templateLinkError(CANVA_TEMPLATE_LINK_ERROR_CODES.AUTH_SESSION_MISSING, {
      category: "authentication",
      phase,
      statusCode,
    });
  }
  const retryable = statusCode >= 500 && statusCode <= 599;
  if (phase === "acl") {
    return templateLinkError(CANVA_TEMPLATE_LINK_ERROR_CODES.ACL_REJECTED, {
      category: "acl_rejected",
      phase,
      statusCode,
      retryable,
    });
  }
  return templateLinkError(CANVA_TEMPLATE_LINK_ERROR_CODES.SHORTENER_FAILED, {
    category: "shortener",
    phase,
    statusCode,
    retryable,
  });
}

async function evaluateJsonRequest(page, endpoint, requestBody, timeoutMs) {
  try {
    return await page.evaluate(async ({
      endpoint: browserEndpoint,
      requestBody: browserRequestBody,
      timeoutMs: browserTimeoutMs,
    }) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), browserTimeoutMs);
      try {
        const response = await fetch(browserEndpoint, {
          method: "POST",
          credentials: "include",
          cache: "no-store",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json;charset=UTF-8",
          },
          body: JSON.stringify(browserRequestBody),
          signal: controller.signal,
        });
        const text = await response.text();
        const trimmedStart = text.trimStart();
        const knownPrefixes = [
          { value: ")]}'", kind: "bracket_quote", optionalComma: true },
          { value: "for(;;);", kind: "for_compact" },
          { value: "for (;;);", kind: "for_spaced" },
          { value: "while(1);", kind: "while_compact" },
          { value: "while (1);", kind: "while_spaced" },
        ];
        const matchedPrefix = knownPrefixes.find(({ value }) => trimmedStart.startsWith(value))
          || null;
        let jsonCandidate = trimmedStart;
        if (matchedPrefix) {
          jsonCandidate = trimmedStart.slice(matchedPrefix.value.length);
          if (matchedPrefix.optionalComma && jsonCandidate.startsWith(",")) {
            jsonCandidate = jsonCandidate.slice(1);
          }
          jsonCandidate = jsonCandidate.trimStart();
        }
        const rawContentType = String(
          response.headers?.get?.("content-type") || "",
        ).toLowerCase();
        const contentTypeCategory = !rawContentType
          ? "missing"
          : rawContentType.includes("json")
            ? "json"
            : rawContentType.includes("html")
              ? "html"
              : rawContentType.startsWith("text/")
                ? "text"
                : "other";
        let bodyKind = !trimmedStart
          ? "empty"
          : matchedPrefix
            ? "xssi_prefixed"
            : trimmedStart.startsWith("{") || trimmedStart.startsWith("[")
              ? "json_like"
              : /^<!doctype\s+html|^<html(?:\s|>)/i.test(trimmedStart)
                ? "html"
                : "other";
        let payload = null;
        let jsonValid = true;
        let detectedPrefixKind = matchedPrefix?.kind || null;
        try {
          payload = jsonCandidate ? JSON.parse(jsonCandidate) : null;
        } catch {
          jsonValid = false;
        }
        if (!jsonValid && !matchedPrefix) {
          const objectStart = trimmedStart.indexOf("{");
          const arrayStart = trimmedStart.indexOf("[");
          const possibleStarts = [objectStart, arrayStart].filter((index) => index > 0);
          const embeddedJsonStart = possibleStarts.length
            ? Math.min(...possibleStarts)
            : -1;
          if (embeddedJsonStart > 0) {
            try {
              payload = JSON.parse(trimmedStart.slice(embeddedJsonStart));
              jsonValid = true;
              bodyKind = "prefixed_json";
              detectedPrefixKind = "other_text_prefix";
            } catch {
              // Preserve the invalid response result.
            }
          }
        }
        return {
          ok: response.ok,
          status: response.status,
          jsonValid,
          payload,
          responseMeta: {
            bodyKind,
            bodyLength: text.length,
            contentTypeCategory,
            prefixKind: detectedPrefixKind,
          },
        };
      } catch (error) {
        return {
          requestError: error?.name === "AbortError" ? "timeout" : "network",
        };
      } finally {
        clearTimeout(timer);
      }
    }, { endpoint, requestBody, timeoutMs });
  } catch (error) {
    if (isTimeoutError(error)) return { requestError: "timeout" };
    return { requestError: "network" };
  }
}

/**
 * Executes one of the two known private Canva POSTs inside an authenticated
 * Playwright page. Cookies and session headers never leave the browser context.
 *
 * Canva /_ajax endpoints are private, undocumented web endpoints and may change
 * without notice; callers must preserve the explicit schema/error handling.
 */
async function requestPrivateCanvaJson(page, {
  endpoint,
  requestBody,
  phase,
  timeoutMs,
  maxAttempts,
  retryBaseDelayMs,
  sleep,
  onAttemptFailure,
}) {
  return withBoundedRetries(async () => {
    const currentUrl = pageUrl(page);
    const currentParsed = asUrl(currentUrl);
    if (
      !currentParsed
      || !isCanvaWebHost(currentParsed.hostname)
      || looksLikeCanvaAuthenticationUrl(currentUrl)
    ) {
      throw templateLinkError(CANVA_TEMPLATE_LINK_ERROR_CODES.AUTH_SESSION_MISSING, {
        category: "authentication",
        phase,
      });
    }

    const result = await evaluateJsonRequest(page, endpoint, requestBody, timeoutMs);
    if (result?.requestError === "timeout") {
      throw templateLinkError(CANVA_TEMPLATE_LINK_ERROR_CODES.REQUEST_TIMEOUT, {
        category: "timeout",
        phase,
        retryable: true,
      });
    }
    if (result?.requestError || !isRecord(result)) {
      throw templateLinkError(CANVA_TEMPLATE_LINK_ERROR_CODES.PAGE_REQUEST_FAILED, {
        category: "request",
        phase,
      });
    }

    const statusCode = Number.isInteger(result.status) ? result.status : null;
    if (!result.ok) throw requestErrorForStatus(phase, statusCode);
    if (!result.jsonValid) {
      throw templateLinkError(CANVA_TEMPLATE_LINK_ERROR_CODES.RESPONSE_SCHEMA_CHANGED, {
        category: "schema",
        phase,
        statusCode,
        schemaSummary: {
          ...describeCanvaAclSchema(result.payload),
          responseFormat: "invalid_json",
          responseMeta: normalizePrivateResponseMeta(result.responseMeta),
        },
      });
    }
    return result.payload;
  }, {
    maxAttempts,
    retryBaseDelayMs,
    sleep,
    onAttemptFailure,
  });
}

function validHttpsUrl(value) {
  const url = asUrl(value);
  return Boolean(url && url.protocol === "https:" && !url.username && !url.password);
}

export function parseCanvaTemplateLongUrl(value) {
  const url = asUrl(value);
  if (
    !url
    || url.protocol !== "https:"
    || !isCanvaWebHost(url.hostname)
    || url.username
    || url.password
    || url.port
  ) {
    return null;
  }
  const match = url.pathname.match(/^\/design\/([^/]+)\/([^/]+)\/view\/?$/i);
  if (!match) return null;
  const designId = decodeIdentifier(match[1], CANVA_IDENTIFIER_RE);
  const templateToken = decodeIdentifier(match[2], CANVA_TEMPLATE_TOKEN_RE);
  if (
    !designId
    || !templateToken
    || url.searchParams.get("utm_content") !== designId
    || url.searchParams.get("utm_campaign") !== "designshare"
    || url.searchParams.get("utm_medium") !== "link"
    || url.searchParams.get("utm_source") !== "publishsharelink"
    || url.searchParams.get("mode") !== "preview"
  ) {
    return null;
  }
  return { designId, templateToken };
}

function isCanvaShortUrl(value) {
  const url = asUrl(value);
  return Boolean(
    url
    && url.protocol === "https:"
    && ["canva.link", "www.canva.link"].includes(url.hostname.toLowerCase())
    && !url.username
    && !url.password
    && !url.port
    && url.pathname !== "/",
  );
}

export function isUsablePersistedCanvaTemplateResult(value) {
  if (!isRecord(value)) return false;
  const longTemplate = parseCanvaTemplateLongUrl(value.canvaTemplateLongUrl);
  const editor = parseCanvaEditorUrl(value.canvaEditorUrl);
  if (
    !CANVA_IDENTIFIER_RE.test(String(value.canvaDesignId || ""))
    || !CANVA_IDENTIFIER_RE.test(String(value.canvaExtension || ""))
    || !longTemplate
    || !editor
    || longTemplate.designId !== value.canvaDesignId
    || editor.designId !== value.canvaDesignId
    || editor.extension !== value.canvaExtension
    || !validHttpsUrl(value.canvaTemplateUrl)
    || !["long", "short"].includes(value.canvaTemplateUrlType)
  ) {
    return false;
  }
  if (
    value.canvaTemplateToken != null
    && (
      !CANVA_TEMPLATE_TOKEN_RE.test(String(value.canvaTemplateToken))
      || value.canvaTemplateToken !== longTemplate.templateToken
    )
  ) {
    return false;
  }
  if (
    value.canvaTemplateUrlType === "long"
    && !isSameUrlDestination(value.canvaTemplateUrl, value.canvaTemplateLongUrl)
  ) {
    return false;
  }
  if (value.canvaTemplateUrlType === "short" && !isCanvaShortUrl(value.canvaTemplateUrl)) {
    return false;
  }
  return true;
}

function sanitizeJobId(value) {
  if (typeof value !== "string" || !value.trim() || value.length > 200) {
    throw new TypeError("jobId must be a non-empty string of at most 200 characters");
  }
  return value.trim();
}

/**
 * Small coordinator around the private Canva web behavior. It provides:
 * - persisted-result checks before any Canva mutation;
 * - one in-flight operation per job;
 * - an in-memory completed-result cache (including persistence-retry recovery).
 *
 * Single-flight protection is intentionally process-local for this
 * single-process application. A crash after an ambiguous ACL response but
 * before persistence cannot be reconciled because this private endpoint offers
 * no documented idempotency key or supported read API. Multi-process callers
 * must add an external per-job lease before invoking this service.
 */
export class CanvaTemplateLinkService {
  constructor({
    page = null,
    getAuthenticatedPage = null,
    closeAcquiredPage = true,
    isAuthenticatedPage = null,
    readPersistedResult = async () => null,
    persistResult = async () => {},
    persistResolvedEditor = async () => {},
    privateEndpointEnabled = true,
    shorteningEnabled = true,
    requestTimeoutMs = 15_000,
    navigationTimeoutMs = 30_000,
    maxAttempts = 3,
    retryBaseDelayMs = 150,
    sleep = defaultSleep,
    logger = null,
  } = {}) {
    this.page = page;
    this.getAuthenticatedPage = getAuthenticatedPage;
    this.closeAcquiredPage = Boolean(closeAcquiredPage);
    this.isAuthenticatedPage = isAuthenticatedPage;
    this.readPersistedResult = readPersistedResult;
    this.persistResult = persistResult;
    this.persistResolvedEditor = persistResolvedEditor;
    this.privateEndpointEnabled = Boolean(privateEndpointEnabled);
    this.shorteningEnabled = Boolean(shorteningEnabled);
    this.requestTimeoutMs = Math.max(1, Number(requestTimeoutMs) || 15_000);
    this.navigationTimeoutMs = Math.max(1, Number(navigationTimeoutMs) || 30_000);
    this.maxAttempts = boundedAttemptCount(maxAttempts);
    this.retryBaseDelayMs = Math.max(0, Number(retryBaseDelayMs) || 0);
    this.sleep = sleep;
    this.logger = logger;
    this.inFlight = new Map();
    this.completedResults = new Map();
  }

  safeLog({ jobId, designId = null, phase, status, error = null }) {
    if (!this.logger) return;
    const event = {
      jobId,
      designId,
      phase,
      status,
      errorCategory: error?.category || null,
      errorCode: error?.code || null,
      schemaSummary: error?.schemaSummary || null,
    };
    try {
      if (typeof this.logger === "function") this.logger(event);
      else if (status === "failed" && typeof this.logger.error === "function") this.logger.error(event);
      else if (typeof this.logger.info === "function") this.logger.info(event);
    } catch {
      // Observability must never change the link-generation outcome.
    }
  }

  async loadPersisted(jobId) {
    try {
      return await this.readPersistedResult(jobId);
    } catch {
      throw templateLinkError(CANVA_TEMPLATE_LINK_ERROR_CODES.PERSISTENCE_FAILED, {
        category: "persistence",
        phase: "read_persisted",
      });
    }
  }

  async savePersisted(jobId, result) {
    try {
      await this.persistResult(jobId, result);
    } catch {
      throw templateLinkError(CANVA_TEMPLATE_LINK_ERROR_CODES.PERSISTENCE_FAILED, {
        category: "persistence",
        phase: "persist",
      });
    }
  }

  async resolvePage() {
    let page = this.page;
    let acquired = false;
    if (typeof this.getAuthenticatedPage === "function") {
      try {
        page = await this.getAuthenticatedPage();
        acquired = Boolean(page);
      } catch {
        page = null;
      }
    }
    if (!page || typeof page.evaluate !== "function") {
      if (acquired && this.closeAcquiredPage) await closePageSafely(page);
      throw templateLinkError(CANVA_TEMPLATE_LINK_ERROR_CODES.AUTH_SESSION_MISSING, {
        category: "authentication",
        phase: "session",
      });
    }
    if (typeof this.isAuthenticatedPage === "function") {
      let authenticated = false;
      try {
        authenticated = await this.isAuthenticatedPage(page);
      } catch {
        authenticated = false;
      }
      if (!authenticated) {
        if (acquired && this.closeAcquiredPage) await closePageSafely(page);
        throw templateLinkError(CANVA_TEMPLATE_LINK_ERROR_CODES.AUTH_SESSION_MISSING, {
          category: "authentication",
          phase: "session",
        });
      }
    }
    return {
      page,
      closeWhenDone: acquired && this.closeAcquiredPage,
    };
  }

  async createForJob({
    jobId: rawJobId,
    canvaCreateUrl = null,
    canvaEditorUrl = null,
  }) {
    const jobId = sanitizeJobId(rawJobId);

    const firstPersisted = await this.loadPersisted(jobId);
    if (isUsablePersistedCanvaTemplateResult(firstPersisted)) {
      this.completedResults.set(jobId, firstPersisted);
      return firstPersisted;
    }
    if (this.completedResults.has(jobId)) {
      const cached = this.completedResults.get(jobId);
      await this.savePersisted(jobId, cached);
      return cached;
    }
    if (this.inFlight.has(jobId)) return this.inFlight.get(jobId);

    const operation = this.createAfterLock({
      jobId,
      canvaCreateUrl,
      canvaEditorUrl,
    });
    this.inFlight.set(jobId, operation);
    try {
      return await operation;
    } finally {
      if (this.inFlight.get(jobId) === operation) this.inFlight.delete(jobId);
    }
  }

  async createAfterLock({ jobId, canvaCreateUrl, canvaEditorUrl }) {
    // Recheck after winning the per-job in-process lock. This is deliberately
    // immediately before any private Canva request.
    const persisted = await this.loadPersisted(jobId);
    if (isUsablePersistedCanvaTemplateResult(persisted)) {
      this.completedResults.set(jobId, persisted);
      return persisted;
    }
    if (this.completedResults.has(jobId)) {
      const cached = this.completedResults.get(jobId);
      await this.savePersisted(jobId, cached);
      return cached;
    }
    if (!this.privateEndpointEnabled) {
      throw templateLinkError(CANVA_TEMPLATE_LINK_ERROR_CODES.PRIVATE_ENDPOINT_DISABLED, {
        category: "disabled",
        phase: "acl",
      });
    }

    // Prefer the Canva Connect API create_url when it is available. Opening it
    // in the authenticated Edge session resolves the editable copy that should
    // receive the template token. Older jobs can recover from the editor URL.
    const sourceUrl = canvaCreateUrl || canvaEditorUrl;
    if (typeof sourceUrl !== "string" || !sourceUrl.trim()) {
      throw templateLinkError(CANVA_TEMPLATE_LINK_ERROR_CODES.INVALID_URL, {
        category: "validation",
        phase: "redirect",
      });
    }
    const normalizedSourceUrl = asUrl(sourceUrl);
    if (!isAllowedCanvaNavigationUrl(normalizedSourceUrl)) {
      throw templateLinkError(CANVA_TEMPLATE_LINK_ERROR_CODES.INVALID_URL, {
        category: "validation",
        phase: "redirect",
      });
    }

    const { page, closeWhenDone } = await this.resolvePage();
    try {
      return await this.createWithPage({
        jobId,
        canvaCreateUrl,
        page,
        sourceUrl: normalizedSourceUrl.toString(),
      });
    } finally {
      if (closeWhenDone) await closePageSafely(page);
    }
  }

  async createWithPage({ jobId, canvaCreateUrl, page, sourceUrl }) {
    this.safeLog({ jobId, phase: "redirect", status: "started" });
    let editor;
    try {
      editor = await resolveCanvaEditorUrl(page, sourceUrl, {
        navigationTimeoutMs: this.navigationTimeoutMs,
        maxAttempts: this.maxAttempts,
        retryBaseDelayMs: this.retryBaseDelayMs,
        sleep: this.sleep,
      });
    } catch (error) {
      this.safeLog({ jobId, phase: "redirect", status: "failed", error });
      throw error;
    }

    const { designId, extension, editorUrl } = editor;
    try {
      await this.persistResolvedEditor(jobId, {
        canvaEditorUrl: editorUrl,
        canvaDesignId: designId,
        canvaExtension: extension,
      });
    } catch {
      const error = templateLinkError(CANVA_TEMPLATE_LINK_ERROR_CODES.PERSISTENCE_FAILED, {
        category: "persistence",
        phase: "persist_editor",
      });
      this.safeLog({ jobId, designId, phase: "persist_editor", status: "failed", error });
      throw error;
    }
    this.safeLog({ jobId, designId, phase: "acl", status: "started" });
    let templateToken;
    try {
      const aclPayload = await requestPrivateCanvaJson(page, {
        endpoint: `${CANVA_WEB_ORIGIN}/_ajax/documents/${encodeURIComponent(designId)}/acl`,
        requestBody: {
          document: designId,
          extension,
          shareTokenChange: {
            "A?": "A",
            B: "C",
          },
        },
        phase: "acl",
        timeoutMs: this.requestTimeoutMs,
        maxAttempts: this.maxAttempts,
        retryBaseDelayMs: this.retryBaseDelayMs,
        sleep: this.sleep,
        onAttemptFailure: (error, attempt) => {
          this.safeLog({
            jobId,
            designId,
            phase: "acl",
            status: error.retryable ? `retry_${attempt}` : "failed",
            error,
          });
        },
      });
      templateToken = selectCanvaTemplateToken(aclPayload);
    } catch (error) {
      this.safeLog({ jobId, designId, phase: "acl", status: "failed", error });
      throw error;
    }

    const longTemplateUrl = buildCanvaTemplateLongUrl({ designId, templateToken });
    let finalTemplateUrl = longTemplateUrl;
    let finalUrlType = "long";
    let shortenerError = null;

    if (this.shorteningEnabled) {
      this.safeLog({ jobId, designId, phase: "shortener", status: "started" });
      try {
        const shortlinkPayload = await requestPrivateCanvaJson(page, {
          endpoint: `${CANVA_WEB_ORIGIN}/_ajax/shortlink/target`,
          requestBody: {
            A: longTemplateUrl,
            B: templateToken,
          },
          phase: "shortener",
          timeoutMs: this.requestTimeoutMs,
          maxAttempts: this.maxAttempts,
          retryBaseDelayMs: this.retryBaseDelayMs,
          sleep: this.sleep,
          onAttemptFailure: (error, attempt) => {
            this.safeLog({
              jobId,
              designId,
              phase: "shortener",
              status: error.retryable ? `retry_${attempt}` : "failed",
              error,
            });
          },
        });
        finalTemplateUrl = parseCanvaShortlinkResponse(shortlinkPayload, longTemplateUrl);
        finalUrlType = "short";
        this.safeLog({ jobId, designId, phase: "shortener", status: "succeeded" });
      } catch (error) {
        shortenerError = error instanceof CanvaTemplateLinkError
          ? error
          : templateLinkError(CANVA_TEMPLATE_LINK_ERROR_CODES.SHORTENER_FAILED, {
            category: "shortener",
            phase: "shortener",
          });
        this.safeLog({
          jobId,
          designId,
          phase: "shortener",
          status: "long_url_fallback",
          error: shortenerError,
        });
      }
    }

    const result = {
      canvaCreateUrl: typeof canvaCreateUrl === "string" ? canvaCreateUrl.trim() : null,
      canvaEditorUrl: editorUrl,
      canvaDesignId: designId,
      canvaExtension: extension,
      canvaTemplateToken: templateToken,
      canvaTemplateLongUrl: longTemplateUrl,
      canvaTemplateUrl: finalTemplateUrl,
      canvaTemplateUrlType: finalUrlType,
      ...(shortenerError
        ? {
          canvaTemplateShortenerError: {
            code: shortenerError.code,
            category: shortenerError.category,
          },
        }
        : {}),
    };

    // Keep the completed result before persistence so a persistence-only retry
    // cannot generate another ACL token in this process.
    this.completedResults.set(jobId, result);
    try {
      await this.savePersisted(jobId, result);
    } catch (error) {
      this.safeLog({ jobId, designId, phase: "persist", status: "failed", error });
      throw error;
    }
    this.safeLog({ jobId, designId, phase: "complete", status: "succeeded" });
    return result;
  }
}

export function createCanvaTemplateLinkService(options) {
  return new CanvaTemplateLinkService(options);
}

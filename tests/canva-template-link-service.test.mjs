import assert from "node:assert/strict";
import test from "node:test";

import {
  CANVA_TEMPLATE_LINK_ERROR_CODES,
  CanvaTemplateLinkError,
  CanvaTemplateLinkService,
  buildCanvaTemplateLongUrl,
  describeCanvaAclSchema,
  isSameUrlDestination,
  isUsablePersistedCanvaTemplateResult,
  parseCanvaEditorUrl,
  parseCanvaShortlinkResponse,
  resolveCanvaEditorUrl,
  selectCanvaTemplateToken,
} from "../canva-template-link-service.mjs";

const DESIGN_ID = "DAHQbnXu9iQ";
const EXTENSION = "N4KAqOPiVopoZDIB-qYMUQ";
const TEMPLATE_TOKEN = "MQLShm_QUzFD0j6RnUfh7Q";
const EDITOR_URL = `https://www.canva.com/design/${DESIGN_ID}/${EXTENSION}/edit`;

function aclPayload(token = TEMPLATE_TOKEN) {
  return {
    acl: {
      shareTokens: [
        { A: "unrelated_token_123", B: "EDITOR", C: "C" },
        { A: token, B: "VIEWER", C: "C" },
      ],
    },
  };
}

function browserJson(payload, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    jsonValid: true,
    payload,
  };
}

class MockCanvaPage {
  constructor({
    finalUrls = [EDITOR_URL],
    navigationStatuses = [200],
    responses = [],
  } = {}) {
    this.currentUrl = "about:blank";
    this.finalUrls = [...finalUrls];
    this.navigationStatuses = [...navigationStatuses];
    this.responses = [...responses];
    this.gotoCalls = [];
    this.requests = [];
    this.closeCalls = 0;
  }

  url() {
    return this.currentUrl;
  }

  async goto(url, options) {
    this.gotoCalls.push({ url, options });
    const finalUrl = this.finalUrls.length > 1
      ? this.finalUrls.shift()
      : this.finalUrls[0];
    const status = this.navigationStatuses.length > 1
      ? this.navigationStatuses.shift()
      : this.navigationStatuses[0];
    if (finalUrl instanceof Error) throw finalUrl;
    this.currentUrl = finalUrl;
    return { status: () => status };
  }

  async evaluate(_function, input) {
    this.requests.push(input);
    const response = this.responses.shift();
    if (typeof response === "function") return response(input);
    if (response instanceof Error) throw response;
    return response;
  }

  async close() {
    this.closeCalls += 1;
  }
}

class ExecutingFetchPage extends MockCanvaPage {
  constructor({ fetchPayload, fetchText = null, fetchContentType = "application/json", ...pageOptions }) {
    super(pageOptions);
    this.fetchPayload = fetchPayload;
    this.fetchText = fetchText;
    this.fetchContentType = fetchContentType;
    this.fetchCalls = [];
    this.evaluateOrigins = [];
  }

  async evaluate(browserFunction, input) {
    this.requests.push(input);
    this.evaluateOrigins.push(new URL(this.currentUrl).origin);
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url, options) => {
      this.fetchCalls.push({ url, options });
      return {
        ok: true,
        status: 200,
        headers: {
          get: (name) => String(name).toLowerCase() === "content-type"
            ? this.fetchContentType
            : null,
        },
        text: async () => this.fetchText ?? JSON.stringify(this.fetchPayload),
      };
    };
    try {
      return await browserFunction(input);
    } finally {
      globalThis.fetch = originalFetch;
    }
  }
}

function makePersistedResult(overrides = {}) {
  const longUrl = buildCanvaTemplateLongUrl({
    designId: DESIGN_ID,
    templateToken: TEMPLATE_TOKEN,
  });
  return {
    canvaCreateUrl: "https://www.canva.com/d/create123",
    canvaEditorUrl: EDITOR_URL,
    canvaDesignId: DESIGN_ID,
    canvaExtension: EXTENSION,
    canvaTemplateToken: TEMPLATE_TOKEN,
    canvaTemplateLongUrl: longUrl,
    canvaTemplateUrl: longUrl,
    canvaTemplateUrlType: "long",
    ...overrides,
  };
}

test("parseCanvaEditorUrl extracts both required identifiers with query parameters and a trailing slash", () => {
  const parsed = parseCanvaEditorUrl(
    `${EDITOR_URL}/?utm_source=chatgpt&mode=edit#workspace`,
  );

  assert.equal(parsed.designId, DESIGN_ID);
  assert.equal(parsed.extension, EXTENSION);
  assert.equal(
    new URL(parsed.editorUrl).searchParams.get("utm_source"),
    "chatgpt",
  );
});

test("parseCanvaEditorUrl accepts Canva web host variants and URL instances", () => {
  const parsed = parseCanvaEditorUrl(
    new URL(`https://canva.com/design/${DESIGN_ID}/${EXTENSION}/EDIT`),
  );

  assert.deepEqual(parsed, {
    designId: DESIGN_ID,
    extension: EXTENSION,
    editorUrl: `https://canva.com/design/${DESIGN_ID}/${EXTENSION}/EDIT`,
  });
});

test("parseCanvaEditorUrl rejects URLs without a trustworthy design ID and extension", () => {
  const invalidUrls = [
    `http://www.canva.com/design/${DESIGN_ID}/${EXTENSION}/edit`,
    `https://www.canva.com/design/${DESIGN_ID}/edit`,
    `https://www.canva.com/design/${DESIGN_ID}/${EXTENSION}/view`,
    `https://www.canva.com/design/${DESIGN_ID}/bad%2Fextension/edit`,
    `https://www.canva.com.evil.test/design/${DESIGN_ID}/${EXTENSION}/edit`,
    `https://user@www.canva.com/design/${DESIGN_ID}/${EXTENSION}/edit`,
    "not a url",
  ];

  for (const value of invalidUrls) assert.equal(parseCanvaEditorUrl(value), null);
});

test("selectCanvaTemplateToken selects the exact VIEWER/C token even when it is not first", () => {
  assert.equal(selectCanvaTemplateToken(aclPayload()), TEMPLATE_TOKEN);
});

test("selectCanvaTemplateToken accepts the current rich Canva ACL response including field D", () => {
  const payload = {
    acl: {
      rules: [
        {
          type: "USER",
          principal: { brand: "SAFE_BRAND_ID", user: "SAFE_USER_ID" },
          role: "OWNER",
          exclusive: false,
        },
        {
          type: "DEFAULT",
          allowAnonymousEditAccess: false,
          role: "NONE",
          origin: { type: "MANUAL" },
          exclusive: false,
        },
      ],
      invites: [],
      extension: "SAFE_EXTENSION_ID",
      shareTokens: [
        {
          A: TEMPLATE_TOKEN,
          C: "C",
          B: "VIEWER",
          D: 1_785_082_062_050,
        },
      ],
      sharingRestrictions: [],
      version: 4,
      owner: { brand: "SAFE_BRAND_ID", user: "SAFE_USER_ID" },
    },
  };

  assert.equal(selectCanvaTemplateToken(payload), TEMPLATE_TOKEN);
});

test("describeCanvaAclSchema reports structure without exposing identifiers or tokens", () => {
  const secretExtension = "SECRET_EXTENSION_VALUE";
  const secretOwner = "SECRET_OWNER_VALUE";
  const secretToken = "SecretTemplateToken_123";
  const summary = describeCanvaAclSchema({
    acl: {
      extension: secretExtension,
      owner: { user: secretOwner },
      shareTokens: [
        { A: secretToken, B: "VIEWER", C: "C", D: 123 },
      ],
    },
  });
  const serialized = JSON.stringify(summary);

  assert.equal(summary.shareTokenCount, 1);
  assert.equal(summary.tokenEntries[0].aLength, secretToken.length);
  assert.equal(summary.tokenEntries[0].bIsViewer, true);
  assert.equal(summary.tokenEntries[0].cIsTemplateKind, true);
  assert.equal(summary.tokenEntries[0].dType, "number");
  assert.equal(serialized.includes(secretExtension), false);
  assert.equal(serialized.includes(secretOwner), false);
  assert.equal(serialized.includes(secretToken), false);
});

test("selectCanvaTemplateToken reports an absent exact token", () => {
  assert.throws(
    () => selectCanvaTemplateToken({
      acl: {
        shareTokens: [
          { A: "viewer_token_123", B: "VIEWER", C: "D" },
          { A: "editor_token_123", B: "EDITOR", C: "C" },
        ],
      },
    }),
    {
      code: CANVA_TEMPLATE_LINK_ERROR_CODES.TEMPLATE_TOKEN_MISSING,
      category: "token_missing",
    },
  );
});

test("selectCanvaTemplateToken rejects duplicate exact tokens", () => {
  assert.throws(
    () => selectCanvaTemplateToken({
      acl: {
        shareTokens: [
          { A: "viewer_token_123", B: "VIEWER", C: "C" },
          { A: "viewer_token_456", B: "VIEWER", C: "C" },
        ],
      },
    }),
    {
      code: CANVA_TEMPLATE_LINK_ERROR_CODES.TEMPLATE_TOKEN_DUPLICATE,
      category: "token_duplicate",
    },
  );
});

test("selectCanvaTemplateToken selects the newest timestamped VIEWER/C token", () => {
  assert.equal(
    selectCanvaTemplateToken({
      acl: {
        shareTokens: [
          { A: "viewer_token_old", B: "VIEWER", C: "C", D: 1_785_082_062_050 },
          { A: "viewer_token_new", B: "VIEWER", C: "C", D: 1_785_082_062_051 },
        ],
      },
    }),
    "viewer_token_new",
  );
});

test("selectCanvaTemplateToken distinguishes malformed and changed schemas", () => {
  const malformedPayloads = [
    null,
    {},
    { acl: { shareTokens: "not-an-array" } },
    { acl: { shareTokens: [null] } },
    { acl: { shareTokens: [{ role: "VIEWER", kind: "C" }] } },
    { acl: { shareTokens: [{ A: 123, B: "VIEWER", C: "C" }] } },
    { acl: { shareTokens: [{ A: "!", B: "VIEWER", C: "C" }] } },
  ];

  for (const payload of malformedPayloads) {
    assert.throws(
      () => selectCanvaTemplateToken(payload),
      { code: CANVA_TEMPLATE_LINK_ERROR_CODES.RESPONSE_SCHEMA_CHANGED },
    );
  }
});

test("selectCanvaTemplateToken ignores an unrelated legacy entry when an exact token exists", () => {
  assert.equal(
    selectCanvaTemplateToken({
      acl: {
        shareTokens: [
          { A: TEMPLATE_TOKEN, B: "VIEWER", C: "C" },
          { role: "EDITOR", kind: "LEGACY" },
        ],
      },
    }),
    TEMPLATE_TOKEN,
  );
});

test("selectCanvaTemplateToken treats an empty valid token list as missing", () => {
  assert.throws(
    () => selectCanvaTemplateToken({ acl: { shareTokens: [] } }),
    { code: CANVA_TEMPLATE_LINK_ERROR_CODES.TEMPLATE_TOKEN_MISSING },
  );
});

test("buildCanvaTemplateLongUrl constructs the documented URL with URLSearchParams", () => {
  const result = buildCanvaTemplateLongUrl({
    designId: DESIGN_ID,
    templateToken: TEMPLATE_TOKEN,
  });

  assert.equal(
    result,
    `https://www.canva.com/design/${DESIGN_ID}/${TEMPLATE_TOKEN}/view`
      + `?utm_content=${DESIGN_ID}`
      + "&utm_campaign=designshare"
      + "&utm_medium=link"
      + "&utm_source=publishsharelink"
      + "&mode=preview",
  );
  const parsed = new URL(result);
  assert.equal(parsed.searchParams.get("utm_content"), DESIGN_ID);
  assert.equal(parsed.searchParams.get("utm_source"), "publishsharelink");
  assert.equal(parsed.searchParams.get("mode"), "preview");
});

test("buildCanvaTemplateLongUrl validates path values before encoding", () => {
  assert.throws(
    () => buildCanvaTemplateLongUrl({
      designId: "bad/id",
      templateToken: TEMPLATE_TOKEN,
    }),
    { code: CANVA_TEMPLATE_LINK_ERROR_CODES.INVALID_URL },
  );
  assert.throws(
    () => buildCanvaTemplateLongUrl({
      designId: DESIGN_ID,
      templateToken: "bad token",
    }),
    { code: CANVA_TEMPLATE_LINK_ERROR_CODES.INVALID_URL },
  );
});

test("parseCanvaShortlinkResponse accepts a matching destination", () => {
  const longUrl = buildCanvaTemplateLongUrl({
    designId: DESIGN_ID,
    templateToken: TEMPLATE_TOKEN,
  });

  assert.equal(
    parseCanvaShortlinkResponse({
      A: {
        A: "https://canva.link/6rog00fh3yy5y9e",
        B: longUrl,
      },
    }, longUrl),
    "https://canva.link/6rog00fh3yy5y9e",
  );
});

test("parseCanvaShortlinkResponse accepts the current rich Canva response shape", () => {
  const longUrl = buildCanvaTemplateLongUrl({
    designId: DESIGN_ID,
    templateToken: TEMPLATE_TOKEN,
  });
  const payload = {
    A: {
      A: "https://canva.link/safe-template-link",
      B: longUrl,
      C: "SAFE_BRAND_ID",
      D: "SAFE_USER_ID",
      E: "A",
    },
    B: {
      A: "SAFE_BRAND_ID",
      B: false,
      C: 0,
      D: 5,
    },
  };

  assert.equal(
    parseCanvaShortlinkResponse(payload, longUrl),
    "https://canva.link/safe-template-link",
  );
});

test("short-link destination comparison tolerates query ordering but not changed values", () => {
  const first = "https://www.canva.com/design/example/token/view?mode=preview&utm_source=publishsharelink";
  const reordered = "https://www.canva.com/design/example/token/view?utm_source=publishsharelink&mode=preview";
  const changed = "https://www.canva.com/design/example/token/view?utm_source=other&mode=preview";

  assert.equal(isSameUrlDestination(first, reordered), true);
  assert.equal(isSameUrlDestination(first, changed), false);
});

test("parseCanvaShortlinkResponse permits an omitted destination but rejects a mismatch", () => {
  const longUrl = buildCanvaTemplateLongUrl({
    designId: DESIGN_ID,
    templateToken: TEMPLATE_TOKEN,
  });

  assert.equal(
    parseCanvaShortlinkResponse({
      A: { A: "https://canva.link/short123" },
    }, longUrl),
    "https://canva.link/short123",
  );
  assert.throws(
    () => parseCanvaShortlinkResponse({
      A: {
        A: "https://canva.link/short123",
        B: "https://www.canva.com/design/another/token/view",
      },
    }, longUrl),
    {
      code: CANVA_TEMPLATE_LINK_ERROR_CODES.SHORTENER_DESTINATION_MISMATCH,
    },
  );
});

test("parseCanvaShortlinkResponse rejects malformed and non-Canva short URLs", () => {
  const longUrl = buildCanvaTemplateLongUrl({
    designId: DESIGN_ID,
    templateToken: TEMPLATE_TOKEN,
  });

  for (const payload of [
    null,
    {},
    { A: { A: 123 } },
    { A: { A: "http://canva.link/insecure" } },
    { A: { A: "https://evil.test/not-canva" } },
  ]) {
    assert.throws(
      () => parseCanvaShortlinkResponse(payload, longUrl),
      { code: CANVA_TEMPLATE_LINK_ERROR_CODES.RESPONSE_SCHEMA_CHANGED },
    );
  }
});

test("resolveCanvaEditorUrl follows a Canva create URL to the final editor URL", async () => {
  const page = new MockCanvaPage();
  const result = await resolveCanvaEditorUrl(
    page,
    "https://www.canva.com/d/create123",
  );

  assert.equal(result.designId, DESIGN_ID);
  assert.equal(result.extension, EXTENSION);
  assert.equal(page.gotoCalls.length, 1);
});

test("resolveCanvaEditorUrl reports a redirect that never reaches an editor", async () => {
  const page = new MockCanvaPage({
    finalUrls: ["https://www.canva.com/templates/invitations/"],
  });

  await assert.rejects(
    resolveCanvaEditorUrl(page, "https://www.canva.com/d/create123"),
    { code: CANVA_TEMPLATE_LINK_ERROR_CODES.REDIRECT_NOT_EDITOR },
  );
});

test("resolveCanvaEditorUrl reports a missing authenticated session after a login redirect", async () => {
  const page = new MockCanvaPage({
    finalUrls: ["https://www.canva.com/login?redirect=%2Fdesign"],
  });

  await assert.rejects(
    resolveCanvaEditorUrl(page, "https://www.canva.com/d/create123"),
    { code: CANVA_TEMPLATE_LINK_ERROR_CODES.AUTH_SESSION_MISSING },
  );
});

test("resolveCanvaEditorUrl retries only transient navigation timeouts", async () => {
  const timeout = Object.assign(new Error("Navigation timed out"), {
    name: "TimeoutError",
  });
  const page = new MockCanvaPage({
    finalUrls: [timeout, EDITOR_URL],
  });

  const result = await resolveCanvaEditorUrl(
    page,
    "https://www.canva.com/d/create123",
    {
      maxAttempts: 2,
      retryBaseDelayMs: 0,
      sleep: async () => {},
    },
  );

  assert.equal(result.designId, DESIGN_ID);
  assert.equal(page.gotoCalls.length, 2);
});

test("resolveCanvaEditorUrl canonicalizes host variants to www.canva.com", async () => {
  const variantEditorUrl = `https://canva.com/design/${DESIGN_ID}/${EXTENSION}/edit?mode=edit`;
  const canonicalEditorUrl = `https://www.canva.com/design/${DESIGN_ID}/${EXTENSION}/edit?mode=edit`;
  const page = new MockCanvaPage({
    finalUrls: [variantEditorUrl, canonicalEditorUrl],
  });

  const result = await resolveCanvaEditorUrl(page, variantEditorUrl);

  assert.equal(result.editorUrl, canonicalEditorUrl);
  assert.equal(page.gotoCalls.length, 2);
  assert.equal(new URL(page.gotoCalls[1].url).origin, "https://www.canva.com");
  assert.equal(new URL(page.url()).origin, "https://www.canva.com");
});

test("the service performs ACL and shortener POSTs inside the page context", async () => {
  const longUrl = buildCanvaTemplateLongUrl({
    designId: DESIGN_ID,
    templateToken: TEMPLATE_TOKEN,
  });
  const page = new MockCanvaPage({
    responses: [
      browserJson(aclPayload()),
      browserJson({
        A: {
          A: "https://canva.link/client-ready",
          B: longUrl,
        },
      }),
    ],
  });
  const saved = [];
  const service = new CanvaTemplateLinkService({
    page,
    readPersistedResult: async () => null,
    persistResult: async (jobId, result) => saved.push({ jobId, result }),
    retryBaseDelayMs: 0,
    sleep: async () => {},
  });

  const result = await service.createForJob({
    jobId: "job-success",
    canvaCreateUrl: "https://www.canva.com/d/create123",
  });

  assert.equal(result.canvaTemplateUrl, "https://canva.link/client-ready");
  assert.equal(result.canvaTemplateUrlType, "short");
  assert.equal(result.canvaDesignId, DESIGN_ID);
  assert.equal(result.canvaExtension, EXTENSION);
  assert.equal(result.canvaTemplateToken, TEMPLATE_TOKEN);
  assert.equal(saved.length, 1);
  assert.equal(page.requests.length, 2);
  assert.deepEqual(page.requests[0], {
    endpoint: `https://www.canva.com/_ajax/documents/${DESIGN_ID}/acl`,
    requestBody: {
      document: DESIGN_ID,
      extension: EXTENSION,
      shareTokenChange: {
        "A?": "A",
        B: "C",
      },
    },
    timeoutMs: 15_000,
  });
  assert.deepEqual(page.requests[1], {
    endpoint: "https://www.canva.com/_ajax/shortlink/target",
    requestBody: {
      A: longUrl,
      B: TEMPLATE_TOKEN,
    },
    timeoutMs: 15_000,
  });
});

test("the service prefers a stored create_url over the fallback editor URL", async () => {
  const page = new MockCanvaPage({
    responses: [browserJson(aclPayload())],
  });
  const service = new CanvaTemplateLinkService({
    page,
    readPersistedResult: async () => null,
    persistResult: async () => {},
    shorteningEnabled: false,
  });
  const createUrl = "https://www.canva.com/d/create-from-api";

  await service.createForJob({
    jobId: "job-prefers-create-url",
    canvaCreateUrl: createUrl,
    canvaEditorUrl: EDITOR_URL,
  });

  assert.equal(page.gotoCalls[0].url, createUrl);
});

test("the service persists the resolved editor identity before requesting the ACL token", async () => {
  const page = new MockCanvaPage({
    responses: [
      browserJson(aclPayload()),
    ],
  });
  const persistedEditors = [];
  const service = new CanvaTemplateLinkService({
    page,
    readPersistedResult: async () => null,
    persistResolvedEditor: async (jobId, editor) => {
      persistedEditors.push({ jobId, editor, requestCount: page.requests.length });
    },
    persistResult: async () => {},
    shorteningEnabled: false,
  });

  await service.createForJob({
    jobId: "job-persist-editor-first",
    canvaCreateUrl: "https://www.canva.com/d/create123",
  });

  assert.deepEqual(persistedEditors, [
    {
      jobId: "job-persist-editor-first",
      editor: {
        canvaEditorUrl: EDITOR_URL,
        canvaDesignId: DESIGN_ID,
        canvaExtension: EXTENSION,
      },
      requestCount: 0,
    },
  ]);
  assert.equal(page.requests.length, 1);
});

test("an editor persistence failure stops before mutating the Canva ACL", async () => {
  const page = new MockCanvaPage({
    responses: [
      browserJson(aclPayload()),
    ],
  });
  const service = new CanvaTemplateLinkService({
    page,
    readPersistedResult: async () => null,
    persistResolvedEditor: async () => {
      throw new Error("disk unavailable");
    },
    persistResult: async () => {},
    shorteningEnabled: false,
  });

  await assert.rejects(
    service.createForJob({
      jobId: "job-editor-persistence-failure",
      canvaCreateUrl: "https://www.canva.com/d/create123",
    }),
    {
      code: CANVA_TEMPLATE_LINK_ERROR_CODES.PERSISTENCE_FAILED,
      phase: "persist_editor",
    },
  );
  assert.equal(page.requests.length, 0);
});

test("HTTP 200 with a non-JSON ACL body reports only safe response diagnostics", async () => {
  const sensitiveBody = "<html>SECRET_SESSION_CHALLENGE</html>";
  const page = new MockCanvaPage({
    responses: [
      {
        ok: true,
        status: 200,
        jsonValid: false,
        payload: null,
        responseMeta: {
          bodyKind: "html",
          bodyLength: sensitiveBody.length,
          contentTypeCategory: "html",
          unsafeBody: sensitiveBody,
        },
      },
    ],
  });
  const events = [];
  const service = new CanvaTemplateLinkService({
    page,
    readPersistedResult: async () => null,
    persistResult: async () => {},
    shorteningEnabled: false,
    logger: (event) => events.push(event),
  });

  let caught;
  try {
    await service.createForJob({
      jobId: "job-non-json-acl",
      canvaEditorUrl: EDITOR_URL,
    });
  } catch (error) {
    caught = error;
  }

  assert.equal(caught?.code, CANVA_TEMPLATE_LINK_ERROR_CODES.RESPONSE_SCHEMA_CHANGED);
  assert.equal(caught?.statusCode, 200);
  assert.deepEqual(caught?.schemaSummary?.responseMeta, {
    bodyKind: "html",
    bodyLength: sensitiveBody.length,
    contentTypeCategory: "html",
    prefixKind: null,
  });
  assert.equal(JSON.stringify(caught).includes("SECRET_SESSION_CHALLENGE"), false);
  assert.equal(JSON.stringify(events).includes("SECRET_SESSION_CHALLENGE"), false);
});

test("the in-page ACL fetch relies on browser credentials without exporting session headers", async () => {
  const page = new ExecutingFetchPage({ fetchPayload: aclPayload() });
  const service = new CanvaTemplateLinkService({
    page,
    readPersistedResult: async () => null,
    persistResult: async () => {},
    shorteningEnabled: false,
  });

  await service.createForJob({
    jobId: "job-executed-page-fetch",
    canvaEditorUrl: EDITOR_URL,
  });

  assert.equal(page.fetchCalls.length, 1);
  const [{ url, options }] = page.fetchCalls;
  assert.equal(
    url,
    `https://www.canva.com/_ajax/documents/${DESIGN_ID}/acl`,
  );
  assert.equal(options.method, "POST");
  assert.equal(options.credentials, "include");
  assert.equal(options.cache, "no-store");
  assert.deepEqual(options.headers, {
    Accept: "application/json",
    "Content-Type": "application/json;charset=UTF-8",
  });
  assert.deepEqual(JSON.parse(options.body), {
    document: DESIGN_ID,
    extension: EXTENSION,
    shareTokenChange: {
      "A?": "A",
      B: "C",
    },
  });
  assert.equal(Object.hasOwn(options.headers, "Cookie"), false);
  assert.equal(Object.hasOwn(options.headers, "Authorization"), false);
  assert.equal(Object.hasOwn(options.headers, "X-Canva-Authz"), false);
});

test("the in-page ACL parser accepts validated Canva JSON after a text prefix", async () => {
  for (const prefix of ["for(;;);", ")]}',\n", "CANVA_PRIVATE_RESPONSE\n"]) {
    const page = new ExecutingFetchPage({
      fetchPayload: null,
      fetchText: `${prefix}${JSON.stringify(aclPayload())}`,
      fetchContentType: "text/plain;charset=UTF-8",
    });
    const service = new CanvaTemplateLinkService({
      page,
      readPersistedResult: async () => null,
      persistResult: async () => {},
      shorteningEnabled: false,
    });

    const result = await service.createForJob({
      jobId: `job-prefixed-${prefix.startsWith("for")
        ? "for"
        : prefix.startsWith(")")
          ? "bracket"
          : "other"}`,
      canvaEditorUrl: EDITOR_URL,
    });

    assert.equal(result.canvaTemplateToken, TEMPLATE_TOKEN);
    assert.equal(result.canvaTemplateUrlType, "long");
  }
});

test("the service canonicalizes the editor origin before evaluating the private fetch", async () => {
  const variantEditorUrl = `https://design.canva.com/design/${DESIGN_ID}/${EXTENSION}/edit`;
  const page = new ExecutingFetchPage({
    fetchPayload: aclPayload(),
    finalUrls: [variantEditorUrl, EDITOR_URL],
  });
  const service = new CanvaTemplateLinkService({
    page,
    readPersistedResult: async () => null,
    persistResult: async () => {},
    shorteningEnabled: false,
  });

  await service.createForJob({
    jobId: "job-canonical-private-origin",
    canvaEditorUrl: variantEditorUrl,
  });

  assert.deepEqual(page.evaluateOrigins, ["https://www.canva.com"]);
  assert.equal(page.gotoCalls.length, 2);
  assert.equal(new URL(page.gotoCalls[1].url).origin, "https://www.canva.com");
});

test("shortener 5xx failures are bounded and fall back to the usable long URL", async () => {
  const page = new MockCanvaPage({
    responses: [
      browserJson(aclPayload()),
      browserJson({ error: "temporary" }, 503),
      browserJson({ error: "temporary" }, 502),
    ],
  });
  const service = new CanvaTemplateLinkService({
    page,
    readPersistedResult: async () => null,
    persistResult: async () => {},
    maxAttempts: 2,
    retryBaseDelayMs: 0,
    sleep: async () => {},
  });

  const result = await service.createForJob({
    jobId: "job-shortener-fallback",
    canvaEditorUrl: EDITOR_URL,
  });

  assert.equal(result.canvaTemplateUrlType, "long");
  assert.equal(result.canvaTemplateUrl, result.canvaTemplateLongUrl);
  assert.deepEqual(result.canvaTemplateShortenerError, {
    code: CANVA_TEMPLATE_LINK_ERROR_CODES.SHORTENER_FAILED,
    category: "shortener",
  });
  assert.equal(page.requests.length, 3);
});

test("shortener validation failures also preserve the long URL", async () => {
  const page = new MockCanvaPage({
    responses: [
      browserJson(aclPayload()),
      browserJson({
        A: {
          A: "https://canva.link/wrong-destination",
          B: "https://www.canva.com/design/other/token/view",
        },
      }),
    ],
  });
  const service = new CanvaTemplateLinkService({
    page,
    readPersistedResult: async () => null,
    persistResult: async () => {},
  });

  const result = await service.createForJob({
    jobId: "job-wrong-short-destination",
    canvaEditorUrl: EDITOR_URL,
  });

  assert.equal(result.canvaTemplateUrl, result.canvaTemplateLongUrl);
  assert.equal(
    result.canvaTemplateShortenerError.code,
    CANVA_TEMPLATE_LINK_ERROR_CODES.SHORTENER_DESTINATION_MISMATCH,
  );
});

test("ACL 5xx responses retry, while a permission rejection does not", async (t) => {
  await t.test("5xx retries then succeeds", async () => {
    const page = new MockCanvaPage({
      responses: [
        browserJson({ error: "temporary" }, 503),
        browserJson(aclPayload()),
      ],
    });
    const service = new CanvaTemplateLinkService({
      page,
      readPersistedResult: async () => null,
      persistResult: async () => {},
      shorteningEnabled: false,
      maxAttempts: 2,
      retryBaseDelayMs: 0,
      sleep: async () => {},
    });

    const result = await service.createForJob({
      jobId: "job-acl-retry",
      canvaEditorUrl: EDITOR_URL,
    });

    assert.equal(result.canvaTemplateUrlType, "long");
    assert.equal(page.requests.length, 2);
  });

  await t.test("403 fails without retry", async () => {
    const page = new MockCanvaPage({
      responses: [browserJson({ error: "forbidden" }, 403)],
    });
    const service = new CanvaTemplateLinkService({
      page,
      readPersistedResult: async () => null,
      persistResult: async () => {},
      shorteningEnabled: false,
      maxAttempts: 3,
      retryBaseDelayMs: 0,
      sleep: async () => {},
    });

    await assert.rejects(
      service.createForJob({
        jobId: "job-acl-forbidden",
        canvaEditorUrl: EDITOR_URL,
      }),
      {
        code: CANVA_TEMPLATE_LINK_ERROR_CODES.ACL_REJECTED,
        statusCode: 403,
        retryable: false,
      },
    );
    assert.equal(page.requests.length, 1);
  });
});

test("ACL authentication failures are explicit and never retried", async () => {
  const page = new MockCanvaPage({
    responses: [browserJson({ error: "unauthorized" }, 401)],
  });
  const service = new CanvaTemplateLinkService({
    page,
    readPersistedResult: async () => null,
    persistResult: async () => {},
    shorteningEnabled: false,
    maxAttempts: 3,
  });

  await assert.rejects(
    service.createForJob({
      jobId: "job-no-session",
      canvaEditorUrl: EDITOR_URL,
    }),
    {
      code: CANVA_TEMPLATE_LINK_ERROR_CODES.AUTH_SESSION_MISSING,
      statusCode: 401,
    },
  );
  assert.equal(page.requests.length, 1);
});

test("ACL page timeouts retry, while non-timeout network errors do not", async (t) => {
  await t.test("page-context timeout retries then succeeds", async () => {
    const page = new MockCanvaPage({
      responses: [
        { requestError: "timeout" },
        browserJson(aclPayload()),
      ],
    });
    const service = new CanvaTemplateLinkService({
      page,
      readPersistedResult: async () => null,
      persistResult: async () => {},
      shorteningEnabled: false,
      maxAttempts: 2,
      retryBaseDelayMs: 0,
      sleep: async () => {},
    });

    const result = await service.createForJob({
      jobId: "job-acl-timeout",
      canvaEditorUrl: EDITOR_URL,
    });

    assert.equal(result.canvaTemplateUrlType, "long");
    assert.equal(page.requests.length, 2);
  });

  await t.test("generic network failure is not blindly retried", async () => {
    const page = new MockCanvaPage({
      responses: [{ requestError: "network" }],
    });
    const service = new CanvaTemplateLinkService({
      page,
      readPersistedResult: async () => null,
      persistResult: async () => {},
      shorteningEnabled: false,
      maxAttempts: 3,
      retryBaseDelayMs: 0,
      sleep: async () => {},
    });

    await assert.rejects(
      service.createForJob({
        jobId: "job-acl-network",
        canvaEditorUrl: EDITOR_URL,
      }),
      {
        code: CANVA_TEMPLATE_LINK_ERROR_CODES.PAGE_REQUEST_FAILED,
        retryable: false,
      },
    );
    assert.equal(page.requests.length, 1);
  });
});

test("two concurrent calls for one job make only one ACL request", async () => {
  let releaseAcl;
  let markAclStarted;
  const aclStarted = new Promise((resolve) => {
    markAclStarted = resolve;
  });
  const aclGate = new Promise((resolve) => {
    releaseAcl = resolve;
  });
  const page = new MockCanvaPage({
    responses: [
      async () => {
        markAclStarted();
        await aclGate;
        return browserJson(aclPayload());
      },
    ],
  });
  let persistCalls = 0;
  const service = new CanvaTemplateLinkService({
    page,
    readPersistedResult: async () => null,
    persistResult: async () => {
      persistCalls += 1;
    },
    shorteningEnabled: false,
  });
  const input = {
    jobId: "job-concurrent",
    canvaEditorUrl: EDITOR_URL,
  };

  const first = service.createForJob(input);
  const second = service.createForJob(input);
  await aclStarted;
  releaseAcl();
  const [firstResult, secondResult] = await Promise.all([first, second]);

  assert.deepEqual(secondResult, firstResult);
  assert.equal(page.gotoCalls.length, 1);
  assert.equal(page.requests.length, 1);
  assert.equal(persistCalls, 1);
});

test("pages acquired from getAuthenticatedPage are closed after success", async () => {
  const page = new MockCanvaPage({
    responses: [browserJson(aclPayload())],
  });
  const service = new CanvaTemplateLinkService({
    getAuthenticatedPage: async () => page,
    readPersistedResult: async () => null,
    persistResult: async () => {},
    shorteningEnabled: false,
  });

  const result = await service.createForJob({
    jobId: "job-acquired-page-success",
    canvaEditorUrl: EDITOR_URL,
  });

  assert.equal(result.canvaTemplateUrlType, "long");
  assert.equal(page.closeCalls, 1);
});

test("pages acquired from getAuthenticatedPage are closed after failure", async () => {
  const page = new MockCanvaPage({
    responses: [browserJson({ error: "forbidden" }, 403)],
  });
  const service = new CanvaTemplateLinkService({
    getAuthenticatedPage: async () => page,
    readPersistedResult: async () => null,
    persistResult: async () => {},
    shorteningEnabled: false,
  });

  await assert.rejects(
    service.createForJob({
      jobId: "job-acquired-page-failure",
      canvaEditorUrl: EDITOR_URL,
    }),
    { code: CANVA_TEMPLATE_LINK_ERROR_CODES.ACL_REJECTED },
  );
  assert.equal(page.closeCalls, 1);
});

test("directly supplied pages are shared and are not automatically closed", async () => {
  const page = new MockCanvaPage({
    responses: [browserJson(aclPayload())],
  });
  const service = new CanvaTemplateLinkService({
    page,
    readPersistedResult: async () => null,
    persistResult: async () => {},
    shorteningEnabled: false,
  });

  await service.createForJob({
    jobId: "job-shared-page",
    canvaEditorUrl: EDITOR_URL,
  });

  assert.equal(page.closeCalls, 0);
});

test("closeAcquiredPage can retain a getter-acquired shared page", async () => {
  const page = new MockCanvaPage({
    responses: [browserJson(aclPayload())],
  });
  const service = new CanvaTemplateLinkService({
    getAuthenticatedPage: async () => page,
    closeAcquiredPage: false,
    readPersistedResult: async () => null,
    persistResult: async () => {},
    shorteningEnabled: false,
  });

  await service.createForJob({
    jobId: "job-retained-acquired-page",
    canvaEditorUrl: EDITOR_URL,
  });

  assert.equal(page.closeCalls, 0);
});

test("the coordinator rechecks persisted state after acquiring the job lock", async () => {
  const persisted = makePersistedResult();
  let reads = 0;
  const service = new CanvaTemplateLinkService({
    readPersistedResult: async () => {
      reads += 1;
      return reads === 1 ? null : persisted;
    },
    persistResult: async () => {
      throw new Error("must not persist an already stored result");
    },
  });

  const result = await service.createForJob({
    jobId: "job-persisted-recheck",
    canvaEditorUrl: EDITOR_URL,
  });

  assert.equal(result, persisted);
  assert.equal(reads, 2);
});

test("a persistence-only retry does not issue a second ACL request", async () => {
  const page = new MockCanvaPage({
    responses: [browserJson(aclPayload())],
  });
  let persistenceCalls = 0;
  const service = new CanvaTemplateLinkService({
    page,
    readPersistedResult: async () => null,
    persistResult: async () => {
      persistenceCalls += 1;
      if (persistenceCalls === 1) throw new Error("disk temporarily unavailable");
    },
    shorteningEnabled: false,
  });
  const input = {
    jobId: "job-persist-retry",
    canvaEditorUrl: EDITOR_URL,
  };

  await assert.rejects(
    service.createForJob(input),
    { code: CANVA_TEMPLATE_LINK_ERROR_CODES.PERSISTENCE_FAILED },
  );
  const recovered = await service.createForJob(input);

  assert.equal(recovered.canvaTemplateUrlType, "long");
  assert.equal(page.requests.length, 1);
  assert.equal(persistenceCalls, 2);
});

test("private endpoint and shortener flags are independent", async (t) => {
  await t.test("private endpoint disabled blocks ACL work", async () => {
    const service = new CanvaTemplateLinkService({
      privateEndpointEnabled: false,
      readPersistedResult: async () => null,
    });

    await assert.rejects(
      service.createForJob({
        jobId: "job-disabled",
        canvaEditorUrl: EDITOR_URL,
      }),
      { code: CANVA_TEMPLATE_LINK_ERROR_CODES.PRIVATE_ENDPOINT_DISABLED },
    );
  });

  await t.test("shortener disabled still creates and persists the long link", async () => {
    const page = new MockCanvaPage({
      responses: [browserJson(aclPayload())],
    });
    const service = new CanvaTemplateLinkService({
      page,
      readPersistedResult: async () => null,
      persistResult: async () => {},
      shorteningEnabled: false,
    });

    const result = await service.createForJob({
      jobId: "job-no-shortener",
      canvaEditorUrl: EDITOR_URL,
    });

    assert.equal(result.canvaTemplateUrlType, "long");
    assert.equal(page.requests.length, 1);
  });
});

test("an authentication probe can stop work before navigation or private traffic", async () => {
  const page = new MockCanvaPage({
    responses: [browserJson(aclPayload())],
  });
  const service = new CanvaTemplateLinkService({
    page,
    isAuthenticatedPage: async () => false,
    readPersistedResult: async () => null,
    persistResult: async () => {},
  });

  await assert.rejects(
    service.createForJob({
      jobId: "job-auth-probe",
      canvaEditorUrl: EDITOR_URL,
    }),
    { code: CANVA_TEMPLATE_LINK_ERROR_CODES.AUTH_SESSION_MISSING },
  );
  assert.equal(page.gotoCalls.length, 0);
  assert.equal(page.requests.length, 0);
});

test("sanitized logs never include extensions, tokens, or sensitive URLs", async () => {
  const events = [];
  const page = new MockCanvaPage({
    responses: [browserJson(aclPayload())],
  });
  const service = new CanvaTemplateLinkService({
    page,
    readPersistedResult: async () => null,
    persistResult: async () => {},
    shorteningEnabled: false,
    logger: (event) => events.push(event),
  });

  await service.createForJob({
    jobId: "job-sanitized-log",
    canvaEditorUrl: EDITOR_URL,
  });

  const serialized = JSON.stringify(events);
  assert.ok(events.length > 0);
  assert.doesNotMatch(serialized, new RegExp(EXTENSION));
  assert.doesNotMatch(serialized, new RegExp(TEMPLATE_TOKEN));
  assert.doesNotMatch(serialized, /https:\/\//);
  assert.match(serialized, new RegExp(DESIGN_ID));
});

test("persisted-result validation requires a coherent HTTPS result", () => {
  assert.equal(isUsablePersistedCanvaTemplateResult(makePersistedResult()), true);
  assert.equal(
    isUsablePersistedCanvaTemplateResult(makePersistedResult({
      canvaTemplateUrl: "http://canva.link/insecure",
    })),
    false,
  );
  assert.equal(
    isUsablePersistedCanvaTemplateResult(makePersistedResult({
      canvaTemplateUrlType: "long",
      canvaTemplateUrl: "https://canva.link/not-the-long-url",
    })),
    false,
  );
  assert.equal(
    isUsablePersistedCanvaTemplateResult(makePersistedResult({
      canvaTemplateLongUrl: "https://evil.test/design/not/canva/view",
      canvaTemplateUrl: "https://evil.test/design/not/canva/view",
    })),
    false,
  );
  assert.equal(
    isUsablePersistedCanvaTemplateResult(makePersistedResult({
      canvaTemplateUrlType: "short",
      canvaTemplateUrl: "https://evil.test/short",
    })),
    false,
  );
  assert.equal(
    isUsablePersistedCanvaTemplateResult(makePersistedResult({
      canvaEditorUrl: "https://www.canva.com/design/DIFFERENT123/other_extension/edit",
    })),
    false,
  );
});

test("service errors expose stable categories without provider response bodies", () => {
  const error = new CanvaTemplateLinkError(
    CANVA_TEMPLATE_LINK_ERROR_CODES.ACL_REJECTED,
    {
      category: "acl_rejected",
      phase: "acl",
      statusCode: 403,
    },
  );

  assert.equal(error.code, CANVA_TEMPLATE_LINK_ERROR_CODES.ACL_REJECTED);
  assert.equal(error.category, "acl_rejected");
  assert.equal(error.phase, "acl");
  assert.equal(error.statusCode, 403);
  assert.equal(error.retryable, false);
  assert.doesNotMatch(error.message, /cookie|authorization|token/i);
});

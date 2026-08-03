import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";

import { PROJECT_ROOT, startLocalServer } from "./helpers/local-server.mjs";

function localWeddingProject() {
  return {
    mode: "template",
    eventType: "wedding",
    packType: "Full_pack",
    language: "en",
    templateId: "olive_minimal",
    couple: { person1: "RSVP", person2: "Admin" },
    invitation: {
      date: "2027-09-19",
      time: "15:00",
      location: "Lisbon, Portugal",
      message: "RSVP admin regression test.",
    },
    links: { mapsUrl: "" },
    attendance: { enabled: true, formUrl: "" },
    website: { enabled: true, details: {} },
    hasPhoto: false,
    hasCustomTemplate: false,
    hasMusic: false,
  };
}

function adminBrowserScript(html) {
  const matches = [...html.matchAll(/<script>([\s\S]*?)<\/script>/gi)];
  assert.equal(matches.length, 1, "RSVP Admin should contain one inline browser script");
  return matches[0][1];
}

function browserElement() {
  return {
    value: "",
    textContent: "",
    innerHTML: "",
    href: "",
    hidden: false,
    disabled: false,
    classList: { add() {} },
    addEventListener() {},
  };
}

test("generated RSVP Admin code form loads entries for its wedding", async () => {
  const server = await startLocalServer({
    env: {
      ACCESS_CODE_REQUIRED: "1",
      RSVP_ADMIN_LOCAL_BYPASS: "1",
      PUBLIC_BASE_URL: "",
    },
  });
  let requestId = "";
  let outputFilename = "";

  try {
    const createResponse = await fetch(`${server.baseUrl}/api/operator/local-test-website`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ project: JSON.stringify(localWeddingProject()) }),
    });
    const createBody = await createResponse.json();
    assert.equal(createResponse.status, 201, JSON.stringify(createBody));
    requestId = createBody.data.requestId;

    const jobPath = path.join(PROJECT_ROOT, "generated", "jobs", `${requestId}.json`);
    const job = JSON.parse(await fs.readFile(jobPath, "utf8"));
    outputFilename = job.outputFilename;

    const submitResponse = await fetch(`${server.baseUrl}/api/public/rsvp/${requestId}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        guestName: "Guest One",
        email: `guest-${requestId}@example.com`,
        contact: "+351 900 000 000",
        attendance: "yes",
        message: "See you there.",
      }),
    });
    assert.equal(submitResponse.status, 201, server.output.join(""));

    const adminUrl = `${server.baseUrl}${createBody.data.rsvpAdminUrl}`;
    const adminResponse = await fetch(adminUrl);
    const adminHtml = await adminResponse.text();
    assert.equal(adminResponse.status, 200);

    // Exercise the same access-code branch used by the hosted production page.
    // Local previews normally bypass it, so switch only the generated config flag.
    const script = adminBrowserScript(adminHtml)
      .replace('"accessRequired":false', '"accessRequired":true');
    assert.ok(script.includes("replace(/\\D/g,'')"));
    assert.ok(script.includes("replace(/\\/?$/,'/csv')"));
    assert.doesNotThrow(() => new vm.Script(script, { filename: "RSVP-ADMIN.inline.js" }));

    const elements = new Map();
    const getElement = (id) => {
      if (!elements.has(id)) elements.set(id, browserElement());
      return elements.get(id);
    };
    let requestedUrl = "";
    const context = vm.createContext({
      document: { getElementById: getElement },
      encodeURIComponent,
      fetch: async (url, options) => {
        requestedUrl = String(url);
        return fetch(url, options);
      },
      sessionStorage: {
        getItem() { return ""; },
        setItem() {},
      },
      URL,
      window: { location: { href: adminUrl } },
    });
    new vm.Script(script, { filename: "RSVP-ADMIN.inline.js" }).runInContext(context);
    getElement("accessCode").value = "12-34-56";
    await vm.runInContext("load()", context);

    assert.equal(new URL(requestedUrl).searchParams.get("code"), "123456");
    assert.equal(getElement("total").textContent, 1);
    assert.match(getElement("rows").innerHTML, /Guest One/);
    assert.equal(getElement("tableWrap").hidden, false);
  } finally {
    await server.stop();
    if (requestId) {
      await fs.rm(path.join(PROJECT_ROOT, "generated", "jobs", `${requestId}.json`), { force: true });
      await fs.rm(path.join(PROJECT_ROOT, "generated", "rsvp", requestId), { recursive: true, force: true });
      await fs.rm(path.join(PROJECT_ROOT, "generated", "sites", requestId), { recursive: true, force: true });
    }
    if (outputFilename) {
      await fs.rm(path.join(PROJECT_ROOT, "generated", outputFilename), { force: true });
    }
  }
});

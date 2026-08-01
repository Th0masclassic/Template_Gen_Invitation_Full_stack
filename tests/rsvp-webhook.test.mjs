import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { PROJECT_ROOT, startLocalServer } from "./helpers/local-server.mjs";

function webhookPayload({ eventId, requestId, name, email, attendance, message }) {
  return {
    event_id: eventId,
    event_type: "submission",
    form_id: "h0hvstph",
    submission_id: `submission-${eventId}`,
    completed_at: new Date().toISOString(),
    fields: [
      { id: "request_id", question: "request_id", type: "hidden", answer: requestId },
      { id: "language", question: "language", type: "hidden", answer: "pt" },
      { id: "couple", question: "couple", type: "hidden", answer: "Ana & Luís" },
      { id: "guest_name", question: "O TEU NOME", type: "input", answer: name },
      { id: "guest_email", question: "EMAIL", type: "email", answer: email },
      { id: "attendance", question: "VAIS ESTAR PRESENTE?", type: "multiple_choice", answer: attendance },
      { id: "message", question: "MENSAGEM PARA O CASAL", type: "textarea", answer: message },
    ],
  };
}

async function writeTestJob(requestId) {
  const jobPath = path.join(PROJECT_ROOT, "generated", "jobs", `${requestId}.json`);
  await fs.mkdir(path.dirname(jobPath), { recursive: true });
  await fs.writeFile(jobPath, JSON.stringify({
    requestId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    imageConfirmed: true,
    project: {
      language: "pt",
      couple: { person1: "Ana", person2: "Luís" },
      attendance: { enabled: true, formUrl: "https://app.youform.com/forms/h0hvstph" },
      website: { enabled: true, details: {} },
    },
    rsvp: { submissionCount: 0, lastSubmissionAt: null },
  }), "utf8");
  return jobPath;
}

async function sendSignedWebhook(baseUrl, secret, payload) {
  const body = JSON.stringify(payload);
  const signature = crypto.createHmac("sha256", secret).update(body).digest("hex");
  return fetch(`${baseUrl}/api/integrations/youform/webhook`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Signature: signature,
    },
    body,
  });
}

test("signed Youform submissions stay isolated by wedding request_id", async (context) => {
  const secret = `test-youform-${crypto.randomUUID()}`;
  const requestA = crypto.randomUUID();
  const requestB = crypto.randomUUID();
  const jobPaths = await Promise.all([writeTestJob(requestA), writeTestJob(requestB)]);
  const rsvpDirs = [requestA, requestB].map((requestId) => path.join(PROJECT_ROOT, "generated", "rsvp", requestId));
  const server = await startLocalServer({
    env: {
      YOUFORM_WEBHOOK_SECRET: secret,
      MAX_CONCURRENT_GENERATIONS: "0",
    },
  });
  context.after(async () => {
    await server.stop();
    await Promise.all(jobPaths.map((jobPath) => fs.rm(jobPath, { force: true })));
    await Promise.all(rsvpDirs.map((rsvpDir) => fs.rm(rsvpDir, { recursive: true, force: true })));
  });

  const responseA = await sendSignedWebhook(server.baseUrl, secret, webhookPayload({
    eventId: "event-wedding-a",
    requestId: requestA,
    name: "Guest A",
    email: "same.guest@example.com",
    attendance: "Não vou conseguir estar presente",
    message: "Com carinho.",
  }));
  assert.equal(responseA.status, 200, server.output.join(""));
  assert.deepEqual((await responseA.json()).data, {
    accepted: true,
    matched: true,
    duplicate: false,
  });

  const responseB = await sendSignedWebhook(server.baseUrl, secret, webhookPayload({
    eventId: "event-wedding-b",
    requestId: requestB,
    name: "Guest B",
    email: "same.guest@example.com",
    attendance: "Aceito com alegria",
    message: "Até breve!",
  }));
  assert.equal(responseB.status, 200, server.output.join(""));

  const [adminA, adminB] = await Promise.all([
    fetch(`${server.baseUrl}/api/customer/jobs/${requestA}/rsvp`),
    fetch(`${server.baseUrl}/api/customer/jobs/${requestB}/rsvp`),
  ]);
  assert.equal(adminA.status, 200);
  assert.equal(adminB.status, 200);
  const bodyA = await adminA.json();
  const bodyB = await adminB.json();
  assert.equal(bodyA.data.summary.total, 1);
  assert.equal(bodyA.data.entries[0].name, "Guest A");
  assert.equal(bodyA.data.entries[0].email, "same.guest@example.com");
  assert.equal(bodyA.data.entries[0].attendance, "no");
  assert.equal(bodyB.data.summary.total, 1);
  assert.equal(bodyB.data.entries[0].name, "Guest B");
  assert.equal(bodyB.data.entries[0].email, "same.guest@example.com");
  assert.equal(bodyB.data.entries[0].attendance, "yes");

  const duplicate = await sendSignedWebhook(server.baseUrl, secret, webhookPayload({
    eventId: "event-wedding-a-second-submission",
    requestId: requestA,
    name: "Guest A changed name",
    email: "SAME.GUEST@example.com",
    attendance: "Não vou conseguir estar presente",
    message: "Duplicado",
  }));
  assert.equal(duplicate.status, 200);
  assert.equal((await duplicate.json()).data.duplicate, true);
  const adminAAfterDuplicate = await fetch(`${server.baseUrl}/api/customer/jobs/${requestA}/rsvp`).then((response) => response.json());
  assert.equal(adminAAfterDuplicate.data.summary.total, 1);
});

import assert from "node:assert/strict";
import test from "node:test";

import {
  extractRsvpEmailFromFields,
  findRsvpFieldAnswer,
  normalizeRsvpAttendance,
} from "../rsvp-utils.mjs";

test("Portuguese Youform attendance choices map correctly", () => {
  assert.equal(normalizeRsvpAttendance("Aceito com alegria"), "yes");
  assert.equal(normalizeRsvpAttendance("Não vou conseguir estar presente"), "no");
});

test("Youform answers are found from Portuguese question labels", () => {
  const fields = [
    { id: "guest-name", question: "O TEU NOME", type: "input", answer: "Ana Silva" },
    { id: "attendance", question: "VAIS ESTAR PRESENTE?", type: "multiple_choice", answer: "Aceito com alegria" },
    { id: "message", question: "MENSAGEM PARA O CASAL", type: "textarea", answer: "Até breve!" },
  ];
  assert.equal(findRsvpFieldAnswer(fields, { keys: ["nome", "name"] }), "Ana Silva");
  assert.equal(findRsvpFieldAnswer(fields, { keys: ["presente", "attendance"] }), "Aceito com alegria");
  assert.equal(findRsvpFieldAnswer(fields, { keys: ["mensagem", "message"] }), "Até breve!");
});

test("Youform email extraction remains optional", () => {
  assert.equal(extractRsvpEmailFromFields([{ type: "email", answer: " Guest@Example.com " }]), "guest@example.com");
  assert.equal(extractRsvpEmailFromFields([{ type: "input", question: "O TEU NOME", answer: "Ana" }]), "");
});

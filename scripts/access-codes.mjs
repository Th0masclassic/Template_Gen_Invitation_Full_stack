import path from "node:path";
import { fileURLToPath } from "node:url";

import { createAccessCodeStore, normalizeAccessCode } from "../access-code-store.mjs";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(SCRIPT_DIR, "..");
const storePath = process.env.ACCESS_CODE_STORE_PATH
  ? path.resolve(ROOT_DIR, process.env.ACCESS_CODE_STORE_PATH)
  : path.join(ROOT_DIR, "generated", "access-codes.json");
const store = createAccessCodeStore({ filePath: storePath });
await store.initialize();

const args = process.argv.slice(2);
const command = String(args.shift() || "create").toLowerCase();

function option(name, fallback = "") {
  const index = args.indexOf(name);
  return index >= 0 ? String(args[index + 1] ?? fallback) : fallback;
}

function printTable(records) {
  if (!records.length) {
    console.log("No access codes found.");
    return;
  }
  console.table(records.map((record) => ({
    code: record.code,
    state: record.state,
    pack: record.packType || "",
    creation: record.creationMode || "both",
    event: record.eventType || "",
    source: record.source || "manual",
    label: record.label || "",
    requestId: record.requestId || "",
    createdAt: record.createdAt,
    claimedAt: record.claimedAt || "",
  })));
}

if (command === "create") {
  const count = option("--count", args.find((value) => /^\d+$/.test(value)) || "1");
  const label = option("--label", "");
  const requestedPack = option("--pack", "full").toLowerCase();
  const requestedMode = option("--mode", "both").toLowerCase();
  const requestedEvent = option("--event", "wedding").toLowerCase();
  const packType = ["invite", "invite_only", "normal", "template_only"].includes(requestedPack)
    ? "invite_only_pack"
    : (["digital", "digital_pdf", "pdf"].includes(requestedPack) ? "digital_pdf_pack" : "Full_pack");
  const creationMode = ["template", "custom_import"].includes(requestedMode) ? requestedMode : "both";
  const eventType = ["baby", "baby_shower", "baby-shower"].includes(requestedEvent)
    ? "baby_shower"
    : "wedding";
  const records = await store.create({
    count,
    label,
    source: "manual",
    packType,
    creationMode,
    eventType,
  });
  console.log(records.length === 1 ? "Access code created:" : `${records.length} access codes created:`);
  printTable(records);
} else if (command === "list") {
  printTable(await store.list());
} else if (command === "revoke") {
  const code = normalizeAccessCode(args[0]);
  if (!code) throw new Error("Usage: npm run token:revoke -- 123456");
  const record = await store.revoke(code);
  if (!record) throw new Error("Access code not found.");
  console.log(`Access code ${record.code} revoked.`);
} else {
  console.log("Commands:");
  console.log("  npm run token:create -- --pack full --mode both --event wedding --label \"Venda direta 123\"");
  console.log("  npm run token:create -- --pack digital --mode template --count 5 --label \"Lote digital\"");
  console.log("  npm run token:list");
  console.log("  npm run token:revoke -- 123456");
  process.exitCode = 1;
}

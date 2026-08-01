import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const STORE_SCHEMA_VERSION = 3;
const CODE_RE = /^\d{6}$/;
const LOCK_RETRY_MS = 35;
const LOCK_TIMEOUT_MS = 10_000;
const STALE_LOCK_MS = 30_000;

function emptyStore() {
  return {
    schemaVersion: STORE_SCHEMA_VERSION,
    updatedAt: new Date().toISOString(),
    codes: [],
  };
}

export function normalizeAccessCode(value) {
  const code = String(value ?? "").replace(/\D/g, "");
  return CODE_RE.test(code) ? code : "";
}

function cleanLabel(value) {
  return String(value ?? "")
    .normalize("NFC")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

export function normalizeAccessPackType(value) {
  if (value === "Full_pack") return "Full_pack";
  if (value === "invite_only_pack" || value === "template_only_pack") return "invite_only_pack";
  if (value === "digital_pdf_pack") return "digital_pdf_pack";
  return null;
}

export function normalizeAccessCreationMode(value, { defaultValue = "both" } = {}) {
  if (value === "template" || value === "custom_import" || value === "both") return value;
  return defaultValue;
}

function cleanEventType(value) {
  if (value === "wedding") return "wedding";
  if (value === "baby_shower") return "baby_shower";
  return null;
}

function cleanSource(value) {
  const source = String(value || "").trim().toLowerCase();
  return ["manual", "etsy"].includes(source) ? source : "manual";
}

function cleanExternalOrderId(value) {
  return String(value ?? "")
    .replace(/[^a-zA-Z0-9:_-]/g, "")
    .slice(0, 160);
}

function cleanEmail(value) {
  const email = String(value ?? "").trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email.slice(0, 254) : "";
}

function normalizeEmailDelivery(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const state = ["sending", "delivered", "failed"].includes(value.state) ? value.state : "failed";
  return {
    state,
    attemptId: String(value.attemptId || "").slice(0, 160),
    startedAt: value.startedAt ? String(value.startedAt) : null,
    completedAt: value.completedAt ? String(value.completedAt) : null,
    providerMessageId: String(value.providerMessageId || "").slice(0, 200),
    error: String(value.error || "").slice(0, 500),
  };
}

function normalizeRecord(record) {
  const code = normalizeAccessCode(record?.code);
  if (!code) return null;
  return {
    code,
    label: cleanLabel(record?.label),
    source: cleanSource(record?.source),
    packType: normalizeAccessPackType(record?.packType),
    creationMode: normalizeAccessCreationMode(record?.creationMode),
    eventType: cleanEventType(record?.eventType),
    externalOrderId: cleanExternalOrderId(record?.externalOrderId),
    customerEmail: cleanEmail(record?.customerEmail),
    emailDelivery: normalizeEmailDelivery(record?.emailDelivery),
    createdAt: String(record?.createdAt || new Date().toISOString()),
    claimedAt: record?.claimedAt ? String(record.claimedAt) : null,
    requestId: record?.requestId ? String(record.requestId) : null,
    revokedAt: record?.revokedAt ? String(record.revokedAt) : null,
  };
}

function publicRecord(record) {
  if (!record) return null;
  return {
    code: record.code,
    label: record.label || "",
    source: record.source || "manual",
    packType: record.packType || null,
    creationMode: record.creationMode || "both",
    eventType: record.eventType || null,
    externalOrderId: record.externalOrderId || null,
    customerEmail: record.customerEmail || null,
    emailDelivery: record.emailDelivery || null,
    createdAt: record.createdAt,
    claimedAt: record.claimedAt || null,
    requestId: record.requestId || null,
    revokedAt: record.revokedAt || null,
    state: record.revokedAt ? "revoked" : record.requestId ? "claimed" : "unused",
  };
}

async function readJsonStore(filePath) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);
    const codes = Array.isArray(parsed?.codes)
      ? parsed.codes.map(normalizeRecord).filter(Boolean)
      : [];
    return {
      schemaVersion: STORE_SCHEMA_VERSION,
      updatedAt: String(parsed?.updatedAt || new Date().toISOString()),
      codes,
    };
  } catch (error) {
    if (error?.code === "ENOENT") return emptyStore();
    throw error;
  }
}

async function writeJsonAtomic(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.${process.pid}.${crypto.randomBytes(6).toString("hex")}.tmp`;
  try {
    await fs.writeFile(tempPath, `${JSON.stringify(value, null, 2)}\n`, {
      encoding: "utf8",
      mode: 0o600,
      flag: "wx",
    });
    await fs.rename(tempPath, filePath);
    await fs.chmod(filePath, 0o600).catch(() => {});
  } finally {
    await fs.rm(tempPath, { force: true }).catch(() => {});
  }
}

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function acquireLock(lockPath) {
  const deadline = Date.now() + LOCK_TIMEOUT_MS;
  while (Date.now() < deadline) {
    try {
      await fs.mkdir(path.dirname(lockPath), { recursive: true });
      const handle = await fs.open(lockPath, "wx", 0o600);
      await handle.writeFile(JSON.stringify({ pid: process.pid, createdAt: new Date().toISOString() }));
      return handle;
    } catch (error) {
      if (error?.code !== "EEXIST") throw error;
      try {
        const stat = await fs.stat(lockPath);
        if (Date.now() - stat.mtimeMs > STALE_LOCK_MS) {
          await fs.rm(lockPath, { force: true });
          continue;
        }
      } catch (statError) {
        if (statError?.code !== "ENOENT") throw statError;
      }
      await sleep(LOCK_RETRY_MS);
    }
  }
  const error = new Error("ACCESS_CODE_STORE_BUSY");
  error.code = "ACCESS_CODE_STORE_BUSY";
  throw error;
}

async function withLock(filePath, callback) {
  const lockPath = `${filePath}.lock`;
  const handle = await acquireLock(lockPath);
  try {
    return await callback();
  } finally {
    await handle.close().catch(() => {});
    await fs.rm(lockPath, { force: true }).catch(() => {});
  }
}

function randomSixDigitCode() {
  return String(crypto.randomInt(100_000, 1_000_000));
}

export function createAccessCodeStore({ filePath }) {
  const resolvedPath = path.resolve(filePath);

  async function initialize() {
    await fs.mkdir(path.dirname(resolvedPath), { recursive: true });
    try {
      await fs.access(resolvedPath);
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
      await withLock(resolvedPath, async () => {
        try {
          await fs.access(resolvedPath);
        } catch (innerError) {
          if (innerError?.code !== "ENOENT") throw innerError;
          await writeJsonAtomic(resolvedPath, emptyStore());
        }
      });
    }
  }

  async function list() {
    const store = await readJsonStore(resolvedPath);
    return store.codes
      .map(publicRecord)
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  }

  async function resolve(codeInput) {
    const code = normalizeAccessCode(codeInput);
    if (!code) return null;
    const store = await readJsonStore(resolvedPath);
    return publicRecord(store.codes.find((entry) => entry.code === code));
  }

  async function create({
    count = 1,
    label = "",
    source = "manual",
    packType = null,
    creationMode = "both",
    eventType = null,
    externalOrderId = "",
    customerEmail = "",
  } = {}) {
    const safeCount = Math.max(1, Math.min(100, Number.parseInt(String(count), 10) || 1));
    const safeLabel = cleanLabel(label);
    const safeSource = cleanSource(source);
    const safePackType = normalizeAccessPackType(packType);
    const safeCreationMode = normalizeAccessCreationMode(creationMode);
    const safeEventType = cleanEventType(eventType);
    const safeExternalOrderId = cleanExternalOrderId(externalOrderId);
    const safeCustomerEmail = cleanEmail(customerEmail);
    if (safeExternalOrderId && safeCount !== 1) {
      throw new TypeError("External-order access codes must be created one at a time.");
    }
    return withLock(resolvedPath, async () => {
      const store = await readJsonStore(resolvedPath);
      if (safeExternalOrderId) {
        const existingRecord = store.codes.find((entry) => entry.externalOrderId === safeExternalOrderId);
        if (existingRecord) return [publicRecord(existingRecord)];
      }
      const existing = new Set(store.codes.map((entry) => entry.code));
      const created = [];
      while (created.length < safeCount) {
        const code = randomSixDigitCode();
        if (existing.has(code)) continue;
        existing.add(code);
        const record = {
          code,
          label: safeLabel,
          source: safeSource,
          packType: safePackType,
          creationMode: safeCreationMode,
          eventType: safeEventType,
          externalOrderId: safeExternalOrderId,
          customerEmail: safeCustomerEmail,
          emailDelivery: null,
          createdAt: new Date().toISOString(),
          claimedAt: null,
          requestId: null,
          revokedAt: null,
        };
        store.codes.push(record);
        created.push(publicRecord(record));
      }
      store.updatedAt = new Date().toISOString();
      await writeJsonAtomic(resolvedPath, store);
      return created;
    });
  }

  async function createForExternalOrder({
    externalOrderId,
    label = "",
    source = "etsy",
    packType,
    creationMode = "both",
    eventType = "wedding",
    customerEmail,
  }) {
    const safeExternalOrderId = cleanExternalOrderId(externalOrderId);
    if (!safeExternalOrderId) throw new TypeError("externalOrderId is required.");
    const safePackType = normalizeAccessPackType(packType);
    const safeCreationMode = normalizeAccessCreationMode(creationMode);
    if (!safePackType) throw new TypeError("A valid packType is required.");
    const safeCustomerEmail = cleanEmail(customerEmail);
    if (!safeCustomerEmail) throw new TypeError("A valid customerEmail is required.");
    return withLock(resolvedPath, async () => {
      const store = await readJsonStore(resolvedPath);
      const existingRecord = store.codes.find((entry) => entry.externalOrderId === safeExternalOrderId);
      if (existingRecord) return { created: false, record: publicRecord(existingRecord) };
      const existingCodes = new Set(store.codes.map((entry) => entry.code));
      let code = "";
      while (!code || existingCodes.has(code)) code = randomSixDigitCode();
      const record = normalizeRecord({
        code,
        label,
        source,
        packType: safePackType,
        creationMode: safeCreationMode,
        eventType,
        externalOrderId: safeExternalOrderId,
        customerEmail: safeCustomerEmail,
        emailDelivery: null,
        createdAt: new Date().toISOString(),
        claimedAt: null,
        requestId: null,
        revokedAt: null,
      });
      store.codes.push(record);
      store.updatedAt = new Date().toISOString();
      await writeJsonAtomic(resolvedPath, store);
      return { created: true, record: publicRecord(record) };
    });
  }

  async function reserveEmailDelivery(codeInput, attemptIdInput, leaseMs = 5 * 60 * 1000) {
    const code = normalizeAccessCode(codeInput);
    const attemptId = String(attemptIdInput || "").trim().slice(0, 160);
    if (!code || !attemptId) return { ok: false, reason: "invalid" };
    return withLock(resolvedPath, async () => {
      const store = await readJsonStore(resolvedPath);
      const record = store.codes.find((entry) => entry.code === code);
      if (!record) return { ok: false, reason: "not_found" };
      if (record.emailDelivery?.state === "delivered") {
        return { ok: false, reason: "delivered", record: publicRecord(record) };
      }
      const startedAt = Date.parse(record.emailDelivery?.startedAt || 0);
      if (
        record.emailDelivery?.state === "sending"
        && Number.isFinite(startedAt)
        && Date.now() - startedAt < leaseMs
      ) {
        return { ok: false, reason: "in_progress", record: publicRecord(record) };
      }
      record.emailDelivery = {
        state: "sending",
        attemptId,
        startedAt: new Date().toISOString(),
        completedAt: null,
        providerMessageId: "",
        error: "",
      };
      store.updatedAt = new Date().toISOString();
      await writeJsonAtomic(resolvedPath, store);
      return { ok: true, reason: "reserved", record: publicRecord(record) };
    });
  }

  async function completeEmailDelivery(codeInput, attemptIdInput, providerMessageId = "") {
    const code = normalizeAccessCode(codeInput);
    const attemptId = String(attemptIdInput || "").trim().slice(0, 160);
    if (!code || !attemptId) return null;
    return withLock(resolvedPath, async () => {
      const store = await readJsonStore(resolvedPath);
      const record = store.codes.find((entry) => entry.code === code);
      if (!record || record.emailDelivery?.attemptId !== attemptId) return null;
      record.emailDelivery = {
        ...record.emailDelivery,
        state: "delivered",
        completedAt: new Date().toISOString(),
        providerMessageId: String(providerMessageId || "").slice(0, 200),
        error: "",
      };
      store.updatedAt = new Date().toISOString();
      await writeJsonAtomic(resolvedPath, store);
      return publicRecord(record);
    });
  }

  async function failEmailDelivery(codeInput, attemptIdInput, errorMessage = "") {
    const code = normalizeAccessCode(codeInput);
    const attemptId = String(attemptIdInput || "").trim().slice(0, 160);
    if (!code || !attemptId) return null;
    return withLock(resolvedPath, async () => {
      const store = await readJsonStore(resolvedPath);
      const record = store.codes.find((entry) => entry.code === code);
      if (!record || record.emailDelivery?.attemptId !== attemptId) return null;
      record.emailDelivery = {
        ...record.emailDelivery,
        state: "failed",
        completedAt: new Date().toISOString(),
        error: String(errorMessage || "").slice(0, 500),
      };
      store.updatedAt = new Date().toISOString();
      await writeJsonAtomic(resolvedPath, store);
      return publicRecord(record);
    });
  }

  async function claim(codeInput, requestIdInput) {
    const code = normalizeAccessCode(codeInput);
    const requestId = String(requestIdInput || "").trim();
    if (!code || !requestId) return { ok: false, reason: "invalid" };
    return withLock(resolvedPath, async () => {
      const store = await readJsonStore(resolvedPath);
      const record = store.codes.find((entry) => entry.code === code);
      if (!record) return { ok: false, reason: "not_found" };
      if (record.revokedAt) return { ok: false, reason: "revoked", record: publicRecord(record) };
      if (record.requestId) {
        return {
          ok: record.requestId === requestId,
          reason: record.requestId === requestId ? "already_claimed_by_request" : "already_claimed",
          record: publicRecord(record),
        };
      }
      record.requestId = requestId;
      record.claimedAt = new Date().toISOString();
      store.updatedAt = new Date().toISOString();
      await writeJsonAtomic(resolvedPath, store);
      return { ok: true, reason: "claimed", record: publicRecord(record) };
    });
  }

  async function release(codeInput, requestIdInput) {
    const code = normalizeAccessCode(codeInput);
    const requestId = String(requestIdInput || "").trim();
    if (!code || !requestId) return false;
    return withLock(resolvedPath, async () => {
      const store = await readJsonStore(resolvedPath);
      const record = store.codes.find((entry) => entry.code === code);
      if (!record || record.revokedAt || record.requestId !== requestId) return false;
      record.requestId = null;
      record.claimedAt = null;
      store.updatedAt = new Date().toISOString();
      await writeJsonAtomic(resolvedPath, store);
      return true;
    });
  }

  async function revoke(codeInput) {
    const code = normalizeAccessCode(codeInput);
    if (!code) return null;
    return withLock(resolvedPath, async () => {
      const store = await readJsonStore(resolvedPath);
      const record = store.codes.find((entry) => entry.code === code);
      if (!record) return null;
      if (!record.revokedAt) record.revokedAt = new Date().toISOString();
      store.updatedAt = new Date().toISOString();
      await writeJsonAtomic(resolvedPath, store);
      return publicRecord(record);
    });
  }

  return {
    filePath: resolvedPath,
    initialize,
    list,
    resolve,
    create,
    createForExternalOrder,
    reserveEmailDelivery,
    completeEmailDelivery,
    failEmailDelivery,
    claim,
    release,
    revoke,
  };
}

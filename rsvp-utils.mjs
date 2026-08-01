export function normalizeRsvpEmail(value) {
  const email = String(value || "").trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}

function rsvpFieldDescriptor(field) {
  return [field?.id, field?.name, field?.question, field?.type]
    .map((value) => String(value || "").trim().toLowerCase())
    .filter(Boolean)
    .join(" ");
}

export function findRsvpFieldAnswer(fields, { keys = [], types = [] } = {}) {
  const safeFields = Array.isArray(fields) ? fields : [];
  const normalizedKeys = keys.map((value) => String(value).toLowerCase());
  const normalizedTypes = types.map((value) => String(value).toLowerCase());
  for (const field of safeFields) {
    const descriptor = rsvpFieldDescriptor(field);
    const type = String(field?.type || "").trim().toLowerCase();
    if (
      (normalizedTypes.length && normalizedTypes.some((candidate) => type.includes(candidate)))
      || (normalizedKeys.length && normalizedKeys.some((candidate) => descriptor.includes(candidate)))
    ) {
      const answer = String(field?.answer ?? "").trim();
      if (answer) return answer;
    }
  }
  return "";
}

export function extractRsvpEmailFromFields(fields) {
  return normalizeRsvpEmail(findRsvpFieldAnswer(fields, {
    keys: ["email", "e-mail", "correio"],
    types: ["email"],
  }));
}

export function normalizeRsvpAttendance(value) {
  const answer = String(value || "").trim().toLowerCase();
  if (!answer) return "";

  // Check declines before accepts. Phrases such as the Portuguese
  // "Não vou conseguir estar presente" contain "presente", but are a decline.
  if (
    /^(no|não|nao|non|nein)$/.test(answer)
    || /(declin|regret|não vou|nao vou|não consigo|nao consigo|unable|cannot|can't|not attend|absent)/.test(answer)
  ) return "no";
  if (
    /^(yes|sim|si|sí|oui|ja)$/.test(answer)
    || /(accept|aceit|attend|presente|assistir|comparecer)/.test(answer)
  ) return "yes";
  return answer.slice(0, 120);
}

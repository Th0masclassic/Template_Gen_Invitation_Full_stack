export const TEMPLATE_ONLY_MAX_VERSIONS = 5;

export function isTemplateOnlyJourney({ entitlement = null, templateAccess = null, job = null, project = null } = {}) {
  if (job?.templateOnlyJourney === true || job?.project?.templateOnlyJourney === true || project?.templateOnlyJourney === true) {
    return true;
  }
  return Boolean(
    entitlement?.packType === "invite_only_pack"
    && (String(entitlement?.templateId || "").trim() || templateAccess?.template?.id),
  );
}

export function generationTargetForTemplateOnly(enabled) {
  return enabled ? "invitation" : "both";
}

export function templateOnlyCanCreateAnotherVersion(versionsUsed) {
  const used = Number(versionsUsed);
  return Number.isInteger(used) && used >= 0 && used < TEMPLATE_ONLY_MAX_VERSIONS;
}

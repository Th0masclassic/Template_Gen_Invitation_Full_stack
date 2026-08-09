export function buildTemplatePhotoGuidance({ templateOnly = false, hasCustomerPhoto = false } = {}) {
  if (!templateOnly) return "";

  if (!hasCustomerPhoto) {
    return `
NO CUSTOMER PHOTO — KEEP THE PURCHASED ARTWORK:
- The customer did not upload a replacement photo.
- Keep Image 1's existing sample people, illustration, painted scene, landmarks and background artwork.
- Do not invent a new couple, family, portrait, location or scene.
- Change only the customer text and the small layout adjustments needed to fit that text.
`.trim();
  }

  return `
CUSTOMER PHOTO REPLACEMENT — MANDATORY:
- Image 1 controls the invitation layout and artistic treatment: palette, watercolour/pencil/gouache/ink technique, line quality, paper grain, brush texture, decorative borders, typography mood and visual balance.
- Image 2 controls the depicted content: the real people, their identity, number, pose, facial features, skin tone, hair, approximate age, body proportions, clothing, relationship, camera angle, crop and visible surroundings.
- Repaint the people and scene from Image 2 in the artistic medium and visual language learned from Image 1. The result must look newly illustrated in that style, never like a rectangular photograph pasted onto the invitation.
- Replace every sample person, couple, family or portrait from Image 1. Do not retain, blend with or borrow facial features, clothing, pose or identity from the sample people.
- Replace scene-specific sample scenery with what is actually visible in Image 2. A tower, monument, skyline, building, mountain, beach or other landmark that exists only in Image 1 must be removed. Include a landmark only when it is genuinely visible in Image 2.
- If Image 2 has a plain, cropped, blurred or indistinct background, continue it with a restrained neutral painted background that suits Image 1. Never restore Image 1's sample location merely to fill empty space.
- Preserve recognizable identity while translating photographic detail into the template's medium. Do not beautify into different people, change ethnicity, add or remove people, swap clothes, invent wedding attire or substantially alter pose.
- Preserve Image 1's non-scene invitation structure, text hierarchy, border, decorative framing and safe margins. These photo-replacement rules override general preserve-artwork instructions only for the sample people and sample scenery being replaced.
`.trim();
}

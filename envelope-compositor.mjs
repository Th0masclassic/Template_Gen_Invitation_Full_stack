import sharp from "sharp";

export const ENVELOPE_COMPOSITE_WIDTH = 768;
export const ENVELOPE_COMPOSITE_HEIGHT = 1360;
export const ENVELOPE_GOLD = "#D4AF37";

function validHexColour(value) {
  const colour = String(value || "").trim().toUpperCase();
  return /^#[0-9A-F]{6}$/.test(colour) ? colour : "";
}

/**
 * Apply one material colour while retaining the source highlights, shadows
 * and transparency. `sharp.tint()` leaves white pixels white and therefore
 * cannot reliably turn a red generated seal gold or white paper pastel.
 */
export async function colourizeImagePreservingAlpha(source, colour) {
  const safeColour = validHexColour(colour);
  if (!safeColour) {
    return sharp(source, { failOn: "warning", sequentialRead: true })
      .ensureAlpha()
      .png()
      .toBuffer();
  }
  const normalized = await sharp(source, { failOn: "warning", sequentialRead: true })
    .ensureAlpha()
    .png()
    .toBuffer();
  const metadata = await sharp(normalized).metadata();
  const width = Number(metadata.width || 0);
  const height = Number(metadata.height || 0);
  if (!width || !height) throw new TypeError("The image to colourize has invalid dimensions.");
  const colourLayer = await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: safeColour,
    },
  }).png().toBuffer();
  const grayscale = await sharp(normalized)
    .modulate({ saturation: 0 })
    .png()
    .toBuffer();
  return sharp(grayscale)
    .composite([
      { input: colourLayer, blend: "multiply" },
      // Porter-Duff destination-in restores the exact original alpha mask.
      { input: normalized, blend: "dest-in" },
    ])
    .png()
    .toBuffer();
}

async function fullCanvasLayer(source, {
  width,
  height,
  scale,
  shiftY,
  origin = "center",
  tint = "",
  coverTopEdge = false,
}) {
  const pipeline = sharp(source, { failOn: "warning", sequentialRead: true })
    .rotate()
    .resize(width, height, { fit: "cover", position: "centre" })
    .ensureAlpha();
  const safeTint = validHexColour(tint);
  const normalized = await pipeline.png().toBuffer();
  const base = safeTint
    ? await colourizeImagePreservingAlpha(normalized, safeTint)
    : normalized;
  const scaledWidth = Math.max(1, Math.round(width * scale));
  let verticalScale = scale;
  let verticalShift = shiftY;
  if (coverTopEdge && origin === "top") {
    const { data, info } = await sharp(base)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const topCoveragePixels = Math.ceil(info.width * 0.99);
    const bottomCoveragePixels = Math.max(1, Math.ceil(info.width * 0.001));
    let opaqueTop = -1;
    let opaqueBottom = -1;

    for (let y = 0; y < info.height; y += 1) {
      let coveredPixels = 0;
      for (let x = 0; x < info.width; x += 1) {
        if (data[((y * info.width) + x) * info.channels + 3] >= 64) coveredPixels += 1;
      }
      if (opaqueTop < 0 && coveredPixels >= topCoveragePixels) opaqueTop = y;
      if (coveredPixels >= bottomCoveragePixels) opaqueBottom = y;
    }

    const currentVisibleTop = verticalShift + (opaqueTop * verticalScale);
    const currentVisibleBottom = verticalShift + (opaqueBottom * verticalScale);
    if (opaqueTop >= 0 && opaqueBottom > opaqueTop && currentVisibleTop > 0 && currentVisibleBottom > 0) {
      const contentHeight = opaqueBottom - opaqueTop;
      const fittedScale = currentVisibleBottom / contentHeight;
      // A malformed replacement asset must not trigger an unbounded resize.
      // The canonical flap needs only about 6% extra vertical scale.
      verticalScale = Math.min(Math.max(verticalScale, fittedScale), verticalScale * 1.35);
      // Two pixels of bleed prevent a hairline after integer resize rounding.
      verticalShift = -(opaqueTop * verticalScale) - 2;
    }
  }
  const scaledHeight = Math.max(1, Math.round(height * verticalScale));
  const scaled = await sharp(base)
    .resize(scaledWidth, scaledHeight, { fit: "fill" })
    .png()
    .toBuffer();
  const left = Math.round((width - scaledWidth) / 2);
  const top = Math.round((origin === "top" ? 0 : (height - scaledHeight) / 2) + verticalShift);
  const visibleLeft = Math.max(0, left);
  const visibleTop = Math.max(0, top);
  const cropLeft = Math.max(0, -left);
  const cropTop = Math.max(0, -top);
  const visibleWidth = Math.min(width - visibleLeft, scaledWidth - cropLeft);
  const visibleHeight = Math.min(height - visibleTop, scaledHeight - cropTop);
  if (visibleWidth <= 0 || visibleHeight <= 0) return null;
  const input = await sharp(scaled)
    .extract({ left: cropLeft, top: cropTop, width: visibleWidth, height: visibleHeight })
    .png()
    .toBuffer();
  return { input, left: visibleLeft, top: visibleTop };
}

/**
 * Rebuild the mobile website envelope as one portrait image. The transforms
 * intentionally mirror website-template/styles.css so the result preview,
 * PDF cover and live website keep the same panel and seal placement.
 */
export async function composeLayeredEnvelope({
  topSource,
  bottomSource,
  sealSource,
  envelopeColour = "",
  width = ENVELOPE_COMPOSITE_WIDTH,
  height = ENVELOPE_COMPOSITE_HEIGHT,
  sealGold = ENVELOPE_GOLD,
  coverTopEdge = false,
} = {}) {
  if (!topSource || !bottomSource || !sealSource) {
    throw new TypeError("topSource, bottomSource and sealSource are required.");
  }
  const colour = validHexColour(envelopeColour);
  const gold = validHexColour(sealGold) || ENVELOPE_GOLD;
  const [bottom, top, seal] = await Promise.all([
    fullCanvasLayer(bottomSource, {
      width,
      height,
      scale: 1.1,
      shiftY: -72,
      origin: "center",
      tint: colour,
    }),
    fullCanvasLayer(topSource, {
      width,
      height,
      scale: 1.1,
      shiftY: -210,
      origin: "top",
      tint: colour,
      coverTopEdge,
    }),
    fullCanvasLayer(sealSource, {
      width,
      height,
      scale: 0.45,
      shiftY: 158,
      origin: "center",
      tint: gold,
    }),
  ]);
  const layers = [bottom, top, seal].filter(Boolean);
  return sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite(layers)
    .png({ compressionLevel: 9 })
    .toBuffer();
}

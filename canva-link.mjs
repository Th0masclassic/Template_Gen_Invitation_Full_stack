export function parseDesignLink(value) {
  if (typeof value !== "string") return null;
  let url;
  try {
    url = new URL(value.trim());
  } catch {
    return null;
  }

  const host = url.hostname.toLowerCase();
  if (url.protocol !== "https:" || (host !== "canva.com" && !host.endsWith(".canva.com"))) return null;

  const pathDesignId = url.pathname.match(/\/design\/([^/?#]+)/i)?.[1] || "";
  const queryDesignId = url.searchParams.get("designId") || "";
  const designId = decodeURIComponent(queryDesignId || pathDesignId);
  if (!designId || !/^[a-z0-9_-]{6,120}$/i.test(designId)) return null;

  return {
    designId,
    editUrl: url.toString(),
  };
}

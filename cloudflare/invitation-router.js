const CONTENT_TYPES = {
  html: "text/html; charset=utf-8",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  css: "text/css; charset=utf-8",
  js: "application/javascript; charset=utf-8",
  mp3: "audio/mpeg",
  ics: "text/calendar; charset=utf-8",
  json: "application/json; charset=utf-8",
};

export default {
  async fetch(request, env) {
    if (!["GET", "HEAD"].includes(request.method)) {
      return new Response("Method not allowed", { status: 405, headers: { Allow: "GET, HEAD" } });
    }

    const url = new URL(request.url);
    let key = decodeURIComponent(url.pathname.replace(/^\/+/, ""));
    if (!key.startsWith("sites/") || key.includes("..") || key.includes("\\")) {
      return new Response("Not found", { status: 404 });
    }
    if (!key || key.endsWith("/")) key += "index.html";

    const object = await env.INVITATION_SITES.get(key);
    if (!object) return new Response("Invitation not found", { status: 404 });

    const extension = key.split(".").pop().toLowerCase();
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    if (Number.isFinite(object.size)) headers.set("content-length", String(object.size));
    headers.set("content-type", CONTENT_TYPES[extension] || headers.get("content-type") || "application/octet-stream");
    headers.set("cache-control", extension === "html"
      ? "public, max-age=300, must-revalidate"
      : "public, max-age=31536000, immutable");
    headers.set("x-content-type-options", "nosniff");
    headers.set("referrer-policy", "strict-origin-when-cross-origin");
    if (extension === "html") {
      headers.set("content-security-policy", [
        "default-src 'self'",
        "img-src 'self' data: https://app.youform.com",
        "script-src 'self' 'unsafe-inline' https://app.youform.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' data: https://fonts.gstatic.com",
        "frame-src https://app.youform.com https://youform.com https://*.youform.com",
        "connect-src 'self' https://app.youform.com https://youform.com https://*.youform.com",
        "base-uri 'self'",
        "object-src 'none'",
        "form-action 'self' https://youform.com https://*.youform.com",
      ].join("; "));
    }

    return new Response(request.method === "HEAD" ? null : object.body, { headers });
  },
};

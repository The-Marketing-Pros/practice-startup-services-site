// CF Pages middleware — runs on every request.
// Purpose: serve X-Robots-Tag: noindex on any non-canonical hostname (.pages.dev preview deploys,
// preview branch deploys, etc.) to prevent duplicate-content exposure once the canonical domain goes live.
//
// Allowlist: only practicestartupservices.com + www.practicestartupservices.com get indexed.
// Everything else (pages.dev primary, pages.dev preview branches, custom test domains) gets noindex.

const CANONICAL_HOSTNAMES = ["practicestartupservices.com", "www.practicestartupservices.com"];

export const onRequest: PagesFunction = async ({ request, next }) => {
  const response = await next();
  const host = new URL(request.url).hostname.toLowerCase();

  if (!CANONICAL_HOSTNAMES.includes(host)) {
    // Mutate response to add X-Robots-Tag header (cloned because Response headers are immutable on the original)
    const newHeaders = new Headers(response.headers);
    newHeaders.set("X-Robots-Tag", "noindex, nofollow");
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  }

  return response;
};

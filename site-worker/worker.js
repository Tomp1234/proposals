// Serves the static proposals site. Every request goes to the asset files,
// except the root and any root-level file (index.html, README.md, config),
// which would otherwise expose the list of every proposal.
export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    const rootLevel = !pathname.slice(1).includes("/");
    if (pathname === "/" || (rootLevel && (pathname.includes(".") || pathname === "/index"))) {
      return new Response("Not found", {
        status: 404,
        headers: { "X-Robots-Tag": "noindex, nofollow" },
      });
    }
    const response = await env.ASSETS.fetch(request);
    const headers = new Headers(response.headers);
    headers.set("X-Robots-Tag", "noindex, nofollow");
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  },
};

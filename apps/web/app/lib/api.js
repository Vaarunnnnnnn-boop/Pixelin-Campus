const BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:4000";

async function request(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    credentials: "include",
    headers:
      body !== undefined
        ? { "Content-Type": "application/json" }
        : {},
    body:
      body !== undefined
        ? JSON.stringify(body)
        : undefined
  });

  if (!res.ok) {
    let msg = `${method} ${path} failed: ${res.status}`;
    try {
      const j = await res.json();
      if (j?.error) msg = j.error;
    } catch {}
    throw new Error(msg);
  }

  if (res.status === 204) return null;

  const json = await res.json();

  // API returns either { data: ... } (Fastify routes in index.js)
  // or a plain value (Express admin.js routes).
  // If { data } exists, unwrap it; otherwise return as-is.
  return json && typeof json === "object" && "data" in json
    ? json.data
    : json;
}

export const apiGet   = (path)        => request("GET",    path);
export const apiPost  = (path, body)  => request("POST",   path, body);
export const apiPut   = (path, body)  => request("PUT",    path, body);
export const apiPatch = (path, body)  => request("PATCH",  path, body); // was calling PUT — now fixed
export const apiDel   = (path)        => request("DELETE", path);
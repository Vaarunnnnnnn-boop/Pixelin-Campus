// lib/api.js

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

/**
 * Core fetch wrapper.
 * - Always sends cookies (credentials: "include") — required for cross-origin
 *   sessions between Vercel (frontend) and Render (backend).
 * - Throws an Error with .message set to the server's { error } string so
 *   catch blocks in pages can display it directly.
 */
async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    // ✅ Required for cross-origin cookie sessions (Vercel → Render)
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  let json;
  try {
    json = await res.json();
  } catch {
    throw new Error(`Server error (${res.status})`);
  }

  if (!res.ok) {
    // ✅ Backend sends { error: "..." } — surface that message
    throw new Error(json?.error || `Request failed (${res.status})`);
  }

  return json;
}

export function apiGet(path, options = {}) {
  return apiFetch(path, { method: "GET", ...options });
}

export function apiPost(path, body, options = {}) {
  return apiFetch(path, {
    method: "POST",
    body: JSON.stringify(body),
    ...options,
  });
}

export function apiPut(path, body, options = {}) {
  return apiFetch(path, {
    method: "PUT",
    body: JSON.stringify(body),
    ...options,
  });
}

export function apiDelete(path, options = {}) {
  return apiFetch(path, { method: "DELETE", ...options });
}
const BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://pixelin-campus.onrender.com";

async function request(method, path, body) {
  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      credentials: "include",

      headers:
        body !== undefined
          ? {
              "Content-Type": "application/json"
            }
          : {},

      body:
        body !== undefined
          ? JSON.stringify(body)
          : undefined
    });

    // HANDLE NON-JSON RESPONSES
    const contentType =
      res.headers.get("content-type") || "";

    let json = null;

    if (contentType.includes("application/json")) {
      json = await res.json();
    }

    // HANDLE ERRORS
    if (!res.ok) {
      throw new Error(
        json?.error ||
          `${method} ${path} failed (${res.status})`
      );
    }

    // HANDLE EMPTY RESPONSES
    if (res.status === 204) {
      return null;
    }

    // UNWRAP { data: ... }
    return json &&
      typeof json === "object" &&
      "data" in json
      ? json.data
      : json;

  } catch (err) {
    console.error("API ERROR:", err);

    throw new Error(
      err.message ||
      "Failed to connect to server"
    );
  }
}

export const apiGet = (path) =>
  request("GET", path);

export const apiPost = (path, body) =>
  request("POST", path, body);

export const apiPut = (path, body) =>
  request("PUT", path, body);

export const apiPatch = (path, body) =>
  request("PATCH", path, body);

export const apiDel = (path) =>
  request("DELETE", path);
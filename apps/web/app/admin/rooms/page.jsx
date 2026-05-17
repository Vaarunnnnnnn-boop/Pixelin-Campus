"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPost } from "../../lib/api";
import { useMe } from "../../lib/useMe";

export default function AdminRoomsPage() {
  const me = useMe();
  const [items, setItems] = useState([]);
  const [building, setBuilding] = useState("");
  const [name, setName] = useState("");
  const [label, setLabel] = useState("");
  const [msg, setMsg] = useState("");

  async function load() {
    const data = await apiGet("/admin/rooms");
    setItems(data);
  }

  useEffect(() => {
    if (me && me.role === "ADMIN") load().catch((e) => setMsg(e.message));
  }, [me]);

  async function onCreate(e) {
    e.preventDefault();
    setMsg("");
    try {
      if (!name.trim()) return setMsg("Room name/number required");
      await apiPost("/admin/rooms", { building, name, label });
      setBuilding("");
      setName("");
      setLabel("");
      await load();
    } catch (err) {
      setMsg(err.message);
    }
  }

  if (me === undefined) return <p style={{ padding: 24 }}>Loading...</p>;
  if (!me) {
    window.location.href = "/login";
    return null;
  }
  if (me.role !== "ADMIN") return <p style={{ padding: 24 }}>Forbidden</p>;

  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>Rooms</h1>
      <p><a href="/admin">← Back</a></p>

      <form onSubmit={onCreate} style={{ display: "grid", gap: 8, maxWidth: 520, marginTop: 12 }}>
        <input
          value={building}
          onChange={(e) => setBuilding(e.target.value)}
          placeholder="Building (optional) e.g., Block A"
        />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Room number/name e.g., 203"
        />
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Label (optional) e.g., Room 203 - Block A"
        />
        <button type="submit" style={{ width: 120 }}>Add</button>
      </form>

      {msg ? <p style={{ marginTop: 12, color: "crimson" }}>{msg}</p> : null}

      <table border="1" cellPadding="8" style={{ borderCollapse: "collapse", marginTop: 12 }}>
        <thead>
          <tr>
            <th>Building</th>
            <th>Name</th>
            <th>Label</th>
            <th>ID</th>
          </tr>
        </thead>
        <tbody>
          {items.map((r) => (
            <tr key={r.id}>
              <td>{r.building || "-"}</td>
              <td>{r.name}</td>
              <td>{r.label || "-"}</td>
              <td><code>{r.id}</code></td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
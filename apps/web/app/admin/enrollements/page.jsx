"use client";

import { useEffect, useMemo, useState } from "react";
import { apiGet, apiPost } from "../../lib/api";
import { useMe } from "../../lib/useMe";

export default function AdminEnrollmentsPage() {
  const me = useMe();

  const [sections, setSections] = useState([]);
  const [students, setStudents] = useState([]);
  const [items, setItems] = useState([]);
  const [msg, setMsg] = useState("");

  const [sectionId, setSectionId] = useState("");
  const [studentId, setStudentId] = useState("");

  async function load() {
    const [secs, users, enrolls] = await Promise.all([
      apiGet("/admin/sections"),
      apiGet("/admin/users"),
      apiGet("/admin/enrollments")
    ]);

    const studs = users.filter((u) => u.role === "STUDENT");

    setSections(secs);
    setStudents(studs);
    setItems(enrolls);

    if (!sectionId && secs.length) setSectionId(secs[0].id);
    if (!studentId && studs.length) setStudentId(studs[0].id);
  }

  useEffect(() => {
    if (me && me.role === "ADMIN") load().catch((e) => setMsg(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me]);

  const sectionLabelById = useMemo(() => {
    const m = new Map();
    for (const s of sections) m.set(s.id, `${s.department?.name} / ${s.name}`);
    return m;
  }, [sections]);

  async function onCreate(e) {
    e.preventDefault();
    setMsg("");
    try {
      if (!sectionId || !studentId) return setMsg("Select section and student");
      await apiPost("/admin/enrollments", { sectionId, studentId });
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
      <h1>Enrollments</h1>
      <p><a href="/admin">← Back</a></p>

      <h3 style={{ marginTop: 16 }}>Enroll student into section</h3>

      {sections.length === 0 ? (
        <p style={{ color: "crimson" }}>Create sections first.</p>
      ) : students.length === 0 ? (
        <p style={{ color: "crimson" }}>Create student users first.</p>
      ) : (
        <form onSubmit={onCreate} style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 12 }}>
          <select value={sectionId} onChange={(e) => setSectionId(e.target.value)}>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.department?.name} / {s.name}
              </option>
            ))}
          </select>

          <select value={studentId} onChange={(e) => setStudentId(e.target.value)}>
            {students.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.email})
              </option>
            ))}
          </select>

          <button type="submit">Enroll</button>
        </form>
      )}

      {msg ? <p style={{ marginTop: 12, color: "crimson" }}>{msg}</p> : null}

      <h3 style={{ marginTop: 20 }}>Current enrollments</h3>
      <table border="1" cellPadding="8" style={{ borderCollapse: "collapse", marginTop: 12 }}>
        <thead>
          <tr>
            <th>Section</th>
            <th>Student</th>
            <th>ID</th>
          </tr>
        </thead>
        <tbody>
          {items.map((e) => (
            <tr key={e.id}>
              <td>{e.section?.department?.name} / {e.section?.name}</td>
              <td>{e.student?.name} ({e.student?.email})</td>
              <td><code>{e.id}</code></td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
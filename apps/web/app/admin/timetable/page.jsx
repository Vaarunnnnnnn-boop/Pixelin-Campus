"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "../../components/AppShell";
import { apiGet, apiPost, apiDel } from "../../lib/api";
import { Button, Card, Input, Table } from "../../components/ui";

const DAYS = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 0, label: "Sunday" },
];

const DAY_COLORS = {
  1: "bg-blue-50 border-blue-200 text-blue-800",
  2: "bg-purple-50 border-purple-200 text-purple-800",
  3: "bg-green-50 border-green-200 text-green-800",
  4: "bg-orange-50 border-orange-200 text-orange-800",
  5: "bg-pink-50 border-pink-200 text-pink-800",
  6: "bg-yellow-50 border-yellow-200 text-yellow-800",
  0: "bg-slate-50 border-slate-200 text-slate-800",
};

function dayLabel(d) {
  return DAYS.find((k) => k.value === d)?.label || String(d);
}

function Select({ label, value, onChange, children, required }) {
  return (
    <div>
      <div className="mb-1 text-xs font-semibold text-slate-600">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </div>
      <select
        className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200 bg-white"
        value={value}
        onChange={onChange}
      >
        {children}
      </select>
    </div>
  );
}

export default function AdminTimetablePage() {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [items, setItems] = useState([]);

  // form state
  const [sectionId, setSectionId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [facultyId, setFacultyId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");

  // filter
  const [filterDay, setFilterDay] = useState("all");
  const [filterSection, setFilterSection] = useState("all");
  const [q, setQ] = useState("");

  async function load() {
    setLoading(true);
    try {
      const [secs, subs, rms, users, tt] = await Promise.all([
        apiGet("/admin/sections"),
        apiGet("/admin/subjects"),
        apiGet("/admin/rooms"),
        apiGet("/admin/users"),
        apiGet("/admin/timetable"),
      ]);
      const facs = (users || []).filter((u) => u.role === "FACULTY");
      setSections(Array.isArray(secs) ? secs : []);
      setSubjects(Array.isArray(subs) ? subs : []);
      setRooms(Array.isArray(rms) ? rms : []);
      setFaculty(facs);
      setItems(Array.isArray(tt) ? tt : []);

      if (!sectionId && secs?.length) setSectionId(secs[0].id);
      if (!subjectId && subs?.length) setSubjectId(subs[0].id);
      if (!facultyId && facs.length) setFacultyId(facs[0].id);
      if (!roomId && rms?.length) setRoomId(rms[0].id);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []); // eslint-disable-line

  const roomMap = useMemo(() => {
    const m = new Map();
    for (const r of rooms) {
      m.set(r.id, r.label || `${r.building?.name ? r.building.name + " / " : ""}${r.name}`);
    }
    return m;
  }, [rooms]);

  async function onCreate(e) {
    e.preventDefault();
    setMsg("");
    if (!sectionId || !subjectId || !facultyId || !roomId)
      return setMsg("Please select section, subject, faculty and room.");
    if (!startTime || !endTime)
      return setMsg("Start and end time required.");
    if (startTime >= endTime)
      return setMsg("End time must be after start time.");

    setBusy(true);
    try {
      await apiPost("/admin/timetable", {
        sectionId, subjectId, facultyId, roomId,
        dayOfWeek: Number(dayOfWeek), startTime, endTime,
      });
      await load();
      setMsg("");
    } catch (err) {
      setMsg(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id) {
    if (!confirm("Delete this timetable entry?")) return;
    setBusy(true);
    try {
      await apiDel(`/admin/timetable/${id}`);
      await load();
    } catch (err) {
      setMsg(err.message);
    } finally {
      setBusy(false);
    }
  }

  const missing =
    sections.length === 0 ? "sections" :
    subjects.length === 0 ? "subjects" :
    rooms.length === 0 ? "rooms" :
    faculty.length === 0 ? "faculty users" : null;

  // filtered items
  const filtered = items.filter((t) => {
    const matchDay = filterDay === "all" || t.dayOfWeek === Number(filterDay);
    const matchSec = filterSection === "all" || t.sectionId === filterSection;
    const matchQ = !q.trim() || [
      t.subject?.name, t.subject?.code,
      t.faculty?.name, t.section?.name,
      dayLabel(t.dayOfWeek),
    ].join(" ").toLowerCase().includes(q.toLowerCase());
    return matchDay && matchSec && matchQ;
  });

  // group by day for weekly view
  const byDay = useMemo(() => {
    const map = new Map();
    for (const d of DAYS) map.set(d.value, []);
    for (const t of filtered) {
      if (!map.has(t.dayOfWeek)) map.set(t.dayOfWeek, []);
      map.get(t.dayOfWeek).push(t);
    }
    return map;
  }, [filtered]);

  const hasEntries = filtered.length > 0;

  return (
    <AppShell title="Timetable">
      <div className="grid grid-cols-1 gap-6">

        {/* ── CREATE FORM ── */}
        <Card
          title="Create Timetable Entry"
          description="Assign a subject, faculty, room and time slot to a section"
          right={
            <Button onClick={onCreate} disabled={busy || !!missing}>
              {busy ? "Adding…" : "Add Slot"}
            </Button>
          }
        >
          {missing ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              ⚠️ Missing <strong>{missing}</strong> — please create them first before building the timetable.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Select label="Section" required value={sectionId} onChange={(e) => setSectionId(e.target.value)}>
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.department?.name} › {s.name}
                  </option>
                ))}
              </Select>

              <Select label="Subject" required value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} — {s.name}
                  </option>
                ))}
              </Select>

              <Select label="Faculty" required value={facultyId} onChange={(e) => setFacultyId(e.target.value)}>
                {faculty.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </Select>

              <Select label="Room" required value={roomId} onChange={(e) => setRoomId(e.target.value)}>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>{roomMap.get(r.id)}</option>
                ))}
              </Select>

              <Select label="Day" required value={dayOfWeek} onChange={(e) => setDayOfWeek(e.target.value)}>
                {DAYS.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </Select>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="mb-1 text-xs font-semibold text-slate-600">Start Time <span className="text-red-500">*</span></div>
                  <input
                    type="time"
                    className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div>
                  <div className="mb-1 text-xs font-semibold text-slate-600">End Time <span className="text-red-500">*</span></div>
                  <input
                    type="time"
                    className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {msg && (
            <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {msg}
            </div>
          )}
        </Card>

        {/* ── FILTERS ── */}
        <Card title="Timetable" description={loading ? "Loading…" : `${filtered.length} entry(ies)`}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3 mb-5">
            <div>
              <div className="mb-1 text-xs font-semibold text-slate-600">Filter by Day</div>
              <select
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200 bg-white"
                value={filterDay}
                onChange={(e) => setFilterDay(e.target.value)}
              >
                <option value="all">All Days</option>
                {DAYS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
            <div>
              <div className="mb-1 text-xs font-semibold text-slate-600">Filter by Section</div>
              <select
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200 bg-white"
                value={filterSection}
                onChange={(e) => setFilterSection(e.target.value)}
              >
                <option value="all">All Sections</option>
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>{s.department?.name} › {s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <div className="mb-1 text-xs font-semibold text-slate-600">Search</div>
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Subject, faculty, section…" />
            </div>
          </div>

          {/* Weekly card view */}
          {loading ? (
            <div className="py-10 text-center text-sm text-slate-400">Loading timetable…</div>
          ) : !hasEntries ? (
            <div className="py-10 text-center text-sm text-slate-400">
              No timetable entries yet. Add your first slot above.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {DAYS.map((day) => {
                const dayEntries = byDay.get(day.value) || [];
                if (dayEntries.length === 0) return null;
                const colorClass = DAY_COLORS[day.value] || "bg-slate-50 border-slate-200 text-slate-800";
                return (
                  <div key={day.value}>
                    <div className={`mb-2 inline-flex items-center rounded-lg border px-3 py-1 text-xs font-bold ${colorClass}`}>
                      {day.label}
                    </div>
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
                      {dayEntries
                        .sort((a, b) => a.startTime.localeCompare(b.startTime))
                        .map((t) => (
                          <div key={t.id} className="rounded-2xl border bg-white p-4 shadow-sm hover:shadow-md transition">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="text-sm font-bold text-slate-900">
                                  {t.subject?.code} — {t.subject?.name}
                                </div>
                                <div className="text-xs text-slate-500 mt-0.5">
                                  {t.startTime} – {t.endTime}
                                </div>
                              </div>
                              <button
                                onClick={() => onDelete(t.id)}
                                className="text-slate-300 hover:text-red-500 transition text-lg leading-none"
                                title="Delete"
                              >
                                ×
                              </button>
                            </div>
                            <div className="mt-3 grid gap-1 text-xs text-slate-600">
                              <div className="flex items-center gap-1">
                                <span className="text-slate-400">👤</span>
                                <span>{t.faculty?.name}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-slate-400">🏫</span>
                                <span>{t.section?.department?.name} › {t.section?.name}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-slate-400">🚪</span>
                                <span>{t.room?.label || `${t.room?.building?.name ? t.room.building.name + " / " : ""}${t.room?.name}`}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

      </div>
    </AppShell>
  );
}
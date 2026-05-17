"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "../../components/AppShell";
import { apiGet } from "../../lib/api";
import { Card } from "../../components/ui";
import Link from "next/link";

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

const TODAY = new Date().getDay(); // 0=Sun

function dayLabel(d) {
  return DAYS.find((k) => k.value === d)?.label || String(d);
}

export default function FacultyTimetablePage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiGet("/faculty/timetable")
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // group by day
  const byDay = useMemo(() => {
    const map = new Map();
    for (const d of DAYS) map.set(d.value, []);
    for (const t of items) {
      if (!map.has(t.dayOfWeek)) map.set(t.dayOfWeek, []);
      map.get(t.dayOfWeek).push(t);
    }
    return map;
  }, [items]);

  // today's classes
  const todayItems = (byDay.get(TODAY) || []).sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <AppShell title="My Timetable">
      <div className="grid grid-cols-1 gap-5">

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {/* Today's classes highlight */}
        <Card
          title={`Today — ${DAYS.find(d => d.value === TODAY)?.label || "Today"}`}
          description={loading ? "Loading…" : todayItems.length === 0 ? "No classes today" : `${todayItems.length} class(es)`}
        >
          {loading ? (
            <div className="py-6 text-center text-sm text-slate-400">Loading…</div>
          ) : todayItems.length === 0 ? (
            <div className="py-6 text-center text-sm text-slate-400">You have no classes scheduled today.</div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {todayItems.map((t) => (
                <TimetableCard key={t.id} t={t} showAttendance />
              ))}
            </div>
          )}
        </Card>

        {/* Full weekly schedule */}
        <Card
          title="Weekly Schedule"
          description={loading ? "Loading…" : `${items.length} total slot(s)`}
        >
          {loading ? (
            <div className="py-10 text-center text-sm text-slate-400">Loading timetable…</div>
          ) : items.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-400">
              No timetable entries assigned to you yet. Contact admin.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5">
              {DAYS.map((day) => {
                const dayEntries = (byDay.get(day.value) || []).sort((a, b) => a.startTime.localeCompare(b.startTime));
                if (dayEntries.length === 0) return null;
                const colorClass = DAY_COLORS[day.value] || "bg-slate-50 border-slate-200 text-slate-800";
                const isToday = day.value === TODAY;
                return (
                  <div key={day.value}>
                    <div className={`mb-3 inline-flex items-center gap-2 rounded-lg border px-3 py-1 text-xs font-bold ${colorClass}`}>
                      {day.label}
                      {isToday && <span className="rounded-full bg-white px-1.5 py-0.5 text-xs font-semibold text-slate-700 shadow-sm">Today</span>}
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                      {dayEntries.map((t) => (
                        <TimetableCard key={t.id} t={t} showAttendance />
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

function TimetableCard({ t, showAttendance }) {
  const roomDisplay = t.room?.label || `${t.room?.building?.name ? t.room.building.name + " / " : ""}${t.room?.name || "—"}`;

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm hover:shadow-md transition">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <div className="text-sm font-bold text-slate-900">{t.subject?.code} — {t.subject?.name}</div>
          <div className="text-xs font-semibold text-slate-500 mt-0.5">{t.startTime} – {t.endTime}</div>
        </div>
      </div>

      <div className="grid gap-1.5 text-xs text-slate-600 mb-3">
        <div className="flex items-center gap-1.5">
          <span className="w-4 text-center">🏫</span>
          <span>{t.section?.department?.name} › <strong>{t.section?.name}</strong></span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-4 text-center">🚪</span>
          <span>{roomDisplay}</span>
        </div>
      </div>

      {showAttendance && (
        <Link
          href={`/faculty/attendance?sectionId=${encodeURIComponent(t.sectionId)}&subjectId=${encodeURIComponent(t.subjectId)}`}
          className="inline-flex items-center justify-center w-full rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 transition"
        >
          Take Attendance
        </Link>
      )}
    </div>
  );
}
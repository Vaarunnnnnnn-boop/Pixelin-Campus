"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "../../components/AppShell";
import { apiGet } from "../../lib/api";
import { Card } from "../../components/ui";

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

const TODAY = new Date().getDay();

export default function StudentTimetablePage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiGet("/student/timetable")
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const byDay = useMemo(() => {
    const map = new Map();
    for (const d of DAYS) map.set(d.value, []);
    for (const t of items) {
      if (!map.has(t.dayOfWeek)) map.set(t.dayOfWeek, []);
      map.get(t.dayOfWeek).push(t);
    }
    return map;
  }, [items]);

  const todayItems = (byDay.get(TODAY) || []).sort((a, b) => a.startTime.localeCompare(b.startTime));

  // next class: find earliest class today after now, else earliest tomorrow
  const nextClass = useMemo(() => {
    const now = new Date();
    const nowStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const upcoming = todayItems.filter((t) => t.startTime > nowStr);
    return upcoming[0] || null;
  }, [todayItems]);

  return (
    <AppShell title="My Timetable">
      <div className="grid grid-cols-1 gap-5">

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {/* Summary stats */}
        {!loading && items.length > 0 && (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard label="Total Classes/Week" value={items.length} color="text-blue-600" />
            <StatCard label="Today's Classes" value={todayItems.length} color="text-green-600" />
            <StatCard label="Subjects" value={[...new Set(items.map((t) => t.subjectId))].length} color="text-purple-600" />
            <StatCard label="Active Days" value={[...new Set(items.map((t) => t.dayOfWeek))].length} color="text-orange-600" />
          </div>
        )}

        {/* Next class */}
        {!loading && nextClass && (
          <div className="rounded-2xl border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-4">
            <div className="text-xs font-semibold text-green-700 mb-1">⏰ Next Class Today</div>
            <div className="text-base font-bold text-slate-900">{nextClass.subject?.code} — {nextClass.subject?.name}</div>
            <div className="text-sm text-slate-600 mt-1">
              {nextClass.startTime} – {nextClass.endTime} &nbsp;·&nbsp;
              {nextClass.room?.label || nextClass.room?.name} &nbsp;·&nbsp;
              {nextClass.faculty?.name}
            </div>
          </div>
        )}

        {/* Today */}
        <Card
          title={`Today — ${DAYS.find(d => d.value === TODAY)?.label || "Today"}`}
          description={loading ? "Loading…" : todayItems.length === 0 ? "No classes today" : `${todayItems.length} class(es)`}
        >
          {loading ? (
            <div className="py-6 text-center text-sm text-slate-400">Loading…</div>
          ) : todayItems.length === 0 ? (
            <div className="py-6 text-center text-sm text-slate-400">No classes scheduled for today.</div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {todayItems.map((t) => <SlotCard key={t.id} t={t} />)}
            </div>
          )}
        </Card>

        {/* Full week */}
        <Card
          title="Full Weekly Schedule"
          description={loading ? "Loading…" : `${items.length} slot(s) across the week`}
        >
          {loading ? (
            <div className="py-10 text-center text-sm text-slate-400">Loading timetable…</div>
          ) : items.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-400">
              No timetable found. Make sure you are enrolled in a section.
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
                      {dayEntries.map((t) => <SlotCard key={t.id} t={t} />)}
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

function StatCard({ label, value, color }) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm text-center">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-slate-500 mt-1">{label}</div>
    </div>
  );
}

function SlotCard({ t }) {
  const roomDisplay = t.room?.label || `${t.room?.building?.name ? t.room.building.name + " / " : ""}${t.room?.name || "—"}`;
  const now = new Date();
  const nowStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const isOngoing = t.startTime <= nowStr && nowStr <= t.endTime && t.dayOfWeek === new Date().getDay();

  return (
    <div className={`rounded-2xl border p-4 shadow-sm transition ${isOngoing ? "border-green-300 bg-green-50" : "bg-white hover:shadow-md"}`}>
      {isOngoing && (
        <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-green-500 px-2 py-0.5 text-xs font-bold text-white">
          ● Live Now
        </div>
      )}
      <div className="text-sm font-bold text-slate-900">{t.subject?.code} — {t.subject?.name}</div>
      <div className="text-xs font-semibold text-slate-500 mt-0.5">{t.startTime} – {t.endTime}</div>

      <div className="mt-3 grid gap-1.5 text-xs text-slate-600">
        <div className="flex items-center gap-1.5">
          <span className="w-4 text-center">👤</span>
          <span>{t.faculty?.name}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-4 text-center">🚪</span>
          <span>{roomDisplay}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-4 text-center">🏫</span>
          <span>{t.section?.name}</span>
        </div>
      </div>
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import AppShell from "../../components/AppShell";
import { useMe } from "../../lib/useMe";
import { apiGet } from "../../lib/api";
import { InfoBox, Badge, MasterDetail } from "../../components/ui";

function AttendanceBar({ percent }) {
  const color = percent >= 75 ? "bg-green-500" : percent >= 60 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs font-bold">
        <span className="text-slate-600">Attendance</span>
        <span className={percent >= 75 ? "text-green-700" : percent >= 60 ? "text-amber-700" : "text-red-700"}>
          {percent.toFixed(1)}%
        </span>
      </div>
      <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
    </div>
  );
}

export default function StudentAttendancePage() {
  const me = useMe();
  const [subjects, setSubjects] = useState([]); // each has attendanceRecords
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!me) return;
    (async () => {
      try {
        const data = await apiGet("/student/attendance");
        setSubjects(data || []);
      } finally {
        setLoading(false);
      }
    })();
  }, [me]);

  if (me === undefined) return <div className="p-8">Loading…</div>;
  if (!me) { if (typeof window !== "undefined") window.location.href = "/login"; return null; }
  if (me.role !== "STUDENT") return <div className="p-8">Forbidden</div>;

  const selectedSubject = subjects.find(s => s.id === selected);

  function calcPercent(records = []) {
    if (!records.length) return 0;
    return (records.filter(r => r.status === "PRESENT").length / records.length) * 100;
  }

  const listItems = subjects.map(s => {
    const pct = calcPercent(s.attendanceRecords);
    return {
      id: s.id,
      title: s.subject?.name || s.name || "Subject",
      subtitle: `${pct.toFixed(0)}% attendance`,
      badge: s.subject?.code
    };
  });

  const detailContent = selectedSubject ? (() => {
    const records = selectedSubject.attendanceRecords || [];
    const present = records.filter(r => r.status === "PRESENT").length;
    const absent = records.length - present;
    const pct = calcPercent(records);
    const needed75 = Math.max(0, Math.ceil(0.75 * records.length) - present);

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            {selectedSubject.subject?.name || selectedSubject.name}
          </h2>
          <p className="text-slate-500 text-sm">{selectedSubject.subject?.code || ""}</p>
        </div>

        <AttendanceBar percent={pct} />

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-center">
            <p className="text-2xl font-bold text-slate-900">{records.length}</p>
            <p className="text-xs text-slate-500 uppercase tracking-wide font-bold mt-0.5">Total</p>
          </div>
          <div className="rounded-xl bg-green-50 border border-green-200 p-3 text-center">
            <p className="text-2xl font-bold text-green-700">{present}</p>
            <p className="text-xs text-green-600 uppercase tracking-wide font-bold mt-0.5">Present</p>
          </div>
          <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-center">
            <p className="text-2xl font-bold text-red-700">{absent}</p>
            <p className="text-xs text-red-600 uppercase tracking-wide font-bold mt-0.5">Absent</p>
          </div>
        </div>

        {pct < 75 && (
          <InfoBox type="warning">
            You need <strong>{needed75}</strong> more present class{needed75 !== 1 ? "es" : ""} to reach 75% attendance.
          </InfoBox>
        )}
        {pct >= 75 && (
          <InfoBox type="success">
            Your attendance is on track. Keep it up!
          </InfoBox>
        )}

        {/* Record history */}
        {records.length > 0 && (
          <div>
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-3">Attendance Records</p>
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {[...records].reverse().map((r, i) => (
                <motion.div
                  key={r.id || i}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-200"
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${r.status === "PRESENT" ? "bg-green-500" : "bg-red-500"}`} />
                    <span className="text-sm text-slate-700">
                      {r.date ? new Date(r.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "Unknown date"}
                    </span>
                  </div>
                  <Badge variant={r.status === "PRESENT" ? "success" : "danger"}>{r.status}</Badge>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  })() : null;

  return (
    <AppShell title="Attendance">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Attendance</h1>
          <p className="text-slate-500 mt-1 text-sm">Track your attendance across all subjects</p>
        </div>
        <MasterDetail
          items={listItems}
          selected={selected}
          onSelect={setSelected}
          loading={loading}
          detail={detailContent}
          emptyDetail={
            <div className="text-center space-y-2">
              <div className="text-4xl">📊</div>
              <p className="text-sm font-medium">Select a subject to view attendance</p>
              <p className="text-xs text-slate-400">Your records are shown on the right</p>
            </div>
          }
        />
      </motion.div>
    </AppShell>
  );
}
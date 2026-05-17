"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, Save, AlertCircle } from "lucide-react";
import AppShell from "../../components/AppShell";
import { useMe } from "../../lib/useMe";
import { apiGet, apiPost } from "../../lib/api";
import { Button, InfoBox, Badge, MasterDetail } from "../../components/ui";

function today() {
  return new Date().toISOString().split("T")[0];
}

export default function FacultyAttendancePage() {
  const me = useMe();
  const [assignments, setAssignments] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(today());
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({}); // studentId -> "PRESENT" | "ABSENT"
  const [existing, setExisting] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState(null);
  const [tab, setTab] = useState("mark"); // "mark" | "history"

  useEffect(() => {
    if (!me) return;
    (async () => {
      try {
        const a = await apiGet("/faculty/assignments");
        setAssignments(a || []);
      } finally {
        setLoading(false);
      }
    })();
  }, [me]);

  const selectedAssignment = assignments.find(a => a.id === selected);

  // Load students + existing attendance when selection or date changes
  useEffect(() => {
    if (!selected || !date) return;
    (async () => {
      try {
        const [sts, att] = await Promise.all([
          apiGet(`/faculty/sections/${selectedAssignment?.sectionId}/students`),
          apiGet(`/faculty/attendance?assignmentId=${selected}&date=${date}`)
        ]);
        const studs = sts || [];
        setStudents(studs);
        setExisting(att || []);
        // Pre-fill from existing
        const init = {};
        studs.forEach(s => { init[s.id] = "PRESENT"; });
        (att || []).forEach(r => { init[r.studentId] = r.status; });
        setAttendance(init);
      } catch {
        setStudents([]);
        setExisting([]);
      }
    })();
  }, [selected, date, selectedAssignment?.sectionId]);

  function flash(text, type = "success") {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 3000);
  }

  function toggle(studentId) {
    setAttendance(prev => ({
      ...prev,
      [studentId]: prev[studentId] === "PRESENT" ? "ABSENT" : "PRESENT"
    }));
  }

  function markAll(status) {
    const next = {};
    students.forEach(s => { next[s.id] = status; });
    setAttendance(next);
  }

  async function submit() {
    if (students.length === 0) { flash("No students to mark", "warning"); return; }
    setSubmitting(true);
    try {
      await apiPost("/faculty/attendance", {
        assignmentId: selected,
        date,
        records: students.map(s => ({ studentId: s.id, status: attendance[s.id] || "ABSENT" }))
      });
      flash("Attendance saved successfully!");
    } catch (e) {
      flash("Error: " + e.message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  const presentCount = students.filter(s => attendance[s.id] === "PRESENT").length;
  const absentCount = students.length - presentCount;

  const listItems = assignments.map(a => ({
    id: a.id,
    title: a.subject?.name || "Subject",
    subtitle: a.section?.name || "Section",
    badge: a.section?.name
  }));

  const detailContent = selectedAssignment ? (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900">{selectedAssignment.subject?.name}</h2>
        <p className="text-slate-500 text-sm">{selectedAssignment.section?.name}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {["mark", "history"].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-semibold capitalize border-b-2 transition ${
              tab === t ? "border-slate-900 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            {t === "mark" ? "Mark Attendance" : "History"}
          </button>
        ))}
      </div>

      {tab === "mark" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {/* Date picker */}
          <div className="flex items-center gap-3">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Date</label>
            <input
              type="date"
              value={date}
              max={today()}
              onChange={e => setDate(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>

          {/* Stats bar */}
          {students.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-center">
                <p className="text-2xl font-bold text-slate-900">{students.length}</p>
                <p className="text-xs text-slate-500 uppercase tracking-wide font-bold mt-0.5">Total</p>
              </div>
              <div className="rounded-xl bg-green-50 border border-green-200 p-3 text-center">
                <p className="text-2xl font-bold text-green-700">{presentCount}</p>
                <p className="text-xs text-green-600 uppercase tracking-wide font-bold mt-0.5">Present</p>
              </div>
              <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-center">
                <p className="text-2xl font-bold text-red-700">{absentCount}</p>
                <p className="text-xs text-red-600 uppercase tracking-wide font-bold mt-0.5">Absent</p>
              </div>
            </div>
          )}

          {/* Quick mark buttons */}
          {students.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={() => markAll("PRESENT")}
                className="flex-1 py-1.5 rounded-xl bg-green-100 text-green-700 text-xs font-bold hover:bg-green-200 transition"
              >
                ✓ All Present
              </button>
              <button
                onClick={() => markAll("ABSENT")}
                className="flex-1 py-1.5 rounded-xl bg-red-100 text-red-700 text-xs font-bold hover:bg-red-200 transition"
              >
                ✕ All Absent
              </button>
            </div>
          )}

          {msg && <InfoBox type={msg.type}>{msg.text}</InfoBox>}

          {/* Student list */}
          {students.length === 0 ? (
            <InfoBox type="warning">No students found in this section.</InfoBox>
          ) : (
            <div className="space-y-2">
              {students.map((student, idx) => {
                const status = attendance[student.id] || "ABSENT";
                const isPresent = status === "PRESENT";
                return (
                  <motion.button
                    key={student.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    onClick={() => toggle(student.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition ${
                      isPresent
                        ? "bg-green-50 border-green-200 hover:bg-green-100"
                        : "bg-red-50 border-red-200 hover:bg-red-100"
                    }`}
                  >
                    {isPresent
                      ? <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
                      : <XCircle size={20} className="text-red-500 flex-shrink-0" />
                    }
                    <div className="flex-1 text-left">
                      <p className="text-sm font-semibold text-slate-900">{student.name}</p>
                      <p className="text-xs text-slate-500">{student.rollNo || student.email || ""}</p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      isPresent ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"
                    }`}>
                      {status}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          )}

          {students.length > 0 && (
            <Button onClick={submit} isLoading={submitting} variant="primary" className="w-full">
              <Save size={15} /> Save Attendance
            </Button>
          )}
        </motion.div>
      )}

      {tab === "history" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          <InfoBox type="info">Showing records for {date}</InfoBox>
          {existing.length === 0 ? (
            <p className="text-slate-500 text-sm">No records for this date.</p>
          ) : (
            <div className="space-y-2">
              {existing.map((r, i) => (
                <motion.div
                  key={r.id || i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-200"
                >
                  <span className={`w-2 h-2 rounded-full ${r.status === "PRESENT" ? "bg-green-500" : "bg-red-500"}`} />
                  <span className="text-sm font-medium text-slate-900 flex-1">
                    {students.find(s => s.id === r.studentId)?.name || `Student ${r.studentId}`}
                  </span>
                  <Badge variant={r.status === "PRESENT" ? "success" : "danger"}>{r.status}</Badge>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  ) : null;

  return (
    <AppShell title="Attendance">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Attendance</h1>
          <p className="text-slate-500 mt-1 text-sm">Mark attendance for your classes — select a subject from the left</p>
        </div>
        <MasterDetail
          items={listItems}
          selected={selected}
          onSelect={setSelected}
          loading={loading}
          detail={detailContent}
          emptyDetail={
            <div className="text-center space-y-2">
              <div className="text-4xl">✅</div>
              <p className="text-sm font-medium">Select a class to mark attendance</p>
              <p className="text-xs text-slate-400">Choose from your assigned subjects on the left</p>
            </div>
          }
        />
      </motion.div>
    </AppShell>
  );
}
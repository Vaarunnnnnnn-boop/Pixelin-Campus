"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Save, Trash2, X } from "lucide-react";
import AppShell from "../../components/AppShell";
import { apiGet, apiPost, apiDel } from "../../lib/api";
import { Button, InfoBox, Badge, MasterDetail } from "../../components/ui";

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ facultyId: "", subjectId: "", sectionId: "" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [a, u, sub, sec] = await Promise.all([
          apiGet("/admin/assignments"),
          apiGet("/admin/users"),
          apiGet("/admin/subjects"),
          apiGet("/admin/sections")
        ]);
        setAssignments(a || []);
        setFaculty((u || []).filter(u => u.role === "FACULTY"));
        setSubjects(sub || []);
        setSections(sec || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const selectedAssignment = assignments.find(a => a.id === selected);

  function flash(text, type = "success") {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 2500);
  }

  function openNew() {
    setForm({ facultyId: "", subjectId: "", sectionId: "" });
    setShowForm(true);
    setSelected(null);
  }

  async function save() {
    if (!form.facultyId || !form.subjectId || !form.sectionId) {
      flash("All fields required", "error"); return;
    }
    setBusy(true);
    try {
      const res = await apiPost("/admin/assignments", form);
      setAssignments([...assignments, res]);
      flash("Assignment created");
      setShowForm(false);
      setSelected(res.id);
    } catch (e) {
      flash("Error: " + e.message, "error");
    } finally {
      setBusy(false);
    }
  }

  async function del() {
    if (!confirm("Remove this assignment?")) return;
    try {
      await apiDel(`/admin/assignments/${selected}`);
      setAssignments(assignments.filter(a => a.id !== selected));
      setSelected(null);
      flash("Assignment removed");
    } catch (e) {
      flash("Error: " + e.message, "error");
    }
  }

  const facMap = new Map(faculty.map(f => [String(f.id), f.name]));
  const subMap = new Map(subjects.map(s => [String(s.id), s.name]));
  const secMap = new Map(sections.map(s => [String(s.id), s.name]));

  const listItems = assignments.map(a => ({
    id: a.id,
    title: facMap.get(String(a.facultyId)) || a.faculty?.name || "Unknown Faculty",
    subtitle: subMap.get(String(a.subjectId)) || a.subject?.name || "Unknown Subject",
    badge: secMap.get(String(a.sectionId)) || a.section?.name
  }));

  const detailContent = showForm ? (
    <div className="space-y-5 max-w-md">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">New Assignment</h2>
        <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-700 transition"><X size={20} /></button>
      </div>
      {msg && <InfoBox type={msg.type}>{msg.text}</InfoBox>}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Faculty</label>
          <select
            value={form.facultyId}
            onChange={e => setForm({ ...form, facultyId: e.target.value })}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-slate-200 outline-none"
          >
            <option value="">Select faculty</option>
            {faculty.map(f => <option key={f.id} value={String(f.id)}>{f.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Subject</label>
          <select
            value={form.subjectId}
            onChange={e => setForm({ ...form, subjectId: e.target.value })}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-slate-200 outline-none"
          >
            <option value="">Select subject</option>
            {subjects.map(s => <option key={s.id} value={String(s.id)}>{s.name} {s.code ? `(${s.code})` : ""}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Section</label>
          <select
            value={form.sectionId}
            onChange={e => setForm({ ...form, sectionId: e.target.value })}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-slate-200 outline-none"
          >
            <option value="">Select section</option>
            {sections.map(s => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
          </select>
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <Button onClick={save} isLoading={busy} variant="primary"><Save size={15} /> Create Assignment</Button>
        <Button onClick={() => setShowForm(false)} variant="outline">Cancel</Button>
      </div>
    </div>
  ) : selectedAssignment ? (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            {facMap.get(String(selectedAssignment.facultyId)) || selectedAssignment.faculty?.name || "Unknown"}
          </h2>
          <p className="text-slate-500 text-sm mt-1">Faculty Assignment</p>
        </div>
        <Button onClick={del} variant="danger"><Trash2 size={14} /> Remove</Button>
      </div>
      {msg && <InfoBox type={msg.type}>{msg.text}</InfoBox>}
      <div className="space-y-3">
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-xl">📖</div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-0.5">Subject</p>
            <p className="text-base font-bold text-slate-900">
              {subMap.get(String(selectedAssignment.subjectId)) || selectedAssignment.subject?.name || "—"}
            </p>
          </div>
        </div>
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-xl">📋</div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-0.5">Section</p>
            <p className="text-base font-bold text-slate-900">
              {secMap.get(String(selectedAssignment.sectionId)) || selectedAssignment.section?.name || "—"}
            </p>
          </div>
        </div>
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-xl">👤</div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-0.5">Faculty</p>
            <p className="text-base font-bold text-slate-900">
              {facMap.get(String(selectedAssignment.facultyId)) || selectedAssignment.faculty?.name || "—"}
            </p>
            {selectedAssignment.faculty?.email && (
              <p className="text-xs text-slate-500">{selectedAssignment.faculty.email}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <AppShell title="Faculty Assignments">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Faculty Assignments</h1>
          <p className="text-slate-500 mt-1 text-sm">Assign faculty to subjects and sections</p>
        </div>
        <MasterDetail
          items={listItems}
          selected={showForm ? null : selected}
          onSelect={id => { setSelected(id); setShowForm(false); }}
          onAdd={openNew}
          addLabel="New Assignment"
          loading={loading}
          detail={detailContent}
          emptyDetail={
            <div className="text-center space-y-2">
              <div className="text-4xl">📌</div>
              <p className="text-sm font-medium">Select an assignment to view details</p>
              <p className="text-xs text-slate-400">or create a new one</p>
            </div>
          }
        />
      </motion.div>
    </AppShell>
  );
}
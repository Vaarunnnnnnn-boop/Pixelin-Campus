"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Save, Trash2, Edit2, X } from "lucide-react";
import AppShell from "../../components/AppShell";
import { apiGet, apiPost, apiPut, apiDel } from "../../lib/api";
import { Button, Input, InfoBox, Badge, MasterDetail } from "../../components/ui";

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", departmentId: "", credits: "" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [s, d] = await Promise.all([
          apiGet("/admin/subjects"),
          apiGet("/admin/departments")
        ]);
        setSubjects(s || []);
        setDepartments(d || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const deptMap = new Map(departments.map(d => [String(d.id), d.name]));
  const selectedSubject = subjects.find(s => s.id === selected);

  function flash(text, type = "success") {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 2500);
  }

  function openNew() {
    setForm({ name: "", code: "", departmentId: "", credits: "" });
    setEditing(false);
    setShowForm(true);
    setSelected(null);
  }

  function openEdit(sub) {
    setForm({
      name: sub.name,
      code: sub.code || "",
      departmentId: String(sub.departmentId || ""),
      credits: String(sub.credits || "")
    });
    setEditing(true);
    setShowForm(true);
  }

  async function save() {
    if (!form.name.trim()) { flash("Subject name required", "error"); return; }
    setBusy(true);
    try {
      if (editing && selected) {
        await apiPut(`/admin/subjects/${selected}`, form);
        setSubjects(subjects.map(s => s.id === selected ? { ...s, ...form } : s));
        flash("Subject updated");
        setShowForm(false);
      } else {
        const res = await apiPost("/admin/subjects", form);
        setSubjects([...subjects, res]);
        flash("Subject created");
        setShowForm(false);
        setSelected(res.id);
      }
    } catch (e) {
      flash("Error: " + e.message, "error");
    } finally {
      setBusy(false);
    }
  }

  async function del() {
    if (!confirm("Delete this subject?")) return;
    try {
      await apiDel(`/admin/subjects/${selected}`);
      setSubjects(subjects.filter(s => s.id !== selected));
      setSelected(null);
      flash("Subject deleted");
    } catch (e) {
      flash("Error: " + e.message, "error");
    }
  }

  const listItems = subjects.map(s => ({
    id: s.id,
    title: s.name,
    subtitle: s.code || deptMap.get(String(s.departmentId)) || "No code",
    badge: s.credits ? `${s.credits} cr` : undefined
  }));

  const detailContent = showForm ? (
    <div className="space-y-5 max-w-md">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">{editing ? "Edit Subject" : "New Subject"}</h2>
        <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-700 transition">
          <X size={20} />
        </button>
      </div>
      {msg && <InfoBox type={msg.type}>{msg.text}</InfoBox>}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Subject Name</label>
          <Input placeholder="e.g. Data Structures" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Subject Code</label>
          <Input placeholder="e.g. CS301" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Department</label>
          <select
            value={form.departmentId}
            onChange={e => setForm({ ...form, departmentId: e.target.value })}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-slate-200 outline-none"
          >
            <option value="">Select department</option>
            {departments.map(d => <option key={d.id} value={String(d.id)}>{d.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Credits</label>
          <Input type="number" placeholder="e.g. 4" value={form.credits} onChange={e => setForm({ ...form, credits: e.target.value })} />
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <Button onClick={save} isLoading={busy} variant="primary"><Save size={15} /> {editing ? "Update" : "Create"}</Button>
        <Button onClick={() => setShowForm(false)} variant="outline">Cancel</Button>
      </div>
    </div>
  ) : selectedSubject ? (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{selectedSubject.name}</h2>
          <p className="text-slate-500 mt-1 text-sm">{selectedSubject.code || "No code assigned"}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => openEdit(selectedSubject)} variant="secondary"><Edit2 size={14} /> Edit</Button>
          <Button onClick={del} variant="danger"><Trash2 size={14} /> Delete</Button>
        </div>
      </div>
      {msg && <InfoBox type={msg.type}>{msg.text}</InfoBox>}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Code</p>
          <p className="text-lg font-bold text-slate-900">{selectedSubject.code || "—"}</p>
        </div>
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Credits</p>
          <p className="text-lg font-bold text-slate-900">{selectedSubject.credits || "—"}</p>
        </div>
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Department</p>
          <p className="text-sm font-bold text-slate-900">{deptMap.get(String(selectedSubject.departmentId)) || "—"}</p>
        </div>
      </div>
      {selectedSubject.assignments && selectedSubject.assignments.length > 0 && (
        <div>
          <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-3">Faculty Assignments</p>
          <div className="space-y-2">
            {selectedSubject.assignments.map((a, i) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200"
              >
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                  {a.faculty?.name?.[0] || "?"}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900">{a.faculty?.name || "Unknown"}</p>
                  <p className="text-xs text-slate-500">{a.section?.name || ""}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  ) : null;

  return (
    <AppShell title="Subjects">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Subjects</h1>
          <p className="text-slate-500 mt-1 text-sm">Manage curriculum subjects and their details</p>
        </div>
        <MasterDetail
          items={listItems}
          selected={showForm && !editing ? null : selected}
          onSelect={id => { setSelected(id); setShowForm(false); setEditing(false); }}
          onAdd={openNew}
          addLabel="New Subject"
          loading={loading}
          detail={detailContent}
          emptyDetail={
            <div className="text-center space-y-2">
              <div className="text-4xl">📖</div>
              <p className="text-sm font-medium">Select a subject to view details</p>
              <p className="text-xs text-slate-400">or create a new one</p>
            </div>
          }
        />
      </motion.div>
    </AppShell>
  );
}
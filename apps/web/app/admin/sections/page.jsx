"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Edit2, Save, X } from "lucide-react";
import AppShell from "../../components/AppShell";
import { apiGet, apiPost, apiPut, apiDel } from "../../lib/api";
import { Button, Input, InfoBox, Badge, MasterDetail } from "../../components/ui";

export default function SectionsPage() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", year: "", departmentId: "" });
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [s, d] = await Promise.all([
          apiGet("/admin/sections"),
          apiGet("/admin/departments")
        ]);
        setSections(s || []);
        setDepartments(d || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const selectedSection = sections.find(s => s.id === selected);

  function flash(text, type = "success") {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 2500);
  }

  function openNew() {
    setForm({ name: "", year: "", departmentId: "" });
    setEditing(false);
    setShowForm(true);
    setSelected(null);
  }

  function openEdit(sec) {
    setForm({ name: sec.name, year: sec.year || "", departmentId: String(sec.departmentId || "") });
    setEditing(true);
    setShowForm(true);
  }

  async function save() {
    if (!form.name.trim()) { flash("Section name required", "error"); return; }
    setBusy(true);
    try {
      if (editing && selected) {
        await apiPut(`/admin/sections/${selected}`, form);
        setSections(sections.map(s => s.id === selected ? { ...s, ...form } : s));
        flash("Section updated");
        setShowForm(false);
      } else {
        const res = await apiPost("/admin/sections", form);
        setSections([...sections, res]);
        flash("Section created");
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
    if (!confirm("Delete this section?")) return;
    try {
      await apiDel(`/admin/sections/${selected}`);
      setSections(sections.filter(s => s.id !== selected));
      setSelected(null);
      flash("Section deleted");
    } catch (e) {
      flash("Error: " + e.message, "error");
    }
  }

  const deptMap = new Map(departments.map(d => [String(d.id), d.name]));

  const listItems = sections.map(s => ({
    id: s.id,
    title: s.name,
    subtitle: deptMap.get(String(s.departmentId)) || "No department",
    badge: s.year ? `Y${s.year}` : undefined
  }));

  const detailContent = showForm ? (
    <div className="space-y-5 max-w-md">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">{editing ? "Edit Section" : "New Section"}</h2>
        <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-700 transition">
          <X size={20} />
        </button>
      </div>
      {msg && <InfoBox type={msg.type}>{msg.text}</InfoBox>}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Section Name</label>
          <Input
            placeholder="e.g. CE-A, IT-B"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Year</label>
          <Input
            placeholder="e.g. 1, 2, 3, 4"
            value={form.year}
            onChange={e => setForm({ ...form, year: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Department</label>
          <select
            value={form.departmentId}
            onChange={e => setForm({ ...form, departmentId: e.target.value })}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-slate-200 outline-none"
          >
            <option value="">Select department</option>
            {departments.map(d => (
              <option key={d.id} value={String(d.id)}>{d.name}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <Button onClick={save} isLoading={busy} variant="primary">
          <Save size={15} /> {editing ? "Update" : "Create"}
        </Button>
        <Button onClick={() => setShowForm(false)} variant="outline">Cancel</Button>
      </div>
    </div>
  ) : selectedSection ? (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{selectedSection.name}</h2>
          <p className="text-slate-500 mt-1 text-sm">
            {deptMap.get(String(selectedSection.departmentId)) || "No department assigned"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => openEdit(selectedSection)} variant="secondary">
            <Edit2 size={14} /> Edit
          </Button>
          <Button onClick={del} variant="danger">
            <Trash2 size={14} /> Delete
          </Button>
        </div>
      </div>

      {msg && <InfoBox type={msg.type}>{msg.text}</InfoBox>}

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Year</p>
          <p className="text-lg font-bold text-slate-900">{selectedSection.year || "—"}</p>
        </div>
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Department</p>
          <p className="text-lg font-bold text-slate-900">{deptMap.get(String(selectedSection.departmentId)) || "—"}</p>
        </div>
      </div>

      {selectedSection.students && selectedSection.students.length > 0 && (
        <div>
          <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-3">
            Students ({selectedSection.students.length})
          </p>
          <div className="space-y-2">
            {selectedSection.students.map((st, i) => (
              <motion.div
                key={st.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200"
              >
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
                  {st.name?.[0] || "?"}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{st.name}</p>
                  <p className="text-xs text-slate-500">{st.email || "No email"}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  ) : null;

  return (
    <AppShell title="Sections">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sections</h1>
          <p className="text-slate-500 mt-1 text-sm">Manage academic sections and their students</p>
        </div>
        <MasterDetail
          items={listItems}
          selected={showForm && !editing ? null : selected}
          onSelect={id => { setSelected(id); setShowForm(false); setEditing(false); }}
          onAdd={openNew}
          addLabel="New Section"
          loading={loading}
          detail={detailContent}
          emptyDetail={
            <div className="text-center space-y-2">
              <div className="text-4xl">📋</div>
              <p className="text-sm font-medium">Select a section to view details</p>
              <p className="text-xs text-slate-400">or create a new one with the button above</p>
            </div>
          }
        />
      </motion.div>
    </AppShell>
  );
}
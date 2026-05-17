"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Save, Trash2, Edit2, X } from "lucide-react";
import AppShell from "../../components/AppShell";
import { apiGet, apiPost, apiPut, apiDel } from "../../lib/api";
import { Button, Input, InfoBox, Badge, MasterDetail } from "../../components/ui";

const ROLES = ["ADMIN", "FACULTY", "STUDENT"];

const roleColors = {
  ADMIN: "danger",
  FACULTY: "info",
  STUDENT: "success"
};

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", role: "STUDENT", password: "" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const u = await apiGet("/admin/users");
        setUsers(u || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const selectedUser = users.find(u => u.id === selected);

  function flash(text, type = "success") {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 2500);
  }

  function openNew() {
    setForm({ name: "", email: "", role: "STUDENT", password: "" });
    setEditing(false);
    setShowForm(true);
    setSelected(null);
  }

  function openEdit(user) {
    setForm({ name: user.name, email: user.email, role: user.role, password: "" });
    setEditing(true);
    setShowForm(true);
  }

  async function save() {
    if (!form.name.trim() || !form.email.trim()) { flash("Name and email required", "error"); return; }
    if (!editing && !form.password.trim()) { flash("Password required for new users", "error"); return; }
    setBusy(true);
    try {
      if (editing && selected) {
        const payload = { name: form.name, email: form.email, role: form.role };
        if (form.password) payload.password = form.password;
        await apiPut(`/admin/users/${selected}`, payload);
        setUsers(users.map(u => u.id === selected ? { ...u, ...payload } : u));
        flash("User updated");
        setShowForm(false);
      } else {
        const res = await apiPost("/admin/users", form);
        setUsers([...users, res]);
        flash("User created");
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
    if (!confirm("Delete this user?")) return;
    try {
      await apiDel(`/admin/users/${selected}`);
      setUsers(users.filter(u => u.id !== selected));
      setSelected(null);
      flash("User deleted");
    } catch (e) {
      flash("Error: " + e.message, "error");
    }
  }

  const filtered = users.filter(u =>
    !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const listItems = filtered.map(u => ({
    id: u.id,
    title: u.name || u.email,
    subtitle: u.email,
    badge: u.role
  }));

  const detailContent = showForm ? (
    <div className="space-y-5 max-w-md">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">{editing ? "Edit User" : "New User"}</h2>
        <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-700 transition"><X size={20} /></button>
      </div>
      {msg && <InfoBox type={msg.type}>{msg.text}</InfoBox>}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Full Name</label>
          <Input placeholder="John Doe" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Email</label>
          <Input type="email" placeholder="john@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Role</label>
          <select
            value={form.role}
            onChange={e => setForm({ ...form, role: e.target.value })}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-slate-200 outline-none"
          >
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">
            Password {editing && <span className="font-normal text-slate-400">(leave blank to keep)</span>}
          </label>
          <Input type="password" placeholder="••••••••" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <Button onClick={save} isLoading={busy} variant="primary"><Save size={15} /> {editing ? "Update" : "Create"}</Button>
        <Button onClick={() => setShowForm(false)} variant="outline">Cancel</Button>
      </div>
    </div>
  ) : selectedUser ? (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-xl font-bold">
            {selectedUser.name?.[0] || "?"}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{selectedUser.name}</h2>
            <p className="text-slate-500 text-sm mt-0.5">{selectedUser.email}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => openEdit(selectedUser)} variant="secondary"><Edit2 size={14} /> Edit</Button>
          <Button onClick={del} variant="danger"><Trash2 size={14} /> Delete</Button>
        </div>
      </div>
      {msg && <InfoBox type={msg.type}>{msg.text}</InfoBox>}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Role</p>
          <Badge variant={roleColors[selectedUser.role] || "default"}>{selectedUser.role}</Badge>
        </div>
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Member Since</p>
          <p className="text-sm font-bold text-slate-900">
            {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : "—"}
          </p>
        </div>
      </div>
      {selectedUser.section && (
        <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-1">Section</p>
          <p className="text-sm font-bold text-blue-900">{selectedUser.section.name}</p>
        </div>
      )}
    </div>
  ) : null;

  return (
    <AppShell title="Users">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Users</h1>
            <p className="text-slate-500 mt-1 text-sm">Manage all users — admins, faculty, students</p>
          </div>
          <div className="w-64">
            <Input placeholder="Search by name or email…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <MasterDetail
          items={listItems}
          selected={showForm && !editing ? null : selected}
          onSelect={id => { setSelected(id); setShowForm(false); setEditing(false); }}
          onAdd={openNew}
          addLabel="New User"
          loading={loading}
          detail={detailContent}
          emptyDetail={
            <div className="text-center space-y-2">
              <div className="text-4xl">👥</div>
              <p className="text-sm font-medium">Select a user to view details</p>
              <p className="text-xs text-slate-400">or create a new user</p>
            </div>
          }
        />
      </motion.div>
    </AppShell>
  );
}
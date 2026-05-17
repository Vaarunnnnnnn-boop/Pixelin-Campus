"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Building2, Plus, Edit2, Trash2, Layers, DoorOpen } from "lucide-react";
import AppShell from "../../components/AppShell";
import { apiGet, apiPost, apiPut, apiDel } from "../../lib/api";
import { Button, Card, Input, Table, InfoBox, Badge } from "../../components/ui";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } }
};

export default function InfrastructurePage() {
  const [loading, setLoading] = useState(true);
  const [buildings, setBuildings] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [tab, setTab] = useState(0);

  // Form states
  const [buildingForm, setBuildingForm] = useState({ name: "", address: "" });
  const [deptForm, setDeptForm] = useState({ buildingId: "", name: "", hodName: "" });
  const [roomForm, setRoomForm] = useState({ buildingId: "", name: "", label: "" });

  const [editingBuilding, setEditingBuilding] = useState(null);
  const [editingDept, setEditingDept] = useState(null);
  const [editingRoom, setEditingRoom] = useState(null);

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  // Load data
  useEffect(() => {
    async function load() {
      try {
        const [b, d, r] = await Promise.all([
          apiGet("/admin/buildings"),
          apiGet("/admin/departments"),
          apiGet("/admin/rooms")
        ]);
        setBuildings(b || []);
        setDepartments(d || []);
        setRooms(r || []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Building operations
  async function saveBuilding() {
    if (!buildingForm.name.trim()) {
      setMsg("Building name required");
      return;
    }
    setBusy(true);
    try {
      if (editingBuilding) {
        await apiPut(`/admin/buildings/${editingBuilding.id}`, buildingForm);
        setBuildings(buildings.map(b => b.id === editingBuilding.id ? { ...b, ...buildingForm } : b));
        setEditingBuilding(null);
        setMsg("✓ Building updated");
      } else {
        const res = await apiPost("/admin/buildings", buildingForm);
        setBuildings([...buildings, res]);
        setMsg("✓ Building created");
      }
      setBuildingForm({ name: "", address: "" });
      setTimeout(() => setMsg(""), 2000);
    } catch (e) {
      setMsg("✗ Error: " + e.message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteBuilding(id) {
    if (!confirm("Delete this building?")) return;
    try {
      await apiDel(`/admin/buildings/${id}`);
      setBuildings(buildings.filter(b => b.id !== id));
    } catch (e) {
      alert("Error: " + e.message);
    }
  }

  // Department operations
  async function saveDepartment() {
    if (!deptForm.name.trim() || !deptForm.buildingId) {
      setMsg("Building & department name required");
      return;
    }
    setBusy(true);
    try {
      if (editingDept) {
        await apiPut(`/admin/departments/${editingDept.id}`, deptForm);
        setDepartments(departments.map(d => d.id === editingDept.id ? { ...d, ...deptForm } : d));
        setEditingDept(null);
        setMsg("✓ Department updated");
      } else {
        const res = await apiPost("/admin/departments", deptForm);
        setDepartments([...departments, res]);
        setMsg("✓ Department created");
      }
      setDeptForm({ buildingId: "", name: "", hodName: "" });
      setTimeout(() => setMsg(""), 2000);
    } catch (e) {
      setMsg("✗ Error: " + e.message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteDepartment(id) {
    if (!confirm("Delete this department?")) return;
    try {
      await apiDel(`/admin/departments/${id}`);
      setDepartments(departments.filter(d => d.id !== id));
    } catch (e) {
      alert("Error: " + e.message);
    }
  }

  // Room operations
  async function saveRoom() {
    if (!roomForm.name.trim() || !roomForm.buildingId) {
      setMsg("Building & room name required");
      return;
    }
    setBusy(true);
    try {
      if (editingRoom) {
        await apiPut(`/admin/rooms/${editingRoom.id}`, roomForm);
        setRooms(rooms.map(r => r.id === editingRoom.id ? { ...r, ...roomForm } : r));
        setEditingRoom(null);
        setMsg("✓ Room updated");
      } else {
        const res = await apiPost("/admin/rooms", roomForm);
        setRooms([...rooms, res]);
        setMsg("✓ Room created");
      }
      setRoomForm({ buildingId: "", name: "", label: "" });
      setTimeout(() => setMsg(""), 2000);
    } catch (e) {
      setMsg("✗ Error: " + e.message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteRoom(id) {
    if (!confirm("Delete this room?")) return;
    try {
      await apiDel(`/admin/rooms/${id}`);
      setRooms(rooms.filter(r => r.id !== id));
    } catch (e) {
      alert("Error: " + e.message);
    }
  }

  const buildingMap = useMemo(() => {
    const m = new Map();
    buildings.forEach(b => m.set(String(b.id), b.name));
    return m;
  }, [buildings]);

  return (
    <AppShell title="Infrastructure">
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-slate-900">Infrastructure Management</h1>
          <p className="text-slate-600 mt-2">Create and manage buildings, departments & classrooms</p>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-200">
          {["Buildings", "Departments", "Classrooms"].map((t, i) => (
            <motion.button
              key={t}
              onClick={() => setTab(i)}
              className={`px-4 py-2 font-medium border-b-2 transition ${
                tab === i ? "border-slate-900 text-slate-900" : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              {t}
            </motion.button>
          ))}
        </div>

        {/* Tab 1: Buildings */}
        {tab === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <Card
              title="Add Building"
              right={<Button onClick={saveBuilding} disabled={busy || !buildingForm.name.trim()} variant="primary"><Plus size={16} /> Save</Button>}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  placeholder="Building name (e.g., Block A)"
                  value={buildingForm.name}
                  onChange={(e) => setBuildingForm({ ...buildingForm, name: e.target.value })}
                />
                <Input
                  placeholder="Address (optional)"
                  value={buildingForm.address}
                  onChange={(e) => setBuildingForm({ ...buildingForm, address: e.target.value })}
                />
              </div>
              {msg && (
                <InfoBox type={msg.startsWith("✗") ? "error" : "success"} className="mt-3">
                  {msg}
                </InfoBox>
              )}
            </Card>
            <Card title="All Buildings" description={`${buildings.length} building(s)`}>
              <Table
                columns={[
                  { key: "name", header: "Name", render: (r) => <span className="flex items-center gap-2"><Building2 size={16} />{r.name}</span> },
                  { key: "address", header: "Address", render: (r) => r.address || "—" },
                  {
                    key: "actions",
                    header: "",
                    render: (r) => (
                      <div className="flex gap-1">
                        <motion.button whileHover={{ scale: 1.1 }} onClick={() => { setBuildingForm(r); setEditingBuilding(r); }} className="p-1 hover:bg-blue-100 rounded">✏️</motion.button>
                        <motion.button whileHover={{ scale: 1.1 }} onClick={() => deleteBuilding(r.id)} className="p-1 hover:bg-red-100 rounded">🗑️</motion.button>
                      </div>
                    )
                  }
                ]}
                rows={buildings}
                emptyText="No buildings yet"
              />
            </Card>
          </motion.div>
        )}

        {/* Tab 2: Departments */}
        {tab === 1 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <Card
              title="Add Department"
              right={<Button onClick={saveDepartment} disabled={busy || !deptForm.name.trim() || !deptForm.buildingId} variant="primary"><Plus size={16} /> Save</Button>}
            >
              {buildings.length === 0 ? (
                <InfoBox type="warning">Create a building first</InfoBox>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <select
                    value={deptForm.buildingId}
                    onChange={(e) => setDeptForm({ ...deptForm, buildingId: e.target.value })}
                    className="rounded-xl border px-3 py-2 text-sm focus:ring-2 focus:ring-slate-200"
                  >
                    <option value="">Select building</option>
                    {buildings.map(b => <option key={b.id} value={String(b.id)}>{b.name}</option>)}
                  </select>
                  <Input
                    placeholder="Department name"
                    value={deptForm.name}
                    onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                  />
                  <Input
                    placeholder="HOD name (optional)"
                    value={deptForm.hodName}
                    onChange={(e) => setDeptForm({ ...deptForm, hodName: e.target.value })}
                  />
                </div>
              )}
              {msg && <InfoBox type={msg.startsWith("✗") ? "error" : "success"} className="mt-3">{msg}</InfoBox>}
            </Card>
            <Card title="All Departments" description={`${departments.length} department(s)`}>
              <Table
                columns={[
                  { key: "name", header: "Name", render: (r) => <span className="flex items-center gap-2"><Layers size={16} />{r.name}</span> },
                  { key: "building", header: "Building", render: (r) => buildingMap.get(String(r.buildingId)) || "—" },
                  { key: "hodName", header: "HOD", render: (r) => r.hodName || "—" },
                  {
                    key: "actions",
                    header: "",
                    render: (r) => (
                      <div className="flex gap-1">
                        <motion.button whileHover={{ scale: 1.1 }} onClick={() => { setDeptForm(r); setEditingDept(r); }} className="p-1 hover:bg-blue-100 rounded">✏️</motion.button>
                        <motion.button whileHover={{ scale: 1.1 }} onClick={() => deleteDepartment(r.id)} className="p-1 hover:bg-red-100 rounded">🗑️</motion.button>
                      </div>
                    )
                  }
                ]}
                rows={departments}
                emptyText="No departments yet"
              />
            </Card>
          </motion.div>
        )}

        {/* Tab 3: Classrooms */}
        {tab === 2 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <Card
              title="Add Classroom"
              right={<Button onClick={saveRoom} disabled={busy || !roomForm.name.trim() || !roomForm.buildingId} variant="primary"><Plus size={16} /> Save</Button>}
            >
              {buildings.length === 0 ? (
                <InfoBox type="warning">Create a building first</InfoBox>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <select
                    value={roomForm.buildingId}
                    onChange={(e) => setRoomForm({ ...roomForm, buildingId: e.target.value })}
                    className="rounded-xl border px-3 py-2 text-sm focus:ring-2 focus:ring-slate-200"
                  >
                    <option value="">Select building</option>
                    {buildings.map(b => <option key={b.id} value={String(b.id)}>{b.name}</option>)}
                  </select>
                  <Input
                    placeholder="Room number/name"
                    value={roomForm.name}
                    onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })}
                  />
                  <Input
                    placeholder="Type (e.g., Classroom, Lab)"
                    value={roomForm.label}
                    onChange={(e) => setRoomForm({ ...roomForm, label: e.target.value })}
                  />
                </div>
              )}
              {msg && <InfoBox type={msg.startsWith("✗") ? "error" : "success"} className="mt-3">{msg}</InfoBox>}
            </Card>
            <Card title="All Classrooms" description={`${rooms.length} room(s)`}>
              <Table
                columns={[
                  { key: "name", header: "Room", render: (r) => <span className="flex items-center gap-2"><DoorOpen size={16} />{r.name}</span> },
                  { key: "building", header: "Building", render: (r) => buildingMap.get(String(r.buildingId)) || "—" },
                  { key: "label", header: "Type", render: (r) => r.label ? <Badge variant="info">{r.label}</Badge> : "—" },
                  {
                    key: "actions",
                    header: "",
                    render: (r) => (
                      <div className="flex gap-1">
                        <motion.button whileHover={{ scale: 1.1 }} onClick={() => { setRoomForm(r); setEditingRoom(r); }} className="p-1 hover:bg-blue-100 rounded">✏️</motion.button>
                        <motion.button whileHover={{ scale: 1.1 }} onClick={() => deleteRoom(r.id)} className="p-1 hover:bg-red-100 rounded">🗑️</motion.button>
                      </div>
                    )
                  }
                ]}
                rows={rooms}
                emptyText="No classrooms yet"
              />
            </Card>
          </motion.div>
        )}
      </motion.div>
    </AppShell>
  );
}
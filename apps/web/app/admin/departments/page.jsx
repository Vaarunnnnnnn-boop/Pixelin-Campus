"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "../../components/AppShell";
import { apiGet, apiPost } from "../../lib/api";
import { Button, Card, Input, Table } from "../../components/ui";

export default function DepartmentsPage() {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [departments, setDepartments] = useState([]);
  const [buildings, setBuildings] = useState([]);

  const [buildingId, setBuildingId] = useState("");
  const [name, setName] = useState("");
  const [hodName, setHodName] = useState("");

  const [q, setQ] = useState("");

  async function load() {
    setLoading(true);
    try {
      const [deps, blds] = await Promise.all([apiGet("/admin/departments"), apiGet("/admin/buildings")]);

      setDepartments(deps || []);
      setBuildings(blds || []);

      if (!buildingId && (blds || []).length > 0) {
        setBuildingId(String(blds[0].id));
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function create() {
    const n = name.trim();
    if (!n) return;

    if (!buildingId) {
      alert("Create a building first (Infrastructure page) or select a building.");
      return;
    }

    setBusy(true);
    try {
      await apiPost("/admin/departments", {
        buildingId,
        name: n,
        hodName: hodName.trim() || null
      });

      setName("");
      setHodName("");
      await load();
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  }

  const buildingMap = useMemo(() => {
    const m = new Map();
    for (const b of buildings) m.set(b.id, b.name);
    return m;
  }, [buildings]);

  const filtered = departments.filter((d) => {
    const text = `${d.name || ""} ${d.hodName || ""} ${d.building?.name || buildingMap.get(d.buildingId) || ""}`
      .toLowerCase()
      .includes(q.trim().toLowerCase());

    const matchesBuilding = buildingId ? String(d.buildingId) === String(buildingId) : true;
    return text && matchesBuilding;
  });

  return (
    <AppShell title="Departments">
      <div className="grid grid-cols-1 gap-4">
        <Card
          title="Create Department"
          description="Departments belong to a Building. Select building, then create."
          right={
            <Button onClick={create} disabled={busy || !name.trim() || !buildingId}>
              Create
            </Button>
          }
        >
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <div className="mb-1 text-xs font-semibold text-slate-600">Building</div>
              <select
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                value={buildingId}
                onChange={(e) => setBuildingId(e.target.value)}
              >
                {buildings.length === 0 ? (
                  <option value="">No buildings yet (create one in Infrastructure)</option>
                ) : (
                  buildings.map((b) => (
                    <option key={b.id} value={String(b.id)}>
                      {b.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <div className="mb-1 text-xs font-semibold text-slate-600">Department name</div>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Computer Science" />
            </div>

            <div>
              <div className="mb-1 text-xs font-semibold text-slate-600">HOD name (optional)</div>
              <Input value={hodName} onChange={(e) => setHodName(e.target.value)} placeholder="e.g., Prof. Marcus" />
            </div>

            <div>
              <div className="mb-1 text-xs font-semibold text-slate-600">Search</div>
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" />
            </div>
          </div>

          {buildings.length === 0 ? (
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              No buildings found. Create a building first in <b>Admin → Infrastructure</b>.
            </div>
          ) : null}
        </Card>

        <Card title="All Departments" description={loading ? "Loading…" : `${filtered.length} department(s)`}>
          <Table
            columns={[
              { key: "name", header: "Name" },
              {
                key: "building",
                header: "Building",
                render: (r) => r.building?.name || buildingMap.get(r.buildingId) || "—"
              },
              { key: "hodName", header: "HOD", render: (r) => r.hodName || "—" }
            ]}
            rows={filtered}
            emptyText={loading ? "Loading…" : "No departments found."}
          />
        </Card>
      </div>
    </AppShell>
  );
}
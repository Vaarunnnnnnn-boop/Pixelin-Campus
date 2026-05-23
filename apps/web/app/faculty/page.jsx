"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useMe } from "../lib/useMe";
import AppShell from "../components/AppShell";
import { apiGet } from "../lib/api";
import { Card, StatCard, InfoBox } from "../components/ui";

export default function FacultyHome() {
  const me = useMe();
  const [buildings, setBuildings]     = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    async function loadCampus() {
      try {
        const [b, d] = await Promise.all([
          apiGet("/infra/buildings"),
          apiGet("/infra/departments"),
        ]);
        // ✅ FIX: Backend returns { data: [...] } — unwrap .data
        // Old code did setBuildings(b) which set buildings = { data: [...] }
        // so buildings.length was undefined and .map() crashed
        setBuildings(b?.data || []);
        setDepartments(d?.data || []);
      } catch (err) {
        console.error("Failed to load campus info:", err);
      } finally {
        setLoading(false);
      }
    }
    if (me?.role === "FACULTY") loadCampus();
  }, [me]);

  // undefined = still loading useMe
  if (me === undefined) return <div className="p-8">Loading…</div>;

  // null = not logged in → redirect
  if (!me) {
    if (typeof window !== "undefined") window.location.href = "/login";
    return null;
  }

  // wrong role
  if (me.role !== "FACULTY") return <div className="p-8">Forbidden</div>;

  return (
    <AppShell title="Faculty Dashboard">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">

        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-slate-900">Welcome, Prof. {me.name}!</h1>
          <p className="text-slate-600 mt-2">Manage your classes and campus resources</p>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard label="Buildings"   value={buildings.length}   icon="🏢" color="blue"   />
          <StatCard label="Departments" value={departments.length} icon="📚" color="green"  />
          <StatCard label="My Classes"  value="—"                  icon="📖" color="purple" />
          <StatCard label="Today"       value="—"                  icon="📅" color="orange" />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">Campus Infrastructure</h2>

          {loading ? (
            <InfoBox>Loading campus information…</InfoBox>
          ) : buildings.length === 0 ? (
            <InfoBox type="warning">Campus infrastructure not yet configured</InfoBox>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {buildings.map((building, idx) => (
                <motion.div
                  key={building.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card
                    title={building.name}
                    description={building.address || "Building information"}
                    right={<div className="text-2xl">🏢</div>}
                  >
                    <div className="space-y-3">
                      {building.departments?.length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">
                            Departments ({building.departments.length})
                          </p>
                          <div className="space-y-1">
                            {building.departments.map(d => (
                              <div key={d.id} className="p-2 bg-slate-50 rounded border border-slate-200">
                                <p className="font-medium text-slate-900">{d.name}</p>
                                {d.hodName && <p className="text-xs text-blue-600">HOD: {d.hodName}</p>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {building.rooms?.length > 0 && (
                        <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                          Available Classrooms: {building.rooms.length}
                        </p>
                      )}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a href="/faculty/timetable">
            <Card title="My Timetable" description="View your teaching schedule">
              <p className="text-blue-600 font-medium">→ View Schedule</p>
            </Card>
          </a>
          <a href="/faculty/attendance">
            <Card title="Mark Attendance" description="Take class attendance">
              <p className="text-blue-600 font-medium">→ Mark Attendance</p>
            </Card>
          </a>
          <a href="/faculty/events">
            <Card title="Campus Events" description="Institutional events">
              <p className="text-blue-600 font-medium">→ View Events</p>
            </Card>
          </a>
        </motion.div>

      </motion.div>
    </AppShell>
  );
}
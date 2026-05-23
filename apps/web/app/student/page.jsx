"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Building2, Users, BookOpen, Calendar } from "lucide-react";
import { useMe } from "../lib/useMe";
import AppShell from "../components/AppShell";
import { apiGet } from "../lib/api";
import { Card, StatCard, InfoBox } from "../components/ui";

export default function StudentHome() {
  const me = useMe();
  const [buildings, setBuildings] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCampus() {
      try {
        const [b, d] = await Promise.all([
          apiGet("/infra/buildings"),
apiGet("/infra/departments")
        ]);
        setBuildings(b || []);
        setDepartments(d || []);
      } catch (err) {
        console.error("Failed to load campus info:", err);
      } finally {
        setLoading(false);
      }
    }
    if (me?.role === "STUDENT") loadCampus();
  }, [me]);

  if (me === undefined) return <div className="p-8">Loading...</div>;
  if (!me) {
    if (typeof window !== "undefined") window.location.href = "/login";
    return null;
  }
  if (me.role !== "STUDENT") return <div className="p-8">Forbidden</div>;

  return (
    <AppShell title="Student Dashboard">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-8"
      >
        {/* Welcome */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-slate-900">Welcome, {me.name}!</h1>
          <p className="text-slate-600 mt-2">Here's your campus overview and schedule</p>
        </motion.div>

        {/* Quick Stats */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard label="Buildings" value={buildings.length} icon="🏢" color="blue" />
          <StatCard label="Departments" value={departments.length} icon="📚" color="green" />
          <StatCard label="My Timetable" value="—" icon="📅" color="purple" />
          <StatCard label="Attendance" value="—" icon="✓" color="orange" />
        </motion.div>

        {/* Campus Information */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">Campus Information</h2>

          {loading ? (
            <InfoBox>Loading campus information...</InfoBox>
          ) : buildings.length === 0 ? (
            <InfoBox type="warning">Campus information not yet configured</InfoBox>
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
                    <div className="space-y-2">
                      {building.departments && building.departments.length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">Departments</p>
                          <div className="flex flex-wrap gap-2">
                            {building.departments.map(d => (
                              <div key={d.id} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                {d.name}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {building.rooms && building.rooms.length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">Classrooms: {building.rooms.length}</p>
                        </div>
                      )}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Quick Links */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a href="/student/timetable">
            <Card title="My Timetable" description="View your class schedule">
              <p className="text-blue-600 font-medium">→ View Timetable</p>
            </Card>
          </a>
          <a href="/student/attendance">
            <Card title="Attendance" description="Track your attendance">
              <p className="text-blue-600 font-medium">→ View Attendance</p>
            </Card>
          </a>
          <a href="/student/events">
            <Card title="Campus Events" description="Upcoming events">
              <p className="text-blue-600 font-medium">→ View Events</p>
            </Card>
          </a>
        </motion.div>
      </motion.div>
    </AppShell>
  );
}
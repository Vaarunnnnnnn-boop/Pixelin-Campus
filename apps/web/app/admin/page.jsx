"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Building2 } from "lucide-react";
import AppShell from "../components/AppShell";
import { apiGet } from "../lib/api";
import { Card, StatCard } from "../components/ui";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};

export default function AdminHome() {
  const [loading, setLoading] = useState(true);
  const [buildings, setBuildings]     = useState([]);
  const [departments, setDepartments] = useState([]);
  const [rooms, setRooms]             = useState([]);
  const [sections, setSections]       = useState([]);
  const [subjects, setSubjects]       = useState([]);
  const [users, setUsers]             = useState([]);
  const [timetable, setTimetable]     = useState([]);

  useEffect(() => {
    let ok = true;
    (async () => {
      try {
        const [b, d, r, se, su, u, t] = await Promise.all([
          apiGet("/admin/buildings"),
          apiGet("/admin/departments"),
          apiGet("/admin/rooms"),
          apiGet("/admin/sections"),
          apiGet("/admin/subjects"),
          apiGet("/admin/users"),
          apiGet("/admin/timetable"),
        ]);
        if (!ok) return;
        setBuildings(b   || []);
        setDepartments(d || []);
        setRooms(r       || []);
        setSections(se   || []);
        setSubjects(su   || []);
        setUsers(u       || []);
        setTimetable(t   || []);
      } finally {
        if (ok) setLoading(false);
      }
    })();
    return () => { ok = false; };
  }, []);

  const stats = useMemo(() => [
    { label: "Buildings",   value: buildings.length,   color: "blue",   icon: "🏢" },
    { label: "Departments", value: departments.length, color: "green",  icon: "📚" },
    { label: "Classrooms",  value: rooms.length,       color: "purple", icon: "🚪" },
    { label: "Sections",    value: sections.length,    color: "orange", icon: "📋" },
    { label: "Subjects",    value: subjects.length,    color: "blue",   icon: "📖" },
    { label: "Users",       value: users.length,       color: "green",  icon: "👥" },
    { label: "Timetable",   value: timetable.length,   color: "purple", icon: "📅" },
  ], [buildings, departments, rooms, sections, subjects, users, timetable]);

  return (
    <AppShell title="Admin Overview">
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-slate-900">Campus Dashboard</h1>
          <p className="text-slate-600 mt-2">Monitor and manage your institution's infrastructure</p>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, idx) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
              <a href={
                s.label === "Buildings" || s.label === "Departments" || s.label === "Classrooms"
                  ? "/admin/infrastructure"
                  : `/admin/${s.label.toLowerCase()}`
              } className="block">
                <StatCard label={s.label} value={loading ? "—" : s.value} icon={s.icon} color={s.color} />
              </a>
            </motion.div>
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="Infrastructure Management" description="Manage buildings, departments & classrooms">
            <a href="/admin/infrastructure" className="inline-block w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center font-medium transition">
              → Go to Infrastructure
            </a>
          </Card>
          <Card title="Academic Setup" description="Configure sections & subjects">
            <div className="flex gap-2">
              <a href="/admin/sections" className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-center font-medium text-sm transition">Sections</a>
              <a href="/admin/subjects" className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-center font-medium text-sm transition">Subjects</a>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </AppShell>
  );
}
"use client";

import { useEffect, useState } from "react";
import AppShell from "../../components/AppShell";
import { apiGet } from "../../lib/api";
import { Card } from "../../components/ui";

export default function FacultyDashboard() {
  const [loading, setLoading] = useState(true);
  const [buildings, setBuildings] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [blds, deps, rms] = await Promise.all([
          apiGet("/infra/buildings"),
          apiGet("/infra/departments"),
          apiGet("/infra/rooms")
        ]);
        setBuildings(Array.isArray(blds) ? blds : []);
        setDepartments(Array.isArray(deps) ? deps : []);
        setRooms(Array.isArray(rms) ? rms : []);
        setError(null);
      } catch (e) {
        console.error("Failed to load infrastructure:", e);
        setError(e.message || "Failed to load infrastructure");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const buildingMap = new Map(buildings.map((b) => [b.id, b.name]));

  return (
    <AppShell title="Faculty Dashboard">
      <div className="grid grid-cols-1 gap-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
            <p className="font-semibold">Error loading infrastructure</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card
            title="Buildings"
            description={loading ? "Loading…" : "Campus infrastructure"}
            right={<div className="text-2xl font-bold text-blue-600">{buildings.length}</div>}
          >
            <div className="text-xs text-slate-500">Total buildings on campus</div>
          </Card>
          <Card
            title="Departments"
            description={loading ? "Loading…" : "Available departments"}
            right={<div className="text-2xl font-bold text-green-600">{departments.length}</div>}
          >
            <div className="text-xs text-slate-500">Study departments</div>
          </Card>
          <Card
            title="Rooms"
            description={loading ? "Loading…" : "Classrooms & facilities"}
            right={<div className="text-2xl font-bold text-purple-600">{rooms.length}</div>}
          >
            <div className="text-xs text-slate-500">Available classrooms</div>
          </Card>
        </div>

        {/* Buildings */}
        <Card title="Campus Buildings" description={loading ? "Loading…" : `${buildings.length} building(s)`}>
          {loading ? (
            <div className="flex justify-center py-8"><p className="text-slate-500">Loading buildings…</p></div>
          ) : buildings.length === 0 ? (
            <div className="flex justify-center py-8"><p className="text-slate-500">No buildings available yet.</p></div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {buildings.map((b) => (
                <div key={b.id} className="rounded-lg border border-blue-100 bg-gradient-to-br from-blue-50 to-blue-100 p-4 hover:shadow-md transition">
                  <h3 className="font-semibold text-slate-900">{b.name}</h3>
                  {b.address && <p className="text-sm text-slate-600">{b.address}</p>}
                  {b.headName && <p className="text-sm text-blue-700 font-medium">Head: {b.headName}</p>}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Departments */}
        <Card title="Departments (With HOD Information)" description={loading ? "Loading…" : `${departments.length} department(s)`}>
          {loading ? (
            <div className="flex justify-center py-8"><p className="text-slate-500">Loading departments…</p></div>
          ) : departments.length === 0 ? (
            <div className="flex justify-center py-8"><p className="text-slate-500">No departments available yet.</p></div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {departments.map((d) => (
                <div key={d.id} className="rounded-lg border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-blue-100 p-4 hover:shadow-md transition">
                  <h3 className="font-semibold text-slate-900 text-lg">{d.name}</h3>
                  <p className="text-sm text-slate-600 mt-1">Building: {buildingMap.get(d.buildingId) || "N/A"}</p>
                  {d.hodName ? (
                    <p className="text-sm font-bold text-blue-800 mt-2 bg-blue-200 rounded px-2 py-1">
                      🎓 HOD: {d.hodName}
                    </p>
                  ) : (
                    <p className="text-sm text-slate-500 italic mt-2">No HOD assigned</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Rooms */}
        <Card title="Available Rooms & Facilities" description={loading ? "Loading…" : `${rooms.length} room(s)`}>
          {loading ? (
            <div className="flex justify-center py-8"><p className="text-slate-500">Loading rooms…</p></div>
          ) : rooms.length === 0 ? (
            <div className="flex justify-center py-8"><p className="text-slate-500">No rooms available yet.</p></div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {rooms.map((r) => (
                <div key={r.id} className="rounded-lg border border-purple-100 bg-gradient-to-br from-purple-50 to-purple-100 p-4 hover:shadow-md transition">
                  <h3 className="font-semibold text-slate-900">{r.name}</h3>
                  {r.label && <p className="text-sm text-slate-600">{r.label}</p>}
                  <p className="text-sm text-slate-600">Building: {buildingMap.get(r.buildingId) || "N/A"}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
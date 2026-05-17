"use client";

import { useEffect, useState } from "react";
import AppShell from "../../components/AppShell";
import { apiGet } from "../../lib/api";
import { Card } from "../../components/ui";

export default function StudentCampusPage() {
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiGet("/infra/buildings")
      .then((data) => setBuildings(Array.isArray(data) ? data : []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell title="Campus Info">
      {loading ? (
        <div className="text-sm text-slate-500 py-6 text-center">Loading…</div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : buildings.length === 0 ? (
        <div className="rounded-xl border p-6 text-slate-500 text-sm text-center">
          No campus infrastructure data available yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {buildings.map((building) => (
            <Card key={building.id} title={building.name} description={building.address || undefined}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mt-2">

                {/* Departments */}
                <div>
                  <div className="mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Departments
                  </div>
                  {!building.departments?.length ? (
                    <div className="text-sm text-slate-400">No departments listed.</div>
                  ) : (
                    <div className="grid gap-2">
                      {building.departments.map((dep) => (
                        <div key={dep.id} className="rounded-xl border bg-slate-50 px-3 py-2">
                          <div className="text-sm font-medium text-slate-900">{dep.name}</div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            HOD: {dep.hodName || "—"}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Rooms */}
                <div>
                  <div className="mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Rooms & Labs
                  </div>
                  {!building.rooms?.length ? (
                    <div className="text-sm text-slate-400">No rooms listed.</div>
                  ) : (
                    <div className="grid gap-2">
                      {building.rooms.map((room) => (
                        <div key={room.id} className="rounded-xl border bg-slate-50 px-3 py-2">
                          <div className="text-sm font-medium text-slate-900">
                            Room {room.name}
                          </div>
                          {room.label && (
                            <div className="text-xs text-slate-500 mt-0.5">{room.label}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
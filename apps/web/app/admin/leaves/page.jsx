"use client";

import { useEffect, useState } from "react";
import AppShell from "../../components/AppShell";
import { apiGet, apiPut } from "../../lib/api";

export default function AdminLeavesPage() {
  const [leaves, setLeaves] = useState([]);

  async function load() {
    const data = await apiGet("/admin/leaves");
    setLeaves(data || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function approve(id) {
    const approvedDays = prompt("Approved days?");

    if (!approvedDays) return;

    await apiPut(
      `/admin/leaves/${id}/approve`,
      {
        approvedDays
      }
    );

    await load();
  }

  async function reject(id) {
    await apiPut(
      `/admin/leaves/${id}/reject`,
      {}
    );

    await load();
    }

  return (
    <AppShell title="Leave Requests">
      <div className="grid gap-5">
        {leaves.map((leave) => (
          <div
            key={leave.id}
            className="rounded-2xl border p-5 bg-white"
          >
            <div className="flex justify-between">
              <div>
                <h2 className="text-xl font-bold">
                  {leave.title}
                </h2>

                <div className="text-sm text-slate-500 mt-2">
                  {leave.studentName}
                </div>

                <div className="text-sm text-slate-500">
                  {leave.enrollmentNo}
                </div>

                <div className="text-sm text-slate-500">
                  {leave.department}
                </div>
              </div>

              <div>
                <div className="font-semibold">
                  {leave.status}
                </div>
              </div>
            </div>

            <div className="mt-4 whitespace-pre-wrap text-sm text-slate-600">
              {leave.description}
            </div>

            <div className="mt-4 text-sm">
              Requested Days: {leave.requestedDays}
            </div>

            {leave.medicalFile ? (
              <a
                href={`http://localhost:4000${leave.medicalFile}`}
                target="_blank"
                className="mt-4 inline-block text-blue-500"
              >
                View Medical Certificate
              </a>
            ) : null}

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => approve(leave.id)}
                className="rounded-xl bg-green-600 text-white px-4 py-2"
              >
                Approve
              </button>

              <button
                onClick={() => reject(leave.id)}
                className="rounded-xl bg-red-600 text-white px-4 py-2"
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
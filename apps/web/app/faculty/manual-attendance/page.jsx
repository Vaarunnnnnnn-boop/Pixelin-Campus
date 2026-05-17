"use client";

import { useEffect, useState } from "react";
import AppShell from "../../components/AppShell";
import { apiGet, apiPost } from "../../lib/api";

export default function ManualAttendancePage() {
  const [students, setStudents] = useState([]);

  async function load() {
    const data = await apiGet("/admin/users");

    setStudents(
      (data || []).filter(
        (u) => u.role === "STUDENT"
      )
    );
  }

  useEffect(() => {
    load();
  }, []);

  async function mark(studentId, status) {
    try {
      await apiPost(
        "/faculty/attendance",
        {
          studentId,
          status,
          date: new Date()
        }
      );

      alert("Attendance marked");
    } catch (e) {
      alert(e.message);
    }
  }
   return (
    <AppShell title="Manual Attendance">
      <div className="grid gap-4">
        {students.map((student) => (
          <div
            key={student.id}
            className="rounded-2xl border p-4 bg-white flex items-center justify-between"
          >
            <div>
              <div className="font-semibold">
                {student.name}
              </div>

              <div className="text-sm text-slate-500">
                {student.email}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => mark(student.id, "PRESENT")}
                className="rounded-xl bg-green-600 text-white px-4 py-2"
              >
                Present
              </button>

              <button
                onClick={() => mark(student.id, "ABSENT")}
                className="rounded-xl bg-red-600 text-white px-4 py-2"
              >
                Absent
              </button>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
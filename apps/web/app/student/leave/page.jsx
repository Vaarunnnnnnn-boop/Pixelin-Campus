"use client";

import { useEffect, useState } from "react";
import AppShell from "../../components/AppShell";
import { apiGet } from "../../lib/api";

export default function StudentLeavePage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [department, setDepartment] = useState("");
  const [enrollmentNo, setEnrollmentNo] = useState("");
  const [studentName, setStudentName] = useState("");
  const [requestedDays, setRequestedDays] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [file, setFile] = useState(null);
  const [leaves, setLeaves] = useState([]);

  async function load() {
    const data = await apiGet("/student/leave");
    setLeaves(data || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function submitLeave() {
    try {
      const form = new FormData();

      form.append("title", title);
      form.append("description", description);
      form.append("department", department);
      form.append("enrollmentNo", enrollmentNo);
      form.append("studentName", studentName);
      form.append("requestedDays", requestedDays);
      form.append("startDate", startDate);

      if (file) {
        form.append("medical", file);
      }

      const res = await fetch(
        "http://localhost:4000/student/leave",
        {
          method: "POST",
          credentials: "include",
          body: form
        }
      );

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error);
      }

      alert("Leave Applied");

      await load();
    } catch (e) {
      alert(e.message);
    }
  }

  return (
    <AppShell title="Leave Management">
      <div className="space-y-6">

        <div className="rounded-2xl border p-5 bg-white">
          <h2 className="text-xl font-bold mb-4">
            Apply Leave
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <input
              className="border rounded-xl px-4 py-3"
              placeholder="Title"
               value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <input
              className="border rounded-xl px-4 py-3"
              placeholder="Department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            />

            <input
              className="border rounded-xl px-4 py-3"
              placeholder="Enrollment No"
              value={enrollmentNo}
              onChange={(e) => setEnrollmentNo(e.target.value)}
            />

            <input
              className="border rounded-xl px-4 py-3"
              placeholder="Student Name"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
            />

            <input
              type="number"
              className="border rounded-xl px-4 py-3"
              placeholder="Requested Days"
              value={requestedDays}
              onChange={(e) => setRequestedDays(e.target.value)}
            />

            <input
              type="date"
              className="border rounded-xl px-4 py-3"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <textarea
            className="border rounded-xl px-4 py-3 mt-4 w-full min-h-[120px]"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="mt-4">
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>

          <button
            onClick={submitLeave}
            className="mt-5 rounded-xl bg-black text-white px-5 py-3"
          >
            Apply Leave
          </button>
        </div>

      </div>
    </AppShell>
  );
}
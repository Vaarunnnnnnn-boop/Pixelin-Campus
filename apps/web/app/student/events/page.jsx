"use client";

import { useEffect, useState } from "react";
import AppShell from "../../components/AppShell";
import { apiGet } from "../../lib/api";

export default function StudentEventsPage() {
  const [events, setEvents] = useState([]);

  async function load() {
    const data = await apiGet("/events");
    setEvents(data || []);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <AppShell title="Campus Events">
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {events.map((event) => (
          <div
            key={event.id}
            className="rounded-2xl border overflow-hidden bg-white"
          >
            {event.poster ? (
              <img
                src={`http://localhost:4000${event.poster}`}
                className="w-full h-56 object-cover"
              />
            ) : null}

            <div className="p-5">
              <h2 className="text-xl font-bold">
                {event.title}
              </h2>

              <div className="text-sm text-slate-500 mt-2">
                {new Date(event.startsAt).toLocaleString()}
              </div>

              <div className="mt-3 text-sm">
                {event.details}
              </div>

              <div className="mt-3 text-sm text-slate-600 whitespace-pre-wrap">
                {event.description}
              </div>

              <div className="mt-3 text-sm font-medium">
                {event.location}
              </div>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
"use client";

import { useEffect, useState } from "react";
import AppShell from "../../components/AppShell";
import { apiGet, apiDel } from "../../lib/api";

export default function AdminEventsPage() {
  const [events, setEvents] = useState([]);
  const [busy, setBusy] = useState(false);

  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [poster, setPoster] = useState(null);

  async function load() {
    const data = await apiGet("/events");
    setEvents(data || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function createEvent() {
    try {
      if (!title || !startsAt) {
        alert("Title and date required");
        return;
      }

      setBusy(true);

      const form = new FormData();

      form.append("title", title);
      form.append("details", details);
      form.append("description", description);
      form.append("location", location);
      form.append("startsAt", startsAt);

      if (poster) {
        form.append("poster", poster);
      }

      const res = await fetch(
        "http://localhost:4000/admin/events",
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

      setTitle("");
      setDetails("");
      setDescription("");
      setLocation("");
      setStartsAt("");
      setPoster(null);

      await load();
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteEvent(id) {
    const ok = confirm("Delete this event?");
    if (!ok) return;

    await apiDel(`/admin/events/${id}`);
    await load();
  }

  return (
    <AppShell title="Event Management">
      <div className="space-y-6">

        <div className="rounded-2xl border p-5 bg-white">
          <h2 className="text-xl font-bold mb-4">
            Create Event
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <input
              className="border rounded-xl px-4 py-3"
              placeholder="Event Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <input
              type="datetime-local"
              className="border rounded-xl px-4 py-3"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
            />

            <input
              className="border rounded-xl px-4 py-3"
              placeholder="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />

            <input
              className="border rounded-xl px-4 py-3"
              placeholder="Short Details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
            />
          </div>

          <textarea
            className="border rounded-xl px-4 py-3 mt-4 w-full min-h-[140px]"
            placeholder="Event Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="mt-4">
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={(e) => setPoster(e.target.files?.[0] || null)}
            />
          </div>

          <button
            onClick={createEvent}
            disabled={busy}
            className="mt-5 rounded-xl bg-black text-white px-5 py-3"
          >
            Create Event
          </button>
        </div>

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

                <button
                  onClick={() => deleteEvent(event.id)}
                  className="mt-5 rounded-xl border border-red-500 text-red-500 px-4 py-2"
                >
                  Delete Event
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </AppShell>
  );
}
"use client";

import { useEffect, useState } from "react";

import AppShell from "../../components/AppShell";

import {
  Cpu,
  Lightbulb,
  Fan,
  Monitor,
  Save,
  RefreshCw,
  Clock3,
  Zap
} from "lucide-react";

const DEVICE_LAYOUT = [
  {
    key: "relay1",
    label: "Projector",
    icon: Monitor
  },
  {
    key: "relay2",
    label: "Main Lights",
    icon: Lightbulb
  },
  {
    key: "relay3",
    label: "Fan System",
    icon: Fan
  },
  {
    key: "relay4",
    label: "Secondary Lights",
    icon: Lightbulb
  }
];

export default function SmartAutomationPage() {

  const [roomIp, setRoomIp] = useState("");

  const [savedIp, setSavedIp] = useState("");

  const [busy, setBusy] = useState(false);

  const [error, setError] = useState("");

  const [mode, setMode] = useState("MANUAL");

  const [relayState, setRelayState] = useState({
    relay1: false,
    relay2: false,
    relay3: false,
    relay4: false
  });

  const roomName = "Room 101";

  useEffect(() => {

    const ip =
      localStorage.getItem(
        "room-controller-ip"
      ) || "";

    setRoomIp(ip);

    setSavedIp(ip);

  }, []);

  async function refreshStatus() {

    if (!savedIp) return;

    try {

      setBusy(true);

      setError("");

      const res = await fetch(
  `${savedIp}/api/status`
);
      const json = await res.json();

      setRelayState({
        relay1: !!json.relay1,
        relay2: !!json.relay2,
        relay3: !!json.relay3,
        relay4: !!json.relay4
      });

      if (json.mode) {
        setMode(json.mode);
      }

    } catch (e) {

      setError(
        "Failed to connect to classroom controller."
      );

    } finally {

      setBusy(false);

    }

  }

  async function saveIp() {

    localStorage.setItem(
      "room-controller-ip",
      roomIp
    );

setSavedIp(roomIp);

setTimeout(() => {
  refreshStatus();
}, 300);
  }

  async function setSystemMode(nextMode) {

    try {

      setBusy(true);

      await fetch(
  `${savedIp}/api/mode`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json"
          },
          body: JSON.stringify({
            mode: nextMode
          })
        }
      );

      setMode(nextMode);

    } catch (e) {

      setError(
        "Failed to change automation mode."
      );

    } finally {

      setBusy(false);

    }

  }

  async function toggleRelay(relayKey, state) {

    if (mode !== "MANUAL") return;

    try {

      setBusy(true);

      const relayNumber =
        relayKey.replace(
          "relay",
          ""
        );

      await fetch(
  `${savedIp}/api/relay`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      channel: Number(relayNumber),
      on: state
    })
  }
);

      setRelayState((prev) => ({
        ...prev,
        [relayKey]: state
      }));

    } catch (e) {

      setError(
        "Failed to control classroom device."
      );

    } finally {

      setBusy(false);

    }

  }

  return (

    <AppShell title="Smart Classroom Automation">

      <div className="space-y-6">

        {/* CONNECTION */}

        <div className="rounded-3xl border bg-white p-6">

          <div className="flex items-center justify-between mb-5">

            <div>

              <h2 className="text-xl font-bold">
                Classroom Device Connection
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Connect classroom IoT controller.
              </p>

            </div>

            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
              <Cpu size={26} />
            </div>

          </div>

          <div className="flex gap-4">

            <input
              value={roomIp}
              onChange={(e) =>
                setRoomIp(e.target.value)
              }
              placeholder="Enter Room Controller IP"
              className="flex-1 border rounded-2xl px-5 py-4 outline-none"
            />

            <button
              onClick={saveIp}
              className="px-6 rounded-2xl bg-slate-900 text-white flex items-center gap-2"
            >
              <Save size={18} />
              Save
            </button>

            <button
              onClick={refreshStatus}
              className="px-6 rounded-2xl border flex items-center gap-2"
            >
              <RefreshCw size={18} />
              Refresh
            </button>

          </div>

          {savedIp ? (

            <div className="mt-4 text-sm text-slate-500">

              Connected Room Controller:

              <span className="font-semibold ml-2">
                {savedIp}
              </span>

            </div>

          ) : null}

          {error ? (

            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-600 text-sm">
              {error}
            </div>

          ) : null}

        </div>

        {/* AUTOMATION MODE */}

        <div className="rounded-3xl border bg-white p-6">

          <div className="flex items-center justify-between mb-5">

            <div>

              <h2 className="text-xl font-bold">
                Automation Mode
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                AUTO mode uses timetable-based energy saving.
              </p>

            </div>

            <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-full text-sm font-medium">

              <Zap size={16} />

              Current: {mode}

            </div>

          </div>

          <div className="flex gap-4">

            <button
              onClick={() =>
                setSystemMode(
                  "MANUAL"
                )
              }
              className={`px-6 py-4 rounded-2xl font-semibold ${
                mode === "MANUAL"
                  ? "bg-slate-900 text-white"
                  : "border"
              }`}
            >
              Manual Control
            </button>

            <button
              onClick={() =>
                setSystemMode(
                  "AUTO"
                )
              }
              className={`px-6 py-4 rounded-2xl font-semibold ${
                mode === "AUTO"
                  ? "bg-green-600 text-white"
                  : "border"
              }`}
            >
              Auto Energy Saving
            </button>

          </div>

          {mode === "AUTO" ? (

            <div className="mt-5 rounded-2xl bg-green-50 border border-green-200 p-5">

              <div className="flex items-center gap-2 font-semibold text-green-700">

                <Clock3 size={18} />

                Smart Timetable Automation Active

              </div>

              <div className="text-sm text-green-700 mt-3 leading-7">

                • Devices turn ON 15 minutes before class starts

                <br />

                • Devices turn OFF 5 minutes after class ends

                <br />

                • Energy saving enabled for Room 101

              </div>

            </div>

          ) : null}

        </div>

        {/* ROOM CONTROLS */}

        <div className="rounded-3xl border bg-white p-6">

          <div className="flex items-center justify-between mb-6">

            <div>

              <h2 className="text-xl font-bold">
                {roomName} Controls
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Smart classroom device management.
              </p>

            </div>

            <div className="px-4 py-2 rounded-full bg-slate-100 text-sm font-medium">

              {mode === "AUTO"
                ? "Automation Enabled"
                : "Manual Control Enabled"}

            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">

            {DEVICE_LAYOUT.map((device) => {

              const active =
                relayState[
                  device.key
                ];

              const Icon =
                device.icon;

              return (

                <div
                  key={device.key}
                  className="rounded-3xl border p-5"
                >

                  <div className="flex items-center justify-between mb-5">

                    <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">

                      <Icon size={26} />

                    </div>

                    <div
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        active
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >

                      {active
                        ? "ACTIVE"
                        : "OFF"}

                    </div>

                  </div>

                  <div className="text-lg font-bold mb-5">

                    {device.label}

                  </div>

                  <div className="flex gap-3">

                    <button
                      disabled={
                        mode !==
                        "MANUAL"
                      }
                      onClick={() =>
                        toggleRelay(
                          device.key,
                          true
                        )
                      }
                      className={`flex-1 py-3 rounded-2xl font-semibold ${
                        active
                          ? "bg-green-600 text-white"
                          : "border"
                      }`}
                    >
                      ON
                    </button>

                    <button
                      disabled={
                        mode !==
                        "MANUAL"
                      }
                      onClick={() =>
                        toggleRelay(
                          device.key,
                          false
                        )
                      }
                      className={`flex-1 py-3 rounded-2xl font-semibold ${
                        !active
                          ? "bg-red-600 text-white"
                          : "border"
                      }`}
                    >
                      OFF
                    </button>

                  </div>

                  {mode === "AUTO" ? (

                    <div className="mt-4 text-xs text-slate-500 leading-6">

                      Controlled automatically based on timetable.

                    </div>

                  ) : (

                    <div className="mt-4 text-xs text-slate-500 leading-6">

                      Manual classroom device control enabled.

                    </div>

                  )}

                </div>

              );

            })}

          </div>

        </div>

        {/* ENERGY SAVING */}

        <div className="rounded-3xl border bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6">

          <div className="flex items-center justify-between">

            <div>

              <div className="text-lg font-semibold">
                Smart Energy Saving
              </div>

              <div className="mt-2 text-green-100">
                Auto scheduling reduces unnecessary electricity usage.
              </div>

            </div>

            <div className="text-right">

              <div className="text-4xl font-bold">
                18%
              </div>

              <div className="text-green-100 text-sm mt-1">
                Estimated energy saved
              </div>

            </div>

          </div>

        </div>

      </div>

    </AppShell>

  );

}
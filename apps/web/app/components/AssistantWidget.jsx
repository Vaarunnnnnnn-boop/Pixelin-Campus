"use client";

import { useEffect, useState } from "react";
import { apiPost } from "../lib/api";
import {
  startSpeechToText,
  speak
} from "../lib/speech";
import { useMe } from "../lib/useMe";

export default function AssistantWidget() {

  const me = useMe();

  const [open, setOpen] = useState(false);

  const [input, setInput] = useState("");

  const [busy, setBusy] = useState(false);

  const [pending, setPending] = useState(null);

  const [messages, setMessages] = useState([
    {
      from: "ai",
      text:
        "Hi! Ask me anything. Admin can create departments, sections, subjects, rooms, buildings and more with confirmation."
    }
  ]);

  useEffect(() => {

    if (me === null) {
      setOpen(false);
    }

  }, [me]);

  // =========================================
  // SEND MESSAGE
  // =========================================

  async function send(text) {

    const msg = (text || "").trim();

    if (!msg) return;

    setBusy(true);

    setMessages((m) => [
      ...m,
      {
        from: "user",
        text: msg
      }
    ]);

    try {

      const response = await apiPost(
        "/ai/chat",
        {
          message: msg
        }
      );

      console.log("AI RESPONSE:", response);

      // Direct response structure - no double nesting
      const data = response?.mode ? response : response?.data;

      console.log("PARSED DATA:", data);

      // =====================================
      // PENDING CONFIRMATION
      // =====================================

      if (data?.mode === "pending") {

        setPending(data.pendingAction);

        const out =
          data.text ||
          "Please confirm this action.";

        setMessages((m) => [
          ...m,
          {
            from: "ai",
            text: out
          }
        ]);

        speak(out);

        return;
      }

      // =====================================
      // EXECUTED
      // =====================================

      if (data?.mode === "executed") {

        const out =
          data.text ||
          "✅ Action completed successfully.";

        setMessages((m) => [
          ...m,
          {
            from: "ai",
            text: out
          }
        ]);

        speak(out);

        setPending(null);

        // REFRESH PAGE DATA
        window.location.reload();

        return;
      }

      // =====================================
      // NORMAL RESPONSE
      // =====================================

      const out =
        data?.text ||
        "Done.";

      setMessages((m) => [
        ...m,
        {
          from: "ai",
          text: out
        }
      ]);

      speak(out);

    } catch (e) {

      console.error(e);

      setMessages((m) => [
        ...m,
        {
          from: "ai",
          text: `Error: ${e.message}`
        }
      ]);

    } finally {

      setBusy(false);

    }

  }

  // =========================================
  // CONFIRM ACTION
  // =========================================

  async function confirm() {

    if (!pending) return;

    setBusy(true);

    try {

      const response = await apiPost(
        "/ai/chat",
        {
          pendingAction: {
            ...pending,
            confirm: true
          }
        }
      );

      console.log(
        "CONFIRM RESPONSE:",
        response
      );

      // Direct response structure - no double nesting
      const data = response?.mode ? response : response?.data;

      console.log("CONFIRM PARSED:", data);

      const out =
        data?.text ||
        "✅ Action completed successfully.";

      setMessages((m) => [
        ...m,
        {
          from: "ai",
          text: out
        }
      ]);

      speak(out);

      setPending(null);

      // REFRESH PAGE
      window.location.reload();

    } catch (e) {

      console.error(e);

      setMessages((m) => [
        ...m,
        {
          from: "ai",
          text: `Error: ${e.message}`
        }
      ]);

    } finally {

      setBusy(false);

    }

  }

  // =========================================
  // MIC
  // =========================================

  function mic() {

    startSpeechToText({

      onText: (t) => {

        setInput(t);

      },

      onError: (e) => {

        setMessages((m) => [
          ...m,
          {
            from: "ai",
            text: `Mic error: ${e.message}`
          }
        ]);

      }

    });

  }

  if (me === undefined || !me) {
    return null;
  }

  return (

    <div
      style={{
        position: "fixed",
        right: 18,
        bottom: 18,
        zIndex: 999999
      }}
    >

      {!open ? (

        <button
          onClick={() =>
            setOpen(true)
          }
          style={{
            padding: "12px 14px",
            borderRadius: 999,
            border: "1px solid #111",
            background: "#111",
            color: "white",
            fontWeight: 600,
            cursor: "pointer",
            boxShadow:
              "0 6px 20px rgba(0,0,0,0.25)"
          }}
        >

          AI Assistant ({me.role})

        </button>

      ) : (

        <div
          style={{
            width: 380,
            height: 520,
            background: "white",
            border: "1px solid #ddd",
            borderRadius: 12,
            overflow: "hidden",
            boxShadow:
              "0 10px 30px rgba(0,0,0,0.25)"
          }}
        >

          {/* HEADER */}

          <div
            style={{
              padding: 10,
              background: "#111",
              color: "white",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >

            <div
              style={{
                fontWeight: 700
              }}
            >
              Assistant
            </div>

            <button
              onClick={() =>
                setOpen(false)
              }
              style={{
                background: "transparent",
                color: "white",
                border: "none",
                cursor: "pointer",
                fontSize: 18
              }}
            >
              ×
            </button>

          </div>

          {/* USER */}

          <div
            style={{
              padding: 10,
              fontSize: 12,
              color: "#666"
            }}
          >

            Logged in as{" "}
            <b>{me.name}</b>{" "}
            ({me.role})

          </div>

          {/* CHAT */}

          <div
            style={{
              padding: 10,
              height: 320,
              overflow: "auto",
              display: "grid",
              gap: 8
            }}
          >

            {messages.map(
              (m, i) => (

                <div
                  key={i}
                  style={{
                    justifySelf:
                      m.from === "user"
                        ? "end"
                        : "start",

                    background:
                      m.from === "user"
                        ? "#DCFCE7"
                        : "#F3F4F6",

                    padding: "8px 10px",

                    borderRadius: 10,

                    maxWidth: "92%",

                    whiteSpace: "pre-wrap"
                  }}
                >

                  {m.text}

                </div>

              )
            )}

          </div>

          {/* CONFIRMATION */}

          {pending ? (

            <div
              style={{
                padding: 10,
                borderTop: "1px solid #eee",
                display: "flex",
                gap: 8
              }}
            >

              <button
                onClick={confirm}
                disabled={busy}
                style={{
                  flex: 1,
                  background: "#16a34a",
                  color: "white",
                  border: "none",
                  padding: 10,
                  borderRadius: 8,
                  cursor: "pointer"
                }}
              >

                Confirm

              </button>

              <button
                onClick={() =>
                  setPending(null)
                }
                disabled={busy}
                style={{
                  flex: 1,
                  background: "#ef4444",
                  color: "white",
                  border: "none",
                  padding: 10,
                  borderRadius: 8,
                  cursor: "pointer"
                }}
              >

                Cancel

              </button>

            </div>

          ) : null}

          {/* INPUT */}

          <div
            style={{
              padding: 10,
              borderTop: "1px solid #eee",
              display: "flex",
              gap: 8
            }}
          >

            <input
              value={input}
              onChange={(e) =>
                setInput(e.target.value)
              }
              placeholder="Type or use mic..."
              style={{
                flex: 1,
                padding: 8
              }}
              disabled={busy}
              onKeyDown={(e) => {

                if (e.key === "Enter") {

                  send(input);

                  setInput("");

                }

              }}
            />

            <button
              onClick={() => {

                send(input);

                setInput("");

              }}
              disabled={busy}
            >

              Send

            </button>

            <button
              onClick={mic}
              disabled={busy}
              title="Speak"
            >

              🎤

            </button>

          </div>

        </div>

      )}

    </div>

  );

}

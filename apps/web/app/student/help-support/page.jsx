"use client";

import { useEffect, useRef, useState } from "react";

import AppShell from "../../components/AppShell";

import { apiPost } from "../../lib/api";

import {
  startSpeechToText,
  speak
} from "../../lib/speech";

import { useMe } from "../../lib/useMe";

import {
  Bot,
  Send,
  Mic,
  Volume2,
  Sparkles
} from "lucide-react";

export default function StudentHelpSupportPage() {
  const me = useMe();

  const [input, setInput] = useState("");

  const [busy, setBusy] = useState(false);

  const [pending, setPending] = useState(null);

  const [messages, setMessages] = useState([
    {
      from: "ai",
      text:
        me?.role === "FACULTY"
          ? "Hello 👋 Faculty Assistant is ready to help you."
          : "Hello 👋 Student Assistant is ready to help you."
    }
  ]);

  const bottomRef = useRef(null);

useEffect(() => {

  bottomRef.current?.scrollIntoView({
    behavior: "smooth"
  });

}, [messages]);

useEffect(() => {

  const storedPrompt =
    localStorage.getItem(
      "assistant_prompt"
    );

  if (storedPrompt) {

    send(storedPrompt);

    localStorage.removeItem(
      "assistant_prompt"
    );

  }

}, []);

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
      const data = await apiPost(
        "/ai/chat",
        {
          message: msg
        }
      );

      // IMPORTANT:
      // Reusing SAME LOGIC as AssistantWidget

      if (data.mode === "pending") {
        setPending(data.pendingAction);

        const out =
          data.text || "Please confirm.";

        setMessages((m) => [
          ...m,
          {
            from: "ai",
            text: out
          }
        ]);

        speak(out);
      } else {
        const out =
          data.text ||
          data.reply ||
          data.answer ||
          data.message ||
          "Done.";

        setMessages((m) => [
          ...m,
          {
            from: "ai",
            text: out
          }
        ]);

        speak(out);
      }
    } catch (e) {
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

  async function confirm() {
    if (!pending) return;

    setBusy(true);

    try {
      const data = await apiPost(
        "/ai/chat",
        {
          pendingAction: {
            ...pending,
            confirm: true
          }
        }
      );

      const out =
        data?.result?.ok === false
          ? `Couldn't do it: ${data.result.error}`
          : "Done successfully.";

      setMessages((m) => [
        ...m,
        {
          from: "ai",
          text: out
        }
      ]);

      speak(out);

      setPending(null);
    } catch (e) {
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

  function mic() {
    startSpeechToText({
      onText: (t) => {
        setInput(t);

        send(t);
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

  // ROLE-BASED SUGGESTIONS

  const suggestions =
    me?.role === "FACULTY"
      ? [
          "Show today's timetable",
          "Show assigned sections",
          "Which students are absent?",
          "Upcoming faculty events",
          "Show department details",
          "Today's lectures"
        ]
      : [
          "When is my next lecture?",
          "Why is my attendance low?",
          "How to apply leave?",
          "What events are upcoming?",
          "Where is CS Lab 2?",
          "Show today's timetable"
        ];

  return (
    <AppShell title="Help & Support">
      <div className="h-[82vh] flex flex-col rounded-3xl border bg-white overflow-hidden">

        {/* HEADER */}

        <div className="border-b px-6 py-5 flex items-center justify-between bg-gradient-to-r from-slate-900 to-slate-800 text-white">

          <div className="flex items-center gap-3">

            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
              <Bot size={24} />
            </div>

            <div>
              <div className="text-xl font-bold">
                Smart Campus AI
              </div>

              <div className="text-sm text-slate-300">
                Help & Support Assistant
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm bg-green-500/20 px-4 py-2 rounded-full">
            <Sparkles size={16} />
            AI Online
          </div>
        </div>

        {/* SUGGESTIONS */}

        <div className="border-b p-4 flex flex-wrap gap-3 bg-slate-50">
          {suggestions.map((q) => (
            <button
              key={q}
              onClick={() => send(q)}
              className="px-4 py-2 rounded-full bg-white border hover:bg-slate-100 text-sm"
            >
              {q}
            </button>
          ))}
        </div>

        {/* CHAT */}

        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-50">

          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${
                m.from === "user"
                  ? "justify-end"
                  : "justify-start"
              }`}
            >
              <div
                className={`max-w-[75%] px-5 py-4 rounded-3xl whitespace-pre-wrap shadow-sm ${
                  m.from === "user"
                    ? "bg-slate-900 text-white"
                    : "bg-white border"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}

          {busy ? (
            <div className="flex justify-start">
              <div className="bg-white border px-5 py-4 rounded-3xl shadow-sm">
                Thinking...
              </div>
            </div>
          ) : null}

          <div ref={bottomRef} />
        </div>

        {/* CONFIRMATION */}

        {pending ? (
          <div className="px-4 py-3 border-t bg-yellow-50 flex gap-3">
            <button
              onClick={confirm}
              disabled={busy}
              className="px-4 py-2 rounded-xl bg-green-600 text-white"
            >
              Confirm
            </button>

            <button
              onClick={() =>
                setPending(null)
              }
              disabled={busy}
              className="px-4 py-2 rounded-xl border"
            >
              Cancel
            </button>
          </div>
        ) : null}

        {/* INPUT */}

        <div className="border-t p-4 bg-white">

          <div className="flex items-center gap-3">

            <button
              onClick={mic}
              disabled={busy}
              className="w-12 h-12 rounded-2xl border flex items-center justify-center hover:bg-slate-100"
            >
              <Mic size={20} />
            </button>

            <input
              value={input}
              onChange={(e) =>
                setInput(e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  send(input);

                  setInput("");
                }
              }}
              placeholder="Ask anything about campus, timetable, attendance, leave, events..."
              className="flex-1 border rounded-2xl px-5 py-4 outline-none"
              disabled={busy}
            />

            <button className="w-12 h-12 rounded-2xl border flex items-center justify-center hover:bg-slate-100">
              <Volume2 size={20} />
            </button>

            <button
              onClick={() => {
                send(input);

                setInput("");
              }}
              disabled={busy}
              className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center"
            >
              <Send size={20} />
            </button>

          </div>

        </div>

      </div>
    </AppShell>
  );
}
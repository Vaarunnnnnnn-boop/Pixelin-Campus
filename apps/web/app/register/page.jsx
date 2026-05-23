"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { apiPost } from "../lib/api";
import VantaBackground from "../components/VantaBackground";

const ROLES = ["STUDENT", "FACULTY"];
// ✅ ADMIN removed — security risk to allow self-registration as admin

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "STUDENT" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState(false);

  function set(key, val) {
    setForm(f => ({ ...f, [key]: val }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setError("All fields are required.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await apiPost("/auth/register", form);
      // ✅ FIX: Show success then redirect (previously no feedback)
      setSuccess(true);
      setTimeout(() => router.push("/login"), 1200);
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col items-center justify-center px-4 bg-[#f5f6fa]">

      <VantaBackground />
      <div className="absolute inset-0 bg-white/10 z-0" />

      <div className="relative z-10 w-full flex flex-col items-center">

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8 flex flex-col items-center gap-2"
        >
          <p className="text-6xl font-black text-white tracking-tight drop-shadow-[0_0_25px_rgba(255,255,255,0.35)]">
            Pixelin
          </p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08 }}
          className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
        >
          <div className="px-7 pt-7 pb-5">
            <h1 className="text-xl font-bold text-slate-900">Create account</h1>
            <p className="text-sm text-slate-500 mt-1">Join Pixelin to access your campus dashboard.</p>
          </div>

          <div className="h-px bg-slate-100 mx-7" />

          <form onSubmit={handleSubmit} className="px-7 py-6 space-y-4">

            {success && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5"
              >
                Account created! Redirecting to login…
              </motion.div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5"
              >
                {error}
              </motion.div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Full Name</label>
              <input
                type="text"
                autoComplete="name"
                placeholder="Jane Doe"
                value={form.name}
                onChange={e => set("name", e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#1e1b4b]/20 focus:border-[#1e1b4b]/40 transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Email</label>
              <input
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => set("email", e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#1e1b4b]/20 focus:border-[#1e1b4b]/40 transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Password</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Min. 6 characters"
                  value={form.password}
                  onChange={e => set("password", e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 pr-11 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#1e1b4b]/20 focus:border-[#1e1b4b]/40 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Role</label>
              <div className="grid grid-cols-2 gap-2">
                {ROLES.map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => set("role", r)}
                    className={`py-2 rounded-xl text-xs font-semibold border transition ${
                      form.role === r
                        ? "bg-[#1e1b4b] text-white border-[#1e1b4b]"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:border-[#1e1b4b]/30 hover:text-[#1e1b4b]"
                    }`}
                  >
                    {r.charAt(0) + r.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading || success}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#1e1b4b] hover:bg-[#2d2a6e] text-white text-sm font-semibold py-2.5 transition disabled:opacity-60 disabled:cursor-not-allowed mt-1"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <>Create account <ArrowRight size={15} /></>}
            </motion.button>
          </form>

          <div className="flex items-center justify-between px-7 py-4 border-t border-slate-100 bg-slate-50/60">
            <span className="text-sm text-slate-400">Already have an account?</span>
            <a href="/login" className="text-sm font-semibold text-[#1e1b4b] hover:text-[#2d2a6e] transition">
              Sign in →
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
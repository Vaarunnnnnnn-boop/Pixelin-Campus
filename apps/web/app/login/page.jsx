"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { apiPost } from "../lib/api";
import VantaBackground from "../components/VantaBackground";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm]       = useState({ email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.email.trim() || !form.password.trim()) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await apiPost("/auth/login", form);
      const role = res?.user?.role || res?.role;
      if (role === "ADMIN")        router.push("/admin");
      else if (role === "FACULTY") router.push("/faculty");
      else if (role === "STUDENT") router.push("/student");
      else                         router.push("/");
      router.refresh();
    } catch (err) {
      setError(err.message || "Invalid email or password.");
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
        {/* Card header */}
        <div className="px-7 pt-7 pb-5">
          <h1 className="text-xl font-bold text-slate-900">Welcome back</h1>
          <p className="text-sm text-slate-500 mt-1">Sign in to continue to your dashboard.</p>
        </div>

        <div className="h-px bg-slate-100 mx-7" />

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-7 py-6 space-y-4">

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5"
            >
              {error}
            </motion.div>
          )}

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Email
            </label>
            <input
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#1e1b4b]/20 focus:border-[#1e1b4b]/40 transition"
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Password
            </label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
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

          {/* Submit */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#1e1b4b] hover:bg-[#2d2a6e] text-white text-sm font-semibold py-2.5 transition disabled:opacity-60 disabled:cursor-not-allowed mt-1"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>Login <ArrowRight size={15} /></>
            )}
          </motion.button>

          {/* Hint */}
          <p className="text-center text-xs text-slate-400 leading-relaxed pt-1">
            Use your Admin, Faculty, or Student account<br />to reach the correct dashboard.
          </p>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between px-7 py-4 border-t border-slate-100 bg-slate-50/60">
          <span className="text-sm text-slate-400">New here?</span>
          <a
            href="/register"
            className="text-sm font-semibold text-[#1e1b4b] hover:text-[#2d2a6e] transition"
          >
            Create account →
          </a>
        </div>
      </motion.div>
      </div>
    </div>
  );
}
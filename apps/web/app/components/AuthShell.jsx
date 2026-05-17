"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-md"
        >
          <div className="mb-6 text-center">
            <Link href="/" className="inline-block">
              <div className="text-2xl font-extrabold text-slate-900">Pixelin</div>
              <div className="text-xs text-slate-500">Smart Attendance + Dashboard</div>
            </Link>
          </div>

          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <div className="mb-5">
              <div className="text-xl font-bold text-slate-900">{title}</div>
              {subtitle ? <div className="mt-1 text-sm text-slate-500">{subtitle}</div> : null}
            </div>

            {children}

            {footer ? <div className="mt-6 border-t pt-4">{footer}</div> : null}
          </div>

          <div className="mt-6 text-center text-xs text-slate-400">
            © {new Date().getFullYear()} Pixelin
          </div>
        </motion.div>
      </div>
    </div>
  );
}
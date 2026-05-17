"use client";

import { motion } from "framer-motion";

export function Button({ className = "", variant = "primary", isLoading = false, ...props }) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed gap-2";
  const styles =
    variant === "primary"
      ? "bg-slate-900 text-white hover:bg-slate-800 shadow-md"
      : variant === "secondary"
      ? "bg-slate-100 text-slate-900 hover:bg-slate-200"
      : variant === "success"
      ? "bg-green-600 text-white hover:bg-green-700"
      : variant === "danger"
      ? "bg-red-600 text-white hover:bg-red-500"
      : "bg-white border border-slate-200 text-slate-900 hover:bg-slate-50";

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`${base} ${styles} ${className}`}
      disabled={isLoading}
      {...props}
    >
      {isLoading && <span className="animate-spin">⚙️</span>}
      {props.children}
    </motion.button>
  );
}

export function Input({ className = "", error, ...props }) {
  return (
    <div className="w-full">
      <input
        className={`w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200 transition ${
          error ? "border-red-500 focus:ring-red-200" : "border-slate-200"
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

export function Card({ title, description, right, children, className = "" }) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition ${className}`}
    >
      {(title || right) && (
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            {title && <div className="text-sm font-bold text-slate-900">{title}</div>}
            {description && <div className="text-xs text-slate-500 mt-1">{description}</div>}
          </div>
          {right}
        </div>
      )}
      {children}
    </motion.div>
  );
}

export function Table({ columns = [], rows = [], emptyText = "No data" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-2xl border border-slate-200"
    >
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className="px-4 py-3 font-bold text-xs uppercase tracking-wide">
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td className="px-4 py-6 text-center text-slate-500" colSpan={columns.length}>
                {emptyText}
              </td>
            </tr>
          ) : (
            rows.map((r, idx) => (
              <motion.tr
                key={idx}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="border-t border-slate-200 hover:bg-slate-50 transition"
              >
                {columns.map((c) => (
                  <td key={c.key} className="px-4 py-3 text-slate-700">
                    {c.render ? c.render(r) : r[c.key]}
                  </td>
                ))}
              </motion.tr>
            ))
          )}
        </tbody>
      </table>
    </motion.div>
  );
}

export function Badge({ children, variant = "default" }) {
  const variants = {
    default: "bg-slate-100 text-slate-700",
    success: "bg-green-100 text-green-700",
    warning: "bg-orange-100 text-orange-700",
    danger: "bg-red-100 text-red-700",
    info: "bg-blue-100 text-blue-700"
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  );
}

export function InfoBox({ type = "info", children }) {
  const styles = {
    info: "border-blue-200 bg-blue-50 text-blue-800",
    warning: "border-amber-200 bg-amber-50 text-amber-800",
    error: "border-red-200 bg-red-50 text-red-800",
    success: "border-green-200 bg-green-50 text-green-800"
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border px-4 py-3 text-sm ${styles[type]}`}
    >
      {children}
    </motion.div>
  );
}

export function StatCard({ label, value, icon: Icon, color = "blue" }) {
  const colors = {
    blue: "from-blue-50 to-blue-100 border-blue-200",
    green: "from-green-50 to-green-100 border-green-200",
    purple: "from-purple-50 to-purple-100 border-purple-200",
    orange: "from-orange-50 to-orange-100 border-orange-200"
  };
  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -4 }}
      className={`rounded-2xl p-5 shadow-sm border bg-gradient-to-br ${colors[color]}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">{label}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
        </div>
        {Icon && <div className="text-2xl">{Icon}</div>}
      </div>
    </motion.div>
  );
}

/**
 * MasterDetail — Black left panel list + white right detail panel
 * Props:
 *   items: array of { id, title, subtitle?, badge? }
 *   selected: id of selected item
 *   onSelect: (id) => void
 *   onAdd?: () => void   — shows "+ New" button
 *   addLabel?: string
 *   detail: ReactNode — content shown on right
 *   emptyDetail?: ReactNode — shown when nothing selected
 */
export function MasterDetail({
  items = [],
  selected,
  onSelect,
  onAdd,
  addLabel = "New",
  detail,
  emptyDetail,
  loading = false
}) {
  return (
    <div className="flex rounded-2xl border border-slate-200 overflow-hidden shadow-sm min-h-[520px]">
      {/* Left — black panel */}
      <div className="w-64 flex-shrink-0 bg-slate-900 flex flex-col">
        {onAdd && (
          <div className="p-3 border-b border-slate-700">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onAdd}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold py-2 transition"
            >
              <span className="text-lg leading-none">+</span> {addLabel}
            </motion.button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto py-2">
          {loading ? (
            <div className="px-4 py-6 text-slate-500 text-sm text-center">Loading…</div>
          ) : items.length === 0 ? (
            <div className="px-4 py-6 text-slate-500 text-sm text-center">Nothing here yet</div>
          ) : (
            items.map((item, idx) => (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03 }}
                onClick={() => onSelect(item.id)}
                className={`w-full text-left px-4 py-3 flex items-start gap-3 transition border-l-2 ${
                  selected === item.id
                    ? "bg-white/10 border-white text-white"
                    : "border-transparent text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold truncate">{item.title}</div>
                  {item.subtitle && (
                    <div className="text-xs text-slate-500 mt-0.5 truncate">{item.subtitle}</div>
                  )}
                </div>
                {item.badge && (
                  <span className="flex-shrink-0 text-xs bg-white/10 text-slate-300 rounded-full px-2 py-0.5">
                    {item.badge}
                  </span>
                )}
              </motion.button>
            ))
          )}
        </div>
      </div>

      {/* Right — white detail panel */}
      <div className="flex-1 bg-white overflow-y-auto">
        {selected ? (
          <motion.div
            key={selected}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.18 }}
            className="p-6 h-full"
          >
            {detail}
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3 p-8">
            {emptyDetail || (
              <>
                <div className="text-4xl">👈</div>
                <p className="text-sm">Select an item from the left to view details</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
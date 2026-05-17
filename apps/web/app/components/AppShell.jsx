"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { ToggleLeft, MessageCircle, Menu, X, Bell, Settings, ChevronRight } from "lucide-react";
import {
  LayoutDashboard,
  Building2,
  Layers,
  BookOpen,
  Users,
  CalendarDays,
  ClipboardCheck,
  LogOut,
  HelpCircle,
} from "lucide-react";
import { apiPost } from "../lib/api";
import { useMe } from "../lib/useMe";

// ── NavItem ──────────────────────────────────────────────────────────────────

function NavItem({ href, icon: Icon, label, collapsed }) {
  const pathname = usePathname();
  const isRoot = href === "/admin" || href === "/faculty" || href === "/student";
  const active = isRoot
    ? pathname === href
    : pathname === href || pathname.startsWith(href + "/");

  return (
    <motion.div whileHover={{ x: collapsed ? 0 : 2 }}>
      <Link
        href={href}
        className={[
          "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors group",
          active
            ? "bg-white/15 text-white"
            : "text-white/60 hover:bg-white/[0.08] hover:text-white",
        ].join(" ")}
      >
        {active && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-white rounded-full" />
        )}
        <Icon size={17} className="flex-shrink-0" />
        {!collapsed && <span className="truncate">{label}</span>}

        {collapsed && (
          <span className="absolute left-full ml-3 z-50 hidden group-hover:flex items-center pointer-events-none">
            <span className="bg-slate-800 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap border border-white/10">
              {label}
            </span>
          </span>
        )}
      </Link>
    </motion.div>
  );
}

// ── SectionTitle ─────────────────────────────────────────────────────────────

function SectionTitle({ children, collapsed }) {
  if (collapsed) return <div className="my-2 border-t border-white/10" />;
  return (
    <p className="mt-4 mb-1 px-3 text-[10px] font-bold tracking-widest text-white/35 uppercase select-none">
      {children}
    </p>
  );
}

// ── AppShell ─────────────────────────────────────────────────────────────────

export default function AppShell({ children, title }) {
  const me = useMe();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // ── Original logout logic ────────────────────────────────────────────────
  async function logout() {
    try {
      await apiPost("/auth/logout", {});
    } finally {
      router.push("/login");
      router.refresh();
    }
  }

  const role = me?.role || "GUEST";

  // ── Original nav definitions ─────────────────────────────────────────────

  const adminNav = (
    <>
      <NavItem href="/admin"               icon={LayoutDashboard} label="Overview"            collapsed={collapsed} />
      <SectionTitle collapsed={collapsed}>Infrastructure & Academics</SectionTitle>
      <NavItem href="/admin/infrastructure" icon={Building2}      label="Infrastructure"       collapsed={collapsed} />
      <NavItem href="/admin/events"         icon={CalendarDays}   label="Events"               collapsed={collapsed} />
      <NavItem href="/admin/sections"       icon={Layers}         label="Sections"             collapsed={collapsed} />
      <NavItem href="/admin/subjects"       icon={BookOpen}       label="Subjects"             collapsed={collapsed} />
      <SectionTitle collapsed={collapsed}>Management</SectionTitle>
      <NavItem href="/admin/users"          icon={Users}          label="Users"                collapsed={collapsed} />
      <NavItem href="/admin/assignments"    icon={ClipboardCheck} label="Faculty Assignments"  collapsed={collapsed} />
      <NavItem href="/admin/timetable"      icon={CalendarDays}   label="Timetable"            collapsed={collapsed} />
      <NavItem href="/admin/switching"      icon={ToggleLeft}     label="Smart Automation"     collapsed={collapsed} />
      <NavItem href="/admin/leaves"         icon={ClipboardCheck} label="Leave Requests"       collapsed={collapsed} />
    </>
  );

  const facultyNav = (
    <>
      <NavItem href="/faculty"                   icon={LayoutDashboard} label="Overview"          collapsed={collapsed} />
      <SectionTitle collapsed={collapsed}>Teaching</SectionTitle>
      <NavItem href="/faculty/timetable"         icon={CalendarDays}    label="Timetable"         collapsed={collapsed} />
      <NavItem href="/faculty/attendance"        icon={ClipboardCheck}  label="Mark Attendance"   collapsed={collapsed} />
      <SectionTitle collapsed={collapsed}>Campus</SectionTitle>
      <NavItem href="/faculty/campus"            icon={Building2}       label="Campus Info"       collapsed={collapsed} />
      <NavItem href="/faculty/events"            icon={CalendarDays}    label="Events"            collapsed={collapsed} />
      <SectionTitle collapsed={collapsed}>Support</SectionTitle>
      <NavItem href="/faculty/help-support"      icon={MessageCircle}   label="Help & Support"    collapsed={collapsed} />
    </>
  );

  const studentNav = (
    <>
      <NavItem href="/student"              icon={LayoutDashboard} label="Overview"      collapsed={collapsed} />
      <SectionTitle collapsed={collapsed}>Learning</SectionTitle>
      <NavItem href="/student/timetable"    icon={CalendarDays}    label="Timetable"     collapsed={collapsed} />
      <NavItem href="/student/attendance"   icon={ClipboardCheck}  label="Attendance"    collapsed={collapsed} />
      <SectionTitle collapsed={collapsed}>Campus</SectionTitle>
      <NavItem href="/student/campus"       icon={Building2}       label="Campus Info"   collapsed={collapsed} />
      <NavItem href="/student/events"       icon={CalendarDays}    label="Events"        collapsed={collapsed} />
      <SectionTitle collapsed={collapsed}>Personal</SectionTitle>
      <NavItem href="/student/leave"        icon={ClipboardCheck}  label="Leave"         collapsed={collapsed} />
      <NavItem href="/student/help-support" icon={MessageCircle}   label="Help & Support" collapsed={collapsed} />
    </>
  );

  const nav =
    role === "ADMIN"   ? adminNav   :
    role === "FACULTY" ? facultyNav :
    role === "STUDENT" ? studentNav :
    null;

  // ── Sidebar JSX (reused for desktop + mobile) ────────────────────────────

  function SidebarContent({ isMobile = false }) {
    return (
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div
          className={`flex items-center gap-3 px-4 py-[18px] border-b border-white/10 flex-shrink-0 ${
            collapsed && !isMobile ? "justify-center" : ""
          }`}
        >
          <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-black text-[13px]">P</span>
          </div>
          {(!collapsed || isMobile) && (
            <div className="min-w-0 flex-1">
              <p className="text-white font-bold text-[13px] leading-tight">Pixelin</p>
              <p className="text-white/38 text-[10px] leading-tight tracking-wide">Campus Management</p>
            </div>
          )}
          {isMobile && (
            <button
              onClick={() => setMobileOpen(false)}
              className="ml-auto p-1 text-white/50 hover:text-white transition flex-shrink-0"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {nav}
        </nav>

        {/* Bottom actions */}
        <div className="flex-shrink-0 border-t border-white/10 px-2 py-3 space-y-0.5">
          <button
            onClick={logout}
            className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-400/75 hover:bg-red-500/10 hover:text-red-300 transition-colors ${
              collapsed && !isMobile ? "justify-center" : ""
            }`}
          >
            <LogOut size={17} />
            {(!collapsed || isMobile) && <span>Logout</span>}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">

      {/* ── Desktop Sidebar ──────────────────────────────────────────────── */}
      <motion.aside
        animate={{ width: collapsed ? 68 : 228 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="hidden md:flex flex-col flex-shrink-0 bg-[#1e1b4b] overflow-visible relative z-20"
      >
        {/* Collapse toggle pill */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="absolute top-[22px] -right-3 z-30 w-6 h-6 rounded-full bg-[#1e1b4b] border border-white/20 flex items-center justify-center text-white/55 hover:text-white transition-colors shadow-lg"
        >
          <motion.span
            animate={{ rotate: collapsed ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="flex"
          >
            <ChevronRight size={11} />
          </motion.span>
        </button>

        <SidebarContent isMobile={false} />
      </motion.aside>

      {/* ── Mobile Sidebar overlay ───────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-30 md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -228 }}
              animate={{ x: 0 }}
              exit={{ x: -228 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="fixed left-0 top-0 h-full w-[228px] bg-[#1e1b4b] z-40 md:hidden flex flex-col"
            >
              <SidebarContent isMobile={true} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Main ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* Top bar */}
        <header className="flex-shrink-0 flex items-center justify-between bg-white border-b border-slate-200 px-5 h-14 z-10">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={18} />
            </button>
            <div>
              <p className="text-[11px] text-slate-500 leading-tight">
                Signed in as{" "}
                <span className="font-semibold text-slate-700">{me?.name || "—"}</span>
              </p>
              <p className="text-[11px] text-slate-400 leading-tight">
                {me?.email || ""}{me?.role ? ` (${me.role})` : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:block text-[13px] font-semibold text-slate-700 mr-2">
              Page&nbsp;&nbsp;
              <span className="font-normal text-slate-400">{title || "Dashboard"}</span>
            </span>
            <button className="relative w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 transition">
              <Bell size={15} />
              <span className="absolute top-[7px] right-[7px] w-1.5 h-1.5 rounded-full bg-red-500" />
            </button>
            <button className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 transition">
              <Settings size={15} />
            </button>
            <div className="w-8 h-8 rounded-full bg-[#1e1b4b] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {me?.name?.[0]?.toUpperCase() || "?"}
            </div>
          </div>
        </header>

        {/* Page content — original AnimatePresence wrapper kept */}
        <main className="flex-1 overflow-y-auto p-5 md:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={title || "page"}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
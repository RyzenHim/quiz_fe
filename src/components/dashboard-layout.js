"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  CircleHelp,
  ClipboardList,
  Code2,
  LayoutDashboard,
  LogOut,
  Menu,
  MoonStar,
  SunMedium,
  X,
  UserRoundCog,
  Users,
  Layers,
} from "lucide-react";
import { useAppContext } from "./app-provider";

const teacherMenu = [
  { name: "Overview", shortName: "Home", path: "/teacher-dashboard", icon: LayoutDashboard },
  { name: "Students", shortName: "Students", path: "/teacher-dashboard/students", icon: Users },
  { name: "Courses", shortName: "Courses", path: "/teacher-dashboard/courses", icon: BookOpen },
  { name: "Batches", shortName: "Batches", path: "/teacher-dashboard/batches", icon: Layers },
  { name: "Skills", shortName: "Skills", path: "/teacher-dashboard/skills", icon: Code2 },
  { name: "Questions", shortName: "Questions", path: "/teacher-dashboard/questions", icon: CircleHelp },
  { name: "Quizzes", shortName: "Quizzes", path: "/teacher-dashboard/quizzes", icon: ClipboardList },
  { name: "Profile", shortName: "Profile", path: "/teacher-dashboard/profile", icon: UserRoundCog },
];

const COLLAPSED_SIDEBAR_WIDTH = 88;
const EXPANDED_SIDEBAR_WIDTH = 240;

export function DashboardLayout({ children, role = "teacher" }) {
  const pathname = usePathname();
  const router = useRouter();
  const { auth, logout, theme, toggleTheme, isReady } = useAppContext();
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (!auth?.token) {
      router.replace("/login");
      return;
    }

    if (auth.role !== role) {
      router.replace(auth.landingPath || "/login");
    }
  }, [auth, isReady, role, router]);

  useEffect(() => {
    if (!mobileMenuOpen) {
      return undefined;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [mobileMenuOpen]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const menu = role === "teacher" ? teacherMenu : [];

  return (
    <div className="app-shell">
      <div
        className="hidden h-screen md:grid"
        style={{
          gridTemplateColumns: `${sidebarExpanded ? EXPANDED_SIDEBAR_WIDTH : COLLAPSED_SIDEBAR_WIDTH}px minmax(0, 1fr)`,
        }}
      >
      <aside
        className="dashboard-sidebar z-40 block border-r border-white/10"
        onMouseEnter={() => setSidebarExpanded(true)}
        onMouseLeave={() => setSidebarExpanded(false)}
      >
        <div
          className="theme-transition flex h-full flex-col justify-between overflow-hidden p-3 text-white duration-200 ease-out"
          style={{
            width: `${sidebarExpanded ? EXPANDED_SIDEBAR_WIDTH : COLLAPSED_SIDEBAR_WIDTH}px`,
            boxShadow: sidebarExpanded ? "0 18px 48px rgba(0,0,0,0.2)" : "none",
            background: "var(--sidebar)",
          }}
        >
          <div className="min-h-0 flex-1">
            <div className="mb-5 overflow-hidden rounded-[22px] border border-white/10 bg-white/6 p-3">
              <p className="text-[10px] uppercase tracking-[0.32em] text-emerald-200/70">Quiz App</p>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-base font-semibold">
                  {(auth?.user?.name || "T").charAt(0).toUpperCase()}
                </div>
                <div
                  className="overflow-hidden whitespace-nowrap transition-all duration-200 ease-out"
                  style={{
                    maxWidth: sidebarExpanded ? "10rem" : "0rem",
                    opacity: sidebarExpanded ? 1 : 0,
                    pointerEvents: sidebarExpanded ? "auto" : "none",
                  }}
                >
                  <p className="text-base font-semibold">{auth?.user?.name || "Teacher"}</p>
                  <p className="text-xs text-slate-300">{auth?.user?.specialization || "Faculty"}</p>
                </div>
              </div>
            </div>

            <nav className="space-y-2 pr-1">
              {menu.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.path;

                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`relative flex min-h-[3.25rem] items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5 transition duration-200 ${
                      isActive ? "bg-white/14 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]" : "hover:bg-white/8"
                    }`}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10">
                      <Icon size={17} />
                    </span>
                    <span
                      className="overflow-hidden whitespace-nowrap transition-all duration-200 ease-out"
                      style={{
                        maxWidth: sidebarExpanded ? "8rem" : "0rem",
                        opacity: sidebarExpanded ? 1 : 0,
                        pointerEvents: sidebarExpanded ? "auto" : "none",
                      }}
                    >
                      {item.name}
                    </span>
                    <span
                      className="ml-auto text-[11px] text-slate-300 transition-all duration-150"
                      style={{
                        transform: sidebarExpanded ? "translateX(8px)" : "translateX(0)",
                        opacity: sidebarExpanded ? 0 : 1,
                      }}
                    >
                      {item.shortName}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="space-y-2 pt-3">
            <button
              type="button"
              onClick={toggleTheme}
              className="flex min-h-[3.25rem] w-full items-center gap-3 overflow-hidden rounded-xl border border-white/10 px-3 py-2.5 text-left transition duration-200 hover:bg-white/8"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10">
                {theme === "dark" ? <SunMedium size={17} /> : <MoonStar size={17} />}
              </span>
              <span
                className="overflow-hidden whitespace-nowrap transition-all duration-200 ease-out"
                style={{
                  maxWidth: sidebarExpanded ? "8rem" : "0rem",
                  opacity: sidebarExpanded ? 1 : 0,
                  pointerEvents: sidebarExpanded ? "auto" : "none",
                }}
              >
                {theme === "dark" ? "Light mode" : "Dark mode"}
              </span>
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="flex min-h-[3.25rem] w-full items-center gap-3 overflow-hidden rounded-xl bg-red-500/90 px-3 py-2.5 text-left transition duration-200 hover:bg-red-500"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10">
                <LogOut size={17} />
              </span>
              <span
                className="overflow-hidden whitespace-nowrap transition-all duration-200 ease-out"
                style={{
                  maxWidth: sidebarExpanded ? "6rem" : "0rem",
                  opacity: sidebarExpanded ? 1 : 0,
                  pointerEvents: sidebarExpanded ? "auto" : "none",
                }}
              >
                Logout
              </span>
            </button>
          </div>
        </div>
      </aside>

      <main className="dashboard-content p-4 md:p-5">
        <div className="dashboard-content-inner space-y-4">
          {children}
        </div>
      </main>
      </div>

      <main className="min-h-screen overflow-x-hidden p-3 md:hidden">
        <div className="mx-auto max-w-6xl space-y-3">
          <div className="sticky top-4 z-50 md:hidden">
            <div className="neo-panel rounded-[24px] px-3.5 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.28em] text-[var(--accent)]">Teacher Area</p>
                  <h1 className="truncate text-xl font-semibold">{auth?.user?.name || "Teacher"}</h1>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="neo-button !min-h-[2.75rem] !rounded-[0.9rem] !px-3"
                    aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                  >
                    {theme === "dark" ? <SunMedium size={18} /> : <MoonStar size={18} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(true)}
                    className="neo-button !min-h-[2.75rem] !rounded-[0.9rem] !px-3"
                    aria-label="Open navigation menu"
                  >
                    <Menu size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {mobileMenuOpen ? (
            <div className="fixed inset-0 z-[80] md:hidden">
              <button
                type="button"
                className="mobile-nav-backdrop absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close navigation menu"
              />
              <div className="mobile-nav-drawer absolute right-0 top-0 flex h-full w-[min(88vw,22rem)] flex-col border-l border-white/10 bg-[var(--sidebar)] p-4 text-white shadow-2xl">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.32em] text-emerald-200/70">Quiz App</p>
                    <p className="mt-2 truncate text-lg font-semibold">{auth?.user?.name || "Teacher"}</p>
                    <p className="text-xs text-slate-300">{auth?.user?.specialization || "Faculty"}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/10"
                    aria-label="Close navigation menu"
                  >
                    <X size={18} />
                  </button>
                </div>

                <nav className="mt-6 flex-1 space-y-2 overflow-y-auto pr-1">
                  {menu.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.path;

                    return (
                      <Link
                        key={item.path}
                        href={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex min-h-[3.25rem] items-center gap-3 rounded-xl px-3 py-3 ${
                          isActive ? "bg-white/14" : "bg-white/6"
                        }`}
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10">
                          <Icon size={17} />
                        </span>
                        <span className="text-sm font-medium">{item.name}</span>
                      </Link>
                    );
                  })}
                </nav>

                <div className="space-y-2 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      toggleTheme();
                      setMobileMenuOpen(false);
                    }}
                    className="flex min-h-[3.25rem] w-full items-center gap-3 rounded-xl border border-white/10 px-3 py-3 text-left"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10">
                      {theme === "dark" ? <SunMedium size={17} /> : <MoonStar size={17} />}
                    </span>
                    <span className="text-sm font-medium">{theme === "dark" ? "Light mode" : "Dark mode"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex min-h-[3.25rem] w-full items-center gap-3 rounded-xl bg-red-500/90 px-3 py-3 text-left"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10">
                      <LogOut size={17} />
                    </span>
                    <span className="text-sm font-medium">Logout</span>
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {children}
        </div>
      </main>
    </div>
  );
}

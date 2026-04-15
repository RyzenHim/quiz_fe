"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpenCheck,
  Clock3,
  LayoutDashboard,
  LogOut,
  MoonStar,
  Trophy,
  SunMedium,
  UserRoundCog,
} from "lucide-react";
import { useAppContext } from "../../components/app-provider";

const studentMenu = [
  { name: "Dashboard", shortName: "Home", path: "/student-dashboard", icon: LayoutDashboard },
  { name: "Upcoming Quiz", shortName: "Soon", path: "/student-dashboard/upcoming", icon: Clock3 },
  { name: "Practice Quiz", shortName: "Practice", path: "/student-dashboard/practice", icon: BookOpenCheck },
  { name: "Results", shortName: "Results", path: "/student-dashboard/results", icon: Trophy },
  { name: "Profile", shortName: "Profile", path: "/student-dashboard/profile", icon: UserRoundCog },
];

const COLLAPSED_SIDEBAR_WIDTH = 88;
const EXPANDED_SIDEBAR_WIDTH = 240;

export default function StudentDashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { auth, logout, theme, toggleTheme, isReady } = useAppContext();
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (!auth?.token) {
      router.replace("/login");
      return;
    }

    if (auth.role !== "student") {
      router.replace(auth.landingPath || "/login");
    }
  }, [auth, isReady, router]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

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
                  {(auth?.user?.name || "S").charAt(0).toUpperCase()}
                </div>
                <div
                  className="overflow-hidden whitespace-nowrap transition-all duration-200 ease-out"
                  style={{
                    maxWidth: sidebarExpanded ? "9rem" : "0rem",
                    opacity: sidebarExpanded ? 1 : 0,
                    pointerEvents: sidebarExpanded ? "auto" : "none",
                  }}
                >
                  <p className="text-base font-semibold">{auth?.user?.name || "Student"}</p>
                  <p className="text-xs text-slate-300">{auth?.user?.batch?.batchName || "No batch"}</p>
                </div>
              </div>
            </div>

            <nav className="space-y-2 pr-1">
              {studentMenu.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.path;

                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`flex min-h-[3.25rem] items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5 transition duration-200 ${
                      isActive ? "bg-white/14" : "hover:bg-white/8"
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

      <main className="min-h-screen overflow-x-hidden p-4 md:hidden">
        <div className="mx-auto max-w-6xl space-y-4">
          <div className="neo-panel rounded-[30px] p-6 md:hidden">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-[var(--accent)]">Student Area</p>
              <h1 className="mt-2 text-3xl font-semibold">{auth?.user?.name || "Student"}</h1>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {studentMenu.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.path;

                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${
                      isActive
                        ? "border-[var(--accent)] bg-[var(--accent)]/10"
                        : "border-[var(--border)]"
                    }`}
                  >
                    <Icon size={18} className="text-[var(--accent)]" />
                    <span className="text-sm font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}

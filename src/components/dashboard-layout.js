"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  CircleHelp,
  ClipboardList,
  Code2,
  LayoutDashboard,
  LogOut,
  MoonStar,
  SunMedium,
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

export function DashboardLayout({ children, role = "teacher" }) {
  const pathname = usePathname();
  const router = useRouter();
  const { auth, logout, theme, toggleTheme, isReady } = useAppContext();

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

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const menu = role === "teacher" ? teacherMenu : [];

  return (
    <div className="app-shell">
      <aside className="group fixed left-0 top-0 z-40 hidden h-screen md:block md:w-[104px]">
        <div
          className="theme-transition flex h-full w-[104px] flex-col justify-between overflow-hidden border-r border-white/10 p-4 text-white duration-300 ease-out group-hover:w-72 group-hover:shadow-[0_24px_80px_rgba(0,0,0,0.28)]"
          style={{ background: "var(--sidebar)" }}
        >
          <div>
            <div className="mb-8 overflow-hidden rounded-[30px] border border-white/10 bg-white/6 p-4">
              <p className="text-[10px] uppercase tracking-[0.32em] text-emerald-200/70">Quiz App</p>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-lg font-semibold">
                  {(auth?.user?.name || "T").charAt(0).toUpperCase()}
                </div>
                <div className="pointer-events-none max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-out group-hover:pointer-events-auto group-hover:max-w-[11rem] group-hover:opacity-100">
                  <p className="text-lg font-semibold">{auth?.user?.name || "Teacher"}</p>
                  <p className="text-xs text-slate-300">{auth?.user?.specialization || "Faculty"}</p>
                </div>
              </div>
            </div>

            <nav className="space-y-3">
              {menu.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.path;

                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`relative flex min-h-[4rem] items-center gap-3 overflow-hidden rounded-2xl px-4 py-3 transition duration-300 ${
                      isActive ? "bg-white/14 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]" : "hover:bg-white/8"
                    }`}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/10">
                      <Icon size={18} />
                    </span>
                    <span className="pointer-events-none max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-out group-hover:pointer-events-auto group-hover:max-w-[8.5rem] group-hover:opacity-100">
                      {item.name}
                    </span>
                    <span className="ml-auto text-xs text-slate-300 transition-all duration-200 group-hover:translate-x-2 group-hover:opacity-0">
                      {item.shortName}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={toggleTheme}
              className="flex min-h-[4rem] w-full items-center gap-3 overflow-hidden rounded-2xl border border-white/10 px-4 py-3 text-left transition duration-300 hover:bg-white/8"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/10">
                {theme === "dark" ? <SunMedium size={18} /> : <MoonStar size={18} />}
              </span>
              <span className="pointer-events-none max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-out group-hover:pointer-events-auto group-hover:max-w-[8rem] group-hover:opacity-100">
                {theme === "dark" ? "Light mode" : "Dark mode"}
              </span>
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="flex min-h-[4rem] w-full items-center gap-3 overflow-hidden rounded-2xl bg-red-500/90 px-4 py-3 text-left transition duration-300 hover:bg-red-500"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/10">
                <LogOut size={18} />
              </span>
              <span className="pointer-events-none max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-out group-hover:pointer-events-auto group-hover:max-w-[6rem] group-hover:opacity-100">
                Logout
              </span>
            </button>
          </div>
        </div>
      </aside>

      <main className="min-h-screen p-4 md:ml-24 md:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="neo-panel rounded-[30px] p-6 md:hidden">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-[var(--accent)]">Teacher Area</p>
              <h1 className="mt-2 text-3xl font-semibold">{auth?.user?.name || "Teacher"}</h1>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {menu.map((item) => {
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

"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, Layers, LayoutDashboard, LogOut, MoonStar, SunMedium, Users, Code2 } from "lucide-react";
import { useAppContext } from "./app-provider";

const teacherMenu = [
  { name: "Overview", path: "/teacher-dashboard", icon: LayoutDashboard },
  { name: "Students", path: "/teacher-dashboard/students", icon: Users },
  { name: "Courses", path: "/teacher-dashboard/courses", icon: BookOpen },
  { name: "Batches", path: "/teacher-dashboard/batches", icon: Layers },
  { name: "Skills", path: "/teacher-dashboard/skills", icon: Code2 },
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
    <div className="app-shell flex min-h-screen">
      <aside
        className="theme-transition hidden w-72 flex-col justify-between border-r border-white/10 p-6 text-white md:flex"
        style={{ background: "var(--sidebar)" }}
      >
        <div>
          <div className="mb-10">
            <p className="text-xs uppercase tracking-[0.28em] text-emerald-200/70">Quiz App</p>
            <h2 className="mt-3 text-3xl font-semibold">
              {role === "teacher" ? "Teacher Panel" : "Student Panel"}
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              {auth?.user?.name || "Dashboard"}
            </p>
          </div>

          <nav className="space-y-3">
            {menu.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;

              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 transition ${
                    isActive ? "bg-white/14" : "hover:bg-white/8"
                  }`}
                >
                  <Icon size={18} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={toggleTheme}
            className="flex w-full items-center gap-3 rounded-2xl border border-white/10 px-4 py-3 text-left transition hover:bg-white/8"
          >
            {theme === "dark" ? <SunMedium size={18} /> : <MoonStar size={18} />}
            <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-2xl bg-red-500/90 px-4 py-3 text-left transition hover:bg-red-500"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { MoonStar, SunMedium, LogOut } from "lucide-react";
import { useAppContext } from "../../components/app-provider";

export default function StudentDashboardLayout({ children }) {
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

    if (auth.role !== "student") {
      router.replace(auth.landingPath || "/login");
    }
  }, [auth, isReady, router]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="app-shell p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="surface-card theme-transition flex items-center justify-between rounded-[28px] p-6">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-[var(--accent)]">Student Area</p>
            <h1 className="mt-2 text-3xl font-semibold">{auth?.user?.name || "Student"}</h1>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              className="surface-soft rounded-2xl p-3"
            >
              {theme === "dark" ? <SunMedium size={18} /> : <MoonStar size={18} />}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-2xl bg-red-500 px-4 py-3 text-white"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

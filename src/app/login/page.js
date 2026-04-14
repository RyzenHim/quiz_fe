"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MoonStar, SunMedium } from "lucide-react";
import { useAppContext } from "../../components/app-provider";
import api from "../../lib/api";

export default function Login() {
  const [data, setData] = useState({
    identifier: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { auth, login, isReady, theme, toggleTheme } = useAppContext();

  useEffect(() => {
    if (isReady && auth?.landingPath) {
      router.replace(auth.landingPath);
    }
  }, [auth, isReady, router]);

  const handleChange = (event) => {
    setData((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await api.post("/auth/login", data);
      login(response.data);
      router.push(response.data.landingPath);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell flex min-h-screen items-center justify-center px-4 py-12">
      <div className="absolute right-6 top-6">
        <button
          type="button"
          onClick={toggleTheme}
          className="surface-soft theme-transition rounded-full p-3"
        >
          {theme === "dark" ? <SunMedium size={18} /> : <MoonStar size={18} />}
        </button>
      </div>

      <div className="grid w-full max-w-6xl gap-8 lg:grid-cols-[1.2fr_0.9fr]">
        <section className="theme-transition hidden rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,#0f766e_0%,#0b132b_58%,#111827_100%)] p-10 text-white shadow-2xl lg:block">
          <p className="mb-4 text-sm uppercase tracking-[0.28em] text-emerald-200/80">
            Quiz Command Center
          </p>
          <h1 className="max-w-xl text-5xl font-semibold leading-tight">
            One workspace for teachers, students, skills, quizzes, and results.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-slate-200">
            Sign in with your teacher email or your student email or enrollment number.
            Your dashboard and theme preference will be restored automatically.
          </p>
        </section>

        <section className="surface-card theme-transition rounded-[32px] p-8 md:p-10">
          <div className="mb-8">
            <p className="text-sm uppercase tracking-[0.28em] text-[var(--accent)]">
              Welcome Back
            </p>
            <h2 className="mt-3 text-3xl font-semibold">Login to Quiz App</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Teachers and students both use this screen.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium">Email or Enrollment Number</label>
              <input
                type="text"
                name="identifier"
                value={data.identifier}
                onChange={handleChange}
                required
                className="theme-transition w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 outline-none focus:border-[var(--accent)]"
                placeholder="teacher@mail.com or ENR-001"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Password</label>
              <input
                type="password"
                name="password"
                value={data.password}
                onChange={handleChange}
                required
                className="theme-transition w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 outline-none focus:border-[var(--accent)]"
                placeholder="Enter your password"
              />
            </div>

            {error ? (
              <p className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-[var(--accent)] px-4 py-3 font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Login"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MoonStar, SunMedium } from "lucide-react";
import { useAppContext } from "../../components/app-provider";
import api from "../../lib/api";
import { ButtonLoader } from "../../components/loaders";

export default function Login() {
  const [mode, setMode] = useState("login");
  const [data, setData] = useState({
    identifier: "",
    password: "",
  });
  const [resetData, setResetData] = useState({
    identifier: "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
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

  const handleResetChange = (event) => {
    setResetData((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

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

  const handleRequestOtp = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await api.post("/auth/forgot-password/request-otp", {
        identifier: resetData.identifier,
      });

      setSuccess(response.data.message || "OTP sent successfully.");
      setMode("reset");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await api.post("/auth/forgot-password/reset", resetData);
      login(response.data);
      router.push(response.data.landingPath);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to reset password");
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
              {mode === "login" ? "Welcome Back" : "Password Recovery"}
            </p>
            <h2 className="mt-3 text-3xl font-semibold">
              {mode === "login" ? "Login to Quiz App" : "Reset your password with OTP"}
            </h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              {mode === "login"
                ? "Teachers and students both use this screen."
                : "Enter the OTP from your email, then choose a new password and confirm it."}
            </p>
          </div>

          {mode === "login" ? (
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
                {loading ? <ButtonLoader label="Signing in..." /> : "Login"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode("requestOtp");
                  setError("");
                  setSuccess("");
                  setResetData((current) => ({
                    ...current,
                    identifier: data.identifier,
                  }));
                }}
                className="w-full rounded-2xl border border-[var(--border)] px-4 py-3 text-sm font-medium"
              >
                Forgot password?
              </button>
            </form>
          ) : null}

          {mode === "requestOtp" ? (
            <form onSubmit={handleRequestOtp} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium">Email or Enrollment Number</label>
                <input
                  type="text"
                  name="identifier"
                  value={resetData.identifier}
                  onChange={handleResetChange}
                  required
                  className="theme-transition w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 outline-none focus:border-[var(--accent)]"
                  placeholder="teacher@mail.com or ENR-001"
                />
              </div>

              {error ? (
                <p className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">
                  {error}
                </p>
              ) : null}

              {success ? (
                <p className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600">
                  {success}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-[var(--accent)] px-4 py-3 font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:opacity-60"
              >
                {loading ? <ButtonLoader label="Sending OTP..." /> : "Send OTP"}
              </button>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setError("");
                    setSuccess("");
                  }}
                  className="flex-1 rounded-2xl border border-[var(--border)] px-4 py-3 text-sm font-medium"
                >
                  Back to login
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("reset");
                    setError("");
                    setSuccess("");
                  }}
                  className="flex-1 rounded-2xl border border-[var(--border)] px-4 py-3 text-sm font-medium"
                >
                  Already have OTP
                </button>
              </div>
            </form>
          ) : null}

          {mode === "reset" ? (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium">Email or Enrollment Number</label>
                <input
                  type="text"
                  name="identifier"
                  value={resetData.identifier}
                  onChange={handleResetChange}
                  required
                  className="theme-transition w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 outline-none focus:border-[var(--accent)]"
                  placeholder="teacher@mail.com or ENR-001"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">OTP</label>
                <input
                  type="text"
                  name="otp"
                  value={resetData.otp}
                  onChange={handleResetChange}
                  required
                  maxLength={6}
                  className="theme-transition w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 outline-none focus:border-[var(--accent)]"
                  placeholder="Enter 6-digit OTP"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">New Password</label>
                <input
                  type="password"
                  name="newPassword"
                  value={resetData.newPassword}
                  onChange={handleResetChange}
                  required
                  className="theme-transition w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 outline-none focus:border-[var(--accent)]"
                  placeholder="Enter new password"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={resetData.confirmPassword}
                  onChange={handleResetChange}
                  required
                  className="theme-transition w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 outline-none focus:border-[var(--accent)]"
                  placeholder="Confirm new password"
                />
              </div>

              {error ? (
                <p className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">
                  {error}
                </p>
              ) : null}

              {success ? (
                <p className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600">
                  {success}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-[var(--accent)] px-4 py-3 font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:opacity-60"
              >
                {loading ? <ButtonLoader label="Resetting password..." /> : "Verify OTP and Login"}
              </button>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setMode("requestOtp");
                    setError("");
                    setSuccess("");
                  }}
                  className="flex-1 rounded-2xl border border-[var(--border)] px-4 py-3 text-sm font-medium"
                >
                  Resend OTP
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setError("");
                    setSuccess("");
                  }}
                  className="flex-1 rounded-2xl border border-[var(--border)] px-4 py-3 text-sm font-medium"
                >
                  Back to login
                </button>
              </div>
            </form>
          ) : null}
        </section>
      </div>
    </div>
  );
}

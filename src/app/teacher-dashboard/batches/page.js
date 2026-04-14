"use client";

import { useEffect, useState } from "react";
import { useAppContext } from "../../../components/app-provider";
import api from "../../../lib/api";

export default function BatchesPage() {
  const { auth } = useAppContext();
  const [batches, setBatches] = useState([]);
  const [courses, setCourses] = useState([]);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    batchName: "",
    batchCode: "",
    description: "",
    courses: [],
  });

  const token = auth?.token;
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const loadData = async () => {
    const [batchesRes, coursesRes] = await Promise.all([
      api.get("/batches", { headers }),
      api.get("/courses", { headers }),
    ]);
    setBatches(batchesRes.data.batches || []);
    setCourses(coursesRes.data.courses || []);
  };

  useEffect(() => {
    if (!token) {
      return;
    }

    const run = async () => {
      try {
        const effectHeaders = { Authorization: `Bearer ${token}` };
        const [batchesRes, coursesRes] = await Promise.all([
          api.get("/batches", { headers: effectHeaders }),
          api.get("/courses", { headers: effectHeaders }),
        ]);
        setBatches(batchesRes.data.batches || []);
        setCourses(coursesRes.data.courses || []);
      } catch {
        console.error("Unable to load batches.");
      }
    };

    run();
  }, [token]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    try {
      await api.post("/batches", form, { headers });
      setForm({ batchName: "", batchCode: "", description: "", courses: [] });
      setMessage("Batch created successfully.");
      await loadData();
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to create batch.");
    }
  };

  const handleDelete = async (batchId) => {
    await api.delete(`/batches/soft-delete/${batchId}`, { headers });
    await loadData();
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <section className="surface-card rounded-[24px] p-6">
        <h1 className="text-3xl font-semibold">Batches</h1>
        <div className="mt-6 space-y-4">
          {batches.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No batches yet.</p>
          ) : (
            batches.map((batch) => (
              <div key={batch._id} className="surface-soft rounded-[20px] p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold">{batch.batchName}</h3>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      Courses: {(batch.courses || []).map((course) => course.title).join(", ") || "None"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(batch._id)}
                    className="rounded-xl bg-red-500 px-3 py-2 text-sm text-white"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="surface-card rounded-[24px] p-6">
        <h2 className="text-2xl font-semibold">Add batch</h2>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <FormInput label="Batch Name" value={form.batchName} onChange={(value) => setForm({ ...form, batchName: value })} />
          <FormInput label="Batch Code" value={form.batchCode} onChange={(value) => setForm({ ...form, batchCode: value })} />
          <FormInput label="Description" value={form.description} onChange={(value) => setForm({ ...form, description: value })} />
          <div>
            <label className="mb-2 block text-sm font-medium">Courses</label>
            <select
              multiple
              value={form.courses}
              onChange={(event) =>
                setForm({
                  ...form,
                  courses: Array.from(event.target.selectedOptions, (option) => option.value),
                })
              }
              className="min-h-36 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3"
            >
              {courses.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>
          {message ? <p className="text-sm text-[var(--muted)]">{message}</p> : null}
          <button type="submit" className="w-full rounded-2xl bg-[var(--accent)] px-4 py-3 font-semibold text-white">
            Save batch
          </button>
        </form>
      </section>
    </div>
  );
}

function FormInput({ label, value, onChange }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium">{label}</label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3"
      />
    </div>
  );
}

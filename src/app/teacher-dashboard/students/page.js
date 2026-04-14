"use client";

import { useEffect, useState } from "react";
import { useAppContext } from "../../../components/app-provider";
import api from "../../../lib/api";

export default function StudentsPage() {
  const { auth } = useAppContext();
  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    batch: "",
    enrollmentNumber: "",
    phone: "",
    guardianName: "",
    guardianPhone: "",
    address: "",
  });

  const token = auth?.token;
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const loadData = async () => {
    const [studentsRes, batchesRes] = await Promise.all([
      api.get("/students", { headers }),
      api.get("/batches", { headers }),
    ]);

    setStudents(studentsRes.data.students || []);
    setBatches(batchesRes.data.batches || []);
  };

  useEffect(() => {
    if (!token) {
      return;
    }

    const run = async () => {
      try {
        const effectHeaders = { Authorization: `Bearer ${token}` };
        const [studentsRes, batchesRes] = await Promise.all([
          api.get("/students", { headers: effectHeaders }),
          api.get("/batches", { headers: effectHeaders }),
        ]);

        setStudents(studentsRes.data.students || []);
        setBatches(batchesRes.data.batches || []);
      } catch {
        console.error("Unable to load students right now.");
      }
    };

    run();
  }, [token]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");

    try {
      await api.post("/students", form, { headers });
      setForm({
        name: "",
        email: "",
        password: "",
        batch: "",
        enrollmentNumber: "",
        phone: "",
        guardianName: "",
        guardianPhone: "",
        address: "",
      });
      setMessage("Student created successfully.");
      await loadData();
    } catch (error) {
      setMessage(error.response?.data?.message || "Student creation failed.");
    }
  };

  const handleDelete = async (studentId) => {
    try {
      await api.delete(`/students/soft-delete/${studentId}`, { headers });
      await loadData();
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to delete student.");
    }
  };

  const filteredStudents = students.filter((student) =>
    `${student.name} ${student.email}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <section className="space-y-4">
        <div className="surface-card rounded-[24px] p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-semibold">Students</h1>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Create students and automatically align them with a batch.
              </p>
            </div>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name or email"
              className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 md:max-w-sm"
            />
          </div>
        </div>

        <div className="surface-card overflow-hidden rounded-[24px]">
          <table className="w-full text-left">
            <thead className="border-b border-[var(--border)]">
              <tr className="text-sm text-[var(--muted)]">
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Batch</th>
                <th className="px-6 py-4">Enrollment</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
                <tr key={student._id} className="border-b border-[var(--border)] last:border-b-0">
                  <td className="px-6 py-4">{student.name}</td>
                  <td className="px-6 py-4">{student.email}</td>
                  <td className="px-6 py-4">{student.batch?.batchName || "-"}</td>
                  <td className="px-6 py-4">{student.enrollmentNumber}</td>
                  <td className="px-6 py-4">
                    <button
                      type="button"
                      onClick={() => handleDelete(student._id)}
                      className="rounded-xl bg-red-500 px-3 py-2 text-sm text-white"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {filteredStudents.length === 0 ? (
                <tr>
                  <td className="px-6 py-8 text-sm text-[var(--muted)]" colSpan={5}>
                    No students found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="surface-card rounded-[24px] p-6">
        <h2 className="text-2xl font-semibold">Add student</h2>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <FormInput label="Name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
          <FormInput label="Email" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} />
          <FormInput label="Password" type="password" value={form.password} onChange={(value) => setForm({ ...form, password: value })} />
          <FormInput label="Enrollment Number" value={form.enrollmentNumber} onChange={(value) => setForm({ ...form, enrollmentNumber: value })} />
          <FormInput label="Phone" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} />
          <FormInput label="Guardian Name" value={form.guardianName} onChange={(value) => setForm({ ...form, guardianName: value })} />
          <FormInput label="Guardian Phone" value={form.guardianPhone} onChange={(value) => setForm({ ...form, guardianPhone: value })} />
          <FormInput label="Address" value={form.address} onChange={(value) => setForm({ ...form, address: value })} />

          <div>
            <label className="mb-2 block text-sm font-medium">Batch</label>
            <select
              value={form.batch}
              onChange={(event) => setForm({ ...form, batch: event.target.value })}
              className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3"
              required
            >
              <option value="">Select a batch</option>
              {batches.map((batch) => (
                <option key={batch._id} value={batch._id}>
                  {batch.batchName}
                </option>
              ))}
            </select>
          </div>

          {message ? <p className="text-sm text-[var(--muted)]">{message}</p> : null}

          <button
            type="submit"
            className="w-full rounded-2xl bg-[var(--accent)] px-4 py-3 font-semibold text-white"
          >
            Save student
          </button>
        </form>
      </section>
    </div>
  );
}

function FormInput({ label, value, onChange, type = "text" }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3"
      />
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useAppContext } from "../../../components/app-provider";
import api from "../../../lib/api";

export default function CoursesPage() {
  const { auth } = useAppContext();
  const [courses, setCourses] = useState([]);
  const [skills, setSkills] = useState([]);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    title: "",
    code: "",
    category: "",
    level: "beginner",
    durationInWeeks: "",
    skills: [],
  });

  const token = auth?.token;
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const loadData = async () => {
    const [coursesRes, skillsRes] = await Promise.all([
      api.get("/courses", { headers }),
      api.get("/skills", { headers }),
    ]);
    setCourses(coursesRes.data.courses || []);
    setSkills(skillsRes.data.skills || []);
  };

  useEffect(() => {
    if (!token) {
      return;
    }

    const run = async () => {
      try {
        const effectHeaders = { Authorization: `Bearer ${token}` };
        const [coursesRes, skillsRes] = await Promise.all([
          api.get("/courses", { headers: effectHeaders }),
          api.get("/skills", { headers: effectHeaders }),
        ]);
        setCourses(coursesRes.data.courses || []);
        setSkills(skillsRes.data.skills || []);
      } catch {
        console.error("Unable to load courses.");
      }
    };

    run();
  }, [token]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    try {
      await api.post(
        "/courses",
        {
          ...form,
          durationInWeeks: form.durationInWeeks ? Number(form.durationInWeeks) : undefined,
          status: "active",
        },
        { headers }
      );
      setForm({
        title: "",
        code: "",
        category: "",
        level: "beginner",
        durationInWeeks: "",
        skills: [],
      });
      setMessage("Course created successfully.");
      await loadData();
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to create course.");
    }
  };

  const handleDelete = async (courseId) => {
    await api.delete(`/courses/soft-delete/${courseId}`, { headers });
    await loadData();
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <section className="surface-card rounded-[24px] p-6">
        <h1 className="text-3xl font-semibold">Courses</h1>
        <div className="mt-6 space-y-4">
          {courses.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No courses yet.</p>
          ) : (
            courses.map((course) => (
              <div key={course._id} className="surface-soft rounded-[20px] p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold">{course.title}</h3>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {course.category || "General"} | Skills: {(course.skills || []).map((skill) => skill.name).join(", ") || "None"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(course._id)}
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
        <h2 className="text-2xl font-semibold">Add course</h2>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <FormInput label="Title" value={form.title} onChange={(value) => setForm({ ...form, title: value })} />
          <FormInput label="Code" value={form.code} onChange={(value) => setForm({ ...form, code: value })} />
          <FormInput label="Category" value={form.category} onChange={(value) => setForm({ ...form, category: value })} />
          <FormInput label="Duration In Weeks" type="number" value={form.durationInWeeks} onChange={(value) => setForm({ ...form, durationInWeeks: value })} />
          <div>
            <label className="mb-2 block text-sm font-medium">Level</label>
            <select
              value={form.level}
              onChange={(event) => setForm({ ...form, level: event.target.value })}
              className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Skills</label>
            <select
              multiple
              value={form.skills}
              onChange={(event) =>
                setForm({
                  ...form,
                  skills: Array.from(event.target.selectedOptions, (option) => option.value),
                })
              }
              className="min-h-36 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3"
            >
              {skills.map((skill) => (
                <option key={skill._id} value={skill._id}>
                  {skill.name}
                </option>
              ))}
            </select>
          </div>
          {message ? <p className="text-sm text-[var(--muted)]">{message}</p> : null}
          <button type="submit" className="w-full rounded-2xl bg-[var(--accent)] px-4 py-3 font-semibold text-white">
            Save course
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

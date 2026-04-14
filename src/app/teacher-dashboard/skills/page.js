"use client";

import { useEffect, useState } from "react";
import { useAppContext } from "../../../components/app-provider";
import api from "../../../lib/api";

export default function SkillsPage() {
  const { auth } = useAppContext();
  const [skills, setSkills] = useState([]);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    name: "",
    description: "",
    topicsText: "",
  });

  const token = auth?.token;
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const loadData = async () => {
    const response = await api.get("/skills", { headers });
    setSkills(response.data.skills || []);
  };

  useEffect(() => {
    if (!token) {
      return;
    }

    const run = async () => {
      try {
        const effectHeaders = { Authorization: `Bearer ${token}` };
        const response = await api.get("/skills", { headers: effectHeaders });
        setSkills(response.data.skills || []);
      } catch {
        console.error("Unable to load skills.");
      }
    };

    run();
  }, [token]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    try {
      const topics = form.topicsText
        .split(",")
        .map((topic) => topic.trim())
        .filter(Boolean)
        .map((title) => ({ title }));

      await api.post(
        "/skills",
        {
          name: form.name,
          description: form.description,
          topics,
        },
        { headers }
      );

      setForm({
        name: "",
        description: "",
        topicsText: "",
      });
      setMessage("Skill created successfully.");
      await loadData();
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to create skill.");
    }
  };

  const handleDelete = async (skillId) => {
    await api.delete(`/skills/${skillId}`, { headers });
    await loadData();
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <section className="surface-card rounded-[24px] p-6">
        <h1 className="text-3xl font-semibold">Skills</h1>
        <div className="mt-6 space-y-4">
          {skills.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No skills yet.</p>
          ) : (
            skills.map((skill) => (
              <div key={skill._id} className="surface-soft rounded-[20px] p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold">{skill.name}</h3>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      Topics: {(skill.topics || []).map((topic) => topic.title).join(", ") || "None"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(skill._id)}
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
        <h2 className="text-2xl font-semibold">Add skill</h2>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <FormInput label="Skill Name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
          <FormInput label="Description" value={form.description} onChange={(value) => setForm({ ...form, description: value })} />
          <FormInput label="Topics (comma separated)" value={form.topicsText} onChange={(value) => setForm({ ...form, topicsText: value })} />
          {message ? <p className="text-sm text-[var(--muted)]">{message}</p> : null}
          <button type="submit" className="w-full rounded-2xl bg-[var(--accent)] px-4 py-3 font-semibold text-white">
            Save skill
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

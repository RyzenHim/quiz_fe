"use client";

import { useState } from "react";

export default function Students() {
  const [students, setStudents] = useState([]);
  const [showDrawer, setShowDrawer] = useState(false);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    course: "",
    batch: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const newStudent = {
      ...form,
      id: Date.now(),
      scores: Array.from({ length: 10 }, () =>
        Math.floor(Math.random() * 100)
      ),
    };

    setStudents([newStudent, ...students]);
    setShowDrawer(false);

    setForm({
      name: "",
      email: "",
      phone: "",
      course: "",
      batch: "",
    });
  };

  const handleDelete = (id) => {
    setStudents(students.filter((s) => s.id !== id));
  };

  const filtered = students.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Top Bar */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          Students 👨‍🎓
        </h1>

        <button
          onClick={() => setShowDrawer(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg shadow"
        >
          + Add Student
        </button>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search student..."
        className="mb-4 w-full border px-3 py-2 rounded-lg"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Table */}
      <div className="bg-white rounded-xl shadow p-4">
        {students.length === 0 ? (
          <p className="text-center text-gray-500 py-10">
            No students added yet 🚀
          </p>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b">
                <th>Name</th>
                <th>Email</th>
                <th>Course</th>
                <th>Batch</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-b">
                  <td>{s.name}</td>
                  <td>{s.email}</td>
                  <td>{s.course}</td>
                  <td>{s.batch}</td>

                  <td className="space-x-2">
                    <button className="bg-yellow-400 px-2 py-1 rounded">
                      Edit
                    </button>

                    <button
                      onClick={() => handleDelete(s.id)}
                      className="bg-red-500 text-white px-2 py-1 rounded"
                    >
                      Delete
                    </button>

                    <button
                      onClick={() =>
                        alert("Last 10 Scores: " + s.scores.join(", "))
                      }
                      className="bg-green-500 text-white px-2 py-1 rounded"
                    >
                      Scores
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* SIDE DRAWER */}
      {showDrawer && (
  <>
    {/* Overlay */}
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm  z-40"
      onClick={() => setShowDrawer(false)}
    />

    {/* Drawer */}
    <div className="fixed top-0 right-0 w-[420px] h-full bg-white p-6 border-l z-50 overflow-y-auto shadow-2xl">
      
      <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
        Add Student 👨‍🎓
      </h2>

      <div className="space-y-4">
        
        <Input label="Name" value={form.name} onChange={(v) => setForm({...form, name: v})} />
        
        <Input label="Email" value={form.email} onChange={(v) => setForm({...form, email: v})} />
        
        <Input label="Phone" value={form.phone} onChange={(v) => setForm({...form, phone: v})} />

        <Input label="Course" value={form.course} onChange={(v) => setForm({...form, course: v})} />

        <Input label="Batch" value={form.batch} onChange={(v) => setForm({...form, batch: v})} />

      </div>

      {/* Buttons */}
      <div className="flex gap-3 mt-6">
  <button
    onClick={handleSubmit}
    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow"
  >
    Save
  </button>

  <button
    onClick={() => setShowDrawer(false)}
    className="flex-1 py-3 border rounded-xl bg-gray-700 hover:bg-gray-800"
  >
    Cancel
  </button>
</div>
    </div>
  </>
)}
    </div>
  );
}

function Input({ label, value, onChange, type = "text" }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1 text-gray-600">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border px-4 py-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition"
      />
    </div>
  );
}
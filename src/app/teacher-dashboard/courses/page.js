"use client";

import { useState } from "react";

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [showDrawer, setShowDrawer] = useState(false);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    name: "",
    duration: "",
    fees: "",
  });

  // handle change
  const handleChange = (key, value) => {
    setForm({ ...form, [key]: value });
  };

  // add course
  const handleSubmit = (e) => {
    e.preventDefault();

    const newCourse = {
      ...form,
      id: Date.now(),
    };

    setCourses([newCourse, ...courses]);
    setShowDrawer(false);

    setForm({
      name: "",
      duration: "",
      fees: "",
    });
  };

  // delete
  const handleDelete = (id) => {
    setCourses(courses.filter((c) => c.id !== id));
  };

  // search
  const filtered = courses.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Top */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Courses 📚</h1>

        <button
          onClick={() => setShowDrawer(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg shadow"
        >
          + Add Course
        </button>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search course..."
        className="mb-4 w-full border px-3 py-2 rounded-lg"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Table */}
      <div className="bg-white rounded-xl shadow p-4">
        {courses.length === 0 ? (
          <p className="text-center text-gray-500 py-10">
            No courses added yet 🚀
          </p>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b">
                <th>Name</th>
                <th>Duration</th>
                <th>Fees</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b">
                  <td>{c.name}</td>
                  <td>{c.duration}</td>
                  <td>₹{c.fees}</td>

                  <td className="space-x-2">
                    <button className="bg-yellow-400 px-2 py-1 rounded">
                      Edit
                    </button>

                    <button
                      onClick={() => handleDelete(c.id)}
                      className="bg-red-500 text-white px-2 py-1 rounded"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* DRAWER */}
      {showDrawer && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={() => setShowDrawer(false)}
          />

          {/* Drawer */}
          <div className="fixed top-0 right-0 w-[420px] h-full bg-white p-6 border-l z-50 overflow-y-auto shadow-2xl">
            
            <h2 className="text-2xl font-bold mb-6 text-gray-800">
              Add Course 📚
            </h2>

            <div className="space-y-4">
              <Input
                label="Course Name"
                value={form.name}
                onChange={(v) => handleChange("name", v)}
              />

              <Input
                label="Duration"
                value={form.duration}
                onChange={(v) => handleChange("duration", v)}
              />

              <Input
                label="Fees"
                type="number"
                value={form.fees}
                onChange={(v) => handleChange("fees", v)}
              />
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

/* INPUT COMPONENT */
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
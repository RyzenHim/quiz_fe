"use client";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      
      <h1 className="text-3xl font-bold mb-6">
        Teacher Dashboard 🎓
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="bg-white p-5 rounded-xl shadow">
          <h2 className="text-xl font-semibold">Total Students</h2>
          <p className="text-2xl mt-2">120</p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow">
          <h2 className="text-xl font-semibold">Total Quizzes</h2>
          <p className="text-2xl mt-2">25</p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow">
          <h2 className="text-xl font-semibold">Results</h2>
          <p className="text-2xl mt-2">View Reports</p>
        </div>

      </div>
    </div>
  );
}
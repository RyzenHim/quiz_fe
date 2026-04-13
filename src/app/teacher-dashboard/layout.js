"use client";

import Link from "next/link";

export default function DashboardLayout({ children }) {
  return (
    <div className="flex min-h-screen">
      
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white p-5">
        <h2 className="text-2xl font-bold mb-8">Teacher Panel</h2>

        <ul className="space-y-4">
          <li>
            <Link href="/teacher-dashboard">Dashboard</Link>
          </li>
          <li>
            <Link href="/teacher-dashboard/students">Students</Link>
          </li>
          <li>
            <Link href="/teacher-dashboard/quizzes">Quizzes</Link>
          </li>
          <li>
            <Link href="/teacher-dashboard/results">Results</Link>
          </li>
        </ul>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 bg-gray-100">
        {children}
      </div>
    </div>
  );
}
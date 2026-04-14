"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Users, BookOpen, Layers, Code, LogOut } from "lucide-react";

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  const menu = [
    { name: "Students", path: "/teacher-dashboard/students", icon: Users },
    { name: "Courses", path: "/teacher-dashboard/courses", icon: BookOpen },
    { name: "Batches", path: "/teacher-dashboard/batches", icon: Layers },
    { name: "Skills", path: "/teacher-dashboard/skills", icon: Code },
  ];

  //  Logout function
  const handleLogout = () => {
    // future me yaha token remove karenge
    // localStorage.removeItem("token");

    router.push("/login");
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      
      {/* Sidebar */}
      <div className="w-64 bg-gradient-to-b from-gray-900 to-gray-800 text-white p-6 flex flex-col justify-between">
        
        {/* Top */}
        <div>
          <h2 className="text-2xl font-bold mb-10">Teacher Panel 🎓</h2>

          <ul className="space-y-4">
            {menu.map((item) => {
              const Icon = item.icon;

              return (
                <li key={item.path}>
                  <Link
                    href={item.path}
                    className={`flex items-center gap-3 px-4 py-2 rounded-lg transition ${
                      pathname === item.path
                        ? "bg-blue-500"
                        : "hover:bg-gray-700"
                    }`}
                  >
                    <Icon size={20} />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/*Logout Button Bottom */}
        <div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 transition"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>

      </div>

      {/* Content */}
      <div className="flex-1 p-8">{children}</div>
    </div>
  );
}
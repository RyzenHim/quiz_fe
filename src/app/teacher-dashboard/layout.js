"use client";

import { DashboardLayout } from "../../components/dashboard-layout";

export default function TeacherDashboardLayout({ children }) {
  return <DashboardLayout role="teacher">{children}</DashboardLayout>;
}

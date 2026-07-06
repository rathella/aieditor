"use client";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { Hero } from "@/components/dashboard/hero";
import { RecentArticles } from "@/components/dashboard/recent-articles";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <Hero />
      <RecentArticles />
    </ProtectedRoute>
  );
}

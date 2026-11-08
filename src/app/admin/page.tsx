import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isAdminEnabled, isAdminSession } from "@/lib/admin/auth";
import { listAdminBlogs } from "@/lib/admin/blog-admin";
import { readContentDoc } from "@/lib/admin/content-docs";
import { getStoreMode } from "@/lib/admin/content-store";
import { AdminDashboard } from "./admin-dashboard";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  // Without ADMIN_PASSWORD the route doesn't exist at all.
  if (!isAdminEnabled()) notFound();

  if (!(await isAdminSession())) {
    return <LoginForm />;
  }

  const [books, about, work, blogs] = await Promise.all([
    readContentDoc("books"),
    readContentDoc("about"),
    readContentDoc("work"),
    listAdminBlogs(),
  ]);

  return (
    <AdminDashboard
      mode={getStoreMode()}
      initial={{ books, about, work, blogs }}
    />
  );
}

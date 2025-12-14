import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth-helpers";

export default async function DashboardPage() {
  await requireAuth();
  redirect("/dashboard/admin");
}


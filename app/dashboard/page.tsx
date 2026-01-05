import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import { UserRole } from "@prisma/client";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/login");
  }

  // Redirect based on user role
  if (user.role === UserRole.ADMIN) {
    redirect("/dashboard/admin");
  } else if (user.role === UserRole.MANAGER) {
    redirect("/dashboard/manager");
  } else if (user.role === UserRole.STAFF) {
    redirect("/dashboard/staff");
  } else {
    redirect("/dashboard/admin");
  }
}


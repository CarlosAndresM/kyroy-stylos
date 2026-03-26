import { getUnifiedExpenses } from "@/features/gastos/services";
import { ExpenseClient } from "@/features/gastos/expense-client";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { decrypt } from "@/lib/jwt-utils";

export default async function GastosPage() {
  const cookieStore = await cookies();
  const sessionUser = cookieStore.get("session_user");
  
  if (!sessionUser) {
    redirect("/auth/login");
  }

  const user = await decrypt(sessionUser.value);
  const sucursalId = user?.role === "ADMINISTRADOR_PUNTO" ? user?.branchId : undefined;
  
  const expensesRes = await getUnifiedExpenses(sucursalId);

  return (
    <div className="p-4 md:p-8">
      <ExpenseClient 
        initialData={expensesRes.success ? expensesRes.data || [] : []} 
        user={user}
      />
    </div>
  );
}

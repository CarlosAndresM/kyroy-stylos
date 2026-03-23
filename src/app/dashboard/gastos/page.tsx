import { getUnifiedExpenses } from "@/features/gastos/services";
import { ExpenseClient } from "@/features/gastos/expense-client";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function GastosPage() {
  const [expensesRes, cookieStore] = await Promise.all([
    getUnifiedExpenses(),
    cookies()
  ]);

  const sessionUser = cookieStore.get("session_user");
  if (!sessionUser) {
    redirect("/auth/login");
  }

  const user = JSON.parse(sessionUser.value);

  return (
    <div className="p-4 md:p-8">
      <ExpenseClient 
        initialData={expensesRes.success ? expensesRes.data || [] : []} 
        user={user}
      />
    </div>
  );
}

import { NextRequest, NextResponse } from "next/server";
import { getUnifiedExpenses, createExpense } from "@/features/gastos/services";

export async function GET() {
  const result = await getUnifiedExpenses();
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await createExpense(body);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ success: false, error: "Error en la petición" }, { status: 400 });
  }
}

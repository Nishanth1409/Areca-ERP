import { NextResponse } from "next/server";
import { db } from "@/lib/firestore-admin";
import { requireSession } from "@/lib/permissions";

export async function GET() {
  const { error } = await requireSession();
  if (error) return error;

  const snap = await db.collection("transactions").get();
  const transactions = snap.docs.map((doc) => doc.data() as Record<string, unknown>);
  const income = transactions
    .filter((item) => item.type === "INCOME")
    .reduce((sum, item) => sum + Number(item.amount), 0);
  const expense = transactions
    .filter((item) => item.type === "EXPENSE")
    .reduce((sum, item) => sum + Number(item.amount), 0);
  const profit = income - expense;

  let message = "Stable operating performance.";
  if (profit < 0) message = "Loss trend detected. Reduce discretionary expenses.";
  if (profit > 100000) message = "Strong profit trend. Consider reinvestment planning.";

  return NextResponse.json({ income, expense, profit, message });
}

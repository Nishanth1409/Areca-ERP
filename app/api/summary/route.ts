import { NextResponse } from "next/server";
import { db } from "@/lib/firestore-admin";
import { requireSession } from "@/lib/permissions";

export async function GET() {
  const { session, error } = await requireSession();
  if (error) return error;

  if (session.role === "USER") {
    const userSnap = await db.collection("users").doc(session.sub).get();
    const employeeId = userSnap.exists
      ? String((userSnap.data() as Record<string, unknown>).employeeId ?? "")
      : "";
    const employee = employeeId
      ? await db.collection("employees").doc(employeeId).get()
      : null;
    const loanSnap = employeeId
      ? await db.collection("loans").where("employeeId", "==", employeeId).where("status", "==", "ACTIVE").get()
      : null;

    return NextResponse.json({
      employees: employee?.exists ? 1 : 0,
      activeLoans: loanSnap?.size ?? 0,
      income: 0,
      expense: 0,
      profit: 0,
    });
  }

  const [employeesSnap, activeLoansSnap, transactionsSnap] = await Promise.all([
    db.collection("employees").get(),
    db.collection("loans").where("status", "==", "ACTIVE").get(),
    db.collection("transactions").get(),
  ]);
  const transactions = transactionsSnap.docs.map((doc) => doc.data() as Record<string, unknown>);

  const income = transactions
    .filter((item) => item.type === "INCOME")
    .reduce((sum, item) => sum + Number(item.amount), 0);
  const expense = transactions
    .filter((item) => item.type === "EXPENSE")
    .reduce((sum, item) => sum + Number(item.amount), 0);

  return NextResponse.json({
    employees: employeesSnap.size,
    activeLoans: activeLoansSnap.size,
    income,
    expense,
    profit: income - expense,
  });
}

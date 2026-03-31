import { NextResponse } from "next/server";
import { db, nowIso } from "@/lib/firestore-admin";
import { loanSchema } from "@/lib/validation";
import { requireAdmin, requireSession } from "@/lib/permissions";

export async function GET(request: Request) {
  const { session, error } = await requireSession();
  if (error) return error;

  const url = new URL(request.url);
  const activeOnly = url.searchParams.get("active") === "true";
  const [loansSnap, employeesSnap, repaymentsSnap, userSnap] = await Promise.all([
    db.collection("loans").get(),
    db.collection("employees").get(),
    db.collection("repayments").get(),
    db.collection("users").doc(session.sub).get(),
  ]);
  const employeeMap = new Map(
    employeesSnap.docs.map((doc) => [doc.id, { id: doc.id, ...(doc.data() as Record<string, unknown>) }]),
  );
  const userEmployeeId =
    session.role === "USER" && userSnap.exists
      ? String((userSnap.data() as Record<string, unknown>).employeeId ?? "")
      : null;
  const repaymentsByLoan = new Map<string, Array<Record<string, unknown>>>();
  for (const row of repaymentsSnap.docs) {
    const repayment = ({ id: row.id, ...(row.data() as Record<string, unknown>) } as Record<
      string,
      unknown
    >) as Record<string, unknown> & { id: string };
    const loanId = String(repayment["loanId"] ?? "");
    const arr = repaymentsByLoan.get(loanId) ?? [];
    arr.push(repayment);
    repaymentsByLoan.set(loanId, arr);
  }

  const rows = loansSnap.docs
    .map(
      (doc) =>
        ({ id: doc.id, ...(doc.data() as Record<string, unknown>) }) as Record<
          string,
          unknown
        > & { id: string },
    )
    .filter((loan) => {
      if (session.role === "USER" && loan["employeeId"] !== userEmployeeId) return false;
      if (activeOnly && loan["status"] !== "ACTIVE") return false;
      return true;
    })
    .map((loan) => ({
      ...loan,
      employee: employeeMap.get(String(loan["employeeId"] ?? "")) ?? null,
      repayments: repaymentsByLoan.get(String(loan.id)) ?? [],
    }))
    .sort((a, b) =>
      String((b as Record<string, unknown>)["issuedOn"] ?? "").localeCompare(
        String((a as Record<string, unknown>)["issuedOn"] ?? ""),
      ),
    );

  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const parsed = loanSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const totalPayable =
    parsed.data.principal + (parsed.data.principal * parsed.data.interestRate) / 100;
  const now = nowIso();

  const loanRef = db.collection("loans").doc();
  await loanRef.set({
    employeeId: parsed.data.employeeId,
    principal: parsed.data.principal,
    interestRate: parsed.data.interestRate,
    totalPayable,
    remainingAmount: totalPayable,
    status: "ACTIVE",
    issuedOn: now,
    createdAt: now,
  });

  await db.collection("employees").doc(parsed.data.employeeId).set(
    {
      category: "WITH_LOAN",
      updatedAt: now,
    },
    { merge: true },
  );

  const txRef = db.collection("transactions").doc();
  await txRef.set({
    type: "EXPENSE",
    amount: parsed.data.principal,
    category: "LOAN_DISBURSEMENT",
    note: parsed.data.note ?? "Loan given to employee",
    happenedOn: now,
    createdAt: now,
  });

  return NextResponse.json({ id: loanRef.id }, { status: 201 });
}

import { NextResponse } from "next/server";
import { db, nowIso } from "@/lib/firestore-admin";
import { repaymentSchema } from "@/lib/validation";
import { requireAdmin } from "@/lib/permissions";

export async function POST(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const parsed = repaymentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const loanSnap = await db.collection("loans").doc(parsed.data.loanId).get();
  if (!loanSnap.exists) {
    return NextResponse.json({ error: "Loan not found" }, { status: 404 });
  }
  const loan = ({ id: loanSnap.id, ...(loanSnap.data() as Record<string, unknown>) } as Record<
    string,
    unknown
  >) as Record<string, unknown> & { id: string };

  const remaining = Math.max(Number(loan["remainingAmount"] ?? 0) - parsed.data.amountPaid, 0);
  const status = remaining <= 0 ? "CLOSED" : "ACTIVE";
  const now = nowIso();

  const repaymentRef = db.collection("repayments").doc();
  await repaymentRef.set({
    loanId: loan.id,
    employeeId: String(loan["employeeId"] ?? ""),
    amountPaid: parsed.data.amountPaid,
    paidOn: now,
    note: parsed.data.note ?? "",
    createdAt: now,
  });

  await db.collection("loans").doc(loan.id).set(
    {
      remainingAmount: remaining,
      status,
      updatedAt: now,
    },
    { merge: true },
  );

  const txRef = db.collection("transactions").doc();
  await txRef.set({
    type: "INCOME",
    amount: parsed.data.amountPaid,
    category: "LOAN_REPAYMENT",
    note: parsed.data.note ?? "Loan repayment received",
    happenedOn: now,
    createdAt: now,
  });

  if (status === "CLOSED") {
    await db.collection("employees").doc(String(loan["employeeId"])).set(
      {
        category: "WORKING",
        updatedAt: now,
      },
      { merge: true },
    );
  }

  return NextResponse.json({ id: repaymentRef.id }, { status: 201 });
}

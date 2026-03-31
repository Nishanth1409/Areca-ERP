import { NextResponse } from "next/server";
import { db } from "@/lib/firestore-admin";
import { requireSession } from "@/lib/permissions";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { id } = await context.params;
  const [employeeSnap, userSnap, attendanceSnap, loansSnap, repaymentsSnap] = await Promise.all([
    db.collection("employees").doc(id).get(),
    db.collection("users").doc(session.sub).get(),
    db.collection("attendance").where("employeeId", "==", id).get(),
    db.collection("loans").where("employeeId", "==", id).get(),
    db.collection("repayments").where("employeeId", "==", id).get(),
  ]);
  if (!employeeSnap.exists) {
    return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  }
  const employee = { id: employeeSnap.id, ...(employeeSnap.data() as Record<string, unknown>) };
  const user = userSnap.exists ? (userSnap.data() as Record<string, unknown>) : null;
  if (session.role === "USER" && user?.userType === "LOAN_BUYER") {
    return NextResponse.json({ error: "Loan buyer can access loans only." }, { status: 403 });
  }

  if (session.role === "USER" && String(user?.employeeId ?? "") !== id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const attendances = attendanceSnap.docs
    .map(
      (doc) =>
        ({ id: doc.id, ...(doc.data() as Record<string, unknown>) }) as Record<
          string,
          unknown
        > & { id: string },
    )
    .sort((a, b) =>
      String((b as Record<string, unknown>)["date"] ?? "").localeCompare(
        String((a as Record<string, unknown>)["date"] ?? ""),
      ),
    );
  const repayments = repaymentsSnap.docs
    .map(
      (doc) =>
        ({ id: doc.id, ...(doc.data() as Record<string, unknown>) }) as Record<
          string,
          unknown
        > & { id: string },
    )
    .sort((a, b) =>
      String((b as Record<string, unknown>)["paidOn"] ?? "").localeCompare(
        String((a as Record<string, unknown>)["paidOn"] ?? ""),
      ),
    );
  const loans = loansSnap.docs
    .map(
      (doc) =>
        ({ id: doc.id, ...(doc.data() as Record<string, unknown>) }) as Record<
          string,
          unknown
        > & { id: string },
    )
    .map((loan) => ({
      ...loan,
      repayments: repayments.filter((x) => x.loanId === loan.id),
    }));

  const presentRecords = attendances.filter((x) => x.status === "PRESENT");
  const totalWage = presentRecords.reduce((sum, item) => sum + Number(item.dailyWage ?? 0), 0);

  return NextResponse.json({
    ...employee,
    attendances,
    loans,
    totalWorkingDays: presentRecords.length,
    totalWage,
  });
}

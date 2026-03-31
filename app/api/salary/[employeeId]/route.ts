import { NextResponse } from "next/server";
import { db } from "@/lib/firestore-admin";
import { requireSession } from "@/lib/permissions";

export async function GET(_: Request, context: { params: Promise<{ employeeId: string }> }) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { employeeId } = await context.params;
  const [employeeSnap, userSnap, attendanceSnap] = await Promise.all([
    db.collection("employees").doc(employeeId).get(),
    db.collection("users").doc(session.sub).get(),
    db.collection("attendance").where("employeeId", "==", employeeId).where("status", "==", "PRESENT").get(),
  ]);
  if (!employeeSnap.exists) {
    return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  }
  const userEmployeeId =
    session.role === "USER" && userSnap.exists
      ? String((userSnap.data() as Record<string, unknown>).employeeId ?? "")
      : null;
  const userType =
    session.role === "USER" && userSnap.exists
      ? String((userSnap.data() as Record<string, unknown>).userType ?? "")
      : "";
  if (session.role === "USER" && userType === "LOAN_BUYER") {
    return NextResponse.json({ error: "Loan buyer can access loans only." }, { status: 403 });
  }
  if (session.role === "USER" && userEmployeeId !== employeeId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const attendances = attendanceSnap.docs.map((doc) => doc.data() as Record<string, unknown>);
  const totalSalary = attendances.reduce((sum, item) => sum + Number(item.dailyWage ?? 0), 0);

  return NextResponse.json({
    totalDays: attendances.length,
    totalSalary,
  });
}

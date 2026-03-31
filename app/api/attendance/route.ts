import { NextResponse } from "next/server";
import { db, nowIso } from "@/lib/firestore-admin";
import { attendanceSchema } from "@/lib/validation";
import { requireAdmin, requireSession } from "@/lib/permissions";

export async function GET(request: Request) {
  const { session, error } = await requireSession();
  if (error) return error;
  const url = new URL(request.url);
  const employeeId = url.searchParams.get("employeeId");
  const [rowsSnap, employeeSnap, userSnap] = await Promise.all([
    db.collection("attendance").get(),
    db.collection("employees").get(),
    db.collection("users").doc(session.sub).get(),
  ]);
  const employeeMap = new Map(
    employeeSnap.docs.map((doc) => [doc.id, { id: doc.id, ...(doc.data() as Record<string, unknown>) }]),
  );
  const userEmployeeId =
    session.role === "USER" && userSnap.exists
      ? String((userSnap.data() as Record<string, unknown>).employeeId ?? "")
      : null;
  const rows = rowsSnap.docs
    .map(
      (doc) =>
        ({ id: doc.id, ...(doc.data() as Record<string, unknown>) }) as Record<
          string,
          unknown
        > & { id: string },
    )
    .filter((row) => {
      if (session.role === "USER") return row.employeeId === userEmployeeId;
      if (employeeId) return row.employeeId === employeeId;
      return true;
    })
    .map((row) => ({ ...row, employee: employeeMap.get(String(row.employeeId ?? "")) ?? null }))
    .sort((a, b) =>
      String((b as Record<string, unknown>)["date"] ?? "").localeCompare(
        String((a as Record<string, unknown>)["date"] ?? ""),
      ),
    );
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const parsed = attendanceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const settingSnap = await db.collection("settings").doc("global").get();
  const setting = settingSnap.exists ? (settingSnap.data() as Record<string, unknown>) : null;
  const finalWage =
    parsed.data.wageType === "COMMON"
      ? Number(setting?.commonDailyWage ?? 500)
      : Number(parsed.data.customWage ?? 0);
  const now = nowIso();
  const duplicate = await db
    .collection("attendance")
    .where("employeeId", "==", parsed.data.employeeId)
    .where("date", "==", parsed.data.date)
    .limit(1)
    .get();
  if (!duplicate.empty) {
    return NextResponse.json({ error: "Attendance already exists for this date" }, { status: 409 });
  }

  const attendanceRef = db.collection("attendance").doc();
  await attendanceRef.set({
    employeeId: parsed.data.employeeId,
    date: parsed.data.date,
    status: parsed.data.status,
    wageType: parsed.data.wageType,
    dailyWage: finalWage,
    note: parsed.data.note ?? "",
    createdAt: now,
  });

  if (parsed.data.status === "PRESENT" && finalWage > 0) {
    const txRef = db.collection("transactions").doc();
    await txRef.set({
      type: "EXPENSE",
      amount: finalWage,
      category: "WAGE",
      note: `Wage paid for attendance ${parsed.data.employeeId}`,
      happenedOn: now,
      createdAt: now,
    });
  }

  return NextResponse.json({ id: attendanceRef.id }, { status: 201 });
}

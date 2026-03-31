import { NextResponse } from "next/server";
import { db, nowIso } from "@/lib/firestore-admin";
import { employeeSchema } from "@/lib/validation";
import { requireSession, requireAdmin } from "@/lib/permissions";

export async function GET(request: Request) {
  const { session, error } = await requireSession();
  if (error) return error;

  const url = new URL(request.url);
  const category = url.searchParams.get("category");
  const [usersSnap, employeesSnap, loansSnap, attendanceSnap] = await Promise.all([
    db.collection("users").where("__name__", "==", session.sub).limit(1).get(),
    db.collection("employees").get(),
    db.collection("loans").where("status", "==", "ACTIVE").get(),
    db.collection("attendance").get(),
  ]);

  const userDoc = usersSnap.empty ? null : (usersSnap.docs[0].data() as Record<string, unknown>);
  if (session.role === "USER" && userDoc?.userType === "LOAN_BUYER") {
    return NextResponse.json({ error: "Loan buyer can access loans only." }, { status: 403 });
  }
  const userEmployeeId = userDoc?.employeeId ? String(userDoc.employeeId) : null;
  const loansByEmployee = new Map<string, Array<Record<string, unknown>>>();
  for (const loanDoc of loansSnap.docs) {
    const loan = ({ id: loanDoc.id, ...(loanDoc.data() as Record<string, unknown>) } as Record<
      string,
      unknown
    >) as Record<string, unknown> & { id: string };
    const employeeId = String(loan["employeeId"] ?? "");
    const arr = loansByEmployee.get(employeeId) ?? [];
    arr.push(loan);
    loansByEmployee.set(employeeId, arr);
  }
  const attendanceByEmployee = new Map<string, Array<Record<string, unknown>>>();
  for (const row of attendanceSnap.docs) {
    const attendance = ({ id: row.id, ...(row.data() as Record<string, unknown>) } as Record<
      string,
      unknown
    >) as Record<string, unknown> & { id: string };
    const employeeId = String(attendance["employeeId"] ?? "");
    const arr = attendanceByEmployee.get(employeeId) ?? [];
    arr.push(attendance);
    attendanceByEmployee.set(employeeId, arr);
  }

  const employees = employeesSnap.docs
    .map(
      (doc) =>
        ({ id: doc.id, ...(doc.data() as Record<string, unknown>) }) as Record<
          string,
          unknown
        > & { id: string },
    )
    .filter((employee) => {
      if (session.role === "USER") return employee.id === userEmployeeId;
      if (category) return employee["category"] === category;
      return true;
    })
    .map((employee) => ({
      ...employee,
      loans: loansByEmployee.get(String(employee.id)) ?? [],
      attendances: (attendanceByEmployee.get(String(employee.id)) ?? [])
        .sort((a, b) =>
          String((b as Record<string, unknown>)["date"] ?? "").localeCompare(
            String((a as Record<string, unknown>)["date"] ?? ""),
          ),
        )
        .slice(0, 10),
    }))
    .sort((a, b) =>
      String((a as Record<string, unknown>)["fullName"] ?? "").localeCompare(
        String((b as Record<string, unknown>)["fullName"] ?? ""),
      ),
    );

  return NextResponse.json(employees);
}

export async function POST(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const parsed = employeeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const codeTaken = await db.collection("employees").where("code", "==", parsed.data.code).limit(1).get();
  if (!codeTaken.empty) {
    return NextResponse.json({ error: "Employee code already exists" }, { status: 409 });
  }
  const now = nowIso();
  const ref = db.collection("employees").doc();
  await ref.set({
    ...parsed.data,
    joinedOn: now,
    createdAt: now,
    updatedAt: now,
    userId: null,
  });

  return NextResponse.json({ id: ref.id }, { status: 201 });
}

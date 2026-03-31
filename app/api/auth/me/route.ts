import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/firestore-admin";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userSnap = await db.collection("users").doc(session.sub).get();
  if (!userSnap.exists) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = ({ id: userSnap.id, ...(userSnap.data() as Record<string, unknown>) } as Record<
    string,
    unknown
  >) as Record<string, unknown> & { id: string };
  const employeeId = user.employeeId ? String(user.employeeId) : null;
  const employeeSnap = employeeId
    ? await db.collection("employees").doc(employeeId).get()
    : null;
  const employee =
    employeeSnap && employeeSnap.exists
      ? { id: employeeSnap.id, ...(employeeSnap.data() as Record<string, unknown>) }
      : null;

  return NextResponse.json({
    id: user.id,
    name: user.name ?? "",
    role: user.role ?? "USER",
    userType: user.userType ?? null,
    phone: user.phone ?? null,
    email: user.email ?? null,
    employee,
  });
}

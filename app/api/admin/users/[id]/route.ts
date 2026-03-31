import { NextResponse } from "next/server";
import { db, nowIso } from "@/lib/firestore-admin";
import { requireAdmin } from "@/lib/permissions";

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  const { id } = await context.params;
  if (session.sub === id) {
    return NextResponse.json({ error: "You cannot delete your own account." }, { status: 400 });
  }

  const userRef = db.collection("users").doc(id);
  const userSnap = await userRef.get();
  if (!userSnap.exists) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const user = userSnap.data() as Record<string, unknown>;
  const employeeId = user.employeeId ? String(user.employeeId) : null;

  await userRef.delete();

  if (employeeId) {
    await db.collection("employees").doc(employeeId).set(
      {
        userId: null,
        updatedAt: nowIso(),
      },
      { merge: true },
    );
  }

  return NextResponse.json({ success: true });
}

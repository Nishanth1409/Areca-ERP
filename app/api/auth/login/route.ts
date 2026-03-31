import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/firestore-admin";
import { loginSchema } from "@/lib/validation";
import { setSessionCookie, signSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { identifier, password } = parsed.data;
    const byEmail = await db
      .collection("users")
      .where("email", "==", identifier)
      .limit(1)
      .get();
    const byPhone = await db
      .collection("users")
      .where("phone", "==", identifier)
      .limit(1)
      .get();
    const snap = !byEmail.empty ? byEmail.docs[0] : byPhone.docs[0];
    const user = snap
      ? (({ id: snap.id, ...(snap.data() as Record<string, unknown>) } as Record<
          string,
          unknown
        >) as Record<string, unknown> & { id: string })
      : null;

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const match = await bcrypt.compare(password, String(user.password ?? ""));
    if (!match) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = await signSession({
      sub: String(user.id),
      role: (user.role as "ADMIN" | "USER") ?? "USER",
    });
    await setSessionCookie(token);

    return NextResponse.json({
      id: user.id,
      name: user.name ?? "",
      role: user.role,
    });
  } catch (error) {
    const text = error instanceof Error ? error.message : "Login failed";
    const hint = text.includes("firestore.googleapis.com")
      ? "Cloud Firestore API is disabled. Enable it in Google Cloud Console, then retry."
      : text;
    return NextResponse.json({ error: hint }, { status: 500 });
  }
}

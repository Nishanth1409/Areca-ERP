import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db, nowIso } from "@/lib/firestore-admin";

export async function POST() {
  try {
    const existing = await db.collection("users").limit(1).get();
    if (!existing.empty) {
      return NextResponse.json({ error: "Bootstrap already completed" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash("@Nkr1409", 10);
    const adminRef = db.collection("users").doc();
    const now = nowIso();
    await adminRef.set({
      userCode: "ADM0001",
      name: "Nishanth KR",
      phone: "8310193757",
      email: "nishanthkr1409@gmail.com",
      password: passwordHash,
      role: "ADMIN",
      userType: null,
      employeeId: null,
      createdAt: now,
      updatedAt: now,
    });

    await db.collection("settings").doc("global").set({
      commonDailyWage: 500,
      companyName: "Areca Nut Business",
      currencySymbol: "INR",
      updatedAt: now,
    });

    return NextResponse.json({
      message: "Bootstrap success",
      admin: {
        email: "nishanthkr1409@gmail.com",
        phone: "8310193757",
        password: "@Nkr1409",
      },
    });
  } catch (error) {
    const text = error instanceof Error ? error.message : "Bootstrap failed";
    const hint = text.includes("firestore.googleapis.com")
      ? "Cloud Firestore API is disabled. Enable it in Google Cloud Console, then retry."
      : text;
    return NextResponse.json({ error: hint }, { status: 500 });
  }
}

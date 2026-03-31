import { NextResponse } from "next/server";
import { db, nowIso } from "@/lib/firestore-admin";
import { requireAdmin, requireSession } from "@/lib/permissions";
import { z } from "zod";

const schema = z.object({
  commonDailyWage: z.number().positive(),
  companyName: z.string().optional(),
  currencySymbol: z.string().optional(),
});

export async function GET() {
  const { error } = await requireSession();
  if (error) return error;
  const snap = await db.collection("settings").doc("global").get();
  return NextResponse.json(snap.exists ? { id: snap.id, ...snap.data() } : null);
}

export async function PATCH(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const payload = { ...parsed.data, updatedAt: nowIso() };
  await db.collection("settings").doc("global").set(payload, { merge: true });
  return NextResponse.json({ id: "global", ...payload });
}

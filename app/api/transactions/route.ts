import { NextResponse } from "next/server";
import { db, nowIso } from "@/lib/firestore-admin";
import { requireAdmin, requireSession } from "@/lib/permissions";
import { transactionSchema } from "@/lib/validation";

export async function GET() {
  const { session, error } = await requireSession();
  if (error) return error;

  if (session.role === "USER") {
    return NextResponse.json({ income: 0, expense: 0, transactions: [] });
  }

  const snap = await db.collection("transactions").get();
  const transactions = snap.docs
    .map(
      (doc) =>
        ({ id: doc.id, ...(doc.data() as Record<string, unknown>) }) as Record<
          string,
          unknown
        > & { id: string },
    )
    .sort((a, b) =>
      String((b as Record<string, unknown>)["happenedOn"] ?? "").localeCompare(
        String((a as Record<string, unknown>)["happenedOn"] ?? ""),
      ),
    )
    .slice(0, 100);

  const income = transactions
    .filter((x) => x.type === "INCOME")
    .reduce((sum, x) => sum + Number(x.amount), 0);
  const expense = transactions
    .filter((x) => x.type === "EXPENSE")
    .reduce((sum, x) => sum + Number(x.amount), 0);

  return NextResponse.json({
    income,
    expense,
    profit: income - expense,
    transactions,
  });
}

export async function POST(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const parsed = transactionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const now = nowIso();
  const ref = db.collection("transactions").doc();
  await ref.set({
    ...parsed.data,
    happenedOn: now,
    createdAt: now,
  });
  return NextResponse.json({ id: ref.id }, { status: 201 });
}

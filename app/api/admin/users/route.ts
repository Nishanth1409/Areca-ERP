import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db, nowIso } from "@/lib/firestore-admin";
import { requireAdmin } from "@/lib/permissions";
import { z } from "zod";

const createUserSchema = z
  .object({
    name: z.string().min(2),
    phone: z.string().min(8),
    email: z.string().email().optional().nullable(),
    password: z.string().min(6),
    role: z.enum(["ADMIN", "USER"]),
    userType: z.enum(["EMPLOYEE", "LOAN_BUYER"]).optional().nullable(),
  })
  .superRefine((value, ctx) => {
    if (value.role === "USER" && !value.userType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["userType"],
        message: "User type is required for USER role.",
      });
    }
  });

function makeUserCode(docs: Array<{ data: () => Record<string, unknown> }>, role: "ADMIN" | "USER") {
  const prefix = role === "ADMIN" ? "ADM" : "USR";
  let max = 0;
  for (const doc of docs) {
    const code = String((doc.data() as Record<string, unknown>).userCode ?? "");
    if (!code.startsWith(prefix)) continue;
    const n = Number(code.slice(3));
    if (Number.isFinite(n)) max = Math.max(max, n);
  }
  return `${prefix}${String(max + 1).padStart(4, "0")}`;
}

function makeEmployeeCode(docs: Array<{ data: () => Record<string, unknown> }>) {
  let max = 0;
  for (const doc of docs) {
    const code = String((doc.data() as Record<string, unknown>).code ?? "");
    if (!code.startsWith("EMP")) continue;
    const n = Number(code.slice(3));
    if (Number.isFinite(n)) max = Math.max(max, n);
  }
  return `EMP${String(max + 1).padStart(4, "0")}`;
}

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const [usersSnap, employeesSnap] = await Promise.all([
    db.collection("users").get(),
    db.collection("employees").get(),
  ]);
  const employeeMap = new Map(
    employeesSnap.docs.map((doc) => [doc.id, { id: doc.id, ...(doc.data() as Record<string, unknown>) }]),
  );
  const users = usersSnap.docs
    .map((doc) => {
      const user = { id: doc.id, ...(doc.data() as Record<string, unknown>) } as Record<
        string,
        unknown
      > & { id: string };
      const employeeId = user.employeeId ? String(user.employeeId) : null;
      return {
        ...user,
        employee: employeeId ? employeeMap.get(employeeId) ?? null : null,
      };
    })
    .sort((a, b) =>
      String((b as Record<string, unknown>)["createdAt"] ?? "").localeCompare(
        String((a as Record<string, unknown>)["createdAt"] ?? ""),
      ),
    );
  return NextResponse.json(users);
}

export async function POST(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const payload = parsed.data;
  const email = payload.email ? payload.email.trim() : null;
  const [usersSnap, employeesSnap, settingSnap] = await Promise.all([
    db.collection("users").get(),
    db.collection("employees").get(),
    db.collection("settings").doc("global").get(),
  ]);

  const [phoneTaken, emailTaken] = await Promise.all([
    db.collection("users").where("phone", "==", payload.phone).limit(1).get(),
    email ? db.collection("users").where("email", "==", email).limit(1).get() : Promise.resolve(null),
  ]);
  if (!phoneTaken.empty) {
    return NextResponse.json({ error: "Phone already exists" }, { status: 409 });
  }
  if (emailTaken && !emailTaken.empty) {
    return NextResponse.json({ error: "Email already exists" }, { status: 409 });
  }

  const password = await bcrypt.hash(payload.password, 10);
  const now = nowIso();
  const userCode = makeUserCode(usersSnap.docs, payload.role);
  const ref = db.collection("users").doc();
  let employeeId: string | null = null;

  if (payload.role === "USER") {
    const employeeRef = db.collection("employees").doc();
    employeeId = employeeRef.id;
    const commonDailyWage = Number(
      (settingSnap.exists ? (settingSnap.data() as Record<string, unknown>).commonDailyWage : 500) ?? 500,
    );
    await employeeRef.set({
      code: makeEmployeeCode(employeesSnap.docs),
      fullName: payload.name,
      phone: payload.phone,
      address: "",
      category: payload.userType === "LOAN_BUYER" ? "WITH_LOAN" : "WORKING",
      isActive: true,
      baseWage: payload.userType === "LOAN_BUYER" ? 0 : commonDailyWage,
      userId: ref.id,
      joinedOn: now,
      createdAt: now,
      updatedAt: now,
    });
  }

  await ref.set({
    userCode,
    name: payload.name,
    phone: payload.phone,
    email,
    role: payload.role,
    userType: payload.role === "USER" ? payload.userType : null,
    employeeId,
    password,
    createdAt: now,
    updatedAt: now,
  });

  return NextResponse.json({ id: ref.id, userCode }, { status: 201 });
}

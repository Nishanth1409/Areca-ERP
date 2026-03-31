import { z } from "zod";

export const loginSchema = z.object({
  identifier: z.string().min(3),
  password: z.string().min(6),
});

export const employeeSchema = z.object({
  code: z.string().min(2),
  fullName: z.string().min(2),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  category: z.enum(["WORKING", "WITH_LOAN", "OTHER"]),
  isActive: z.boolean().default(true),
  baseWage: z.number().nonnegative(),
});

export const attendanceSchema = z.object({
  employeeId: z.string().min(1),
  date: z.string().min(1),
  status: z.enum(["PRESENT", "ABSENT"]).default("PRESENT"),
  wageType: z.enum(["COMMON", "CUSTOM"]),
  customWage: z.number().nonnegative().optional(),
  note: z.string().optional(),
});

export const loanSchema = z.object({
  employeeId: z.string().min(1),
  principal: z.number().positive(),
  interestRate: z.number().nonnegative().default(0),
  note: z.string().optional(),
});

export const repaymentSchema = z.object({
  loanId: z.string().min(1),
  amountPaid: z.number().positive(),
  note: z.string().optional(),
});

export const transactionSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  amount: z.number().positive(),
  category: z.string().min(2),
  note: z.string().optional(),
});

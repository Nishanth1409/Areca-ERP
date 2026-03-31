"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { enqueueOffline } from "@/lib/offline-queue";

type EmployeeDetail = {
  id: string;
  code: string;
  fullName: string;
  phone?: string | null;
  category: string;
  attendances: Array<{
    id: string;
    date: string;
    status: "PRESENT" | "ABSENT";
    wageType: "COMMON" | "CUSTOM";
    dailyWage: number;
  }>;
  loans: Array<{
    id: string;
    principal: number;
    interestRate: number;
    remainingAmount: number;
    repayments: Array<{ id: string; amountPaid: number; paidOn: string }>;
  }>;
  totalWorkingDays: number;
  totalWage: number;
};

export default function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState("");
  const [detail, setDetail] = useState<EmployeeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState({
    date: dayjs().format("YYYY-MM-DD"),
    wageType: "COMMON" as "COMMON" | "CUSTOM",
    customWage: 500,
  });
  const [loanAmount, setLoanAmount] = useState(0);
  const [loanRate, setLoanRate] = useState(0);

  useEffect(() => {
    params.then((value) => setId(value.id));
  }, [params]);

  async function load() {
    if (!id) return;
    const res = await fetch(`/api/employees/${id}`);
    const data = await res.json();
    setDetail(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function markAttendance(event: FormEvent) {
    event.preventDefault();
    const payload = {
      employeeId: id,
      date: attendance.date,
      status: "PRESENT",
      wageType: attendance.wageType,
      customWage: attendance.wageType === "CUSTOM" ? Number(attendance.customWage) : undefined,
    };
    if (!navigator.onLine) {
      enqueueOffline({ type: "attendance", payload });
      return;
    }
    await fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    await load();
  }

  async function giveLoan(event: FormEvent) {
    event.preventDefault();
    const payload = { employeeId: id, principal: loanAmount, interestRate: loanRate };
    if (!navigator.onLine) {
      enqueueOffline({ type: "loan", payload });
      return;
    }
    await fetch("/api/loans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setLoanAmount(0);
    setLoanRate(0);
    await load();
  }

  const repaymentRows = useMemo(
    () =>
      detail?.loans.flatMap((loan) =>
        loan.repayments.map((item) => ({
          ...item,
          loanId: loan.id,
        })),
      ) ?? [],
    [detail],
  );

  if (loading) return <p>Loading employee...</p>;
  if (!detail) return <p>Employee not available.</p>;

  return (
    <div className="space-y-4 pb-16 md:pb-4">
      <div className="card-surface rounded-xl p-4">
        <h1 className="text-xl font-semibold">{detail.fullName}</h1>
        <p className="mt-2 text-sm text-orange-700">Code: {detail.code}</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg bg-orange-50 p-3">
            <p className="text-xs text-orange-600">Total Working Days</p>
            <p className="text-lg font-semibold">{detail.totalWorkingDays}</p>
          </div>
          <div className="rounded-lg bg-orange-50 p-3">
            <p className="text-xs text-orange-600">Total Wage</p>
            <p className="text-lg font-semibold">₹{detail.totalWage}</p>
          </div>
          <div className="rounded-lg bg-orange-50 p-3">
            <p className="text-xs text-orange-600">Category</p>
            <p className="text-lg font-semibold">{detail.category}</p>
          </div>
          <div className="rounded-lg bg-orange-50 p-3">
            <p className="text-xs text-orange-600">Phone</p>
            <p className="text-lg font-semibold">{detail.phone ?? "-"}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <form onSubmit={markAttendance} className="card-surface rounded-xl p-4">
          <h2 className="font-semibold">Attendance + Day Wage</h2>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <input
              type="date"
              aria-label="Attendance date"
              title="Attendance date"
              value={attendance.date}
              onChange={(e) => setAttendance({ ...attendance, date: e.target.value })}
            />
            <select
              aria-label="Wage type"
              title="Wage type"
              value={attendance.wageType}
              onChange={(e) =>
                setAttendance({ ...attendance, wageType: e.target.value as "COMMON" | "CUSTOM" })
              }
            >
              <option value="COMMON">Common wage</option>
              <option value="CUSTOM">Custom wage</option>
            </select>
            <input
              type="number"
              min={0}
              aria-label="Custom day wage"
              title="Custom day wage"
              placeholder="Custom wage"
              disabled={attendance.wageType !== "CUSTOM"}
              value={attendance.customWage}
              onChange={(e) => setAttendance({ ...attendance, customWage: Number(e.target.value) })}
            />
          </div>
          <button className="mt-3 rounded-lg bg-orange-600 px-4 py-2 font-medium text-white">
            Mark present
          </button>
        </form>

        <form onSubmit={giveLoan} className="card-surface rounded-xl p-4">
          <h2 className="font-semibold">Give Loan</h2>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <input
              type="number"
              min={1}
              value={loanAmount}
              placeholder="Principal"
              onChange={(e) => setLoanAmount(Number(e.target.value))}
            />
            <input
              type="number"
              min={0}
              value={loanRate}
              placeholder="Interest %"
              onChange={(e) => setLoanRate(Number(e.target.value))}
            />
          </div>
          <button className="mt-3 rounded-lg bg-orange-600 px-4 py-2 font-medium text-white">
            Create loan
          </button>
        </form>
      </div>

      <div className="card-surface rounded-xl p-4">
        <h2 className="font-semibold">Attendance History</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-orange-700">
                <th className="py-2">Date</th>
                <th>Type</th>
                <th>Wage</th>
              </tr>
            </thead>
            <tbody>
              {detail.attendances.map((item) => (
                <tr key={item.id} className="border-t border-orange-200">
                  <td className="py-2">{dayjs(item.date).format("DD MMM YYYY")}</td>
                  <td>{item.wageType}</td>
                  <td>₹{item.dailyWage}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card-surface rounded-xl p-4">
        <h2 className="font-semibold">Loan and Repayment History</h2>
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          {detail.loans.map((loan) => (
            <LoanCard key={loan.id} loan={loan} onSaved={load} />
          ))}
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-orange-700">
                <th className="py-2">Date</th>
                <th>Loan</th>
                <th>Amount Paid</th>
              </tr>
            </thead>
            <tbody>
              {repaymentRows.map((repayment) => (
                <tr key={repayment.id} className="border-t border-orange-200">
                  <td className="py-2">{dayjs(repayment.paidOn).format("DD MMM YYYY")}</td>
                  <td>{repayment.loanId}</td>
                  <td>₹{repayment.amountPaid}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function LoanCard({
  loan,
  onSaved,
}: {
  loan: EmployeeDetail["loans"][number];
  onSaved: () => Promise<void>;
}) {
  const [amountPaid, setAmountPaid] = useState(0);

  async function submitRepayment(event: FormEvent) {
    event.preventDefault();
    const payload = { loanId: loan.id, amountPaid };
    if (!navigator.onLine) {
      enqueueOffline({ type: "repayment", payload });
      return;
    }
    await fetch("/api/repayments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setAmountPaid(0);
    await onSaved();
  }

  return (
    <form onSubmit={submitRepayment} className="rounded-lg border border-orange-200 bg-orange-50 p-3">
      <p className="text-sm text-orange-700">Loan ID: {loan.id}</p>
      <p className="mt-1">Principal: ₹{loan.principal}</p>
      <p>Interest: {loan.interestRate}%</p>
      <p>Remaining: ₹{loan.remainingAmount}</p>
      <div className="mt-2 flex gap-2">
        <input
          type="number"
          min={1}
          value={amountPaid}
          onChange={(e) => setAmountPaid(Number(e.target.value))}
          placeholder="Repayment amount"
        />
        <button className="rounded-lg bg-orange-600 px-3 py-2 font-medium text-white">Pay</button>
      </div>
    </form>
  );
}

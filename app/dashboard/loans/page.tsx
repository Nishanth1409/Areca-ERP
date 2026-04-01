"use client";

import { useEffect, useMemo, useState } from "react";

type Loan = {
  id: string;
  employee: { fullName: string; code: string };
  principal: number;
  totalPayable: number;
  remainingAmount: number;
  interestRate: number;
  status: "ACTIVE" | "CLOSED";
};

export default function LoansPage() {
  const [rows, setRows] = useState<Loan[]>([]);
  const [search, setSearch] = useState("");
  const [activeOnly, setActiveOnly] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadLoans() {
      try {
        setError(null);
        const res = await fetch(`/api/loans?active=${activeOnly}`, {
          signal: controller.signal,
        });
        if (!res.ok) {
          throw new Error(`Failed to load loans: ${res.status}`);
        }
        const data = await res.json();
        setRows(Array.isArray(data) ? data : []);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setRows([]);
        setError("Unable to load loans right now. Please check your connection and try again.");
      }
    }

    void loadLoans();
    return () => controller.abort();
  }, [activeOnly]);

  const filtered = useMemo(
    () =>
      rows.filter((item) =>
        item.employee.fullName.toLowerCase().includes(search.toLowerCase()),
      ),
    [rows, search],
  );

  return (
    <div className="card-surface rounded-xl p-4 pb-16 md:pb-4">
      <div className="flex flex-wrap items-center gap-2">
        <input
          placeholder="Search employee"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          onClick={() => setActiveOnly((prev) => !prev)}
          className="rounded-md border border-orange-300 px-3 py-2 text-sm"
        >
          {activeOnly ? "Show all loans" : "Show active only"}
        </button>
      </div>
      <div className="mt-4 overflow-x-auto">
        {error ? (
          <p className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-orange-700">
              <th className="py-2">Employee</th>
              <th>Principal</th>
              <th>Interest</th>
              <th>Total</th>
              <th>Remaining</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((loan) => (
              <tr key={loan.id} className="border-t border-orange-200">
                <td className="py-2">
                  {loan.employee
                    ? `${loan.employee.fullName} (${loan.employee.code})`
                    : "Unknown employee"}
                </td>
                <td>₹{loan.principal}</td>
                <td>{loan.interestRate}%</td>
                <td>₹{loan.totalPayable}</td>
                <td>₹{loan.remainingAmount}</td>
                <td>{loan.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

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

  useEffect(() => {
    fetch(`/api/loans?active=${activeOnly}`)
      .then((res) => res.json())
      .then((data) => setRows(Array.isArray(data) ? data : []));
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
                  {loan.employee.fullName} ({loan.employee.code})
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

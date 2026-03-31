"use client";

import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Summary = {
  employees: number;
  activeLoans: number;
  income: number;
  expense: number;
  profit: number;
};

type TransactionResponse = {
  transactions: Array<{ type: "INCOME" | "EXPENSE"; amount: number; category: string }>;
};

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [transactions, setTransactions] = useState<TransactionResponse["transactions"]>([]);
  const [insight, setInsight] = useState<{ message: string } | null>(null);

  useEffect(() => {
    fetch("/api/summary")
      .then((res) => res.json())
      .then(setSummary);
    fetch("/api/transactions")
      .then((res) => res.json())
      .then((data) => setTransactions(data.transactions ?? []));
    fetch("/api/ai")
      .then((res) => res.json())
      .then(setInsight);
  }, []);

  const chartData = useMemo(() => {
    const grouped = new Map<string, { name: string; income: number; expense: number }>();
    for (const row of transactions) {
      const existing = grouped.get(row.category) ?? { name: row.category, income: 0, expense: 0 };
      if (row.type === "INCOME") existing.income += Number(row.amount);
      else existing.expense += Number(row.amount);
      grouped.set(row.category, existing);
    }
    return Array.from(grouped.values()).slice(0, 8);
  }, [transactions]);
  const recentTransactions = transactions.slice(0, 6);

  return (
    <div className="space-y-4 pb-16 md:pb-4">
      <div className="card-surface rounded-xl p-4">
        <p className="text-xs text-orange-600">Dashboard Overview</p>
        <h1 className="mt-1 text-2xl font-semibold">Business performance snapshot</h1>
        <p className="mt-1 text-sm text-orange-700">
          Track employees, active loans, and daily financial movement in one place.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {[
          { label: "Employees", value: summary?.employees ?? 0 },
          { label: "Active Loans", value: summary?.activeLoans ?? 0 },
          { label: "Income", value: `₹${summary?.income ?? 0}` },
          { label: "Expense", value: `₹${summary?.expense ?? 0}` },
          { label: "Profit", value: `₹${summary?.profit ?? 0}` },
        ].map((card) => (
          <div key={card.label} className="card-surface rounded-xl p-4">
            <p className="text-xs text-orange-600">{card.label}</p>
            <p className="mt-2 text-xl font-semibold">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="card-surface rounded-xl p-4 xl:col-span-2">
        <h2 className="mb-3 text-sm font-medium text-orange-700">Income vs Expense by Category</h2>
        <div className="h-72 w-full">
          <ResponsiveContainer>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#fed7aa" />
              <XAxis dataKey="name" stroke="#c2410c" />
              <YAxis stroke="#c2410c" />
              <Tooltip />
              <Bar dataKey="income" fill="#16a34a" />
              <Bar dataKey="expense" fill="#ea580c" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
        <div className="card-surface rounded-xl p-4">
          <h2 className="mb-3 text-sm font-medium text-orange-700">Recent Transactions</h2>
          <div className="space-y-2">
            {recentTransactions.length === 0 ? (
              <p className="text-sm text-orange-700">No transactions yet.</p>
            ) : (
              recentTransactions.map((item, idx) => (
                <div key={`${item.category}-${idx}`} className="rounded-lg bg-orange-50 p-2">
                  <p className="text-sm font-medium">{item.category}</p>
                  <p className="text-xs text-orange-700">
                    {item.type} - ₹{item.amount}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      {insight ? (
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800">
          <span className="font-semibold">AI insight:</span> {insight.message}
        </div>
      ) : null}
    </div>
  );
}

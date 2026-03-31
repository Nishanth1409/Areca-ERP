"use client";

import dayjs from "dayjs";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { enqueueOffline } from "@/lib/offline-queue";

type Tx = {
  id: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  category: string;
  note?: string | null;
  happenedOn: string;
};

export default function TransactionsPage() {
  const [rows, setRows] = useState<Tx[]>([]);
  const [summary, setSummary] = useState({ income: 0, expense: 0, profit: 0 });
  const [dateFilter, setDateFilter] = useState("");
  const [form, setForm] = useState({
    type: "INCOME" as "INCOME" | "EXPENSE",
    amount: 0,
    category: "",
    note: "",
  });

  async function loadData() {
    const res = await fetch("/api/transactions");
    const data = await res.json();
    setRows(data.transactions ?? []);
    setSummary({ income: data.income ?? 0, expense: data.expense ?? 0, profit: data.profit ?? 0 });
  }

  useEffect(() => {
    fetch("/api/transactions")
      .then((res) => res.json())
      .then((data) => {
        setRows(data.transactions ?? []);
        setSummary({
          income: data.income ?? 0,
          expense: data.expense ?? 0,
          profit: data.profit ?? 0,
        });
      });
  }, []);

  const filtered = useMemo(
    () =>
      rows.filter((item) =>
        dateFilter ? dayjs(item.happenedOn).format("YYYY-MM-DD") === dateFilter : true,
      ),
    [rows, dateFilter],
  );

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!navigator.onLine) {
      enqueueOffline({ type: "transaction", payload: form });
      return;
    }
    await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, amount: Number(form.amount) }),
    });
    setForm({ type: "INCOME", amount: 0, category: "", note: "" });
    await loadData();
  }

  return (
    <div className="space-y-4 pb-16 md:pb-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Card title="Income" value={`₹${summary.income}`} />
        <Card title="Expense" value={`₹${summary.expense}`} />
        <Card title="Profit" value={`₹${summary.profit}`} />
      </div>

      <form onSubmit={submit} className="card-surface rounded-xl p-4">
        <h2 className="font-semibold">Add Transaction</h2>
        <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-5">
          <select
            aria-label="Transaction type"
            title="Transaction type"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as "INCOME" | "EXPENSE" })}
          >
            <option value="INCOME">Income</option>
            <option value="EXPENSE">Expense</option>
          </select>
          <input
            type="number"
            min={1}
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
            placeholder="Amount"
          />
          <input
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            placeholder="Category"
          />
          <input
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            placeholder="Note"
          />
          <button className="rounded-lg bg-orange-600 px-4 py-2 font-medium text-white">
            Save
          </button>
        </div>
      </form>

      <div className="card-surface rounded-xl p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Transaction History</h2>
          <input
            type="date"
            aria-label="Filter transactions by date"
            title="Filter transactions by date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-orange-700">
                <th className="py-2">Date</th>
                <th>Type</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="border-t border-orange-200">
                  <td className="py-2">{dayjs(item.happenedOn).format("DD MMM YYYY")}</td>
                  <td>{item.type}</td>
                  <td>{item.category}</td>
                  <td>₹{item.amount}</td>
                  <td>{item.note ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="card-surface rounded-xl p-4">
      <p className="text-xs text-orange-600">{title}</p>
      <p className="text-xl font-semibold">{value}</p>
    </div>
  );
}

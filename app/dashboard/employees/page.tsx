"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

type Employee = {
  id: string;
  code: string;
  fullName: string;
  phone?: string | null;
  category: "WORKING" | "WITH_LOAN" | "OTHER";
  isActive: boolean;
};

const categories: Array<Employee["category"]> = ["WORKING", "WITH_LOAN", "OTHER"];

export default function EmployeePage() {
  const [rows, setRows] = useState<Employee[]>([]);
  const [tab, setTab] = useState<Employee["category"]>("WORKING");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<"ADMIN" | "USER">("USER");
  const [form, setForm] = useState({
    code: "",
    fullName: "",
    phone: "",
    category: "WORKING" as Employee["category"],
    baseWage: 500,
  });

  async function loadData() {
    const res = await fetch("/api/employees");
    const data = await res.json();
    setRows(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    Promise.all([fetch("/api/employees"), fetch("/api/auth/me")]).then(async ([employeeRes, meRes]) => {
      const data = await employeeRes.json();
      setRows(Array.isArray(data) ? data : []);
      if (meRes.ok) {
        const me = await meRes.json();
        setRole(me.role === "ADMIN" ? "ADMIN" : "USER");
      }
    });
  }, []);

  const filtered = useMemo(
    () =>
      rows.filter(
        (row) =>
          (role === "ADMIN" ? row.category === tab : true) &&
          row.fullName.toLowerCase().includes(search.toLowerCase()),
      ),
    [rows, tab, search, role],
  );

  async function createEmployee(event: FormEvent) {
    event.preventDefault();
    const payload = {
      ...form,
      address: "",
      isActive: true,
      baseWage: Number(form.baseWage),
    };
    const response = await fetch("/api/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (response.ok) {
      setForm({ code: "", fullName: "", phone: "", category: "WORKING", baseWage: 500 });
      await loadData();
    }
  }

  return (
    <div className="space-y-4 pb-16 md:pb-4">
      <div className="card-surface rounded-xl p-4">
        <h2 className="font-semibold">{role === "ADMIN" ? "Add Employee" : "My Employee Data"}</h2>
        {role === "ADMIN" ? (
          <form onSubmit={createEmployee} className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-5">
          <input
            required
            placeholder="Code"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
          />
          <input
            required
            placeholder="Full name"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          />
          <input
            placeholder="Phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <select
            aria-label="Employee category"
            title="Employee category"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value as Employee["category"] })}
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <input
              type="number"
              min={0}
              aria-label="Base wage"
              title="Base wage"
              placeholder="Base wage"
              value={form.baseWage}
              onChange={(e) => setForm({ ...form, baseWage: Number(e.target.value) })}
            />
            <button className="rounded-lg bg-orange-600 px-3 py-2 font-medium text-white">
              Save
            </button>
          </div>
          </form>
        ) : (
          <p className="mt-2 text-sm text-orange-700">
            You can view only your own employee profile and details.
          </p>
        )}
      </div>

      <div className="card-surface rounded-xl p-4">
        <div className="flex flex-wrap items-center gap-2">
          {role === "ADMIN"
            ? categories.map((item) => (
                <button
                  key={item}
                  onClick={() => setTab(item)}
                  className={`rounded-md px-3 py-1.5 text-sm ${
                    tab === item ? "bg-orange-600 text-white" : "bg-orange-100 text-orange-900"
                  }`}
                >
                  {item === "WORKING"
                    ? "Working Employees"
                    : item === "WITH_LOAN"
                      ? "Employees With Loans"
                      : "Other Employees"}
                </button>
              ))
            : null}
          <input
            placeholder="Search employee"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ml-auto"
          />
        </div>

        <div className="mt-4 overflow-x-auto rounded-lg border border-orange-200">
          <table className="min-w-full text-sm">
            <thead className="bg-orange-50">
              <tr>
                <th className="px-3 py-2 text-left">Code</th>
                <th className="px-3 py-2 text-left">Name</th>
                <th className="px-3 py-2 text-left">Phone</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((employee) => (
                <tr key={employee.id} className="border-t border-orange-200">
                  <td className="px-3 py-2">{employee.code}</td>
                  <td className="px-3 py-2">{employee.fullName}</td>
                  <td className="px-3 py-2">{employee.phone ?? "-"}</td>
                  <td className="px-3 py-2">{employee.isActive ? "Active" : "Inactive"}</td>
                  <td className="px-3 py-2">
                    <Link className="text-orange-700 underline" href={`/dashboard/employees/${employee.id}`}>
                      View details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

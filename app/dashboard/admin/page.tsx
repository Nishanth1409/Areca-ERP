"use client";

import { FormEvent, useEffect, useState } from "react";

type UserRow = {
  id: string;
  userCode?: string;
  name: string;
  phone: string;
  email?: string | null;
  role: "ADMIN" | "USER";
  userType?: "EMPLOYEE" | "LOAN_BUYER" | null;
  employee?: { id: string; fullName: string } | null;
};

export default function AdminPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [error, setError] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    role: "USER" as "ADMIN" | "USER",
    userType: "EMPLOYEE" as "EMPLOYEE" | "LOAN_BUYER",
  });

  async function loadData() {
    const userRes = await fetch("/api/admin/users");
    if (!userRes.ok) {
      setError("Admin access required.");
      return;
    }
    const usersData = await userRes.json();
    setUsers(Array.isArray(usersData) ? usersData : []);
  }

  useEffect(() => {
    Promise.all([fetch("/api/admin/users"), fetch("/api/auth/me")])
      .then(async ([userRes, meRes]) => {
        if (!userRes.ok) {
          setError("Admin access required.");
          return;
        }
        const usersData = await userRes.json();
        setUsers(Array.isArray(usersData) ? usersData : []);
        if (meRes.ok) {
          const me = await meRes.json();
          setCurrentUserId(me?.id ?? "");
        }
      });
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        email: form.email || null,
        userType: form.role === "USER" ? form.userType : null,
      }),
    });
    const raw = await response.text();
    let payload: { error?: string } = {};
    if (raw) {
      try {
        payload = JSON.parse(raw) as { error?: string };
      } catch {
        payload = {};
      }
    }
    if (!response.ok) {
      setError(payload.error ?? "Could not create user.");
      return;
    }
    setForm({
      name: "",
      phone: "",
      email: "",
      password: "",
      role: "USER",
      userType: "EMPLOYEE",
    });
    await loadData();
  }

  async function deleteUser(userId: string) {
    if (!confirm("Delete this user? This action cannot be undone.")) return;
    setError("");
    const response = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
    const raw = await response.text();
    let payload: { error?: string } = {};
    if (raw) {
      try {
        payload = JSON.parse(raw) as { error?: string };
      } catch {
        payload = {};
      }
    }
    if (!response.ok) {
      setError(payload.error ?? "Could not delete user.");
      return;
    }
    await loadData();
  }

  return (
    <div className="space-y-4 pb-16 md:pb-4">
      <div className="card-surface rounded-xl p-4">
        <h2 className="font-semibold">Grant Login Access</h2>
        <p className="mt-1 text-xs text-orange-700">
          USER account automatically creates linked employee/loan-buyer profile.
        </p>
        <form onSubmit={submit} className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" required />
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone" required />
          <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email (optional)" />
          <input
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Password"
            type="password"
            required
          />
          <select
            aria-label="User role"
            title="User role"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as "ADMIN" | "USER" })}
          >
            <option value="USER">USER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
          {form.role === "USER" ? (
            <select
              aria-label="User type"
              title="User type"
              value={form.userType}
              onChange={(e) =>
                setForm({ ...form, userType: e.target.value as "EMPLOYEE" | "LOAN_BUYER" })
              }
            >
              <option value="EMPLOYEE">Employee</option>
              <option value="LOAN_BUYER">Loan Buyer</option>
            </select>
          ) : (
            <input
              aria-label="Admin access summary"
              title="Admin access summary"
              value="Admin full access"
              disabled
            />
          )}
          <input
            aria-label="Profile auto creation summary"
            title="Profile auto creation summary"
            value={
              form.role === "USER"
                ? form.userType === "LOAN_BUYER"
                  ? "Loan buyer profile auto-created"
                  : "Employee profile auto-created"
                : "No employee profile for admin"
            }
            disabled
          />
          <button className="rounded-lg bg-orange-600 px-4 py-2 font-medium text-white md:col-span-3">
            Create User
          </button>
        </form>
        {error ? <p className="mt-2 text-sm text-red-400">{error}</p> : null}
      </div>

      <div className="card-surface rounded-xl p-4">
        <h2 className="font-semibold">Users and Roles</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-orange-700">
                <th className="py-2">Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Role</th>
                <th>User Type</th>
                <th>Linked Employee</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-orange-200">
                  <td className="py-2">
                    {user.userCode ? `${user.userCode} - ` : ""}
                    {user.name}
                  </td>
                  <td>{user.phone}</td>
                  <td>{user.email ?? "-"}</td>
                  <td>{user.role}</td>
                  <td>{user.userType ?? "-"}</td>
                  <td>{user.employee?.fullName ?? "-"}</td>
                  <td>
                    <button
                      disabled={user.id === currentUserId}
                      onClick={() => deleteUser(user.id)}
                      className="rounded-md border border-red-500 px-2 py-1 text-xs text-red-400 disabled:opacity-50"
                    >
                      Delete
                    </button>
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

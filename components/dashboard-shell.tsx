"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { PropsWithChildren, useEffect, useState } from "react";

type Me = {
  name: string;
  role: "ADMIN" | "USER";
  userType?: "EMPLOYEE" | "LOAN_BUYER" | null;
};

const adminCommonLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/employees", label: "Employees" },
  { href: "/dashboard/loans", label: "Loans" },
];

const adminOnlyLinks = [
  { href: "/dashboard/transactions", label: "Transactions" },
  { href: "/dashboard/reports", label: "Reports" },
  { href: "/dashboard/admin", label: "Admin" },
];

export function DashboardShell({ children }: PropsWithChildren) {
  const path = usePathname();
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const links = me?.role === "ADMIN" ? [...adminCommonLinks, ...adminOnlyLinks] : [{ href: "/dashboard", label: "Dashboard" }];

  useEffect(() => {
    if (!me || me.role === "ADMIN") return;
    if (
      path.startsWith("/dashboard/admin") ||
      path.startsWith("/dashboard/transactions") ||
      path.startsWith("/dashboard/reports")
    ) {
      router.replace("/dashboard");
      return;
    }
    if (path.startsWith("/dashboard/employees") || path.startsWith("/dashboard/loans")) {
      router.replace("/dashboard");
    }
  }, [me, path, router]);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setMe(data))
      .catch(() => setMe(null));
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen p-4 md:p-6">
      <header className="card-surface mb-6 flex max-w-7xl flex-wrap items-center justify-between gap-3 rounded-xl p-4 shadow-sm">
        <Image
          src="/SRYN.png"
          alt="SRYN Areca logo"
          width={80}
          height={80}
          quality={100}
          className="h-20 w-20 rounded-md"
        />
        <nav className="flex flex-wrap items-center gap-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-md px-3 py-1.5 text-sm ${
                path === link.href ? "bg-orange-600 text-white" : "bg-orange-100 text-orange-900"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <button onClick={logout} className="rounded-md border border-orange-300 px-3 py-1.5 text-sm">
          Logout
        </button>
      </header>
      <main className="mx-auto max-w-7xl">{children}</main>
      <footer className="mx-auto mt-8 hidden w-full max-w-7xl rounded-xl border border-orange-200 bg-white px-4 py-3 text-xs text-orange-700 md:flex md:items-center md:justify-between">
        <p>SRYN Areca Nut Business Management</p>
        <p>{new Date().getFullYear()} - Secure business data platform</p>
      </footer>
      <div className="fixed bottom-0 left-0 right-0 border-t border-orange-200 bg-white p-2 md:hidden">
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <Link href="/dashboard">Home</Link>
          {me?.role === "ADMIN" ? <Link href="/dashboard/employees">Employees</Link> : <Link href="/dashboard">Dashboard</Link>}
          <Link href={me?.role === "ADMIN" ? "/dashboard/reports" : "/dashboard"}>More</Link>
        </div>
      </div>
    </div>
  );
}

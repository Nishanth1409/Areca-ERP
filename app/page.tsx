import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <main className="w-full max-w-5xl space-y-4">
        <header className="card-surface flex items-center justify-between rounded-2xl px-6 py-4 shadow-sm">
          <Image src="/SRYN.png" alt="SRYN Areca logo" width={58} height={58} className="h-12 w-12 rounded-md" />
          <Link href="/login" className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white">
            Sign in
          </Link>
        </header>

        <section className="card-surface rounded-2xl p-8 shadow-sm">
          <p className="text-orange-600 text-sm font-medium">Areca Nut Business ERP</p>
          <h1 className="mt-2 text-3xl font-semibold">
            Attendance, loans, and transactions in one secure system
          </h1>
          <p className="mt-4 text-orange-800">
            Manage working employees, employee loans, repayments, income, expenses, and
            PDF reports with role-based access.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="rounded-lg bg-orange-600 px-5 py-2 font-medium text-white"
            >
              Login
            </Link>
            <form action="/api/bootstrap" method="post">
              <button className="rounded-lg border border-orange-300 px-5 py-2 font-medium">
                Bootstrap Admin
              </button>
            </form>
          </div>
          <p className="mt-4 text-xs text-orange-600">
            Bootstrap creates default admin with your configured credentials.
          </p>
        </section>

        <footer className="card-surface rounded-2xl px-6 py-3 text-xs text-orange-700 shadow-sm">
          {new Date().getFullYear()} SRYN Areca Nuts - Built for daily operations
        </footer>
      </main>
    </div>
  );
}

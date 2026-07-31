<div align="center">

# Areca ERP — Business Management for Arecanut Operations

**Attendance, loans, transactions, and PDF reports — one secure system for daily arecanut business.**

Self-hosted · Firebase-backed · Android-ready (Capacitor)

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com)
[![Capacitor](https://img.shields.io/badge/Capacitor-Android-119EFF?logo=capacitor&logoColor=white)](https://capacitorjs.com)
[![Auth](https://img.shields.io/badge/Auth-JWT%20%2B%20RBAC-1f9d55)](#-getting-started-run-it-locally)

</div>

<div align="center">
  <img src="docs/screenshots/devices-all.png" alt="Areca ERP on television, laptop, and phone" width="100%" />
  <p><em>One app · three displays — television, laptop, and phone. Layout adapts to each screen.</em></p>
</div>

---

## Why this exists

Running an arecanut business means juggling workers, day wages, loans, repayments, and cash movement —
often across notebooks, WhatsApp, and spreadsheets. **Areca ERP** puts the daily operations in one place:
employees and attendance, loans tied to the ledger, income/expense tracking, dashboard charts, and PDF
reports — with role-based login so staff only see what they should.

> Built by **Nishanth K R** — *son of a farmer, always a farmer* — for the people who run these books every day.

---

## What you can do

- **Sign in securely** — email or phone login with JWT sessions; roles `ADMIN` and `USER`.
- **Dashboard snapshot** — employees, active loans, income, expense, and profit at a glance.
- **Employees & attendance** — working / with-loan / other statuses; common or custom day wages; salary from attendance.
- **Loans & repayments** — issue and repay loans with automatic business transaction updates.
- **Income & expenses** — track cash movement with category charts and recent activity.
- **PDF reports** — employee and finance reports you can download or back up.
- **Offline-friendly** — queue + manual sync + JSON backup export; Firebase Storage upload for backups.
- **Works on every screen** — phone, laptop, and television layouts; Capacitor config for Android APK.

---

## See it on every display

| Laptop · 1440 × 900 | Phone · 390 × 844 |
| :---: | :---: |
| <img src="docs/screenshots/device-laptop.png" alt="Areca ERP on a laptop" /> | <img src="docs/screenshots/device-phone.png" alt="Areca ERP on a phone" /> |

<div align="center">

### Television · 1920 × 1080

<img src="docs/screenshots/device-tv.png" alt="Areca ERP on a television" width="92%" />

</div>

---

## Every feature, one by one

### 1 · Home & first-time bootstrap

Land on a clear pitch for the ERP, sign in, or create the first admin with **Bootstrap Admin**
(one-time only — safe to leave after that).

<img src="docs/screenshots/feature-home.png" alt="Areca ERP home and bootstrap" width="100%" />

### 2 · Login

Email or phone + password. Sessions are cookie-based JWT; admins reach the full dashboard.

<img src="docs/screenshots/feature-login.png" alt="Areca ERP login" width="100%" />

### 3 · Dashboard overview

Business performance snapshot — employee count, active loans, income, expense, profit,
category charts, and recent transactions.

<img src="docs/screenshots/feature-dashboard.png" alt="Areca ERP dashboard" width="100%" />

### 4 · Employees

Manage workers by status (`WORKING`, `WITH_LOAN`, `OTHER`), attendance, and wage rules.

<img src="docs/screenshots/feature-employees.png" alt="Areca ERP employees" width="100%" />

### 5 · Loans

Issue loans and record repayments; the ledger updates automatically with the business transactions.

<img src="docs/screenshots/feature-loans.png" alt="Areca ERP loans" width="100%" />

### 6 · Transactions

Income and expense tracking for daily cash movement.

<img src="docs/screenshots/feature-transactions.png" alt="Areca ERP transactions" width="100%" />

### 7 · Reports

Generate PDF reports for employees and finance; upload backups to Firebase Storage when configured.

<img src="docs/screenshots/feature-reports.png" alt="Areca ERP reports" width="100%" />

---

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 |
| Auth | JWT (jose / jsonwebtoken) · bcrypt · role-based access (`ADMIN` / `USER`) |
| Data | Cloud Firestore · Firebase Admin · Firebase Storage (backups) |
| Charts / PDF | Recharts · jsPDF |
| Mobile | Capacitor 8 (Android) |
| Validation | Zod |

---

## Getting started (run it locally)

```bash
git clone https://github.com/Nishanth1409/Areca-ERP.git
cd Areca-ERP
npm install
cp .env.example .env
```

Fill `.env` with Firebase web config + a service account (`FIREBASE_*`) and a strong `JWT_SECRET`.

1. Create a Firebase project
2. Enable **Firestore** and **Storage**
3. Add a service account key → map `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` (keep `\n` escaped)

```bash
npm run dev
```

Open **http://localhost:3000**.

### First admin (bootstrap once)

On the home page click **Bootstrap Admin**, or:

```bash
curl -X POST http://localhost:3000/api/bootstrap
```

The response returns the first admin email, phone, and password (defined in
`app/api/bootstrap/route.ts`). Change those values in code **before** the first bootstrap
for any real deployment. Bootstrap returns `409` if an admin already exists.

Then sign in at `/login` and open `/dashboard`.

| Command | What it does |
| --- | --- |
| `npm run dev` | Next.js development server |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npx cap add android` | Add Android platform (after build) |
| `npx cap sync android` | Sync web build into Android |
| `npx cap open android` | Open Android Studio |

### Main routes

| Route | Purpose |
| --- | --- |
| `/` | Home · bootstrap |
| `/login` | Sign in |
| `/dashboard` | Overview |
| `/dashboard/employees` | Employees & attendance |
| `/dashboard/loans` | Loans & repayments |
| `/dashboard/transactions` | Income / expense |
| `/dashboard/reports` | PDF reports & backup |
| `/dashboard/admin` | Admin settings |

### Android (Capacitor)

```bash
npm run build
npx cap add android
npx cap sync android
npx cap open android
```

Build the APK from Android Studio (`Build → Build APK(s)`).

### Deploy

- Host on Vercel (or any Node host that supports Next.js)
- Set the same Firebase + JWT variables in the project environment
- Use **Reports → Upload Backup to Firebase** once Storage is enabled

---

<div align="center">

Made with care by **Nishanth K R** — *son of a farmer, always a farmer.*

[Portfolio](https://nkrportfolio.vercel.app) · [GitHub](https://github.com/Nishanth1409)

</div>

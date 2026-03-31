# Areca ERP (Web + Android-ready)

Full-stack ERP-style system for Areca Nut operations:

- Employee management (`WORKING`, `WITH_LOAN`, `OTHER`)
- Attendance with `COMMON` and `CUSTOM` day wage
- Automatic salary summary from attendance
- Loan issue + repayment with auto business transaction updates
- Income/expense tracking and dashboard charts
- PDF reports (employee + finance)
- Firestore database + Firebase Storage backup upload (free-tier friendly)
- Role-based auth (`ADMIN`, `USER`) with phone/email login
- Offline queue + manual sync + JSON backup export
- Capacitor config for Android APK build

## 1) Install

```bash
npm install
```

## 2) Configure environment

Create `.env` (or copy from `.env.example`):

```env
JWT_SECRET="replace-with-strong-secret"
NEXT_PUBLIC_FIREBASE_API_KEY=""
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=""
NEXT_PUBLIC_FIREBASE_PROJECT_ID=""
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=""
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=""
NEXT_PUBLIC_FIREBASE_APP_ID=""
FIREBASE_PROJECT_ID=""
FIREBASE_CLIENT_EMAIL=""
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

## 3) Firebase setup

- Create a Firebase project
- Enable **Firestore Database**
- Enable **Storage**
- Generate a **service account key** and map it to:
  - `FIREBASE_PROJECT_ID`
  - `FIREBASE_CLIENT_EMAIL`
  - `FIREBASE_PRIVATE_KEY` (keep escaped `\n`)

## 4) Start app

```bash
npm run dev
```

## 5) Bootstrap first admin

Open app home and click **Bootstrap Admin**, or call:

```bash
curl -X POST http://localhost:3000/api/bootstrap
```

Default credentials:

- Email: `admin@areca.local`
- Phone: `9999999999`
- Password: `Admin@123`

## 6) Main routes

- `/login`
- `/dashboard`
- `/dashboard/employees`
- `/dashboard/loans`
- `/dashboard/transactions`
- `/dashboard/reports`
- `/dashboard/admin`

## 7) Android (Capacitor) quick start

```bash
npm run build
npx cap add android
npx cap sync android
npx cap open android
```

Build APK from Android Studio (`Build > Build APK(s)`).

## 8) Production deploy

- Deploy app on Vercel
- Set Firebase + JWT env variables in project environment variables

Then use `/dashboard/reports` -> **Upload Backup to Firebase**.
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

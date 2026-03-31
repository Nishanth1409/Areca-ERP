"use client";

import { useEffect, useState } from "react";
import { downloadEmployeeReport, downloadFinanceReport } from "@/lib/pdf-reports";
import {
  clearOfflineQueue,
  getOfflineQueue,
  type OfflineAction,
} from "@/lib/offline-queue";
import { uploadBackupJson } from "@/lib/firebase-storage";

type Employee = {
  code: string;
  fullName: string;
  category: string;
  isActive: boolean;
};

type Tx = {
  type: string;
  amount: number;
  category: string;
  happenedOn: string;
};

export default function ReportsPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [queueCount, setQueueCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [uploadUrl, setUploadUrl] = useState("");
  const [uploadError, setUploadError] = useState("");

  async function load() {
    const [empRes, txRes] = await Promise.all([fetch("/api/employees"), fetch("/api/transactions")]);
    const empData = await empRes.json();
    const txData = await txRes.json();
    setEmployees(Array.isArray(empData) ? empData : []);
    setTransactions(txData.transactions ?? []);
    setQueueCount(getOfflineQueue().length);
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const onOnline = () => {
      syncOfflineQueue();
    };
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function syncOfflineQueue() {
    if (!navigator.onLine) return;
    setIsSyncing(true);
    const queue = getOfflineQueue();
    for (const action of queue) {
      await syncAction(action);
    }
    clearOfflineQueue();
    setQueueCount(0);
    setIsSyncing(false);
    await load();
  }

  async function syncAction(action: OfflineAction) {
    const map = {
      attendance: "/api/attendance",
      loan: "/api/loans",
      repayment: "/api/repayments",
      transaction: "/api/transactions",
    };
    await fetch(map[action.type], {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(action.payload),
    });
  }

  function exportBackup() {
    const payload = buildBackupPayload();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "areca-backup.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function buildBackupPayload() {
    return {
      timestamp: new Date().toISOString(),
      employees,
      transactions,
      offlineQueue: getOfflineQueue(),
    };
  }

  async function uploadBackupToFirebase() {
    setUploadError("");
    setUploadUrl("");
    try {
      const url = await uploadBackupJson(buildBackupPayload());
      setUploadUrl(url);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Firebase upload failed.");
    }
  }

  return (
    <div className="space-y-4 pb-16 md:pb-4">
      <div className="card-surface rounded-xl p-4">
        <h2 className="font-semibold">PDF Reports</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={() => downloadEmployeeReport(employees)}
            className="rounded-lg bg-orange-600 px-4 py-2 font-medium text-white"
          >
            Download Employee Report
          </button>
          <button
            onClick={() => downloadFinanceReport(transactions)}
            className="rounded-lg bg-orange-600 px-4 py-2 font-medium text-white"
          >
            Download Finance Report
          </button>
        </div>
      </div>

      <div className="card-surface rounded-xl p-4">
        <h2 className="font-semibold">Offline Sync + Backup</h2>
        <p className="mt-2 text-sm text-orange-700">Queued offline actions: {queueCount}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={syncOfflineQueue}
            className="rounded-lg border border-orange-300 px-4 py-2 text-sm"
            disabled={isSyncing}
          >
            {isSyncing ? "Syncing..." : "Sync Offline Data"}
          </button>
          <button onClick={exportBackup} className="rounded-lg border border-orange-300 px-4 py-2 text-sm">
            Export Backup JSON
          </button>
          <button
            onClick={uploadBackupToFirebase}
            className="rounded-lg border border-orange-300 px-4 py-2 text-sm"
          >
            Upload Backup to Firebase
          </button>
        </div>
        {uploadUrl ? (
          <p className="mt-3 text-xs text-green-700 break-all">Uploaded: {uploadUrl}</p>
        ) : null}
        {uploadError ? <p className="mt-3 text-xs text-red-400">{uploadError}</p> : null}
      </div>
    </div>
  );
}

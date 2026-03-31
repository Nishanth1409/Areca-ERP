"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function downloadEmployeeReport(
  rows: Array<{ code: string; fullName: string; category: string; isActive: boolean }>,
) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text("Areca Employee Report", 14, 20);
  autoTable(doc, {
    startY: 28,
    head: [["Code", "Name", "Category", "Status"]],
    body: rows.map((item) => [
      item.code,
      item.fullName,
      item.category,
      item.isActive ? "Active" : "Inactive",
    ]),
  });
  doc.save(`employee-report-${Date.now()}.pdf`);
}

export function downloadFinanceReport(
  rows: Array<{ type: string; amount: number; category: string; happenedOn: string }>,
) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text("Areca Finance Report", 14, 20);
  autoTable(doc, {
    startY: 28,
    head: [["Type", "Amount", "Category", "Date"]],
    body: rows.map((item) => [item.type, item.amount.toFixed(2), item.category, item.happenedOn]),
  });
  doc.save(`finance-report-${Date.now()}.pdf`);
}

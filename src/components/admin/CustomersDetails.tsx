"use client";

import React, { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";

import { AmiriRegular } from "@/fonts/AmiriRegular";
import { AmiriBold }   from "@/fonts/AmiriBold";

type Customer = {
  id: number;
  name: string;
  phone: string;
  city: string;
  balance_due: number;
};

type TransactionType = {
  id: number;
  reference: string;
  service_id: number;
  payment_type: string;
  amount_foreign: number;
  amount_lyd: number;
  status: string;
  created_at: string;
  employee_name: string;
  client_name?: string;
  to: string;
  number: string;
  notes?: string;
};

type ReceiptType = {
  id: number;
  amount: number;
  created_at: string;
};

type ServiceOut = {
  id: number;
  name: string;
};

export default function CustomerDetailsPage() {
  const { id } = useParams();
  const [customer, setCustomer]       = useState<Customer | null>(null);
  const [transactions, setTransactions] = useState<TransactionType[]>([]);
  const [receipts, setReceipts]         = useState<ReceiptType[]>([]);
  const [servicesMap, setServicesMap]   = useState<Record<number,string>>({});
  const [loading, setLoading]           = useState(false);

  useEffect(() => {
    if (id) fetchData(+id);
  }, [id]);

  async function fetchData(customerId: number) {
    setLoading(true);
    try {
      const [cRes, txRes, rcRes] = await Promise.all([
        api.get<Customer>(`/customers/${customerId}`),
        api.get<TransactionType[]>(`/customers/${customerId}/transactions`),
        api.get<ReceiptType[]>(`/customers/${customerId}/receipts`),
      ]);
      setCustomer(cRes.data);

      const txs = txRes.data;
      setTransactions(txs);
      setReceipts(rcRes.data);

      // fetch services names
      const uniqueSvc = Array.from(new Set(txs.map((t) => t.service_id)));
      const svcRes = await Promise.all(
        uniqueSvc.map((sid) => api.get<ServiceOut>(`/services/get/${sid}`))
      );
      setServicesMap(
        svcRes.reduce((m, r) => ({ ...m, [r.data.id]: r.data.name }), {})
      );
    } catch (err) {
      console.error("فشل في تحميل البيانات", err);
    } finally {
      setLoading(false);
    }
  }

  const totalDebt = transactions.reduce((s, t) => s + t.amount_foreign, 0);
  const totalPaid = receipts.reduce((s, r) => s + r.amount, 0);

  function generatePDF() {
    if (!customer) return;

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
      putOnlyUsedFonts: true,
    });
    doc.addFileToVFS("Amiri-Regular.ttf", AmiriRegular);
    doc.addFileToVFS("Amiri-Bold.ttf",   AmiriBold);
    doc.addFont("Amiri-Regular.ttf", "Amiri", "normal");
    doc.addFont("Amiri-Bold.ttf",   "Amiri", "bold");

    // title
    doc.setFont("Amiri", "bold");
    doc.setFontSize(16);
    doc.text(`${customer.name} :تقرير معاملات العميل`, 290, 20, { align: "right" });

    // table
    const head = [[
      "التاريخ","مرجع","الخدمة","نوع الدفع",
      "أجنبي","دينار","حالة","إلى","رقم","ملاحظات"
    ]];
    const body = [
      // all the normal transaction rows…
      ...transactions.map((t) => [
        new Date(t.created_at).toLocaleDateString("ar-LY"),
        t.reference,
        servicesMap[t.service_id] ?? `#${t.service_id}`,
        t.payment_type,
        t.amount_foreign.toString(),
        t.amount_lyd.toString(),
        t.status,
        t.to,
        t.number,
        t.notes || "-",
      ]),

      // receipts: merge columns 2–9 into one “Receipt” cell, leave amount in the last column
      ...receipts.map((r) => [
        // 1st column: date
        new Date(r.created_at).toLocaleDateString("ar-LY"),

        // 2nd cell: spans the next 8 columns (ref, service, pay‑type, foreign, lyd, status, to, number)
        {
          content: "سداد دفعة",
          colSpan: 8,
          styles:  {
        halign: "center",
        fontStyle: "bold" as const
      } as any,
        },

        // 3rd cell (actually ends up in the 10th column): the receipt amount
        r.amount.toString(),
      ]),
    ];

    autoTable(doc, {
      startY: 30,
      head,
      body,
      margin: { left: 10, right: 10 },
      styles:    { font: "Amiri", fontSize: 10, cellPadding: 3, halign: "right" },
      headStyles:{ font: "Amiri", fontStyle: "bold", fillColor: [245,245,245], textColor: [30,30,30], halign: "center" },
      alternateRowStyles: { fillColor: [250,250,250] },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFont("Amiri", "normal");
    doc.setFontSize(12);
    doc.text(`المجموع: دين ${totalDebt} — سداد ${totalPaid}`, 290, finalY, { align: "right" });

    doc.save(`report_customer_${customer.id}.pdf`);
  }

  if (loading || !customer) {
    return <p className="text-center py-8">جاري التحميل...</p>;
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <h2 className="text-2xl font-bold">{customer.name}</h2>
      <div className="flex flex-wrap gap-4 text-sm">
        <p>📞 {customer.phone}</p>
        <p>🏙️ {customer.city}</p>
        <p className="font-medium">💰 الرصيد: {customer.balance_due} LYD</p>
      </div>

      <Button onClick={generatePDF} className="mt-4">
        ⬇️ تحميل PDF
      </Button>

      <div className="overflow-x-auto mt-4">
        <table className="min-w-full table-fixed border-collapse text-sm text-right">
          <thead className="bg-gray-100 font-semibold">
            <tr>
              {[
                "تاريخ","مرجع","الخدمة","دفع","أجنبي","دينار","حالة",
                "إلى","رقم","ملاحظات"
              ].map((h) => (
                <th key={h} className="px-2 py-1">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.id} className="border-t hover:bg-gray-50">
                <td className="px-2 py-1">{new Date(t.created_at).toLocaleDateString("ar-LY")}</td>
                <td className="px-2 py-1">{t.reference}</td>
                <td className="px-2 py-1">{servicesMap[t.service_id]}</td>
                <td className="px-2 py-1">{t.payment_type}</td>
                <td className="px-2 py-1">{t.amount_foreign}</td>
                <td className="px-2 py-1">{t.amount_lyd}</td>
                <td className="px-2 py-1">{t.status}</td>
                {/* <td className="px-2 py-1">{t.employee_name}</td>
                <td className="px-2 py-1">{t.client_name}</td> */}
                <td className="px-2 py-1">{t.to}</td>
                <td className="px-2 py-1">{t.number}</td>
                <td className="px-2 py-1">{t.notes}</td>
              </tr>
            ))}
            {receipts.map((r) => (
              <tr key={r.id} className="border-t hover:bg-gray-50">
                <td className="px-2 py-1">{new Date(r.created_at).toLocaleDateString("ar-LY")}</td>
                <td colSpan={10} className="px-2 py-1 text-center">
                  سداد دفعة
                </td>
                <td className="px-2 py-1">{r.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

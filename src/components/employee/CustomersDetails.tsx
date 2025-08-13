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

/** صياغة رقمية إلى خانتين عشريتين (string) */
function to2(val: unknown): string {
  const num = typeof val === "number" ? val : parseFloat(String(val));
  return Number.isFinite(num) ? num.toFixed(2) : String(val ?? "");
}

export default function CustomerDetailsPage() {
  const { id } = useParams();
  const [customer, setCustomer]         = useState<Customer | null>(null);
  const [transactions, setTransactions] = useState<TransactionType[]>([]);
  const [receipts, setReceipts]         = useState<ReceiptType[]>([]);
  const [servicesMap, setServicesMap]   = useState<Record<number, string>>({});
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

      // جلب أسماء الخدمات المستعملة فقط
      const uniqueSvc = Array.from(new Set(txs.map((t) => t.service_id)));
      if (uniqueSvc.length) {
        const svcRes = await Promise.all(
          uniqueSvc.map((sid) => api.get<ServiceOut>(`/services/get/${sid}`))
        );
        setServicesMap(
          svcRes.reduce((m, r) => ({ ...m, [r.data.id]: r.data.name }), {})
        );
      } else {
        setServicesMap({});
      }
    } catch (err) {
      console.error("فشل في تحميل البيانات", err);
    } finally {
      setLoading(false);
    }
  }

  // إجماليات (نُنسِّق عند العرض فقط)
  const totalDebt = transactions.reduce((s, t) => s + t.amount_foreign, 0);
  const totalPaid = receipts.reduce((s, r) => s + r.amount, 0);

  // دمج في جدول واحد بترتيب زمني تصاعدي
  const combined =
    [
      ...transactions.map((t) => ({ kind: "tx" as const, dt: t.created_at, t })),
      ...receipts.map((r)    => ({ kind: "rcpt" as const, dt: r.created_at, r })),
    ].sort((a, b) => new Date(a.dt).getTime() - new Date(b.dt).getTime());

  function generatePDF() {
    if (!customer) return;

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
      putOnlyUsedFonts: true,
    });

    // خطوط عربية
    doc.addFileToVFS("Amiri-Regular.ttf", AmiriRegular);
    doc.addFileToVFS("Amiri-Bold.ttf",   AmiriBold);
    doc.addFont("Amiri-Regular.ttf", "Amiri", "normal");
    doc.addFont("Amiri-Bold.ttf",   "Amiri", "bold");

    // العنوان
    doc.setFont("Amiri", "bold");
    doc.setFontSize(16);
    doc.text(`${customer.name} :تقرير معاملات العميل`, 290, 20, { align: "right" });

    // رأس الجدول
    const head = [[
      "التاريخ","مرجع","الخدمة","نوع الدفع",
      "أجنبي","دينار","حالة","إلى","رقم","ملاحظات"
    ]];

    // جسم الجدول (مطابق للواجهة — بدون colSpan في السداد)
    const body = combined.map((row) => {
      if (row.kind === "tx") {
        const t = row.t;
        return [
          new Date(t.created_at).toLocaleDateString("ar-LY"),
          t.reference,
          servicesMap[t.service_id] ?? `#${t.service_id}`,
          t.payment_type,
          to2(t.amount_foreign),
          to2(t.amount_lyd),
          t.status,
          t.to,
          t.number,
          t.notes || "-",
        ];
      } else {
        const r = row.r;
        return [
          new Date(r.created_at).toLocaleDateString("ar-LY"), // التاريخ
          "",                          // مرجع
          "",                          // الخدمة
          "سداد دفعة",                 // نوع الدفع
          "",                          // أجنبي
          to2(r.amount),               // دينار
          "تم السداد",                 // حالة
          "",                          // إلى
          "",                          // رقم
          "-",                         // ملاحظات
        ];
      }
    });

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
    doc.text(`المجموع: دين ${to2(totalDebt)} — سداد ${to2(totalPaid)}`, 290, finalY, { align: "right" });

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
        <p className="font-medium">💰 الرصيد: {to2(customer.balance_due)} LYD</p>
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
            {combined.map((row) =>
              row.kind === "tx" ? (
                <tr key={`tx-${row.t.id}`} className="border-t hover:bg-gray-50">
                  <td className="px-2 py-1">{new Date(row.t.created_at).toLocaleDateString("ar-LY")}</td>
                  <td className="px-2 py-1">{row.t.reference}</td>
                  <td className="px-2 py-1">{servicesMap[row.t.service_id] ?? `#${row.t.service_id}`}</td>
                  <td className="px-2 py-1">{row.t.payment_type}</td>
                  <td className="px-2 py-1">{to2(row.t.amount_foreign)}</td>
                  <td className="px-2 py-1 font-semibold">{to2(row.t.amount_lyd)}</td>
                  <td className="px-2 py-1">{row.t.status}</td>
                  <td className="px-2 py-1">{row.t.to}</td>
                  <td className="px-2 py-1">{row.t.number}</td>
                  <td className="px-2 py-1">{row.t.notes || "-"}</td>
                </tr>
              ) : (
                <tr key={`rcpt-${row.r.id}`} className="border-t hover:bg-gray-50">
                  <td className="px-2 py-1">{new Date(row.r.created_at).toLocaleDateString("ar-LY")}</td>
                  <td className="px-2 py-1 text-muted-foreground">—</td>
                  <td className="px-2 py-1 text-muted-foreground">—</td>
                  <td className="px-2 py-1">
                    <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium bg-amber-50 border-amber-200">
                      سداد دفعة
                    </span>
                  </td>
                  <td className="px-2 py-1 text-muted-foreground">—</td>
                  <td className="px-2 py-1 font-semibold text-green-700">{to2(row.r.amount)}</td>
                  <td className="px-2 py-1">
                    <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium bg-green-50 border-green-200">
                      ✓ تم السداد
                    </span>
                  </td>
                  <td className="px-2 py-1 text-muted-foreground">—</td>
                  <td className="px-2 py-1 text-muted-foreground">—</td>
                  <td className="px-2 py-1 text-muted-foreground">—</td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

"use client";
import React, { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { AmiriRegular } from "@/fonts/AmiriRegular";
import { AmiriBold } from "@/fonts/AmiriBold";
import { to2 } from "@/lib/utils";

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

// match your ServiceOut response-model
type ServiceOut = {
  id: number;
  name: string;
};

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [transactions, setTransactions] = useState<TransactionType[]>([]);
  const [receipts, setReceipts] = useState<ReceiptType[]>([]);
  const [servicesMap, setServicesMap] = useState<Record<number, string>>({});
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  async function fetchCustomers() {
    setLoading(true);
    try {
      const res = await api.get<Customer[]>("/customers/get");
      setCustomers(res.data);
    } catch {
      toast.error("فشل في جلب العملاء");
    } finally {
      setLoading(false);
    }
  }

  async function fetchCustomerDetails(customer: Customer) {
    setLoadingDetails(true);
    setSelectedCustomer(customer);

    try {
      // 1) fetch transactions & receipts
      const [txRes, rcRes] = await Promise.all([
        api.get<TransactionType[]>(`/customers/${customer.id}/transactions`),
        api.get<ReceiptType[]>(`/customers/${customer.id}/receipts`),
      ]);

      const txData = txRes.data;
      setTransactions(txData);
      setReceipts(rcRes.data);

      // 2) extract unique service_ids
      const serviceIds = Array.from(new Set(txData.map((t) => t.service_id)));

      // 3) fetch each service’s details
      const services = await Promise.all(
        serviceIds.map((sid) => api.get<ServiceOut>(`/services/get/${sid}`))
      );

      // 4) build the map
      const map: Record<number, string> = {};
      services.forEach((s) => {
        map[s.data.id] = s.data.name;
      });
      setServicesMap(map);

    } catch {
      toast.error("فشل في جلب بيانات المعاملات والخدمات");
    } finally {
      setLoadingDetails(false);
    }
  }

  const totalDebt = transactions.reduce((sum, t) => sum + t.amount_foreign, 0);
  const totalPaid = receipts.reduce((sum, r) => sum + r.amount, 0);

  function generatePDF() {
    if (!selectedCustomer) return;

    const doc = new jsPDF({
     orientation: "landscape",
     unit: "mm",
     format: "a4",
     putOnlyUsedFonts: true,
   });
    doc.addFileToVFS("Amiri-Regular.ttf", AmiriRegular);
    doc.addFileToVFS("Amiri-Bold.ttf", AmiriBold);
    doc.addFont("Amiri-Regular.ttf", "Amiri", "normal");
    doc.addFont("Amiri-Bold.ttf", "Amiri", "bold");

    doc.setFont("Amiri", "bold");
    doc.setFontSize(16);
    doc.text(
      `${selectedCustomer.name} :تقرير معاملات العميل`,
      200,
      20,
      { align: "right" }
    );

    const head = [[
      "التاريخ","المرجع","الخدمة","نوع الدفع",
      "أجنبي","ليرة","الحالة","الموظف","العميل","إلى","رقم","ملاحظات"
    ]];

    const body = transactions.map((t) => [
      new Date(t.created_at).toLocaleDateString("ar-LY"),
      t.reference,
      servicesMap[t.service_id] || `#${t.service_id}`,
      t.payment_type,
      t.amount_foreign.toString(),
      to2(t.amount_lyd).toString(),
      t.status,
      t.employee_name,
      t.client_name || "-",
      t.to,
      t.number,
      t.notes || "-",
    ]);

    autoTable(doc, {
      startY: 30,
      head,
      body,
      margin: { left: 10, right: 10 },
      styles: { font: "Amiri", fontSize: 10, cellPadding: 3, halign: "right" },
      headStyles: { font: "Amiri", fontStyle: "bold", fillColor: [245,245,245], textColor: [30,30,30], halign: "center" },
      alternateRowStyles: { fillColor: [250,250,250] },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFont("Amiri", "normal");
    doc.setFontSize(12);
    doc.text(
      `المجموع: دين ${totalDebt} — سداد ${totalPaid}`,
      200,
      finalY,
      { align: "right" }
    );

    doc.save(`report_customer_${selectedCustomer.id}.pdf`);
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">قائمة العملاء</h2>

      {loading ? (
        <p>جاري التحميل...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full table-fixed border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 text-left text-sm">الاسم</th>
                <th className="px-4 py-2 text-left text-sm">الهاتف</th>
                <th className="px-4 py-2 text-left text-sm">المدينة</th>
                <th className="px-4 py-2 text-right text-sm">الرصيد</th>
                <th className="px-4 py-2 text-center text-sm">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="px-4 py-2 text-left text-sm">{c.name}</td>
                  <td className="px-4 py-2 text-left text-sm">{c.phone}</td>
                  <td className="px-4 py-2 text-left text-sm">{c.city}</td>
                  <td className="px-4 py-2 text-right text-sm">{c.balance_due} LYD</td>
                  <td className="px-4 py-2 text-center text-sm">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => fetchCustomerDetails(c)}
                        >
                          عرض
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="w-full max-w-xl h-[80vh] overflow-auto">
                        <DialogHeader>
                          <DialogTitle>
                            معاملات {selectedCustomer?.name}
                          </DialogTitle>
                        </DialogHeader>

                        {loadingDetails ? (
                          <p>جاري جلب البيانات...</p>
                        ) : (
                          <div className="space-y-4">
                            <div className="overflow-x-auto">
                              <table className="min-w-max table-fixed border-collapse">
                                <thead>
                                  <tr className="bg-gray-100">
                                    {["تاريخ","مرجع","الخدمة","دفع","أجنبي","دينار ليبي","حالة","إلى","رقم","ملاحظات"]
                                      .map((h) => (
                                        <th key={h} className="px-2 py-1 text-sm">{h}</th>
                                      ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {transactions.map((t) => (
                                    <tr key={t.id} className="border-t">
                                      <td className="px-2 py-1 text-sm">{new Date(t.created_at).toLocaleDateString("ar-LY")}</td>
                                      <td className="px-2 py-1 text-sm">{t.reference}</td>
                                      <td className="px-2 py-1 text-sm">{servicesMap[t.service_id] || `#${t.service_id}`}</td>
                                      <td className="px-2 py-1 text-sm">{t.payment_type}</td>
                                      <td className="px-2 py-1 text-sm">{t.amount_foreign}</td>
                                      <td className="px-2 py-1 text-sm">{t.amount_lyd}</td>
                                      <td className="px-2 py-1 text-sm">{t.status}</td>
                                      {/* <td className="px-2 py-1 text-sm">{t.employee_name}</td>
                                      <td className="px-2 py-1 text-sm">{t.client_name || "-"}</td> */}
                                      <td className="px-2 py-1 text-sm">{t.to}</td>
                                      <td className="px-2 py-1 text-sm">{t.number}</td>
                                      <td className="px-2 py-1 text-sm">{t.notes || "-"}</td>
                                    </tr>
                                  ))}
                                  {receipts.map((r) => (
                                    <tr key={`rc-${r.id}`} className="border-t">
                                      <td className="px-2 py-1 text-sm">{new Date(r.created_at).toLocaleDateString("ar-LY")}</td>
                                      <td colSpan={10} className="px-2 py-1 text-center text-sm">سداد دفعة</td>
                                      <td className="px-2 py-1 text-sm">{r.amount}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            <div className="text-right font-medium">
                              المجموع: دين {totalDebt} — سداد {totalPaid}
                            </div>
                            <Button onClick={generatePDF} className="w-full">
                              ⬇️ تحميل PDF
                            </Button>
                          </div>
                        )}

                      </DialogContent>
                    </Dialog>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

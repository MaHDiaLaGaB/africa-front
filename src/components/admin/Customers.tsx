"use client";
import React, { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import api from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// import your converted font Base64
import { AmiriRegular } from "@/fonts/AmiriRegular";
import { AmiriBold } from "@/fonts/AmiriBold";

type Customer = { id: number; name: string; phone: string; city: string; balance_due: number; };
type TransactionType = { id: number; amount_foreign: number; created_at: string; };
type ReceiptType = { id: number; amount: number; created_at: string; };

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer|null>(null);
  const [transactions, setTransactions] = useState<TransactionType[]>([]);
  const [receipts, setReceipts] = useState<ReceiptType[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => { fetchCustomers(); }, []);

  async function fetchCustomers() {
    setLoading(true);
    try {
      const res = await api.get("/customers/get");
      setCustomers(res.data);
    } catch {
      toast.error("فشل في جلب العملاء");
    } finally {
      setLoading(false);
    }
  }

  async function fetchCustomerDetails(id: number) {
    setLoadingDetails(true);
    try {
      const [tx, rc] = await Promise.all([
        api.get(`/customers/${id}/transactions`),
        api.get(`/customers/${id}/receipts`),
      ]);
      setTransactions(tx.data);
      setReceipts(rc.data);
    } catch {
      toast.error("فشل في جلب معاملات العميل");
    } finally {
      setLoadingDetails(false);
    }
  }

  const totalDebt = transactions.reduce((sum, t) => sum + t.amount_foreign, 0);
  const totalPaid = receipts.reduce((sum, r) => sum + r.amount, 0);

  function generatePDF() {
    if (!selectedCustomer) return;

    // 1) create the document
    const doc = new jsPDF({ putOnlyUsedFonts: true });
    doc.addFileToVFS("Amiri-Regular.ttf", AmiriRegular);
    doc.addFileToVFS("Amiri-Bold.ttf",    AmiriBold);
    doc.addFont("Amiri-Regular.ttf", "Amiri", "normal");
    doc.addFont("Amiri-Bold.ttf",    "Amiri", "bold");

    // 2) title
    doc.setFont("Amiri", "bold"); 
    doc.setFontSize(16);
    doc.text(
        `${selectedCustomer.name} :تقرير معاملات العميل `,
        200,
        20,
        { align: "right" }
    );

    // 3) table data
    const head = [["التاريخ", "القيمة", "النوع"]];
    const body = [
        ...transactions.map(t => [
        new Date(t.created_at).toLocaleDateString("ar-LY"),
        t.amount_foreign.toString(),
        "دين",
        ]),
        ...receipts.map(r => [
        new Date(r.created_at).toLocaleDateString("ar-LY"),
        r.amount.toString(),
        "سداد",
        ]),
    ];

    // 4) draw the table
    autoTable(doc, {
        startY: 30,
        head,
        body,
        margin: { left: 10, right: 10 },
        styles: {
            font: "Amiri",        // enforce Arabic font everywhere
            fontSize: 12,
            cellPadding: 4,
            halign: "right",      // right-align all cells
            valign: "middle",
            },
        headStyles: {
            font: "Amiri",
            fontStyle: "bold",
            fillColor: [245, 245, 245],
            textColor: [30, 30, 30],
            halign: "center",     // center header text
            },
        alternateRowStyles: { // subtle zebra stripes
        fillColor: [250, 250, 250],
        },
        columnStyles: {
        0: { cellWidth: 50 }, // التاريخ
        1: { cellWidth: 40 }, // القيمة
        2: { cellWidth: 30 }, // النوع
        },
        // didParseCell: (data) => {
        // // make absolutely sure every cell uses Amiri
        // data.cell.styles.font = "Amiri";
        // },
    });

  // 5) summary below table
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFont("Amiri", "normal"); 
  doc.setFontSize(12);
  doc.text(
    `المجموع: دين ${totalDebt} — سداد ${totalPaid}`,
    200,
    finalY,
    { align: "right" }
  );

  // 6) save
  doc.save(`report_customer_${selectedCustomer.id}.pdf`);
}

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">قائمة العملاء</h2>
      {loading ? (
        <p>جاري التحميل...</p>
      ) : (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {customers.map(c => (
            <Card key={c.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4 space-y-2">
                <h3 className="font-semibold truncate">{c.name}</h3>
                <p className="text-sm text-muted-foreground">📞 {c.phone}</p>
                <p className="text-sm text-muted-foreground">🏙️ {c.city}</p>
                <p className="text-sm">
                  💸 الرصيد المستحق: <span className="font-bold">{c.balance_due} LYD</span>
                </p>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2 w-full"
                      onClick={() => {
                        setSelectedCustomer(c);
                        fetchCustomerDetails(c.id);
                      }}
                    >
                      📑 عرض المعاملات
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg w-full">
                    <DialogHeader>
                      <DialogTitle>معاملات {selectedCustomer?.name}</DialogTitle>
                    </DialogHeader>
                    {loadingDetails ? (
                      <p>جاري جلب البيانات...</p>
                    ) : (
                      <div className="space-y-4">
                        {/* …transactions & receipts lists… */}
                        <Button onClick={generatePDF} className="w-full">
                          ⬇️ تحميل PDF
                        </Button>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

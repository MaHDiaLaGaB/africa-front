// components/employee/ReceiptOrdersPage.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { to2 } from "@/lib/utils"; // Import the to2 function


export default function ReceiptOrdersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  
  const selectedCustomer = customers.find(c => String(c.id) === selectedCustomerId);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchAll = async () => {
    const [c, r] = await Promise.all([
      api.get("/customers/get"),
      api.get("/receipts/get"),
    ]);
    setCustomers(c.data);
    setReceipts(r.data);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // 🔎 Build a name lookup: id -> name
  const nameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of customers) m.set(String(c.id), c.name);
    return m;
  }, [customers]);

  const handleSubmit = async () => {
    if (!selectedCustomerId || !amount) {
      toast.error("يرجى اختيار عميل وتحديد المبلغ");
      return;
    }

    setLoading(true);
    try {
      await api.post("/receipts/create", {
        customer_id: Number(selectedCustomerId),
        amount: parseFloat(amount),
      });
      toast.success("✅ تم تسجيل أمر القبض");
      setAmount("");
      setSelectedCustomerId("");
      fetchAll();
    } catch {
      toast.error("فشل في تسجيل أمر القبض");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6 max-w-screen-lg mx-auto">
      <h1 className="text-2xl font-bold">💸 أوامر القبض</h1>

      <Card className="p-4 sm:p-6 space-y-4">
        <h2 className="text-lg font-semibold">➕ تسجيل أمر قبض جديد</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>العميل</Label>
            <Select
              value={selectedCustomerId}
              onValueChange={(val) => setSelectedCustomerId(val)}
            >
              <SelectTrigger className="w-full">
                {selectedCustomer
                  ? `${selectedCustomer.name} (${selectedCustomer.phone})`
                  : "اختيار العميل"}
              </SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name} ({c.phone}) - 💰 {to2(c.balance_due)} LYD
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>المبلغ المستلم</Label>
            <Input
              type="number"
              className="w-full"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="مثال: 200"
            />
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full sm:w-auto"
        >
          {loading ? "جاري المعالجة..." : "تسجيل الأمر"}
        </Button>
      </Card>

      <Card className="p-4 sm:p-6 space-y-4">
        <h2 className="text-lg font-semibold">📃 سجل أوامر القبض</h2>
        {receipts.length === 0 ? (
          <p className="text-muted-foreground text-sm">لا توجد أوامر حتى الآن.</p>
        ) : (
          <ul className="space-y-2">
            {receipts.map((r) => {
              // 🧠 Try several fields; fall back to the lookup via customer_id
              const displayName =
                r.name ??
                r.customer_name ??
                r.customer?.name ??
                nameById.get(String(r.customer_id)) ??
                "غير معروف";

              return (
                <li key={r.id} className="border p-2 sm:p-4 rounded">
                  <p className="text-sm sm:text-base">📥 {to2(r.amount)} LYD</p>
                  <p className="text-sm sm:text-base">👤 العميل: {displayName}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    📅 {new Date(r.created_at).toLocaleDateString("ar-LY")}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}

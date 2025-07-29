// components/employee/ReceiptOrdersPage.tsx
"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function ReceiptOrdersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
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
                {selectedCustomerId || "اختيار العميل"}
              </SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={String(c.name)}>
                    {c.name} ({c.phone}) - 💰 {c.balance_due} LYD
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
            {receipts.map((r) => (
              <li key={r.id} className="border p-2 sm:p-4 rounded">
                <p className="text-sm sm:text-base">📥 {r.amount} LYD</p>
                <p className="text-sm sm:text-base">👤 العميل: #{r.customer_id}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  📅 {new Date(r.created_at).toLocaleDateString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

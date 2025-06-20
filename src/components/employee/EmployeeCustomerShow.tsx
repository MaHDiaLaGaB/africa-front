// components/employee/CustomerDetailsPage.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function CustomerDetailsPage() {
  const { id } = useParams();
  const [customer, setCustomer] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);

  const [form, setForm] = useState({
    service_id: "",
    amount_foreign: "",
    name: "",
    to: "",
    number: "",
  });
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    const [c, t, r, s] = await Promise.all([
      api.get(`/customers/${id}`),
      api.get(`/customers/${id}/transactions`),
      api.get(`/customers/${id}/receipts`),
      api.get("/services/get/available"),
    ]);
    setCustomer(c.data);
    setTransactions(t.data);
    setReceipts(r.data);
    setServices(s.data);
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const calcLYD = () => {
    const amount = parseFloat(form.amount_foreign);
    const service = services.find((s) => s.id === Number(form.service_id));
    if (!amount || !service) return 0;
    return service.operation === "multiply"
      ? amount * service.price
      : amount / service.price;
  };

  const parseClipboardMessage = (text: string) => {
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const number = lines.find((line) => /^\d{7,}$/.test(line)) || "";
    const name = lines.length >= 2 ? lines[1] : "";
    const to = lines.length >= 3 ? lines[2] : "";

    setForm((prev) => ({
      ...prev,
      number,
      name,
      to,
    }));
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      parseClipboardMessage(text);
      toast.success("✅ تم لصق البيانات");
    } catch {
      toast.error("❌ فشل في القراءة من الحافظة");
    }
  };

  const handleCreditTransfer = async () => {
    const { name, to, number, amount_foreign, service_id } = form;

    if (!name || !to || !number || !amount_foreign || !service_id) {
      toast.error("يرجى تعبئة جميع الحقول");
      return;
    }

    setLoading(true);
    try {
      await api.post("/transactions/create", {
        customer_id: Number(id),
        name,
        to,
        number,
        amount_foreign: parseFloat(amount_foreign),
        service_id: Number(service_id),
        payment_type: "credit",
      });
      toast.success("✅ تمت الحوالة بنجاح");
      fetchData();
      setForm({ service_id: "", amount_foreign: "", name: "", to: "", number: "" });
    } catch {
      toast.error("فشل في تنفيذ الحوالة");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6 max-w-screen-lg mx-auto">
      {customer && (
        <Card className="p-4 sm:p-6 space-y-2">
          <h2 className="text-xl font-bold truncate">{customer.name}</h2>
          <p className="text-sm sm:text-base">📞 {customer.phone}</p>
          <p className="text-sm sm:text-base">🏙️ {customer.city}</p>
          <p className="text-sm sm:text-base">
            💰 الرصيد المستحق: {customer.balance_due} LYD
          </p>
        </Card>
      )}

      <div className="flex justify-end">
        <Dialog>
          <DialogTrigger asChild>
            <Button className="text-sm sm:text-base">➕ تنفيذ حوالة بالدين</Button>
          </DialogTrigger>
          <DialogContent className="w-full max-w-full sm:max-w-md p-4 sm:p-6 space-y-4">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">
                حوالة جديدة للعميل
              </DialogTitle>
            </DialogHeader>

            <Button
              variant="secondary"
              className="w-full sm:w-auto"
              onClick={handlePaste}
            >
              📋 لصق من WhatsApp
            </Button>

            <div>
              <Label>الخدمة</Label>
              <select
                value={form.service_id}
                onChange={(e) => setForm({...form, service_id: e.target.value})}
                className="w-full border rounded px-3 py-2 text-sm"
              >
                <option value="">اختر الخدمة</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.price}{" "}
                    {s.operation === "multiply" ? "✖️" : "➗"})
                  </option>
                ))}
              </select>
            </div>

            <Input
              className="w-full"
              placeholder="اسم المرسل"
              value={form.name}
              onChange={(e) => setForm({...form, name: e.target.value})}
            />
            <Input
              className="w-full"
              placeholder="المدينة أو البنك"
              value={form.to}
              onChange={(e) => setForm({...form, to: e.target.value})}
            />
            <Input
              className="w-full"
              placeholder="رقم الهاتف أو الحساب"
              value={form.number}
              onChange={(e) => setForm({...form, number: e.target.value})}
            />
            <Input
              className="w-full"
              type="number"
              placeholder="المبلغ بالعملة الأجنبية"
              value={form.amount_foreign}
              onChange={(e) => setForm({...form, amount_foreign: e.target.value})}
            />

            <p className="text-sm text-muted-foreground">
              💰 القيمة بالدينار الليبي: {calcLYD().toFixed(2)} LYD
            </p>

            <Button
              className="w-full sm:w-auto"
              onClick={handleCreditTransfer}
              disabled={loading}
            >
              {loading ? "جاري التنفيذ..." : "تأكيد الحوالة"}
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="p-4 sm:p-6 space-y-2">
        <h3 className="text-lg font-semibold">🧾 الحوالات بالدين</h3>
        {transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground">لا توجد حوالات.</p>
        ) : (
          <ul className="space-y-2">
            {transactions.map((t) => (
              <li key={t.id} className="border p-2 sm:p-4 rounded">
                <p className="text-sm sm:text-base">
                  💵 {t.amount_foreign} {t.currency?.symbol} = {t.amount_lyd} LYD
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  📅 {new Date(t.created_at).toLocaleDateString()}
                </p>
                <p className="text-sm sm:text-base">
                  🔗 الخدمة: {t.service?.name}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="p-4 sm:p-6 space-y-2">
        <h3 className="text-lg font-semibold">💸 أوامر القبض</h3>
        {receipts.length === 0 ? (
          <p className="text-sm text-muted-foreground">لا توجد دفعات.</p>
        ) : (
          <ul className="space-y-2">
            {receipts.map((r) => (
              <li key={r.id} className="border p-2 sm:p-4 rounded">
                <p className="text-sm sm:text-base">📥 {r.amount} LYD</p>
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

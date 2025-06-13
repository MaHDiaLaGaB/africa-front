"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Currency {
  id: number;
  name: string;
  symbol: string;
  exchange_rate: number;
  cost_per_unit: number;
  stock: number;
  is_active: boolean;
}

export default function AdminCurrenciesPage() {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [editCurrency, setEditCurrency] = useState<Currency | null>(null);
  const [form, setForm] = useState({
    name: "",
    symbol: "",
    exchange_rate: "",
    cost_per_unit: "",
    stock: "",
  });

  const fetchCurrencies = async () => {
    const res = await api.get("/currency/currencies/get");
    setCurrencies(res.data);
  };

  useEffect(() => {
    fetchCurrencies();
  }, []);

  const handleAdd = async () => {
    try {
      await api.post("/currency/currencies/create", {
        ...form,
        exchange_rate: parseFloat(form.exchange_rate),
        cost_per_unit: parseFloat(form.cost_per_unit),
      });
      toast.success("✅ تم إضافة العملة");
      setForm({ name: "", symbol: "", exchange_rate: "", cost_per_unit: "", stock: "" });
      fetchCurrencies();
    } catch {
      toast.error("فشل في إضافة العملة");
    }
  };

  const handleUpdate = async () => {
    try {
      await api.put(`/currency/currencies/${editCurrency?.id}`, {
        exchange_rate: editCurrency?.exchange_rate,
        cost_per_unit: editCurrency?.cost_per_unit,
      });
      toast.success("✅ تم التحديث");
      setEditCurrency(null);
      fetchCurrencies();
    } catch {
      toast.error("خطأ في التحديث");
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">إدارة العملات</h1>

      {/* إضافة عملة جديدة */}
      <Card className="p-4 space-y-4">
        <h2 className="text-lg font-semibold">➕ إضافة عملة</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <Label>اسم العملة</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <Label>الرمز (USD, EUR...)</Label>
            <Input
              value={form.symbol}
              onChange={(e) => setForm({ ...form, symbol: e.target.value })}
            />
          </div>
          <div>
            <Label>سعر البيع</Label>
            <Input
              type="number"
              value={form.exchange_rate}
              onChange={(e) => setForm({ ...form, exchange_rate: e.target.value })}
            />
          </div>
          <div>
            <Label>التكلفة</Label>
            <Input
              type="number"
              value={form.cost_per_unit}
              onChange={(e) => setForm({ ...form, cost_per_unit: e.target.value })}
            />
          </div>
          <div>
            <Label>الرصيد الأولي</Label>
            <Input
              type="number"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
            />
          </div>
        </div>
        <Button
          className="w-full sm:w-auto mt-2"
          onClick={handleAdd}
        >
          إضافة
        </Button>
      </Card>

      {/* قائمة العملات */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {currencies.map((c) => (
          <Card key={c.id} className="p-4 space-y-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
              <h3 className="text-lg font-semibold">
                {c.name} ({c.symbol})
              </h3>
              <span className="text-sm text-muted-foreground mt-1 sm:mt-0">
                {c.is_active ? "✅ فعالة" : "⛔ غير فعالة"}
              </span>
            </div>
            <p>سعر البيع: {c.exchange_rate} LYD</p>
            <p>التكلفة: {c.cost_per_unit} LYD</p>
            <p>الرصيد: {c.stock}</p>
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => setEditCurrency(c)}
                >
                  تعديل
                </Button>
              </DialogTrigger>
              <DialogContent className="space-y-4 max-w-md w-full">
                <DialogTitle>تعديل {c.name}</DialogTitle>
                <Label>سعر البيع</Label>
                <Input
                  type="number"
                  value={editCurrency?.exchange_rate ?? ""}
                  onChange={(e) =>
                    setEditCurrency((cur) =>
                      cur
                        ? { ...cur, exchange_rate: parseFloat(e.target.value) }
                        : null
                    )
                  }
                />
                <Label>التكلفة</Label>
                <Input
                  type="number"
                  value={editCurrency?.cost_per_unit ?? ""}
                  onChange={(e) =>
                    setEditCurrency((cur) =>
                      cur
                        ? { ...cur, cost_per_unit: parseFloat(e.target.value) }
                        : null
                    )
                  }
                />
                <Button onClick={handleUpdate} className="w-full">
                  حفظ التغييرات
                </Button>
              </DialogContent>
            </Dialog>
          </Card>
        ))}
      </div>
    </div>
  );
}

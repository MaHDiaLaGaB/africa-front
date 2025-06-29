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
  stock: number;
  is_active: boolean;
}

export default function AdminCurrenciesPage() {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [newForm, setNewForm] = useState({ name: "", symbol: "" });
  const [addModalCurrency, setAddModalCurrency] = useState<Currency | null>(null);
  const [lotForm, setLotForm] = useState({ quantity: "", cost_per_unit: "" });

  const fetchCurrencies = async () => {
    try {
      const res = await api.get("/currency/currencies/get");
      setCurrencies(res.data);
    } catch {
      toast.error("فشل في جلب العملات");
    }
  };

  useEffect(() => {
    fetchCurrencies();
  }, []);

  const handleAddCurrency = async () => {
    try {
      await api.post("/currency/currencies/create", {
        name: newForm.name,
        symbol: newForm.symbol,
      });
      toast.success("✅ تم إضافة العملة");
      setNewForm({ name: "", symbol: "" });
      fetchCurrencies();
    } catch {
      toast.error("فشل في إضافة العملة");
    }
  };

  const handleAddStock = async () => {
    if (!addModalCurrency) return;
    try {
      await api.post(
        `/currency/currencies/${addModalCurrency.id}/lots`,
        {
          quantity: parseFloat(lotForm.quantity),
          cost_per_unit: parseFloat(lotForm.cost_per_unit),
        }
      );
      toast.success("✅ تم إضافة الرصيد");
      setAddModalCurrency(null);
      setLotForm({ quantity: "", cost_per_unit: "" });
      fetchCurrencies();
    } catch {
      toast.error("فشل في إضافة الرصيد");
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">إدارة العملات</h1>

      {/* إضافة عملة جديدة */}
      <Card className="p-4 space-y-4">
        <h2 className="text-lg font-semibold">➕ إضافة عملة</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>اسم العملة</Label>
            <Input
              value={newForm.name}
              onChange={(e) =>
                setNewForm((f) => ({ ...f, name: e.target.value }))
              }
            />
          </div>
          <div>
            <Label>الرمز (USD, EUR...)</Label>
            <Input
              value={newForm.symbol}
              onChange={(e) =>
                setNewForm((f) => ({ ...f, symbol: e.target.value }))
              }
            />
          </div>
        </div>
        <Button className="w-full sm:w-auto mt-2" onClick={handleAddCurrency}>
          إضافة
        </Button>
      </Card>

      {/* قائمة العملات */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {currencies.map((c) => (
          <Card key={c.id} className="p-4 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                {c.name} ({c.symbol})
              </h3>
              <span className="text-sm text-muted-foreground">
                {c.is_active ? "✅ فعالة" : "⛔ غير فعالة"}
              </span>
            </div>
            <p>الرصيد: {c.stock}</p>

            {/* حوار إضافة الرصيد */}
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => setAddModalCurrency(c)}
                >
                  ➕ رصيد
                </Button>
              </DialogTrigger>
              <DialogContent className="space-y-4 max-w-md w-full">
                <DialogTitle>إضافة رصيد لـ {c.name}</DialogTitle>

                <Label>الكمية</Label>
                <Input
                  type="number"
                  value={lotForm.quantity}
                  onChange={(e) =>
                    setLotForm((f) => ({ ...f, quantity: e.target.value }))
                  }
                />

                <Label>سعر التكلفة للوحدة</Label>
                <Input
                  type="number"
                  value={lotForm.cost_per_unit}
                  onChange={(e) =>
                    setLotForm((f) => ({ ...f, cost_per_unit: e.target.value }))
                  }
                />

                <Button onClick={handleAddStock} className="w-full">
                  حفظ
                </Button>
              </DialogContent>
            </Dialog>
          </Card>
        ))}
      </div>
    </div>
  );
}

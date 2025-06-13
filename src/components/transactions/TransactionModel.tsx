"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";

interface TransactionModalProps {
  service: {
    id: number;
    name: string;
    price: number;
    operation: "multiply" | "divide";
    currency_id: number;
  };
  onSuccess?: () => void;
}

export function TransactionModal({
  service,
  onSuccess,
}: TransactionModalProps) {
  const { user } = useAuth();
  const [amount, setAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [open, setOpen] = useState(false);

  const calculateLYD = (val: number) => {
    if (service.operation === "multiply") return val * service.price;
    return val / service.price;
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await api.post("/transactions", {
        service_id: service.id,
        amount_foreign: amount,
        payment_type: "cash",
      });
      setResult(res.data.amount_lyd);
      onSuccess?.();
    } catch (err) {
      console.error("Transaction error", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">تنفيذ عملية</Button>
      </DialogTrigger>
      <DialogContent className="space-y-4">
        <DialogHeader>
          <DialogTitle>تنفيذ حوالة - {service.name}</DialogTitle>
        </DialogHeader>

        <Input
          type="number"
          placeholder="قيمة المبلغ بالعملة الأجنبية"
          value={amount}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            setAmount(isNaN(val) ? 0 : val);
            setResult(null);
          }}
        />

        {amount > 0 && (
          <div className="text-sm text-muted-foreground">
            المبلغ المطلوب: {calculateLYD(amount).toFixed(2)} LYD
          </div>
        )}

        {result && (
          <div className="text-green-600 font-semibold">
            ✅ تمت العملية بنجاح، المبلغ بالدينار: {result} LYD
          </div>
        )}

        <Button
          disabled={loading || amount <= 0}
          onClick={handleSubmit}
          className="w-full"
        >
          {loading ? "...جاري التنفيذ" : "تأكيد وتنفيذ"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

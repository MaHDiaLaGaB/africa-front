// components/TransactionStatusModal.tsx
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectItem,
  SelectContent,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { toast } from "sonner";

export default function TransactionStatusModal({
  transactionId,
  onSuccess,
}: {
  transactionId: number;
  onSuccess: (newStatus: string) => void; // <-- updated signature
}) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("");
  const [reason, setReason] = useState("");

  const handleSave = async () => {
    if (!status) {
      toast.error("الرجاء اختيار الحالة");
      return;
    }

    try {
      await api.put(`/admintx/transaction/${transactionId}/status`, {
        status,
        reason: reason || undefined,
      });
      toast.success("✅ تم تحديث الحالة");
      setOpen(false);
      onSuccess(status);              // <-- pass the new status back
      setStatus("");
      setReason("");
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "فشل في تحديث الحالة");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="text-sm sm:text-base">
          📝 تغيير الحالة
        </Button>
      </DialogTrigger>

      <DialogContent className="w-full max-w-full sm:max-w-md p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            تحديث حالة العملية #{transactionId}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="اختر الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">⏳ قيد الانتظار</SelectItem>
              <SelectItem value="completed">✅ مكتمل</SelectItem>
              <SelectItem value="cancelled">❌ ملغي</SelectItem>
              <SelectItem value="returned">🔁 مسترجع</SelectItem>
            </SelectContent>
          </Select>

          <Input
            placeholder="سبب التغيير (اختياري)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full"
          />

          <Button onClick={handleSave} className="w-full sm:w-auto">
            حفظ التغييرات
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

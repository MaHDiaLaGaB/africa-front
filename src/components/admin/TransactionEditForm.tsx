// components/admin/TransactionEditForm.tsx
"use client";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue
} from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";

export enum PaymentType { cash = "cash", credit = "credit" }
export enum TransactionStatus { pending = "pending", completed = "completed", cancelled = "cancelled" }

export interface Transaction {
  id: number;
  reference: string;
  amount_foreign: number;
  amount_lyd: number;
  service_id: number;
  customer_name?: string;
  number?: string;
  payment_type: PaymentType;
  to?: string;
  status: TransactionStatus;
  status_reason?: string;
  notes?: string;
  created_at: string;
  employee_name: string;
  client_name?: string;
}

interface TransactionEditModalProps {
  txn: Transaction;
  onSaved: () => void;
}

export function TransactionEditModal({ txn, onSaved }: TransactionEditModalProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    reference: txn.reference,
    client_name: txn.client_name ?? "",
    customer_name: txn.customer_name ?? "",
    to: txn.to ?? "",
    number: txn.number ?? "",
    amount_foreign: txn.amount_foreign,
    payment_type: txn.payment_type,
    status: txn.status,
    status_reason: txn.status_reason ?? "",
    notes: txn.notes ?? "",
    created_at: txn.created_at,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({
        reference: txn.reference,
        client_name: txn.client_name ?? "",
        customer_name: txn.customer_name ?? "",
        to: txn.to ?? "",
        number: txn.number ?? "",
        amount_foreign: txn.amount_foreign,
        payment_type: txn.payment_type,
        status: txn.status,
        status_reason: txn.status_reason ?? "",
        notes: txn.notes ?? "",
        created_at: txn.created_at,
      });
    }
  }, [open, txn]);

  const handleChange = <K extends keyof typeof form>(field: K, value: typeof form[K]) =>
    setForm((f) => ({ ...f, [field]: value }));

  const save = async () => {
    setSaving(true);
    const updateData: any = { ...form };
    delete updateData.client_name;
    delete updateData.amount_lyd;
    delete updateData.created_at;

    const res = await api.put(`/transactions/update/${txn.id}`, updateData);
    console.log("Update response:", res.data);
    toast.success("تم حفظ التعديلات");
    setSaving(false);
    setOpen(false);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">تعديل</Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl w-[92vw] sm:w-[560px]" dir="rtl">
        <DialogHeader>
          <DialogTitle>تعديل حوالة #{txn.id}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Label>المرجع</Label>
            <Input
              dir="ltr"
              value={form.reference}
              onChange={(e) => handleChange("reference", e.target.value)}
            />
          </div>

          <div>
            <Label>عميل مسجل</Label>
            <Input value={form.client_name} disabled />
          </div>

          <div>
            <Label>الزبون</Label>
            <Input
              value={form.customer_name}
              onChange={(e) => handleChange("customer_name", e.target.value)}
            />
          </div>

          <div>
            <Label>الهاتف</Label>
            <Input
              dir="ltr"
              inputMode="tel"
              value={form.number}
              onChange={(e) => handleChange("number", e.target.value)}
            />
          </div>

          <div>
            <Label>إلى</Label>
            <Input
              value={form.to}
              onChange={(e) => handleChange("to", e.target.value)}
            />
          </div>

          <div>
            <Label>المبلغ أجنبي</Label>
            <Input
              dir="ltr"
              inputMode="decimal"
              type="number"
              value={form.amount_foreign}
              onChange={(e) => handleChange("amount_foreign", parseFloat(e.target.value))}
            />
          </div>

          <div>
            <Label>المبلغ بلليبي</Label>
            <Input
              dir="ltr"
              value={formatCurrency(txn.amount_lyd)}
              disabled
              readOnly
            />
          </div>

          <div>
            <Label>طريقة الدفع</Label>
            <Select
              value={form.payment_type}
              onValueChange={(v) => handleChange("payment_type", v as PaymentType)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="اختر" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={PaymentType.cash}>نقدًا</SelectItem>
                <SelectItem value={PaymentType.credit}>دين</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>الحالة</Label>
            <Select
              value={form.status}
              onValueChange={(v) => handleChange("status", v as TransactionStatus)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="اختر" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TransactionStatus.pending}>قيد التنفيذ</SelectItem>
                <SelectItem value={TransactionStatus.completed}>مكتملة</SelectItem>
                <SelectItem value={TransactionStatus.cancelled}>ملغاة</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="sm:col-span-2">
            <Label>سبب الحالة</Label>
            <Input
              value={form.status_reason}
              onChange={(e) => handleChange("status_reason", e.target.value)}
            />
          </div>

          <div className="sm:col-span-2">
            <Label>ملاحظات</Label>
            <Input
              value={form.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
            />
          </div>

          <div className="sm:col-span-2">
            <Label>تاريخ الإنشاء</Label>
            <Input
              dir="ltr"
              value={format(new Date(form.created_at), "yyyy-MM-dd")}
              disabled
            />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={save} disabled={saving} className="w-full sm:w-auto">
            {saving ? "جاري الحفظ..." : "حفظ"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

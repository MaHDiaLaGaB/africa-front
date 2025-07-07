"use client";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";

// schemas/transactions.ts

/**
 * These enums should match your backend Pydantic definitions in Python:
 */
export enum PaymentType {
  cash = "cash",
  credit = "credit",
}

export enum TransactionStatus {
  pending   = "pending",
  completed = "completed",
  cancelled = "cancelled",
}

/**
 * Shared Transaction shape for frontend use
 */
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
    client_name: txn.client_name ?? "",       // registered customer
    customer_name: txn.customer_name ?? "",   // free-text Zبون
    to: txn.to ?? "",
    number: txn.number ?? "",
    amount_foreign: txn.amount_foreign,
    amount_lyd: txn.amount_lyd,
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
        amount_lyd: txn.amount_lyd,
        payment_type: txn.payment_type,
        status: txn.status,
        status_reason: txn.status_reason ?? "",
        notes: txn.notes ?? "",
        created_at: txn.created_at,
      });
    }
  }, [open, txn]);

  const handleChange = <K extends keyof typeof form>(field: K, value: typeof form[K]) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  const save = async () => {
    setSaving(true);
    // If status or status_reason changed, call status endpoint first
    // if (form.status !== txn.status || form.status_reason !== txn.status_reason) {
    //   await api.put(`/admintx/transaction/${txn.id}/status`, {
    //     status: form.status,
    //     reason: form.status_reason,
    //   });
    // }

    // Update other fields via general endpoint
    const updateData: any = { ...form };
    delete updateData.client_name;
    // delete updateData.status;
    // delete updateData.status_reason;
    delete updateData.created_at;
    // console.log(`updated data is ${JSON.stringify(updateData)}\n the id is ${txn.id}`)
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>تعديل حوالة #{txn.id}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label>المرجع</Label>
            <Input
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
              type="number"
              value={form.amount_foreign}
              onChange={(e) => handleChange("amount_foreign", parseFloat(e.target.value))}
            />
          </div>
          <div>
            <Label>المبلغ بلليبي</Label>
            <Input
              type="number"
              value={form.amount_lyd}
              onChange={(e) => handleChange("amount_lyd", parseFloat(e.target.value))}
            />
          </div>
          <div>
            <Label>طريقة الدفع</Label>
            <Select
              value={form.payment_type}
              onValueChange={(v) => handleChange("payment_type", v as PaymentType)}
            >
              <SelectTrigger>
                <SelectValue />
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
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TransactionStatus.pending}>قيد التنفيذ</SelectItem>
                <SelectItem value={TransactionStatus.completed}>مكتملة</SelectItem>
                <SelectItem value={TransactionStatus.cancelled}>ملغاة</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>سبب الحالة</Label>
            <Input
              value={form.status_reason}
              onChange={(e) => handleChange("status_reason", e.target.value)}
            />
          </div>
          <div>
            <Label>ملاحظات</Label>
            <Input
              value={form.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
            />
          </div>
          <div>
            <Label>تاريخ الإنشاء</Label>
            <Input
              value={format(new Date(form.created_at), "yyyy-MM-dd")}
              disabled
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={save} disabled={saving}>
            {saving ? "جاري الحفظ..." : "حفظ"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
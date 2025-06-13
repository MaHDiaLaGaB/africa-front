// components/employee/TransferCreditModal.tsx
"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import api from "@/lib/api"
import { toast } from "sonner"

export function TransferCreditModal({
  service,
  onSuccess,
}: {
  service: any
  onSuccess: () => void
}) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    name: "",
    phoneAccount: "",
    bankCountry: "",
    amount: "",
  })
  const [calculatedLYD, setCalculatedLYD] = useState<number | null>(null)

  useEffect(() => {
    const amt = parseFloat(form.amount)
    if (!isNaN(amt)) {
      const price = parseFloat(service.price)
      const result =
        service.operation === "multiply"
          ? amt * price
          : price !== 0
          ? amt / price
          : 0
      setCalculatedLYD(parseFloat(result.toFixed(2)))
    } else {
      setCalculatedLYD(null)
    }
  }, [form.amount, service])

  const handlePasteFromClipboard = async () => {
    try {
      const raw = await navigator.clipboard.readText()
      const res = await fetch("/api/parse-clipboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: raw }),
      })
      if (!res.ok) throw new Error("Parsing failed")
      const jsonStr = await res.text()
      const data = JSON.parse(jsonStr)
      setForm((prev) => ({
        ...prev,
        name: data.name || prev.name,
        bankCountry: data.bankCountry || prev.bankCountry,
        phoneAccount: data.phoneAccount || prev.phoneAccount,
      }))
    } catch (e) {
      console.error("Clipboard parse error:", e)
      toast.error("فشل في تحليل بيانات من AI")
    }
  }

  const handleTransfer = async () => {
    const { name, phoneAccount, bankCountry, amount } = form
    if (!name || !phoneAccount || !bankCountry || !amount) {
      toast.error("يرجى تعبئة جميع الحقول")
      return
    }
    try {
      await api.post("/transactions/create", {
        service_id: service.id,
        amount_foreign: parseFloat(amount),
        payment_type: "credit",
        name,
        to: bankCountry,
        number: phoneAccount,
      })
      toast.success("تم تنفيذ التحويل بنجاح")
      setOpen(false)
      setForm({ name: "", phoneAccount: "", bankCountry: "", amount: "" })
      setCalculatedLYD(null)
      onSuccess()
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "حدث خطأ أثناء التحويل")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto" variant="outline">
          دين
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full max-w-full sm:max-w-md p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            تحويل دين – {service.name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2 sm:space-y-4">
          <Button
            onClick={handlePasteFromClipboard}
            variant="outline"
            className="w-full sm:w-auto"
          >
            📋 لصق بيانات من الحافظة
          </Button>
          <Input
            className="w-full"
            placeholder="اسم الزبون"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input
            className="w-full"
            placeholder="الهاتف/رقم الحساب"
            value={form.phoneAccount}
            onChange={(e) =>
              setForm({ ...form, phoneAccount: e.target.value })
            }
          />
          <Input
            className="w-full"
            placeholder="البنك/الدولة"
            value={form.bankCountry}
            onChange={(e) =>
              setForm({ ...form, bankCountry: e.target.value })
            }
          />
          <Input
            className="w-full"
            placeholder="المبلغ الأجنبي"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
          />
          {calculatedLYD !== null && (
            <div className="text-sm text-green-600">
              💰 المبلغ المحول (LYD): <strong>{calculatedLYD}</strong>
            </div>
          )}
          <Button onClick={handleTransfer} className="w-full sm:w-auto">
            تنفيذ التحويل
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

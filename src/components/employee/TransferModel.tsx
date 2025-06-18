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
import { cn } from "@/lib/utils"
import api from "@/lib/api"
import { toast } from "sonner"

export default function TransferModal({
  service,
  onSuccess,
}: {
  service: any
  onSuccess: () => void
}) {
  /* ───────── الحالة المبدئية ───────── */
  const initialForm = {
    name: "",
    phoneAccount: "",
    bankCountry: "",
    amount: "",
  }

  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(initialForm)

  /* التحقق من صحة رقم الحساب */
  const [accountValid, setAccountValid] = useState<boolean | null>(null)
  const [validationError, setValidationError] = useState<string>("")

  /* حساب المبلغ بالدينار */
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

  /* لصق وتحليل نص الحافظة */
  const handlePasteFromClipboard = async () => {
    try {
      const raw = await navigator.clipboard.readText()
      const countryCode =
        service.country_code || service.countryCode || service.country || ""

      const res = await fetch("/api/parse-clipboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clipboard: raw, countryCode }),
      })

      if (!res.ok) throw new Error("Parsing failed")
      const data = await res.json()

      setForm((prev) => ({
        ...prev,
        name: data.full_name || prev.name,
        phoneAccount:
          data.account_number || data.phone_number || prev.phoneAccount,
        bankCountry:
          data.bank_name !== ""
            ? data.bank_name
            : data.country || prev.bankCountry,
      }))

      setAccountValid(data.account_number_valid === "yes")
      setValidationError(data.validation_error || "")
      if (data.account_number_valid !== "yes") {
        toast.warning(`⚠️ ${data.validation_error || "رقم الحساب غير صالح"}`)
      }
    } catch (e) {
      console.error("Clipboard parse error:", e)
      toast.error("فشل في تحليل البيانات عبر الذكاء الاصطناعي")
    }
  }

  /* مسح الحقول */
  const handleClear = () => {
    setForm(initialForm)
    setCalculatedLYD(null)
    setAccountValid(null)
    setValidationError("")
  }

  /* تنفيذ التحويل مع نسخة إلى الحافظة */
  const handleTransfer = async () => {
    const { name, phoneAccount, bankCountry, amount } = form
    if (!name || !phoneAccount || !bankCountry || !amount) {
      toast.error("يرجى تعبئة جميع الحقول")
      return
    }
    if (accountValid === false) {
      toast.error("رقم الحساب غير صالح، راجع البيانات")
      return
    }
    try {
      await api.post("/transactions/create", {
        service_id: service.id,
        amount_foreign: parseFloat(amount),
        payment_type: "cash",
        name,
        to: bankCountry,
        number: phoneAccount,
      })
      toast.success("تم تنفيذ التحويل بنجاح")

      // نسخ تفاصيل التحويل إلى الحافظة
      const details = `تحويل فوري – ${service.name}\nاسم: ${name}\nرقم: ${phoneAccount}\nبنك/دولة: ${bankCountry}\nالمبلغ الأجنبي: ${amount}\nالمبلغ بالLYD: ${calculatedLYD ?? '-'} `
      try {
        await navigator.clipboard.writeText(details)
        toast.success("تم نسخ تفاصيل التحويل إلى الحافظة")
      } catch (err) {
        console.error("Clipboard write error:", err)
      }

      setOpen(false)
      handleClear()
      onSuccess()
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "حدث خطأ أثناء التحويل")
    }
  }

  /* ───────── الواجهة ───────── */
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto" variant="outline">
          فوري
        </Button>
      </DialogTrigger>

      <DialogContent className="w-full max-w-full sm:max-w-md p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            تحويل فوري – {service.name}
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

          <Button
            onClick={handleClear}
            variant="outline"
            className="w-full sm:w-auto"
          >
            🧹 مسح الحقول
          </Button>

          {/* الاسم */}
          <Input
            className="w-full"
            placeholder="اسم الزبون"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          {/* رقم الحساب / الهاتف */}
          <Input
            className={cn(
              "w-full",
              accountValid === false &&
                "border-red-500 focus-visible:ring-red-500"
            )}
            placeholder="الهاتف / رقم الحساب"
            value={form.phoneAccount}
            onChange={(e) => {
              setForm({ ...form, phoneAccount: e.target.value })
              setAccountValid(null)
              setValidationError("")
            }}
          />
          {accountValid === false && validationError && (
            <p className="text-xs text-red-600 mt-1">{validationError}</p>
          )}

          {/* البنك / الدولة */}
          <Input
            className="w-full"
            placeholder="البنك / الدولة"
            value={form.bankCountry}
            onChange={(e) =>
              setForm({ ...form, bankCountry: e.target.value })
            }
          />

          {/* المبلغ */}
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

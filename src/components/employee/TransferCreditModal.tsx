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

export function TransferCreditModal({
  service,
  onSuccess,
}: {
  service: any
  onSuccess: () => void
}) {
  const initialForm = {
    customerId: "",
    name: "",
    phoneAccount: "",
    bankCountry: "",
    amount: "",
  }

  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(initialForm)
  const [customers, setCustomers] = useState<any[]>([])
  const [loadingCustomers, setLoadingCustomers] = useState(false)

  /* Fetch registered customers when dialog opens */
  useEffect(() => {
    if (open) {
      setLoadingCustomers(true)
      api
        .get("/customers/get")
        .then((res) => setCustomers(res.data))
        .catch((err) => {
          console.error("Failed to load customers", err)
          toast.error("فشل في جلب قائمة العملاء")
        })
        .finally(() => setLoadingCustomers(false))
    }
  }, [open])

  const [accountValid, setAccountValid] = useState<boolean | null>(null)
  const [validationError, setValidationError] = useState<string>("")
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
      const countryCode = service.country_code || service.countryCode || service.country || ""

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
        phoneAccount: data.account_number || data.phone_number || prev.phoneAccount,
        bankCountry: data.bank_name !== "" ? data.bank_name : data.country || prev.bankCountry,
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

  const handleClear = () => {
    setForm(initialForm)
    setCalculatedLYD(null)
    setAccountValid(null)
    setValidationError("")
  }

  const handleTransfer = async () => {
    const { customerId, name, phoneAccount, bankCountry, amount } = form
    if ((!customerId && !name) || !phoneAccount || !bankCountry || !amount) {
      toast.error("يرجى تعبئة جميع الحقول أو اختيار عميل مسجل")
      return
    }
    if (accountValid === false) {
      toast.error("رقم الحساب غير صالح، راجع البيانات")
      return
    }
    try {
      // Perform the transfer
      await api.post("/transactions/create", {
        service_id: service.id,
        amount_foreign: parseFloat(amount),
        payment_type: "credit",
        name: form.name,
        customer_id: form.customerId || undefined,
        to: bankCountry,
        number: phoneAccount,
      })

      // Copy form data to clipboard
      const clipboardData = `اسم الزبون: ${form.name}\nالهاتف/رقم الحساب: ${form.phoneAccount}\nالبنك/الدولة: ${form.bankCountry}\nالمبلغ الأجنبي: ${form.amount}${calculatedLYD !== null ? `\nالمبلغ المحول (LYD): ${calculatedLYD}` : ""}`
      await navigator.clipboard.writeText(clipboardData)

      toast.success("تم تنفيذ التحويل بنجاح ونسخ البيانات إلى الحافظة")
      setOpen(false)
      handleClear()
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

      <DialogContent className="w-full max-w-full sm:max-w-md p-4 sm:p-6 bg-red-50">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            تحويل دين – {service.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 sm:space-y-5">
          {/* اختر عميل مسجل */}
          <div>
            <label className="block text-sm font-medium mb-1">
              اختر عميل مسجل
            </label>
            <select
              className="w-full border border-gray-300 rounded p-2"
              disabled={loadingCustomers}
              value={form.customerId}
              onChange={(e) => {
                const cust = customers.find((c) => c.id === e.target.value)
                setForm((prev) => ({
                  ...prev,
                  customerId: e.target.value,
                  name: cust?.name || "",
                }))
              }}
            >
              <option value="">-- لاختيار عميل --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

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

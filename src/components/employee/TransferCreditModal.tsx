// components/TransferCreditModal.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function TransferCreditModal({
  service,
  onSuccess,
}: {
  service: any;
  onSuccess: () => void;
}) {
  const initialForm = {
    customerId: "",
    name: "",
    phoneAccount: "",
    bankCountry: "",
    amount: "",
  };
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [accountValid, setAccountValid] = useState<boolean | null>(null);
  const [validationError, setValidationError] = useState<string>("");
  const [calculatedLYD, setCalculatedLYD] = useState<number | null>(null);

  // NEW loading / success states
  const [isLoading, setIsLoading] = useState(false);
  const [didSucceed, setDidSucceed] = useState(false);

  // fetch customers on open
  useEffect(() => {
    if (open) {
      setLoadingCustomers(true);
      api
        .get("/customers/get")
        .then((res) => setCustomers(res.data))
        .catch(() => toast.error("فشل في جلب قائمة العملاء"))
        .finally(() => setLoadingCustomers(false));
    }
  }, [open]);

  // calculate LYD
  useEffect(() => {
    const amt = parseFloat(form.amount);
    if (!isNaN(amt)) {
      const price = parseFloat(service.price);
      const result =
        service.operation === "multiply"
          ? amt * price
          : price !== 0
          ? amt / price
          : 0;
      setCalculatedLYD(parseFloat(result.toFixed(2)));
    } else {
      setCalculatedLYD(null);
    }
  }, [form.amount, service]);

  // parse clipboard
  const handlePaste = async () => {
    try {
      const raw = await navigator.clipboard.readText();
      const countryCode =
        service.country_code || service.countryCode || service.country || "";

      const res = await fetch("/api/parse-clipboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clipboard: raw, countryCode }),
      });
      if (!res.ok) throw new Error("Parsing failed");
      const data = await res.json();

      setForm((prev) => ({
        ...prev,
        name: data.full_name || prev.name,
        phoneAccount:
          data.account_number || data.phone_number || prev.phoneAccount,
        bankCountry:
          data.bank_name !== ""
            ? data.bank_name
            : data.country || prev.bankCountry,
      }));
      setAccountValid(data.account_number_valid === "yes");
      setValidationError(data.validation_error || "");
      if (data.account_number_valid !== "yes") {
        toast.warning(`⚠️ ${data.validation_error || "رقم الحساب غير صالح"}`);
      }
    } catch {
      toast.error("فشل في تحليل البيانات عبر الذكاء الاصطناعي");
    }
  };

  const handleClear = () => {
    setForm(initialForm);
    setCalculatedLYD(null);
    setAccountValid(null);
    setValidationError("");
  };

  const handleTransfer = async () => {
    const { customerId, name, phoneAccount, bankCountry, amount } = form;
    if ((!customerId && !name) || !phoneAccount || !bankCountry || !amount) {
      toast.error("يرجى تعبئة جميع الحقول أو اختيار عميل مسجل");
      return;
    }
    if (accountValid === false) {
      toast.error("رقم الحساب غير صالح، راجع البيانات");
      return;
    }

    setIsLoading(true);
    try {
      await api.post("/transactions/create", {
        service_id:     service.id,
        amount_foreign: parseFloat(amount),
        payment_type:   "credit",
        customer_name:  form.name,
        customer_id:    form.customerId ? Number(form.customerId) : undefined,
        to:             form.bankCountry,
        number:         form.phoneAccount,
      });
      toast.success("تم تنفيذ التحويل بنجاح");

      // copy details
      const clipboardData = `اسم الزبون: ${form.name}
الهاتف/رقم الحساب: ${form.phoneAccount}
البنك/الدولة: ${form.bankCountry}
المبلغ الأجنبي: ${form.amount}${
        calculatedLYD !== null ? `\nالمبلغ المحول (LYD): ${calculatedLYD}` : ""
      }`;
      try {
        await navigator.clipboard.writeText(clipboardData);
        toast.success("تم نسخ تفاصيل التحويل إلى الحافظة");
      } catch {}

      setDidSucceed(true);
      setTimeout(() => {
        setOpen(false);
        handleClear();
        setDidSucceed(false);
        onSuccess();
      }, 800);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "حدث خطأ أثناء التحويل");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) {
          handleClear();
          setDidSucceed(false);
        }
        setOpen(val);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full sm:w-auto">
          دين
        </Button>
      </DialogTrigger>

      <AnimatePresence mode="wait">
        {open && (
          <DialogContent forceMount>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md p-6 bg-red-50"
            >
              <DialogHeader>
                <DialogTitle className="text-lg sm:text-xl">
                  تحويل دين – {service.name}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    اختر عميل مسجل
                  </label>
                  <select
                    className="w-full border rounded p-2"
                    disabled={loadingCustomers}
                    value={form.customerId}
                    onChange={(e) => {
                      const cust = customers.find(
                        (c) => c.id === Number(e.target.value)
                      );
                      setForm((f) => ({
                        ...f,
                        customerId: e.target.value,
                        name: cust?.name || "",
                      }));
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
                  onClick={handlePaste}
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

                <Input
                  className="w-full"
                  placeholder="اسم الزبون"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                />

                <Input
                  className={cn(
                    "w-full",
                    accountValid === false &&
                      "border-red-500 focus-visible:ring-red-500"
                  )}
                  placeholder="الهاتف / رقم الحساب"
                  value={form.phoneAccount}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, phoneAccount: e.target.value }));
                    setAccountValid(null);
                    setValidationError("");
                  }}
                />
                {accountValid === false && validationError && (
                  <p className="text-xs text-red-600 mt-1">
                    {validationError}
                  </p>
                )}

                <Input
                  className="w-full"
                  placeholder="البنك / الدولة"
                  value={form.bankCountry}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, bankCountry: e.target.value }))
                  }
                />

                <Input
                  className="w-full"
                  placeholder="المبلغ الأجنبي"
                  value={form.amount}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, amount: e.target.value }))
                  }
                />
                {calculatedLYD !== null && (
                  <div className="text-sm text-green-600">
                    💰 المبلغ المحول (LYD):{" "}
                    <strong>{calculatedLYD}</strong>
                  </div>
                )}

                <Button
                  onClick={handleTransfer}
                  className="w-full sm:w-auto relative"
                  disabled={isLoading || didSucceed}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : didSucceed ? (
                    <Check className="mr-2 h-4 w-4 text-green-500" />
                  ) : null}
                  {didSucceed
                    ? "تم بنجاح"
                    : isLoading
                    ? "جارٍ التنفيذ..."
                    : "تنفيذ التحويل"}
                </Button>
              </div>
            </motion.div>
          </DialogContent>
        )}
      </AnimatePresence>
    </Dialog>
  );
}

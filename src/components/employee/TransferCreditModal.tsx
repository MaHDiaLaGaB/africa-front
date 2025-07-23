/* -----------------------------------------------------------------
 * components/TransferCreditModal.tsx
 * UI redesign + Phone/Account switch + dynamic phone prefix
 * ---------------------------------------------------------------- */
"use client";

import { useState, useEffect } from "react";
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input }  from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label }  from "@/components/ui/label";
import { Card }   from "@/components/ui/card";
import { toast }  from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Check, ClipboardPaste, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";

/* 📞  tiny, tree-shakable helper from libphonenumber-js */
import { getCountryCallingCode } from "libphonenumber-js"; // ¹ :contentReference[oaicite:0]{index=0}

/* ------------------------------------------------------------------
 * helpers
 * ---------------------------------------------------------------- */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function ModeSwitch({
  mode,
  onChange,
  className = "",
}: {
  mode: "phone" | "account";
  onChange: (m: "phone" | "account") => void;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-1 text-sm", className)}>
      <button
        className={cn(
          "px-2 py-1 rounded-md",
          mode === "phone" ? "bg-primary text-white" : "bg-muted"
        )}
        onClick={() => onChange("phone")}
      >
        📞 هاتف
      </button>
      <button
        className={cn(
          "px-2 py-1 rounded-md",
          mode === "account" ? "bg-primary text-white" : "bg-muted"
        )}
        onClick={() => onChange("account")}
      >
        🏦 حساب
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------
 * modal component
 * ---------------------------------------------------------------- */
export function TransferCreditModal({
  service,
  onSuccess,
}: {
  service: any;
  onSuccess: () => void;
}) {
  /* ------------ state ------------- */
  const initialForm = {
    customerId: "",
    name: "",
    phoneAccount: "",
    bankCity: "",
    amount: "",
    notes: "",
  };

  const [open, setOpen]           = useState(false);
  const [form, setForm]           = useState(initialForm);
  const [inputMode, setInputMode] = useState<"phone" | "account">("phone");

  const [customers, setCustomers] = useState<any[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  const [accountValid, setAccountValid] = useState<boolean | null>(null);
  const [validationError, setValidationError]   = useState("");
  const [calculatedLYD, setCalculatedLYD]       = useState<number | null>(null);

  const [isLoading,  setIsLoading]  = useState(false);
  const [didSucceed, setDidSucceed] = useState(false);

  /* ------------ dynamic phone prefix ------------- */
  const countryIso = service.country_code || service.countryCode || service.country || "LY";
  let phonePrefix = "";
  try {
    phonePrefix = "+" + getCountryCallingCode(countryIso as any); // ² :contentReference[oaicite:1]{index=1}
  } catch {
    phonePrefix = "+218"; // fallback
  }

  /* ------------ fetch customers when dialog opens ------------- */
  useEffect(() => {
    if (!open) return;
    setLoadingCustomers(true);
    api.get("/customers/get")
      .then(res => setCustomers(res.data))
      .catch(() => toast.error("فشل في جلب قائمة العملاء"))
      .finally(() => setLoadingCustomers(false));
  }, [open]);

  /* ------------ compute LYD ------------- */
  useEffect(() => {
    const amt = parseFloat(form.amount);
    if (!isNaN(amt)) {
      const price = Number(service.price);
      const res   = service.operation === "multiply" ? amt * price : price !== 0 ? amt / price : 0;
      setCalculatedLYD(+res.toFixed(2));
    } else setCalculatedLYD(null);
  }, [form.amount, service]);

  /* ------------ LLM Paste ------------- */
  const handlePaste = async () => {
    try {
      const raw = await navigator.clipboard.readText();
      const res = await fetch("/api/parse-clipboard", {
        method : "POST",
        headers: { "Content-Type": "application/json" },
        body   : JSON.stringify({
          clipboard  : raw,
          countryCode: countryIso,
          idMode     : inputMode,              // ← switcher value
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      console.log("Parsed data:", data);

      setForm(prev => ({
        ...prev,
        name        : data.full_name || prev.name,
        phoneAccount: data.account_number || data.phone_number || prev.phoneAccount,
        bankCity : data.bank_name || data.city || prev.bankCity,
      }));
      setAccountValid(data.account_number_valid === "yes");
      setValidationError(data.validation_error || "");
      if (inputMode === "account" && data.account_number_valid !== "yes") {
        toast.warning(`⚠️ ${data.validation_error || "رقم الحساب غير صالح"}`);
      }
    } catch {
      toast.error("❌ فشل في تحليل البيانات عبر الذكاء الاصطناعي");
    }
  };

  const handleClear = () => {
    setForm(initialForm);
    setCalculatedLYD(null);
    setAccountValid(null);
    setValidationError("");
  };

  const handleTransfer = async () => {
    const { customerId, name, phoneAccount, bankCity, amount } = form;
    if ((!customerId && !name) || !phoneAccount || !bankCity || !amount) {
      toast.error("يرجى تعبئة جميع الحقول أو اختيار عميل مسجل");
      return;
    }
    if (inputMode === "account" && accountValid === false) {
      toast.error("رقم الحساب غير صالح، راجع البيانات");
      return;
    }

    setIsLoading(true);
    try {
      await api.post("/transactions/create", {
        service_id    : service.id,
        amount_foreign: parseFloat(amount),
        payment_type  : "credit",
        customer_id   : customerId ? +customerId : undefined,
        customer_name : name,
        to            : bankCity,
        number        : phoneAccount,
        notes         : form.notes,
      });

      toast.success("✅ تمت الحوالة بنجاح");
      setDidSucceed(true);
      setTimeout(() => { setOpen(false); handleClear(); setDidSucceed(false); onSuccess(); }, 800);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "حدث خطأ أثناء التحويل");
    } finally {
      setIsLoading(false);
    }
  };

  /* ------------ render ------------ */
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { handleClear(); setDidSucceed(false); } setOpen(v); }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full sm:w-auto text-sm">دين</Button>
      </DialogTrigger>

      <AnimatePresence mode="wait">
        {open && (
          <DialogContent forceMount className="w-full max-w-full sm:max-w-md p-0 min-h-[70vh] overflow-y-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} transition={{ duration: 0.25 }}>
              <DialogHeader className="border-b p-4 sm:p-6">
                <DialogTitle className="text-lg sm:text-xl">تحويل دين – {service.name}</DialogTitle>
              </DialogHeader>

              <Card className="border-0 shadow-none p-4 sm:p-6 space-y-4">
                <Field label="اختر عميل مسجل">
                  <select className="w-full border rounded px-3 py-2 text-sm" disabled={loadingCustomers}
                    value={form.customerId}
                    onChange={(e) => {
                      const cust = customers.find(c => c.id === +e.target.value);
                      setForm(f => ({ ...f, customerId: e.target.value }));
                    }}>
                    <option value="">-- بدون اختيار --</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </Field>

                {/* utility buttons + switch  (replace your current <div> … </div>) */}
                <div className="flex flex-row flex-wrap items-center gap-2">
                  <Button
                    variant="secondary"
                    onClick={handlePaste}
                    className="flex-none"
                  >
                    <ClipboardPaste className="h-4 w-4 ml-1" />
                    لصق من الحافظة
                  </Button>

                  <Button
                    variant="secondary"
                    onClick={handleClear}
                    className="flex-none"
                  >
                    <Trash2 className="h-4 w-4 ml-1" />
                    مسح الحقول
                  </Button>

                  {/* NEW: give the switch `flex-none` so it stays inline */}
                  <ModeSwitch
                    mode={inputMode}
                    onChange={(m) => {
                      if (m === "phone" && !form.phoneAccount.startsWith(phonePrefix)) {
                        setForm(f => ({ ...f, phoneAccount: phonePrefix + f.phoneAccount }));
                      }
                      if (m === "account" && form.phoneAccount.startsWith(phonePrefix)) {
                        setForm(f => ({ ...f, phoneAccount: f.phoneAccount.slice(phonePrefix.length) }));
                      }
                      setInputMode(m);
                    }}
                    className="flex-none"   // if you extend ModeSwitch with className?
                  />
                </div>


                <Field label="اسم الزبون">
                  <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
                </Field>

                <Field label={inputMode === "phone" ? "الهاتف" : "رقم الحساب"}>
                  <Input
                  dir="ltr"
                    placeholder={inputMode === "phone" ? `${phonePrefix}9…` : "123456789…"}
                    value={form.phoneAccount}
                    onChange={(e) => {
                      setForm(f => ({ ...f, phoneAccount: e.target.value }));
                      setAccountValid(null);
                      setValidationError("");
                    }}
                    className={cn("text-left",accountValid === false && "border-red-500 focus-visible:ring-red-500")}
                  />
                  {inputMode === "account" && accountValid === false && validationError && (
                    <p className="text-xs text-red-600 mt-1">{validationError}</p>
                  )}
                </Field>

                <Field label="البنك / الدولة">
                  <Input value={form.bankCity} onChange={(e) => setForm(f => ({ ...f, bankCity: e.target.value }))} />
                </Field>

                <Field label="المبلغ الأجنبي">
                  <Input dir="ltr" type="number" value={form.amount} onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))} />
                </Field>

                <Field label="ملاحظات">
                  <Input value={form.notes} className="text-left" onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="أية ملاحظات إضافية…" />
                </Field>

                {calculatedLYD !== null && (
                  <p className="text-sm text-muted-foreground">
                    💰 القيمة بالدينار الليبي: <b>{calculatedLYD}</b> LYD
                  </p>
                )}

                <Button onClick={handleTransfer} className="w-full sm:w-auto" disabled={isLoading || didSucceed}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin ml-1" /> :
                   didSucceed ? <Check className="h-4 w-4 text-green-500 ml-1" /> : null}
                  {didSucceed ? "تم بنجاح" : isLoading ? "جاري التنفيذ..." : "تأكيد الحوالة"}
                </Button>
              </Card>
            </motion.div>
          </DialogContent>
        )}
      </AnimatePresence>
    </Dialog>
  );
}

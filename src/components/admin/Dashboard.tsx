"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

type Currency = {
  id: number;
  code: string; // e.g., "LYD", "USD"
  name: string; // e.g., "الدينار الليبي"
};

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [currencies, setCurrencies] = useState<Currency[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/reports/overview");
      setData(res.data);
      console.log("تم تحميل البيانات بنجاح", res.data);
    } catch (err) {
      console.error("فشل في تحميل البيانات", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrencies = async () => {
    try {
      const res = await api.get<Currency[]>("/currency/currencies/get");
      setCurrencies(res.data);
    } catch {
      toast.error("فشل في جلب بيانات العملات");
    }
  };

  useEffect(() => {
    fetchData();
    fetchCurrencies();
  }, []);

  // Fast lookups
  const nameById = useMemo(() => {
    const m = new Map<number, string>();
    currencies.forEach((c) => m.set(c.id, c.name));
    return m;
  }, [currencies]);

  const codeById = useMemo(() => {
    const m = new Map<number, string>();
    currencies.forEach((c) => m.set(c.id, (c.code || "").toUpperCase()));
    return m;
  }, [currencies]);

  const nameByCode = useMemo(() => {
    const m = new Map<string, string>();
    currencies.forEach((c) => m.set((c.code || "").toUpperCase(), c.name));
    return m;
  }, [currencies]);

  // Resolve currency name + code from a stats row (supports id or code)
  const resolveCurrency = (item: any): { name: string; code: string } => {
    const idCandidate =
      item.curr_id ??
      item.currency_id ??
      item.currencyId ??
      (typeof item.currency === "number" ? item.currency : undefined);

    let code =
      String(
        item.currency_code ??
          item.code ??
          (typeof item.currency === "string" ? item.currency : "")
      ).toUpperCase();

    let name: string | undefined;

    if (typeof idCandidate === "number") {
      name = nameById.get(idCandidate);
      code = codeById.get(idCandidate) ?? code;
    }
    if (!name && code) name = nameByCode.get(code);

    return { name: name ?? (code || "عملة غير معروفة"), code: code || "" };

  };

  if (!data) {
    return (
      <p className="text-center text-muted-foreground py-6">
        جاري التحميل...
      </p>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h1 className="text-2xl font-bold">لوحة المدير</h1>
        <Button
          onClick={fetchData}
          disabled={loading}
          className="w-full sm:w-auto active:scale-95 transition-transform"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>جاري التحميل…</span>
            </span>
          ) : (
            "↻ تحديث"
          )}
        </Button>
      </div>

      {/* وصول سريع */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
  <Link href="/admin/listEmployee" className="block">
    <Card className="h-full cursor-pointer hover:shadow-md transition-shadow">
      <CardContent className="p-4 text-center">
        <h2 className="text-lg font-semibold mb-1">قائمة الموظفين</h2>
        <p className="text-sm text-muted-foreground">عرض جميع الموظفين</p>
      </CardContent>
    </Card>
  </Link>

  <Link href="/admin/services" className="block">
    <Card className="h-full cursor-pointer hover:shadow-md transition-shadow">
      <CardContent className="p-4 text-center">
        <h2 className="text-lg font-semibold mb-1">الخدمات</h2>
        <p className="text-sm text-muted-foreground">إدارة وعرض الخدمات</p>
      </CardContent>
    </Card>
  </Link>

  <Link href="/admin/customers" className="block">
    <Card className="h-full cursor-pointer hover:shadow-md transition-shadow">
      <CardContent className="p-4 text-center">
        <h2 className="text-lg font-semibold mb-1">العملاء</h2>
        <p className="text-sm text-muted-foreground">إدارة وعرض العملاء</p>
      </CardContent>
    </Card>
  </Link>
</div>

      {/* الإحصائيات العامة */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">إجمالي العمليات اليوم</p>
            <p className="text-2xl font-bold tabular-nums">
              {formatCurrency(data.total_txns_today)}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">قيمة المبيعات (LYD)</p>
            <p className="text-2xl font-bold tabular-nums">
              {formatCurrency(data.total_lyd_today?.toFixed?.(2) ?? "0.00")} LYD
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">الربح الصافي</p>
            <p className="text-2xl font-bold text-green-600 tabular-nums">
              {formatCurrency(data.profit_today?.toFixed?.(2) ?? "0.00")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* لوحات البيانات المفصلة */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* أفضل الموظفين */}
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-4 space-y-2">
            <h2 className="font-semibold text-lg mb-2">🏅 أفضل الموظفين</h2>
            <ul className="space-y-1.5">
              {data.top_employees.map((emp: any, idx: number) => (
                <li key={idx} className="flex items-center justify-between">
                  <span className="truncate">
                    {idx + 1}. {emp.username}
                  </span>
                  <span className="font-medium tabular-nums">
                    {formatCurrency(parseFloat(emp.total).toFixed(2))} LYD
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* أكثر الخدمات استخدامًا */}
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-4 space-y-2">
            <h2 className="font-semibold text-lg mb-2">💼 أكثر الخدمات استخدامًا</h2>
            <ul className="space-y-1.5">
              {data.top_services.map((srv: any, idx: number) => {
                const noun = srv.count >= 2 && srv.count <= 9 ? "عمليات" : "عملية";
                return (
                  <li key={idx} className="flex items-center justify-between">
                    <span className="truncate">
                      {idx + 1}. {srv.service_name}
                    </span>
                    {/* Keep digits LTR */}
                    <span dir="ltr" className="text-muted-foreground tabular-nums">
                      {srv.count} {noun}
                    </span>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* العملات الأكثر تداولًا — احترافي ومتّسق اتجاهيًا */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-4 space-y-3">
            <h2 className="font-semibold text-lg">💱 العملات الأكثر تداولًا</h2>

            <ul className="space-y-2">
              {data.top_currencies.map((item: any, idx: number) => {
                const { name, code } = resolveCurrency(item);
                const used = Number(item.used ?? 0);

                return (
                  <li
                    key={idx}
                    className="flex items-center justify-between gap-3 rounded-lg border bg-white/50 p-2 hover:bg-muted/50"
                  >
                    {/* Left side (RTL): rank + name + code badge */}
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="font-medium truncate">
                          {/* bdi isolates direction for mixed-language names */}
                          <bdi>{name}</bdi>
                          {code && (
                            <span
                              dir="ltr"
                              className="ms-2 align-middle text-[11px] text-muted-foreground border rounded px-1.5 py-0.5"
                            >
                              {code}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right side: amount, always LTR + tabular digits */}
                    <div dir="ltr" className="text-sm font-semibold tabular-nums whitespace-nowrap">
                      {formatCurrency(used.toFixed(2))}
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

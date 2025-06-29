// components/employee/EmployeeTransactionsPage.tsx
"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";
import { format } from "date-fns";

export default function EmployeeTransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [status, setStatus] = useState("");
  const [paymentType, setPaymentType] = useState("");
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const fetchTransactions = async () => {
    const res = await api.get("/transactions/me", {
      params: { status, payment_type: paymentType, start_date: startDate, end_date: endDate },
    });
    setTransactions(res.data);
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-screen-lg mx-auto space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold">📋 سجل الحوالات</h1>

      {/* 🔍 فلترة */}
      <Card className="p-4 sm:p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-sm sm:text-base">الحالة</label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full">{status || "كل الحالات"}</SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="pending">قيد التنفيذ</SelectItem>
                <SelectItem value="completed">مكتملة</SelectItem>
                <SelectItem value="cancelled">ملغاة</SelectItem>
                <SelectItem value="returned">راجعة</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm sm:text-base">طريقة الدفع</label>
            <Select value={paymentType} onValueChange={setPaymentType}>
              <SelectTrigger className="w-full">{paymentType || "الكل"}</SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="cash">نقدًا</SelectItem>
                <SelectItem value="credit">دين</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm sm:text-base">من تاريخ</label>
            <Input
              type="date"
              className="w-full"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm sm:text-base">إلى تاريخ</label>
            <Input
              type="date"
              className="w-full"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
        <Button className="w-full sm:w-auto" onClick={fetchTransactions}>
          🔎 تنفيذ الفلترة
        </Button>
      </Card>

      {/* ✅ قائمة الحوالات */}
      <Card className="p-4 sm:p-6 space-y-4">
        {transactions.length === 0 ? (
          <p className="text-muted-foreground text-sm sm:text-base">لا توجد حوالات.</p>
        ) : (
          <ul className="space-y-3">
            {transactions.map((t) => (
              <li key={t.id} className="border rounded p-3 sm:p-4">
                <p className="text-sm sm:text-base">🔖 المرجع: {t.reference}</p>
                <p className="text-sm sm:text-base">
                  🧾 {t.amount_foreign} {t.currency?.symbol} = {t.amount_lyd} LYD
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  📅 {new Date(t.created_at).toLocaleDateString()}
                </p>
                <p className="text-sm sm:text-base">🔗 الخدمة: {t.service?.name}</p>
                <p className="text-sm sm:text-base">👤 الزبون: {t.customer_name}</p>
                <p className="text-sm sm:text-base">📌 الحالة: {t.status}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

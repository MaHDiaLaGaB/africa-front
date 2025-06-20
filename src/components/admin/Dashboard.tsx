"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/reports/overview");
      setData(res.data);
    } catch (err) {
      console.error("فشل في تحميل البيانات", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (!data) {
    return (
      <p className="text-center text-muted-foreground py-6">
        جاري التحميل...
      </p>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <h1 className="text-2xl font-bold">لوحة المدير</h1>
        <Button
          className="w-full sm:w-auto mt-2 sm:mt-0" 
          onClick={fetchData} disabled={loading}
        >
          ↻ تحديث
        </Button>
      </div>

      {/* وصول سريع: قائمة الموظفين */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/admin/listEmployee" className="block">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="p-4 text-center">
              <h2 className="text-lg font-semibold mb-1">قائمة الموظفين</h2>
              <p className="text-sm text-muted-foreground">
                عرض جميع الموظفين
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* الإحصائيات العامة */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">
              إجمالي العمليات اليوم
            </p>
            <p className="text-2xl font-bold">
              {data.total_txns_today}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">
              قيمة المبيعات (LYD)
            </p>
            <p className="text-2xl font-bold">
              {data.total_lyd_today.toFixed(2)} LYD
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">
              الربح الصافي
            </p>
            <p className="text-2xl font-bold text-green-600">
              {data.profit_today.toFixed(2)} LYD
            </p>
          </CardContent>
        </Card>
      </div>

      {/* لوحات البيانات المفصلة */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* أفضل الموظفين */}
        <Card>
          <CardContent className="p-4 space-y-2">
            <h2 className="font-semibold text-lg mb-2">
              🏅 أفضل الموظفين
            </h2>
            {data.top_employees.map((emp: any, idx: number) => (
              <p key={idx} className="text-sm">
                {idx + 1}. {emp.username} — 💰{" "}
                {parseFloat(emp.total).toFixed(2)} LYD
              </p>
            ))}
          </CardContent>
        </Card>

        {/* أكثر الخدمات استخدامًا */}
        <Card>
          <CardContent className="p-4 space-y-2">
            <h2 className="font-semibold text-lg mb-2">
              💼 أكثر الخدمات استخدامًا
            </h2>
            {data.top_services.map((srv: any, idx: number) => (
              <p key={idx} className="text-sm">
                {idx + 1}. {srv.name} — {srv.count} عملية
              </p>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* العملات الأكثر تداولًا */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="max-w-full">
          <CardContent className="p-4 space-y-2">
            <h2 className="font-semibold text-lg mb-2">
              💱 العملات الأكثر تداولًا
            </h2>
            {data.top_currencies.map((c: any, idx: number) => (
              <p key={idx} className="text-sm">
                {idx + 1}. {c.name} —{" "}
                {parseFloat(c.used).toFixed(2)}
              </p>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

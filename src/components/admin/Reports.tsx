"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { format } from "date-fns";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

import { formatNumber, formatCurrency } from "@/lib/utils";

export default function AdminReportsPage() {
  const [filters, setFilters] = useState({
    employee_id: "",
    service_name: "",
    start_date: format(new Date(), "yyyy-MM-dd"),
    end_date: format(new Date(), "yyyy-MM-dd"),
  });
  const [report, setReport] = useState<any | null>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);

  const fetchData = async () => {
    const res = await api.get("/reports/financial-report", {
      params: {
        ...filters,
        employee_id: filters.employee_id || undefined,
        service_name: filters.service_name || undefined,
      },
    });
    setReport(res.data);
  };
  const selectedEmployee = employees.find(e => String(e.id) === filters.employee_id);
  const employeeLabel = selectedEmployee
  ? (selectedEmployee.full_name || selectedEmployee.username)
  : "اختيار موظف";

  useEffect(() => {
    api.get("/auth/users").then((res) => setEmployees(res.data));
    api.get("/services/get/available").then((res) => setServices(res.data));
    fetchData();
  }, []);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6 max-w-screen-lg mx-auto">
      <h1 className="text-2xl font-bold">📊 تقارير المبيعات</h1>

      {/* 🔍 فلترة */}
      <Card className="p-4 sm:p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* الموظف */}
          <div className="w-full">
            <Label>الموظف</Label>
            <Select
              value={filters.employee_id}
              onValueChange={val =>
                setFilters({ ...filters, employee_id: val })
              }
            >
              <SelectTrigger className="w-full">
                {employeeLabel}
              </SelectTrigger>
              <SelectContent>
                {employees.map(e => (
                  <SelectItem key={e.id} value={String(e.id)}>
                    {e.full_name || e.username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* الخدمة */}
          <div className="w-full">
            <Label>الخدمة</Label>
            <Select
              value={filters.service_name}
              onValueChange={(val) =>
                setFilters({ ...filters, service_name: val })
              }
            >
              <SelectTrigger className="w-full">
                {filters.service_name || "اختيار خدمة"}
              </SelectTrigger>
              <SelectContent>
                {services.map((s) => (
                  <SelectItem key={s.id} value={s.name}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* من تاريخ */}
          <div>
            <Label>من تاريخ</Label>
            <Input
              type="date"
              className="w-full"
              value={filters.start_date}
              onChange={(e) =>
                setFilters({ ...filters, start_date: e.target.value })
              }
            />
          </div>

          {/* إلى تاريخ */}
          <div>
            <Label>إلى تاريخ</Label>
            <Input
              type="date"
              className="w-full"
              value={filters.end_date}
              onChange={(e) =>
                setFilters({ ...filters, end_date: e.target.value })
              }
            />
          </div>
        </div>

        <div className="flex justify-center sm:justify-start">
          <Button
            className="w-full sm:w-auto mt-2"
            onClick={fetchData}
          >
            تحديث التقرير
          </Button>
        </div>
      </Card>

      {/* 📈 عرض النتائج */}
      {report && (
        <Card className="p-4 sm:p-6 space-y-3">
          <h2 className="text-lg font-semibold">📋 النتائج</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <p>📦 عدد الحوالات: {formatNumber(report.total_transactions)}</p>
            <p>💸 إجمالي المبلغ المرسل: {formatCurrency(report.total_sent_value)}</p>
            <p>💰 إجمالي LYD: {formatCurrency(report.total_lyd_collected)}</p>
            <p>🧾 التكلفة: {formatCurrency(report.total_cost)}</p>
            <p>📈 الربح: {formatCurrency(report.total_profit)} LYD</p>
          </div>
        </Card>
      )}

      {/* 📊 المبيعات اليومية */}
      {report?.daily_breakdown && (
        <Card className="p-4 sm:p-6">
          <h2 className="text-lg font-bold mb-4">📈 المبيعات اليومية</h2>
          <div className="w-full h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={report.daily_breakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="total_lyd"
                  name="المبيعات"
                  stroke="#8884d8"
                />
                <Line
                  type="monotone"
                  dataKey="total_profit"
                  name="الربح"
                  stroke="#82ca9d"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}
    </div>
  );
}

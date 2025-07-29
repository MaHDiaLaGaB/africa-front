"use client";
import { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  PaymentType, // still used for rendering existing rows
  TransactionStatus,
} from "./TransactionEditForm";
import { TransactionEditModal } from "./TransactionEditForm";
import { formatCurrency } from "@/lib/utils";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------
interface CurrentUser {
  id: number;
  username: string;
  role: "admin" | "employee";
}

interface ServiceOut {
  id: number;
  name: string;
}

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
  notes?: string;
  created_at: string;
  employee_name: string;
  client_name?: string;
}

// -----------------------------------------------------------------------------
// Helper hooks & utils
// -----------------------------------------------------------------------------
function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  useEffect(() => {
    let mounted = true;
    api
      .get<CurrentUser>("/auth/me")
      .then((res) => mounted && setUser(res.data))
      .catch(() => setUser(null));
    return () => {
      mounted = false;
    };
  }, []);
  return user;
}

const statusLabel = (s: TransactionStatus) =>
  (
    {
      pending: "قيد التنفيذ",
      completed: "مكتملة",
      cancelled: "ملغاة",
    } as const
  )[s] ?? s;

const statusColor = (s: TransactionStatus) =>
  s === "completed"
    ? "default"
    : s === "cancelled"
    ? "destructive"
    : s === "pending"
    ? "outline"
    : "secondary";

const paymentLabel = (p: PaymentType) =>
  p === "cash" ? "نقدًا" : p === "credit" ? "دين" : p;

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------
export default function EmployeeTransactionsPage() {
  // فلترة الحالة والتاريخ فقط
  const [status, setStatus] = useState<TransactionStatus | "all">("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [txns, setTxns] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const currentUser = useCurrentUser();
  const [servicesMap, setServicesMap] = useState<Record<number, string>>({});

  // جلب الخدمات لمرة واحدة (لإظهار أسمائها)
  useEffect(() => {
    api.get<ServiceOut[]>("/services/get/available").then((res) => {
      const m: Record<number, string> = {};
      res.data.forEach((svc) => (m[svc.id] = svc.name));
      setServicesMap(m);
    });
  }, []);

  // جلب الحوالات مرة واحدة بعد معرفة المستخدم الحالي
  useEffect(() => {
    if (!currentUser) return;
    (async () => {
      setLoading(true);
      try {
        const { data } = await api.get<Transaction[]>("/transactions/get", {
          params: { employee_id: currentUser.id },
        });
        setTxns(data);
      } finally {
        setLoading(false);
      }
    })();
  }, [currentUser]);

  // فلترة محلية بالتاريخ والحالة
  const filteredTxns = useMemo(() => {
    return txns.filter((t) => {
      // الحالة
      if (status !== "all" && t.status !== status) return false;

      // التاريخ
      const created = new Date(t.created_at);
      if (startDate && created < new Date(startDate)) return false;
      if (endDate && created > new Date(endDate)) return false;

      return true;
    });
  }, [txns, status, startDate, endDate]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-screen-xl mx-auto space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold">📋 سجل الحوالات</h1>

      {/* لوحة الفلاتر */}
      <Card className="p-4 sm:p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-sm sm:text-base">الحالة</label>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as TransactionStatus | "all")}
            >
              <SelectTrigger className="w-full">
                {status === "all" ? "كل الحالات" : statusLabel(status)}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الحالات</SelectItem>
                <SelectItem value="pending">قيد التنفيذ</SelectItem>
                <SelectItem value="completed">مكتملة</SelectItem>
                <SelectItem value="cancelled">ملغاة</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm sm:text-base">من تاريخ</label>
            <Input
              dir="ltr"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm sm:text-base">إلى تاريخ</label>
            <Input
              dir="ltr"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        {/* زر اختياري – يكتفي بتفعيل إعادة الحساب */}
        <Button
          disabled={loading}
          onClick={() => toast.info("تم تطبيق الفلترة موضعيًا")}
          className="w-full sm:w-auto"
        >
          🔎 تنفيذ الفلترة
        </Button>
      </Card>

      {/* جدول الحوالات */}
      <Card className="p-0 overflow-x-auto">
        {loading ? (
          <p className="p-6 text-center text-sm sm:text-base">جاري التحميل…</p>
        ) : filteredTxns.length === 0 ? (
          <p className="p-6 text-center text-sm sm:text-base text-muted-foreground">
            لا توجد حوالات مطابقة للفلتر الحالي.
          </p>
        ) : (
          <table className="min-w-full text-right text-xs sm:text-sm">
            <thead className="bg-gray-100 text-gray-700 font-semibold">
              <tr>
                <th className="p-2">#</th>
                <th className="p-2">المعرف</th>
                <th className="p-2">المرجع</th>
                <th className="p-2">المبلغ أجنبي</th>
                <th className="p-2">المبلغ بلليبي</th>
                <th className="p-2">الخدمة</th>
                <th className="p-2">الموظف</th>
                <th className="p-2">العميل</th>
                <th className="p-2">الزبون</th>
                <th className="p-2">الهاتف</th>
                <th className="p-2">طريقة الدفع</th>
                <th className="p-2">إلى</th>
                <th className="p-2">الحالة</th>
                <th className="p-2">ملاحظات</th>
                <th className="p-2">التاريخ</th>
                <th className="p-2">نسخ</th>
                <th className="p-2">تعديل</th>
              </tr>
            </thead>
            <tbody>
              {filteredTxns.map((t, i) => (
                <tr key={`txn-${t.id}-${i}`} className="border-b hover:bg-gray-50">
                  <td className="p-2 font-medium">{i + 1}</td>
                  <td className="p-2">{t.id}</td>
                  <td className="p-2 font-mono truncate max-w-[100px]">
                    {t.reference}
                  </td>
                  <td className="p-2">{t.amount_foreign}</td>
                  <td className="p-2">{formatCurrency(t.amount_lyd)}</td>
                  <td className="p-2">{servicesMap[t.service_id] || "-"}</td>
                  <td className="p-2">{t.employee_name}</td>
                  <td className="p-2">{t.client_name || "-"}</td>
                  <td className="p-2">{t.customer_name || "-"}</td>
                  <td className="p-2">{t.number}</td>
                  <td className="p-2">{paymentLabel(t.payment_type)}</td>
                  <td className="p-2">{t.to}</td>
                  <td className="p-2">
                    <Badge
                      variant={statusColor(t.status)}
                      className="uppercase text-[10px]"
                    >
                      {statusLabel(t.status)}
                    </Badge>
                  </td>
                  <td className="p-2">{t.notes || "-"}</td>
                  <td className="p-2">
                    {new Date(t.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="active:scale-95 transition-transform"
                      onClick={() => {
                        const entries = [
                          `#${i + 1}`,
                          `ID: ${t.id}`,
                          `Reference: ${t.reference}`,
                          `Amount (Foreign): ${t.amount_foreign}`,
                          `Amount (LYD): ${formatCurrency(t.amount_lyd)}`,
                          `Service: ${servicesMap[t.service_id] || "-"}`,
                          `Employee: ${t.employee_name}`,
                          `Client: ${t.client_name || "-"}`,
                          `Customer: ${t.customer_name || "-"}`,
                          `Phone: ${t.number || ""}`,
                          `Payment Type: ${paymentLabel(t.payment_type)}`,
                          `To: ${t.to || ""}`,
                          `Status: ${statusLabel(t.status)}`,
                          `Notes: ${t.notes || "-"}`,
                          `Date: ${new Date(t.created_at).toLocaleDateString()}`,
                        ];
                        navigator.clipboard.writeText(entries.join("\n"));
                        toast.success("Row copied!");
                      }}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </td>
                  <td className="p-2">
                    <TransactionEditModal txn={t} onSaved={() => {}} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

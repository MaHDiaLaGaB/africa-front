"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card }   from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge }  from "@/components/ui/badge";
import { Copy }   from "lucide-react";
import { toast }  from "sonner";
import { format } from "date-fns";
import { TransactionEditModal } from "./TransactionEditForm";


interface CurrentUser { id: number; username: string; role: "admin" | "employee"; }
interface ServiceOut   { id: number; name: string; }


export enum PaymentType {
  cash = "cash",
  credit = "credit",
}

export enum TransactionStatus {
  pending   = "pending",
  completed = "completed",
  cancelled = "cancelled",
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

const statusLabel = (s: string) => ({
  pending: "قيد التنفيذ",
  completed: "مكتملة",
  cancelled: "ملغاة"
}[s] ?? s);

const statusColor = (s: string) =>
  s === "completed"
    ? "default"
    : s === "cancelled"
    ? "destructive"
    : s === "pending"
    ? "outline"
    : "secondary";

const paymentLabel = (p: string) =>
  p === "cash"
    ? "نقدًا"
    : p === "credit"
    ? "دين"
    : p;

export default function EmployeeTransactionsPage() {
  const [status, setStatus] = useState("all");
  const [paymentType, setPaymentType] = useState("all");
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const [txns, setTxns] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  const currentUser = useCurrentUser();
  const currentUserId = currentUser?.id;

  const [servicesMap, setServicesMap] = useState<Record<number, string>>({});
  useEffect(() => {
    api.get<ServiceOut[]>("/services/get/available").then((res) => {
      const m: Record<number, string> = {};
      res.data.forEach((svc) => (m[svc.id] = svc.name));
      setServicesMap(m);
    });
  }, []);

  const fetchTxns = async () => {
    if (!currentUserId) return;
    setLoading(true);

    const params: Record<string, string> = {};
    if (status !== "all") params.status = status;
    if (paymentType !== "all") params.payment_type = paymentType;
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;

    const { data } = await api.get<Transaction[]>(
      "/transactions/get",
      { params }
    );
    setTxns(data);
    setLoading(false);
  };

  useEffect(() => {
    if (currentUserId) fetchTxns();
  }, [currentUserId]);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-screen-xl mx-auto space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold">📋 سجل الحوالات</h1>

      <Card className="p-4 sm:p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* ... filters unchanged ... */}
        </div>
        <Button
          onClick={fetchTxns}
          disabled={!currentUserId || loading}
          className="w-full sm:w-auto"
        >
          {loading ? "..." : "🔎 تنفيذ الفلترة"}
        </Button>
      </Card>

      <Card className="p-0 overflow-x-auto">
        {txns.length === 0 ? (
          <p className="p-6 text-center text-sm sm:text-base text-muted-foreground">
            لا توجد حوالات.
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
              {txns.map((t, i) => (
                <tr
                  key={`txn-${t.id}-${i}`}
                  className="border-b hover:bg-gray-50"
                >
                  <td className="p-2 font-medium">{i + 1}</td>
                  <td className="p-2">{t.id}</td>
                  <td className="p-2 font-mono truncate max-w-[100px]">{t.reference}</td>
                  <td className="p-2">{t.amount_foreign}</td>
                  <td className="p-2">{t.amount_lyd}</td>
                  <td className="p-2">{servicesMap[t.service_id] || "-"}</td>
                  <td className="p-2">{t.employee_name}</td>
                  <td className="p-2">{t.client_name || "-"}</td>
                  <td className="p-2">{t.customer_name || "-"}</td>
                  <td className="p-2">{t.number}</td>
                  <td className="p-2">{paymentLabel(t.payment_type)}</td>
                  <td className="p-2">{t.to}</td>
                  <td className="p-2">
                    <Badge variant={statusColor(t.status)} className="uppercase text-[10px]">
                      {statusLabel(t.status)}
                    </Badge>
                  </td>
                  <td className="p-2">{t.notes || "-"}</td>
                  <td className="p-2">{new Date(t.created_at).toLocaleDateString()}</td>
                  <td className="p-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        navigator.clipboard.writeText(t.reference);
                        toast.success("تم نسخ المرجع");
                      }}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </td>
                  <td className="p-2">
                    <TransactionEditModal txn={t} onSaved={fetchTxns} />
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


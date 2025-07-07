"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import { Card } from "@/components/ui/card";

interface Transaction {
  id: number;
  created_at: string;
  amount_foreign: number;
  amount_lyd: number;
  currency_id: number;
  service_id: number;
  // enriched fields:
  currency_name?: string;
  currency_symbol?: string;
  service_name?: string;
}

interface CurrencyOut {
  id: number;
  name: string;
  symbol: string;
}

interface ServiceOut {
  id: number;
  name: string;
}

export default function CustomerDetailsPage() {
  const { id } = useParams();
  const [customer, setCustomer] = useState<any>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. fetch customer & raw transactions
      const [cRes, tRes] = await Promise.all([
        api.get(`/customers/${id}`),
        api.get<Transaction[]>(`/customers/${id}/transactions`),
      ]);
      setCustomer(cRes.data);
      const rawTxs = tRes.data;

      // 2. fetch currencies
      const currencyIds = Array.from(new Set(rawTxs.map((tx) => tx.currency_id)));
      const currencyReqs = currencyIds.map((cid) => api.get<CurrencyOut>(`/currency/currencies/${cid}`));
      const currencyRes = await Promise.all(currencyReqs);
      const cmap: Record<number, CurrencyOut> = {};
      currencyRes.forEach((r) => (cmap[r.data.id] = r.data));

      // 3. fetch services
      const serviceIds = Array.from(new Set(rawTxs.map((tx) => tx.service_id)));
      const serviceReqs = serviceIds.map((sid) => api.get<ServiceOut>(`/services/get/${sid}`));
      const serviceRes = await Promise.all(serviceReqs);
      const smap: Record<number, ServiceOut> = {};
      serviceRes.forEach((r) => (smap[r.data.id] = r.data));

      // 4. enrich transactions
      const enriched = rawTxs.map((tx) => ({
        ...tx,
        currency_name: cmap[tx.currency_id]?.name || "—",
        currency_symbol: cmap[tx.currency_id]?.symbol || "—",
        service_name: smap[tx.service_id]?.name || "—",
      }));

      setTransactions(enriched);
    } catch (err) {
      console.error("فشل في تحميل البيانات", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  if (loading) {
    return <p className="text-center py-8">جاري التحميل...</p>;
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-screen-lg mx-auto space-y-6">
      {customer && (
        <Card className="p-6 space-y-2">
          <h2 className="text-2xl font-bold">{customer.name}</h2>
          <div className="flex flex-wrap gap-4 text-sm">
            <p>📞 {customer.phone}</p>
            <p>🏙️ {customer.city}</p>
            <p className="font-medium">
              💰 الرصيد المستحق: {customer.balance_due} LYD
            </p>
          </div>
        </Card>
      )}

      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">🧾 تفاصيل الحوالات</h3>
        {transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground">لا توجد حوالات.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full table-fixed border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="w-1/5 px-4 py-2 text-left text-sm">تاريخ</th>
                  <th className="w-1/5 px-4 py-2 text-right text-sm">المبلغ الأجنبي</th>
                  <th className="w-1/5 px-4 py-2 text-center text-sm">عملة</th>
                  <th className="w-1/5 px-4 py-2 text-right text-sm">المبلغ بالليبي</th>
                  <th className="w-1/5 px-4 py-2 text-left text-sm">الخدمة</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id} className="border-t">
                    <td className="px-4 py-2 text-left text-sm">
                      {new Date(t.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 text-right text-sm">
                      {t.amount_foreign}
                    </td>
                    <td className="px-4 py-2 text-center text-sm">
                      {t.currency_name} ({t.currency_symbol})
                    </td>
                    <td className="px-4 py-2 text-right text-sm">
                      {t.amount_lyd}
                    </td>
                    <td className="px-4 py-2 text-left text-sm">
                      {t.service_name}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

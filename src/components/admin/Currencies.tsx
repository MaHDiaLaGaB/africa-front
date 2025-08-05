"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, Plus, Pencil } from "lucide-react";

interface Currency {
  id: number;
  name: string;
  symbol: string;
  stock: number;
  is_active: boolean;
}
interface CurrencyLot {
  id: number;
  quantity: number;
  remaining_quantity: number;
  cost_per_unit: number;
  created_at: string;
}
interface CurrencyLotLog {
  id: number;
  lot_id: number;
  currency_id: number;
  quantity_added: number;
  cost_per_unit: number;
  created_at: string;
}

type LotFormState = {
  [currencyId: number]: { quantity: string; cost: string };
};

export default function AdminCurrenciesPage() {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [lotsMap, setLotsMap] = useState<Record<number, CurrencyLot[]>>({});
  const [logsMap, setLogsMap] = useState<Record<number, CurrencyLotLog[]>>({});
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [newCurrency, setNewCurrency] = useState({ name: "", symbol: "" });
  const [lotForm, setLotForm] = useState<LotFormState>({});
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ name: "", symbol: "" });

  const fetchCurrencies = async () => {
    try {
      const res = await api.get<Currency[]>("/currency/currencies/get");
      setCurrencies(res.data);
    } catch {
      toast.error("فشل في جلب بيانات العملات");
    }
  };

  useEffect(() => {
    fetchCurrencies();
  }, []);

  const fetchDetails = async (id: number) => {
    try {
      const [lotsRes, logsRes] = await Promise.all([
        api.get<CurrencyLot[]>(`/currency/${id}/lots`),
        api.get<CurrencyLotLog[]>(`/currency/${id}/lots/logs`),
      ]);
      setLotsMap(m => ({ ...m, [id]: lotsRes.data }));
      setLogsMap(m => ({ ...m, [id]: logsRes.data }));
    } catch {
      toast.error("فشل في جلب التفاصيل");
    }
  };

  const toggleDetails = (id: number) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        if (!lotsMap[id] || !logsMap[id]) fetchDetails(id);
      }
      return next;
    });
  };

  const addCurrency = async () => {
    if (!newCurrency.name.trim() || !newCurrency.symbol.trim()) {
      return toast.error("يرجى إدخال الاسم والرمز");
    }
    try {
      await api.post("/currency/currencies/create", newCurrency);
      toast.success("تم إضافة العملة بنجاح");
      setNewCurrency({ name: "", symbol: "" });
      fetchCurrencies();
    } catch {
      toast.error("فشل في إضافة العملة");
    }
  };

  const addLot = async (currencyId: number) => {
    const form = lotForm[currencyId] || { quantity: "", cost: "" };
    if (!form.quantity || !form.cost) {
      return toast.error("يرجى إدخال الكمية والسعر");
    }
    try {
      await api.post(`/currency/currencies/${currencyId}/lots`, {
        quantity: parseFloat(form.quantity),
        cost_per_unit: parseFloat(form.cost),
      });
      toast.success("تم إضافة الدفعة بنجاح");
      setLotForm(f => ({ ...f, [currencyId]: { quantity: "", cost: "" } }));
      fetchCurrencies();
      fetchDetails(currencyId);
    } catch {
      toast.error("فشل في إضافة الدفعة");
    }
  };

  const startEdit = (c: Currency) => {
    setEditId(c.id);
    setEditForm({ name: c.name, symbol: c.symbol });
  };
  const cancelEdit = () => setEditId(null);
  const saveEdit = async (id: number) => {
    if (!editForm.name.trim() || !editForm.symbol.trim()) {
      return toast.error("يرجى إدخال الاسم والرمز");
    }
    try {
      await api.put(`/currency/currencies/${id}`, editForm);
      toast.success("تم تحديث العملة");
      setEditId(null);
      fetchCurrencies();
    } catch {
      toast.error("فشل في تحديث العملة");
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* إضافة عملة جديدة */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">إضافة عملة جديدة</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label>اسم العملة</Label>
            <Input
              placeholder="مثال: دولار"
              value={newCurrency.name}
              onChange={e => setNewCurrency(f => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div>
            <Label>الرمز</Label>
            <Input
              placeholder="مثال: USD"
              value={newCurrency.symbol}
              onChange={e => setNewCurrency(f => ({ ...f, symbol: e.target.value }))}
            />
          </div>
          <div className="flex items-end">
            <Button onClick={addCurrency} className="w-full">
              <Plus size={16} /> إضافة عملة
            </Button>
          </div>
        </div>
      </Card>

      {/* جدول العملات */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-right text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3">العملة</th>
              <th className="p-3">الرمز</th>
              <th className="p-3">الرصيد الكلي</th>
              <th className="p-3">تعديل</th>
              <th className="p-3">التفاصيل</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {currencies.map(c => (
              <React.Fragment key={c.id}>
                <tr className="hover:bg-gray-50">
                  <td className="p-3">
                    {editId === c.id ? (
                      <Input
                        value={editForm.name}
                        onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                      />
                    ) : (
                      <span className="font-medium">{c.name}</span>
                    )}
                  </td>
                  <td className="p-3">
                    {editId === c.id ? (
                      <Input
                        value={editForm.symbol}
                        onChange={e => setEditForm(f => ({ ...f, symbol: e.target.value }))}
                      />
                    ) : (
                      <span>{c.symbol}</span>
                    )}
                  </td>
                  <td className="p-3">{c.stock}</td>
                  <td className="p-3 flex gap-2">
                    {editId === c.id ? (
                      <>
                        <Button size="sm" onClick={() => saveEdit(c.id)}>حفظ</Button>
                        <Button size="sm" variant="outline" onClick={cancelEdit}>إلغاء</Button>
                      </>
                    ) : (
                      <Button size="sm" variant="ghost" onClick={() => startEdit(c)}>
                        <Pencil size={14} /> تعديل
                      </Button>
                    )}
                  </td>
                  <td className="p-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleDetails(c.id)}
                      className="flex items-center gap-1"
                    >
                      {expanded.has(c.id) ? (
                        <>
                          <ChevronUp size={16} /> طي التفاصيل
                        </>
                      ) : (
                        <>
                          <ChevronDown size={16} /> عرض التفاصيل
                        </>
                      )}
                    </Button>
                  </td>
                </tr>

                {expanded.has(c.id) && (
                  <tr>
                    <td colSpan={5} className="p-4 bg-gray-50">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* الدفعات */}
                        <div className="col-span-1 lg:col-span-2 space-y-4">
                          <div className="flex justify-between items-center">
                            <h4 className="font-semibold">الدفعات</h4>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="min-w-full text-right text-sm border-collapse">
                              <thead>
                                <tr className="bg-white border-b">
                                  <th className="p-2">#</th>
                                  <th className="p-2">الكمية</th>
                                  <th className="p-2">المتبقي</th>
                                  <th className="p-2">تكلفة الوحدة</th>
                                  <th className="p-2">أنشئت في</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(lotsMap[c.id] ?? []).map((lot, i) => (
                                  <tr key={lot.id} className="border-t">
                                    <td className="p-2">{i + 1}</td>
                                    <td className="p-2">{lot.quantity}</td>
                                    <td className="p-2">{lot.remaining_quantity}</td>
                                    <td className="p-2">{lot.cost_per_unit}</td>
                                    <td className="p-2">{new Date(lot.created_at).toLocaleDateString()}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* إضافة دفعة جديدة */}
                          <div className="mt-4 border-t pt-4">
                            <h5 className="font-medium mb-2">إضافة دفعة جديدة</h5>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div>
                                <Label>الكمية</Label>
                                <Input
                                  placeholder="مثال: 100"
                                  type="number"
                                  value={lotForm[c.id]?.quantity || ""}
                                  onChange={e =>
                                    setLotForm(f => ({
                                      ...f,
                                      [c.id]: { ...(f[c.id] || { quantity: "", cost: "" }), quantity: e.target.value }
                                    }))
                                  }
                                />
                              </div>
                              <div>
                                <Label>تكلفة الوحدة</Label>
                                <Input
                                  placeholder="مثال: 2.5"
                                  type="number"
                                  value={lotForm[c.id]?.cost || ""}
                                  onChange={e =>
                                    setLotForm(f => ({
                                      ...f,
                                      [c.id]: { ...(f[c.id] || { quantity: "", cost: "" }), cost: e.target.value }
                                    }))
                                  }
                                />
                              </div>
                              <div className="flex items-end">
                                <Button
                                  onClick={() => addLot(c.id)}
                                  disabled={!lotForm[c.id]?.quantity || !lotForm[c.id]?.cost}
                                  className="w-full"
                                >
                                  <Plus size={16} /> إضافة
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* سجل الإضافات */}
                        {/* <div className="col-span-1 space-y-4">
                          <h4 className="font-semibold">سجل الإضافات</h4>
                          <div className="overflow-x-auto">
                            <table className="min-w-full text-right text-sm border-collapse">
                              <thead>
                                <tr className="bg-white border-b">
                                  <th className="p-2">#</th>
                                  <th className="p-2">الدفعة</th>
                                  <th className="p-2">المضافة</th>
                                  <th className="p-2">تكلفة الوحدة</th>
                                  <th className="p-2">التاريخ</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(logsMap[c.id] ?? []).map((log, i) => (
                                  <tr key={log.id} className="border-t">
                                    <td className="p-2">{i + 1}</td>
                                    <td className="p-2">{log.lot_id}</td>
                                    <td className="p-2">{log.quantity_added}</td>
                                    <td className="p-2">{log.cost_per_unit}</td>
                                    <td className="p-2">{new Date(log.created_at).toLocaleDateString()}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div> */}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

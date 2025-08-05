"use client";

import { useEffect, useState, useMemo } from "react";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectItem,
  SelectContent,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import ReactFlagsSelect from "react-flags-select";
import countriesData from "world-countries";

/* ---------- أنواع البيانات ---------- */

type Currency = {
  id: number;
  name: string;
  symbol: string;
  exchange_rate: number;
  cost_per_unit: number;
  stock: number;
  is_active: boolean;
};

type Service = {
  id: number;
  name: string;
  price: number;
  operation: "multiply" | "divide" | "pluse";
  currency_id: number;
  image_url: string;
  is_active: boolean;
  country_id: number;
};

type ServiceGroup = {
  country: {
    country_name: string;
    code: string; // ISO-2
  };
  services: Service[];
};

/* ---------- أدوات مساعدة ---------- */

const countryCodeToFlag = (iso: string) =>
  iso
    .toUpperCase()
    .replace(/./g, (char) =>
      String.fromCodePoint(127397 + char.charCodeAt(0))
    );

const getCountryName = (code: string) => {
  const c = countriesData.find((c) => c.cca2 === code.toUpperCase());
  return c ? c.name.common : code;
};

/* ---------- المكوّن ---------- */

export default function AdminServicesPage() {
  /* الحالة العامة */
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [groups, setGroups] = useState<ServiceGroup[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [deletingIds, setDeletingIds] = useState<number[]>([]);
  const [activatingIds, setActivatingIds] = useState<number[]>([]);

  /* حالة التعديل */
  const [editingServiceId, setEditingServiceId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  /* نموذج الإنشاء */
  const [form, setForm] = useState({
    name: "",
    price: "",
    country_code: "",
    currency_id: "",
    operation: "multiply" as "multiply" | "divide" | "pluse",
  });

  /* ---------- جلب البيانات ---------- */
  const fetchServices = async () => {
    try {
      const { data } = await api.get<ServiceGroup[]>("/services/grouped");
      setGroups(data);
    } catch {
      toast.error("فشل في تحميل الخدمات");
    }
  };

  const fetchCurrencies = async () => {
    try {
      const { data } = await api.get<Currency[]>("/currency/currencies/get");
      setCurrencies(data);
    } catch {
      toast.error("فشل في تحميل العملات");
    }
  };

  const currencyNameById = useMemo(
    () => Object.fromEntries(currencies.map((c) => [c.id, c.name])),
    [currencies]
  );

  useEffect(() => {
    fetchCurrencies();
    fetchServices();
  }, []);

  /* ---------- حذف خدمة ---------- */
  const handleDelete = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذه الخدمة؟")) return;
    setDeletingIds((ids) => [...ids, id]);
    try {
      await api.delete(`/services/delete/${id}`);
      toast.success("✅ تم حذف الخدمة");
      fetchServices();
    } catch {
      toast.error("فشل في حذف الخدمة");
    } finally {
      setDeletingIds((ids) => ids.filter((x) => x !== id));
    }
  };

  /* ---------- تفعيل/تعطيل خدمة ---------- */
  const handleActivate = async (id: number) => {
    setActivatingIds((ids) => [...ids, id]);
    try {
      await api.patch(`/services/${id}/activate`);
      toast.success("✅ تم تحديث حالة الخدمة");
      fetchServices();
    } catch {
      toast.error("فشل في تحديث حالة الخدمة");
    } finally {
      setActivatingIds((ids) => ids.filter((x) => x !== id));
    }
  };

  /* ---------- تعديل خدمة ---------- */
  const startEditService = (srv: Service) => {
    setEditingServiceId(srv.id);
    setEditName(srv.name);
    setEditPrice(String(srv.price));
  };
  const cancelEditService = () => {
    setEditingServiceId(null);
    setEditName("");
    setEditPrice("");
  };
  const handleSaveService = async (id: number) => {
    if (!editName.trim() || !editPrice.trim()) {
      return toast.error("يرجى تعبئة الاسم والسعر");
    }
    setEditLoading(true);
    try {
      await api.patch(`/services/update/${id}`, {
        name: editName.trim(),
        price: Number(editPrice),
      });
      toast.success("✅ تم تحديث الخدمة");
      cancelEditService();
      fetchServices();
    } catch {
      toast.error("فشل في تحديث الخدمة");
    } finally {
      setEditLoading(false);
    }
  };

  /* ---------- إنشاء خدمة جديدة ---------- */
  const handleSubmit = async () => {
    if (!form.name || !form.price || !form.currency_id || !form.country_code) {
      toast.error("يرجى تعبئة جميع الحقول المطلوبة");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/admin/create", {
        name: form.name,
        price: Number(form.price),
        operation: form.operation,
        currency_id: Number(form.currency_id),
        image_url: form.country_code,
        country_id: 0,
        country: {
          name: getCountryName(form.country_code),
          code: form.country_code,
        },
      });
      toast.success("✅ تم إنشاء الخدمة بنجاح");
      setForm({ name: "", price: "", country_code: "", currency_id: "", operation: "multiply" });
      fetchServices();
    } catch {
      toast.error("فشل في إنشاء الخدمة");
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------- الواجهة ---------- */
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6 max-w-screen-lg mx-auto">
      {/* نموذج إضافة/إنشاء خدمة */}
      <h1 className="text-2xl font-bold">إدارة الخدمات</h1>
      <Card className="p-4 sm:p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <Label>اسم الخدمة</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <Label>سعر الخدمة (LYD)</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
          </div>
          <div>
            <Label>الدولة</Label>
            <ReactFlagsSelect
              selected={form.country_code}
              onSelect={(code) => setForm({ ...form, country_code: code })}
              searchable
              placeholder="اختر دولة"
            />
          </div>
          <div>
            <Label>العملة</Label>
            <Select
              value={form.currency_id}
              onValueChange={(v) => setForm({ ...form, currency_id: v })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="اختر العملة" />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>العملية الحسابية</Label>
            <Select
              value={form.operation}
              onValueChange={(v) => setForm({ ...form, operation: v as any })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="multiply">✖️ ضرب</SelectItem>
                <SelectItem value="divide">➗ قسمة</SelectItem>
                <SelectItem value="pluse">➕ جمع</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "جاري المعالجة..." : "إنشاء خدمة"}
          </Button>
        </div>
      </Card>

      {/* عرض المجموعات والخدمات */}
      <h2 className="text-xl font-bold">🗺️ الخدمات مصنفة حسب الدول</h2>
      <div className="space-y-6">
        {groups.map(({ country, services }) => (
          <Card key={country.code} className="p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl">{countryCodeToFlag(country.code)}</span>
              <h3 className="text-lg font-bold">{country.country_name}</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {services.map((srv) => (
                <Card
                  key={srv.id}
                  className={`p-4 space-y-2 ${srv.is_active ? "" : "opacity-50 border border-red-200"}`}
                >
                  {editingServiceId === srv.id ? (
                    <>
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        disabled={editLoading}
                      />
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        disabled={editLoading}
                      />
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          onClick={() => handleSaveService(srv.id)}
                          disabled={editLoading}
                        >
                          {editLoading ? "جاري الحفظ..." : "حفظ"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={cancelEditService}
                          disabled={editLoading}
                        >
                          إلغاء
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between items-center">
                        <h4 className="font-semibold text-lg">{srv.name}</h4>
                        <span className="text-lg">
                          {srv.operation === "multiply"
                            ? "✖️"
                            : srv.operation === "divide"
                            ? "➗"
                            : "➕"}
                        </span>
                      </div>
                      <p className="text-sm">السعر: {srv.price} LYD</p>
                      <p className="text-sm">
                        العملة: {currencyNameById[srv.currency_id] || "غير معرّفة"}
                      </p>
                      <div className="flex flex-wrap justify-end gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEditService(srv)}
                        >
                          ✏️ تعديل
                        </Button>
                        {!srv.is_active && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleActivate(srv.id)}
                            disabled={activatingIds.includes(srv.id)}
                          >
                            {activatingIds.includes(srv.id)
                              ? "جاري التفعيل..."
                              : "تفعيل"}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(srv.id)}
                          disabled={deletingIds.includes(srv.id) || !srv.is_active}
                        >
                          {deletingIds.includes(srv.id)
                            ? "جاري الحذف..."
                            : "حذف"}
                        </Button>
                      </div>
                    </>
                  )}
                </Card>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
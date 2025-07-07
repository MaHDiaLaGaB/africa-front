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
  /* الحالة */
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [groups, setGroups] = useState<ServiceGroup[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [deletingIds, setDeletingIds] = useState<number[]>([]);
  const [activatingIds, setActivatingIds] = useState<number[]>([]);
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
      await fetchServices();
    } catch {
      toast.error("فشل في حذف الخدمة");
    } finally {
      setDeletingIds((ids) => ids.filter((x) => x !== id));
    }
  };

  /* ---------- تفعيل خدمة ---------- */
  const handleActivate = async (id: number) => {
    setActivatingIds((ids) => [...ids, id]);
    try {
      await api.patch(`/services/${id}/activate`);
      toast.success("✅ تم تفعيل الخدمة");
      await fetchServices();
    } catch {
      toast.error("فشل في تفعيل الخدمة");
    } finally {
      setActivatingIds((ids) => ids.filter((x) => x !== id));
    }
  };

  /* ---------- إرسال النموذج ---------- */
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
      setForm({
        name: "",
        price: "",
        country_code: "",
        currency_id: "",
        operation: "multiply",
      });
      await fetchServices();
    } catch (err) {
      console.error(err);
      toast.error("فشل في إنشاء الخدمة");
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------- الواجهة ---------- */
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6 max-w-screen-lg mx-auto">
      {/* إضافة خدمة جديدة */}
      <h1 className="text-2xl font-bold">إضافة خدمة جديدة</h1>
      <Card className="p-4 sm:p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* اسم الخدمة */}
          <div className="w-full">
            <Label>اسم الخدمة</Label>
            <Input
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />
          </div>
          {/* السعر */}
          <div className="w-full">
            <Label>سعر الخدمة (LYD)</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={e => setForm({ ...form, price: e.target.value })}
            />
          </div>
          {/* الدولة */}
          <div className="w-full">
            <Label>الدولة</Label>
            <div className="w-full">
              <ReactFlagsSelect
                selected={form.country_code}
                onSelect={code => setForm({ ...form, country_code: code })}
                searchable
                placeholder="اختر دولة"
              />
            </div>
          </div>
          {/* العملة */}
          <div className="w-full">
            <Label>العملة</Label>
            <Select
              value={form.currency_id}
              onValueChange={v => setForm({ ...form, currency_id: v })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="اختر العملة" />
              </SelectTrigger>
              <SelectContent>
                {currencies.map(c => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* العملية الحسابية */}
          <div className="w-full">
            <Label>العملية الحسابية</Label>
            <Select
              value={form.operation}
              onValueChange={v => setForm({ ...form, operation: v as any })}
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

        <div className="flex justify-center sm:justify-start">
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full sm:w-auto"
          >
            {submitting ? "جاري الإنشاء..." : "إنشاء الخدمة"}
          </Button>
        </div>
      </Card>

      {/* الدول والخدمات */}
      <h2 className="text-xl font-bold">🗺️ الدول والخدمات</h2>
      <div className="space-y-6">
        {groups.map(({ country, services }) => (
          <Card key={country.code} className="p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl">
                {countryCodeToFlag(country.code)}
              </span>
              <h3 className="text-lg font-bold">{country.country_name}</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {services.map(srv => (
                <Card
                  key={srv.id}
                  className={`p-4 space-y-2 ${
                    srv.is_active ? "" : "opacity-50 border border-red-200"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold">{srv.name}</h4>
                    <span className="text-lg">
                      {srv.operation === "multiply"
                        ? "✖️"
                        : srv.operation === "divide"
                        ? "➗"
                        : "➕"}
                    </span>
                  </div>

                  {!srv.is_active && (
                    <p className="text-sm text-red-600">غير نشط</p>
                  )}

                  <p className="text-sm">السعر: {srv.price} LYD</p>
                  <p className="text-sm">
                    العملة: {currencyNameById[srv.currency_id] ?? "غير معرّفة"}
                  </p>

                  <div className="flex flex-wrap justify-end gap-2 pt-2">
                    {!srv.is_active && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleActivate(srv.id)}
                        disabled={activatingIds.includes(srv.id)}
                      >
                        {activatingIds.includes(srv.id) ? "جاري التفعيل..." : "تفعيل"}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(srv.id)}
                      disabled={deletingIds.includes(srv.id) || !srv.is_active}
                    >
                      {deletingIds.includes(srv.id) ? "جاري الحذف..." : "حذف"}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

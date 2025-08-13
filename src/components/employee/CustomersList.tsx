"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";   // ← add this
import { to2 } from "@/lib/utils"; // ← import to2 function

interface Customer {
  id: number;
  name: string;
  phone: string;
  city: string;
  balance_due: number;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading]   = useState(false);
  const [name, setName]         = useState("");
  const [phone, setPhone]       = useState("");
  const [city, setCity]         = useState("");
  const router = useRouter();

  useEffect(() => {
    fetchCustomers();
  }, []);

  async function fetchCustomers() {
    setLoading(true);
    try {
      const res = await api.get<Customer[]>("/customers/get");
      setCustomers(res.data);
    } catch {
      console.error("فشل في جلب العملاء");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    const tName  = name.trim();
    const tPhone = phone.trim();
    const tCity  = city.trim();

    if (!tName || !tPhone || !tCity) {
      return toast.error("جميع الحقول مطلوبة");  // ← prevent empty submission
    }

    setLoading(true);
    try {
      await api.post("/customers/create", {
        name:  tName,
        phone: tPhone,
        city:  tCity,
      });
      setName("");
      setPhone("");
      setCity("");
      fetchCustomers();
    } catch {
      console.error("Error creating customer");
      toast.error("❌ فشل في إضافة العميل");
    } finally {
      setLoading(false);
    }
  }

  // disable the button if any field is empty
  const canAdd = !!(name.trim() && phone.trim() && city.trim());

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <h2 className="text-xl font-bold">📋 إدارة العملاء</h2>

      {/* إنشاء عميل جديد */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Input
          className="w-full"
          placeholder="الاسم"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          type="text"
          inputMode="numeric"
          pattern="\d*"
          className="w-full"
          placeholder="الهاتف"
          value={phone}
          onChange={(e) => {
            // strip non-digits
            const digits = e.target.value.replace(/\D/g, "");
            setPhone(digits);
          }}
        />
        <Input
          className="w-full"
          placeholder="المدينة"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
        <Button
          className="w-full sm:w-auto"
          onClick={handleCreate}
          disabled={loading || !canAdd}  // ← disable when empty
        >
          {loading ? "...جاري الإضافة" : "➕ إضافة عميل"}
        </Button>
      </div>

      {/* جدول العملاء */}
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto text-right text-sm sm:text-base">
          <thead className="bg-gray-100 text-gray-700 font-semibold">
            <tr>
              <th className="p-2">#</th>
              <th className="p-2">الاسم</th>
              <th className="p-2">الهاتف</th>
              <th className="p-2">المدينة</th>
              <th className="p-2">الرصيد المستحق (LYD)</th>
              <th className="p-2">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c, i) => (
              <tr key={c.id} className="border-b hover:bg-gray-50">
                <td className="p-2 font-medium">{i + 1}</td>
                <td className="p-2">{c.name}</td>
                <td className="p-2">{c.phone}</td>
                <td className="p-2">{c.city}</td>
                <td className="p-2">{to2(c.balance_due) ?? 0}</td>
                <td className="p-2 space-x-2">
                  <Button
                    size="sm"
                    variant="link"
                    onClick={() => router.push(`/employee/customers/${c.id}`)}
                  >
                    📄 عرض التفاصيل
                  </Button>
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan={6} className="p-4 text-center text-muted-foreground">
                  لا يوجد عملاء.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

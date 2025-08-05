"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

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

  // Create form state
  const [name, setName]   = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity]   = useState("");

  // Edit form state
  const [editingId, setEditingId]         = useState<number | null>(null);
  const [editName, setEditName]           = useState("");
  const [editPhone, setEditPhone]         = useState("");
  const [editCity, setEditCity]           = useState("");
  const [editLoading, setEditLoading]     = useState(false);

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
      toast.error("❌ فشل في تحميل العملاء");
    } finally {
      setLoading(false);
    }
  }

  // Create new customer
  async function handleCreate() {
    const n = name.trim(), p = phone.trim(), c = city.trim();
    if (!n || !p || !c) return toast.error("جميع الحقول مطلوبة");
    setLoading(true);
    try {
      await api.post("/customers/create", { name: n, phone: p, city: c });
      toast.success("✅ تم إضافة العميل");
      setName(""); setPhone(""); setCity("");
      fetchCustomers();
    } catch {
      console.error("Error creating customer");
      toast.error("❌ فشل في إضافة العميل");
    } finally {
      setLoading(false);
    }
  }

  // Start editing a row
  function startEdit(c: Customer) {
    setEditingId(c.id);
    setEditName(c.name);
    setEditPhone(c.phone);
    setEditCity(c.city);
  }

  // Cancel edit
  function cancelEdit() {
    setEditingId(null);
    setEditName(""); setEditPhone(""); setEditCity("");
  }

  // Save edited customer
  async function handleSave(id: number) {
    const n = editName.trim(), p = editPhone.trim(), c = editCity.trim();
    if (!n || !p || !c) return toast.error("جميع الحقول مطلوبة");
    setEditLoading(true);
    try {
      await api.put(`/customers/${id}`, { name: n, phone: p, city: c });
      toast.success("✅ تم تحديث بيانات العميل");
      cancelEdit();
      fetchCustomers();
    } catch {
      console.error("Error updating customer");
      toast.error("❌ فشل في تحديث العميل");
    } finally {
      setEditLoading(false);
    }
  }

  // Helpers
  const canAdd = !!(name.trim() && phone.trim() && city.trim());
  const canSave = !!(editName.trim() && editPhone.trim() && editCity.trim());

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <h2 className="text-xl font-bold">📋 إدارة العملاء</h2>

      {/* Create Form */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Input
          placeholder="الاسم"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          type="text"
          inputMode="numeric"
          pattern="\d*"
          placeholder="الهاتف"
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
        />
        <Input
          placeholder="المدينة"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
        <Button
          className="w-full sm:w-auto"
          onClick={handleCreate}
          disabled={loading || !canAdd}
        >
          {loading ? "...جاري الإضافة" : "➕ إضافة عميل"}
        </Button>
      </div>

      {/* Customers Table */}
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
              editingId === c.id ? (
                // Edit Mode Row
                <tr key={c.id} className="border-b bg-yellow-50">
                  <td className="p-2">{i + 1}</td>
                  <td className="p-2">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      disabled={editLoading}
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="\d*"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value.replace(/\D/g, ""))}
                      disabled={editLoading}
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      value={editCity}
                      onChange={(e) => setEditCity(e.target.value)}
                      disabled={editLoading}
                    />
                  </td>
                  <td className="p-2">{c.balance_due ?? 0}</td>
                  <td className="p-2 flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleSave(c.id)}
                      disabled={editLoading || !canSave}
                    >
                      {editLoading ? "جاري الحفظ…" : "حفظ"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={cancelEdit}
                      disabled={editLoading}
                    >
                      إلغاء
                    </Button>
                  </td>
                </tr>
              ) : (
                // Read‑Only Row
                <tr key={c.id} className="border-b hover:bg-gray-50">
                  <td className="p-2 font-medium">{i + 1}</td>
                  <td className="p-2">{c.name}</td>
                  <td className="p-2">{c.phone}</td>
                  <td className="p-2">{c.city}</td>
                  <td className="p-2">{c.balance_due ?? 0}</td>
                  <td className="p-2 space-x-2 flex">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => startEdit(c)}
                    >
                      ✏️ تعديل
                    </Button>
                    <Button
                      size="sm"
                      variant="link"
                      onClick={() => router.push(`/admin/customers/${c.id}`)}
                    >
                      📄 عرض
                    </Button>
                  </td>
                </tr>
              )
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

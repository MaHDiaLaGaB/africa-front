// components/employee/CustomersPage.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);

  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [services, setServices] = useState<any[]>([]);
  const router = useRouter();

  const fetchCustomers = async () => {
    const res = await api.get("/customers/get");
    setCustomers(res.data);
  };

  const fetchServices = async () => {
    const res = await api.get("/services/get/available");
    setServices(res.data);
  };

  useEffect(() => {
    fetchCustomers();
    fetchServices();
  }, []);

  const handleCreate = async () => {
    setLoading(true);
    try {
      await api.post("/customers/create", { name, phone, city });
      setName("");
      setPhone("");
      setCity("");
      fetchCustomers();
    } catch (err) {
      console.error("Error creating customer", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreditTransaction = async () => {
    try {
      await api.post("/transactions/create", {
        customer_id: selectedCustomer.id,
        service_id: Number(serviceId),
        amount_foreign: Number(amount),
        payment_type: "credit",
      });
      fetchCustomers();
      setAmount("");
      setServiceId("");
    } catch (err) {
      console.error("Error processing credit transaction", err);
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <h2 className="text-xl font-bold">📋 إدارة العملاء</h2>

      {/* نموذج الإضافة */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Input
          className="w-full"
          placeholder="الاسم"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          className="w-full"
          placeholder="الهاتف"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
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
          disabled={loading}
        >
          {loading ? "...جاري الإضافة" : "➕ إضافة عميل"}
        </Button>
      </div>

      {/* عرض العملاء */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {customers.map((customer) => (
          <Card key={customer.id} className="w-full">
            <CardContent className="p-4 sm:p-6 space-y-2">
              <h3 className="font-semibold truncate">{customer.name}</h3>
              <p className="text-sm text-muted-foreground w-full truncate">
                📞 {customer.phone}
              </p>
              <p className="text-sm text-muted-foreground w-full truncate">
                🏙️ {customer.city}
              </p>
              <p className="text-sm">
                💸 الرصيد المستحق: {customer.balance_due ?? 0} LYD
              </p>

              <div className="flex flex-wrap gap-2 mt-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      onClick={() => setSelectedCustomer(customer)}
                      variant="outline"
                      size="sm"
                      className="flex-1 sm:flex-none"
                    >
                      💳 حوالة بالدين
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-full max-w-full sm:max-w-md p-4 sm:p-6">
                    <DialogHeader>
                      <DialogTitle>
                        حوالة دين لـ {customer.name}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>الخدمة</Label>
                        <select
                          className="w-full border rounded px-3 py-2 text-sm"
                          value={serviceId}
                          onChange={(e) => setServiceId(e.target.value)}
                        >
                          <option value="">اختر الخدمة</option>
                          {services.map((s: any) => (
                            <option key={s.id} value={s.id}>
                              {s.name} ({s.price}{" "}
                              {s.operation === "multiply" ? "✖️" : "➗"})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label>المبلغ بالعملة الأجنبية</Label>
                        <Input
                          className="w-full"
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="مثال: 100"
                        />
                      </div>
                      <Button
                        className="w-full sm:w-auto"
                        onClick={handleCreditTransaction}
                        disabled={!serviceId || !amount}
                      >
                        تنفيذ الحوالة
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button
                  size="sm"
                  variant="link"
                  className="flex-1 sm:flex-none text-center"
                  onClick={() => router.push(`/employee/customers/${customer.id}`)}
                >
                  📄 عرض التفاصيل
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

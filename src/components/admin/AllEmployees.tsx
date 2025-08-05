"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type Employee = {
  id: number;
  username: string;
  full_name: string;
  balance: number; // merged in from the new endpoint
};

export default function AdminAllEmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [form, setForm] = useState({
    sender_id: "",
    receiver_id: "",
    amount: "",
  });

  // helper to load users + their balances
  const loadEmployees = async () => {
  try {
    // 1. fetch users
    console.log("Fetching users…");
    const usersRes = await api.get<Omit<Employee, "balance">[]>("/auth/users");
    console.log("Users response:", usersRes);
    const users = usersRes.data;

    // 2. for each user, fetch balance
    const balances = await Promise.all(
      users.map((u) => {
        console.log(`Fetching balance for employee ${u.id}…`);
        return api
          .get<{ employee_id: number; balance: number }>(`/treasury/get/${u.id}`)
          .then((res) => {
            console.log(`Balance response for ${u.id}:`, res);
            return res.data.balance;
          })
          .catch((err) => {
            console.error(`Error fetching balance for ${u.id}:`, err);
            return 0;
          });
      })
    );

    // 3. merge into Employee[]
    const merged: Employee[] = users.map((u, i) => ({
      ...u,
      balance: balances[i],
    }));
    console.log("Merged employees with balances:", merged);

    setEmployees(merged);
  } catch (err) {
    console.error("Error in loadEmployees:", err);
    toast.error("فشل في تحميل الموظفين أو الأرصدة");
  }
};


  useEffect(() => {
    loadEmployees();
  }, []);

  const handleTransfer = async () => {
  if (!form.sender_id || !form.receiver_id || !form.amount) {
    return toast.error("يرجى تعبئة جميع الحقول");
  }

  try {
    // build the payload with the correct field names
    const payload = {
      from_employee_id: Number(form.sender_id),
      to_employee_id:   Number(form.receiver_id),
      amount:           parseFloat(form.amount),
    };

    console.log("Transfer payload:", payload);
    await api.post("/admin/transfer", payload);

    toast.success("✅ تم التحويل");
    setForm({ sender_id: "", receiver_id: "", amount: "" });
    await loadEmployees();
  } catch (err) {
    console.error(err);
    toast.error("خطأ أثناء التحويل");
  }
};


  return (
    <div className="p-6 space-y-8">
      {/* Transfer Section */}
      <Card className="p-6 shadow-md">
        <h2 className="text-xl font-bold mb-4">نقل بين الموظفين</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            value={form.sender_id}
            onValueChange={(v) => setForm((f) => ({ ...f, sender_id: v }))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="من (المرسل)" />
            </SelectTrigger>
            <SelectContent>
              {employees.map((emp) => (
                <SelectItem key={emp.id} value={String(emp.id)}>
                  {emp.full_name || emp.username}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={form.receiver_id}
            onValueChange={(v) => setForm((f) => ({ ...f, receiver_id: v }))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="إلى (المستقبل)" />
            </SelectTrigger>
            <SelectContent>
              {employees.map((emp) => (
                <SelectItem key={emp.id} value={String(emp.id)}>
                  {emp.full_name || emp.username}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            placeholder="المبلغ (LYD)"
            type="number"
            value={form.amount}
            onChange={(e) =>
              setForm((f) => ({ ...f, amount: e.target.value }))
            }
            className="w-full"
          />

          <Button onClick={handleTransfer} className="md:col-span-3 w-full">
            تحويل
          </Button>
        </div>
      </Card>

      {/* Employees List */}
      <h1 className="text-2xl font-bold">قائمة الموظفين</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {employees.map((emp) => (
          <Card
            key={emp.id}
            className="p-4 hover:shadow-lg transition-shadow duration-200"
          >
            <div className="flex items-center mb-3">
              <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center text-lg font-semibold">
                {emp.full_name
                  ? emp.full_name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                  : emp.username[0]}
              </div>
              <h3 className="mr-3 text-lg font-semibold">
                {emp.full_name || emp.username}
              </h3>
            </div>
            <p>
              الرصيد:{" "}
              <span className="font-bold">{emp.balance.toFixed(2)} LYD</span>
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}

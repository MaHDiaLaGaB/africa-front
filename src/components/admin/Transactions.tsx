// components/admin/Transactions.tsx
"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import TransactionPage from "./TransactionTable";

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState([]);

  const fetchTransactions = async () => {
    const res = await api.get("/transactions/get");
    setTransactions(res.data);
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  return (
    <div className="w-full py-4 sm:py-6" dir="rtl">
      {/* يحافظ على التمرير الأفقي عند الحاجة ويمنع اهتزاز الواجهة */}
      <div className="overflow-x-auto overscroll-x-contain">
        <TransactionPage />
      </div>
    </div>
  );
}

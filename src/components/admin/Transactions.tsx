"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { TransactionTable } from "@/components/admin/TransactionTable";

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
    <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-screen-lg mx-auto">
      <div className="overflow-x-auto">
        <TransactionTable data={transactions} />
      </div>
    </div>
  );
}

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
    <div className="px-4 sm:px-6 lg:px-8 py-6 w-full">
      <div className="overflow-x-auto">
        <TransactionPage />
      </div>
    </div>
  );
}

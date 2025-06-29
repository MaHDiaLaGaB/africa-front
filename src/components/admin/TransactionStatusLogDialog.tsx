// components/TransactionStatusLogDialog.tsx
"use client";

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import api from "@/lib/api";

export default function TransactionStatusLogDialog({ transactionId }: { transactionId: number }) {
  const [open, setOpen] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    if (open) {
      api.get(`/admintx/transaction/${transactionId}/status-log`).then((res) => {
        setLogs(res.data);
      });
    }
  }, [open, transactionId]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="text-sm sm:text-base">
          سجل الحالات
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full max-w-full sm:max-w-lg p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            سجل تغييرات الحالة للمعاملة #{transactionId}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2 sm:space-y-3 max-h-72 sm:max-h-96 overflow-y-auto">
          {logs.map((log, idx) => (
            <div key={idx} className="border p-2 sm:p-4 rounded bg-muted">
              <div className="text-sm sm:text-base"><strong>من:</strong> {log.previous_status}</div>
              <div className="text-sm sm:text-base"><strong>إلى:</strong> {log.new_status}</div>
              <div className="text-sm sm:text-base"><strong>السبب:</strong> {log.reason || "بدون سبب"}</div>
              <div className="text-sm sm:text-base"><strong>بواسطة:</strong> {log.changed_by}</div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">{log.changed_at}</div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
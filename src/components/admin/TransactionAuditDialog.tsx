// components/TransactionAuditDialog.tsx
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

export default function TransactionAuditDialog({ transactionId }: { transactionId: number }) {
  const [open, setOpen] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    if (open) {
      api.get(`/transaction/${transactionId}/audits`).then((res) => {
        setLogs(res.data);
      });
    }
  }, [open, transactionId]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="text-sm sm:text-base">
          سجل العمليات
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full max-w-full sm:max-w-lg p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            سجل التعديلات للمعاملة #{transactionId}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2 sm:space-y-3 max-h-72 sm:max-h-96 overflow-y-auto">
          {logs.map((log, idx) => (
            <div
              key={idx}
              className="border p-2 sm:p-4 rounded bg-muted"
            >
              <div className="text-sm sm:text-base">
                <strong>المجال:</strong> {log.field}
              </div>
              <div className="text-sm sm:text-base">
                <strong>قبل:</strong> {log.old_value}
              </div>
              <div className="text-sm sm:text-base">
                <strong>بعد:</strong> {log.new_value}
              </div>
              <div className="text-sm sm:text-base">
                <strong>بواسطة:</strong> {log.modified_by}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                {log.timestamp}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

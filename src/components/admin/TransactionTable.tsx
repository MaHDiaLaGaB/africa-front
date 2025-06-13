// components/TransactionTable.tsx
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import TransactionStatusLogDialog from "./TransactionStatusLogDialog";
import TransactionAuditDialog from "./TransactionAuditDialog";
import TransactionStatusModal from "./TransactionStatusModel";
import { Button } from "@/components/ui/button";

export function TransactionTable({ data }: { data: any[] }) {
  return (
    <div className="overflow-x-auto w-full border rounded-lg shadow-sm bg-white">
      <table className="min-w-full text-right text-xs sm:text-sm">
        <thead className="bg-gray-100 text-gray-700 font-semibold">
          <tr>
            <th className="p-2 sm:p-4">#</th>
            <th className="p-2 sm:p-4">🔖 المرجع</th>
            <th className="p-2 sm:p-4">🧾 الخدمة</th>
            <th className="p-2 sm:p-4 hidden sm:table-cell">💵 المبلغ (أجنبي)</th>
            <th className="p-2 sm:p-4">💶 المبلغ (LYD)</th>
            <th className="p-2 sm:p-4">📌 الحالة</th>
            <th className="p-2 sm:p-4 hidden md:table-cell">📅 التاريخ</th>
            <th className="p-2 sm:p-4 text-center">⚙️ الإجراءات</th>
          </tr>
        </thead>
        <tbody>
          {data.map((tx, i) => (
            <tr key={tx.id} className="border-b hover:bg-gray-50">
              <td className="p-2 sm:p-4 font-medium text-gray-700">{i + 1}</td>
              <td className="p-2 sm:p-4 font-mono text-blue-600 truncate max-w-[100px] sm:max-w-none">
                {tx.reference}
              </td>
              <td className="p-2 sm:p-4 truncate max-w-[120px] sm:max-w-none">
                {tx.service?.name || (
                  <span className="text-gray-400">غير محددة</span>
                )}
              </td>
              <td className="p-2 sm:p-4 hidden sm:table-cell">{Number(tx.amount_foreign).toFixed(2)}</td>
              <td className="p-2 sm:p-4">{Number(tx.amount_lyd).toFixed(2)}</td>
              <td className="p-2 sm:p-4">
                <Badge
                  variant={getStatusColor(tx.status)}
                  className="uppercase tracking-wide text-[10px] sm:text-xs"
                >
                  {getStatusLabel(tx.status)}
                </Badge>
              </td>
              <td className="p-2 sm:p-4 text-muted-foreground hidden md:table-cell">
                {formatDate(tx.created_at)}
              </td>
              <td className="p-2 sm:p-4 flex flex-wrap gap-1 sm:gap-2 justify-center">
                <TransactionStatusModal
                  transactionId={tx.id}
                  onSuccess={() => {}}
                />
                <TransactionAuditDialog transactionId={tx.id} />
                <TransactionStatusLogDialog transactionId={tx.id} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function getStatusColor(
  status: string
): "default" | "destructive" | "outline" | "secondary" {
  switch (status) {
    case "completed":
      return "default";
    case "cancelled":
      return "destructive";
    case "pending":
      return "outline";
    case "returned":
      return "secondary";
    default:
      return "default";
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case "completed":
      return "مكتمل";
    case "cancelled":
      return "ملغي";
    case "pending":
      return "قيد الانتظار";
    case "returned":
      return "مسترجع";
    default:
      return status;
  }
}

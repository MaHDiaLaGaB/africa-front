import { Card } from "@/components/ui/card";

export default function StatCard({
  title,
  value,
}: {
  title: string;
  value: string | number;
}) {
  return (
    <Card className="w-full p-4 sm:p-6 text-center shadow-md border rounded-lg">
      <h2 className="text-xs sm:text-sm md:text-base text-muted-foreground truncate">
        {title}
      </h2>
      <p className="text-xl sm:text-2xl md:text-3xl font-bold text-primary mt-2">
        {value}
      </p>
    </Card>
  );
}

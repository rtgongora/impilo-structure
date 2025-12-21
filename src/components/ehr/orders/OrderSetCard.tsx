import { Package, FileText, Scan, Activity, Stethoscope, Utensils, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { OrderSet } from "./orderSetsData";

interface OrderSetCardProps {
  orderSet: OrderSet;
  onClick: (orderSet: OrderSet) => void;
}

const categoryColors: Record<string, string> = {
  infectious: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  respiratory: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  cardiac: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400',
  gastrointestinal: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  endocrine: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  surgical: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  obstetric: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400',
  paediatric: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
  emergency: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

export function OrderSetCard({ orderSet, onClick }: OrderSetCardProps) {
  const orderCounts = {
    medications: orderSet.orders.filter(o => o.type === 'medication').length,
    labs: orderSet.orders.filter(o => o.type === 'lab').length,
    imaging: orderSet.orders.filter(o => o.type === 'imaging').length,
    other: orderSet.orders.filter(o => !['medication', 'lab', 'imaging'].includes(o.type)).length,
  };

  return (
    <Card 
      className="cursor-pointer hover:border-primary hover:shadow-md transition-all"
      onClick={() => onClick(orderSet)}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          <div>
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold line-clamp-1">{orderSet.name}</h3>
              <Badge className={categoryColors[orderSet.category] || 'bg-muted'}>
                {orderSet.category}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{orderSet.description}</p>
          </div>
          
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {orderCounts.medications > 0 && (
              <div className="flex items-center gap-1">
                <Package className="h-3 w-3" />
                <span>{orderCounts.medications} meds</span>
              </div>
            )}
            {orderCounts.labs > 0 && (
              <div className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                <span>{orderCounts.labs} labs</span>
              </div>
            )}
            {orderCounts.imaging > 0 && (
              <div className="flex items-center gap-1">
                <Scan className="h-3 w-3" />
                <span>{orderCounts.imaging} imaging</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
            <span>By {orderSet.author}</span>
            <span>Used {orderSet.usageCount}x</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

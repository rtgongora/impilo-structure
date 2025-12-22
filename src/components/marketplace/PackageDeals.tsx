import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Package, Clock, Percent, ShoppingCart, Store, ChevronRight, Sparkles } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface PackageDeal {
  id: string;
  name: string;
  description: string | null;
  category: string;
  original_price: number;
  discounted_price: number;
  discount_percentage: number;
  valid_from: string;
  valid_until: string | null;
  max_redemptions: number | null;
  current_redemptions: number;
  terms_conditions: string | null;
  image_url: string | null;
  vendor?: {
    id: string;
    name: string;
    city: string | null;
  } | null;
  items?: PackageDealItem[];
}

interface PackageDealItem {
  id: string;
  product_name: string;
  quantity: number;
}

interface PackageDealsProps {
  onSelectDeal?: (deal: PackageDeal) => void;
}

export function PackageDeals({ onSelectDeal }: PackageDealsProps) {
  const { data: deals = [], isLoading } = useQuery({
    queryKey: ["package-deals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("package_deals")
        .select(`
          *,
          vendor:vendors(id, name, city),
          items:package_deal_items(id, product_name, quantity)
        `)
        .eq("is_active", true)
        .gte("valid_until", new Date().toISOString())
        .order("discount_percentage", { ascending: false });

      if (error) throw error;
      return data as PackageDeal[];
    },
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(price);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Package Deals</h2>
        </div>
        <div className="flex gap-4 overflow-hidden">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="w-[320px] shrink-0 animate-pulse">
              <CardContent className="p-4">
                <div className="h-32 bg-muted rounded mb-3" />
                <div className="h-4 bg-muted rounded w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (deals.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Package Deals</h2>
          <Badge variant="secondary">{deals.length} offers</Badge>
        </div>
        <Button variant="ghost" size="sm">
          View All <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-4 pb-4">
          {deals.map((deal) => (
            <Card
              key={deal.id}
              className="w-[320px] shrink-0 cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all group"
              onClick={() => onSelectDeal?.(deal)}
            >
              <CardContent className="p-4">
                {/* Image or Placeholder */}
                <div className="relative h-32 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                  {deal.image_url ? (
                    <img src={deal.image_url} alt={deal.name} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="h-12 w-12 text-primary/50" />
                  )}
                  <Badge className="absolute top-2 right-2 bg-green-600">
                    <Percent className="h-3 w-3 mr-1" />
                    {deal.discount_percentage}% OFF
                  </Badge>
                </div>

                {/* Deal Info */}
                <div className="space-y-2">
                  <div>
                    <h3 className="font-semibold line-clamp-1">{deal.name}</h3>
                    {deal.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 whitespace-normal">
                        {deal.description}
                      </p>
                    )}
                  </div>

                  {/* Items Preview */}
                  {deal.items && deal.items.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {deal.items.slice(0, 3).map((item) => (
                        <Badge key={item.id} variant="outline" className="text-xs">
                          {item.quantity}x {item.product_name}
                        </Badge>
                      ))}
                      {deal.items.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{deal.items.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Pricing */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground line-through">
                        {formatPrice(deal.original_price)}
                      </p>
                      <p className="text-lg font-bold text-primary">
                        {formatPrice(deal.discounted_price)}
                      </p>
                    </div>
                    <Button size="sm" className="group-hover:bg-primary">
                      <ShoppingCart className="h-4 w-4 mr-1" />
                      Get Deal
                    </Button>
                  </div>

                  {/* Vendor & Expiry */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
                    {deal.vendor && (
                      <span className="flex items-center gap-1">
                        <Store className="h-3 w-3" />
                        {deal.vendor.name}
                      </span>
                    )}
                    {deal.valid_until && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Ends {formatDistanceToNow(new Date(deal.valid_until), { addSuffix: true })}
                      </span>
                    )}
                  </div>

                  {/* Redemption limit */}
                  {deal.max_redemptions && (
                    <div className="text-xs text-orange-600">
                      {deal.max_redemptions - deal.current_redemptions} of {deal.max_redemptions} remaining
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}

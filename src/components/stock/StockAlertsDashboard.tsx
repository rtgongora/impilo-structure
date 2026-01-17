import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  AlertCircle,
  Clock,
  Package,
  Check,
  RefreshCw,
  Bell,
  XCircle,
  Calendar,
  Loader2,
} from "lucide-react";
import { useStockAlerts, generateStockAlerts } from "@/hooks/useStockManagement";
import { formatDistanceToNow } from "date-fns";

interface StockAlertsDashboardProps {
  onCreatePO?: (itemId: string) => void;
}

export function StockAlertsDashboard({ onCreatePO }: StockAlertsDashboardProps) {
  const [activeTab, setActiveTab] = useState("active");
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { alerts, criticalAlerts, warningAlerts, isLoading, acknowledgeAlert, resolveAlert, refetch } = useStockAlerts(activeTab === "resolved");

  const handleRefreshAlerts = async () => {
    setIsRefreshing(true);
    try {
      await generateStockAlerts();
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'out_of_stock': return <XCircle className="h-5 w-5 text-destructive" />;
      case 'low_stock': return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'expired': return <AlertCircle className="h-5 w-5 text-destructive" />;
      case 'expiring_soon': return <Clock className="h-5 w-5 text-amber-500" />;
      case 'overstock': return <Package className="h-5 w-5 text-blue-500" />;
      default: return <Bell className="h-5 w-5" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-destructive text-destructive-foreground';
      case 'warning': return 'bg-orange-500 text-white';
      case 'info': return 'bg-blue-500 text-white';
      default: return 'bg-muted';
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Stock Alerts
            </CardTitle>
            <CardDescription>Reorder and expiry notifications</CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefreshAlerts}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        {/* Summary badges */}
        <div className="flex gap-2 mt-3">
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            {criticalAlerts.length} Critical
          </Badge>
          <Badge variant="outline" className="gap-1 border-orange-500 text-orange-600">
            <AlertTriangle className="h-3 w-3" />
            {warningAlerts.length} Warning
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="px-4">
            <TabsList className="w-full">
              <TabsTrigger value="active" className="flex-1">Active</TabsTrigger>
              <TabsTrigger value="resolved" className="flex-1">Resolved</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="active" className="mt-0">
            <ScrollArea className="h-[400px]">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : alerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Check className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p>No active alerts</p>
                </div>
              ) : (
                <AnimatePresence>
                  {alerts.map((alert, index) => (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b last:border-0"
                    >
                      <div className="p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">
                            {getAlertIcon(alert.alert_type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className={getSeverityColor(alert.severity)} variant="secondary">
                                {alert.severity}
                              </Badge>
                              <Badge variant="outline" className="capitalize">
                                {alert.alert_type.replace('_', ' ')}
                              </Badge>
                            </div>
                            <p className="text-sm font-medium">{alert.message}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span>{formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}</span>
                              {alert.current_quantity !== null && (
                                <span>Qty: {alert.current_quantity}</span>
                              )}
                              {alert.expiry_date && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {alert.expiry_date}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 mt-3 ml-8">
                          {!alert.is_acknowledged && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => acknowledgeAlert.mutate({ 
                                id: alert.id, 
                                acknowledgedBy: 'Current User' 
                              })}
                            >
                              Acknowledge
                            </Button>
                          )}
                          {(alert.alert_type === 'low_stock' || alert.alert_type === 'out_of_stock') && onCreatePO && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => onCreatePO(alert.stock_item_id)}
                            >
                              Create PO
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => resolveAlert.mutate(alert.id)}
                          >
                            Resolve
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="resolved" className="mt-0">
            <ScrollArea className="h-[400px]">
              {alerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No resolved alerts</p>
                </div>
              ) : (
                alerts.map((alert) => (
                  <div key={alert.id} className="p-4 border-b last:border-0 opacity-60">
                    <div className="flex items-start gap-3">
                      {getAlertIcon(alert.alert_type)}
                      <div>
                        <p className="text-sm font-medium line-through">{alert.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Resolved {alert.resolved_at && formatDistanceToNow(new Date(alert.resolved_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

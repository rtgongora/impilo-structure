import { PaymentGateway } from "@/components/payments/PaymentGateway";
import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InsuranceClaims } from "@/components/payments/InsuranceClaims";
import { PaymentMethods } from "@/components/payments/PaymentMethods";
import { HealthWallet } from "@/components/payments/HealthWallet";
import { RemittanceViewer } from "@/components/payments/RemittanceViewer";
import { CBZBankIntegration } from "@/components/payments/CBZBankIntegration";
import { CashierBillingDashboard } from "@/components/payments/CashierBillingDashboard";
import { ClaimsManagement } from "@/components/payments/ClaimsManagement";
import { CashReconciliation } from "@/components/payments/CashReconciliation";
import { CostTrackingDashboard } from "@/components/payments/CostTrackingDashboard";
import { RemittanceProcessing } from "@/components/payments/RemittanceProcessing";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

const Payments = () => {
  return (
    <AppLayout title="Payments & Billing">
      <Tabs defaultValue="cashier" className="p-4 space-y-4">
        <ScrollArea className="w-full whitespace-nowrap">
          <TabsList className="inline-flex w-max">
            <TabsTrigger value="cashier">Cashier Dashboard</TabsTrigger>
            <TabsTrigger value="reconciliation">Cash Reconciliation</TabsTrigger>
            <TabsTrigger value="gateway">Payment Gateway</TabsTrigger>
            <TabsTrigger value="cbz">CBZ Bank</TabsTrigger>
            <TabsTrigger value="wallet">Health Wallet</TabsTrigger>
            <TabsTrigger value="methods">Payment Methods</TabsTrigger>
            <TabsTrigger value="claims">Claims Management</TabsTrigger>
            <TabsTrigger value="remittance">Remittance Processing</TabsTrigger>
            <TabsTrigger value="costs">Cost Tracking</TabsTrigger>
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
        
        <TabsContent value="cashier">
          <CashierBillingDashboard />
        </TabsContent>
        <TabsContent value="reconciliation">
          <CashReconciliation />
        </TabsContent>
        <TabsContent value="gateway">
          <PaymentGateway />
        </TabsContent>
        <TabsContent value="cbz">
          <div className="py-8">
            <CBZBankIntegration amount={250.00} reference="INV-2024-001234" />
          </div>
        </TabsContent>
        <TabsContent value="wallet">
          <HealthWallet />
        </TabsContent>
        <TabsContent value="methods">
          <PaymentMethods />
        </TabsContent>
        <TabsContent value="claims">
          <ClaimsManagement />
        </TabsContent>
        <TabsContent value="remittance">
          <RemittanceProcessing />
        </TabsContent>
        <TabsContent value="costs">
          <CostTrackingDashboard />
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
};

export default Payments;

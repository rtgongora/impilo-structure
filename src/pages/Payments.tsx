import { PaymentGateway } from "@/components/payments/PaymentGateway";
import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InsuranceClaims } from "@/components/payments/InsuranceClaims";
import { PaymentMethods } from "@/components/payments/PaymentMethods";
import { HealthWallet } from "@/components/payments/HealthWallet";
import { RemittanceViewer } from "@/components/payments/RemittanceViewer";
import { CBZBankIntegration } from "@/components/payments/CBZBankIntegration";

const Payments = () => {
  return (
    <AppLayout title="Payments & Billing">
      <Tabs defaultValue="gateway" className="p-4 space-y-4">
        <TabsList>
          <TabsTrigger value="gateway">Payment Gateway</TabsTrigger>
          <TabsTrigger value="cbz">CBZ Bank</TabsTrigger>
          <TabsTrigger value="wallet">Health Wallet</TabsTrigger>
          <TabsTrigger value="methods">Payment Methods</TabsTrigger>
          <TabsTrigger value="claims">Insurance Claims</TabsTrigger>
          <TabsTrigger value="remittance">Remittance/ERA</TabsTrigger>
        </TabsList>
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
          <InsuranceClaims />
        </TabsContent>
        <TabsContent value="remittance" className="h-[calc(100vh-200px)]">
          <RemittanceViewer />
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
};

export default Payments;

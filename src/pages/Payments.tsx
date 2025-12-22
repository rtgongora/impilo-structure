import { PaymentGateway } from "@/components/payments/PaymentGateway";
import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InsuranceClaims } from "@/components/payments/InsuranceClaims";
import { PaymentMethods } from "@/components/payments/PaymentMethods";
import { HealthWallet } from "@/components/payments/HealthWallet";

const Payments = () => {
  return (
    <AppLayout title="Payments & Billing">
      <Tabs defaultValue="gateway" className="space-y-6">
        <TabsList>
          <TabsTrigger value="gateway">Payment Gateway</TabsTrigger>
          <TabsTrigger value="wallet">Health Wallet</TabsTrigger>
          <TabsTrigger value="methods">Payment Methods</TabsTrigger>
          <TabsTrigger value="claims">Insurance Claims</TabsTrigger>
        </TabsList>
        <TabsContent value="gateway">
          <PaymentGateway />
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
      </Tabs>
    </AppLayout>
  );
};

export default Payments;

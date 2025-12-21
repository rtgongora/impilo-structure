import { PaymentGateway } from "@/components/payments/PaymentGateway";
import { AppLayout } from "@/components/layout/AppLayout";

const Payments = () => {
  return (
    <AppLayout title="Payments & Billing">
      <PaymentGateway />
    </AppLayout>
  );
};

export default Payments;

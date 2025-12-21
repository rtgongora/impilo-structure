import { PaymentGateway } from "@/components/payments/PaymentGateway";
import { TopBar } from "@/components/layout/TopBar";
import { EHRProvider } from "@/contexts/EHRContext";

const Payments = () => {
  return (
    <EHRProvider>
      <div className="h-screen flex flex-col overflow-hidden">
        <TopBar />
        <div className="flex-1 overflow-y-auto bg-background p-6">
          <PaymentGateway />
        </div>
      </div>
    </EHRProvider>
  );
};

export default Payments;

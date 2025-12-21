import { EHRProvider } from "@/contexts/EHRContext";
import { EHRLayout } from "@/components/layout/EHRLayout";

const Index = () => {
  return (
    <EHRProvider>
      <EHRLayout />
    </EHRProvider>
  );
};

export default Index;

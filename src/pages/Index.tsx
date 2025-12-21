import { EHRProvider } from "@/contexts/EHRContext";
import { ProviderContextProvider } from "@/contexts/ProviderContext";
import { EHRLayout } from "@/components/layout/EHRLayout";

const Index = () => {
  return (
    <ProviderContextProvider>
      <EHRProvider>
        <EHRLayout />
      </EHRProvider>
    </ProviderContextProvider>
  );
};

export default Index;

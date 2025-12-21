import { useParams, useSearchParams } from "react-router-dom";
import { EHRProvider } from "@/contexts/EHRContext";
import { ProviderContextProvider } from "@/contexts/ProviderContext";
import { EHRLayout } from "@/components/layout/EHRLayout";

const Encounter = () => {
  const { encounterId } = useParams<{ encounterId?: string }>();
  const [searchParams] = useSearchParams();
  const view = searchParams.get('view');

  // The encounterId can be used to fetch specific encounter data
  // For now, we pass it to the context providers
  console.log('Encounter ID:', encounterId, 'View:', view);

  return (
    <ProviderContextProvider>
      <EHRProvider>
        <EHRLayout />
      </EHRProvider>
    </ProviderContextProvider>
  );
};

export default Encounter;

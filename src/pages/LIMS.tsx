import { LIMSIntegration } from "@/components/lab/LIMSIntegration";
import { AppLayout } from "@/components/layout/AppLayout";

const LIMS = () => {
  return (
    <AppLayout title="Laboratory Information System">
      <LIMSIntegration />
    </AppLayout>
  );
};

export default LIMS;

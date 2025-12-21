import { OdooIntegration } from "@/components/integrations/OdooIntegration";
import { AppLayout } from "@/components/layout/AppLayout";

const Odoo = () => {
  return (
    <AppLayout title="Odoo ERP Integration">
      <OdooIntegration />
    </AppLayout>
  );
};

export default Odoo;

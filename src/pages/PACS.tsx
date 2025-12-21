import { PACSViewer } from "@/components/imaging/PACSViewer";
import { AppLayout } from "@/components/layout/AppLayout";

const PACS = () => {
  return (
    <AppLayout title="PACS Imaging">
      <PACSViewer />
    </AppLayout>
  );
};

export default PACS;

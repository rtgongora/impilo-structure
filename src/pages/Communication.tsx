import { AppLayout } from "@/components/layout/AppLayout";
import { CommunicationHub } from "@/components/communication/CommunicationHub";
import { useSearchParams } from "react-router-dom";

const Communication = () => {
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const defaultTab =
    tabParam === "messages" || tabParam === "pages" || tabParam === "calls" ? tabParam : "messages";

  return (
    <AppLayout>
      <CommunicationHub defaultTab={defaultTab} />
    </AppLayout>
  );
};

export default Communication;

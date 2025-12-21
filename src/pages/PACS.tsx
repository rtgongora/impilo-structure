import { PACSViewer } from "@/components/imaging/PACSViewer";
import { TopBar } from "@/components/layout/TopBar";
import { EHRProvider } from "@/contexts/EHRContext";

const PACS = () => {
  return (
    <EHRProvider>
      <div className="h-screen flex flex-col overflow-hidden">
        <TopBar />
        <div className="flex-1 overflow-hidden">
          <PACSViewer />
        </div>
      </div>
    </EHRProvider>
  );
};

export default PACS;

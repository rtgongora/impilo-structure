import { TheatreBookingSystem } from "@/components/booking/TheatreBookingSystem";
import { TopBar } from "@/components/layout/TopBar";
import { EHRProvider } from "@/contexts/EHRContext";

const Theatre = () => {
  return (
    <EHRProvider>
      <div className="h-screen flex flex-col overflow-hidden">
        <TopBar />
        <div className="flex-1 overflow-y-auto bg-background p-6">
          <TheatreBookingSystem />
        </div>
      </div>
    </EHRProvider>
  );
};

export default Theatre;

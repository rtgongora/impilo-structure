import { ShiftHandoffReport } from "@/components/handoff/ShiftHandoffReport";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Handoff = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Shift Handoff Report</h1>
        </div>
      </header>
      <main className="container mx-auto p-6">
        <ShiftHandoffReport />
      </main>
    </div>
  );
};

export default Handoff;

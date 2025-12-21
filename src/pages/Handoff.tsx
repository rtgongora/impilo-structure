import { ShiftHandoffReport } from "@/components/handoff/ShiftHandoffReport";
import { HandoffHistory } from "@/components/handoff/HandoffHistory";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, ClipboardList, History } from "lucide-react";
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
          <h1 className="text-xl font-bold">Shift Handoff</h1>
        </div>
      </header>
      <main className="container mx-auto p-6">
        <Tabs defaultValue="new" className="space-y-6">
          <TabsList>
            <TabsTrigger value="new" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              New Handoff
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="new">
            <ShiftHandoffReport />
          </TabsContent>

          <TabsContent value="history">
            <HandoffHistory />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Handoff;

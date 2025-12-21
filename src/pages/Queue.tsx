import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Activity, 
  Building2, 
  ChevronRight, 
  Settings, 
  LogOut,
  Users,
  Bed,
  Stethoscope
} from "lucide-react";
import { QueueManagement } from "@/components/ehr/queue/QueueManagement";

const Queue = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [workspace, setWorkspace] = useState<'my-queue' | 'ward' | 'department'>('my-queue');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
              <Activity className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-xl font-bold text-primary">Impilo EHR</h1>
                <p className="text-xs text-muted-foreground">Electronic Health Records</p>
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
            <Building2 className="h-4 w-4" />
            <span>Central Hospital</span>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium">Queue Management</span>
          </div>

          <div className="flex items-center gap-4">
            <Avatar className="h-9 w-9">
              <AvatarImage src={profile?.avatar_url || ""} />
              <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                {profile?.display_name?.split(" ").map(n => n[0]).join("").slice(0, 2) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:block">
              <p className="text-sm font-medium">{profile?.display_name}</p>
              <p className="text-xs text-muted-foreground capitalize">{profile?.role}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => navigate("/profile")}>
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => signOut()}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Workspace Switcher */}
        <div className="mb-6">
          <Tabs value={workspace} onValueChange={(v) => setWorkspace(v as typeof workspace)}>
            <TabsList>
              <TabsTrigger value="my-queue" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                My Queue
              </TabsTrigger>
              <TabsTrigger value="ward" className="flex items-center gap-2">
                <Bed className="h-4 w-4" />
                Ward View
              </TabsTrigger>
              <TabsTrigger value="department" className="flex items-center gap-2">
                <Stethoscope className="h-4 w-4" />
                Department
              </TabsTrigger>
            </TabsList>

            <TabsContent value="my-queue" className="mt-4">
              <QueueManagement workspace="my-queue" />
            </TabsContent>
            <TabsContent value="ward" className="mt-4">
              <QueueManagement workspace="ward" wardFilter="Ward 3A" />
            </TabsContent>
            <TabsContent value="department" className="mt-4">
              <QueueManagement workspace="department" />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Queue;

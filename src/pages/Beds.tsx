import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Activity, 
  Building2, 
  ChevronRight, 
  Settings, 
  LogOut,
  ArrowLeft,
} from "lucide-react";
import { BedManagement } from "@/components/ehr/beds/BedManagement";

const Beds = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/queue")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
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
            <span className="text-foreground font-medium">Bed Management</span>
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

      <main className="flex-1">
        <BedManagement />
      </main>
    </div>
  );
};

export default Beds;

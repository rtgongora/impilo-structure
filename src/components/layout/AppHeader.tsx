import { ArrowLeft, Home } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PatientSearch } from "@/components/search/PatientSearch";
import { HandoffNotifications } from "@/components/handoff/HandoffNotifications";
import { VoiceCommandButton } from "@/components/voice/VoiceCommandButton";

interface AppHeaderProps {
  title?: string;
}

export function AppHeader({ title }: AppHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const isHomePage = location.pathname === "/";
  const isDashboard = location.pathname === "/dashboard";

  return (
    <header className="h-14 min-h-[3.5rem] bg-card border-b border-border flex items-center justify-between px-5 shrink-0">
      {/* Left: Navigation & Title */}
      <div className="flex items-center gap-2">
        {!isHomePage && (
          <Button
            variant="default"
            size="sm"
            onClick={() => navigate("/")}
            className="gap-1.5"
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline text-sm">Home</span>
          </Button>
        )}

        {!isHomePage && !isDashboard && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline text-sm">Back</span>
          </Button>
        )}

        {title && (
          <>
            <div className="h-5 w-px bg-border mx-1 hidden sm:block" />
            <h1 className="text-sm font-semibold truncate max-w-[200px] md:max-w-none">
              {title}
            </h1>
          </>
        )}
      </div>

      {/* Center: Patient Search */}
      <div className="flex-1 max-w-sm mx-4">
        <PatientSearch />
      </div>

      {/* Right: Contextual Actions */}
      <div className="flex items-center gap-1.5">
        <VoiceCommandButton onCommand={(cmd, action) => console.log(action, cmd)} />
      </div>
    </header>
  );
}

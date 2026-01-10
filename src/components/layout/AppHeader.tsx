import { Bell, Settings, LogOut, ArrowLeft, Home } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PatientSearch } from "@/components/search/PatientSearch";
import { HandoffNotifications } from "@/components/handoff/HandoffNotifications";
import { VoiceCommandButton } from "@/components/voice/VoiceCommandButton";
import { ActiveWorkspaceIndicator } from "@/components/layout/ActiveWorkspaceIndicator";
import { FacilitySelector } from "@/components/layout/FacilitySelector";

interface AppHeaderProps {
  title?: string;
}

export function AppHeader({ title }: AppHeaderProps) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isHomePage = location.pathname === "/";
  const isDashboard = location.pathname === "/dashboard";

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <header className="h-12 bg-card border-b flex items-center justify-between px-2 shrink-0">
      {/* Left: Home Button & Navigation */}
      <div className="flex items-center gap-1">
        {!isHomePage && (
          <Button
            variant="default"
            size="sm"
            onClick={() => navigate("/")}
            className="gap-1"
          >
            <Home className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-xs">Home</span>
          </Button>
        )}
        
        {!isHomePage && !isDashboard && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-xs">Back</span>
          </Button>
        )}
        
        {title && (
          <>
            <div className="h-4 w-px bg-border mx-1 hidden sm:block" />
            <h1 className="text-xs font-semibold truncate max-w-[120px] md:max-w-none">{title}</h1>
          </>
        )}
      </div>

      {/* Center: Patient Search */}
      <div className="flex-1 max-w-xs mx-2">
        <PatientSearch />
      </div>

      {/* Right: Actions & User */}
      <div className="flex items-center gap-1">
        <div className="hidden md:block">
          <FacilitySelector />
        </div>
        
        <div className="hidden lg:block">
          <ActiveWorkspaceIndicator />
        </div>

        <VoiceCommandButton onCommand={(cmd, action) => console.log(action, cmd)} />
        
        <HandoffNotifications />

        <Button variant="ghost" size="icon" className="relative h-7 w-7">
          <Bell className="h-3.5 w-3.5" />
          <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 bg-destructive text-destructive-foreground text-[9px] rounded-full flex items-center justify-center">
            3
          </span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-1.5 px-1.5 h-8">
              <Avatar className="h-6 w-6">
                <AvatarImage src={profile?.avatar_url || ""} />
                <AvatarFallback className="bg-primary text-primary-foreground text-[10px]">
                  {profile?.display_name ? getInitials(profile.display_name) : "U"}
                </AvatarFallback>
              </Avatar>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-medium leading-none">{profile?.display_name}</p>
                <p className="text-[10px] text-muted-foreground capitalize">{profile?.role}</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="text-xs">My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/profile")} className="text-xs">
              <Settings className="mr-2 h-3.5 w-3.5" />
              Profile Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-xs text-destructive">
              <LogOut className="mr-2 h-3.5 w-3.5" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

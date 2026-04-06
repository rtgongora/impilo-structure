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
import { HelpMenu } from "@/components/help/HelpMenu";

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
    <header className="h-14 bg-card border-b flex items-center justify-between px-4 shrink-0">
      {/* Left: Home Button & Navigation */}
      <div className="flex items-center gap-2">
        {!isHomePage && (
          <Button
            variant="default"
            size="default"
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
            size="default"
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
            <h1 className="text-base font-semibold truncate max-w-[200px] md:max-w-none">{title}</h1>
          </>
        )}
      </div>

      {/* Center: Patient Search */}
      <div className="flex-1 max-w-sm mx-4">
        <PatientSearch />
      </div>

      {/* Right: Actions & User */}
      <div className="flex items-center gap-2">
        <div className="hidden md:block">
          <FacilitySelector />
        </div>
        
        <div className="hidden lg:block">
          <ActiveWorkspaceIndicator />
        </div>

        <VoiceCommandButton onCommand={(cmd, action) => console.log(action, cmd)} />
        
        <HandoffNotifications />

        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-4 w-4" />
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-destructive text-destructive-foreground text-[10px] rounded-full flex items-center justify-center">
            3
          </span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2 h-10">
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile?.avatar_url || ""} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {profile?.display_name ? getInitials(profile.display_name) : "U"}
                </AvatarFallback>
              </Avatar>
              <div className="hidden lg:block text-left">
                <p className="text-sm font-medium leading-none">{profile?.display_name}</p>
                <p className="text-xs text-muted-foreground capitalize">{profile?.role}</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="text-sm">My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/profile")} className="text-sm">
              <Settings className="mr-2 h-4 w-4" />
              Profile Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-sm text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

import { Bell, Settings, LogOut, Search, ArrowLeft, Home } from "lucide-react";
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
        {/* Always show Home button (except on home page) */}
        {!isHomePage && (
          <Button
            variant="default"
            size="sm"
            onClick={() => navigate("/")}
            className="gap-1"
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Home</span>
          </Button>
        )}
        
        {/* Back button for deeper navigation (not on home or dashboard) */}
        {!isHomePage && !isDashboard && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Back</span>
          </Button>
        )}
        
        {title && (
          <>
            <div className="h-5 w-px bg-border mx-2 hidden sm:block" />
            <h1 className="text-lg font-semibold">{title}</h1>
          </>
        )}
      </div>

      {/* Center: Patient Search */}
      <div className="flex-1 max-w-md mx-4">
        <PatientSearch />
      </div>

      {/* Right: Actions & User */}
      <div className="flex items-center gap-2">
        <VoiceCommandButton onCommand={(cmd, action) => console.log(action, cmd)} />
        
        <HandoffNotifications />

        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
            3
          </span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile?.avatar_url || ""} />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {profile?.display_name ? getInitials(profile.display_name) : "U"}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium">{profile?.display_name}</p>
                <p className="text-xs text-muted-foreground capitalize">{profile?.role}</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/profile")}>
              <Settings className="mr-2 h-4 w-4" />
              Profile Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

import { UserMenu } from "@/components/auth/UserMenu";
import { ActiveWorkspaceIndicator } from "@/components/layout/ActiveWorkspaceIndicator";
import { FacilitySelector } from "@/components/layout/FacilitySelector";
import { PatientLocationBadge } from "@/components/layout/PatientLocationBadge";
import { NotificationsCommsHub } from "@/components/layout/NotificationsCommsHub";
import { HelpMenu } from "@/components/help/HelpMenu";
import impiloLogo from "@/assets/impilo-logo.png";

export function UtilityStrip() {
  return (
    <div className="h-11 min-h-[2.75rem] shrink-0 bg-card border-b border-border flex items-center justify-between px-4 z-50">
      {/* Left: Logo & Facility */}
      <div className="flex items-center gap-3">
        <img src={impiloLogo} alt="Impilo" className="h-5 w-auto" />
        <div className="h-4 w-px bg-border" />
        <FacilitySelector />
      </div>

      {/* Center: Patient Location Context */}
      <PatientLocationBadge />

      {/* Right: Notifications, Help, Workspace & User */}
      <div className="flex items-center gap-2">
        <NotificationsCommsHub />
        <HelpMenu variant="button" />
        <ActiveWorkspaceIndicator compact />
        <div className="h-4 w-px bg-border" />
        <UserMenu />
      </div>
    </div>
  );
}

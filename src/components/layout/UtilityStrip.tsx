import { UserMenu } from "@/components/auth/UserMenu";
import { ActiveWorkspaceIndicator } from "@/components/layout/ActiveWorkspaceIndicator";
import { FacilitySelector } from "@/components/layout/FacilitySelector";
import impiloLogo from "@/assets/impilo-logo.png";

export function UtilityStrip() {
  return (
    <div className="h-9 min-h-[2.25rem] shrink-0 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-3 z-50">
      {/* Left: Logo & Facility */}
      <div className="flex items-center gap-3">
        <img src={impiloLogo} alt="Impilo" className="h-5 w-auto" />
        <div className="h-4 w-px bg-slate-700" />
        <FacilitySelector />
      </div>

      {/* Right: Workspace & User */}
      <div className="flex items-center gap-2">
        <ActiveWorkspaceIndicator compact />
        <div className="h-4 w-px bg-slate-700" />
        <UserMenu />
      </div>
    </div>
  );
}

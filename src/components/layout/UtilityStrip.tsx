import { UserMenu } from "@/components/auth/UserMenu";
import { FacilitySelector } from "@/components/layout/FacilitySelector";

export function UtilityStrip() {
  return (
    <div className="h-7 min-h-[1.75rem] shrink-0 bg-muted/30 border-b border-border/50 flex items-center justify-between px-3">
      {/* Left: Facility */}
      <div className="flex items-center gap-2">
        <FacilitySelector />
      </div>

      {/* Right: User Menu */}
      <div className="flex items-center gap-2">
        <UserMenu />
      </div>
    </div>
  );
}

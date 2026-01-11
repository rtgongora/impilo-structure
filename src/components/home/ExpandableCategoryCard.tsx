import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModuleItem {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  color: string;
  roles?: string[];
}

interface ExpandableCategoryCardProps {
  id: string;
  title: string;
  description: string;
  modules: ModuleItem[];
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  roles?: string[];
  onModuleClick: (path: string) => void;
  defaultExpanded?: boolean;
}

export function ExpandableCategoryCard({
  id,
  title,
  description,
  modules,
  icon: Icon,
  color,
  roles,
  onModuleClick,
}: ExpandableCategoryCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Compact Category Card - Fixed small height */}
      <Card
        className="cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/50 group"
        onClick={() => setIsOpen(true)}
      >
        <CardContent className="p-1.5 flex items-center gap-1.5">
          <div className={cn("w-6 h-6 shrink-0 rounded flex items-center justify-center", color)}>
            <Icon className="h-3 w-3 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium leading-tight truncate">{title}</p>
            <span className="text-[9px] text-muted-foreground">{modules.length} modules</span>
          </div>
        </CardContent>
      </Card>

      {/* Expanded Dialog with Modules */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className={cn("w-10 h-10 shrink-0 rounded-lg flex items-center justify-center", color)}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-lg">{title}</DialogTitle>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            </div>
          </DialogHeader>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4">
            {modules.map((module) => (
              <Card
                key={module.id}
                className="cursor-pointer hover:shadow-md hover:border-primary/50 transition-all group"
                onClick={() => {
                  onModuleClick(module.path);
                  setIsOpen(false);
                }}
              >
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-8 h-8 shrink-0 rounded-lg flex items-center justify-center", module.color)}>
                      <module.icon className="h-4 w-4 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{module.label}</p>
                      <p className="text-xs text-muted-foreground truncate">{module.description}</p>
                    </div>
                    {module.roles && module.roles.length > 0 && (
                      <Lock className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

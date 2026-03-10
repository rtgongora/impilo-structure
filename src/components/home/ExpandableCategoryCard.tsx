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
      {/* Category Card - Fills available space */}
      <Card
        className="cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/50 group h-full"
        onClick={() => setIsOpen(true)}
      >
        <CardContent className="p-4 flex items-center gap-4 h-full">
          <div
            className={cn(
              "w-12 h-12 shrink-0 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform",
              color
            )}
          >
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-lg font-semibold leading-tight truncate">{title}</p>
            <span className="text-base text-muted-foreground">{modules.length} modules</span>
          </div>
        </CardContent>
      </Card>

      {/* Expanded Dialog with Modules */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-[90vw] w-full max-h-[90vh] overflow-y-auto">
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

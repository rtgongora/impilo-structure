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
        className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-primary/40 group h-full rounded-2xl"
        onClick={() => setIsOpen(true)}
      >
        <CardContent className="p-5 flex items-center gap-4 h-full">
          <div
            className={cn(
              "w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm",
              color
            )}
          >
            <Icon className="h-7 w-7 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-lg font-semibold leading-tight truncate">{title}</p>
            <span className="text-base text-muted-foreground">{modules.length} modules</span>
          </div>
        </CardContent>
      </Card>

      {/* Expanded Dialog with Modules */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-[90vw] w-full max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className={cn("w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center", color)}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-lg">{title}</DialogTitle>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            </div>
          </DialogHeader>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-4">
            {modules.map((module) => (
              <Card
                key={module.id}
                className="cursor-pointer hover:shadow-lg hover:border-primary/40 transition-all group rounded-2xl"
                onClick={() => {
                  onModuleClick(module.path);
                  setIsOpen(false);
                }}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div className={cn("w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center shadow-sm", module.color)}>
                      <module.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="min-w-0 w-full">
                      <p className="text-base font-semibold truncate">{module.label}</p>
                      <p className="text-sm text-muted-foreground line-clamp-2">{module.description}</p>
                    </div>
                    {module.roles && module.roles.length > 0 && (
                      <Lock className="h-4 w-4 text-muted-foreground/50 shrink-0" />
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

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, Lock } from "lucide-react";
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
  defaultExpanded = false,
}: ExpandableCategoryCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="space-y-2">
      {/* Category Header - Clickable */}
      <Card
        className={cn(
          "cursor-pointer transition-all duration-200 hover:shadow-md",
          isExpanded 
            ? "border-primary/50 bg-primary/5" 
            : "hover:border-primary/30"
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn("w-10 h-10 shrink-0 rounded-lg flex items-center justify-center", color)}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-base font-semibold">{title}</p>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                    {modules.length}
                  </Badge>
                  {roles && roles.length > 0 && (
                    <Lock className="h-3 w-3 text-muted-foreground/50" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            </div>
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
              isExpanded ? "bg-primary/10" : "bg-muted"
            )}>
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-primary" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expanded Modules Grid */}
      {isExpanded && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 animate-fade-in pl-2">
          {modules.map((module) => (
            <Card
              key={module.id}
              className="cursor-pointer hover:shadow-md hover:border-primary/50 transition-all group"
              onClick={(e) => {
                e.stopPropagation();
                onModuleClick(module.path);
              }}
            >
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <div className={cn("w-9 h-9 shrink-0 rounded-lg flex items-center justify-center", module.color)}>
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
      )}
    </div>
  );
}

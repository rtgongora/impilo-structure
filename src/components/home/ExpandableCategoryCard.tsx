import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Lock, Search, ArrowLeft, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  const [dialogSearch, setDialogSearch] = useState("");

  const filteredModules = useMemo(() => {
    if (!dialogSearch.trim()) return modules;
    const q = dialogSearch.toLowerCase();
    return modules.filter(
      m => m.label.toLowerCase().includes(q) || m.description.toLowerCase().includes(q)
    );
  }, [dialogSearch, modules]);

  return (
    <>
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

      <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) setDialogSearch(""); }}>
        <DialogContent className="max-w-4xl w-[95vw] h-[80vh] flex flex-col rounded-2xl p-0 gap-0">
          {/* Fixed header */}
          <div className="shrink-0 px-6 pt-5 pb-4 border-b">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl shrink-0"
                onClick={() => setIsOpen(false)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className={cn("w-10 h-10 shrink-0 rounded-xl flex items-center justify-center", color)}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <DialogHeader className="p-0 space-y-0">
                  <DialogTitle className="text-lg">{title}</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl gap-1.5 shrink-0"
                onClick={() => { setIsOpen(false); onModuleClick("/"); }}
              >
                <Home className="h-4 w-4" />
                Home
              </Button>
            </div>

            {/* Search */}
            {modules.length > 6 && (
              <div className="relative mt-4">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={`Search ${modules.length} modules...`}
                  value={dialogSearch}
                  onChange={(e) => setDialogSearch(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 rounded-xl border bg-muted/30 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
                />
              </div>
            )}
          </div>

          {/* Scrollable content area */}
          <ScrollArea className="flex-1 min-h-0">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-6">
              {filteredModules.map((module) => (
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
                      <div className={cn("w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center shadow-sm", module.color)}>
                        <module.icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="min-w-0 w-full">
                        <p className="text-sm font-semibold truncate">{module.label}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{module.description}</p>
                      </div>
                      {module.roles && module.roles.length > 0 && (
                        <Lock className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredModules.length === 0 && (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  <Search className="h-6 w-6 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No modules match "{dialogSearch}"</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}

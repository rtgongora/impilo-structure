import { motion } from "framer-motion";
import { useState } from "react";
import { useEHR } from "@/contexts/EHRContext";
import { ENCOUNTER_MENU_ITEMS, EncounterMenuItem } from "@/types/ehr";
import {
  LayoutDashboard,
  ClipboardCheck,
  Stethoscope,
  FileText,
  Heart,
  Users,
  FileEdit,
  CheckCircle,
  ChevronRight,
  ChevronDown,
  ShoppingCart,
  ClipboardList,
  FlaskConical,
} from "lucide-react";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  ClipboardCheck,
  Stethoscope,
  FileText,
  Heart,
  Users,
  FileEdit,
  CheckCircle,
  ShoppingCart,
  ClipboardList,
  FlaskConical,
};

export function EncounterMenu() {
  const { activeMenuItem, setActiveMenuItem, activeOrdersSubItem, setActiveOrdersSubItem, isCriticalEventActive, activeWorkspace } = useEHR();
  const [expandedItems, setExpandedItems] = useState<string[]>(["orders"]);

  // De-emphasize menu during critical events or active workspaces
  const isDeemphasized = isCriticalEventActive || activeWorkspace !== null;

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleItemClick = (item: typeof ENCOUNTER_MENU_ITEMS[0]) => {
    if (item.subItems && item.subItems.length > 0) {
      toggleExpanded(item.id);
      setActiveMenuItem(item.id);
    } else {
      setActiveMenuItem(item.id);
    }
  };

  const handleSubItemClick = (parentId: EncounterMenuItem, subItemId: string) => {
    setActiveMenuItem(parentId);
    setActiveOrdersSubItem(subItemId);
  };

  return (
    <aside
      className={cn(
        "w-64 bg-encounter-bg border-l border-border flex flex-col transition-opacity duration-200",
        isDeemphasized && "opacity-50 pointer-events-none"
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
          Encounter Record
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">Clinical Documentation</p>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-2 overflow-y-auto">
        <ul className="space-y-1">
          {ENCOUNTER_MENU_ITEMS.map((item, index) => {
            const Icon = iconMap[item.icon];
            const isActive = activeMenuItem === item.id;
            const isExpanded = expandedItems.includes(item.id);
            const hasSubItems = item.subItems && item.subItems.length > 0;

            return (
              <motion.li
                key={item.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <button
                  onClick={() => handleItemClick(item)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-150",
                    "hover:bg-encounter-item-hover group",
                    isActive
                      ? "bg-encounter-item-active-bg text-encounter-item-active font-medium"
                      : "text-secondary-foreground"
                  )}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-md flex items-center justify-center transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-encounter-item text-muted-foreground group-hover:bg-primary-muted group-hover:text-primary"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">{item.label}</div>
                    <div
                      className={cn(
                        "text-xs truncate",
                        isActive ? "text-encounter-item-active/70" : "text-muted-foreground"
                      )}
                    >
                      {item.description}
                    </div>
                  </div>
                  {hasSubItems ? (
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className={cn(
                        "w-4 h-4",
                        isActive ? "text-encounter-item-active" : "text-muted-foreground"
                      )} />
                    </motion.div>
                  ) : isActive && (
                    <ChevronRight className="w-4 h-4 text-encounter-item-active" />
                  )}
                </button>

                {/* Sub-items */}
                {hasSubItems && (
                  <motion.ul
                    initial={false}
                    animate={{ 
                      height: isExpanded ? "auto" : 0,
                      opacity: isExpanded ? 1 : 0 
                    }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden ml-4 mt-1 space-y-0.5"
                  >
                    {item.subItems!.map((subItem) => {
                      const SubIcon = iconMap[subItem.icon];
                      const isSubActive = activeMenuItem === item.id && activeOrdersSubItem === subItem.id;

                      return (
                        <li key={subItem.id}>
                          <button
                            onClick={() => handleSubItemClick(item.id, subItem.id)}
                            className={cn(
                              "w-full flex items-center gap-2 px-3 py-2 rounded-md text-left text-sm transition-all duration-150",
                              "hover:bg-encounter-item-hover",
                              isSubActive
                                ? "bg-primary/10 text-primary font-medium"
                                : "text-muted-foreground"
                            )}
                          >
                            <SubIcon className="w-4 h-4" />
                            <span>{subItem.label}</span>
                          </button>
                        </li>
                      );
                    })}
                  </motion.ul>
                )}
              </motion.li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border bg-muted/30">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Last saved: 2 min ago</span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-status-active" />
            Active
          </span>
        </div>
      </div>
    </aside>
  );
}

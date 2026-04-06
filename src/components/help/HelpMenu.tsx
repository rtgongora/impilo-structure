import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  HelpCircle,
  BookOpen,
  MessageCircle,
  FileText,
  Video,
  Keyboard,
  ExternalLink,
  Lightbulb,
  Search,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface HelpMenuProps {
  variant?: "icon" | "button" | "floating";
  className?: string;
}

const quickLinks = [
  { icon: BookOpen, label: "User Guides", description: "Step-by-step tutorials", path: "/help", tab: "guides" },
  { icon: FileText, label: "FAQs", description: "Frequently asked questions", path: "/help", tab: "faqs" },
  { icon: Video, label: "Video Tutorials", description: "Watch and learn", path: "/help", tab: "guides" },
  { icon: FileText, label: "Documentation", description: "Full system docs", path: "/help", tab: "docs" },
];

const contextualTips = [
  { icon: Lightbulb, label: "Keyboard Shortcuts", tip: "Press Ctrl+K to search patients quickly" },
  { icon: Lightbulb, label: "Quick Tip", tip: "Double-click a patient row to open their chart" },
  { icon: Lightbulb, label: "Did you know?", tip: "You can use voice commands for hands-free documentation" },
];

export function HelpMenu({ variant = "icon", className }: HelpMenuProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredLinks = quickLinks.filter(
    (link) =>
      link.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      link.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleNavigate = (path: string, tab?: string) => {
    setOpen(false);
    navigate(tab ? `${path}?tab=${tab}` : path);
  };

  const triggerButton = (() => {
    switch (variant) {
      case "floating":
        return (
          <Button
            className="h-10 rounded-full shadow-md bg-primary/10 text-primary hover:bg-primary/20 border border-primary/15 px-4 gap-2 text-xs font-medium backdrop-blur-sm"
          >
            <HelpCircle className="h-3.5 w-3.5" />
            <span>Need Help?</span>
          </Button>
        );
      case "button":
        return (
          <Button size="sm" className={`gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white ${className}`}>
            <HelpCircle className="h-4 w-4" />
            <span className="text-sm">Help</span>
          </Button>
        );
      case "icon":
      default:
        return (
          <Button variant="ghost" size="icon" className={`h-9 w-9 ${className}`}>
            <HelpCircle className="h-4 w-4" />
          </Button>
        );
    }
  })();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0" sideOffset={8}>
        {/* Header */}
        <div className="p-3 pb-2">
          <h3 className="font-semibold text-sm">Help & Resources</h3>
          <p className="text-xs text-muted-foreground">Find answers and learn Impilo</p>
        </div>

        {/* Search */}
        <div className="px-3 pb-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 text-sm"
            />
          </div>
        </div>

        <Separator />

        <ScrollArea className="max-h-[320px]">
          {/* Quick Links */}
          <div className="p-2">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-2 mb-1">
              Resources
            </p>
            {filteredLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => handleNavigate(link.path, link.tab)}
                className="w-full flex items-center gap-3 px-2 py-2 rounded-md hover:bg-muted/80 transition-colors text-left"
              >
                <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                  <link.icon className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-tight">{link.label}</p>
                  <p className="text-xs text-muted-foreground">{link.description}</p>
                </div>
                <ExternalLink className="h-3 w-3 text-muted-foreground ml-auto shrink-0" />
              </button>
            ))}
          </div>

          <Separator />

          {/* Contextual Tips */}
          <div className="p-2">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-2 mb-1">
              Quick Tips
            </p>
            {contextualTips.map((tip, i) => (
              <div key={i} className="flex items-start gap-2 px-2 py-1.5 rounded-md">
                <Lightbulb className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium">{tip.label}</p>
                  <p className="text-xs text-muted-foreground">{tip.tip}</p>
                </div>
              </div>
            ))}
          </div>

          <Separator />

          {/* Support Contact */}
          <div className="p-2">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-2 mb-1">
              Support
            </p>
            <button
              onClick={() => handleNavigate("/help")}
              className="w-full flex items-center gap-3 px-2 py-2 rounded-md hover:bg-muted/80 transition-colors text-left"
            >
              <div className="h-8 w-8 rounded-md bg-green-500/10 flex items-center justify-center shrink-0">
                <MessageCircle className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Contact Support</p>
                <p className="text-xs text-muted-foreground">Get help from the team</p>
              </div>
            </button>
            <button
              onClick={() => handleNavigate("/help")}
              className="w-full flex items-center gap-3 px-2 py-2 rounded-md hover:bg-muted/80 transition-colors text-left"
            >
              <div className="h-8 w-8 rounded-md bg-blue-500/10 flex items-center justify-center shrink-0">
                <Keyboard className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Keyboard Shortcuts</p>
                <p className="text-xs text-muted-foreground">View all shortcuts</p>
              </div>
            </button>
          </div>
        </ScrollArea>

        {/* Footer */}
        <Separator />
        <div className="p-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs"
            onClick={() => handleNavigate("/help")}
          >
            Open Full Help Center
            <ExternalLink className="h-3 w-3 ml-1.5" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

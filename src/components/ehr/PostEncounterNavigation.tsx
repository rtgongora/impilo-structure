import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Home, 
  Users, 
  LayoutDashboard, 
  ArrowRight, 
  CheckCircle,
  Calendar,
  ClipboardList
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

interface PostEncounterNavigationProps {
  isVisible: boolean;
  patientName?: string;
  onClose?: () => void;
}

export function PostEncounterNavigation({ 
  isVisible, 
  patientName = "Patient",
  onClose 
}: PostEncounterNavigationProps) {
  const navigate = useNavigate();

  if (!isVisible) return null;

  const navigationOptions = [
    {
      id: "next-patient",
      label: "Next Patient",
      description: "Continue to the next patient in queue",
      icon: ArrowRight,
      path: "/queue",
      variant: "default" as const,
      primary: true,
    },
    {
      id: "queue",
      label: "Queue Management",
      description: "View and manage patient queue",
      icon: Users,
      path: "/queue",
      variant: "outline" as const,
    },
    {
      id: "dashboard",
      label: "Workspace Dashboard",
      description: "Return to your workspace",
      icon: LayoutDashboard,
      path: "/dashboard",
      variant: "outline" as const,
    },
    {
      id: "appointments",
      label: "Appointments",
      description: "View scheduled appointments",
      icon: Calendar,
      path: "/appointments",
      variant: "outline" as const,
    },
    {
      id: "home",
      label: "Home",
      description: "Go to main home page",
      icon: Home,
      path: "/",
      variant: "outline" as const,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6"
    >
      <Card className="border-success/50 bg-success/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-success">
            <CheckCircle className="w-5 h-5" />
            Encounter Complete
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {patientName}'s encounter has been saved. Where would you like to go next?
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {navigationOptions.map((option) => {
              const Icon = option.icon;
              return (
                <Button
                  key={option.id}
                  variant={option.variant}
                  className={`h-auto flex-col gap-2 py-4 ${
                    option.primary 
                      ? "bg-primary hover:bg-primary/90 text-primary-foreground" 
                      : ""
                  }`}
                  onClick={() => navigate(option.path)}
                >
                  <Icon className="w-5 h-5" />
                  <div className="text-center">
                    <div className="font-medium text-sm">{option.label}</div>
                    <div className="text-xs opacity-70 hidden md:block">
                      {option.description}
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>

          {onClose && (
            <div className="mt-4 flex justify-center">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClose}
                className="text-muted-foreground"
              >
                <ClipboardList className="w-4 h-4 mr-2" />
                Continue Editing This Encounter
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

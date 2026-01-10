/**
 * No Patient Selected State
 * 
 * Displayed when accessing /encounter without a valid patient context.
 * Guides users to proper patient selection workflows.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Users,
  Calendar,
  Search,
  ClipboardList,
  ShieldCheck,
  ArrowRight,
  Home,
  Clock,
  UserCheck,
  AlertTriangle,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useShift } from "@/contexts/ShiftContext";
import impiloLogo from "@/assets/impilo-logo.png";

interface QuickAccessOption {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  route: string;
  badge?: string;
  variant?: "default" | "primary";
}

export function NoPatientSelected() {
  const navigate = useNavigate();
  const { isOnShift, activeShift } = useShift();

  const quickAccessOptions: QuickAccessOption[] = [
    {
      id: "queue",
      title: "My Queue",
      description: "View and call patients from your assigned queue",
      icon: Users,
      route: "/queue",
      variant: "primary",
    },
    {
      id: "appointments",
      title: "Today's Appointments",
      description: "See scheduled patients for today",
      icon: Calendar,
      route: "/appointments",
    },
    {
      id: "worklist",
      title: "Provider Worklist",
      description: "View your assigned patients and tasks",
      icon: ClipboardList,
      route: "/",
    },
    {
      id: "search",
      title: "Patient Search",
      description: "Search for a specific patient (requires justification)",
      icon: Search,
      route: "/patients",
      badge: "Audited",
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Simple Header */}
      <header className="h-14 bg-topbar-bg text-topbar-foreground flex items-center justify-between px-4 border-b">
        <div className="flex items-center gap-3">
          <img src={impiloLogo} alt="Impilo" className="h-7 w-auto" />
          <Badge variant="outline" className="text-topbar-muted border-topbar-muted/30">
            Clinical Workspace
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-topbar-muted hover:text-topbar-foreground"
          asChild
        >
          <Link to="/">
            <Home className="h-4 w-4 mr-2" />
            Dashboard
          </Link>
        </Button>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full space-y-6">
          {/* Main Message */}
          <div className="text-center space-y-3">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <UserCheck className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">No Patient Selected</h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Select a patient from your queue or worklist to open their chart.
              Direct chart access requires identity verification and access justification.
            </p>
          </div>

          {/* Shift Status */}
          {!isOnShift && (
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertTitle>Not on Shift</AlertTitle>
              <AlertDescription>
                You must start your shift before accessing patient charts.{" "}
                <Link to="/operations" className="underline font-medium">
                  Go to Operations
                </Link>
              </AlertDescription>
            </Alert>
          )}

          {isOnShift && activeShift && (
            <Alert className="bg-success/10 border-success/30">
              <ShieldCheck className="h-4 w-4 text-success" />
              <AlertTitle className="text-success">On Shift</AlertTitle>
              <AlertDescription>
                {activeShift.facility_name} • {activeShift.current_workspace_name}
              </AlertDescription>
            </Alert>
          )}

          {/* Quick Access Options */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Select a Patient</CardTitle>
              <CardDescription>
                Choose how you want to access patient records
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {quickAccessOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <div
                    key={option.id}
                    className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all hover:border-primary hover:bg-primary/5 ${
                      option.variant === "primary" ? "border-primary bg-primary/5" : ""
                    }`}
                    onClick={() => navigate(option.route)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                        option.variant === "primary" ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{option.title}</h3>
                          {option.badge && (
                            <Badge variant="outline" className="text-xs">
                              {option.badge}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{option.description}</p>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Compliance Notice */}
          <div className="text-center text-xs text-muted-foreground space-y-1">
            <p className="flex items-center justify-center gap-1">
              <ShieldCheck className="h-3 w-3" />
              All chart access is logged per HIPAA and institutional policy
            </p>
            <p>
              Unauthorized access may result in disciplinary action
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

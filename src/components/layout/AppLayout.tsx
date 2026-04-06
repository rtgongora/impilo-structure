import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { HelpMenu } from "@/components/help/HelpMenu";

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
}

export function AppLayout({ children, title }: AppLayoutProps) {
  return (
    <div className="h-screen flex overflow-hidden bg-background">
      {/* Sidebar */}
      <AppSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <AppHeader title={title} />
        <main className="flex-1 flex flex-col overflow-auto overscroll-contain">
          {children}
        </main>
      </div>

      {/* Floating Help Button */}
      <div className="fixed bottom-16 right-5 z-50">
        <HelpMenu variant="floating" />
      </div>
    </div>
  );
}

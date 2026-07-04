import { useState, type ReactNode } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { CrmThemeProvider } from "./theme";

interface LayoutProps {
  children: ReactNode;
  title?: string;
  /** Optional constrained content width for readability on ultrawide displays. */
  contained?: boolean;
}

export default function Layout({ children, title, contained = true }: LayoutProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <CrmThemeProvider>
      <TooltipProvider delayDuration={150}>
        <div className="flex h-screen overflow-hidden bg-background text-foreground">
          <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
          <div className="flex min-w-0 flex-1 flex-col">
            <Header title={title} />
            <main className="flex-1 overflow-y-auto">
              <div className={contained ? "mx-auto w-full max-w-[1600px] px-6 py-6" : "px-6 py-6"}>{children}</div>
            </main>
          </div>
        </div>
      </TooltipProvider>
    </CrmThemeProvider>
  );
}

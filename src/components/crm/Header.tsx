import { Search, Bell, Plus, ChevronDown, LifeBuoy, Command } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "./theme";

export default function Header({ title }: { title?: string }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/70 px-6 backdrop-blur-md">
      {title && <h1 className="hidden shrink-0 font-display text-lg font-semibold tracking-tight md:block">{title}</h1>}

      {/* Org switcher */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="hidden gap-2 lg:flex">
            <span className="flex size-4 items-center justify-center rounded bg-gradient-to-br from-royal to-navy text-[9px] font-bold text-white">
              RC
            </span>
            Rupee Catalyst
            <ChevronDown className="size-3.5 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Organization</DropdownMenuLabel>
          <DropdownMenuItem>Rupee Catalyst — Mumbai HQ</DropdownMenuItem>
          <DropdownMenuItem>Rupee Catalyst — Pune</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Manage organizations</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Global search */}
      <button className="group ml-auto flex h-9 w-full max-w-md items-center gap-2.5 rounded-lg border bg-muted/40 px-3 text-sm text-muted-foreground outline-none transition-colors hover:bg-muted/70 focus-visible:ring-2 focus-visible:ring-ring/60">
        <Search className="size-4" />
        <span className="flex-1 text-left">Search opportunities, clients, institutions…</span>
        <kbd className="hidden items-center gap-0.5 rounded border bg-background px-1.5 py-0.5 text-[10px] font-medium sm:flex">
          <Command className="size-2.5" />K
        </kbd>
      </button>

      <div className="flex shrink-0 items-center gap-1">
        <Button size="sm" className="hidden gap-1.5 md:flex">
          <Plus className="size-4" /> New Opportunity
        </Button>
        <Separator orientation="vertical" className="mx-1 hidden h-6 md:block" />
        <Button variant="ghost" size="icon" className="size-8 text-muted-foreground" aria-label="Help">
          <LifeBuoy className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" className="relative size-8 text-muted-foreground" aria-label="Notifications">
          <Bell className="size-4" />
          <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-cta ring-2 ring-background" />
        </Button>
        <ThemeToggle />
      </div>
    </header>
  );
}

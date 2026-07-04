import {
  Pencil,
  Plus,
  Mail,
  Activity,
  ArrowRightCircle,
  FileOutput,
  Share2,
  MoreHorizontal,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/crm/theme";

export function ActionBar() {
  return (
    <div className="sticky top-0 z-20 flex h-12 items-center gap-2 border-b bg-card/70 px-4 backdrop-blur-md sm:px-6">
      <Button size="sm" className="gap-1.5">
        <ArrowRightCircle className="size-4" /> Advance Stage
      </Button>
      <Button size="sm" variant="outline" className="gap-1.5">
        <Pencil className="size-4" /> Edit
      </Button>

      <Separator orientation="vertical" className="mx-1 hidden h-6 md:block" />

      <div className="hidden items-center gap-2 md:flex">
        <Button size="sm" variant="ghost" className="gap-1.5">
          <Plus className="size-4" /> Add Product
        </Button>
        <Button size="sm" variant="ghost" className="gap-1.5">
          <Mail className="size-4" /> Compose
        </Button>
        <Button size="sm" variant="ghost" className="gap-1.5">
          <Activity className="size-4" /> Log Activity
        </Button>
        <Button size="sm" variant="ghost" className="gap-1.5">
          <FileOutput className="size-4" /> Information Sheet
        </Button>
      </div>

      <div className="ml-auto flex items-center gap-1">
        <Button size="icon" variant="ghost" className="size-8" aria-label="Watch">
          <Star className="size-4" />
        </Button>
        <Button size="icon" variant="ghost" className="size-8" aria-label="Share">
          <Share2 className="size-4" />
        </Button>
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="ghost" className="size-8" aria-label="More actions">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Add Participant</DropdownMenuItem>
            <DropdownMenuItem>Run Smart Match</DropdownMenuItem>
            <DropdownMenuItem>Reassign Coverage Team</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Put On Hold</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">Mark as Lost</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

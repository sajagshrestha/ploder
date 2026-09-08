import { useClerk, useUser } from "@clerk/tanstack-react-start";
import { LogOut, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

function initials(name: string): string {
  const letters = name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("");
  return letters.toUpperCase() || "?";
}

/** Our own account button: shadcn Avatar + menu, backed by Clerk session data. */
export function AccountMenu({
  className,
  withName = false,
}: {
  className?: string;
  withName?: boolean;
}) {
  const { user } = useUser();
  const { signOut, openUserProfile } = useClerk();
  const name = user?.fullName ?? user?.firstName ?? "Account";
  const email = user?.primaryEmailAddress?.emailAddress;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Account menu"
          className={
            withName
              ? cn(
                  "flex cursor-pointer items-center justify-start gap-[11px] rounded-lg border-0 bg-transparent p-0 text-left [font:inherit] text-inherit outline-none focus-visible:shadow-[0_0_0_2px_var(--ring)]",
                  className,
                )
              : cn(
                  "rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  className,
                )
          }
        >
          <Avatar>
            <AvatarImage src={user?.imageUrl} alt="" />
            <AvatarFallback>{initials(name)}</AvatarFallback>
          </Avatar>
          {withName && <strong>{name}</strong>}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <span className="block truncate font-semibold">{name}</span>
          {email && (
            <span className="block truncate text-xs font-normal text-muted-foreground">
              {email}
            </span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => openUserProfile()}>
          <User size={15} />
          Manage account
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => signOut({ redirectUrl: "/" })}>
          <LogOut size={15} />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

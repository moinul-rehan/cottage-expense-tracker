"use client";

import Link from "next/link";
import { ChevronDown, User, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logout } from "@/lib/auth-actions";

export function ProfileMenu({
  name,
  avatarUrl,
  initial,
}: {
  name: string;
  avatarUrl: string | null;
  initial: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-full border border-border bg-card py-1 pr-3 pl-1"
          />
        }
      >
        <Avatar size="sm">
          <AvatarImage src={avatarUrl ?? undefined} alt={name} />
          <AvatarFallback>{initial}</AvatarFallback>
        </Avatar>
        <span className="hidden text-sm font-medium text-foreground sm:inline">{name}</span>
        <ChevronDown className="size-4 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem render={<Link href="/settings/profile" />}>
          <User />
          Profile
        </DropdownMenuItem>
        <form action={logout} className="contents">
          <DropdownMenuItem render={<button type="submit" className="w-full" />}>
            <LogOut />
            Log out
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

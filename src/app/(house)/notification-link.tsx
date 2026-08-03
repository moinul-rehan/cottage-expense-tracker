import Link from "next/link";
import { cn } from "@/lib/utils";

/** True for anything that isn't an in-app path -- i.e. a custom URL (a
 * Facebook group invite, etc.) that should redirect straight there instead
 * of being resolved against this app's own origin. */
export function isExternalLink(link: string) {
  return !link.startsWith("/");
}

/** Renders a notification's `link` as either an in-app `next/link` (same
 * tab, client-routed) or a plain external anchor (new tab) -- used by both
 * NotificationTray and the full notifications list so a platform-admin
 * broadcast with a custom URL (e.g. "facebook.com/groups/...") opens that
 * URL directly rather than under cottagee.me. */
export function NotificationLinkButton({ link, className }: { link: string; className?: string }) {
  if (isExternalLink(link)) {
    return (
      <a href={link} target="_blank" rel="noopener noreferrer" className={cn("shrink-0", className)}>
        View →
      </a>
    );
  }
  return (
    <Link href={link} className={cn("shrink-0", className)}>
      View →
    </Link>
  );
}

import Link from "next/link";
import { Logo } from "@/components/logo";

const LINKS = [
  { href: "/platform-admin", label: "Dashboard" },
  { href: "/platform-admin/users", label: "Users" },
  { href: "/platform-admin/feedback", label: "Feedback" },
];

export function PlatformAdminNav() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-2 text-xl font-bold tracking-tight text-foreground">
        <Logo size={28} />
        Platform Admin
      </div>
      <nav className="flex items-center gap-4">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-sm font-medium text-muted-foreground hover:text-foreground hover:underline"
          >
            {link.label}
          </Link>
        ))}
        <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground hover:underline">
          Back to app
        </Link>
      </nav>
    </div>
  );
}

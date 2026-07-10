import Link from "next/link";
import { getCurrentProfile, getDisplayName } from "@/lib/data/dal";
import { logout } from "@/lib/auth-actions";
import { Button } from "@/components/ui/button";

const memberLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/expenses", label: "Expenses" },
  { href: "/history", label: "History" },
  { href: "/settle-up", label: "Settle Up" },
  { href: "/profile", label: "Profile" },
];

const adminLinks = [
  { href: "/admin/members", label: "Members" },
  { href: "/admin/rent", label: "Rent" },
];

export default async function HouseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();

  return (
    <div className="flex flex-1 flex-col bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-4 px-4 py-3">
          <nav className="flex flex-wrap items-center gap-1 text-sm">
            {memberLinks.map((link) => (
              <Button
                key={link.href}
                variant="ghost"
                size="sm"
                nativeButton={false}
                render={<Link href={link.href} />}
              >
                {link.label}
              </Button>
            ))}
            {profile.role === "super_admin" && (
              <>
                <span className="mx-1 h-4 w-px bg-border" />
                {adminLinks.map((link) => (
                  <Button
                    key={link.href}
                    variant="ghost"
                    size="sm"
                    nativeButton={false}
                    render={<Link href={link.href} />}
                  >
                    {link.label}
                  </Button>
                ))}
              </>
            )}
          </nav>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>{getDisplayName(profile)}</span>
            <form action={logout}>
              <Button type="submit" variant="outline" size="sm">
                Log out
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}

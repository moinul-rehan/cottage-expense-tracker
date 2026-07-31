import Link from "next/link";
import { Inter } from "next/font/google";
import { Search } from "lucide-react";
import { requirePlatformAdmin } from "@/lib/platform-admin";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AdminSidebarNav } from "./AdminSidebarNav";
import { AdminInput } from "./AdminUI";

// SnowUI/ByeWind's kit is set in Inter -- scoped to this font-sans override
// only inside the shell (not the app-wide layout, which stays Plus Jakarta
// Sans for the member-facing product) so platform admin reads as its own
// distinct tool.
const inter = Inter({ subsets: ["latin"], variable: "--font-admin" });

export async function AdminShell({
  title,
  breadcrumb,
  children,
}: {
  title: string;
  breadcrumb?: string;
  children: React.ReactNode;
}) {
  const user = await requirePlatformAdmin();

  return (
    <div className={`${inter.variable} flex min-h-svh bg-[#f9f9fa] font-sans text-black dark:bg-[#0a0a0b] dark:text-white`} style={{ fontFamily: "var(--font-admin)" }}>
      <aside className="hidden w-[224px] shrink-0 flex-col gap-1 border-r-[0.5px] border-black/10 p-4 md:flex dark:border-white/10">
        <Link href="/platform-admin" className="mb-3 flex items-center gap-2 rounded-lg p-2 hover:bg-black/4 dark:hover:bg-white/10">
          <div className="flex size-6 items-center justify-center overflow-hidden rounded-full bg-black/4 dark:bg-white/10">
            <Logo size={20} />
          </div>
          <span className="text-sm font-medium">Cottage Admin</span>
        </Link>
        <AdminSidebarNav />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[68px] shrink-0 items-center justify-between gap-4 border-b-[0.5px] border-black/10 px-6 dark:border-white/10">
          <div className="flex min-w-0 items-center gap-1 text-sm">
            <span className="text-black/40 dark:text-white/40">Platform Admin</span>
            <span className="text-black/40 dark:text-white/40">/</span>
            <span className="truncate font-medium">{breadcrumb ?? title}</span>
          </div>
          <div className="hidden max-w-xs flex-1 items-center gap-2 sm:flex">
            <div className="relative w-full">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-black/40 dark:text-white/40" />
              <AdminInput placeholder="Search" className="pl-9" disabled />
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <ThemeToggle />
            <div className="flex items-center gap-2 rounded-full border-[0.5px] border-black/10 py-1 pr-3 pl-1 dark:border-white/10">
              <div className="flex size-7 items-center justify-center rounded-full bg-black text-xs font-semibold text-white dark:bg-white dark:text-black">
                {(user.email ?? "?")[0]?.toUpperCase()}
              </div>
              <span className="hidden max-w-32 truncate text-xs font-medium sm:inline">{user.email}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 px-6 py-8">
          <h1 className="sr-only">{title}</h1>
          {children}
        </main>
      </div>
    </div>
  );
}

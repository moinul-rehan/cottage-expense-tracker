"use client";

import { createContext, useContext, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

type Ctx = {
  isPending: boolean;
  pendingValue: string | null;
  navigate: (href: string, value: string) => void;
};

const TabTransitionContext = createContext<Ctx | null>(null);

/** Wraps a tabbed page so switching tabs shows a loading skeleton instead
 * of silently doing nothing until the new server data arrives - fixes the
 * "did my tap even register?" confusion that led to users double-tapping. */
export function TabTransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingValue, setPendingValue] = useState<string | null>(null);

  function navigate(href: string, value: string) {
    setPendingValue(value);
    startTransition(() => {
      router.push(href);
    });
  }

  return (
    <TabTransitionContext.Provider value={{ isPending, pendingValue: isPending ? pendingValue : null, navigate }}>
      {children}
    </TabTransitionContext.Provider>
  );
}

function useTabTransition() {
  const ctx = useContext(TabTransitionContext);
  if (!ctx) throw new Error("useTabTransition must be used inside TabTransitionProvider");
  return ctx;
}

/** A tab button that shows immediate pressed/pending feedback (not just a
 * bare <Link> that appears to do nothing until the page finishes loading).
 *
 * `activeClassName`/`inactiveClassName` are plain strings rather than a
 * className(active) => string callback - a function prop passed from a
 * Server Component (every page using this) isn't serializable across the
 * Server/Client boundary and crashes the page (same bug class as the
 * "don't pass Lucide icon components as data" fix on /settings/*). */
export function TabTrigger({
  href,
  value,
  activeValue,
  activeClassName,
  inactiveClassName,
  children,
}: {
  href: string;
  value: string;
  activeValue: string;
  activeClassName: string;
  inactiveClassName: string;
  children: ReactNode;
}) {
  const { pendingValue, navigate, isPending } = useTabTransition();
  const displayActive = pendingValue ?? activeValue;

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => navigate(href, value)}
      className={cn(displayActive === value ? activeClassName : inactiveClassName, isPending && "cursor-wait")}
    >
      {children}
    </button>
  );
}

/** Shows `skeleton` instead of `children` while a tab switch is in flight. */
export function TabContent({ skeleton, children }: { skeleton: ReactNode; children: ReactNode }) {
  const { isPending } = useTabTransition();
  return <>{isPending ? skeleton : children}</>;
}

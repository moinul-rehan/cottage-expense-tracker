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
 * bare <Link> that appears to do nothing until the page finishes loading). */
export function TabTrigger({
  href,
  value,
  activeValue,
  className,
  children,
}: {
  href: string;
  value: string;
  activeValue: string;
  className: (active: boolean, pending: boolean) => string;
  children: ReactNode;
}) {
  const { pendingValue, navigate, isPending } = useTabTransition();
  const displayActive = pendingValue ?? activeValue;
  const isThisPending = pendingValue === value;

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => navigate(href, value)}
      className={cn(className(displayActive === value, isThisPending), isPending && "cursor-wait")}
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

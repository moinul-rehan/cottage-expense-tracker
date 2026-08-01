"use client";

import { useTransition } from "react";
import { Globe } from "lucide-react";
import { setLanguage } from "@/lib/i18n/actions";
import type { Lang } from "@/lib/i18n/dictionary";
import { cn } from "@/lib/utils";

/** Always-visible header toggle - switches between English and Bangla,
 * saved to the account (profiles.language) so it follows the member across
 * devices. Covers sidebar/bottom nav, section headers and top page titles
 * for now (see dictionary.ts); everything else stays English until
 * translated in a later pass. */
export function LanguageToggle({ lang }: { lang: Lang }) {
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next: Lang = lang === "en" ? "bn" : "en";
    startTransition(() => setLanguage(next));
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-label="Switch language"
      className={cn(
        "flex h-[42px] items-center gap-1.5 rounded-full border border-border bg-card px-3 text-sm font-semibold text-foreground",
        pending && "opacity-60"
      )}
    >
      <Globe className="size-4" />
      {lang === "en" ? "EN" : "বাং"}
    </button>
  );
}

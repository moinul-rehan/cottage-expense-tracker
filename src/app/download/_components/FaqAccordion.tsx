"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const FAQS = [
  {
    q: "Is this APK safe?",
    a: "Yes. The APK is built and uploaded directly by the Cottage platform administrator and served from our own storage - it isn't repackaged or modified by any third party.",
  },
  {
    q: "Do I need Google Play?",
    a: "No. Cottage isn't published on Google Play yet, so you install it directly from this page. Your phone may ask you to allow installs from this source the first time.",
  },
  {
    q: "Will my data remain after updating?",
    a: "Yes. Installing a new version over an existing one keeps your login and all your cottage's data - nothing is lost during an update.",
  },
  {
    q: "How do I update the application?",
    a: "Come back to this page, download the latest APK, and install it the same way you did the first time. It will update your existing installation in place.",
  },
  {
    q: "Can I install over an older version?",
    a: "Yes, installing over an older version is the normal update path and is fully supported.",
  },
];

export function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="flex flex-col divide-y divide-border/60 overflow-hidden rounded-xl ring-1 ring-foreground/5">
      {FAQS.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q} className="bg-card">
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-medium text-foreground"
              aria-expanded={isOpen}
            >
              {item.q}
              <ChevronDown
                className={cn("size-4 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-180")}
              />
            </button>
            {isOpen && <p className="px-5 pb-4 text-sm leading-relaxed text-muted-foreground">{item.a}</p>}
          </div>
        );
      })}
    </div>
  );
}

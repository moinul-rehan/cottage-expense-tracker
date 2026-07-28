import { Wallet, UtensilsCrossed, Megaphone, TriangleAlert, StickyNote, Wrench, type LucideIcon } from "lucide-react";

export type NoticeType = "utility" | "meal" | "general" | "emergency" | "personal" | "maintenance";
export type NoticePriority = "critical" | "high" | "normal" | "low";
export type NoticeVisibility = "everyone" | "specific" | "selected" | "admins";
export type PinDuration = "none" | "until_manual" | "1d" | "3d" | "until_date" | "until_expires";
export type NoticeStatus = "scheduled" | "published" | "expired" | "archived";

export const NOTICE_TYPE_META: Record<
  NoticeType,
  { label: string; icon: LucideIcon; chip: string; paper: string; visibilities: NoticeVisibility[]; memberCreatable: boolean }
> = {
  utility: {
    label: "Utility Reminder",
    icon: Wallet,
    chip: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
    paper: "bg-[var(--paper-utility)]",
    visibilities: ["specific", "selected"],
    memberCreatable: false,
  },
  meal: {
    label: "Meal Plan",
    icon: UtensilsCrossed,
    chip: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
    paper: "bg-[var(--paper-meal)]",
    visibilities: ["everyone", "selected"],
    memberCreatable: true,
  },
  general: {
    label: "General Notice",
    icon: Megaphone,
    chip: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
    paper: "bg-[var(--paper-general)]",
    visibilities: ["everyone", "selected"],
    memberCreatable: true,
  },
  emergency: {
    label: "Emergency",
    icon: TriangleAlert,
    chip: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
    paper: "bg-[var(--paper-emergency)]",
    visibilities: ["everyone", "admins"],
    memberCreatable: true,
  },
  personal: {
    label: "Personal Reminder",
    icon: StickyNote,
    chip: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300",
    paper: "bg-[var(--paper-personal)]",
    visibilities: ["specific", "selected"],
    // Super-admin-only: a Personal Reminder is admin-to-member ("pay your
    // share today"), never member-to-member.
    memberCreatable: false,
  },
  maintenance: {
    label: "Maintenance",
    icon: Wrench,
    chip: "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300",
    paper: "bg-[var(--paper-maintenance)]",
    visibilities: ["everyone", "selected"],
    memberCreatable: true,
  },
};

export const PRIORITY_META: Record<NoticePriority, { label: string; order: number; pill: string; pin: string }> = {
  critical: { label: "Critical", order: 0, pill: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300", pin: "bg-red-600" },
  high: { label: "High", order: 1, pill: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300", pin: "bg-amber-500" },
  normal: { label: "Normal", order: 2, pill: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300", pin: "bg-sky-500" },
  low: { label: "Low", order: 3, pill: "bg-muted text-muted-foreground", pin: "bg-slate-400" },
};

/** Deterministic -3..3deg tilt per notice id — stable across re-renders, no layout jitter. */
export function noticeTilt(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return (Math.abs(h) % 7) - 3;
}

export const VISIBILITY_LABEL: Record<NoticeVisibility, string> = {
  everyone: "Everyone",
  specific: "Specific member",
  selected: "Selected members",
  admins: "Admins only",
};

export const PIN_DURATION_LABEL: Record<PinDuration, string> = {
  none: "Do not pin",
  until_manual: "Pin until manually removed",
  "1d": "Pin for 1 day",
  "3d": "Pin for 3 days",
  until_date: "Pin until specific date",
  until_expires: "Pin until notice expires",
};

/** Can this profile create the given notice type? Mirrors the notices_insert RLS check. */
export function canCreateNoticeType(
  profile: { role: "super_admin" | "member" },
  type: NoticeType
) {
  if (profile.role === "super_admin") return true;
  return NOTICE_TYPE_META[type].memberCreatable;
}

export function canCreateAnyNotice(_profile: { role: "super_admin" | "member" }) {
  return true;
}

/** Can this profile manage (pin/unpin/archive) this particular notice? */
export function canManageNotice(
  profile: { id: string; role: "super_admin" | "member" },
  notice: { created_by: string }
) {
  return profile.role === "super_admin" || notice.created_by === profile.id;
}

export function computePinEndAt(notice: {
  is_pinned: boolean;
  pin_duration: PinDuration;
  pin_until_date: string | null;
  publish_at: string;
  expires_at: string;
}): Date | null {
  switch (notice.pin_duration) {
    case "until_manual":
      return null;
    case "1d":
      return new Date(new Date(notice.publish_at).getTime() + 24 * 3600 * 1000);
    case "3d":
      return new Date(new Date(notice.publish_at).getTime() + 3 * 24 * 3600 * 1000);
    case "until_date":
      return notice.pin_until_date ? new Date(notice.pin_until_date + "T23:59:59") : null;
    case "until_expires":
      return new Date(notice.expires_at);
    default:
      return null;
  }
}

export function computeStatus(
  notice: { archived_at: string | null; publish_at: string; expires_at: string },
  now: Date = new Date()
): NoticeStatus {
  if (notice.archived_at) return "archived";
  if (now < new Date(notice.publish_at)) return "scheduled";
  if (now > new Date(notice.expires_at)) return "expired";
  return "published";
}

/** Effectively pinned right now — accounts for pin duration lapsing without a write-back. */
export function isEffectivelyPinned(
  notice: {
    is_pinned: boolean;
    pin_duration: PinDuration;
    pin_until_date: string | null;
    publish_at: string;
    expires_at: string;
    archived_at: string | null;
  },
  now: Date = new Date()
) {
  if (!notice.is_pinned || notice.archived_at) return false;
  const end = computePinEndAt(notice);
  return !end || now <= end;
}

export function isVisibleTo(
  notice: { visibility: NoticeVisibility; created_by: string; target_member_ids: string[] },
  profile: { id: string; role: "super_admin" | "member" }
) {
  if (profile.role === "super_admin") return true;
  if (notice.created_by === profile.id) return true;
  if (notice.visibility === "everyone") return true;
  if (notice.visibility === "admins") return false;
  return notice.target_member_ids.includes(profile.id);
}

export function sortForDisplay<T extends { type: NoticeType; priority: NoticePriority; publish_at: string }>(
  notices: T[]
): T[] {
  return notices.slice().sort((a, b) => {
    if (a.type === "emergency" && b.type !== "emergency") return -1;
    if (b.type === "emergency" && a.type !== "emergency") return 1;
    const p = PRIORITY_META[a.priority].order - PRIORITY_META[b.priority].order;
    if (p !== 0) return p;
    return new Date(b.publish_at).getTime() - new Date(a.publish_at).getTime();
  });
}

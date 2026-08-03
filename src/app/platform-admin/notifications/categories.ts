/** Category picked in the platform-admin "send notification" form. Stored as
 * the notification's `type` column (`platform_<category>`), which is what
 * lets the member-facing UI tell these apart from regular in-app activity
 * notifications and show the category badge/icon -- see
 * src/app/(house)/notification-icons.tsx's PLATFORM_CATEGORY_LABELS. */
export const PLATFORM_NOTIFICATION_CATEGORIES = [
  { value: "feature", label: "Feature" },
  { value: "update", label: "Update" },
  { value: "announcement", label: "Announcement" },
  { value: "maintenance", label: "Maintenance" },
  { value: "alert", label: "Alert" },
] as const;

export type PlatformNotificationCategory = (typeof PLATFORM_NOTIFICATION_CATEGORIES)[number]["value"];

export const PLATFORM_NOTIFICATION_TYPE_PREFIX = "platform_";

export function isValidPlatformCategory(value: string): value is PlatformNotificationCategory {
  return PLATFORM_NOTIFICATION_CATEGORIES.some((c) => c.value === value);
}

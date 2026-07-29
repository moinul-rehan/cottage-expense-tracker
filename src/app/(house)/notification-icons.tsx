import {
  Bell,
  Receipt,
  Wallet,
  ShoppingBasket,
  UtensilsCrossed,
  CalendarClock,
  CalendarX,
  CalendarRange,
  RotateCw,
  RotateCcw,
  Trash2,
  Pin,
  Inbox,
  CheckCircle2,
  XCircle,
  type LucideIcon,
} from "lucide-react";

export const NOTIFICATION_ICONS: Record<string, LucideIcon> = {
  notice_posted: Pin,
  meal_request_submitted: Inbox,
  meal_request_approved: CheckCircle2,
  meal_request_rejected: XCircle,
  meal_cost_request_submitted: Inbox,
  meal_cost_request_approved: CheckCircle2,
  meal_cost_request_rejected: XCircle,
  utility_adjustment: Receipt,
  utility_adjustment_removed: Trash2,
  utility_expense_credit: Receipt,
  utility_deposit: Wallet,
  bazaar_entry: ShoppingBasket,
  bazaar_duty_assigned: CalendarClock,
  bazaar_duty_removed: CalendarX,
  meal_deposit: Wallet,
  daily_meal: UtensilsCrossed,
  month_created: CalendarRange,
  month_activated: RotateCw,
  utility_month_reset: RotateCcw,
  meal_month_reset: RotateCcw,
};

export function getNotificationIcon(type: string): LucideIcon {
  return NOTIFICATION_ICONS[type] ?? Bell;
}

"use client";

import { useMemo, useState, useTransition } from "react";
import { AdminCard, AdminCardTitle, AdminButton, AdminInput } from "../AdminUI";
import { sendAdminCustomEmail } from "./actions";
import { CheckCircle2, AlertCircle, Send, Sparkles, User, Users, Mail, FileText, Search } from "lucide-react";

export type AdminUserOption = {
  id: string;
  name: string;
  email: string;
  cottageName: string;
  status: string;
};

/** Splits on commas, semicolons, or newlines - however someone pastes a list. */
function parseManualEmails(raw: string): string[] {
  return raw
    .split(/[,;\n]/)
    .map((e) => e.trim())
    .filter(Boolean);
}

export function AdminEmailComposer({ users }: { users: AdminUserOption[] }) {
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [userSearch, setUserSearch] = useState("");
  const [manualEmails, setManualEmails] = useState<string>("");
  const [cottageName, setCottageName] = useState<string>("");

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.cottageName.toLowerCase().includes(q)
    );
  }, [users, userSearch]);

  const selectedUsers = useMemo(() => users.filter((u) => selectedUserIds.has(u.id)), [users, selectedUserIds]);
  const recipientEmails = useMemo(() => {
    const fromUsers = selectedUsers.map((u) => u.email);
    const manual = parseManualEmails(manualEmails);
    return Array.from(new Set([...fromUsers, ...manual].map((e) => e.trim()).filter(Boolean)));
  }, [selectedUsers, manualEmails]);

  const [templateType, setTemplateType] = useState<"approved" | "rejected" | "custom">("approved");
  const [subject, setSubject] = useState<string>("Your Cottage is approved 🎉");
  const [headline, setHeadline] = useState<string>("Your Cottage is Ready!");
  const [bodyText, setBodyText] = useState<string>(
    "Great news! Your cottage has been reviewed and approved by our team.\n\nYou and your housemates can now sign in, track expenses, manage meals, and collaborate seamlessly."
  );
  const [buttonText, setButtonText] = useState<string>("Sign in to your Cottage");
  const [buttonUrl, setButtonUrl] = useState<string>("https://cottagee.me/login");
  const [rejectionReason, setRejectionReason] = useState<string>("");

  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<"compose" | "preview">("compose");

  function applyTemplate(
    type: "approved" | "rejected" | "custom",
    cName: string = cottageName || "your Cottage"
  ) {
    setTemplateType(type);
    setFeedback(null);

    if (type === "approved") {
      setSubject(`${cName} is approved 🎉`);
      setHeadline("Your Cottage is Ready!");
      setBodyText(
        `Great news! ${cName} has been reviewed and approved by our team.\n\nYou and your housemates can now sign in, track expenses, manage meals, and collaborate seamlessly.`
      );
      setButtonText("Sign in to your Cottage");
      setButtonUrl("https://cottagee.me/login");
      setRejectionReason("");
    } else if (type === "rejected") {
      setSubject(`Update regarding ${cName}`);
      setHeadline("Application Status Update");
      setBodyText(
        `Thank you for your interest in Cottage. Unfortunately, your application for ${cName} could not be approved at this time.\n\nIf you believe this was an error or would like to re-apply, please contact our support team.`
      );
      setButtonText("Contact Support");
      setButtonUrl("mailto:support@cottagee.me");
      setRejectionReason("Requires further verification of cottage details.");
    } else {
      setSubject(`Announcement for ${cName}`);
      setHeadline("Important Update from Cottage");
      setBodyText(
        `Hello,\n\nWe have an update regarding your Cottage account and platform features. Please log in or reach out if you have any questions.`
      );
      setButtonText("Open Cottage App");
      setButtonUrl("https://cottagee.me/dashboard");
      setRejectionReason("");
    }
  }

  function toggleUser(userId: string) {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      // Re-derive the template's cottage-name placeholder: only meaningful
      // when exactly one recipient is picked, otherwise fall back to a
      // generic phrase so the preview doesn't awkwardly name just one of
      // several recipients' cottages.
      const nextUsers = users.filter((u) => next.has(u.id));
      const name = nextUsers.length === 1 ? nextUsers[0].cottageName : "";
      setCottageName(name);
      applyTemplate(templateType, name || "your Cottage");
      return next;
    });
  }

  function selectAllFiltered() {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      for (const u of filteredUsers) next.add(u.id);
      return next;
    });
  }

  function clearSelection() {
    setSelectedUserIds(new Set());
  }

  function handleSend() {
    setFeedback(null);
    startTransition(async () => {
      const res = await sendAdminCustomEmail({
        recipientEmails,
        templateType,
        cottageName,
        subject,
        headline,
        bodyText,
        buttonText,
        buttonUrl,
        rejectionReason,
      });

      if (res?.error) {
        setFeedback({ type: "error", text: res.error });
      } else {
        setFeedback({
          type: "success",
          text: `Email sent to ${res?.sentCount ?? recipientEmails.length} recipient${
            (res?.sentCount ?? recipientEmails.length) === 1 ? "" : "s"
          }!`,
        });
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header & Template Selection Tabs */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-black dark:text-white">Email Dispatcher</h2>
          <p className="text-sm text-black/60 dark:text-white/60">
            Send template-based notifications or custom branded emails to users.
          </p>
        </div>

        {/* Tab switcher for Mobile / Compact views */}
        <div className="flex rounded-xl bg-black/5 p-1 dark:bg-white/10 sm:hidden">
          <button
            type="button"
            onClick={() => setActiveTab("compose")}
            className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-all ${
              activeTab === "compose"
                ? "bg-white text-black shadow-xs dark:bg-white/20 dark:text-white"
                : "text-black/60 dark:text-white/60"
            }`}
          >
            Compose
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("preview")}
            className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-all ${
              activeTab === "preview"
                ? "bg-white text-black shadow-xs dark:bg-white/20 dark:text-white"
                : "text-black/60 dark:text-white/60"
            }`}
          >
            Live Preview
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`flex items-center gap-2.5 rounded-xl border p-4 text-sm font-medium ${
            feedback.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
              : "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="size-5 shrink-0 text-emerald-500" />
          ) : (
            <AlertCircle className="size-5 shrink-0 text-red-500" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Main Grid: Form on Left, Live Preview on Right */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Composer Form */}
        <AdminCard
          className={`lg:col-span-6 xl:col-span-5 ${
            activeTab === "preview" ? "hidden sm:block" : "block"
          }`}
        >
          <AdminCardTitle className="mb-4 flex items-center gap-2">
            <Mail className="size-5 text-primary" />
            Email Parameters
          </AdminCardTitle>

          <div className="flex flex-col gap-4">
            {/* Template Selector Pills */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-black/60 dark:text-white/60">
                Template Preset
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => applyTemplate("approved")}
                  className={`flex flex-col items-center justify-center gap-1 rounded-xl border p-2.5 text-xs font-semibold transition-all ${
                    templateType === "approved"
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                      : "border-black/10 bg-black/2 hover:bg-black/4 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                  }`}
                >
                  <Sparkles className="size-4" />
                  Approval
                </button>
                <button
                  type="button"
                  onClick={() => applyTemplate("rejected")}
                  className={`flex flex-col items-center justify-center gap-1 rounded-xl border p-2.5 text-xs font-semibold transition-all ${
                    templateType === "rejected"
                      ? "border-red-500 bg-red-500/10 text-red-700 dark:text-red-400"
                      : "border-black/10 bg-black/2 hover:bg-black/4 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                  }`}
                >
                  <AlertCircle className="size-4" />
                  Rejection
                </button>
                <button
                  type="button"
                  onClick={() => applyTemplate("custom")}
                  className={`flex flex-col items-center justify-center gap-1 rounded-xl border p-2.5 text-xs font-semibold transition-all ${
                    templateType === "custom"
                      ? "border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                      : "border-black/10 bg-black/2 hover:bg-black/4 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                  }`}
                >
                  <FileText className="size-4" />
                  Custom
                </button>
              </div>
            </div>

            {/* Registered User Multi-Select */}
            <div>
              <label className="mb-1.5 flex items-center justify-between text-xs font-semibold text-black/60 dark:text-white/60">
                <span className="flex items-center gap-1">
                  <Users className="size-3.5" /> Select Recipients
                </span>
                <span className="text-[11px] text-black/40 dark:text-white/40">
                  {selectedUserIds.size} selected
                </span>
              </label>

              <div className="relative mb-2">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-black/30 dark:text-white/30" />
                <AdminInput
                  type="text"
                  placeholder="Search by name, email, or cottage…"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="pl-8"
                />
              </div>

              <div className="mb-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={selectAllFiltered}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Select all {userSearch ? "filtered" : ""}
                </button>
                {selectedUserIds.size > 0 && (
                  <>
                    <span className="text-black/20 dark:text-white/20">·</span>
                    <button
                      type="button"
                      onClick={clearSelection}
                      className="text-xs font-medium text-black/50 hover:underline dark:text-white/50"
                    >
                      Clear
                    </button>
                  </>
                )}
              </div>

              <div className="max-h-56 overflow-y-auto rounded-lg border border-black/10 dark:border-white/10">
                {filteredUsers.length === 0 && (
                  <p className="p-3 text-center text-xs text-black/40 dark:text-white/40">No matching users.</p>
                )}
                {filteredUsers.map((u) => (
                  <label
                    key={u.id}
                    className="flex cursor-pointer items-center gap-2.5 border-b border-black/5 p-2.5 text-sm last:border-b-0 hover:bg-black/2 dark:border-white/5 dark:hover:bg-white/5"
                  >
                    <input
                      type="checkbox"
                      checked={selectedUserIds.has(u.id)}
                      onChange={() => toggleUser(u.id)}
                      className="size-4 shrink-0 accent-primary"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-black dark:text-white">{u.name}</p>
                      <p className="truncate text-xs text-black/50 dark:text-white/50">
                        {u.email} · {u.cottageName || "No Cottage"} · {u.status}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Manual/additional emails */}
            <div>
              <label className="mb-1 flex items-center gap-1 text-xs font-semibold text-black/60 dark:text-white/60">
                <User className="size-3.5" /> Additional Emails (optional)
              </label>
              <textarea
                rows={2}
                placeholder="Comma, semicolon, or newline-separated - for people not in the list above"
                value={manualEmails}
                onChange={(e) => setManualEmails(e.target.value)}
                className="w-full rounded-lg border border-black/10 bg-black/[0.02] p-2.5 text-sm text-black placeholder:text-black/30 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/30"
              />
              {recipientEmails.length > 0 && (
                <p className="mt-1.5 text-[11px] text-black/40 dark:text-white/40">
                  Sending to: {recipientEmails.join(", ")}
                </p>
              )}
            </div>

            {/* Subject Line */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-black/60 dark:text-white/60">
                Email Subject *
              </label>
              <AdminInput
                type="text"
                placeholder="Enter subject line..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            {/* Headline */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-black/60 dark:text-white/60">
                Headline Title *
              </label>
              <AdminInput
                type="text"
                placeholder="Enter email header title..."
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
              />
            </div>

            {/* Rejection Reason (If Rejection selected) */}
            {templateType === "rejected" && (
              <div>
                <label className="mb-1 block text-xs font-semibold text-red-600 dark:text-red-400">
                  Rejection Reason (Displayed in highlight box)
                </label>
                <AdminInput
                  type="text"
                  placeholder="Reason for decision..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
              </div>
            )}

            {/* Body Text */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-black/60 dark:text-white/60">
                Message Body Content *
              </label>
              <textarea
                rows={5}
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
                placeholder="Write your email body message..."
                className="w-full rounded-lg border border-black/10 bg-black/[0.02] p-3 text-sm font-normal text-black placeholder:text-black/30 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/30"
              />
            </div>

            {/* Button Settings (Custom Mode) */}
            {templateType === "custom" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-black/60 dark:text-white/60">
                    Button Label
                  </label>
                  <AdminInput
                    type="text"
                    placeholder="e.g. View Dashboard"
                    value={buttonText}
                    onChange={(e) => setButtonText(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-black/60 dark:text-white/60">
                    Button URL
                  </label>
                  <AdminInput
                    type="text"
                    placeholder="https://..."
                    value={buttonUrl}
                    onChange={(e) => setButtonUrl(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-2 flex items-center justify-end gap-3">
              <AdminButton
                type="button"
                disabled={isPending || recipientEmails.length === 0}
                onClick={handleSend}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Send className="size-4" />
                {isPending
                  ? "Sending..."
                  : `Send Email${recipientEmails.length > 1 ? ` (${recipientEmails.length})` : ""}`}
              </AdminButton>
            </div>
          </div>
        </AdminCard>

        {/* Right Column: Live Email Preview */}
        <AdminCard
          className={`lg:col-span-6 xl:col-span-7 ${
            activeTab === "compose" ? "hidden sm:block" : "block"
          }`}
        >
          <div className="mb-4 flex items-center justify-between">
            <AdminCardTitle className="flex items-center gap-2">
              <Sparkles className="size-4 text-emerald-500" />
              Live Inbox Preview
            </AdminCardTitle>
            <span className="rounded-md bg-black/5 px-2 py-0.5 text-xs text-black/50 dark:bg-white/10 dark:text-white/50">
              Desktop & Mobile
            </span>
          </div>

          {/* Email Preview Frame */}
          <div className="overflow-hidden rounded-2xl border border-black/10 bg-[#F4F4F6] p-4 sm:p-8 dark:border-white/10">
            <div className="mx-auto max-w-[440px]">
              {/* Header Logo */}
              <div className="mb-6 flex items-center gap-2.5 px-2">
                <img
                  src="https://cottagee.me/logo.png"
                  alt="Cottage"
                  className="size-7 rounded-md object-cover"
                />
                <span className="text-base font-semibold text-[#17191E]">Cottage</span>
              </div>

              {/* White Card Wrapper */}
              <div className="rounded-2xl border border-[#E4E5E8] bg-white p-6 sm:p-10 shadow-xs">
                {/* Badge */}
                {templateType === "approved" && (
                  <div className="mb-5 inline-block rounded-full border border-[#A7F3D0] bg-[#ECFDF5] px-3 py-1">
                    <span className="text-xs font-semibold text-[#059669]">🎉 Application Approved</span>
                  </div>
                )}

                {templateType === "rejected" && (
                  <div className="mb-5 inline-block rounded-full border border-[#FCA5A5] bg-[#FEF2F2] px-3 py-1">
                    <span className="text-xs font-semibold text-[#DC2626]">Application Update</span>
                  </div>
                )}

                {templateType === "custom" && (
                  <div className="mb-5 inline-block rounded-full border border-[#E5E7EB] bg-[#F3F4F6] px-3 py-1">
                    <span className="text-xs font-semibold text-[#374151]">📢 Platform Announcement</span>
                  </div>
                )}

                {/* Headline */}
                <h1 className="mb-3 text-xl font-semibold tracking-tight text-[#17191E]">
                  {headline || "Email Headline Title"}
                </h1>

                {/* Paragraph Body */}
                <div className="mb-6 space-y-3 text-sm leading-relaxed text-[#7A818D]">
                  {bodyText.split("\n\n").map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>

                {/* Rejection Reason Box */}
                {templateType === "rejected" && rejectionReason && (
                  <div className="mb-6 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-4">
                    <p className="mb-1 text-xs font-semibold tracking-wider text-[#4B5563] uppercase">
                      Reason from Admin:
                    </p>
                    <p className="text-sm leading-normal text-[#1F2937]">{rejectionReason}</p>
                  </div>
                )}

                {/* Action Button */}
                {templateType === "approved" && (
                  <a
                    href="https://cottagee.me/login"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block rounded-xl bg-[#DE7356] px-6 py-3 text-sm font-semibold text-white no-underline shadow-xs hover:opacity-90"
                  >
                    Sign in to your Cottage
                  </a>
                )}

                {templateType === "rejected" && (
                  <a
                    href="mailto:support@cottagee.me"
                    className="inline-block rounded-xl bg-[#17191E] px-6 py-3 text-sm font-semibold text-white no-underline shadow-xs"
                  >
                    Contact Support
                  </a>
                )}

                {templateType === "custom" && buttonText && (
                  <a
                    href={buttonUrl || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block rounded-xl bg-[#DE7356] px-6 py-3 text-sm font-semibold text-white no-underline shadow-xs"
                  >
                    {buttonText}
                  </a>
                )}

                {/* Link fallback */}
                <div className="mt-8 border-t border-[#E4E5E8] pt-6">
                  <p className="mb-1 text-xs text-[#AEB2BA]">Or paste this link into your browser:</p>
                  <p className="break-all text-xs text-[#DE7356]">
                    {templateType === "approved"
                      ? "https://cottagee.me/login"
                      : templateType === "rejected"
                      ? "mailto:support@cottagee.me"
                      : buttonUrl || "https://cottagee.me"}
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="px-2 pt-6">
                <p className="text-xs text-[#AEB2BA]">
                  Sent from Cottage Support. Reply directly to this email if you have questions.
                </p>
                <p className="mt-2 text-xs text-[#AEB2BA]">© 2026 Cottage. All rights reserved.</p>
              </div>
            </div>
          </div>
        </AdminCard>
      </div>
    </div>
  );
}

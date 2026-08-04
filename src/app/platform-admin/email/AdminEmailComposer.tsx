"use client";

import { useState, useTransition } from "react";
import { AdminCard, AdminCardTitle, AdminButton, AdminInput } from "../AdminUI";
import { sendAdminCustomEmail } from "./actions";
import { CheckCircle2, AlertCircle, Send, Sparkles, User, Mail, FileText } from "lucide-react";

export type AdminUserOption = {
  id: string;
  name: string;
  email: string;
  cottageName: string;
  status: string;
};

export function AdminEmailComposer({ users }: { users: AdminUserOption[] }) {
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [recipientEmail, setRecipientEmail] = useState<string>("");
  const [cottageName, setCottageName] = useState<string>("");

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

  function handleUserSelect(userId: string) {
    setSelectedUserId(userId);
    const selected = users.find((u) => u.id === userId);
    if (selected) {
      setRecipientEmail(selected.email);
      setCottageName(selected.cottageName);
      applyTemplate(templateType, selected.cottageName);
    }
  }

  function handleSend() {
    setFeedback(null);
    startTransition(async () => {
      const res = await sendAdminCustomEmail({
        recipientEmail,
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
          text: `Email successfully sent to ${recipientEmail}!`,
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

            {/* Existing User Selection Dropdown */}
            <div>
              <label className="mb-1.5 flex items-center justify-between text-xs font-semibold text-black/60 dark:text-white/60">
                <span className="flex items-center gap-1">
                  <User className="size-3.5" /> Select Registered User
                </span>
                <span className="text-[11px] text-black/40 dark:text-white/40">Optional</span>
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => handleUserSelect(e.target.value)}
                className="w-full rounded-lg border border-black/10 bg-black/[0.02] p-2.5 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white"
              >
                <option value="">-- Choose User from Database --</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email}) - {u.cottageName || "No Cottage"} [{u.status}]
                  </option>
                ))}
              </select>
            </div>

            {/* Recipient Email */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-black/60 dark:text-white/60">
                Recipient Email Address *
              </label>
              <AdminInput
                type="email"
                placeholder="user@example.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
              />
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
                disabled={isPending || !recipientEmail}
                onClick={handleSend}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Send className="size-4" />
                {isPending ? "Sending..." : "Send Email Now"}
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

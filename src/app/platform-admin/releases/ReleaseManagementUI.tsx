"use client";

import { useState, useTransition } from "react";
import { AdminCard, AdminCardTitle, AdminButton, AdminInput, AdminBadge } from "../AdminUI";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/format-date";
import { uploadAndPublishRelease, updateReleaseStatus, deleteRelease, type ActionResponse } from "./actions";
import {
  UploadCloud,
  Download,
  CheckCircle2,
  AlertCircle,
  Archive,
  Trash2,
  Smartphone,
  Layers,
  HardDrive,
  BarChart3,
  Rocket,
  FileCheck,
} from "lucide-react";

export type ReleaseRow = {
  id: string;
  platform: string;
  version: string;
  channel: "stable" | "beta" | "alpha";
  file_path: string;
  file_size_bytes: number;
  release_notes: string | null;
  min_supported_version: string | null;
  status: "active" | "archived" | "draft";
  download_count: number;
  created_at: string;
  published_at: string | null;
};

export type AnalyticsSummary = {
  activeVersion: string;
  latestReleaseDate: string | null;
  latestChannel: string;
  latestSizeMb: string;
  totalDownloads: number;
  downloadsToday: number;
  downloadsThisMonth: number;
};

export function ReleaseManagementUI({
  releases,
  analytics,
}: {
  releases: ReleaseRow[];
  analytics: AnalyticsSummary;
}) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmPublishId, setConfirmPublishId] = useState<string | null>(null);

  function formatMb(bytes: number) {
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.toLowerCase().endsWith(".apk")) {
        setSelectedFile(file);
      } else {
        setFeedback({ type: "error", text: "Only .apk files are supported." });
      }
    }
  }

  async function handleUploadSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFeedback(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    if (selectedFile) {
      formData.set("apk_file", selectedFile);
    }

    startTransition(async () => {
      const res: ActionResponse = await uploadAndPublishRelease(undefined, formData);
      if (res?.error) {
        setFeedback({ type: "error", text: res.error });
      } else if (res?.success) {
        setFeedback({ type: "success", text: res.success });
        setSelectedFile(null);
        form.reset();
      }
    });
  }

  function handleSetStatus(id: string, status: "active" | "archived" | "draft") {
    startTransition(async () => {
      await updateReleaseStatus(id, status);
      setConfirmPublishId(null);
      setFeedback({ type: "success", text: `Release status updated to ${status}.` });
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteRelease(id);
      setConfirmDeleteId(null);
      setFeedback({ type: "success", text: "Release deleted successfully." });
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-black dark:text-white flex items-center gap-2">
            <Smartphone className="size-5 text-primary" />
            Native App Release Management
          </h2>
          <p className="text-sm text-black/60 dark:text-white/60">
            Upload, publish, archive, and monitor Android APK distribution.
          </p>
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

      {/* Summary Stat Tiles */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminCard className="flex flex-col justify-between">
          <div className="flex items-center justify-between text-black/60 dark:text-white/60">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Version</span>
            <Rocket className="size-4 text-primary" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-black dark:text-white">
            {analytics.activeVersion || "None"}
          </div>
          <div className="mt-1 text-xs text-black/40 dark:text-white/40">
            Channel: <span className="font-semibold uppercase">{analytics.latestChannel}</span>
          </div>
        </AdminCard>

        <AdminCard className="flex flex-col justify-between">
          <div className="flex items-center justify-between text-black/60 dark:text-white/60">
            <span className="text-xs font-semibold uppercase tracking-wider">APK Size</span>
            <HardDrive className="size-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-black dark:text-white">
            {analytics.latestSizeMb}
          </div>
          <div className="mt-1 text-xs text-black/40 dark:text-white/40">
            Updated: {analytics.latestReleaseDate ? formatDate(analytics.latestReleaseDate) : "N/A"}
          </div>
        </AdminCard>

        <AdminCard className="flex flex-col justify-between">
          <div className="flex items-center justify-between text-black/60 dark:text-white/60">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Downloads</span>
            <Download className="size-4 text-blue-500" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-black dark:text-white">
            {analytics.totalDownloads.toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-black/40 dark:text-white/40">
            All time across releases
          </div>
        </AdminCard>

        <AdminCard className="flex flex-col justify-between">
          <div className="flex items-center justify-between text-black/60 dark:text-white/60">
            <span className="text-xs font-semibold uppercase tracking-wider">Downloads This Month</span>
            <BarChart3 className="size-4 text-purple-500" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-black dark:text-white">
            {analytics.downloadsThisMonth.toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-black/40 dark:text-white/40">
            Today: {analytics.downloadsToday}
          </div>
        </AdminCard>
      </div>

      {/* Main Grid: Upload Form & Release History */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Upload Form */}
        <AdminCard className="lg:col-span-5">
          <AdminCardTitle className="mb-4 flex items-center gap-2">
            <UploadCloud className="size-5 text-primary" />
            Upload New Release
          </AdminCardTitle>

          <form onSubmit={handleUploadSubmit} className="flex flex-col gap-4">
            {/* Drag & Drop Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 transition-all ${
                dragActive
                  ? "border-primary bg-primary/5"
                  : selectedFile
                  ? "border-emerald-500 bg-emerald-500/5"
                  : "border-black/10 hover:border-black/20 dark:border-white/10 dark:hover:border-white/20"
              }`}
            >
              <input
                type="file"
                name="apk_file"
                accept=".apk"
                onChange={handleFileChange}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
              {selectedFile ? (
                <div className="flex flex-col items-center gap-2 text-center">
                  <FileCheck className="size-8 text-emerald-500" />
                  <span className="font-semibold text-sm text-black dark:text-white">
                    {selectedFile.name}
                  </span>
                  <span className="text-xs text-black/50 dark:text-white/50">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-center">
                  <UploadCloud className="size-8 text-black/40 dark:text-white/40" />
                  <span className="font-medium text-sm text-black dark:text-white">
                    Drag & drop your .apk file here or click to browse
                  </span>
                  <span className="text-xs text-black/40 dark:text-white/40">
                    Supports Android Application Packages (.apk)
                  </span>
                </div>
              )}
            </div>

            {/* Version Number */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-black/60 dark:text-white/60">
                Version Number *
              </label>
              <AdminInput
                type="text"
                name="version"
                placeholder="e.g. 1.0.4"
                required
              />
            </div>

            {/* Release Channel */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-black/60 dark:text-white/60">
                Release Channel *
              </label>
              <select
                name="channel"
                defaultValue="beta"
                className="w-full rounded-lg border border-black/10 bg-black/[0.02] p-2.5 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white"
              >
                <option value="stable">Stable (Production)</option>
                <option value="beta">Beta</option>
                <option value="alpha">Alpha</option>
              </select>
            </div>

            {/* Minimum Supported Version */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-black/60 dark:text-white/60">
                Minimum Supported Version (Optional)
              </label>
              <AdminInput
                type="text"
                name="min_supported_version"
                placeholder="e.g. 1.0.0"
              />
            </div>

            {/* Release Notes */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-black/60 dark:text-white/60">
                Release Notes
              </label>
              <textarea
                name="release_notes"
                rows={4}
                placeholder="- Fixed notification bugs&#10;- Improved utility calculations&#10;- Performance improvements"
                className="w-full rounded-lg border border-black/10 bg-black/[0.02] p-3 text-sm font-normal text-black placeholder:text-black/30 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/30"
              />
            </div>

            {/* Publish Checkbox */}
            <label className="flex items-center gap-2 text-sm text-black/80 dark:text-white/80 cursor-pointer">
              <input
                type="checkbox"
                name="should_publish"
                value="true"
                defaultChecked
                className="size-4 rounded border-black/20 text-primary accent-primary"
              />
              <span>Set as active release immediately</span>
            </label>

            {/* Submit Button */}
            <AdminButton
              type="submit"
              disabled={isPending || !selectedFile}
              className="mt-2 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white justify-center"
            >
              <UploadCloud className="size-4" />
              {isPending ? "Uploading & Publishing..." : "Upload & Publish Release"}
            </AdminButton>
          </form>
        </AdminCard>

        {/* Release History Table */}
        <AdminCard className="lg:col-span-7">
          <div className="mb-4 flex items-center justify-between">
            <AdminCardTitle className="flex items-center gap-2">
              <Layers className="size-5 text-primary" />
              Release History
            </AdminCardTitle>
            <span className="text-xs text-black/40 dark:text-white/40">
              {releases.length} releases recorded
            </span>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Version</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Downloads</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {releases.map((r) => {
                  const isConfirmedDelete = confirmDeleteId === r.id;
                  const isConfirmedPublish = confirmPublishId === r.id;

                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-semibold text-black dark:text-white">
                        v{r.version}
                      </TableCell>
                      <TableCell>
                        <AdminBadge
                          tone={
                            r.channel === "stable"
                              ? "good"
                              : r.channel === "beta"
                              ? "warning"
                              : "neutral"
                          }
                        >
                          {r.channel}
                        </AdminBadge>
                      </TableCell>
                      <TableCell className="text-sm text-black/60 dark:text-white/60">
                        {formatMb(r.file_size_bytes)}
                      </TableCell>
                      <TableCell>
                        <AdminBadge
                          tone={
                            r.status === "active"
                              ? "good"
                              : r.status === "archived"
                              ? "neutral"
                              : "warning"
                          }
                        >
                          {r.status === "active" ? "Active" : r.status}
                        </AdminBadge>
                      </TableCell>
                      <TableCell className="font-mono text-sm text-black/80 dark:text-white/80">
                        {r.download_count}
                      </TableCell>
                      <TableCell className="text-xs text-black/40 dark:text-white/40">
                        {formatDate(r.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Direct Download */}
                          <a
                            href={r.file_path}
                            download
                            className="rounded-lg p-1.5 text-black/60 hover:bg-black/5 hover:text-black dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white"
                            title="Download APK"
                          >
                            <Download className="size-4" />
                          </a>

                          {/* Publish / Activate */}
                          {r.status !== "active" && (
                            isConfirmedPublish ? (
                              <button
                                type="button"
                                onClick={() => handleSetStatus(r.id, "active")}
                                className="rounded-md bg-emerald-600 px-2 py-1 text-xs font-semibold text-white"
                              >
                                Confirm
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmPublishId(r.id)}
                                className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                                title="Set as Active Release"
                              >
                                <Rocket className="size-4" />
                              </button>
                            )
                          )}

                          {/* Archive */}
                          {r.status === "active" && (
                            <button
                              type="button"
                              onClick={() => handleSetStatus(r.id, "archived")}
                              className="rounded-lg p-1.5 text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/30"
                              title="Archive Release"
                            >
                              <Archive className="size-4" />
                            </button>
                          )}

                          {/* Delete */}
                          {isConfirmedDelete ? (
                            <button
                              type="button"
                              onClick={() => handleDelete(r.id)}
                              className="rounded-md bg-red-600 px-2 py-1 text-xs font-semibold text-white"
                            >
                              Confirm
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(r.id)}
                              className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                              title="Delete Release"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!releases.length && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-sm text-black/40 dark:text-white/40">
                      No app releases uploaded yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </AdminCard>
      </div>
    </div>
  );
}

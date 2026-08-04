"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminButton, AdminCard, AdminCardTitle, AdminInput, AdminSelect, AdminTextarea } from "../AdminUI";
import { publishRelease } from "./actions";

type Phase = "idle" | "uploading" | "processing" | "verifying" | "publishing" | "done" | "error";

const PHASE_LABELS: Record<Phase, string> = {
  idle: "",
  uploading: "Uploading…",
  processing: "Processing APK…",
  verifying: "Verifying package…",
  publishing: "Saving release…",
  done: "Done",
  error: "",
};

/** replaceReleaseId, when set, switches this form into "replace file" mode -
 * same UI, but posts release_id so the upload route overwrites that row's
 * file instead of inserting a new release. */
export function UploadReleaseForm({ replaceRelease }: { replaceRelease?: { id: string; version: string } } = {}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [version, setVersion] = useState(replaceRelease?.version ?? "");
  const [channel, setChannel] = useState("stable");
  const [releaseNotes, setReleaseNotes] = useState("");
  const [minVersion, setMinVersion] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadedId, setUploadedId] = useState<string | null>(null);
  const [askPublish, setAskPublish] = useState(false);

  const busy = phase !== "idle" && phase !== "done" && phase !== "error";

  function pickFile(f: File | null) {
    setFile(f);
    setError(null);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) pickFile(dropped);
  }

  function submit() {
    if (!file) {
      setError("Choose an APK file.");
      return;
    }
    if (!replaceRelease && !version.trim()) {
      setError("Version is required.");
      return;
    }

    setError(null);
    setPhase("uploading");
    setProgress(0);

    const formData = new FormData();
    formData.set("file", file);
    formData.set("version", version.trim());
    formData.set("channel", channel);
    formData.set("release_notes", releaseNotes.trim());
    formData.set("min_supported_version", minVersion.trim());
    if (replaceRelease) formData.set("release_id", replaceRelease.id);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/platform-admin/releases/api/upload");

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const pct = Math.round((e.loaded / e.total) * 100);
        setProgress(pct);
        if (pct >= 100) setPhase("processing");
      }
    };

    xhr.onload = () => {
      let body: { id?: string; error?: string } = {};
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        // ignore
      }

      if (xhr.status >= 200 && xhr.status < 300 && body.id) {
        setPhase("done");
        setUploadedId(body.id);
        setAskPublish(!replaceRelease);
        router.refresh();
      } else {
        setPhase("error");
        setError(body.error ?? "Upload failed.");
      }
    };

    xhr.onerror = () => {
      setPhase("error");
      setError("Upload failed - check your connection and try again.");
    };

    setPhase("verifying");
    xhr.send(formData);
  }

  function reset() {
    setFile(null);
    setVersion(replaceRelease?.version ?? "");
    setChannel("stable");
    setReleaseNotes("");
    setMinVersion("");
    setPhase("idle");
    setProgress(0);
    setError(null);
    setUploadedId(null);
    setAskPublish(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handlePublishNow() {
    if (!uploadedId) return;
    await publishRelease(uploadedId);
    router.refresh();
    reset();
  }

  return (
    <AdminCard className="flex flex-col gap-4">
      <AdminCardTitle>{replaceRelease ? `Replace file for v${replaceRelease.version}` : "Upload a new release"}</AdminCardTitle>

      {phase === "done" ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-black/60 dark:text-white/60">
            Upload complete{replaceRelease ? "" : ` for version ${version}`}.
          </p>
          {askPublish && (
            <div className="flex gap-2">
              <AdminButton onClick={handlePublishNow}>Publish now</AdminButton>
              <AdminButton variant="outline" onClick={reset}>
                Not yet
              </AdminButton>
            </div>
          )}
          {!askPublish && (
            <AdminButton variant="outline" onClick={reset} className="self-start">
              Upload another
            </AdminButton>
          )}
        </div>
      ) : (
        <>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => !busy && fileInputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors ${
              dragActive
                ? "border-black/40 bg-black/4 dark:border-white/40 dark:bg-white/10"
                : "border-black/15 dark:border-white/15"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".apk"
              className="hidden"
              disabled={busy}
              onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
            />
            {file ? (
              <>
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-black/40 dark:text-white/40">{(file.size / (1024 * 1024)).toFixed(1)} MB</p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium">Drop a .apk file here, or click to browse</p>
                <p className="text-xs text-black/40 dark:text-white/40">Max 200MB</p>
              </>
            )}
          </div>

          {!replaceRelease && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm text-black/60 dark:text-white/60">Version</label>
                <AdminInput
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="1.2.0"
                  disabled={busy}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm text-black/60 dark:text-white/60">Channel</label>
                <AdminSelect value={channel} onChange={(e) => setChannel(e.target.value)} disabled={busy}>
                  <option value="stable">Stable</option>
                  <option value="beta">Beta</option>
                  <option value="alpha">Alpha</option>
                </AdminSelect>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-black/60 dark:text-white/60">Min supported version (optional)</label>
              <AdminInput
                value={minVersion}
                onChange={(e) => setMinVersion(e.target.value)}
                placeholder="1.0.0"
                disabled={busy}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-black/60 dark:text-white/60">Release notes (optional)</label>
            <AdminTextarea
              value={releaseNotes}
              onChange={(e) => setReleaseNotes(e.target.value)}
              placeholder="What changed in this release…"
              disabled={busy}
              rows={3}
            />
          </div>

          {busy && (
            <div className="flex flex-col gap-1.5">
              <div className="h-2 w-full overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
                <div
                  className="h-full rounded-full bg-black transition-all dark:bg-white"
                  style={{ width: `${phase === "uploading" ? progress : 100}%` }}
                />
              </div>
              <p className="text-xs text-black/40 dark:text-white/40">
                {phase === "uploading" ? `${progress}%` : PHASE_LABELS[phase]}
              </p>
            </div>
          )}

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <AdminButton onClick={submit} disabled={busy} className="self-start">
            {busy ? "Uploading…" : replaceRelease ? "Upload replacement" : "Upload release"}
          </AdminButton>
        </>
      )}
    </AdminCard>
  );
}

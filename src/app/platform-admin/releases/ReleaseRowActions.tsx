"use client";

import { useActionState, useState, useTransition } from "react";
import { AdminButton, AdminInput } from "../AdminUI";
import { publishRelease, archiveRelease, deleteRelease } from "./actions";
import { UploadReleaseForm } from "./UploadReleaseForm";

export function ReleaseRowActions({
  id,
  version,
  isPublished,
  isArchived,
}: {
  id: string;
  version: string;
  isPublished: boolean;
  isArchived: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [replacing, setReplacing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap justify-end gap-2">
        <a href={`/platform-admin/releases/${id}/download`}>
          <AdminButton variant="ghost">Download</AdminButton>
        </a>
        {!isPublished && (
          <AdminButton
            variant="ghost"
            disabled={pending}
            onClick={() => {
              if (!confirm(`Publish version ${version}? Any currently active version will be archived.`)) return;
              startTransition(() => publishRelease(id));
            }}
          >
            Publish
          </AdminButton>
        )}
        {!isArchived && (
          <AdminButton
            variant="ghost"
            disabled={pending}
            onClick={() => {
              if (!confirm(`Archive version ${version}?`)) return;
              startTransition(() => archiveRelease(id));
            }}
          >
            Archive
          </AdminButton>
        )}
        <AdminButton variant="ghost" onClick={() => setReplacing((v) => !v)}>
          {replacing ? "Cancel replace" : "Replace"}
        </AdminButton>
        <AdminButton variant="ghost" className="text-red-600 dark:text-red-400" onClick={() => setDeleting((v) => !v)}>
          Delete
        </AdminButton>
      </div>

      {replacing && (
        <div className="w-full max-w-md">
          <UploadReleaseForm replaceRelease={{ id, version }} />
        </div>
      )}

      {deleting && <DeleteReleaseForm id={id} version={version} onCancel={() => setDeleting(false)} />}
    </div>
  );
}

function DeleteReleaseForm({ id, version, onCancel }: { id: string; version: string; onCancel: () => void }) {
  const [state, action, pending] = useActionState(deleteRelease, undefined);
  const [confirmVersion, setConfirmVersion] = useState("");

  return (
    <form action={action} className="flex w-full max-w-sm flex-col gap-2 rounded-lg border-[0.5px] border-red-500/20 bg-red-500/5 p-3">
      <input type="hidden" name="release_id" value={id} />
      <p className="text-xs text-black/60 dark:text-white/60">
        Type <span className="font-semibold">{version}</span> to permanently delete this release and its file.
      </p>
      <AdminInput
        value={confirmVersion}
        onChange={(e) => setConfirmVersion(e.target.value)}
        autoComplete="off"
        className="max-w-[200px]"
      />
      {state?.error && <p className="text-xs text-red-600 dark:text-red-400">{state.error}</p>}
      <div className="flex gap-2">
        <AdminButton
          type="submit"
          variant="destructive"
          disabled={pending || confirmVersion !== version}
        >
          {pending ? "Deleting…" : "Delete permanently"}
        </AdminButton>
        <AdminButton type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </AdminButton>
      </div>
    </form>
  );
}

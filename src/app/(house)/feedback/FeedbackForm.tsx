"use client";

import { useActionState, useRef, useState } from "react";
import { ImagePlus } from "lucide-react";
import { X } from "@/components/animate-ui/icons/x";
import { submitFeedback } from "./actions";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormSection } from "@/components/ui/form-section";

const MAX_BYTES = 1024 * 1024; // 1MB

export function FeedbackForm({ userId }: { userId: string }) {
  const [state, action, pending] = useActionState(submitFeedback, undefined);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    if (!file.type.startsWith("image/")) {
      setUploadError("Please choose an image file.");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_BYTES) {
      setUploadError("Image must be 1MB or smaller.");
      e.target.value = "";
      return;
    }

    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `${userId}/${Date.now()}.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from("feedback-attachments")
      .upload(path, file);

    setUploading(false);

    if (uploadErr) {
      setUploadError("Could not upload the image.");
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("feedback-attachments").getPublicUrl(path);

    setImageUrl(publicUrl);
    setImagePreview(URL.createObjectURL(file));
  }

  function removeImage() {
    setImageUrl(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Report a bug or leave feedback</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="flex flex-col gap-5">
          <input type="hidden" name="image_url" value={imageUrl ?? ""} />
          <FormSection title="Details">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" placeholder="Short summary of the issue" required maxLength={120} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="What happened? What did you expect instead?"
                  required
                  rows={4}
                />
              </div>
            </div>
          </FormSection>

          <FormSection title="Screenshot" hint="Optional, up to 1MB.">
            {imagePreview ? (
              <div className="relative w-fit">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="Attached screenshot preview"
                  className="max-h-40 rounded-lg border border-border object-cover"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  aria-label="Remove screenshot"
                  className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full bg-destructive text-white shadow"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="w-fit"
              >
                <ImagePlus className="size-4" />
                {uploading ? "Uploading…" : "Attach screenshot"}
              </Button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            {uploadError && <p className="text-xs text-destructive">{uploadError}</p>}
          </FormSection>

          <div className="flex flex-col gap-2 border-t border-border pt-4">
            {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
            {state?.success && <p className="text-sm text-emerald-600">Thanks — your feedback was sent.</p>}
            <Button type="submit" disabled={pending || uploading} className="self-start">
              {pending ? "Sending…" : "Send feedback"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

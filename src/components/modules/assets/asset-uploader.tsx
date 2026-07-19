"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { createAssetAction } from "@/lib/actions/asset";

export function AssetUploader({
  scope,
  scopeId,
  onUploaded,
}: {
  scope: "campaigns" | "tasks";
  scopeId: string;
  onUploaded?: () => void;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      toast.error("File exceeds 25MB limit.");
      return;
    }

    setUploading(true);
    try {
      const res = await fetch("/api/assets/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope, scopeId, fileName: file.name, fileSize: file.size }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not start upload.");
      }

      const { path, token } = await res.json();

      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from("assets")
        .uploadToSignedUrl(path, token, file);
      if (uploadError) throw uploadError;

      await createAssetAction({
        fileName: file.name,
        storagePath: path,
        fileType: file.type || "application/octet-stream",
        sizeBytes: file.size,
        [scope === "campaigns" ? "campaignId" : "taskId"]: scopeId,
      });

      toast.success("File uploaded");
      onUploaded?.();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <input ref={inputRef} type="file" className="hidden" onChange={handleFileChange} />
      <Button size="sm" variant="outline" disabled={uploading} onClick={() => inputRef.current?.click()}>
        <Upload className="mr-1 h-4 w-4" />
        {uploading ? "Uploading..." : "Upload file"}
      </Button>
    </div>
  );
}

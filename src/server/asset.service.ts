import { prisma } from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "assets";

function buildStoragePath(scope: "campaigns" | "tasks", scopeId: string, fileName: string) {
  const safeName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  return `${scope}/${scopeId}/${Date.now()}-${safeName}`;
}

export async function createSignedUploadUrl(
  scope: "campaigns" | "tasks",
  scopeId: string,
  fileName: string,
) {
  const path = buildStoragePath(scope, scopeId, fileName);
  const supabase = createAdminClient();
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUploadUrl(path);
  if (error) throw error;
  return { path, token: data.token, signedUrl: data.signedUrl };
}

export async function getSignedDownloadUrl(storagePath: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, 60 * 10); // 10 minutes
  if (error) throw error;
  return data.signedUrl;
}

export async function createAssetRecord(input: {
  fileName: string;
  storagePath: string;
  fileType: string;
  sizeBytes: number;
  campaignId?: string | null;
  taskId?: string | null;
  uploaderId: string;
  tags?: string[];
}) {
  return prisma.asset.create({
    data: {
      fileName: input.fileName,
      storagePath: input.storagePath,
      fileType: input.fileType,
      sizeBytes: input.sizeBytes,
      campaignId: input.campaignId || null,
      taskId: input.taskId || null,
      uploaderId: input.uploaderId,
      tags: input.tags ?? [],
    },
  });
}

export async function listAssetsForCampaign(campaignId: string) {
  return prisma.asset.findMany({
    where: { campaignId },
    include: { uploader: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function listAssetsForTask(taskId: string) {
  return prisma.asset.findMany({
    where: { taskId },
    include: { uploader: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAsset(id: string) {
  return prisma.asset.findUnique({ where: { id } });
}

"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { authorize } from "@/lib/rbac";
import { logActivity } from "@/server/activity.service";
import { createAssetRecord, getSignedDownloadUrl, listAssetsForTask } from "@/server/asset.service";

export async function createAssetAction(input: {
  fileName: string;
  storagePath: string;
  fileType: string;
  sizeBytes: number;
  campaignId?: string;
  taskId?: string;
}) {
  const user = await requireUser();
  if (!authorize(user, "asset:upload")) {
    throw new Error("You don't have permission to upload assets.");
  }

  const asset = await createAssetRecord({ ...input, uploaderId: user.id });
  await logActivity({
    actorId: user.id,
    entityType: "ASSET",
    entityId: asset.id,
    action: "created",
    meta: { fileName: asset.fileName },
  });

  if (asset.campaignId) revalidatePath(`/campaigns/${asset.campaignId}`);
  return asset;
}

export async function getAssetDownloadUrlAction(storagePath: string) {
  await requireUser();
  return getSignedDownloadUrl(storagePath);
}

export async function listTaskAssetsAction(taskId: string) {
  await requireUser();
  const assets = await listAssetsForTask(taskId);
  return Promise.all(
    assets.map(async (a) => ({ ...a, url: await getSignedDownloadUrl(a.storagePath) })),
  );
}

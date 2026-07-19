import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { authorize } from "@/lib/rbac";
import { createSignedUploadUrl } from "@/server/asset.service";

const MAX_SIZE_BYTES = 25 * 1024 * 1024;

export async function POST(request: Request) {
  const user = await requireUser();
  if (!authorize(user, "asset:upload")) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const body = await request.json();
  const { scope, scopeId, fileName, fileSize } = body as {
    scope?: string;
    scopeId?: string;
    fileName?: string;
    fileSize?: number;
  };

  if (
    (scope !== "campaigns" && scope !== "tasks") ||
    typeof scopeId !== "string" ||
    !scopeId ||
    typeof fileName !== "string" ||
    !fileName
  ) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (typeof fileSize === "number" && fileSize > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "File exceeds 25MB limit" }, { status: 400 });
  }

  const result = await createSignedUploadUrl(scope, scopeId, fileName);
  return NextResponse.json(result);
}

import { formatDate } from "@/lib/format";
import type { Asset, User } from "@prisma/client";

type AssetWithUrl = Asset & { uploader: User; url: string };

function isImage(fileType: string) {
  return fileType.startsWith("image/");
}

export function AssetGrid({ assets }: { assets: AssetWithUrl[] }) {
  if (assets.length === 0) {
    return <p className="text-sm text-muted-foreground">No files uploaded yet.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {assets.map((asset) => (
        <a
          key={asset.id}
          href={asset.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group space-y-1 rounded-md border p-2 text-xs hover:bg-muted/40"
        >
          {isImage(asset.fileType) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={asset.url}
              alt={asset.fileName}
              className="h-24 w-full rounded object-cover"
            />
          ) : (
            <div className="flex h-24 w-full items-center justify-center rounded bg-muted text-muted-foreground">
              {asset.fileType.split("/")[1]?.toUpperCase() ?? "FILE"}
            </div>
          )}
          <div className="truncate font-medium">{asset.fileName}</div>
          <div className="text-muted-foreground">
            {asset.uploader.name} · {formatDate(asset.createdAt)}
          </div>
        </a>
      ))}
    </div>
  );
}

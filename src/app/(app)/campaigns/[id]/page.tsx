export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="space-y-1">
      <h1 className="text-2xl font-semibold">Campaign {id}</h1>
      <p className="text-muted-foreground">
        Overview/Timeline/Tasks/Budget/Analytics/Assets/Notes tabs land in
        Phase 1 onward (PRD §9.2).
      </p>
    </div>
  );
}

import { MatchSimulationPanel } from "@/components/agentslam/MatchSimulationPanel";

export default async function ArenaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <MatchSimulationPanel matchId={id} view="arena" />;
}

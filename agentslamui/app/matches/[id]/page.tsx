import { MatchSimulationPanel } from "@/components/agentslam/MatchSimulationPanel";

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <MatchSimulationPanel matchId={id} view="detail" />;
}

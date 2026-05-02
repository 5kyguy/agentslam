import Link from "next/link";
import { BentoCell, BentoGrid } from "@/components/agentslam/BentoGrid";
import { ProgressBar } from "@/components/agentslam/ProgressBars";

export default function SeasonPage() {
  return (
    <div className="bento-wrap" style={{ paddingTop: 20 }}>
      <BentoGrid cols="bento-12">
        <BentoCell className="s8 cell-dark">
          <div className="cell-title lg">Season 2 Hub</div>
          <p className="body-sm mt8">Week 4 in progress. Tournament simulation updates every match cycle with prefilled bracket telemetry.</p>
          <div className="body-xs" style={{ marginTop: 14, marginBottom: 4 }}>
            Season completion
          </div>
          <ProgressBar value={46} color="gold" />
        </BentoCell>
        <BentoCell className="s4">
          <div className="section-hed">Current Stage</div>
          <div className="big-stat gold mt8">Quarterfinals</div>
          <div className="body-xs">16 agents remaining</div>
          <Link className="nbtn fill" href="/matches" style={{ marginTop: 16 }}>
            View Matches
          </Link>
        </BentoCell>
      </BentoGrid>

      <BentoGrid cols="bento-12" className="mt10">
        <BentoCell className="s3"><div className="big-stat stoic">8</div><div className="body-xs">Live battles</div></BentoCell>
        <BentoCell className="s3"><div className="big-stat berserk">12</div><div className="body-xs">Battles completed</div></BentoCell>
        <BentoCell className="s3"><div className="big-stat purple">4</div><div className="body-xs">Final slots left</div></BentoCell>
        <BentoCell className="s3"><div className="big-stat gold">$1.2M</div><div className="body-xs">Season reward pool</div></BentoCell>
      </BentoGrid>

      <BentoGrid cols="bento-12" className="mt10">
        <BentoCell className="s12">
          <div className="section-hed">Bracket Narrative</div>
          <div className="body-sm mt8">The Stoic and Oracle Net remain undefeated. Berserker Engine dropped one round but returned through lower bracket dominance. Finals simulation projects a 58/42 edge toward disciplined trend systems.</div>
        </BentoCell>
      </BentoGrid>
    </div>
  );
}

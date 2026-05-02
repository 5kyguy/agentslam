import { TugOfWarBar } from "@/components/agentslam/ProgressBars";

function LeftBot() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden="true" className="agent-svg left-svg">
      <defs>
        <linearGradient id="leftHead" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#2bf2ff" />
          <stop offset="100%" stopColor="#15c7ff" />
        </linearGradient>
      </defs>
      <rect x="16" y="8" width="32" height="24" rx="7" fill="url(#leftHead)" />
      <circle cx="25" cy="20" r="3" fill="#071521" />
      <circle cx="39" cy="20" r="3" fill="#071521" />
      <rect x="20" y="35" width="24" height="18" rx="5" fill="#0f2237" stroke="#2bf2ff" strokeWidth="1.5" />
      <rect x="8" y="36" width="10" height="6" rx="3" fill="#2bf2ff" />
      <rect x="46" y="36" width="10" height="6" rx="3" fill="#2bf2ff" />
      <rect x="24" y="53" width="6" height="8" rx="2" fill="#15c7ff" />
      <rect x="34" y="53" width="6" height="8" rx="2" fill="#15c7ff" />
    </svg>
  );
}

function RightBot() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden="true" className="agent-svg right-svg">
      <defs>
        <linearGradient id="rightHead" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#ff76b2" />
          <stop offset="100%" stopColor="#ff4388" />
        </linearGradient>
      </defs>
      <rect x="16" y="8" width="32" height="24" rx="7" fill="url(#rightHead)" />
      <circle cx="25" cy="20" r="3" fill="#220b19" />
      <circle cx="39" cy="20" r="3" fill="#220b19" />
      <rect x="20" y="35" width="24" height="18" rx="5" fill="#2d1430" stroke="#ff5e9a" strokeWidth="1.5" />
      <rect x="8" y="36" width="10" height="6" rx="3" fill="#ff5e9a" />
      <rect x="46" y="36" width="10" height="6" rx="3" fill="#ff5e9a" />
      <rect x="24" y="53" width="6" height="8" rx="2" fill="#ff76b2" />
      <rect x="34" y="53" width="6" height="8" rx="2" fill="#ff76b2" />
    </svg>
  );
}

export function TugOfWarCharacters({
  leftPct,
  leftName,
  rightName,
}: {
  leftPct: number;
  leftName: string;
  rightName: string;
}) {
  const safe = Math.max(0, Math.min(100, leftPct));
  const shift = ((safe - 50) / 50) * 110;

  return (
    <div className="cell cell-dark s12">
      <div className="section-row">
        <div className="section-hed">Arena Tug of War</div>
        <div className="mono-sm">{leftName} {safe}% vs {rightName} {100 - safe}%</div>
      </div>

      <div className="tug-track" style={{ marginTop: 10 }}>
        <div className="tug-chars">
          <div className="tc-l anim-l">
            <LeftBot />
            <div className="body-xs" style={{ textAlign: "center", marginTop: 2 }}>{leftName}</div>
          </div>
          <div className="tc-r anim-r">
            <RightBot />
            <div className="body-xs" style={{ textAlign: "center", marginTop: 2 }}>{rightName}</div>
          </div>

          <svg className="rope-pos rope-wave" viewBox="0 0 260 26" preserveAspectRatio="none">
            <path d="M0 14 C 40 7, 80 21, 120 14 C 160 7, 200 21, 260 14" stroke="#c9a468" strokeWidth="3" fill="none" />
            <path d="M0 16 C 40 9, 80 23, 120 16 C 160 9, 200 23, 260 16" stroke="#83623c" strokeWidth="1.2" fill="none" />
          </svg>

          <div className="flag-pos" style={{ left: `calc(50% + ${shift}px)` }}>
            <div className="flag-pole" />
            <div className="flag-head flag-flicker" />
          </div>

          <div className="spark spark-l" />
          <div className="spark spark-r" />
        </div>
      </div>

      <div style={{ marginTop: 10 }}>
        <TugOfWarBar stoic={safe} />
      </div>
    </div>
  );
}

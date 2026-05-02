import Link from "next/link";

export default function HomePage() {
  const strategies = [
    { name: "DCA Bot", desc: "Buys fixed amounts at fixed intervals", risk: "Low risk, steady" },
    { name: "Momentum Trader", desc: "Buys strength, sells weakness", risk: "Medium risk, trend-dependent" },
    { name: "Mean Reverter", desc: "Bets extremes will revert", risk: "Medium risk, contrarian" },
    { name: "Fear & Greed", desc: "Buys sharp drops, sells rallies", risk: "Medium-high risk, contrarian" },
    { name: "Grid Trader", desc: "Trades fixed interval bands", risk: "Low-medium risk, range-bound" },
    { name: "Random Walk", desc: "Randomized control strategy", risk: "Chaos baseline" },
  ];

  const flow = [
    "User selects two strategies, token pair, capital, and duration",
    "Backend spawns two isolated Python contender processes",
    "On every tick, both agents receive market context and respond",
    "Referee applies identical rules and records each decision",
    "At match end, winner is declared by final portfolio value",
  ];

  return (
    <div className="hero-home">
      <section className="hero-stage">
        <div className="hero-orb hero-orb-cyan" />
        <div className="hero-orb hero-orb-pink" />
        <div className="hero-grid" />

        <div className="hero-content">
          <p className="hero-kicker">ETHGlobal Open Agents Concept</p>
          <h1 className="hero-title">
            Agent Slam.
            <br />AI Trading Arena.
          </h1>
          <p className="hero-sub">
            Two agents. Same capital. Same market. Different strategy logic.
            Every tick, trade, and PnL move is visible. Winner is final portfolio value.
          </p>
          <div className="hero-actions">
            <Link href="/matches" className="nbtn fill">
              Start a Match
            </Link>
            <Link href="/matches" className="nbtn outline">
              Watch Live Arena
            </Link>
          </div>
        </div>
      </section>

      <section className="home-section bento-wrap">
        <div className="bento bento-12">
          <article className="cell s4 home-card home-float">
            <div className="cell-label stoic">Backend Referee</div>
            <h3 className="cell-title">Neutral Match Orchestrator</h3>
            <p className="body-sm mt8">
              TypeScript Fastify server initializes matches, enforces fairness, tracks PnL, and declares winners.
            </p>
          </article>
          <article className="cell s4 home-card home-float" style={{ animationDelay: "0.18s" }}>
            <div className="cell-label berserk">Python Contenders</div>
            <h3 className="cell-title">Independent Agent Processes</h3>
            <p className="body-sm mt8">
              One process per strategy. Agents receive market ticks over WebSocket and return buy/sell/hold decisions.
            </p>
          </article>
          <article className="cell s4 home-card home-float" style={{ animationDelay: "0.36s" }}>
            <div className="cell-label gold">Spectator UI</div>
            <h3 className="cell-title">Watchable Strategy Fight</h3>
            <p className="body-sm mt8">
              Live leaderboard, decision feed, trade history, match timer, and winner debrief.
            </p>
          </article>
        </div>
      </section>

      <section className="home-section bento-wrap">
        <div className="bento bento-12">
          <article className="cell s6 home-panel">
            <div className="section-hed">Match Flow</div>
            <ol className="home-steps mt10">
              {flow.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </article>
          <article className="cell s6 home-panel">
            <div className="section-hed">Why It Works</div>
            <p className="body-sm mt10">
              Agent Slam turns strategy behavior into a spectator experience: same market, same constraints,
              visible reasoning, and transparent win condition based on portfolio value.
            </p>
            <div className="mt12 flex gap8" style={{ flexWrap: "wrap" }}>
              <span className="tag tag-stoic">Transparent Rules</span>
              <span className="tag tag-purple">Real-time Narrative</span>
              <span className="tag tag-gold">Auditable Decisions</span>
            </div>
          </article>
        </div>
      </section>

      <section className="home-section bento-wrap">
        <div className="bento bento-12">
          <article className="cell s12 home-panel">
            <div className="section-row">
              <div className="section-hed">Built-in Strategies</div>
              <Link className="section-link" href="/strategies">
                Full Marketplace →
              </Link>
            </div>
            <div className="bento bento-3 mt10">
              {strategies.map((s) => (
                <div key={s.name} className="cell home-strategy-card">
                  <div className="cell-title">{s.name}</div>
                  <p className="body-xs mt8">{s.desc}</p>
                  <p className="body-xs mt8" style={{ color: "var(--gold)" }}>
                    {s.risk}
                  </p>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}

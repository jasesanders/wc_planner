import { matches } from "../data/matches";
import { teamRatings } from "../data/teamRatings";
import { getLikelyTeamsForMatch, getLikelyTeamsInMatch } from "../utils/predictions";
import { stageLabels } from "../utils/format";

export function KnockoutPredictorView() {
  const knockoutMatches = matches.filter((match) => match.stage !== "group");

  return (
    <section className="view">
      <div className="context-panel">
        Planning estimate only. Group paths use the schedule slots; percentages are normalized from static ratings and brand-neutral path assumptions.
      </div>
      <div className="predictor-grid">
        {knockoutMatches.map((match) => {
          const likely = getLikelyTeamsForMatch(match, teamRatings);
          const involved = getLikelyTeamsInMatch(match, teamRatings);
          return (
            <article className="predictor-card" key={match.id}>
              <div className="match-card__meta">
                <span>{stageLabels[match.stage]}</span>
                {match.matchNumber && <span>Match {match.matchNumber}</span>}
                <span>{match.venue}</span>
              </div>
              <h2>{match.homeSlot} vs {match.awaySlot}</h2>
              <div className="prob-columns">
                <ProbabilityList title="Home slot" teams={likely.home} />
                <ProbabilityList title="Away slot" teams={likely.away} />
              </div>
              <h3>Most likely teams involved</h3>
              <ul className="probability-chips">
                {involved.slice(0, 8).map((team) => (
                  <li key={team.team}>
                    <span>{team.team}</span>
                    <strong>{team.probability}%</strong>
                  </li>
                ))}
              </ul>
              <h3>Best planning matchups</h3>
              <ul className="plain-list">
                {likely.topLikelyMatchups.map((item) => (
                  <li key={`${item.home}-${item.away}`}>
                    {item.home} vs {item.away}: ~{item.probability}% path, {item.interestScore} interest
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function ProbabilityList({ title, teams }: { title: string; teams: { team: string; probability: number }[] }) {
  return (
    <div>
      <h3>{title}</h3>
      <ul className="plain-list">
        {teams.map((team) => (
          <li key={team.team}>
            <span>{team.team}</span>
            <strong>{team.probability}%</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

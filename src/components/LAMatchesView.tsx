import type { UserMatchPlan } from "../types";
import { matches } from "../data/matches";
import { teamRatings } from "../data/teamRatings";
import { isLAMatch } from "../utils/format";
import { getLikelyTeamsForMatch } from "../utils/predictions";
import { MatchCard } from "./MatchCard";

type Props = {
  getPlan: (matchId: string) => UserMatchPlan;
  onUpdate: (matchId: string, updates: Partial<Omit<UserMatchPlan, "matchId">>) => void;
};

export function LAMatchesView({ getPlan, onUpdate }: Props) {
  const laMatches = matches.filter((match) => isLAMatch(match.city, match.venue));

  return (
    <section className="view">
      <div className="context-panel">
        LA’s official host materials describe the Fan Festival at Los Angeles Memorial Coliseum plus regional fan zones with live match viewing and immersive experiences across 39 days.
      </div>
      <div className="match-list">
        {laMatches.map((match) => {
          const likely = getLikelyTeamsForMatch(match, teamRatings);
          const best = likely.topLikelyMatchups[0];
          const reason =
            match.stage === "group"
              ? `${match.confirmedTeams?.join(" vs ") ?? "Confirmed group match"} at SoFi. ${match.notes ?? ""}`
              : `${best ? `${best.home} vs ${best.away}` : "Knockout path"} could make this a strong in-person or COSM candidate.`;
          return (
            <div className="la-block" key={match.id}>
              <MatchCard match={match} plan={getPlan(match.id)} onUpdate={onUpdate} />
              <p className="why">{reason}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

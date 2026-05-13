import { useState } from "react";
import type { UserMatchPlan } from "../types";
import { matches } from "../data/matches";
import { viewingOptions } from "../data/viewingOptions";
import { teamRatings } from "../data/teamRatings";
import { calculateMatchupInterest } from "../utils/predictions";
import { scoreLabel } from "../utils/format";
import { interestFilterLabels, isDuringLaStay, matchesInterestFilter, type InterestFilter } from "../utils/planFilters";
import { getViewingOptionsForMatch } from "../utils/viewingOptions";
import { MatchCard } from "./MatchCard";

type Props = {
  getPlan: (matchId: string) => UserMatchPlan;
  onUpdate: (matchId: string, updates: Partial<Omit<UserMatchPlan, "matchId">>) => void;
};

export function BigMatchupsView({ getPlan, onUpdate }: Props) {
  const [interestFilter, setInterestFilter] = useState<InterestFilter>("all");
  const [whileInLa, setWhileInLa] = useState(false);
  const ranked = matches
    .map((match) => ({ match, score: calculateMatchupInterest(match, teamRatings) }))
    .filter(({ match }) => matchesInterestFilter(getPlan(match.id), interestFilter))
    .filter(({ match }) => !whileInLa || isDuringLaStay(match.date))
    .sort((a, b) => b.score - a.score);

  return (
    <section className="view">
      <div className="context-panel">
        Score = stage weight + average team strength + brand interest + LA proximity + a small boost for global-draw teams. This is a personal planning heuristic, not odds.
      </div>
      <div className="filters">
        <label>
          Interested in
          <select value={interestFilter} onChange={(event) => setInterestFilter(event.target.value as InterestFilter)}>
            {Object.entries(interestFilterLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="checkbox-label">
          <input type="checkbox" checked={whileInLa} onChange={(event) => setWhileInLa(event.target.checked)} />
          While in LA
        </label>
      </div>
      <div className="rank-list">
        {ranked.map(({ match, score }, index) => (
          <div className="rank-row" key={match.id}>
            <div className="rank-row__score">
              <span>#{index + 1}</span>
              <strong>{score}</strong>
              <small>{scoreLabel(score)}</small>
            </div>
            <MatchCard match={match} plan={getPlan(match.id)} onUpdate={onUpdate} compact />
            <div className="best-options-panel">
              <h3>Best LA options</h3>
              {getViewingOptionsForMatch(match, viewingOptions, score).slice(0, 4).map(({ option, reason }) => (
                <div className="best-option" key={option.id}>
                  <strong>{option.name}</strong>
                  <span>{option.venueName} · {option.costType} · {reason}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {!ranked.length && <p className="empty">No matches match that interest filter yet.</p>}
    </section>
  );
}

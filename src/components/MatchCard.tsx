import type { Match, UserMatchPlan, ViewingPlan } from "../types";
import { viewingOptions } from "../data/viewingOptions";
import { teamRatings } from "../data/teamRatings";
import { calculateMatchupInterest, getLikelyTeamsForMatch, getLikelyTeamsInMatch } from "../utils/predictions";
import { formatDate, isLAMatch, scoreLabel, stageLabels, viewingPlanLabels } from "../utils/format";
import { getViewingOptionsForMatch, viewingOptionTypeLabels, viewingPlanForOption } from "../utils/viewingOptions";

type Props = {
  match: Match;
  plan: UserMatchPlan;
  onUpdate: (matchId: string, updates: Partial<Omit<UserMatchPlan, "matchId">>) => void;
  compact?: boolean;
};

const planOptions: ViewingPlan[] = ["undecided", "in_person", "fan_zone", "cosm", "good_tv", "skip"];

export function MatchCard({ match, plan, onUpdate, compact = false }: Props) {
  const score = calculateMatchupInterest(match, teamRatings);
  const likely = getLikelyTeamsForMatch(match, teamRatings);
  const isKnockout = match.stage !== "group";
  const likelyInvolved = isKnockout ? getLikelyTeamsInMatch(match, teamRatings) : [];
  const la = isLAMatch(match.city, match.venue);
  const hasConfirmedUsa = [match.homeSlot, match.awaySlot, ...(match.confirmedTeams ?? [])].some((value) => value.toLowerCase() === "usa");
  const potentialUsa = isKnockout && likelyInvolved.some((team) => team.team === "USA" && team.probability >= 5);
  const highPriority = plan.priority >= 4 && plan.viewingPlan !== "skip";
  const planClass = plan.viewingPlan !== "undecided" ? `match-card--plan-${plan.viewingPlan}` : "";
  const ticketClass = plan.ticketInterest ? "match-card--ticket-interest" : "";
  const lockedClass = plan.lockedIn ? "match-card--locked" : "";
  const matchedOptions = getViewingOptionsForMatch(match, viewingOptions, score).slice(0, compact ? 3 : 5);
  const selectedOption = viewingOptions.find((option) => option.id === plan.selectedViewingOptionId);

  return (
    <article className={`match-card ${la ? "match-card--la" : ""} ${planClass} ${ticketClass} ${lockedClass}`}>
      <div className="match-card__main">
        <div className="match-card__meta">
          <span>{formatDate(match.date)}</span>
          {match.timeLocal && <span>{match.timeLocal}</span>}
          <span>{stageLabels[match.stage]}</span>
          {match.matchNumber && <span>Match {match.matchNumber}</span>}
        </div>
        <div className="match-card__teams">
          {match.homeSlot} <span>vs</span> {match.awaySlot}
        </div>
        <div className="match-card__venue">
          {match.venue}, {match.city}
        </div>
        <div className="badges">
          {la && <span className="badge badge--la">LA / SoFi</span>}
          {isKnockout && <span className="badge">Knockout</span>}
          {score >= 75 && <span className="badge badge--brand">Big-name potential</span>}
          {hasConfirmedUsa && <span className="badge badge--usa">USA match</span>}
          {!hasConfirmedUsa && potentialUsa && <span className="badge badge--usa">Potential USA path</span>}
          {plan.viewingPlan !== "undecided" && <span className={`badge badge--plan badge--plan-${plan.viewingPlan}`}>{viewingPlanLabels[plan.viewingPlan]}</span>}
          {selectedOption && <span className="badge badge--selected-option">{selectedOption.name}</span>}
          {plan.ticketInterest && <span className="badge badge--ticket">Ticket interest</span>}
          {highPriority && <span className="badge badge--priority">High priority</span>}
          {plan.lockedIn && <span className="badge badge--locked">Locked in</span>}
        </div>
        <div className={`match-card__prediction ${compact ? "match-card__prediction--compact" : ""}`}>
          {!compact && (
            <>
              <strong>{score}</strong> · {scoreLabel(score)}
              {likely.topLikelyMatchups[0] && (
                <span>
                  {" "}
                  · Best estimate: {likely.topLikelyMatchups[0].home} vs {likely.topLikelyMatchups[0].away}
                </span>
              )}
            </>
          )}
          {likelyInvolved.length > 0 && (
            <div className="mini-probabilities">
              Likely involved:{" "}
              {likelyInvolved.slice(0, 5).map((team) => (
                <span key={team.team}>
                  {team.team} {team.probability}%
                </span>
              ))}
            </div>
          )}
        </div>
        {matchedOptions.length > 0 && (
          <div className="viewing-options-strip">
            <h3>Available LA viewing options</h3>
            <div className="viewing-option-list">
              {matchedOptions.map(({ option, confidence, reason }) => (
                <div className={`viewing-option-card ${plan.selectedViewingOptionId === option.id ? "viewing-option-card--selected" : ""}`} key={option.id}>
                  <div>
                    <strong>{option.name}</strong>
                    <span>{viewingOptionTypeLabels[option.type]} · {option.venueName}{option.neighborhood ? `, ${option.neighborhood}` : ""}</span>
                    <small>{option.costType} · {option.ticketRequired ? "ticket required" : option.reservationRecommended ? "reservation recommended" : "no ticket noted"} · {confidence.replace("_", " ")} · {reason}</small>
                  </div>
                  <div className="viewing-option-actions">
                    {option.ticketUrl && <a href={option.ticketUrl} target="_blank" rel="noreferrer">Tickets</a>}
                    <a href={option.sourceUrl} target="_blank" rel="noreferrer">Source</a>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdate(match.id, {
                          selectedViewingOptionId: option.id,
                          viewingPlan: viewingPlanForOption(option),
                          ticketInterest: Boolean(option.ticketRequired || option.reservationRecommended),
                        })
                      }
                    >
                      Set as plan
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="match-card__controls">
        <label>
          Plan
          <select value={plan.viewingPlan} onChange={(event) => onUpdate(match.id, { viewingPlan: event.target.value as ViewingPlan })}>
            {planOptions.map((option) => (
              <option key={option} value={option}>
                {viewingPlanLabels[option]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Priority
          <select value={plan.priority} onChange={(event) => onUpdate(match.id, { priority: Number(event.target.value) as UserMatchPlan["priority"] })}>
            {[1, 2, 3, 4, 5].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label className="checkbox-label">
          <input type="checkbox" checked={plan.ticketInterest} onChange={(event) => onUpdate(match.id, { ticketInterest: event.target.checked })} />
          Ticket interest
        </label>
        <label className="checkbox-label">
          <input type="checkbox" checked={plan.lockedIn} onChange={(event) => onUpdate(match.id, { lockedIn: event.target.checked })} />
          Locked in
        </label>
        <textarea
          aria-label={`Notes for ${match.homeSlot} vs ${match.awaySlot}`}
          placeholder="Notes"
          value={plan.notes}
          onChange={(event) => onUpdate(match.id, { notes: event.target.value })}
        />
      </div>
    </article>
  );
}

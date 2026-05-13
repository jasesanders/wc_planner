import { useMemo, useState } from "react";
import type { MatchStage, UserMatchPlan } from "../types";
import { matches } from "../data/matches";
import { formatDate, isLAMatch, stageLabels } from "../utils/format";
import { interestFilterLabels, isDuringLaStay, matchesInterestFilter, type InterestFilter } from "../utils/planFilters";
import { MatchCard } from "./MatchCard";

type Props = {
  plans: Record<string, UserMatchPlan>;
  getPlan: (matchId: string) => UserMatchPlan;
  onUpdate: (matchId: string, updates: Partial<Omit<UserMatchPlan, "matchId">>) => void;
};

export function CalendarView({ plans, getPlan, onUpdate }: Props) {
  const [stage, setStage] = useState<"all" | MatchStage>("all");
  const [venue, setVenue] = useState("all");
  const [onlyLa, setOnlyLa] = useState(false);
  const [onlyMarked, setOnlyMarked] = useState(false);
  const [onlyHigh, setOnlyHigh] = useState(false);
  const [interestFilter, setInterestFilter] = useState<InterestFilter>("all");
  const [whileInLa, setWhileInLa] = useState(false);

  const venues = useMemo(() => ["all", ...new Set(matches.map((match) => `${match.city} · ${match.venue}`))], []);
  const filtered = matches.filter((match) => {
    const plan = plans[match.id];
    if (stage !== "all" && match.stage !== stage) return false;
    if (venue !== "all" && `${match.city} · ${match.venue}` !== venue) return false;
    if (onlyLa && !isLAMatch(match.city, match.venue)) return false;
    if (onlyMarked && (!plan || (plan.viewingPlan === "undecided" && !plan.notes && !plan.ticketInterest && !plan.lockedIn && !plan.selectedViewingOptionId))) return false;
    if (onlyHigh && (!plan || plan.priority < 4)) return false;
    if (!matchesInterestFilter(plan, interestFilter)) return false;
    if (whileInLa && !isDuringLaStay(match.date)) return false;
    return true;
  });

  const byDate = filtered.reduce<Record<string, typeof filtered>>((groups, match) => {
    groups[match.date] = [...(groups[match.date] ?? []), match];
    return groups;
  }, {});

  return (
    <section className="view">
      <div className="filters">
        <label>
          Stage
          <select value={stage} onChange={(event) => setStage(event.target.value as "all" | MatchStage)}>
            <option value="all">All stages</option>
            {Object.entries(stageLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          City / venue
          <select value={venue} onChange={(event) => setVenue(event.target.value)}>
            {venues.map((item) => (
              <option key={item} value={item}>
                {item === "all" ? "All venues" : item}
              </option>
            ))}
          </select>
        </label>
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
        <label className="checkbox-label">
          <input type="checkbox" checked={onlyLa} onChange={(event) => setOnlyLa(event.target.checked)} />
          Only LA
        </label>
        <label className="checkbox-label">
          <input type="checkbox" checked={onlyMarked} onChange={(event) => setOnlyMarked(event.target.checked)} />
          Only marked
        </label>
        <label className="checkbox-label">
          <input type="checkbox" checked={onlyHigh} onChange={(event) => setOnlyHigh(event.target.checked)} />
          High priority
        </label>
      </div>
      {Object.entries(byDate).map(([date, dateMatches]) => (
        <div className="date-group" key={date}>
          <h2>{formatDate(date)}</h2>
          <div className="match-list">
            {dateMatches.map((match) => (
              <MatchCard key={match.id} match={match} plan={getPlan(match.id)} onUpdate={onUpdate} />
            ))}
          </div>
        </div>
      ))}
      {!filtered.length && <p className="empty">No matches match those filters.</p>}
    </section>
  );
}

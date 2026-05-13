import { useMemo, useState } from "react";
import { viewingOptions } from "../data/viewingOptions";
import { matches } from "../data/matches";
import { teamRatings } from "../data/teamRatings";
import type { CostType, ViewingOptionType } from "../types";
import { calculateMatchupInterest } from "../utils/predictions";
import { getViewingOptionsForMatch, isOptionActiveOnDate, viewingOptionTypeLabels } from "../utils/viewingOptions";
import { formatDate, stageLabels } from "../utils/format";

type OptionFilter = "all" | "free" | "paid" | "official" | "cosm" | "sports_bar" | "city_watch_party";

const optionFilterLabels: Record<OptionFilter, string> = {
  all: "All options",
  free: "Free only",
  paid: "Paid / ticketed",
  official: "Official only",
  cosm: "COSM",
  sports_bar: "Sports bars",
  city_watch_party: "City watch parties",
};

export function ViewingOptionsView() {
  const [filter, setFilter] = useState<OptionFilter>("all");
  const [startDate, setStartDate] = useState("2026-06-11");
  const [endDate, setEndDate] = useState("2026-07-11");
  const [includeAdjacent, setIncludeAdjacent] = useState(false);

  const filtered = viewingOptions.filter((option) => {
    if (!includeAdjacent && option.type === "concert_or_nightlife") return false;
    if (option.endDate < startDate || option.startDate > endDate) return false;
    if (filter === "free") return option.costType === "free";
    if (filter === "paid") return option.costType === "paid" || option.ticketRequired;
    if (filter === "official") return option.type === "official_fan_festival" || option.type === "official_fan_zone";
    if (filter === "all") return true;
    return option.type === (filter as ViewingOptionType);
  });

  const matchesByOption = useMemo(() => {
    return Object.fromEntries(
      viewingOptions.map((option) => [
        option.id,
        matches
          .filter((match) => match.date >= startDate && match.date <= endDate && isOptionActiveOnDate(option, match.date))
          .filter((match) =>
            getViewingOptionsForMatch(match, [option], calculateMatchupInterest(match, teamRatings), includeAdjacent).length > 0,
          )
          .slice(0, 8),
      ]),
    );
  }, [includeAdjacent, startDate, endDate]);

  return (
    <section className="view">
      <div className="filters">
        <label>
          Option type
          <select value={filter} onChange={(event) => setFilter(event.target.value as OptionFilter)}>
            {Object.entries(optionFilterLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Start date
          <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
        </label>
        <label>
          End date
          <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
        </label>
        <label className="checkbox-label">
          <input type="checkbox" checked={includeAdjacent} onChange={(event) => setIncludeAdjacent(event.target.checked)} />
          Include nightlife / adjacent events
        </label>
      </div>
      <div className="option-directory">
        {filtered.map((option) => {
          const candidateMatches = matchesByOption[option.id] ?? [];
          return (
            <article className="option-directory-card" key={option.id}>
              <div className="option-directory-card__header">
                <div>
                  <h2>{option.name}</h2>
                  <p>{viewingOptionTypeLabels[option.type]} · {option.venueName}{option.neighborhood ? `, ${option.neighborhood}` : ""}</p>
                </div>
                <span className="badge badge--selected-option">{option.costType}</span>
              </div>
              <p>{formatDate(option.startDate)} to {formatDate(option.endDate)} · {option.ticketRequired ? "Ticket required" : option.reservationRecommended ? "Reservation recommended" : "No ticket noted"}</p>
              {option.notes && <p>{option.notes}</p>}
              <div className="viewing-option-actions">
                {option.ticketUrl && <a href={option.ticketUrl} target="_blank" rel="noreferrer">Tickets</a>}
                <a href={option.sourceUrl} target="_blank" rel="noreferrer">Source</a>
              </div>
              <h3>Likely candidate matches</h3>
              {candidateMatches.length ? (
                <ul className="plain-list">
                  {candidateMatches.map((match) => (
                    <li key={match.id}>
                      <span>{formatDate(match.date)} · {match.homeSlot} vs {match.awaySlot}</span>
                      <strong>{stageLabels[match.stage]}</strong>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="subtle">No candidate matches in this date range.</p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

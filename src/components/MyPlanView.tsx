import type { UserMatchPlan, ViewingPlan } from "../types";
import { matches } from "../data/matches";
import { viewingOptions } from "../data/viewingOptions";
import { viewingPlanLabels } from "../utils/format";
import { MatchCard } from "./MatchCard";

type Props = {
  plans: Record<string, UserMatchPlan>;
  getPlan: (matchId: string) => UserMatchPlan;
  onUpdate: (matchId: string, updates: Partial<Omit<UserMatchPlan, "matchId">>) => void;
  onImport: (state: { plans: Record<string, UserMatchPlan> }) => void;
  onReset: () => void;
};

const planOrder: ViewingPlan[] = ["in_person", "fan_zone", "cosm", "good_tv", "skip", "undecided"];

export function MyPlanView({ plans, getPlan, onUpdate, onImport, onReset }: Props) {
  const plannedMatches = matches.filter((match) => {
    const plan = plans[match.id];
    return plan && (plan.viewingPlan !== "undecided" || plan.notes || plan.ticketInterest || plan.lockedIn || plan.selectedViewingOptionId);
  });

  async function copySummary() {
    const lines = plannedMatches.map((match) => {
      const plan = getPlan(match.id);
      const option = viewingOptions.find((item) => item.id === plan.selectedViewingOptionId);
      return `${match.date} · ${match.homeSlot} vs ${match.awaySlot} · ${viewingPlanLabels[plan.viewingPlan]}${option ? ` · ${option.name}` : ""} · priority ${plan.priority}${plan.ticketInterest ? " · tickets" : ""}${plan.lockedIn ? " · locked in" : ""}${plan.notes ? ` · ${plan.notes}` : ""}`;
    });
    await navigator.clipboard.writeText(lines.join("\n"));
  }

  function downloadJson() {
    const blob = new Blob([JSON.stringify({ plans }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "world-cup-2026-planner-backup.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  function importJson(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        onImport(JSON.parse(String(reader.result)));
      } catch {
        alert("That JSON file could not be imported.");
      }
    };
    reader.readAsText(file);
  }

  return (
    <section className="view">
      <div className="action-bar">
        <button type="button" onClick={copySummary} disabled={!plannedMatches.length}>Copy summary</button>
        <button type="button" onClick={downloadJson}>Download JSON backup</button>
        <label className="file-button">
          Import JSON
          <input type="file" accept="application/json" onChange={(event) => importJson(event.target.files?.[0])} />
        </label>
        <button type="button" className="danger" onClick={() => window.confirm("Reset all saved plans?") && onReset()}>Reset</button>
      </div>
      {!plannedMatches.length && <p className="empty">No saved plans yet. Mark a match from Calendar, LA Matches, or Big Matchups.</p>}
      {planOrder.map((planName) => {
        const group = plannedMatches.filter((match) => getPlan(match.id).viewingPlan === planName);
        if (!group.length) return null;
        return (
          <div className="date-group" key={planName}>
            <h2>{viewingPlanLabels[planName]}</h2>
            <div className="match-list">
              {group.map((match) => (
                <div className="planned-match" key={match.id}>
                  <MatchCard match={match} plan={getPlan(match.id)} onUpdate={onUpdate} />
                  <SelectedOptionSummary optionId={getPlan(match.id).selectedViewingOptionId} matchDate={match.date} />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}

function SelectedOptionSummary({ optionId, matchDate }: { optionId?: string; matchDate: string }) {
  const option = viewingOptions.find((item) => item.id === optionId);
  if (!option) return null;
  return (
    <div className="selected-option-summary">
      <strong>{option.name}</strong>
      <span>{option.venueName}, {option.city} · {matchDate}</span>
      <div className="viewing-option-actions">
        {option.ticketUrl && <a href={option.ticketUrl} target="_blank" rel="noreferrer">Tickets</a>}
        <a href={option.sourceUrl} target="_blank" rel="noreferrer">Source</a>
      </div>
      {option.notes && <p>{option.notes}</p>}
    </div>
  );
}

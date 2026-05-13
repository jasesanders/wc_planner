import type { Match, ViewingOption, ViewingOptionMatch, ViewingOptionType } from "../types";
import { getLikelyTeamsInMatch } from "./predictions";
import { teamRatings } from "../data/teamRatings";

const typePriority: Record<ViewingOptionType, number> = {
  cosm: 1,
  official_fan_festival: 2,
  official_fan_zone: 3,
  sports_bar: 4,
  city_watch_party: 5,
  concert_or_nightlife: 6,
  other: 7,
};

export const viewingOptionTypeLabels: Record<ViewingOptionType, string> = {
  official_fan_festival: "Official fan festival",
  official_fan_zone: "Official fan zone",
  city_watch_party: "City watch party",
  cosm: "COSM",
  sports_bar: "Sports bar",
  concert_or_nightlife: "Concert / nightlife",
  other: "Other",
};

export function isOptionActiveOnDate(option: ViewingOption, date: string) {
  if (option.dates?.length) return option.dates.includes(date);
  return date >= option.startDate && date <= option.endDate;
}

function matchTeams(match: Match) {
  return new Set([match.homeSlot, match.awaySlot, ...(match.confirmedTeams ?? []), ...getLikelyTeamsInMatch(match, teamRatings).map((team) => team.team)]);
}

function isHighDemand(match: Match, interestScore = 0) {
  const teams = matchTeams(match);
  return interestScore >= 75 || teams.has("USA") || teams.has("Mexico") || ["quarter_final", "semi_final", "final"].includes(match.stage);
}

function optionReason(option: ViewingOption, match: Match) {
  if (option.type === "cosm") return "Check Cosm listing";
  if (option.type === "sports_bar") return "Reservation recommended";
  if (option.type === "city_watch_party") return "TBD / rotating park schedule";
  if (option.type === "official_fan_zone") return "Confirm programming";
  if (option.type === "official_fan_festival") return "Confirm daily programming";
  if (option.type === "concert_or_nightlife") return "Adjacent event, not a confirmed watch party";
  return match.stage === "group" ? "Date match" : "Likely option";
}

export function getViewingOptionsForMatch(match: Match, options: ViewingOption[], interestScore = 0, includeAdjacentEvents = false): ViewingOptionMatch[] {
  const teams = matchTeams(match);
  return options
    .filter((option) => isOptionActiveOnDate(option, match.date))
    .filter((option) => includeAdjacentEvents || option.type !== "concert_or_nightlife")
    .map((option): ViewingOptionMatch | null => {
      const rules = option.matchRules;
      if (!rules) return { option, confidence: "unknown", reason: optionReason(option, match) };

      const exactMatch = Boolean(rules.matchIds?.includes(match.id));
      const stageMatch = Boolean(rules.stages?.includes(match.stage));
      const teamMatch = Boolean(rules.teams?.some((team) => teams.has(team)));
      const highDemandMatch = Boolean(rules.onlyHighDemand && isHighDemand(match, interestScore));
      const allMatches = Boolean(rules.allMatches);

      if (!allMatches && !exactMatch && !stageMatch && !teamMatch && !highDemandMatch) return null;

      const confidence = exactMatch ? "confirmed_match" : allMatches || stageMatch || teamMatch ? "confirmed_date" : highDemandMatch ? "likely" : "unknown";
      return { option, confidence, reason: optionReason(option, match) };
    })
    .filter((matchOption): matchOption is ViewingOptionMatch => Boolean(matchOption))
    .sort((a, b) => {
      const demandA = a.option.type === "cosm" && interestScore >= 75 ? -2 : 0;
      const demandB = b.option.type === "cosm" && interestScore >= 75 ? -2 : 0;
      return typePriority[a.option.type] + demandA - (typePriority[b.option.type] + demandB);
    });
}

export function viewingPlanForOption(option: ViewingOption) {
  if (option.type === "cosm") return "cosm" as const;
  if (option.type === "official_fan_festival" || option.type === "official_fan_zone" || option.type === "city_watch_party") return "fan_zone" as const;
  return "good_tv" as const;
}

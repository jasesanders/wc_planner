import type { MatchStage, ViewingPlan } from "../types";

export const stageLabels: Record<MatchStage, string> = {
  group: "Group",
  round_of_32: "Round of 32",
  round_of_16: "Round of 16",
  quarter_final: "Quarter-final",
  semi_final: "Semi-final",
  third_place: "Third place",
  final: "Final",
};

export const viewingPlanLabels: Record<ViewingPlan, string> = {
  undecided: "Undecided",
  in_person: "In person",
  fan_zone: "Fan zone / fan fest",
  cosm: "COSM",
  good_tv: "Good TV",
  skip: "Skip",
};

export function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}

export function scoreLabel(score: number) {
  if (score >= 90) return "Must consider";
  if (score >= 75) return "Strong watch-party candidate";
  if (score >= 60) return "Good TV / maybe fan zone";
  return "Lower priority";
}

export function isLAMatch(city: string, venue: string) {
  return city.toLowerCase().includes("los angeles") || venue.toLowerCase().includes("sofi");
}

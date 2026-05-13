import type { UserMatchPlan, ViewingPlan } from "../types";

const LA_STAY_START = "2026-06-11";
const LA_STAY_END = "2026-07-11";

export type InterestFilter = "all" | "any_interest" | "tickets_needed" | "cosm" | "fan_zone" | "in_person" | "locked_in";

export const interestFilterLabels: Record<InterestFilter, string> = {
  all: "All matches",
  any_interest: "Anything marked",
  tickets_needed: "Ticket interest",
  cosm: "COSM",
  fan_zone: "Fan zone / fan fest",
  in_person: "In person",
  locked_in: "Locked in",
};

export function hasAnyInterest(plan: UserMatchPlan | undefined) {
  return Boolean(plan && (plan.viewingPlan !== "undecided" || plan.notes || plan.ticketInterest || plan.lockedIn || plan.selectedViewingOptionId));
}

export function matchesInterestFilter(plan: UserMatchPlan | undefined, filter: InterestFilter) {
  if (filter === "all") return true;
  if (filter === "any_interest") return hasAnyInterest(plan);
  if (filter === "tickets_needed") return Boolean(plan?.ticketInterest);
  if (filter === "locked_in") return Boolean(plan?.lockedIn);
  return plan?.viewingPlan === (filter as ViewingPlan);
}

export function isDuringLaStay(date: string) {
  return date >= LA_STAY_START && date <= LA_STAY_END;
}

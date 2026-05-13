import { useEffect, useMemo, useState } from "react";
import type { UserMatchPlan, ViewingPlan } from "../types";

const STORAGE_KEY = "worldCup2026PlannerState";

type PlannerState = {
  plans: Record<string, UserMatchPlan>;
};

const defaultState: PlannerState = { plans: {} };

function emptyPlan(matchId: string): UserMatchPlan {
  return {
    matchId,
    viewingPlan: "undecided",
    selectedViewingOptionId: undefined,
    priority: 3,
    notes: "",
    ticketInterest: false,
    lockedIn: false,
  };
}

function normalizePlan(matchId: string, plan: Partial<UserMatchPlan> | undefined): UserMatchPlan {
  return {
    ...emptyPlan(matchId),
    ...plan,
    matchId,
  };
}

function parseState(raw: string | null): PlannerState {
  if (!raw) return defaultState;
  try {
    const parsed = JSON.parse(raw) as PlannerState;
    return {
      plans: Object.fromEntries(
        Object.entries(parsed.plans ?? {}).map(([matchId, plan]) => [matchId, normalizePlan(matchId, plan)]),
      ),
    };
  } catch {
    return defaultState;
  }
}

export function usePlannerState() {
  const [state, setState] = useState<PlannerState>(() => parseState(localStorage.getItem(STORAGE_KEY)));

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const api = useMemo(() => {
    function getPlan(matchId: string) {
      return normalizePlan(matchId, state.plans[matchId]);
    }

    function updatePlan(matchId: string, updates: Partial<Omit<UserMatchPlan, "matchId">>) {
      setState((current) => {
        const existing = current.plans[matchId] ?? emptyPlan(matchId);
        return {
          plans: {
            ...current.plans,
            [matchId]: { ...existing, ...updates },
          },
        };
      });
    }

    function reset() {
      setState(defaultState);
      localStorage.removeItem(STORAGE_KEY);
    }

    function importState(nextState: PlannerState) {
      setState({
        plans: Object.fromEntries(
          Object.entries(nextState.plans ?? {}).map(([matchId, plan]) => [matchId, normalizePlan(matchId, plan)]),
        ),
      });
    }

    function setViewingPlan(matchId: string, viewingPlan: ViewingPlan) {
      updatePlan(matchId, { viewingPlan });
    }

    return { getPlan, updatePlan, setViewingPlan, reset, importState };
  }, [state.plans]);

  return { plans: state.plans, ...api };
}

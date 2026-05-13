import { matches } from "../data/matches";
import type { Match, PredictedMatchup, TeamProbability, TeamRating } from "../types";
import { isLAMatch } from "./format";

const bigBrandTeams = new Set([
  "USA",
  "Mexico",
  "Argentina",
  "Brazil",
  "England",
  "France",
  "Spain",
  "Germany",
  "Portugal",
  "Netherlands",
  "Italy",
]);

const stageWeight: Record<Match["stage"], number> = {
  group: 0,
  round_of_32: 10,
  round_of_16: 16,
  quarter_final: 23,
  semi_final: 31,
  third_place: 18,
  final: 38,
};

function ratingFor(team: string, ratings: TeamRating[]) {
  return ratings.find((rating) => rating.team.toLowerCase() === team.toLowerCase());
}

function probabilityRows(teams: TeamRating[], weights: number[]) {
  const total = weights.reduce((sum, weight) => sum + weight, 0) || 1;
  return teams.map((team, index) => ({
    team: team.team,
    probability: Math.round((weights[index] / total) * 100),
    rating: team.rating,
    brandScore: team.brandScore,
  }));
}

function normalize(rows: TeamProbability[]) {
  const merged = rows.reduce<Map<string, TeamProbability>>((map, row) => {
    const existing = map.get(row.team);
    map.set(row.team, existing ? { ...existing, probability: existing.probability + row.probability } : row);
    return map;
  }, new Map());
  const mergedRows = [...merged.values()];
  const total = mergedRows.reduce((sum, row) => sum + row.probability, 0) || 1;
  return mergedRows
    .map((row) => ({ ...row, probability: Math.round((row.probability / total) * 100) }))
    .sort((a, b) => b.probability - a.probability || b.rating - a.rating)
    .slice(0, 8);
}

function groupTeams(group: string, ratings: TeamRating[]) {
  const names = new Set(
    matches
      .filter((match) => match.group === group && match.confirmedTeams)
      .flatMap((match) => match.confirmedTeams ?? []),
  );
  return [...names]
    .map((team) => ratingFor(team, ratings))
    .filter((team): team is TeamRating => Boolean(team))
    .sort((a, b) => b.rating - a.rating);
}

function blendGroups(groups: string[], ratings: TeamRating[]) {
  const seen = new Map<string, TeamRating>();
  groups.forEach((group) => groupTeams(group, ratings).forEach((team) => seen.set(team.team, team)));
  return [...seen.values()].sort((a, b) => b.rating - a.rating);
}

function openTournamentField(ratings: TeamRating[]) {
  return ratings
    .slice()
    .sort((a, b) => b.rating * 0.7 + b.brandScore * 0.3 - (a.rating * 0.7 + a.brandScore * 0.3))
    .slice(0, 8)
    .map((team, index) => ({
      team: team.team,
      probability: [18, 16, 14, 13, 12, 10, 9, 8][index],
      rating: team.rating,
      brandScore: team.brandScore,
    }));
}

export function calculateTeamSlotProbabilities(slot: string, ratings: TeamRating[]): TeamProbability[] {
  const cleanSlot = slot.trim();
  const direct = ratingFor(cleanSlot, ratings);
  if (direct) return [{ team: direct.team, probability: 100, rating: direct.rating, brandScore: direct.brandScore }];

  const groupPlacement = cleanSlot.match(/Group ([A-L]) (winner|runner-up)/i);
  if (groupPlacement) {
    const teams = groupTeams(groupPlacement[1].toUpperCase(), ratings);
    const sorted = groupPlacement[2].toLowerCase() === "winner" ? teams : [...teams].slice(1).concat(teams[0]).filter(Boolean);
    return normalize(probabilityRows(sorted, sorted.map((_, index) => Math.max(10, 50 - index * 12))));
  }

  const thirdPlace = cleanSlot.match(/Group ([A-L/]+) third place/i);
  if (thirdPlace) {
    const teams = blendGroups(thirdPlace[1].split("/"), ratings);
    return normalize(probabilityRows(teams, teams.map((team) => Math.max(8, team.rating - 55))));
  }

  const winnerMatch = cleanSlot.match(/Winner Match (\d+)/i);
  if (winnerMatch) {
    const source = matches.find((match) => match.matchNumber === Number(winnerMatch[1]));
    if (!source) return openTournamentField(ratings);
    return getAdvancingTeamsFromMatch(source, ratings).winners;
  }

  const runnerUpMatch = cleanSlot.match(/Runner-up Match (\d+)/i);
  if (runnerUpMatch) {
    const source = matches.find((match) => match.matchNumber === Number(runnerUpMatch[1]));
    if (!source) return openTournamentField(ratings);
    return getAdvancingTeamsFromMatch(source, ratings).runnersUp;
  }

  return ratings
    .slice()
    .sort((a, b) => b.rating + b.brandScore - (a.rating + a.brandScore))
    .slice(0, 5)
    .map((team, index) => ({ team: team.team, probability: [28, 22, 18, 17, 15][index], rating: team.rating, brandScore: team.brandScore }));
}

function pairInterest(home: TeamProbability, away: TeamProbability, match: Match) {
  const strength = (home.rating + away.rating) / 2;
  const brand = (home.brandScore + away.brandScore) / 2;
  const brandBonus = [home.team, away.team].some((team) => bigBrandTeams.has(team)) ? 6 : 0;
  const laBonus = isLAMatch(match.city, match.venue) ? 6 : 0;
  return Math.min(100, Math.round(strength * 0.36 + brand * 0.42 + stageWeight[match.stage] + brandBonus + laBonus - 18));
}

export function calculateMatchupInterest(match: Match, ratings: TeamRating[], userLocation = "Los Angeles") {
  const likely = getLikelyTeamsForMatch(match, ratings);
  const best = likely.topLikelyMatchups[0]?.interestScore ?? 45;
  const localBonus = userLocation.toLowerCase().includes("los angeles") && isLAMatch(match.city, match.venue) ? 4 : 0;
  return Math.min(100, best + localBonus);
}

export function getLikelyTeamsForMatch(match: Match, ratings: TeamRating[]) {
  const home = calculateTeamSlotProbabilities(match.homeSlot, ratings);
  const away = calculateTeamSlotProbabilities(match.awaySlot, ratings);
  const topLikelyMatchups: PredictedMatchup[] = [];

  home.slice(0, 4).forEach((homeTeam) => {
    away.slice(0, 4).forEach((awayTeam) => {
      if (homeTeam.team === awayTeam.team) return;
      topLikelyMatchups.push({
        home: homeTeam.team,
        away: awayTeam.team,
        probability: Math.round((homeTeam.probability / 100) * (awayTeam.probability / 100) * 100),
        interestScore: pairInterest(homeTeam, awayTeam, match),
      });
    });
  });

  return {
    home,
    away,
    topLikelyMatchups: topLikelyMatchups.sort((a, b) => b.probability - a.probability || b.interestScore - a.interestScore).slice(0, 6),
  };
}

function winChance(team: TeamProbability, opponent: TeamProbability) {
  const raw = 0.5 + (team.rating - opponent.rating) / 70;
  return Math.max(0.25, Math.min(0.75, raw));
}

function addProbability(target: Map<string, TeamProbability>, team: TeamProbability, probability: number) {
  const existing = target.get(team.team);
  target.set(team.team, {
    team: team.team,
    probability: (existing?.probability ?? 0) + probability,
    rating: team.rating,
    brandScore: team.brandScore,
  });
}

function getAdvancingTeamsFromMatch(match: Match, ratings: TeamRating[]) {
  const likely = getLikelyTeamsForMatch(match, ratings);
  const winners = new Map<string, TeamProbability>();
  const runnersUp = new Map<string, TeamProbability>();

  likely.home.forEach((homeTeam) => {
    likely.away.forEach((awayTeam) => {
      if (homeTeam.team === awayTeam.team) return;
      const pairProbability = (homeTeam.probability / 100) * (awayTeam.probability / 100) * 100;
      const homeWinChance = winChance(homeTeam, awayTeam);
      const awayWinChance = 1 - homeWinChance;
      addProbability(winners, homeTeam, pairProbability * homeWinChance);
      addProbability(runnersUp, homeTeam, pairProbability * awayWinChance);
      addProbability(winners, awayTeam, pairProbability * awayWinChance);
      addProbability(runnersUp, awayTeam, pairProbability * homeWinChance);
    });
  });

  return {
    winners: normalize([...winners.values()]),
    runnersUp: normalize([...runnersUp.values()]),
  };
}

export function getLikelyTeamsInMatch(match: Match, ratings: TeamRating[]) {
  const likely = getLikelyTeamsForMatch(match, ratings);
  const involved = [...likely.home, ...likely.away].reduce<Map<string, TeamProbability>>((map, team) => {
    const existing = map.get(team.team);
    map.set(team.team, {
      team: team.team,
      probability: Math.min(100, (existing?.probability ?? 0) + team.probability),
      rating: team.rating,
      brandScore: team.brandScore,
    });
    return map;
  }, new Map());

  return [...involved.values()].sort((a, b) => b.probability - a.probability || b.rating - a.rating).slice(0, 8);
}

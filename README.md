# World Cup 2026 Personal Planner

A local-first React + TypeScript app for deciding which FIFA World Cup 2026 matches to attend, watch at LA fan zones, watch at COSM / immersive theater, watch on TV, or skip.

## Run

```bash
npm install
npm run dev
```

Then open the local URL Vite prints.

## Update Schedule Data

Edit `src/data/matches.ts`. The current file is intentionally partial seed data, grounded in FIFA's public schedule page and focused on official LA / SoFi anchors, marquee group fixtures, and knockout structure. The `Match` shape is flat so the full FIFA schedule can be pasted in without changing UI code.

## Update Ratings

Edit `src/data/teamRatings.ts`. Ratings are subjective planning inputs, not betting odds:

- `rating` estimates team strength.
- `brandScore` estimates personal / fan-zone / big-name interest.

## Persistence

Planner state is saved in `localStorage` under `worldCup2026PlannerState`. Use the My Plan screen to export, import, or reset your state.

## Predictions

`src/utils/predictions.ts` uses deterministic heuristics:

- Confirmed team slots return 100%.
- Group winner / runner-up slots rank teams from that group by rating.
- Third-place slots blend the named groups.
- Winner-of-match slots estimate from the upstream match's likely teams.
- Matchup interest combines stage weight, team strength, brand score, LA proximity, and a small global-brand bonus.

These are planning estimates for deciding whether a match deserves tickets, COSM, a fan zone, or good TV. They are intentionally not fake-precise probabilities.

## Update Viewing Options

Edit `src/data/viewingOptions.ts`. Options are matched to matches by active date, type, match rules, teams, stage, and high-demand score. The UI marks date-matched fan zones as “Confirm programming,” Kick It In the Park as “TBD / rotating,” Cosm as “Check Cosm listing,” and sports bars as “Reservation recommended.”

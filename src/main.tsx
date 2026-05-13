import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { CalendarView } from "./components/CalendarView";
import { LAMatchesView } from "./components/LAMatchesView";
import { BigMatchupsView } from "./components/BigMatchupsView";
import { KnockoutPredictorView } from "./components/KnockoutPredictorView";
import { MyPlanView } from "./components/MyPlanView";
import { ViewingOptionsView } from "./components/ViewingOptionsView";
import { usePlannerState } from "./hooks/usePlannerState";
import "./styles.css";

type Tab = "calendar" | "la" | "big" | "options" | "predictor" | "plan";

const tabs: { id: Tab; label: string }[] = [
  { id: "calendar", label: "Calendar" },
  { id: "la", label: "LA Matches" },
  { id: "big", label: "Big Matchups" },
  { id: "options", label: "Viewing Options" },
  { id: "predictor", label: "Knockout Predictor" },
  { id: "plan", label: "My Plan" },
];

function App() {
  const [activeTab, setActiveTab] = useState<Tab>("calendar");
  const planner = usePlannerState();

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Local-first personal planner</p>
          <h1>World Cup 2026 Watch Plan</h1>
        </div>
        <div className="saved-pill">{Object.keys(planner.plans).length} saved edits</div>
      </header>

      <nav className="tabs" aria-label="Planner sections">
        {tabs.map((tab) => (
          <button key={tab.id} type="button" className={activeTab === tab.id ? "active" : ""} onClick={() => setActiveTab(tab.id)}>
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === "calendar" && <CalendarView plans={planner.plans} getPlan={planner.getPlan} onUpdate={planner.updatePlan} />}
      {activeTab === "la" && <LAMatchesView getPlan={planner.getPlan} onUpdate={planner.updatePlan} />}
      {activeTab === "big" && <BigMatchupsView getPlan={planner.getPlan} onUpdate={planner.updatePlan} />}
      {activeTab === "options" && <ViewingOptionsView />}
      {activeTab === "predictor" && <KnockoutPredictorView />}
      {activeTab === "plan" && (
        <MyPlanView
          plans={planner.plans}
          getPlan={planner.getPlan}
          onUpdate={planner.updatePlan}
          onImport={planner.importState}
          onReset={planner.reset}
        />
      )}
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

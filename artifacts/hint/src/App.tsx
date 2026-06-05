import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppShell } from "./AppShell";
import { OnboardingGate } from "./components/app/OnboardingGate";
import { LanguageProvider } from "./lib/i18n";
import { HomeDashboard } from "./modules/home";
import { TarotRoom } from "./modules/tarot";
import { AskHint } from "./modules/ask";
import { RoomsLibrary } from "./modules/rooms";
import { ReadingsView } from "./modules/readings";
import { MeView } from "./modules/me";
import { ContactView, PrivacyPolicyView, TermsView } from "./modules/legal";
import {
  AstrologyView,
  CompatibilityView,
  DreamView,
  JournalView,
  DailyPullView,
} from "./modules/features";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomeDashboard} />
      <Route path="/tarot" component={TarotRoom} />
      <Route path="/ask" component={AskHint} />
      <Route path="/rooms" component={RoomsLibrary} />
      <Route path="/readings" component={ReadingsView} />
      <Route path="/me" component={MeView} />
      <Route path="/astrology" component={AstrologyView} />
      <Route path="/compatibility" component={CompatibilityView} />
      <Route path="/dream" component={DreamView} />
      <Route path="/journal" component={JournalView} />
      <Route path="/daily-pull" component={DailyPullView} />
      <Route path="*">
        <div className="min-h-full flex items-center justify-center font-serif text-white/20 text-sm">
          -
        </div>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AppShell>
            <Switch>
              <Route path="/privacy" component={PrivacyPolicyView} />
              <Route path="/terms" component={TermsView} />
              <Route path="/contact" component={ContactView} />
              <Route path="*">
                <OnboardingGate>
                  <Router />
                </OnboardingGate>
              </Route>
            </Switch>
          </AppShell>
        </WouterRouter>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;

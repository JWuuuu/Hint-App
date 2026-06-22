import { Route, Switch } from "wouter";
import { HomeDashboard } from "../modules/home";
import { AskHint } from "../modules/ask";
import { LoginView } from "../modules/auth";
import { RoomsLibrary } from "../modules/rooms";
import { ReadingDetailView, ReadingsView } from "../modules/readings";
import { MeView } from "../modules/me";
import { AnimalTarotView } from "../modules/animal-tarot";
import { CardCollectionView } from "../modules/collection";
import {
  AstrologyView,
  CompatibilityView,
  DailyPullView,
  DreamView,
  JournalView,
} from "../modules/features";
import { TarotRoom } from "../modules/tarot";
import { RedirectTo } from "../shared/navigation/RedirectTo";

function currentSuffix() {
  if (typeof window === "undefined") return "";
  return `${window.location.search}${window.location.hash}`;
}

function legacyTarget(appPath: string) {
  return `${appPath}${currentSuffix()}`;
}

function LegacyRedirect({ to }: { to: string }) {
  return <RedirectTo to={legacyTarget(to)} />;
}

function LegacyTarotRedirect() {
  return <LegacyRedirect to="/app/tarot" />;
}

function LegacyAnimalTarotRedirect() {
  return <LegacyRedirect to="/app/animal-tarot" />;
}

export function ProductRouter() {
  return (
    <Switch>
      <Route path="/app" component={HomeDashboard} />
      <Route path="/app/daily" component={DailyPullView} />
      <Route path="/app/daily-pull">
        <RedirectTo to="/app/daily" />
      </Route>
      <Route path="/app/tarot" component={TarotRoom} />
      <Route path="/app/tarot/:rest*" component={TarotRoom} />
      <Route path="/app/animal-tarot" component={AnimalTarotView} />
      <Route path="/app/animal-tarot/:rest*" component={AnimalTarotView} />
      <Route path="/app/sky-deck">
        <RedirectTo to="/app/daily" />
      </Route>
      <Route path="/app/sky-deck/:rest*">
        <RedirectTo to="/app/daily" />
      </Route>
      <Route path="/app/astrology" component={AstrologyView} />
      <Route path="/app/collection" component={CardCollectionView} />
      <Route path="/app/profile" component={MeView} />
      <Route path="/app/me">
        <RedirectTo to="/app/profile" />
      </Route>
      <Route path="/app/settings">
        <RedirectTo to="/app/profile" />
      </Route>
      <Route path="/app/ask" component={AskHint} />
      <Route path="/app/rooms" component={RoomsLibrary} />
      <Route path="/app/readings/:id" component={ReadingDetailView} />
      <Route path="/app/readings" component={ReadingsView} />
      <Route path="/app/login" component={LoginView} />
      <Route path="/app/compatibility/invite/:token" component={CompatibilityView} />
      <Route path="/app/compatibility/:id" component={CompatibilityView} />
      <Route path="/app/compatibility" component={CompatibilityView} />
      <Route path="/app/dream" component={DreamView} />
      <Route path="/app/journal" component={JournalView} />
      <Route path="/daily">
        <LegacyRedirect to="/app/daily" />
      </Route>
      <Route path="/daily-pull">
        <LegacyRedirect to="/app/daily" />
      </Route>
      <Route path="/tarot" component={LegacyTarotRedirect} />
      <Route path="/tarot/:rest*" component={LegacyTarotRedirect} />
      <Route path="/animal-tarot" component={LegacyAnimalTarotRedirect} />
      <Route path="/animal-tarot/:rest*" component={LegacyAnimalTarotRedirect} />
      <Route path="/sky-deck">
        <LegacyRedirect to="/app/daily" />
      </Route>
      <Route path="/sky-deck/:rest*">
        <LegacyRedirect to="/app/daily" />
      </Route>
      <Route path="/astrology">
        <LegacyRedirect to="/app/astrology" />
      </Route>
      <Route path="/collection">
        <LegacyRedirect to="/app/collection" />
      </Route>
      <Route path="/profile">
        <LegacyRedirect to="/app/profile" />
      </Route>
      <Route path="/me">
        <LegacyRedirect to="/app/profile" />
      </Route>
      <Route path="/settings">
        <LegacyRedirect to="/app/profile" />
      </Route>
      <Route path="/ask">
        <LegacyRedirect to="/app/ask" />
      </Route>
      <Route path="/rooms">
        <LegacyRedirect to="/app/rooms" />
      </Route>
      <Route path="/readings/:id">
        {(params) => <RedirectTo to={`/app/readings/${params.id}${currentSuffix()}`} />}
      </Route>
      <Route path="/readings">
        <LegacyRedirect to="/app/readings" />
      </Route>
      <Route path="/login">
        <LegacyRedirect to="/app/login" />
      </Route>
      <Route path="/compatibility/invite/:token">
        {(params) => <RedirectTo to={`/app/compatibility/invite/${params.token}${currentSuffix()}`} />}
      </Route>
      <Route path="/compatibility/:id">
        {(params) => <RedirectTo to={`/app/compatibility/${params.id}${currentSuffix()}`} />}
      </Route>
      <Route path="/compatibility">
        <LegacyRedirect to="/app/compatibility" />
      </Route>
      <Route path="/dream">
        <LegacyRedirect to="/app/dream" />
      </Route>
      <Route path="/journal">
        <LegacyRedirect to="/app/journal" />
      </Route>
      <Route path="*">
        <div className="min-h-full flex items-center justify-center font-serif text-white/20 text-sm">
          -
        </div>
      </Route>
    </Switch>
  );
}

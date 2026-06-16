import { Route, Switch } from "wouter";
import { HomeDashboard } from "../modules/home";
import { AskHint } from "../modules/ask";
import { LoginView } from "../modules/auth";
import { RoomsLibrary } from "../modules/rooms";
import { ReadingDetailView, ReadingsView } from "../modules/readings";
import { MeView } from "../modules/me";
import {
  AstrologyView,
  CompatibilityView,
  DailyPullView,
  DreamView,
  JournalView,
} from "../modules/features";
import { RedirectTo } from "../shared/navigation/RedirectTo";
import { AnimalTarotView } from "./animal/AnimalTarotView";
import { CardCollectionView } from "./collection/CardCollectionView";
import { SettingsView } from "./settings/SettingsView";
import { SkyDeckView } from "./skydeck/SkyDeckView";
import { TarotRoomApp } from "./tarot/TarotRoomApp";

function legacyTarotTarget() {
  if (typeof window === "undefined") return "/app/tarot";
  return `/app/tarot${window.location.search}${window.location.hash}`;
}

function LegacyTarotRedirect() {
  return <RedirectTo to={legacyTarotTarget()} />;
}

export function ProductRouter() {
  return (
    <Switch>
      <Route path="/" component={HomeDashboard} />
      <Route path="/daily" component={DailyPullView} />
      <Route path="/daily-pull">
        <RedirectTo to="/daily" />
      </Route>
      <Route path="/app/tarot" component={TarotRoomApp} />
      <Route path="/app/tarot/:rest*" component={TarotRoomApp} />
      <Route path="/tarot" component={LegacyTarotRedirect} />
      <Route path="/tarot/:rest*" component={LegacyTarotRedirect} />
      <Route path="/animal-tarot" component={AnimalTarotView} />
      <Route path="/sky-deck" component={SkyDeckView} />
      <Route path="/astrology" component={AstrologyView} />
      <Route path="/collection" component={CardCollectionView} />
      <Route path="/profile" component={MeView} />
      <Route path="/me">
        <RedirectTo to="/profile" />
      </Route>
      <Route path="/settings" component={SettingsView} />
      <Route path="/ask" component={AskHint} />
      <Route path="/rooms" component={RoomsLibrary} />
      <Route path="/readings/:id" component={ReadingDetailView} />
      <Route path="/readings" component={ReadingsView} />
      <Route path="/login" component={LoginView} />
      <Route path="/compatibility/invite/:token" component={CompatibilityView} />
      <Route path="/compatibility/:id" component={CompatibilityView} />
      <Route path="/compatibility" component={CompatibilityView} />
      <Route path="/dream" component={DreamView} />
      <Route path="/journal" component={JournalView} />
      <Route path="*">
        <div className="min-h-full flex items-center justify-center font-serif text-white/20 text-sm">
          -
        </div>
      </Route>
    </Switch>
  );
}

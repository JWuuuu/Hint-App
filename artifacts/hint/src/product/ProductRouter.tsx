import { Route, Switch } from "wouter";
import { HomeDashboard } from "../modules/home";
import { TarotRoom } from "../modules/tarot";
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

export function ProductRouter() {
  return (
    <Switch>
      <Route path="/app" component={HomeDashboard} />
      <Route path="/app/daily" component={DailyPullView} />
      <Route path="/app/daily-pull">
        <RedirectTo to="/app/daily" />
      </Route>
      <Route path="/app/tarot" component={TarotRoom} />
      <Route path="/app/animal-tarot" component={AnimalTarotView} />
      <Route path="/app/sky-deck" component={SkyDeckView} />
      <Route path="/app/astrology" component={AstrologyView} />
      <Route path="/app/collection" component={CardCollectionView} />
      <Route path="/app/profile" component={MeView} />
      <Route path="/app/me">
        <RedirectTo to="/app/profile" />
      </Route>
      <Route path="/app/settings" component={SettingsView} />
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
      <Route path="/app/*">
        <div className="min-h-full flex items-center justify-center font-serif text-white/20 text-sm">
          -
        </div>
      </Route>
    </Switch>
  );
}

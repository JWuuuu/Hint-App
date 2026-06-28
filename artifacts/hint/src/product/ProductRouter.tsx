import { useLocation } from "wouter";
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
  PersonalitiesView,
} from "../modules/features";
import { TarotRoom } from "../modules/tarot";
import { RedirectTo } from "../shared/navigation/RedirectTo";

function currentProductPath(location: string) {
  const pathname = location.split(/[?#]/, 1)[0]?.replace(/\/+$/, "") || "/";
  const productPath = pathname.startsWith("/app") ? pathname.slice("/app".length) || "/" : pathname;
  return productPath || "/";
}

export function ProductRouter() {
  const [location] = useLocation();
  const path = currentProductPath(location);

  if (path === "/") return <HomeDashboard />;
  if (path === "/daily") return <DailyPullView />;
  if (path === "/daily-pull" || path === "/sky-deck" || path.startsWith("/sky-deck/")) return <RedirectTo to="/app/daily" />;
  if (path === "/tarot" || path.startsWith("/tarot/")) return <TarotRoom />;
  if (path === "/animal-tarot" || path.startsWith("/animal-tarot/")) return <AnimalTarotView />;
  if (path === "/astrology") return <AstrologyView />;
  if (path === "/collection") return <CardCollectionView />;
  if (path === "/profile") return <MeView />;
  if (path === "/me" || path === "/settings") return <RedirectTo to="/app/profile" />;
  if (path === "/ask") return <AskHint />;
  if (path === "/rooms") return <RoomsLibrary />;
  if (path.startsWith("/readings/")) return <ReadingDetailView />;
  if (path === "/readings") return <ReadingsView />;
  if (path === "/login" || path === "/signup") return <LoginView />;
  if (path === "/compatibility" || path.startsWith("/compatibility/")) return <CompatibilityView />;
  if (path === "/dream") return <DreamView />;
  if (path === "/journal") return <JournalView />;
  if (path === "/personalities") return <PersonalitiesView />;

  return (
    <div className="min-h-full flex items-center justify-center font-serif text-white/20 text-sm">
      -
    </div>
  );
}

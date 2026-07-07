import { Link, useLocation } from "wouter";
import { AppScreen, GlassPanel } from "../components/app/AppChrome";
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
    <AppScreen>
      <div className="flex min-h-[70vh] items-center">
        <GlassPanel hero className="w-full text-center">
          <p className="font-sans text-[10px] font-black uppercase tracking-[0.22em] text-[var(--hint-rose)]">
            Room not found
          </p>
          <h1 className="mt-3 font-serif text-[30px] leading-tight text-[var(--hint-text)]">
            This door is not open yet.
          </h1>
          <p className="mx-auto mt-3 max-w-[18rem] font-sans text-[13px] leading-relaxed text-[var(--hint-muted)]">
            Return to Today and choose one of the available Hint spaces.
          </p>
          <Link
            href="/app"
            className="hint-tap-sparkle mt-5 inline-flex h-11 items-center justify-center rounded-full px-5 font-sans text-[13px] font-black"
            style={{
              color: "var(--hint-special-action-text)",
              background: "var(--hint-special-action-bg)",
              boxShadow: "0 14px 28px color-mix(in srgb, var(--hint-rose) 16%, transparent)",
            }}
          >
            Back to Today
          </Link>
        </GlassPanel>
      </div>
    </AppScreen>
  );
}

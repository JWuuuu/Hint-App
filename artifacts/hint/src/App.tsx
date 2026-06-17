import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppShell } from "./AppShell";
import { OnboardingGate } from "./components/app/OnboardingGate";
import { LanguageProvider } from "./lib/i18n";
import { AboutView, ContactView, DisclaimerView, PrivacyPolicyView, TermsView } from "./modules/legal";
import { ProductRouter } from "./product/ProductRouter";
import { RedirectTo } from "./shared/navigation/RedirectTo";

const queryClient = new QueryClient();

const PRODUCT_ROUTES = [
  "/tarot",
  "/ask",
  "/rooms",
  "/readings",
  "/login",
  "/me",
  "/astrology",
  "/compatibility",
  "/dream",
  "/journal",
  "/daily-pull",
  "/daily",
  "/animal-tarot",
  "/sky-deck",
  "/collection",
  "/profile",
  "/settings",
];

function currentPathWithSuffix() {
  if (typeof window === "undefined") return "/";
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

function toAppPath(path: string) {
  if (path === "/" || path.startsWith("/?") || path.startsWith("/#")) return `/app${path.slice(1)}`;
  if (path === "/daily-pull" || path.startsWith("/daily-pull?") || path.startsWith("/daily-pull#")) {
    return `/app/daily${path.slice("/daily-pull".length)}`;
  }
  if (path === "/me" || path.startsWith("/me?") || path.startsWith("/me#")) {
    return `/app/profile${path.slice("/me".length)}`;
  }
  return path.startsWith("/app") ? path : `/app${path}`;
}

function RootRedirect() {
  return <RedirectTo to={toAppPath(currentPathWithSuffix())} />;
}

function LegacyProductRedirect() {
  return <RedirectTo to={toAppPath(currentPathWithSuffix())} />;
}

function ProductRouteBoundary() {
  return (
    <OnboardingGate>
      <ProductRouter />
    </OnboardingGate>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AppShell>
            <Switch>
              <Route path="/" component={RootRedirect} />
              <Route path="/app" component={ProductRouteBoundary} />
              <Route path="/app/:rest*" component={ProductRouteBoundary} />
              <Route path="/privacy" component={PrivacyPolicyView} />
              <Route path="/terms" component={TermsView} />
              <Route path="/disclaimer" component={DisclaimerView} />
              <Route path="/contact" component={ContactView} />
              <Route path="/about" component={AboutView} />
              {PRODUCT_ROUTES.map((route) => (
                <Route key={route} path={route} component={LegacyProductRedirect} />
              ))}
              {PRODUCT_ROUTES.map((route) => (
                <Route key={`${route}/*`} path={`${route}/:rest*`} component={LegacyProductRedirect} />
              ))}
              <Route path="*">
                <RedirectTo to="/app" />
              </Route>
            </Switch>
          </AppShell>
        </WouterRouter>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;

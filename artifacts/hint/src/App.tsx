import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppShell } from "./AppShell";
import { OnboardingGate } from "./components/app/OnboardingGate";
import { LanguageProvider } from "./lib/i18n";
import { AboutView, ContactView, DisclaimerView, PrivacyPolicyView, TermsView } from "./modules/legal";
import { ProductRouter } from "./product/ProductRouter";
import { LandingPage } from "./site/LandingPage";
import { RedirectTo } from "./shared/navigation/RedirectTo";
import { toAppPath } from "./shared/navigation/appPaths";

const queryClient = new QueryClient();

const LEGACY_PRODUCT_ROUTES = [
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
  "/settings",
];

function LegacyProductRedirect() {
  const nextPath =
    typeof window === "undefined"
      ? "/app"
      : toAppPath(`${window.location.pathname}${window.location.search}${window.location.hash}`);

  return <RedirectTo to={nextPath} />;
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
              <Route path="/" component={LandingPage} />
              <Route path="/app" component={ProductRouteBoundary} />
              <Route path="/app/:rest*" component={ProductRouteBoundary} />
              <Route path="/privacy" component={PrivacyPolicyView} />
              <Route path="/terms" component={TermsView} />
              <Route path="/disclaimer" component={DisclaimerView} />
              <Route path="/contact" component={ContactView} />
              <Route path="/about" component={AboutView} />
              {LEGACY_PRODUCT_ROUTES.map((route) => (
                <Route key={route} path={route} component={LegacyProductRedirect} />
              ))}
              {LEGACY_PRODUCT_ROUTES.map((route) => (
                <Route key={`${route}/*`} path={`${route}/:rest*`} component={LegacyProductRedirect} />
              ))}
              <Route path="*">
                <RedirectTo to="/" />
              </Route>
            </Switch>
          </AppShell>
        </WouterRouter>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;

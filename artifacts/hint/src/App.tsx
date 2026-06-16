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
  "/settings",
];

function stripAppPrefix(path: string): string {
  if (path === "/app") return "/";
  if (path.startsWith("/app?") || path.startsWith("/app#")) return `/${path.slice(4)}`;
  if (path.startsWith("/app/")) return path.slice(4) || "/";
  return path;
}

function AppAliasRedirect() {
  const nextPath =
    typeof window === "undefined"
      ? "/"
      : stripAppPrefix(`${window.location.pathname}${window.location.search}${window.location.hash}`);

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
              <Route path="/" component={ProductRouteBoundary} />
              <Route path="/app/tarot" component={ProductRouteBoundary} />
              <Route path="/app/tarot/:rest*" component={ProductRouteBoundary} />
              <Route path="/app" component={AppAliasRedirect} />
              <Route path="/app/:rest*" component={AppAliasRedirect} />
              <Route path="/privacy" component={PrivacyPolicyView} />
              <Route path="/terms" component={TermsView} />
              <Route path="/disclaimer" component={DisclaimerView} />
              <Route path="/contact" component={ContactView} />
              <Route path="/about" component={AboutView} />
              {PRODUCT_ROUTES.map((route) => (
                <Route key={route} path={route} component={ProductRouteBoundary} />
              ))}
              {PRODUCT_ROUTES.map((route) => (
                <Route key={`${route}/*`} path={`${route}/:rest*`} component={ProductRouteBoundary} />
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

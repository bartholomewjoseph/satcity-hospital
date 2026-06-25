import React from "react";
import { StoreProvider } from "./lib/store";
import { AuthProvider, useAuth } from "./lib/auth";
import { ToastProvider } from "./components/Toast";
import Landing from "./pages/Landing";
import Features from "./pages/Features";
import Roles from "./pages/Roles";
import Login, { Register } from "./pages/Auth";
import Emergency from "./pages/Emergency";
import DashboardRouter from "./pages/Dashboards";

type Route = "landing" | "login-patient" | "login-staff" | "register-patient" | "register-staff" | "emergency" | "sanity" | "features" | "roles" | "dashboard";

function Shell() {
  const { user } = useAuth();
  const [route, setRoute] = React.useState<Route>(() => {
    const hash = window.location.hash.replace(/^#\/?/, "");
    if (hash === "emergency") return "emergency";
    if (hash === "sanity") return "sanity";
    if (hash === "login-patient") return "login-patient";
    if (hash === "login-staff") return "login-staff";
    if (hash === "register-patient") return "register-patient";
    if (hash === "register-staff") return "register-staff";
    if (hash === "features") return "features";
    if (hash === "roles") return "roles";
    if (hash === "login") return "login-patient";
    if (hash === "register") return "register-patient";
    return "landing";
  });

  React.useEffect(() => {
    if (user) setRoute("dashboard");
    else if (route === "dashboard") setRoute("login-patient");
  }, [user]);

  React.useEffect(() => {
    const onHash = () => {
      const h = window.location.hash.replace(/^#\/?/, "");
      if (h === "emergency") setRoute("emergency");
      else if (h === "sanity") setRoute("sanity");
      else if (h === "login-patient") setRoute("login-patient");
      else if (h === "login-staff") setRoute("login-staff");
      else if (h === "register-patient") setRoute("register-patient");
      else if (h === "register-staff") setRoute("register-staff");
      else if (h === "features") setRoute("features");
      else if (h === "roles") setRoute("roles");
      else if (h) window.location.hash = "";
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const navigate = (r: string) => setRoute(r as Route);

  if (route === "emergency") return <Emergency onNavigate={navigate} />;
  if (route === "sanity") return <SanityStandalone onNavigate={navigate} />;
  if (route === "features") return <Features onNavigate={navigate} />;
  if (route === "roles") return <Roles onNavigate={navigate} />;
  if (user) return <DashboardRouter />;
  if (route === "login-patient") return <Login kind="patient" onNavigate={navigate} />;
  if (route === "login-staff") return <Login kind="staff" onNavigate={navigate} />;
  if (route === "register-patient") return <Register kind="patient" onNavigate={navigate} />;
  if (route === "register-staff") return <Register kind="staff" onNavigate={navigate} />;
  return <Landing onNavigate={navigate} />;
}

function SanityStandalone({ onNavigate }: { onNavigate: (r: string) => void }) {
  const SanityCMS = React.lazy(() => import("./pages/SanityCMS").then((m) => ({ default: m.default })));
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <button onClick={() => onNavigate("landing")} className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 text-white shadow-md">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2 2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight text-slate-900">Sanity Studio · SatCity Hospital</div>
              <div className="-mt-0.5 text-[11px] uppercase tracking-widest text-slate-500">Content Lake · preview</div>
            </div>
          </button>
          <div className="flex items-center gap-2">
            <button onClick={() => onNavigate("landing")} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">Landing</button>
            <button onClick={() => onNavigate("login-staff")} className="rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-800">Staff sign-in</button>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-6 py-8">
        <React.Suspense fallback={<div className="space-y-3"><div className="h-10 w-64 animate-pulse rounded-xl bg-slate-200" /><div className="h-40 w-full animate-pulse rounded-2xl bg-slate-200" /></div>}>
          <SanityCMS />
        </React.Suspense>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <AuthProvider>
        <ToastProvider>
          <Shell />
        </ToastProvider>
      </AuthProvider>
    </StoreProvider>
  );
}

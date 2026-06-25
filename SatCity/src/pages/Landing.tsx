import { Button, Card, CardContent } from "../components/ui";
import Navbar from "../components/Navbar";

export default function Landing({ onNavigate }: { onNavigate: (route: string) => void }) {

  return (
    <div className="relative min-h-screen bg-white">
      {/* Spotlight hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-white">
        <div className="bg-grid absolute inset-0 opacity-60" />
        <div className="spotlight" style={{ ["--x" as any]: "50%", ["--y" as any]: "20%" }} />

        <Navbar onNavigate={onNavigate} />

        <div className="relative z-10 mx-auto max-w-6xl px-6 pb-24 pt-12">
          <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2">
            <div className="text-center md:text-left">
              <h1 className="reveal-up mx-auto max-w-4xl text-5xl font-bold tracking-tight text-slate-900 md:text-6xl">
                A clinical-grade <span className="bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">hospital operating system</span>
              </h1>
              <p className="reveal-up mt-5 max-w-2xl text-lg text-slate-600" style={{ animationDelay: ".1s" }}>
                Role-scoped dashboards, real-time notifications, smart patient assignment, and a public emergency hotline — all on one unified platform.
              </p>
              <div className="reveal-up mt-8 flex flex-wrap items-center gap-3" style={{ animationDelay: ".2s" }}>
                <Button size="lg" onClick={() => onNavigate("login-patient")}>Patient portal</Button>
                <Button variant="outline" size="lg" onClick={() => onNavigate("login-staff")}>Staff dashboard</Button>
                <Button variant="outline" size="lg" onClick={() => onNavigate("emergency")}>
                  <span className="inline-block h-2 w-2 rounded-full bg-red-500 banner-pulse" /> Call Emergency Ambulance
                </Button>
                <Button variant="outline" size="lg" onClick={() => onNavigate("roles")}>Roles</Button>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <img src="/img/homepage.jpg" alt="SatCity overview" className="w-full max-w-md rounded-2xl shadow-lg" />
            </div>
          </div>

        </div>
      </section>

      {/* Features moved to standalone page */}

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <Card className="relative overflow-hidden">
          <div className="bg-dots absolute inset-0 opacity-60" />
          <CardContent className="relative flex flex-wrap items-center justify-between gap-6 p-10">
            <div>
              <h3 className="text-2xl font-bold text-slate-900">Ready to see it in action?</h3>
              <p className="mt-1 text-slate-500">Use any demo email from the sign-in page to explore a role-specific dashboard.</p>
            </div>
            <div className="flex gap-2">
              <Button size="lg" onClick={() => onNavigate("login-patient")}>Patient sign in</Button>
              <Button variant="outline" size="lg" onClick={() => onNavigate("login-staff")}>Staff sign in</Button>
              <Button variant="outline" size="lg" onClick={() => onNavigate("emergency")}>Emergency</Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <footer className="border-t border-slate-200 py-8 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} SatCity Hospital — Management Platform Demo.
      </footer>
    </div>
  );
}

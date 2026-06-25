import React from "react";
import { Button, Input, Textarea, Card, CardContent, Alert, Badge } from "../components/ui";
import { useStore } from "../lib/store";
import { useToast } from "../components/Toast";

export default function Emergency({ onNavigate }: { onNavigate: (route: string) => void }) {
  const { emergencies, setEmergencies } = useStore();
  const { toast } = useToast();
  const [name, setName] = React.useState("");
  const [location, setLocation] = React.useState("");
  const [desc, setDesc] = React.useState("");
  const [submitted, setSubmitted] = React.useState<null | { id: string }>(null);
  const [mouse, setMouse] = React.useState({ x: 50, y: 30 });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!location || !desc) return;
    const id = "e" + Math.random().toString(36).slice(2, 8);
    setEmergencies((prev) => [
      { id, caller_name: name || "Anonymous caller", location, description: desc, created_at: new Date().toISOString(), is_resolved: false },
      ...prev,
    ]);
    setSubmitted({ id });
    toast({ title: "Emergency request dispatched", description: "All active admin sessions notified.", variant: "danger" });
  };

  return (
    <div
      className="relative min-h-screen overflow-hidden bg-slate-950 text-white"
      onMouseMove={(e) => {
        const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
        setMouse({ x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100 });
      }}
    >
      <div className="bg-grid absolute inset-0 opacity-20" />
      <div
        className="spotlight"
        style={{ ["--x" as any]: `${mouse.x}%`, ["--y" as any]: `${mouse.y}%`, background: "radial-gradient(600px circle at var(--x,50%) var(--y,30%), rgba(220,38,38,0.25), transparent 45%)" }}
      />

      <nav className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <button onClick={() => onNavigate("landing")} className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600 shadow-lg shadow-red-900/50">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight">SatCity Hospital</div>
            <div className="-mt-0.5 text-[11px] uppercase tracking-widest text-red-300">Emergency Response</div>
          </div>
        </button>
        <div className="flex items-center gap-2">
          <Badge variant="danger" className="bg-red-500/20 text-red-200 border-red-500/40">LIVE · 24/7</Badge>
          <button onClick={() => onNavigate("login")} className="rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/10">Staff sign-in</button>
        </div>
      </nav>

      {/* Moving border banner */}
      <div className="relative z-10 mx-auto max-w-6xl px-6">
        <div className="relative overflow-hidden rounded-2xl p-[2px]">
          <div className="moving-border absolute inset-0" />
          <div className="relative rounded-[14px] bg-slate-950/90 px-6 py-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-red-500 banner-pulse" />
              <div className="text-sm font-semibold text-red-300">EMERGENCY RESPONSE ACTIVE</div>
              <div className="text-xs text-slate-400">· Dispatches an ambulance request to all on-duty admins in real time.</div>
            </div>
          </div>
        </div>
      </div>

      <main className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 gap-8 px-6 py-14 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Badge variant="danger" className="bg-red-500/20 text-red-200 border-red-500/40">Public Emergency Hotline</Badge>
          <h1 className="reveal-up mt-4 text-5xl font-bold leading-tight tracking-tight md:text-6xl">
            Call an <span className="bg-gradient-to-r from-red-400 to-orange-300 bg-clip-text text-transparent">Emergency Ambulance</span>
          </h1>
          <p className="reveal-up mt-4 max-w-xl text-lg text-slate-300" style={{ animationDelay: ".1s" }}>
            No sign-in required. Fill in the details on the right and our response team will be dispatched immediately.
          </p>

          {/* Magnetic CTA */}
          <div className="reveal-up mt-8" style={{ animationDelay: ".2s" }}>
            <MagneticButton onClick={() => document.getElementById("emergency-form")?.scrollIntoView({ behavior: "smooth" })}>
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-white banner-pulse" />
              Call Emergency Ambulance Now
            </MagneticButton>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { k: "Avg. response", v: "< 6 min" },
              { k: "Coverage", v: "SatCity metro" },
              { k: "Operators", v: "24/7 online" },
            ].map((s) => (
              <Card key={s.k} className="bg-white/5 border-white/10 backdrop-blur">
                <CardContent className="p-4">
                  <div className="text-xs uppercase tracking-widest text-slate-400">{s.k}</div>
                  <div className="mt-1 text-lg font-bold text-white">{s.v}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Form */}
        <div id="emergency-form" className="lg:col-span-2">
          <Card className="border-white/10 bg-white/5 backdrop-blur">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="text-lg font-semibold text-white">Submit emergency request</div>
                  <div className="text-xs text-slate-400">Triggers real-time admin broadcast.</div>
                </div>
                <Badge variant="danger" className="bg-red-500/20 text-red-200 border-red-500/40">Realtime</Badge>
              </div>
              {submitted ? (
                <div className="space-y-3">
                  <Alert variant="success">Emergency request #{submitted.id} received. Admins have been notified in real time.</Alert>
                  <Button variant="outline" className="w-full border-white/20 bg-white/5 text-white hover:bg-white/10" onClick={() => { setSubmitted(null); setName(""); setLocation(""); setDesc(""); }}>
                    Submit another request
                  </Button>
                </div>
              ) : (
                <form onSubmit={submit} className="space-y-3">
                  <Input label="Caller name (optional)" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="!bg-white/5 !text-white !border-white/15 placeholder:!text-slate-500" />
                  <Input label="Location / address" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="123 Main St, SatCity" className="!bg-white/5 !text-white !border-white/15 placeholder:!text-slate-500" />
                  <Textarea label="Incident description" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Briefly describe the emergency..." className="!bg-white/5 !text-white !border-white/15 placeholder:!text-slate-500" />
                  <Button type="submit" variant="danger" size="lg" className="w-full">
                    <span className="inline-flex h-2 w-2 rounded-full bg-white banner-pulse" /> Dispatch Emergency
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-slate-400">
            Recent emergency requests (public view):
            <div className="mt-2 space-y-1.5">
              {emergencies.slice(0, 3).map((e) => (
                <div key={e.id} className="flex items-start justify-between gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                  <div>
                    <div className="text-sm text-white">{e.location}</div>
                    <div className="text-[11px] text-slate-400">{new Date(e.created_at).toLocaleString()}</div>
                  </div>
                  <Badge variant={e.is_resolved ? "success" : "warning"} className={e.is_resolved ? "" : "bg-amber-500/20 text-amber-200 border-amber-500/40"}>
                    {e.is_resolved ? "Handled" : "Active"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-10 border-t border-white/10 py-6 text-center text-xs text-slate-500">
        In a life-threatening situation, always call your local emergency number first. © SatCity Hospital.
      </footer>
    </div>
  );
}

function MagneticButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  const ref = React.useRef<HTMLButtonElement>(null);
  const [pos, setPos] = React.useState({ x: 0, y: 0 });
  return (
    <button
      ref={ref}
      onClick={onClick}
      onMouseMove={(e) => {
        const rect = ref.current!.getBoundingClientRect();
        setPos({ x: (e.clientX - rect.left - rect.width / 2) * 0.2, y: (e.clientY - rect.top - rect.height / 2) * 0.2 });
      }}
      onMouseLeave={() => setPos({ x: 0, y: 0 })}
      style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
      className="group relative inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-red-600 to-orange-500 px-8 py-4 text-base font-semibold text-white shadow-2xl shadow-red-900/50 transition-transform hover:scale-[1.02] pulse-glow"
    >
      {children}
    </button>
  );
}

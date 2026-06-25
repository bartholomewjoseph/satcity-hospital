import React from "react";
import { Button, Input, Select, Card, CardContent, Alert, Badge } from "../components/ui";
import { useAuth } from "../lib/auth";
import { useToast } from "../components/Toast";
import type { Role } from "../lib/store";

type Kind = "patient" | "staff";

export default function Login({ kind = "patient", onNavigate }: { kind?: Kind; onNavigate: (route: string) => void }) {
  const { login } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = React.useState(kind === "patient" ? "patient@satcity.hosp" : "doctor@satcity.hosp");
  const [error, setError] = React.useState("");

  const staffAccounts = [
    { label: "Super Admin", email: "super@satcity.hosp", accent: "bg-violet-50 text-violet-700 border-violet-200" },
    { label: "Admin", email: "admin@satcity.hosp", accent: "bg-blue-50 text-blue-700 border-blue-200" },
    { label: "Doctor", email: "doctor@satcity.hosp", accent: "bg-teal-50 text-teal-700 border-teal-200" },
    { label: "Lab Tech", email: "lab@satcity.hosp", accent: "bg-amber-50 text-amber-700 border-amber-200" },
    { label: "Pharmacist", email: "pharmacy@satcity.hosp", accent: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  ];
  const patientAccounts = [
    { label: "John Doe · Cardiology", email: "patient@satcity.hosp", accent: "bg-rose-50 text-rose-700 border-rose-200" },
  ];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const res = login(email);
    if (!res.ok) {
      setError(res.message || "Sign-in failed");
      toast({ title: "Sign-in failed", description: res.message, variant: "danger" });
    } else {
      toast({ title: "Welcome back", description: "Redirecting to your dashboard.", variant: "success" });
    }
  };

  const isPatient = kind === "patient";
  const heroGradient = isPatient
    ? "bg-gradient-to-br from-rose-600 via-rose-500 to-orange-500"
    : "bg-gradient-to-br from-teal-700 via-teal-600 to-emerald-600";
  const heroTitle = isPatient ? "Your health, in one place." : "Clinical precision, real-time care.";
  const heroSub = isPatient
    ? "Sign in to view your records, book an ambulance, and message your care team."
    : "Sign in to your role-based dashboard and access patient records, lab results, treatments, and emergency operations.";
  const quick = isPatient ? patientAccounts : staffAccounts;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-white to-teal-50 p-6">
      <div className="bg-grid absolute inset-0 opacity-60" />
      <div className="spotlight" style={{ ["--x" as any]: "50%", ["--y" as any]: "35%" }} />

      {/* Choose-path pill at top */}
      <div className="absolute left-1/2 top-6 z-20 -translate-x-1/2">
        <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-white/90 p-1 shadow-lg backdrop-blur">
          <button
            onClick={() => onNavigate("login-patient")}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${isPatient ? "bg-rose-600 text-white shadow" : "text-slate-600 hover:text-slate-900"}`}
          >
            Patient
          </button>
          <button
            onClick={() => onNavigate("login-staff")}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${!isPatient ? "bg-teal-700 text-white shadow" : "text-slate-600 hover:text-slate-900"}`}
          >
            Staff
          </button>
        </div>
      </div>

      <div className="relative z-10 mt-10 grid w-full max-w-5xl grid-cols-1 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl lg:grid-cols-2">
        <div className={`relative hidden flex-col justify-between p-10 text-white lg:flex ${heroGradient}`}>
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
              </div>
              <div className="text-sm font-semibold tracking-wide">SatCity Hospital</div>
            </div>
            <Badge variant={isPatient ? "danger" : "teal"} className="mt-8 bg-white/15 text-white border-white/30">{isPatient ? "Patient Portal" : "Staff Portal"}</Badge>
            <h1 className="mt-4 text-4xl font-bold leading-tight reveal-up">{heroTitle}</h1>
            <p className="mt-4 max-w-sm text-sm text-white/85">{heroSub}</p>
          </div>
          <div className="space-y-3">
            {(isPatient
              ? ["View treatment history & lab results", "Book scheduled ambulances", "Message your assigned doctor"]
              : ["Role-scoped RLS policies", "Supabase Realtime notifications", "Smart patient assignment edge functions"]
            ).map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm text-white/90">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/15">
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
                {f}
              </div>
            ))}
          </div>
        </div>

        <div className="p-8 lg:p-10">
          <div className="mb-6">
            <Badge variant={isPatient ? "danger" : "teal"}>{isPatient ? "Patient · Secure Sign-in" : "Staff · Secure Sign-in"}</Badge>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">{isPatient ? "Welcome back" : "Welcome to the team"}</h2>
            <p className="mt-1 text-sm text-slate-500">{isPatient ? "Enter your email to access your personal health portal." : "Enter your hospital email to access your role-based dashboard."}</p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={isPatient ? "your.email@example.com" : "name@satcity.hosp"} />
            <Input label="Password" type="password" defaultValue="demopassword" />
            {error && <Alert variant="danger">{error}</Alert>}
            <Button type="submit" className={`w-full ${isPatient ? "!bg-rose-600 hover:!bg-rose-700" : ""}`} size="lg">
              {isPatient ? "Sign in to Patient Portal" : "Sign in to Staff Dashboard"}
            </Button>
          </form>

          <div className="mt-6">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">{isPatient ? "Demo patient account" : "Quick sign-in · staff demo accounts"}</div>
            <div className={`grid gap-2 ${isPatient ? "grid-cols-1" : "grid-cols-2"}`}>
              {quick.map((a) => (
                <button key={a.email} type="button" onClick={() => setEmail(a.email)} className={`rounded-lg border px-3 py-2 text-left text-xs font-medium transition hover:shadow-sm ${a.accent}`}>
                  <div className="font-semibold">{a.label}</div>
                  <div className="truncate opacity-70">{a.email}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between text-xs text-slate-500">
            <div className="flex flex-col gap-1">
              {isPatient ? (
                <>
                  <span>New to SatCity?</span>
                  <button onClick={() => onNavigate("register-patient")} className="font-medium text-rose-700 hover:underline">Create a patient account</button>
                </>
              ) : (
                <>
                  <span>Are you staff?</span>
                  <button onClick={() => onNavigate("register-staff")} className="font-medium text-teal-700 hover:underline">Request staff access</button>
                </>
              )}
            </div>
            <div className="flex flex-col items-end gap-1">
              <button onClick={() => onNavigate(isPatient ? "login-staff" : "login-patient")} className="font-medium text-slate-600 hover:underline">
                {isPatient ? "Staff sign-in →" : "← Patient sign-in"}
              </button>
              <button onClick={() => onNavigate("landing")} className="hover:underline">Back to home</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Register({ kind = "patient", onNavigate }: { kind?: Kind; onNavigate: (route: string) => void }) {
  const { register } = useAuth();
  const { toast } = useToast();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<Role>(kind === "patient" ? "patient" : "doctor");
  const [msg, setMsg] = React.useState<{ text: string; variant: "success" | "danger" } | null>(null);
  const isPatient = kind === "patient";

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedRole: Role = isPatient ? "patient" : role;
    const res = register(name || "New User", email || `user${Date.now()}@satcity.hosp`, selectedRole);
    if (!res.ok) {
      setMsg({ text: res.message || "Registration failed", variant: "danger" });
      toast({ title: "Registration failed", description: res.message, variant: "danger" });
    } else {
      setMsg({ text: res.message || "Registered", variant: "success" });
      toast({ title: isPatient ? "Welcome to SatCity" : "Request submitted", description: res.message, variant: "success" });
      if (isPatient) setTimeout(() => onNavigate("dashboard"), 800);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-6" style={{ background: isPatient ? "linear-gradient(to bottom right, #fff1f2, #ffffff, #fef3c7)" : "linear-gradient(to bottom right, #f0fdfa, #ffffff, #eff6ff)" }}>
      <div className="bg-dots absolute inset-0 opacity-60" />
      <div className="spotlight" style={{ ["--x" as any]: "50%", ["--y" as any]: "30%", background: isPatient ? "radial-gradient(600px circle at var(--x,50%) var(--y,30%), rgba(244,63,94,0.18), transparent 45%)" : "radial-gradient(600px circle at var(--x,50%) var(--y,30%), rgba(13,148,136,0.18), transparent 45%)" }} />

      <div className="absolute left-1/2 top-6 z-20 -translate-x-1/2">
        <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-white/90 p-1 shadow-lg backdrop-blur">
          <button onClick={() => onNavigate("register-patient")} className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${isPatient ? "bg-rose-600 text-white shadow" : "text-slate-600 hover:text-slate-900"}`}>Patient</button>
          <button onClick={() => onNavigate("register-staff")} className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${!isPatient ? "bg-teal-700 text-white shadow" : "text-slate-600 hover:text-slate-900"}`}>Staff</button>
        </div>
      </div>

      <Card className="relative z-10 mt-10 w-full max-w-lg shadow-2xl">
        <CardContent className="p-8">
          <div className="mb-6">
            <Badge variant={isPatient ? "danger" : "info"}>{isPatient ? "Patient Registration" : "Staff Registration · Requires approval"}</Badge>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">{isPatient ? "Create your patient account" : "Request staff access to SatCity"}</h2>
            <p className="mt-1 text-sm text-slate-500">{isPatient ? "Instant access — activate immediately." : "Staff roles require administrator approval before you can sign in."}</p>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} placeholder={isPatient ? "Jane Doe" : "Dr. Jane Smith"} />
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={isPatient ? "jane@example.com" : "jane@satcity.hosp"} />
            {!isPatient && (
              <Select
                label="Role"
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                options={[
                  { value: "doctor", label: "Doctor (requires approval)" },
                  { value: "lab_tech", label: "Lab Technician (requires approval)" },
                  { value: "pharmacist", label: "Pharmacist (requires approval)" },
                  { value: "admin", label: "Department Admin (requires approval)" },
                ]}
              />
            )}
            <Input label="Password" type="password" defaultValue="demopassword" />
            {isPatient ? (
              <div className="rounded-xl border border-rose-100 bg-rose-50 p-3 text-xs text-rose-800">
                Patient accounts are activated immediately. You'll be redirected to your personal health dashboard after registration.
              </div>
            ) : (
              <div className="rounded-xl border border-teal-100 bg-teal-50 p-3 text-xs text-teal-800">
                Your request will be reviewed by the department admin. You'll receive an email once your account is activated.
              </div>
            )}
            {msg && <Alert variant={msg.variant}>{msg.text}</Alert>}
            <Button type="submit" className={`w-full ${isPatient ? "!bg-rose-600 hover:!bg-rose-700" : ""}`} size="lg">
              {isPatient ? "Create patient account" : "Submit staff request"}
            </Button>
          </form>
          <div className="mt-5 flex items-center justify-between text-xs text-slate-500">
            <button onClick={() => onNavigate(isPatient ? "login-patient" : "login-staff")} className="font-medium text-slate-700 hover:underline">Already have an account? Sign in</button>
            <button onClick={() => onNavigate("landing")} className="hover:underline">Back to home</button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

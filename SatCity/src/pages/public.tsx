import { useState, FormEvent, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BackgroundGrid, AnimatedText, TiltCard, MagneticButton } from "../components/aceternity";
import { Button, Card, Input, Label, Badge, Select } from "../components/ui/primitives";
import { useHospital, Role } from "../lib/store";
import {
  Ambulance, Stethoscope, FlaskConical, Pill, Users, ShieldCheck,
  Activity, ArrowRight, Siren, CheckCircle2, Clock,
  HeartPulse, Briefcase,
} from "lucide-react";

// ============ Floating Navbar ============
export function FloatingNav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
      <div className={`flex items-center gap-1 px-2 py-2 rounded-full border backdrop-blur-md transition-all ${scrolled ? "bg-white/90 shadow-lg border-neutral-200" : "bg-white/70 border-white/50"}`}>
        <Link to="/" className="flex items-center gap-2 px-3">
          <div className="h-7 w-7 rounded-md bg-neutral-900 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 2v20M2 12h20"/></svg>
          </div>
          <span className="text-sm font-semibold text-neutral-900">SatCity Hospital</span>
        </Link>
        <div className="hidden md:flex items-center gap-1 text-sm text-neutral-700">
          <Link to="/" className="px-3 py-1.5 rounded-full hover:bg-neutral-100">Home</Link>
          <Link to="/features" className="px-3 py-1.5 rounded-full hover:bg-neutral-100">Features</Link>
          <Link to="/roles" className="px-3 py-1.5 rounded-full hover:bg-neutral-100">Roles</Link>
          <Link to="/modules" className="px-3 py-1.5 rounded-full hover:bg-neutral-100">Modules</Link>
        </div>
        <Link to="/emergency">
          <Button variant="destructive" size="sm" className="rounded-full">
            <Siren size={14} /> Emergency
          </Button>
        </Link>
        <Link to="/login">
          <Button size="sm" className="rounded-full">Sign in</Button>
        </Link>
      </div>
    </nav>
  );
}

// ============ Landing Page ============
export function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <FloatingNav />

      {/* HERO */}
      <BackgroundGrid className="pt-32 pb-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid gap-12 xl:grid-cols-[1.2fr_0.8fr] items-center">
            <div className="text-center xl:text-left">
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-neutral-900 leading-[1.05]">
                <AnimatedText text="Clinical precision." />
                <br />
                <span className="text-neutral-400"><AnimatedText text="Built for modern hospitals." delay={0.8} /></span>
              </h1>
              <p className="mt-6 max-w-2xl mx-auto xl:mx-0 text-lg text-neutral-600">
                SatCity Hospital Management Platform — a unified system connecting doctors, lab technicians, pharmacists, and patients with smart assignment, realtime notifications, and full audit trails.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center xl:justify-start gap-3">
                <Link to="/login">
                  <Button size="lg" className="rounded-full w-full sm:w-auto">
                    Open Dashboard <ArrowRight size={16} />
                  </Button>
                </Link>
                <Link to="/emergency">
                  <Button size="lg" variant="outline" className="rounded-full w-full sm:w-auto">
                    <Ambulance size={16} /> Emergency Ambulance
                  </Button>
                </Link>
              </div>
            </div>
            <div className="overflow-hidden rounded-4xl border border-neutral-200 shadow-2xl max-w-xl mx-auto xl:mx-0">
              <img src="/img/homepage.jpg" alt="SatCity hospital dashboard preview" className="w-full h-[420px] object-cover" />
            </div>
          </div>

        </div>
      </BackgroundGrid>

      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-neutral-900">Ready to go live?</h2>
          <p className="mt-3 text-neutral-600">Demo accounts are pre-seeded. Try any role to explore the full platform.</p>
          <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
            <Link to="/login/portal/patient">
              <Button size="lg" variant="outline" className="rounded-full gap-2">
                <HeartPulse size={16} /> Patient Portal
              </Button>
            </Link>
            <Link to="/login/portal/staff">
              <Button size="lg" className="rounded-full gap-2">
                <Briefcase size={16} /> Staff Portal
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-neutral-200 py-8 text-center text-xs text-neutral-500">
        © 2026 SatCity Hospital — Management Platform
      </footer>
    </div>
  );
}

export function FeaturesPage() {
  return (
    <div className="min-h-screen bg-white">
      <FloatingNav />
      <div className="pt-28 pb-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <Badge variant="outline">Features</Badge>
            <h1 className="mt-4 text-4xl font-bold text-neutral-900">Everything your hospital needs</h1>
            <p className="mt-3 text-neutral-600">Six integrated modules, one unified platform.</p>
            <div className="mt-6">
              <Link to="/" className="text-sm font-semibold text-neutral-900 underline underline-offset-4 hover:text-neutral-700">← Home</Link>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { icon: <Users size={18} />, title: "Patient Management", desc: "Complete patient profiles with symptoms, lab results, treatments, and assigned doctors." },
              { icon: <Stethoscope size={18} />, title: "Doctor Assignment", desc: "Smart edge-function matching that assigns patients to available specialists automatically." },
              { icon: <FlaskConical size={18} />, title: "Lab Integration", desc: "Realtime lab result uploads trigger automatic patient-doctor assignment workflows." },
              { icon: <Pill size={18} />, title: "Drug Inventory", desc: "Sanity CMS drug catalog with live Supabase inventory tracking and low-stock alerts." },
              { icon: <Ambulance size={18} />, title: "Ambulance System", desc: "Scheduled bookings for patients and a public emergency page for critical cases." },
              { icon: <ShieldCheck size={18} />, title: "Role-Based Access", desc: "Six roles with strict row-level security — Super Admin, Admin, Doctor, Lab Tech, Pharmacist, Patient." },
            ].map((f) => (
              <TiltCard key={f.title}>
                <Card className="h-full p-6 hover:border-neutral-300 transition-colors">
                  <div className="h-10 w-10 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-700">{f.icon}</div>
                  <h3 className="mt-4 text-base font-semibold text-neutral-900">{f.title}</h3>
                  <p className="mt-1.5 text-sm text-neutral-600">{f.desc}</p>
                </Card>
              </TiltCard>
            ))}
          </div>
        </div>
      </div>
      <footer className="border-t border-neutral-200 py-8 text-center text-xs text-neutral-500">
        © 2026 SatCity Hospital — Management Platform
      </footer>
    </div>
  );
}

export function RolesPage() {
  return (
    <div className="min-h-screen bg-white">
      <FloatingNav />
      <div className="pt-28 pb-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <Badge variant="outline">Roles</Badge>
            <h1 className="mt-4 text-4xl font-bold text-neutral-900">Tailored for every team member</h1>
            <p className="mt-3 text-neutral-600">Each role gets a unique sidebar, color accent, and scope — so staff see only what they need.</p>
            <div className="mt-6">
              <Link to="/" className="text-sm font-semibold text-neutral-900 underline underline-offset-4 hover:text-neutral-700">← Home</Link>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { role: "Super Admin", color: "bg-neutral-900", text: "Full platform access, account activation, and a master bento-grid overview." },
              { role: "Department Admin", color: "bg-blue-600", text: "Staff & patient management scoped to your department only." },
              { role: "Doctor", color: "bg-emerald-600", text: "Patient list, treatments, lab results, CSV export, and emergency accept." },
              { role: "Lab Technician", color: "bg-purple-600", text: "Upload lab results that trigger smart assignment edge functions." },
              { role: "Pharmacist", color: "bg-amber-600", text: "Drug inventory, stock updates, low-stock alerts, and new drug registration." },
              { role: "Patient", color: "bg-teal-600", text: "Personal profile, treatment history, assigned doctor, and ambulance booking." },
            ].map((r) => (
              <Card key={r.role} className="p-5">
                <div className="flex items-center gap-3">
                  <div className={`h-9 w-9 rounded-lg ${r.color} flex items-center justify-center text-white text-xs font-bold`}>
                    {r.role.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                  </div>
                  <div className="font-semibold text-neutral-900">{r.role}</div>
                </div>
                <p className="mt-3 text-sm text-neutral-600">{r.text}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>
      <footer className="border-t border-neutral-200 py-8 text-center text-xs text-neutral-500">
        © 2026 SatCity Hospital — Management Platform
      </footer>
    </div>
  );
}

export function ModulesPage() {
  return (
    <div className="min-h-screen bg-white">
      <FloatingNav />
      <div className="pt-28 pb-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <Badge variant="outline">Modules</Badge>
            <h1 className="mt-4 text-4xl font-bold text-neutral-900">Smart assignment, realtime by default</h1>
            <p className="mt-3 text-neutral-600">When a lab result is uploaded, our edge function matches the diagnosed condition to an available specialist and assigns the patient automatically — or broadcasts to all matching doctors if none are free.</p>
            <div className="mt-6">
              <Link to="/" className="text-sm font-semibold text-neutral-900 underline underline-offset-4 hover:text-neutral-700">← Home</Link>
            </div>
          </div>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { step: "01", title: "Lab result uploaded", desc: "Technician uploads result and enters diagnosed condition." },
              { step: "02", title: "Specialty matching", desc: "Edge function queries doctors whose specialty matches." },
              { step: "03", title: "Load balancing", desc: "Available doctor with fewest active patients is selected." },
              { step: "04", title: "Realtime notification", desc: "Doctor receives push notification via Supabase Realtime." },
            ].map((s) => (
              <Card key={s.step} className="p-5 border border-neutral-200">
                <div className="text-xs text-neutral-500 font-mono">{s.step}</div>
                <div className="mt-2 font-semibold text-neutral-900">{s.title}</div>
                <div className="mt-1 text-sm text-neutral-600">{s.desc}</div>
              </Card>
            ))}
          </div>
        </div>
      </div>
      <footer className="border-t border-neutral-200 py-8 text-center text-xs text-neutral-500">
        © 2026 SatCity Hospital — Management Platform
      </footer>
    </div>
  );
}

// ============ Emergency Page (public) ============
export function EmergencyPage() {
  const { submitEmergency } = useHospital();
  const navigate = useNavigate();
  const [form, setForm] = useState({ caller_name: "", pickup_location: "", description: "" });
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.caller_name || !form.pickup_location) return;
    submitEmergency(form);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full bg-red-600/20 blur-[120px]" />
        <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] rounded-full bg-orange-500/10 blur-[120px]" />
      </div>
      <div className="absolute inset-0 grid-bg-dark opacity-50" />

      <div className="relative z-10 flex items-center justify-between px-6 py-5">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5"><path d="M12 2v20M2 12h20"/></svg>
          </div>
          <span className="text-sm font-semibold">SatCity Hospital</span>
        </Link>
        <a href="tel:112" className="text-xs text-white/70 hover:text-white">Call 112</a>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-red-500/40 bg-red-500/10 text-red-300 text-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
              24/7 Emergency Response
            </div>
            <h1 className="mt-5 text-5xl md:text-6xl font-bold tracking-tight leading-[1.05]">
              <AnimatedText text="Every second" />
              <br />
              <span className="text-red-400"><AnimatedText text="counts." delay={0.6} /></span>
            </h1>
            <p className="mt-6 text-white/70 text-lg">
              Request an ambulance to your location. Our dispatch team is alerted instantly via realtime broadcast.
            </p>
            <div className="mt-8 space-y-3">
              {[
                { icon: <Clock size={16} />, text: "Average dispatch time under 90 seconds" },
                { icon: <Activity size={16} />, text: "GPS-tracked fleet with onboard paramedics" },
                { icon: <CheckCircle2 size={16} />, text: "Direct handover to SatCity emergency department" },
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-white/80">
                  <span className="text-red-400">{f.icon}</span>{f.text}
                </div>
              ))}
            </div>
          </div>

          <div>
            {!submitted ? (
              <Card className="p-6 bg-white/5 border-white/10 text-white backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-5">
                  <div className="h-10 w-10 rounded-lg bg-red-600 flex items-center justify-center"><Ambulance size={18} /></div>
                  <div>
                    <div className="font-semibold">Request Emergency Ambulance</div>
                    <div className="text-xs text-white/60">No login required. Your request is dispatched instantly.</div>
                  </div>
                </div>
                <form onSubmit={onSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="caller" className="text-white/80">Your name</Label>
                    <Input id="caller" className="bg-white/5 border-white/20 text-white placeholder:text-white/40" placeholder="e.g. Ibrahim Suleiman" value={form.caller_name} onChange={(e) => setForm({ ...form, caller_name: e.target.value })} required />
                  </div>
                  <div>
                    <Label htmlFor="loc" className="text-white/80">Pickup location / address</Label>
                    <Input id="loc" className="bg-white/5 border-white/20 text-white placeholder:text-white/40" placeholder="e.g. Murtala Muhammed Way, Abuja" value={form.pickup_location} onChange={(e) => setForm({ ...form, pickup_location: e.target.value })} required />
                  </div>
                  <div>
                    <Label htmlFor="desc" className="text-white/80">Brief description of the incident</Label>
                    <textarea id="desc" rows={3} className="w-full px-3 py-2 rounded-md border border-white/20 bg-white/5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-red-500/50 resize-y" placeholder="e.g. RTA, male ~35, conscious, bleeding from head" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                  </div>
                  <MagneticButton className="w-full">
                    <button type="submit" className="w-full h-14 rounded-lg bg-red-600 text-white font-semibold glow-red flex items-center justify-center gap-3 cursor-pointer">
                      <Siren size={18} />
                      CALL EMERGENCY AMBULANCE
                    </button>
                  </MagneticButton>
                  <p className="text-[11px] text-white/50 text-center">By submitting, you consent to sharing this info with our dispatch team.</p>
                </form>
              </Card>
            ) : (
              <Card className="p-8 bg-white/5 border-emerald-500/40 text-white text-center backdrop-blur-sm">
                <div className="h-14 w-14 rounded-full bg-emerald-500 flex items-center justify-center mx-auto">
                  <CheckCircle2 size={24} />
                </div>
                <h3 className="mt-4 text-xl font-semibold">Help is on the way</h3>
                <p className="mt-2 text-sm text-white/70">Our dispatch team has been notified. Nearest ambulance is being routed to your location.</p>
                <div className="mt-5 grid grid-cols-2 gap-3 text-left text-xs">
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10"><div className="text-white/50">Location</div><div className="mt-1 font-medium">{form.pickup_location}</div></div>
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10"><div className="text-white/50">Status</div><div className="mt-1 font-medium text-emerald-400">Dispatched</div></div>
                </div>
                <Button variant="outline" className="mt-6 border-white/30 text-white hover:bg-white/10" onClick={() => navigate("/")}>Return home</Button>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ Portal Picker (choose Patient vs Staff) ============
export function PortalPickerPage() {
  return (
    <div className="min-h-screen bg-white relative overflow-hidden flex items-center justify-center px-4 py-16">
      <div className="absolute inset-0 grid-bg opacity-40" />
      <div className="relative z-10 w-full max-w-3xl">
        <Link to="/" className="inline-flex items-center gap-2 mb-8">
          <div className="h-8 w-8 rounded-lg bg-neutral-900 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 2v20M2 12h20"/></svg>
          </div>
          <span className="text-sm font-semibold text-neutral-900">SatCity Hospital</span>
        </Link>

        <h1 className="text-4xl font-bold text-neutral-900 text-center">
          <AnimatedText text="Choose your portal" />
        </h1>
        <p className="text-center text-neutral-600 mt-2">Select the login flow that matches who you are.</p>

        <div className="grid md:grid-cols-2 gap-5 mt-10">
          <Link to="/login/portal/patient" className="block">
            <TiltCard>
              <Card className="p-8 hover:border-teal-300 hover:shadow-lg transition-all h-full">
                <div className="h-14 w-14 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center mb-4">
                  <HeartPulse size={26} />
                </div>
                <h2 className="text-2xl font-semibold text-neutral-900">Patient Portal</h2>
                <p className="text-sm text-neutral-600 mt-2">
                  View your health profile, treatment history, assigned doctor, and book scheduled ambulances.
                </p>
                <ul className="mt-4 space-y-1.5 text-sm text-neutral-700">
                  <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-teal-600" /> Instant registration — no approval required</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-teal-600" /> See your lab results & treatments</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-teal-600" /> Book ambulance appointments</li>
                </ul>
                <Button className="mt-6 w-full bg-teal-600 hover:bg-teal-700">
                  Continue as Patient <ArrowRight size={14} />
                </Button>
              </Card>
            </TiltCard>
          </Link>

          <Link to="/login/portal/staff" className="block">
            <TiltCard>
              <Card className="p-8 hover:border-neutral-400 hover:shadow-lg transition-all h-full">
                <div className="h-14 w-14 rounded-xl bg-neutral-900 text-white flex items-center justify-center mb-4">
                  <Briefcase size={26} />
                </div>
                <h2 className="text-2xl font-semibold text-neutral-900">Staff Portal</h2>
                <p className="text-sm text-neutral-600 mt-2">
                  For doctors, lab technicians, pharmacists, and hospital administrators.
                </p>
                <ul className="mt-4 space-y-1.5 text-sm text-neutral-700">
                  <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-neutral-900" /> Requires admin approval before login</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-neutral-900" /> Role-specific dashboards</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-neutral-900" /> Realtime notifications & smart assignment</li>
                </ul>
                <Button className="mt-6 w-full" variant="default">
                  Continue as Staff <ArrowRight size={14} />
                </Button>
              </Card>
            </TiltCard>
          </Link>
        </div>

        <div className="text-center mt-8 text-sm text-neutral-500">
          Not sure? <Link to="/" className="text-neutral-900 underline underline-offset-4 hover:no-underline">Back to home</Link>
        </div>
      </div>
    </div>
  );
}

// ============ Auth Page (unified but portal-aware) ============
export function AuthPage({ portal }: { portal: "patient" | "staff" | "any" }) {
  const { login, registerUser, users } = useHospital();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<Role>(portal === "patient" ? "patient" : "doctor");
  const [dept, setDept] = useState("d-cardio");
  const [dob, setDob] = useState("");
  const [bloodType, setBloodType] = useState("O+");
  const [address, setAddress] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const isPatientPortal = portal === "patient";
  const isStaffPortal = portal === "staff";

  const demoAccounts = isStaffPortal
    ? [
        { email: "super@satcity.com", label: "Super Admin" },
        { email: "admin.cardio@satcity.com", label: "Cardiology Admin" },
        { email: "emeka@satcity.com", label: "Dr. Emeka (Cardiology)" },
        { email: "kemi@satcity.com", label: "Kemi (Lab Tech)" },
        { email: "bola@satcity.com", label: "Bola (Pharmacist)" },
      ]
    : isPatientPortal
    ? [
        { email: "chioma@example.com", label: "Chioma Nwachukwu" },
        { email: "yusuf@example.com", label: "Yusuf Danjuma" },
        { email: "adaora@example.com", label: "Adaora Okeke" },
      ]
    : [
        { email: "super@satcity.com", label: "Super Admin" },
        { email: "emeka@satcity.com", label: "Dr. Emeka" },
        { email: "chioma@example.com", label: "Chioma (Patient)" },
      ];

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    if (mode === "login") {
      const ok = await login(email);
      if (!ok) {
        setError("Invalid email, account inactive, or you tried to log into the wrong portal.");
        return;
      }
      navigate("/dashboard");
    } else {
      if (!fullName || !email) { setError("Please fill all required fields."); return; }
      if (isPatientPortal && (!dob || !bloodType)) { setError("Date of birth and blood type are required."); return; }

      try {
        const newUser = await registerUser({
          full_name: fullName,
          email,
          role: isPatientPortal ? "patient" : role,
          department_id: isPatientPortal || role === "pharmacist" ? null : dept,
          is_active: isPatientPortal,
          date_of_birth: dob || undefined,
          blood_type: bloodType || undefined,
          emergency_contact: emergencyContact || undefined,
          address: address || undefined,
        });

        if (newUser.is_active) {
          navigate("/dashboard");
        } else {
          setInfo(
            `Account created successfully for ${fullName} (${role.replace("_", " ")}). ` +
            `Your account requires admin approval before you can log in. You will receive an email once approved.`
          );
        }
      } catch (err) {
        setError((err as Error)?.message || "Unable to create account. Please try again.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden flex items-center justify-center px-4 py-16">
      <div className="absolute inset-0 pointer-events-none">
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full ${isPatientPortal ? "bg-teal-500/5" : "bg-blue-500/5"} blur-[100px]`} />
      </div>
      <div className="absolute inset-0 grid-bg opacity-40" />
      <div className="absolute top-0 left-0 right-0 h-px overflow-hidden"><div className="beam-line h-full w-1/3 absolute" /></div>

      <div className="relative z-10 w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 mb-6">
          <div className="h-8 w-8 rounded-lg bg-neutral-900 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 2v20M2 12h20"/></svg>
          </div>
          <span className="text-sm font-semibold text-neutral-900">SatCity Hospital</span>
        </Link>

        {/* Portal badge */}
        <div className="mb-4">
          <Badge variant={isPatientPortal ? "teal" : "outline"} className={isPatientPortal ? "" : "border-neutral-900 text-neutral-900"}>
            {isPatientPortal ? <HeartPulse size={10} /> : <Briefcase size={10} />}
            {isPatientPortal ? "Patient Portal" : "Staff Portal"}
          </Badge>
          <button onClick={() => navigate("/login")} className="ml-2 text-xs text-neutral-500 hover:text-neutral-900 underline underline-offset-2 cursor-pointer">
            Switch portal
          </button>
        </div>

        <Card className="p-6">
          <div className="flex gap-1 p-1 bg-neutral-100 rounded-lg mb-6">
            <button onClick={() => { setMode("login"); setError(""); setInfo(""); }} className={`flex-1 text-xs font-medium py-2 rounded-md cursor-pointer ${mode === "login" ? "bg-white shadow text-neutral-900" : "text-neutral-500"}`}>Sign in</button>
            <button onClick={() => { setMode("register"); setError(""); setInfo(""); }} className={`flex-1 text-xs font-medium py-2 rounded-md cursor-pointer ${mode === "register" ? "bg-white shadow text-neutral-900" : "text-neutral-500"}`}>Register</button>
          </div>

          <h2 className="text-xl font-semibold text-neutral-900">
            {mode === "login" ? (isPatientPortal ? "Welcome back" : "Staff sign in") : (isPatientPortal ? "Create patient account" : "Request staff account")}
          </h2>
          <p className="text-sm text-neutral-500 mt-1">
            {mode === "login"
              ? (isPatientPortal ? "Access your medical profile and bookings." : "Enter your work email to continue.")
              : (isPatientPortal ? "Instant access — no approval required." : "Account will need admin approval before activation.")}
          </p>

          <form onSubmit={onSubmit} className="mt-5 space-y-4">
            {mode === "register" && (
              <div>
                <Label htmlFor="fn">Full name</Label>
                <Input id="fn" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder={isPatientPortal ? "As on your ID" : "Your full name"} required />
              </div>
            )}
            <div>
              <Label htmlFor="em">Email</Label>
              <Input id="em" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={isPatientPortal ? "you@example.com" : "you@satcity.com"} required />
            </div>
            {mode === "register" && isPatientPortal && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="dob">Date of birth</Label>
                    <Input id="dob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} required />
                  </div>
                  <div>
                    <Label htmlFor="bt">Blood type</Label>
                    <Select id="bt" value={bloodType} onChange={(e) => setBloodType(e.target.value)}>
                      {["O+","O-","A+","A-","B+","B-","AB+","AB-"].map((b) => <option key={b}>{b}</option>)}
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="addr">Address</Label>
                  <Input id="addr" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, city" />
                </div>
                <div>
                  <Label htmlFor="ec">Emergency contact</Label>
                  <Input id="ec" value={emergencyContact} onChange={(e) => setEmergencyContact(e.target.value)} placeholder="+234 800 000 0000" />
                </div>
              </>
            )}
            {mode === "register" && isStaffPortal && (
              <>
                <div>
                  <Label htmlFor="rl">Staff role</Label>
                  <Select id="rl" value={role} onChange={(e) => setRole(e.target.value as Role)}>
                    <option value="doctor">Doctor</option>
                    <option value="lab_tech">Lab Technician</option>
                    <option value="pharmacist">Pharmacist</option>
                    <option value="admin">Department Admin</option>
                  </Select>
                  <p className="text-xs text-neutral-500 mt-1">Your account will need admin approval before activation.</p>
                </div>
                {role !== "pharmacist" && (
                  <div>
                    <Label htmlFor="dp">Department</Label>
                    <Select id="dp" value={dept} onChange={(e) => setDept(e.target.value)}>
                      <option value="d-cardio">Cardiology</option>
                      <option value="d-neuro">Neurology</option>
                      <option value="d-peds">Pediatrics</option>
                      <option value="d-ortho">Orthopedics</option>
                    </Select>
                  </div>
                )}
              </>
            )}
            {mode === "register" && portal === "any" && (
              <div>
                <Label htmlFor="rl">Role</Label>
                <Select id="rl" value={role} onChange={(e) => setRole(e.target.value as Role)}>
                  <option value="patient">Patient</option>
                  <option value="doctor">Doctor</option>
                  <option value="lab_tech">Lab Technician</option>
                  <option value="pharmacist">Pharmacist</option>
                  <option value="admin">Department Admin</option>
                </Select>
              </div>
            )}
            {error && <div className="text-xs text-red-600 bg-red-50 p-2 rounded-md border border-red-100">{error}</div>}
            {info && <div className="text-xs text-emerald-700 bg-emerald-50 p-2 rounded-md border border-emerald-100">{info}</div>}
            <Button type="submit" className={`w-full ${isPatientPortal ? "bg-teal-600 hover:bg-teal-700" : ""}`} size="lg">
              {mode === "login" ? "Sign in" : (isPatientPortal ? "Create patient account" : "Request staff account")}
            </Button>
          </form>

          {mode === "login" && (
            <div className="mt-6 pt-6 border-t border-neutral-100">
              <div className="text-xs text-neutral-500 mb-2">Demo accounts (click to autofill):</div>
              <div className="grid grid-cols-1 gap-2">
                {demoAccounts.map((d) => (
                  <button
                    key={d.email}
                    type="button"
                    onClick={() => setEmail(d.email)}
                    className="text-left text-xs px-3 py-2 rounded-md border border-neutral-200 hover:bg-neutral-50 cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <div className="font-medium text-neutral-900">{d.label}</div>
                      <div className="text-neutral-500">{d.email}</div>
                    </div>
                    <ArrowRight size={12} className="text-neutral-400" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </Card>

        <p className="mt-4 text-center text-xs text-neutral-500">
          {users.length} users registered · Row-level security active
        </p>
      </div>
    </div>
  );
}

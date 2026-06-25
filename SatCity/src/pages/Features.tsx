import { Button, Badge, Card, CardContent } from "../components/ui";
import { Icon } from "../components/Sidebar";
import Navbar from "../components/Navbar";

const features = [
  { title: "Smart Patient Assignment", desc: "Supabase Edge Functions automatically match patients to specialists by availability and load.", icon: Icon.stethoscope },
  { title: "Integrated Pharmacy", desc: "Sanity-powered drug catalog with live inventory and low-stock alerts.", icon: Icon.pill },
  { title: "Realtime Emergency Ops", desc: "Emergency requests broadcast to admins in real time with Supabase Realtime.", icon: Icon.alert },
  { title: "Role-Scoped Access", desc: "Six distinct user roles with strict RLS policies and department scoping.", icon: Icon.users },
  { title: "Ambulance Dispatch", desc: "Scheduled bookings from patient dashboards and a public emergency hotline.", icon: Icon.ambulance },
  { title: "Lab & Treatment History", desc: "Color-coded treatment basis badges and signed URLs for every uploaded file.", icon: Icon.lab },
];

export default function Features({ onNavigate }: { onNavigate: (route: string) => void }) {
  return (
    <div className="min-h-screen bg-white">
      <Navbar onNavigate={onNavigate} showHomeButton />

      <main className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-10 text-center">
          <Badge variant="info">Platform Capabilities</Badge>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Everything a modern hospital needs</h2>
          <p className="mx-auto mt-2 max-w-2xl text-slate-500">Modular dashboards, real-time collaboration, and role-appropriate views across the entire care journey.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} className="tilt-card">
              <CardContent className="flex h-full flex-col gap-3 p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-700">{feature.icon()}</div>
                <div className="text-base font-semibold text-slate-900">{feature.title}</div>
                <div className="text-sm text-slate-500">{feature.desc}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      <footer className="border-t border-slate-200 py-8 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} SatCity Hospital — Management Platform Demo.
      </footer>
    </div>
  );
}

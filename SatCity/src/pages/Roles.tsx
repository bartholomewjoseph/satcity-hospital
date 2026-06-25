import { Button, Badge, Card, CardContent } from "../components/ui";
import Navbar from "../components/Navbar";

export default function Roles({ onNavigate }: { onNavigate: (route: string) => void }) {
  const roles = [
    { r: "Super Admin", c: "from-violet-600 to-indigo-600", d: "Full platform access. Activate/deactivate any account. Bento grid overview." },
    { r: "Department Admin", c: "from-blue-600 to-sky-600", d: "Manage staff and patients only within an assigned department." },
    { r: "Doctor", c: "from-teal-600 to-emerald-600", d: "Smart patient assignments, treatment records, CSV export." },
    { r: "Lab Technician", c: "from-amber-500 to-orange-500", d: "Upload lab results; triggers the smart-assignment Edge Function." },
    { r: "Pharmacist", c: "from-emerald-600 to-teal-600", d: "Sanity + Supabase drug inventory, stock updates, low-stock alerts." },
    { r: "Patient", c: "from-rose-600 to-red-600", d: "Personal health records, treatment history, scheduled ambulance bookings." },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar onNavigate={onNavigate} showHomeButton />

      <main className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-10 text-center">
          <Badge variant="warning">Role-Based Access</Badge>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Six roles, one platform</h2>
          <p className="mx-auto mt-2 max-w-2xl text-slate-500">Each role has its own sidebar structure, accent color, and scope of authority.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {roles.map((r) => (
            <Card key={r.r} className="tilt-card overflow-hidden">
              <div className={`h-1.5 bg-gradient-to-r ${r.c}`} />
              <CardContent className="p-6">
                <div className="text-base font-semibold text-slate-900">{r.r}</div>
                <div className="mt-2 text-sm text-slate-500">{r.d}</div>
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

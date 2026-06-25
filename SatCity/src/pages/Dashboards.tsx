import React from "react";
import { Sidebar, DashboardShell, Icon } from "../components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Badge, Button, Input, Select, Textarea, Dialog, Sheet, Tabs, Alert, Avatar, DropdownMenu } from "../components/ui";
import { DataTable, type Column } from "../components/DataTable";
import { useAuth } from "../lib/auth";
import { useStore, type Patient, type Drug, type AmbulanceBooking, type EmergencyRequest, type User } from "../lib/store";
import { useToast } from "../components/Toast";
import { formatDate, uid, downloadFile, toCSV } from "../lib/utils";
import SanityCMS from "./SanityCMS";

/* ===================== ROLE DISPATCH ===================== */
export default function DashboardRouter() {
  const { user } = useAuth();
  if (!user) return null;
  switch (user.role) {
    case "super_admin": return <SuperAdminDashboard />;
    case "admin": return <AdminDashboard />;
    case "doctor": return <DoctorDashboard />;
    case "lab_tech": return <LabTechDashboard />;
    case "pharmacist": return <PharmacistDashboard />;
    case "patient": return <PatientDashboard />;
    default: return null;
  }
}

/* ===================== SHARED HELPERS ===================== */
function TreatmentBadge({ type }: { type: "lab" | "experience" | "external" }) {
  if (type === "lab") return <Badge variant="info">Lab-confirmed</Badge>;
  if (type === "experience") return <Badge variant="amber">Doctor experience</Badge>;
  return <Badge variant="teal">External scan/report</Badge>;
}

function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  if (["available", "confirmed", "active", "completed", "en route"].some((k) => s.includes(k))) return <Badge variant="success">{status}</Badge>;
  if (["pending", "low", "busy"].some((k) => s.includes(k))) return <Badge variant="warning">{status}</Badge>;
  if (["out of stock", "deactivated", "off-duty"].some((k) => s.includes(k))) return <Badge variant="danger">{status}</Badge>;
  return <Badge>{status}</Badge>;
}

/* ===================== SUPER ADMIN (BENTO GRID) ===================== */
function SuperAdminDashboard() {
  const { users, patients, drugs, bookings, emergencies, notifications } = useStore();
  const { toast } = useToast();
  const [active, setActive] = React.useState("overview");

  const stats = [
    { label: "Active staff", value: users.filter((u) => u.is_active && u.role !== "patient").length, delta: "+3 this week", color: "from-violet-600 to-indigo-600", span: "md:col-span-1" },
    { label: "Registered patients", value: patients.length, delta: "+12 this week", color: "from-teal-600 to-emerald-600", span: "md:col-span-1" },
    { label: "Pending approvals", value: users.filter((u) => !u.is_active).length, delta: "Requires review", color: "from-amber-500 to-orange-500", span: "md:col-span-1" },
    { label: "Drug SKUs", value: drugs.length, delta: `${drugs.filter((d) => d.status === "low").length} low · ${drugs.filter((d) => d.status === "out of stock").length} OOS`, color: "from-emerald-600 to-teal-600", span: "md:col-span-1" },
    { label: "Ambulance bookings", value: bookings.length, delta: `${bookings.filter((b) => b.status === "Pending").length} pending`, color: "from-blue-600 to-sky-600", span: "md:col-span-2" },
    { label: "Emergency queue", value: emergencies.filter((e) => !e.is_resolved).length, delta: "Realtime · Supabase", color: "from-rose-600 to-red-600", span: "md:col-span-2" },
  ];

  return (
    <div className="flex">
      <Sidebar
        title="Platform Control"
        subtitle="Super Admin · SatCity Hospital"
        accent="violet"
        active={active}
        onSelect={setActive}
        items={[
          { id: "overview", label: "Overview", icon: Icon.dashboard },
          { id: "users", label: "User Accounts", icon: Icon.users, badge: users.filter((u) => !u.is_active).length, badgeVariant: "warning" },
          { id: "patients", label: "All Patients", icon: Icon.patient },
          { id: "doctors", label: "Doctors", icon: Icon.stethoscope },
          { id: "pharmacy", label: "Drug Inventory", icon: Icon.pill },
          { id: "sanity", label: "Sanity CMS · Content", icon: Icon.file, badge: "CMS" },
          { id: "ambulance", label: "Ambulance Bookings", icon: Icon.ambulance },
          { id: "emergency", label: "Emergency Requests", icon: Icon.alert, badge: emergencies.filter((e) => !e.is_resolved).length, badgeVariant: "danger" },
          { id: "settings", label: "Platform Settings", icon: Icon.settings },
        ]}
      />
      <DashboardShell pageTitle="Super Admin — Overview" pageSubtitle="Platform-wide analytics, user management, and realtime operations." actions={<Button variant="outline" size="sm" onClick={() => {
        const rows = users.map((u) => ({ id: u.id, full_name: u.full_name, email: u.email, role: u.role, status: u.is_active ? "Active" : "Deactivated", created_at: u.created_at }));
        downloadFile(`platform-users-${new Date().toISOString().slice(0, 10)}.csv`, toCSV(rows));
        toast({ title: "CSV exported", description: `${users.length} users`, variant: "success" });
      }}><Icon.download /> Export CSV</Button>}>
        {active === "overview" && (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              {stats.map((s) => (
                <div key={s.label} className={cn("tilt-card relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm", s.span)}>
                  <div className={cn("absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br opacity-20 blur-2xl", s.color)} />
                  <div className="relative">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">{s.label}</div>
                    <div className="mt-2 text-3xl font-bold text-slate-900">{s.value}</div>
                    <div className="mt-1 text-xs text-slate-500">{s.delta}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Recent activity</CardTitle>
                  <CardDescription>Latest events across the platform.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {notifications.slice(0, 5).map((n) => (
                    <div key={n.id} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-700"><Icon.bell /></div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-slate-800">{n.message}</div>
                        <div className="text-xs text-slate-500">{new Date(n.created_at).toLocaleString()} · {n.specialty_context || "Platform"}</div>
                      </div>
                      <Badge variant={n.type === "emergency_available_patient" ? "danger" : n.type === "assignment" ? "info" : "default"}>{n.type.replace(/_/g, " ")}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Role distribution</CardTitle>
                  <CardDescription>Active accounts by role.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(["super_admin", "admin", "doctor", "lab_tech", "pharmacist", "patient"] as const).map((r) => {
                    const count = users.filter((u) => u.role === r).length;
                    const pct = Math.round((count / Math.max(users.length, 1)) * 100);
                    return (
                      <div key={r}>
                        <div className="mb-1 flex items-center justify-between text-xs">
                          <span className="capitalize text-slate-600">{r.replace("_", " ")}</span>
                          <span className="font-semibold text-slate-800">{count}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {active === "users" && <UsersTable />}
        {active === "patients" && <PatientsTable />}
        {active === "doctors" && <DoctorsTable />}
        {active === "pharmacy" && <PharmacyTable readOnly />}
        {active === "sanity" && <SanityCMS />}
        {active === "ambulance" && <AmbulanceTable />}
        {active === "emergency" && <EmergencyTable />}
        {active === "settings" && (
          <Card>
            <CardHeader><CardTitle>Platform settings</CardTitle><CardDescription>Hospital-wide configuration (demo view).</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Input label="Hospital name" defaultValue="SatCity Hospital" />
                <Input label="Primary contact email" defaultValue="admin@satcity.hosp" />
                <Input label="Emergency number" defaultValue="+1 555 9110" />
                <Input label="Low stock threshold" defaultValue="10" />
              </div>
              <Alert variant="info">All changes are persisted locally in your browser (localStorage) for this demo. In production, updates would be written to Supabase PostgreSQL with RLS policies.</Alert>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => toast({ title: "Settings saved", variant: "success" })}>Save settings</Button>
                <Button variant="outline" onClick={() => {
                  if (!confirm("Reset ALL demo data? This will clear users, patients, drugs, bookings, emergencies, and notifications.")) return;
                  try {
                    Object.keys(localStorage).filter((k) => k.startsWith("satcity_")).forEach((k) => localStorage.removeItem(k));
                  } catch {}
                  toast({ title: "Demo data reset", description: "Reloading in 1 second…", variant: "warning" });
                  setTimeout(() => window.location.reload(), 1000);
                }}>Reset demo data</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </DashboardShell>
    </div>
  );
}

function cn(...args: (string | false | undefined)[]) {
  return args.filter(Boolean).join(" ");
}

/* ===================== USERS / PATIENTS / DOCTORS TABLES ===================== */
function UsersTable() {
  const { users, setUsers } = useStore();
  const { user: me } = useAuth();
  const { toast } = useToast();
  const isSuper = me?.role === "super_admin";
  const canManage = me?.role === "super_admin" || me?.role === "admin";
  const [loading, setLoading] = React.useState(true);
  const [addOpen, setAddOpen] = React.useState(false);
  const [form, setForm] = React.useState({ full_name: "", email: "", role: "doctor", department: "d1" });

  React.useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  const toggle = (id: string) => {
    if (!canManage) return;
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, is_active: !u.is_active } : u)));
    toast({ title: "Account status updated", variant: "success" });
  };

  const remove = (id: string, name: string) => {
    if (!isSuper) {
      toast({ title: "Permission denied", description: "Only Super Admin can delete user accounts.", variant: "danger" });
      return;
    }
    if (!confirm(`Permanently delete ${name}? This cannot be undone.`)) return;
    setUsers((prev) => prev.filter((u) => u.id !== id));
    toast({ title: "Account deleted", description: name, variant: "warning" });
  };

  const addUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuper) {
      toast({ title: "Permission denied", description: "Only Super Admin can create staff accounts.", variant: "danger" });
      return;
    }
    const id = "u" + uid();
    setUsers((prev) => [...prev, { id, full_name: form.full_name || "New User", email: form.email, role: form.role as any, department_id: form.department, is_active: true, created_at: new Date().toISOString() }]);
    toast({ title: "Account created", description: form.email, variant: "success" });
    setAddOpen(false);
    setForm({ full_name: "", email: "", role: "doctor", department: "d1" });
  };

  const exportCSV = () => {
    const rows = users.map((u) => ({
      id: u.id,
      full_name: u.full_name,
      email: u.email,
      role: u.role,
      department: u.department_id || "",
      status: u.is_active ? "Active" : "Deactivated",
      created_at: u.created_at,
    }));
    downloadFile(`users-${new Date().toISOString().slice(0, 10)}.csv`, toCSV(rows));
    toast({ title: "CSV downloaded", description: `${users.length} user records`, variant: "success" });
  };

  const cols: Column<User>[] = [
    { key: "full_name", header: "User", sortable: true, accessor: (r) => (
      <div className="flex items-center gap-3"><Avatar name={r.full_name} /><div><div className="font-medium text-slate-800">{r.full_name}</div><div className="text-xs text-slate-500">{r.email}</div></div></div>
    )},
    { key: "role", header: "Role", sortable: true, accessor: (r) => <span className="capitalize text-sm">{r.role.replace("_", " ")}</span> },
    { key: "department_id", header: "Department", accessor: (r) => <span className="text-sm text-slate-600">{r.department_id ? "Dept " + r.department_id.toUpperCase() : "—"}</span> },
    { key: "is_active", header: "Status", sortable: true, accessor: (r) => <StatusBadge status={r.is_active ? "Active" : "Deactivated"} /> },
    { key: "created_at", header: "Created", sortable: true, accessor: (r) => <span className="text-xs text-slate-500">{formatDate(r.created_at)}</span> },
  ];

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-10 w-full animate-pulse rounded-xl bg-slate-200" />
        {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-14 w-full animate-pulse rounded-xl bg-slate-100" />)}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs text-slate-500">
          {isSuper ? "Super Admin — full control (activate / deactivate / delete)." : canManage ? "Department Admin — can activate/deactivate within department." : "Read-only view."}
        </div>
        <div className="flex gap-2">
          {isSuper && <Button size="sm" onClick={() => setAddOpen(true)}><Icon.plus /> Add user</Button>}
          <Button variant="outline" size="sm" onClick={exportCSV}><Icon.download /> Export CSV</Button>
        </div>
      </div>
      <DataTable columns={cols} data={users} searchable searchKeys={["full_name", "email", "role"]} rowActions={(r) => (
        <DropdownMenu trigger={<Button variant="ghost" size="icon"><Icon.more /></Button>} items={[
          ...(canManage ? [{ label: r.is_active ? "Deactivate" : "Activate", onClick: () => toggle(r.id) }] : []),
          { label: "View profile", onClick: () => toast({ title: "Profile opened", description: r.full_name }) },
          { label: "Export as CSV", onClick: () => downloadFile(`user-${r.id}.csv`, toCSV([{ id: r.id, full_name: r.full_name, email: r.email, role: r.role, status: r.is_active ? "Active" : "Deactivated" }])) },
          ...(isSuper ? [{ label: "Delete account", onClick: () => remove(r.id, r.full_name), danger: true }] : []),
        ]} />
      )} />

      <Dialog open={addOpen} onClose={() => setAddOpen(false)} title="Create staff account" footer={<><Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button><Button onClick={addUser as any}>Create account</Button></>}>
        <form onSubmit={addUser} className="space-y-3">
          <Input label="Full name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Dr. Jane Smith" />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="jane@satcity.hosp" />
          <Select label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} options={[
            { value: "admin", label: "Department Admin" },
            { value: "doctor", label: "Doctor" },
            { value: "lab_tech", label: "Lab Technician" },
            { value: "pharmacist", label: "Pharmacist" },
            { value: "patient", label: "Patient" },
          ]} />
          <Select label="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} options={[
            { value: "d1", label: "Internal Medicine" },
            { value: "d2", label: "Pediatrics" },
            { value: "d3", label: "Laboratory" },
            { value: "d4", label: "Pharmacy" },
          ]} />
          <Alert variant="info">The new account will be created as Active. In production, this writes to Supabase `users` with RLS policies enforced.</Alert>
        </form>
      </Dialog>
    </div>
  );
}

function PatientsTable({ onOpen }: { onOpen?: (p: Patient) => void }) {
  const { patients, users } = useStore();
  const { toast } = useToast();
  const cols: Column<Patient>[] = [
    { key: "full_name", header: "Patient", sortable: true, accessor: (r) => (
      <div className="flex items-center gap-3"><Avatar name={r.full_name} /><div><div className="font-medium text-slate-800">{r.full_name}</div><div className="text-xs text-slate-500">{r.email}</div></div></div>
    )},
    { key: "age", header: "Age", sortable: true },
    { key: "blood_type", header: "Blood" },
    { key: "assigned_doctor_id", header: "Assigned doctor", accessor: (r) => {
      const doc = users.find((u) => u.id === r.assigned_doctor_id);
      return <span className="text-sm text-slate-700">{doc ? doc.full_name : "— unassigned —"}</span>;
    }},
    { key: "created_at", header: "Registered", sortable: true, accessor: (r) => <span className="text-xs text-slate-500">{formatDate(r.created_at)}</span> },
  ];
  return <DataTable columns={cols} data={patients} searchable searchKeys={["full_name", "email", "blood_type"]} rowActions={(r) => (
    <div className="flex justify-end gap-1">
      <Button variant="outline" size="sm" onClick={() => (onOpen ? onOpen(r) : toast({ title: "Opened " + r.full_name }))}>View</Button>
    </div>
  )} />;
}

function DoctorsTable() {
  const { users, setUsers } = useStore();
  const { toast } = useToast();
  const docs = users.filter((u) => u.role === "doctor");
  const toggleAvail = (id: string) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, availability_status: u.availability_status === "available" ? "busy" : "available" } : u)));
    toast({ title: "Availability toggled", description: "check-available-doctors edge function simulated.", variant: "success" });
  };
  const cols: Column<User>[] = [
    { key: "full_name", header: "Doctor", sortable: true, accessor: (r) => (
      <div className="flex items-center gap-3"><Avatar name={r.full_name} /><div><div className="font-medium text-slate-800">{r.full_name}</div><div className="text-xs text-slate-500">{r.email}</div></div></div>
    )},
    { key: "specialty", header: "Specialty", accessor: (r) => <div className="flex flex-wrap gap-1">{(r.specialty || []).map((s) => <Badge key={s} variant="info">{s}</Badge>)}</div> },
    { key: "availability_status", header: "Availability", accessor: (r) => <StatusBadge status={r.availability_status || "off-duty"} /> },
    { key: "active_patient_count", header: "Active patients", sortable: true },
  ];
  return <DataTable columns={cols} data={docs} searchable searchKeys={["full_name", "specialty"]} rowActions={(r) => (
    <Button variant="outline" size="sm" onClick={() => toggleAvail(r.id)}>Toggle availability</Button>
  )} />;
}

/* ===================== ADMIN DASHBOARD ===================== */
function AdminDashboard() {
  const { users, patients, emergencies } = useStore();
  const { user } = useAuth();
  const [active, setActive] = React.useState("overview");
  const deptPatients = patients; // department-scoped in production
  const deptStaff = users.filter((u) => u.department_id === user?.department_id);

  return (
    <div className="flex">
      <Sidebar
        title="Department Ops"
        subtitle="Admin · SatCity Hospital"
        accent="blue"
        active={active}
        onSelect={setActive}
        items={[
          { id: "overview", label: "Overview", icon: Icon.dashboard },
          { id: "staff", label: "Department Staff", icon: Icon.users, badge: deptStaff.length },
          { id: "patients", label: "Patients", icon: Icon.patient },
          { id: "ambulance", label: "Ambulance Bookings", icon: Icon.ambulance },
          { id: "emergency", label: "Emergency Requests", icon: Icon.alert, badge: emergencies.filter((e) => !e.is_resolved).length, badgeVariant: "danger" },
          { id: "approve", label: "Pending Approvals", icon: Icon.bell, badge: users.filter((u) => !u.is_active).length, badgeVariant: "warning" },
        ]}
      />
      <DashboardShell pageTitle="Department Admin" pageSubtitle="Manage staff, patients, and ambulance operations within your department.">
        {active === "overview" && (
          <>
            <EmergencyBanner />
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
              {[
                { k: "Department staff", v: deptStaff.length, sub: "Active accounts" },
                { k: "Patients", v: deptPatients.length, sub: "Registered in dept" },
                { k: "Pending approval", v: users.filter((u) => !u.is_active).length, sub: "Staff awaiting review" },
                { k: "Open emergencies", v: emergencies.filter((e) => !e.is_resolved).length, sub: "Realtime feed" },
              ].map((s) => (
                <Card key={s.k} className="tilt-card">
                  <CardContent className="p-5">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">{s.k}</div>
                    <div className="mt-2 text-3xl font-bold text-slate-900">{s.v}</div>
                    <div className="text-xs text-slate-500">{s.sub}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader><CardTitle>Staff</CardTitle><CardDescription>Department team members.</CardDescription></CardHeader>
                <CardContent className="space-y-2">
                  {deptStaff.slice(0, 5).map((u) => (
                    <div key={u.id} className="flex items-center gap-3 rounded-lg border border-slate-100 px-3 py-2">
                      <Avatar name={u.full_name} />
                      <div className="flex-1"><div className="text-sm font-medium text-slate-800">{u.full_name}</div><div className="text-xs capitalize text-slate-500">{u.role.replace("_", " ")}</div></div>
                      <StatusBadge status={u.is_active ? "Active" : "Deactivated"} />
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Emergency feed</CardTitle><CardDescription>Live emergency requests submitted via /emergency.</CardDescription></CardHeader>
                <CardContent className="space-y-2">
                  {emergencies.slice(0, 5).map((e) => (
                    <div key={e.id} className="rounded-lg border border-slate-100 px-3 py-2">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium text-slate-800">{e.location}</div>
                        <StatusBadge status={e.is_resolved ? "Resolved" : "Active"} />
                      </div>
                      <div className="text-xs text-slate-500">{e.description}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </>
        )}
        {active === "staff" && <UsersTable />}
        {active === "patients" && <PatientsTable />}
        {active === "ambulance" && <AmbulanceTable />}
        {active === "emergency" && <EmergencyTable />}
        {active === "approve" && <PendingApprovals />}
      </DashboardShell>
    </div>
  );
}

function PendingApprovals() {
  const { users, setUsers } = useStore();
  const { toast } = useToast();
  const pending = users.filter((u) => !u.is_active);
  const approve = (id: string) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, is_active: true } : u)));
    toast({ title: "Account activated", variant: "success" });
  };
  return (
    <Card>
      <CardHeader><CardTitle>Pending staff approvals</CardTitle><CardDescription>New registrations awaiting admin activation.</CardDescription></CardHeader>
      <CardContent className="space-y-2">
        {pending.length === 0 && <Alert variant="success">No pending approvals. Great job!</Alert>}
        {pending.map((u) => (
          <div key={u.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3">
            <Avatar name={u.full_name} />
            <div className="flex-1"><div className="text-sm font-medium text-slate-800">{u.full_name}</div><div className="text-xs capitalize text-slate-500">{u.role.replace("_", " ")} · {u.email}</div></div>
            <Button size="sm" onClick={() => approve(u.id)}>Approve</Button>
            <Button variant="ghost" size="sm">Deny</Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function EmergencyBanner() {
  const { emergencies } = useStore();
  const open = emergencies.filter((e) => !e.is_resolved);
  if (open.length === 0) return null;
  return (
    <div className="relative overflow-hidden rounded-2xl p-[2px]">
      <div className="moving-border absolute inset-0" />
      <div className="relative rounded-[14px] bg-white px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-red-500 banner-pulse" />
          <div className="text-sm font-semibold text-red-700">{open.length} ACTIVE EMERGENCY REQUEST(S) — see the Emergency Requests panel</div>
        </div>
      </div>
    </div>
  );
}

/* ===================== DOCTOR DASHBOARD ===================== */
function DoctorDashboard() {
  const { user } = useAuth();
  const { patients, notifications, setNotifications, setPatients } = useStore();
  const { toast } = useToast();
  const [active, setActive] = React.useState("overview");
  const [openPatient, setOpenPatient] = React.useState<Patient | null>(null);
  const myPatients = patients.filter((p) => p.assigned_doctor_id === user?.id);
  const myNotifs = notifications.filter((n) => n.recipient_id === user?.id && !n.is_read);
  const emergencyNotifs = notifications.filter((n) => n.recipient_id === user?.id && n.type === "emergency_available_patient" && !n.is_read);

  const acceptEmergency = (n: typeof notifications[number]) => {
    if (!n.patient_id) return;
    setPatients((prev) => prev.map((p) => (p.id === n.patient_id ? { ...p, assigned_doctor_id: user!.id } : p)));
    setNotifications((prev) => prev.map((x) => (x.patient_id === n.patient_id ? { ...x, is_read: true } : x)));
    toast({ title: "Patient assigned to you", description: "accept-emergency-patient edge function simulated.", variant: "success" });
  };

  const exportCsv = () => {
    const rows = myPatients.flatMap((p) => p.treatments.map((t) => ({ patient: p.full_name, diagnosis: t.illness_type, basis: t.basis_type, treatment: t.treatment_details, date: t.administered_at })));
    const header = "Patient,Diagnosis,Treatment basis,Treatment details,Date\n";
    const body = rows.map((r) => `"${r.patient}","${r.diagnosis}","${r.basis}","${r.treatment.replace(/"/g, '""')}","${r.date}"`).join("\n");
    const blob = new Blob([header + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `patient-records-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "CSV exported", variant: "success" });
  };

  return (
    <div className="flex">
      <Sidebar
        title="Clinical Console"
        subtitle="Doctor · SatCity Hospital"
        accent="teal"
        active={active}
        onSelect={setActive}
        items={[
          { id: "overview", label: "Overview", icon: Icon.dashboard },
          { id: "active", label: "Active Patients", icon: Icon.patient, badge: myPatients.length },
          { id: "history", label: "Patient History", icon: Icon.file },
          { id: "pharmacy", label: "Drug Lookup", icon: Icon.pill },
          { id: "notifications", label: "Notifications", icon: Icon.bell, badge: myNotifs.length, badgeVariant: "info" },
        ]}
      />
      <DashboardShell pageTitle={`Welcome, ${user?.full_name.split(" ")[0]}`} pageSubtitle="Your patients, treatments, and realtime notifications." actions={
        <>
          <Button variant="outline" size="sm" onClick={exportCsv}><Icon.download /> Download CSV</Button>
        </>
      }>
        {emergencyNotifs.length > 0 && (
          <div className="mb-4 relative overflow-hidden rounded-2xl p-[2px]">
            <div className="moving-border absolute inset-0" />
            <div className="relative rounded-[14px] bg-white px-5 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-2.5 w-2.5 rounded-full bg-red-500 banner-pulse" />
                  <div>
                    <div className="text-sm font-semibold text-red-700">Unassigned emergency patient available — {emergencyNotifs[0].specialty_context}</div>
                    <div className="text-xs text-slate-500">{emergencyNotifs[0].message}</div>
                  </div>
                </div>
                <Button variant="danger" size="sm" onClick={() => acceptEmergency(emergencyNotifs[0])}>Accept patient</Button>
              </div>
            </div>
          </div>
        )}

        {active === "overview" && (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              {[
                { k: "Active patients", v: myPatients.length },
                { k: "Treatments logged", v: myPatients.reduce((s, p) => s + p.treatments.length, 0) },
                { k: "Pending lab results", v: myPatients.reduce((s, p) => s + p.lab_tests_ordered.filter((t) => t.status === "Pending").length, 0) },
                { k: "Unread notifications", v: myNotifs.length },
              ].map((s) => (
                <Card key={s.k} className="tilt-card">
                  <CardContent className="p-5">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">{s.k}</div>
                    <div className="mt-2 text-3xl font-bold text-slate-900">{s.v}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="mt-4"><ActivePatients onOpen={setOpenPatient} /></div>
          </>
        )}
        {active === "active" && <ActivePatients onOpen={setOpenPatient} />}
        {active === "history" && <ActivePatients onOpen={setOpenPatient} />}
        {active === "pharmacy" && <PharmacyTable readOnly />}
        {active === "notifications" && <NotificationsPanel />}
      </DashboardShell>

      <Sheet open={!!openPatient} onClose={() => setOpenPatient(null)} title={`${openPatient?.full_name || ""} — Patient Profile`}>
        {openPatient && <PatientProfile patient={openPatient} onClose={() => setOpenPatient(null)} />}
      </Sheet>
    </div>
  );
}

function ActivePatients({ onOpen }: { onOpen: (p: Patient) => void }) {
  const { user } = useAuth();
  const { patients } = useStore();
  const mine = patients.filter((p) => p.assigned_doctor_id === user?.id);
  const cols: Column<Patient>[] = [
    { key: "full_name", header: "Patient", sortable: true, accessor: (r) => (
      <div className="flex items-center gap-3"><Avatar name={r.full_name} /><div><div className="font-medium text-slate-800">{r.full_name}</div><div className="text-xs text-slate-500">{r.email}</div></div></div>
    )},
    { key: "age", header: "Age", sortable: true },
    { key: "blood_type", header: "Blood" },
    { key: "treatments", header: "Latest treatment", accessor: (r) => <span className="text-sm text-slate-700">{r.treatments[r.treatments.length - 1]?.illness_type || "—"}</span> },
    { key: "basis", header: "Basis", accessor: (r) => r.treatments.length ? <TreatmentBadge type={r.treatments[r.treatments.length - 1].basis_type} /> : <span className="text-xs text-slate-400">—</span> },
  ];
  return <DataTable columns={cols} data={mine} searchable searchKeys={["full_name", "blood_type"]} rowActions={(r) => <Button variant="outline" size="sm" onClick={() => onOpen(r)}>Open profile</Button>} />;
}

function NotificationsPanel() {
  const { user } = useAuth();
  const { notifications, setNotifications } = useStore();
  const mine = notifications.filter((n) => n.recipient_id === user?.id);
  const markAll = () => setNotifications((prev) => prev.map((n) => (n.recipient_id === user?.id ? { ...n, is_read: true } : n)));
  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <div>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Realtime updates from Supabase Realtime channel.</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={markAll}>Mark all read</Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {mine.map((n) => (
          <div key={n.id} className="flex items-start gap-3 rounded-xl border border-slate-100 px-4 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 text-teal-700"><Icon.bell /></div>
            <div className="flex-1">
              <div className="text-sm font-medium text-slate-800">{n.message}</div>
              <div className="text-xs text-slate-500">{new Date(n.created_at).toLocaleString()} · {n.specialty_context || "General"}</div>
            </div>
            <Badge variant={n.is_read ? "default" : n.type === "emergency_available_patient" ? "danger" : "info"}>{n.is_read ? "Read" : "New"}</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/* ===================== PATIENT PROFILE ===================== */
function PatientProfile({ patient }: { patient: Patient; onClose?: () => void }) {
  const { toast } = useToast();
  const [tab, setTab] = React.useState("info");
  const tabs = [
    { id: "info", label: "Personal Info" },
    { id: "symptoms", label: "Symptom History" },
    { id: "lab", label: "Lab Results" },
    { id: "treatment", label: "Treatment History" },
    { id: "external", label: "External Reports" },
    { id: "doctor", label: "Assigned Doctor" },
  ];
  const { users } = useStore();
  const doc = users.find((u) => u.id === patient.assigned_doctor_id);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3">
        <Avatar name={patient.full_name} className="!h-11 !w-11 !text-base" />
        <div className="flex-1">
          <div className="font-semibold text-slate-900">{patient.full_name}</div>
          <div className="text-xs text-slate-500">Age {patient.age} · Blood {patient.blood_type} · {patient.phone}</div>
        </div>
      </div>
      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      {tab === "info" && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            { k: "Full name", v: patient.full_name },
            { k: "Age", v: String(patient.age) },
            { k: "Blood type", v: patient.blood_type },
            { k: "Phone", v: patient.phone },
            { k: "Email", v: patient.email },
            { k: "Emergency contact", v: patient.emergency_contact },
          ].map((f) => (
            <div key={f.k} className="rounded-xl border border-slate-100 p-3">
              <div className="text-xs uppercase tracking-wider text-slate-500">{f.k}</div>
              <div className="mt-1 text-sm font-medium text-slate-800">{f.v}</div>
            </div>
          ))}
        </div>
      )}

      {tab === "symptoms" && (
        <div className="space-y-3">
          {patient.symptoms.map((s) => (
            <div key={s.id} className="rounded-xl border border-slate-100 p-4">
              <div className="text-xs text-slate-500">{formatDate(s.at)}</div>
              <div className="mt-1 text-sm text-slate-800">{s.text}</div>
            </div>
          ))}
          <div className="mt-2">
            <div className="mb-2 text-sm font-semibold text-slate-800">Ordered lab tests</div>
            <div className="space-y-2">
              {patient.lab_tests_ordered.map((t) => (
                <div key={t.id} className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-2.5">
                  <span className="text-sm text-slate-800">{t.name}</span>
                  <StatusBadge status={t.status} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "lab" && (
        <div className="space-y-3">
          {patient.lab_results.length === 0 && <Alert variant="info">No lab results uploaded yet.</Alert>}
          {patient.lab_results.map((r) => (
            <div key={r.id} className="rounded-xl border border-slate-100 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">{r.diagnosed_condition}</div>
                  <div className="text-xs text-slate-500">Uploaded by {r.uploaded_by} · {formatDate(r.uploaded_at)}</div>
                </div>
                <Button variant="outline" size="sm" onClick={() => {
                  const content = `LAB RESULT REPORT\n==================\n\nPatient: ${patient.full_name}\nCondition: ${r.diagnosed_condition}\nUploaded by: ${r.uploaded_by}\nUploaded at: ${formatDate(r.uploaded_at)}\nFile: ${r.file_name}\n\n(Signed URL: https://satcity-hosp.supabase.co/storage/v1/object/sign/lab-results/${r.file_name}?token=demo)\n\nThis is a demo download. In production, this would be a signed PDF from Supabase Storage.`;
                  downloadFile(r.file_name.replace(/\.pdf$/i, ".txt"), content, "text/plain;charset=utf-8");
                  toast({ title: "Download started", description: r.file_name, variant: "success" });
                }}><Icon.download /> {r.file_name}</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "treatment" && (
        <div className="space-y-3">
          {patient.treatments.length === 0 && <Alert variant="info">No treatments recorded.</Alert>}
          {patient.treatments.map((t) => (
            <div key={t.id} className="rounded-xl border border-slate-100 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-semibold text-slate-900">{t.illness_type}</div>
                <TreatmentBadge type={t.basis_type} />
              </div>
              <div className="mt-1 text-sm text-slate-700">{t.treatment_details}</div>
              <div className="mt-2 text-xs text-slate-500">{t.doctor_name} · {t.doctor_specialty} · {formatDate(t.administered_at)}</div>
            </div>
          ))}
        </div>
      )}

      {tab === "external" && (
        <div className="space-y-3">
          {patient.external_reports.length === 0 && <Alert variant="info">No external reports.</Alert>}
          {patient.external_reports.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-4">
              <div>
                <div className="text-sm font-semibold text-slate-900">{r.title}</div>
                <div className="text-xs text-slate-500">{r.file_name} · {formatDate(r.uploaded_at)}</div>
              </div>
              <Button variant="outline" size="sm" onClick={() => {
                const content = `EXTERNAL REPORT: ${r.title}\n====================================\n\nFile: ${r.file_name}\nUploaded at: ${formatDate(r.uploaded_at)}\nSource: External hospital / imaging center\n\nSigned URL: https://satcity-hosp.supabase.co/storage/v1/object/sign/external-reports/${r.file_name}?token=demo\n\n(Demo download — in production, this would be the original file from Supabase Storage.)`;
                downloadFile(r.file_name.replace(/\.pdf$/i, ".txt"), content, "text/plain;charset=utf-8");
                toast({ title: "Download started", description: r.file_name, variant: "success" });
              }}><Icon.download /> Download</Button>
            </div>
          ))}
        </div>
      )}

      {tab === "doctor" && (
        <div className="rounded-xl border border-slate-100 p-4">
          {doc ? (
            <>
              <div className="flex items-center gap-3">
                <Avatar name={doc.full_name} className="!h-12 !w-12 !text-base" />
                <div>
                  <div className="font-semibold text-slate-900">{doc.full_name}</div>
                  <div className="text-xs text-slate-500">{(doc.specialty || []).join(" · ")}</div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StatusBadge status={doc.availability_status || "off-duty"} />
                <Badge variant="info">{doc.email}</Badge>
              </div>
            </>
          ) : <Alert variant="warning">No doctor assigned yet.</Alert>}
        </div>
      )}
    </div>
  );
}

/* ===================== LAB TECH DASHBOARD ===================== */
function LabTechDashboard() {
  const { user } = useAuth();
  const { patients, setPatients, setNotifications, users } = useStore();
  const { toast } = useToast();
  const [active, setActive] = React.useState("upload");
  const [form, setForm] = React.useState({ patientId: "", condition: "", fileName: "lab-report.pdf" });
  const [dragOver, setDragOver] = React.useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patientId || !form.condition) return;
    const nowIso = new Date().toISOString();
    setPatients((prev) => prev.map((p) => p.id === form.patientId ? {
      ...p,
      lab_results: [...p.lab_results, { id: uid(), diagnosed_condition: form.condition, file_name: form.fileName, uploaded_by: user!.full_name, uploaded_at: nowIso }],
      lab_tests_ordered: p.lab_tests_ordered.map((t) => t.status === "Pending" ? { ...t, status: "Results Uploaded" } : t),
    } : p));

    // Simulate smart-assignment edge function: find doctor whose specialty matches condition
    const condition = form.condition.toLowerCase();
    const specialist = users.filter((u) => u.role === "doctor" && u.availability_status === "available" && (u.specialty || []).some((s) => condition.includes(s.toLowerCase()) || s.toLowerCase().includes(condition))).sort((a, b) => (a.active_patient_count || 0) - (b.active_patient_count || 0))[0];
    if (specialist) {
      const patient = patients.find((p) => p.id === form.patientId);
      setPatients((prev) => prev.map((p) => p.id === form.patientId ? { ...p, assigned_doctor_id: specialist.id } : p));
      setNotifications((prev) => [...prev, { id: uid(), recipient_id: specialist.id, type: "assignment", message: `New patient ${patient?.full_name || ""} assigned (${form.condition}).`, specialty_context: (specialist.specialty || [])[0], patient_id: form.patientId, is_read: false, created_at: nowIso }]);
      toast({ title: "Result uploaded & patient assigned", description: `assign-patient-to-doctor → Dr. ${specialist.full_name}`, variant: "success" });
    } else {
      // broadcast emergency to all matching specialists
      users.filter((u) => u.role === "doctor").forEach((doc) => {
        setNotifications((prev) => [...prev, { id: uid(), recipient_id: doc.id, type: "emergency_available_patient", message: `Unassigned patient with ${form.condition}.`, specialty_context: form.condition, patient_id: form.patientId, is_read: false, created_at: nowIso }]);
      });
      toast({ title: "Result uploaded", description: "No available specialist — emergency broadcast sent.", variant: "warning" });
    }
    setForm({ patientId: "", condition: "", fileName: "lab-report.pdf" });
  };

  return (
    <div className="flex">
      <Sidebar
        title="Laboratory Suite"
        subtitle="Lab Technician · SatCity Hospital"
        accent="amber"
        active={active}
        onSelect={setActive}
        items={[
          { id: "upload", label: "Upload Result", icon: Icon.plus },
          { id: "patients", label: "Patient Lookup", icon: Icon.patient },
          { id: "history", label: "Upload History", icon: Icon.file },
        ]}
      />
      <DashboardShell pageTitle="Upload Lab Result" pageSubtitle="Uploading triggers the assign-patient-to-doctor Edge Function.">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>New lab result</CardTitle><CardDescription>Signed URL upload to Supabase Storage (simulated).</CardDescription></CardHeader>
            <CardContent>
              <form onSubmit={submit} className="space-y-4">
                <Select label="Patient" value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value })} options={[{ value: "", label: "Select a patient..." }, ...patients.map((p) => ({ value: p.id, label: `${p.full_name} · ${p.blood_type}` }))]} />
                <Input label="Diagnosed condition" value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })} placeholder="e.g. Cardiac Ischemia" />
                <Input label="File name" value={form.fileName} onChange={(e) => setForm({ ...form, fileName: e.target.value })} />
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) setForm({ ...form, fileName: f.name }); }}
                  className={cn("rounded-2xl border-2 border-dashed p-10 text-center transition", dragOver ? "border-amber-500 bg-amber-50" : "border-slate-200 bg-slate-50/50")}
                >
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-700"><Icon.file /></div>
                  <div className="text-sm font-medium text-slate-800">Drag &amp; drop a report file, or click to browse</div>
                  <div className="mt-1 text-xs text-slate-500">PDF · DICOM · Images — max 50MB</div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline">Cancel</Button>
                  <Button type="submit"><Icon.plus /> Upload &amp; assign</Button>
                </div>
              </form>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Recent uploads</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {patients.flatMap((p) => p.lab_results.map((r) => ({ ...r, patient: p.full_name }))).slice(-5).reverse().map((r) => (
                <div key={r.id} className="rounded-lg border border-slate-100 px-3 py-2">
                  <div className="text-sm font-medium text-slate-800">{r.diagnosed_condition}</div>
                  <div className="text-xs text-slate-500">{r.patient} · {r.file_name}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {active === "patients" && <PatientsTable />}
        {active === "history" && <PatientsTable />}
      </DashboardShell>
    </div>
  );
}

/* ===================== PHARMACIST DASHBOARD ===================== */
function PharmacistDashboard() {
  const { drugs, setDrugs } = useStore();
  const { toast } = useToast();
  const [active, setActive] = React.useState("inventory");
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({ name: "", category: "Antibiotic", description: "", quantity: 100 });

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const status = form.quantity === 0 ? "out of stock" : form.quantity < 10 ? "low" : "available";
    setDrugs((prev) => [...prev, { id: uid(), sanity_drug_id: "san-" + uid(), drug_name: form.name, category: form.category, description: form.description, quantity: form.quantity, status, updated_at: new Date().toISOString() }]);
    toast({ title: "Drug added", description: "Sanity document + Supabase inventory row created (simulated).", variant: "success" });
    setOpen(false);
    setForm({ name: "", category: "Antibiotic", description: "", quantity: 100 });
  };

  const updateQty = (id: string, qty: number) => {
    setDrugs((prev) => prev.map((d) => d.id === id ? { ...d, quantity: qty, status: qty === 0 ? "out of stock" : qty < 10 ? "low" : "available", updated_at: new Date().toISOString() } : d));
    toast({ title: "Stock updated", variant: "success" });
  };

  const markOOS = (id: string) => {
    setDrugs((prev) => prev.map((d) => d.id === id ? { ...d, quantity: 0, status: "out of stock", updated_at: new Date().toISOString() } : d));
    toast({ title: "Marked out of stock", variant: "warning" });
  };

  return (
    <div className="flex">
      <Sidebar
        title="Pharmacy Inventory"
        subtitle="Pharmacist · SatCity Hospital"
        accent="emerald"
        active={active}
        onSelect={setActive}
        items={[
          { id: "inventory", label: "Drug Inventory", icon: Icon.pill },
          { id: "low", label: "Low Stock Alerts", icon: Icon.alert, badge: drugs.filter((d) => d.status !== "available").length, badgeVariant: "warning" },
          { id: "categories", label: "Categories", icon: Icon.dashboard },
        ]}
      />
      <DashboardShell pageTitle="Drug Inventory" pageSubtitle="Sanity CMS content + Supabase live inventory." actions={
        <>
          <Button variant="outline" size="sm"><Icon.download /> Export CSV</Button>
          <Button size="sm" onClick={() => setOpen(true)}><Icon.plus /> Add Drug</Button>
        </>
      }>
        <PharmacyTable onUpdateQty={updateQty} onMarkOOS={markOOS} />
      </DashboardShell>

      <Dialog open={open} onClose={() => setOpen(false)} title="Add new drug" footer={<><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={add as any}>Add drug</Button></>}>
        <form onSubmit={add} className="space-y-3">
          <Input label="Drug name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} options={["Antibiotic", "Statin", "Antidiabetic", "Antacid", "Analgesic", "Antimigraine", "Other"].map((c) => ({ value: c, label: c }))} />
          <Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Input label="Opening quantity" type="number" value={form.quantity as any} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} />
        </form>
      </Dialog>
    </div>
  );
}

function PharmacyTable({ readOnly, onUpdateQty, onMarkOOS }: { readOnly?: boolean; onUpdateQty?: (id: string, q: number) => void; onMarkOOS?: (id: string) => void }) {
  const { drugs } = useStore();
  const [qtyEdit, setQtyEdit] = React.useState<Record<string, number>>({});
  const cols: Column<Drug>[] = [
    { key: "drug_name", header: "Drug", sortable: true, accessor: (r) => (
      <div>
        <div className="font-medium text-slate-800">{r.drug_name}</div>
        <div className="text-xs text-slate-500">{r.category} · {r.description}</div>
      </div>
    )},
    { key: "quantity", header: "Quantity", sortable: true, accessor: (r) => readOnly ? <span className="text-sm">{r.quantity}</span> : (
      <div className="flex items-center gap-1">
        <input type="number" value={qtyEdit[r.id] ?? r.quantity} onChange={(e) => setQtyEdit((prev) => ({ ...prev, [r.id]: Number(e.target.value) }))} className="h-8 w-20 rounded-md border border-slate-200 px-2 text-sm focus:border-emerald-600 focus:outline-none" />
        {!readOnly && onUpdateQty && <Button size="sm" variant="outline" onClick={() => onUpdateQty(r.id, qtyEdit[r.id] ?? r.quantity)}>Save</Button>}
      </div>
    )},
    { key: "status", header: "Status", sortable: true, accessor: (r) => <StatusBadge status={r.status} /> },
    { key: "updated_at", header: "Updated", accessor: (r) => <span className="text-xs text-slate-500">{formatDate(r.updated_at)}</span> },
  ];
  return <DataTable columns={cols} data={drugs} searchable searchKeys={["drug_name", "category"]} rowActions={readOnly ? undefined : (r) => (
    <div className="flex justify-end gap-1">
      <Button size="sm" variant="ghost" onClick={() => onMarkOOS && onMarkOOS(r.id)}>Mark OOS</Button>
    </div>
  )} />;
}

/* ===================== PATIENT DASHBOARD ===================== */
function PatientDashboard() {
  const { user } = useAuth();
  const { patients, users, bookings, setBookings } = useStore();
  const { toast } = useToast();
  const [active, setActive] = React.useState("overview");
  const [bookingOpen, setBookingOpen] = React.useState(false);
  const [step, setStep] = React.useState(1);
  const [booking, setBooking] = React.useState({ pickup: "", destination: "", date: "", time: "", reason: "" });

  const me = patients.find((p) => p.email === user?.email) || patients[0];
  const doc = users.find((u) => u.id === me?.assigned_doctor_id);
  const myBookings = bookings.filter((b) => b.patient_name === me?.full_name);

  const submitBooking = () => {
    setBookings((prev) => [...prev, { id: uid(), patient_name: me!.full_name, type: "scheduled", pickup_location: booking.pickup, destination: booking.destination, scheduled_time: new Date(`${booking.date}T${booking.time}`).toISOString(), reason: booking.reason, status: "Pending", created_at: new Date().toISOString() }]);
    toast({ title: "Ambulance booked", description: "Awaiting confirmation from dispatch.", variant: "success" });
    setBookingOpen(false);
    setStep(1);
    setBooking({ pickup: "", destination: "", date: "", time: "", reason: "" });
  };

  return (
    <div className="flex">
      <Sidebar
        title="My Health"
        subtitle="Patient · SatCity Hospital"
        accent="rose"
        active={active}
        onSelect={setActive}
        items={[
          { id: "overview", label: "Overview", icon: Icon.home },
          { id: "history", label: "Treatment History", icon: Icon.file },
          { id: "lab", label: "Lab Results", icon: Icon.lab },
          { id: "doctor", label: "My Doctor", icon: Icon.stethoscope },
          { id: "ambulance", label: "Ambulance Bookings", icon: Icon.ambulance, badge: myBookings.length },
        ]}
      />
      <DashboardShell pageTitle={`Hello, ${me?.full_name.split(" ")[0]}`} pageSubtitle="Your personal health records and upcoming appointments." actions={
        <Button variant="danger" size="sm" onClick={() => setBookingOpen(true)}><Icon.ambulance /> Book Ambulance</Button>
      }>
        {active === "overview" && me && (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Card className="tilt-card">
                <CardContent className="p-5">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Profile</div>
                  <div className="mt-2 flex items-center gap-3">
                    <Avatar name={me.full_name} className="!h-11 !w-11 !text-base" />
                    <div>
                      <div className="text-base font-semibold text-slate-900">{me.full_name}</div>
                      <div className="text-xs text-slate-500">Age {me.age} · Blood {me.blood_type}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="tilt-card">
                <CardContent className="p-5">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Assigned doctor</div>
                  {doc ? (
                    <div className="mt-2 flex items-center gap-3">
                      <Avatar name={doc.full_name} className="!h-11 !w-11 !text-base" />
                      <div>
                        <div className="text-base font-semibold text-slate-900">{doc.full_name}</div>
                        <div className="text-xs text-slate-500">{(doc.specialty || []).join(" · ")}</div>
                      </div>
                    </div>
                  ) : <div className="mt-2 text-sm text-slate-500">No doctor assigned yet.</div>}
                </CardContent>
              </Card>
              <Card className="tilt-card">
                <CardContent className="p-5">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Recent activity</div>
                  <div className="mt-2 text-3xl font-bold text-slate-900">{me.treatments.length}</div>
                  <div className="text-xs text-slate-500">treatments on record</div>
                </CardContent>
              </Card>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader><CardTitle>Treatments</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {me.treatments.slice(0, 4).map((t) => (
                    <div key={t.id} className="rounded-xl border border-slate-100 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-medium text-slate-800">{t.illness_type}</div>
                        <TreatmentBadge type={t.basis_type} />
                      </div>
                      <div className="mt-1 text-xs text-slate-500">{t.treatment_details}</div>
                    </div>
                  ))}
                  {me.treatments.length === 0 && <Alert variant="info">No treatments yet.</Alert>}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Lab results</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {me.lab_results.map((r) => (
                    <div key={r.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-3">
                      <div>
                        <div className="text-sm font-medium text-slate-800">{r.diagnosed_condition}</div>
                        <div className="text-xs text-slate-500">{r.file_name} · {formatDate(r.uploaded_at)}</div>
                      </div>
                      <Button variant="outline" size="sm"><Icon.download /></Button>
                    </div>
                  ))}
                  {me.lab_results.length === 0 && <Alert variant="info">No lab results yet.</Alert>}
                </CardContent>
              </Card>
            </div>
          </>
        )}
        {active === "history" && me && (
          <Card>
            <CardHeader><CardTitle>Treatment history</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {me.treatments.map((t) => (
                <div key={t.id} className="rounded-xl border border-slate-100 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm font-semibold text-slate-900">{t.illness_type}</div>
                    <TreatmentBadge type={t.basis_type} />
                  </div>
                  <div className="mt-1 text-sm text-slate-700">{t.treatment_details}</div>
                  <div className="mt-2 text-xs text-slate-500">{t.doctor_name} · {formatDate(t.administered_at)}</div>
                </div>
              ))}
              {me.treatments.length === 0 && <Alert variant="info">No treatments yet.</Alert>}
            </CardContent>
          </Card>
        )}
        {active === "lab" && me && (
          <Card>
            <CardHeader><CardTitle>Lab results</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {me.lab_results.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-4">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{r.diagnosed_condition}</div>
                    <div className="text-xs text-slate-500">Uploaded by {r.uploaded_by} · {formatDate(r.uploaded_at)}</div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => {
                    const content = `LAB RESULT — ${r.diagnosed_condition}\n====================================\n\nPatient: ${me.full_name}\nDiagnosis: ${r.diagnosed_condition}\nUploaded by: ${r.uploaded_by}\nUploaded at: ${formatDate(r.uploaded_at)}\nFile: ${r.file_name}\n\n(Demo signed URL download from Supabase Storage.)`;
                    downloadFile(r.file_name.replace(/\.pdf$/i, ".txt"), content, "text/plain;charset=utf-8");
                    toast({ title: "Download started", description: r.file_name, variant: "success" });
                  }}><Icon.download /> {r.file_name}</Button>
                </div>
              ))}
              {me.lab_results.length === 0 && <Alert variant="info">No lab results yet.</Alert>}
            </CardContent>
          </Card>
        )}
        {active === "doctor" && me && (
          <Card>
            <CardHeader><CardTitle>My doctor</CardTitle></CardHeader>
            <CardContent>
              {doc ? (
                <div className="flex flex-wrap items-center gap-4">
                  <Avatar name={doc.full_name} className="!h-16 !w-16 !text-xl" />
                  <div className="flex-1">
                    <div className="text-lg font-semibold text-slate-900">{doc.full_name}</div>
                    <div className="text-sm text-slate-500">{(doc.specialty || []).join(" · ")}</div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <StatusBadge status={doc.availability_status || "off-duty"} />
                      <Badge variant="info">{doc.email}</Badge>
                    </div>
                  </div>
                </div>
              ) : <Alert variant="warning">No doctor assigned yet. You will be notified on assignment.</Alert>}
            </CardContent>
          </Card>
        )}
        {active === "ambulance" && <AmbulanceTable mine />}
      </DashboardShell>

      <Dialog open={bookingOpen} onClose={() => setBookingOpen(false)} title="Book a scheduled ambulance" footer={
        step === 3 ? <><Button variant="outline" onClick={() => setStep(2)}>Back</Button><Button onClick={submitBooking}>Confirm booking</Button></> :
        step === 2 ? <><Button variant="outline" onClick={() => setStep(1)}>Back</Button><Button onClick={() => setStep(3)}>Continue</Button></> :
        <><Button variant="outline" onClick={() => setBookingOpen(false)}>Cancel</Button><Button onClick={() => setStep(2)}>Continue</Button></>
      }>
        <div className="mb-4 flex items-center gap-2">
          {[1, 2, 3].map((n) => (
            <div key={n} className={cn("flex-1 rounded-full px-3 py-1.5 text-center text-xs font-medium", step >= n ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-500")}>Step {n}</div>
          ))}
        </div>
        {step === 1 && (
          <div className="space-y-3">
            <Input label="Pickup location" value={booking.pickup} onChange={(e) => setBooking({ ...booking, pickup: e.target.value })} placeholder="123 Main St, SatCity" />
            <Input label="Destination" value={booking.destination} onChange={(e) => setBooking({ ...booking, destination: e.target.value })} placeholder="SatCity Hospital" />
          </div>
        )}
        {step === 2 && (
          <div className="grid grid-cols-2 gap-3">
            <Input label="Date" type="date" value={booking.date} onChange={(e) => setBooking({ ...booking, date: e.target.value })} />
            <Input label="Time" type="time" value={booking.time} onChange={(e) => setBooking({ ...booking, time: e.target.value })} />
          </div>
        )}
        {step === 3 && (
          <div className="space-y-3">
            <Textarea label="Reason for transport" value={booking.reason} onChange={(e) => setBooking({ ...booking, reason: e.target.value })} placeholder="e.g. Routine follow-up, requires assistance." />
            <Alert variant="info">Summary: {booking.pickup} → {booking.destination} on {booking.date} at {booking.time}.</Alert>
          </div>
        )}
      </Dialog>
    </div>
  );
}

/* ===================== AMBULANCE / EMERGENCY TABLES ===================== */
function AmbulanceTable({ mine }: { mine?: boolean }) {
  const { bookings, setBookings } = useStore();
  const { toast } = useToast();
  const list = bookings;
  const advance = (id: string) => {
    const order: AmbulanceBooking["status"][] = ["Pending", "Confirmed", "En Route", "Completed"];
    setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: order[Math.min(order.indexOf(b.status) + 1, order.length - 1)] } : b));
    toast({ title: "Status advanced", variant: "success" });
  };
  const cols: Column<AmbulanceBooking>[] = [
    { key: "patient_name", header: "Patient" },
    { key: "pickup_location", header: "Pickup", accessor: (r) => <span className="text-sm text-slate-700">{r.pickup_location}</span> },
    { key: "destination", header: "Destination", accessor: (r) => <span className="text-sm text-slate-700">{r.destination}</span> },
    { key: "scheduled_time", header: "Scheduled", sortable: true, accessor: (r) => <span className="text-xs text-slate-500">{formatDate(r.scheduled_time)}</span> },
    { key: "status", header: "Status", sortable: true, accessor: (r) => <StatusBadge status={r.status} /> },
  ];
  return <DataTable columns={cols} data={list} searchable searchKeys={["patient_name", "pickup_location", "destination"]} rowActions={(r) => mine ? <Button variant="ghost" size="sm">Details</Button> : <Button variant="outline" size="sm" onClick={() => advance(r.id)}>Advance status</Button>} />;
}

function EmergencyTable() {
  const { emergencies, setEmergencies } = useStore();
  const { user } = useAuth();
  const { toast } = useToast();
  const handle = (id: string) => {
    setEmergencies((prev) => prev.map((e) => e.id === id ? { ...e, is_resolved: true, handled_by: user?.full_name || "Admin" } : e));
    toast({ title: "Marked as handled", variant: "success" });
  };
  const cols: Column<EmergencyRequest>[] = [
    { key: "caller_name", header: "Caller" },
    { key: "location", header: "Location", accessor: (r) => <span className="text-sm text-slate-700">{r.location}</span> },
    { key: "description", header: "Incident", accessor: (r) => <span className="text-sm text-slate-700">{r.description}</span> },
    { key: "created_at", header: "Created", sortable: true, accessor: (r) => <span className="text-xs text-slate-500">{formatDate(r.created_at)}</span> },
    { key: "is_resolved", header: "Status", accessor: (r) => <StatusBadge status={r.is_resolved ? "Resolved" : "Active"} /> },
    { key: "handled_by", header: "Handled by", accessor: (r) => <span className="text-xs text-slate-500">{r.handled_by || "—"}</span> },
  ];
  return <DataTable columns={cols} data={emergencies} searchable searchKeys={["caller_name", "location", "description"]} rowActions={(r) => !r.is_resolved && <Button size="sm" onClick={() => handle(r.id)}>Mark handled</Button>} />;
}

import { Link, useNavigate } from "react-router-dom";
import { useHospital } from "../lib/store";
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Avatar, DataTable } from "../components/ui/primitives";
import { BentoGrid, BentoItem, Stat, EmergencyBanner, AnimatedNumber } from "../components/aceternity";
import {
  Users, Stethoscope, FlaskConical, Pill, Ambulance, AlertTriangle,
  Activity, TrendingUp, Clock, ArrowUpRight, Plus, CalendarClock,
  Building2, FileText,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

// ============ SUPER ADMIN — Bento Grid overview ============
export function SuperAdminOverview() {
  const { users, doctors, patients, labResults, ambulanceBookings, drugs, departments } = useHospital();
  const stats = {
    totalUsers: users.length,
    activeStaff: users.filter((u) => u.role !== "patient" && u.is_active).length,
    totalPatients: patients.length,
    activeDoctors: doctors.filter((d) => d.availability_status === "available").length,
    labToday: labResults.filter((l) => Date.now() - new Date(l.uploaded_at).getTime() < 864e5).length,
    emergencyPending: ambulanceBookings.filter((b) => b.type === "emergency" && !b.is_resolved).length,
    drugsLow: drugs.filter((d) => d.status === "low" || d.status === "out_of_stock").length,
  };

  return (
    <div className="space-y-6 animate-float-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Platform overview</h1>
          <p className="text-sm text-neutral-500 mt-1">Full visibility across all departments and users.</p>
        </div>
        <Badge variant="outline" className="border-neutral-900 text-neutral-900">
          <span className="h-1.5 w-1.5 rounded-full bg-neutral-900" /> Super Admin
        </Badge>
      </div>

      <BentoGrid>
        <BentoItem span={2} className="bg-gradient-to-br from-neutral-900 to-neutral-700 text-white border-neutral-800">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-wide text-white/60">Platform Health</div>
              <div className="mt-2 text-3xl font-semibold"><AnimatedNumber value={stats.totalUsers} /> users active</div>
              <div className="mt-1 text-sm text-white/70">{stats.activeStaff} staff across {departments.length} departments</div>
            </div>
            <TrendingUp size={40} className="text-white/30" />
          </div>
          <div className="mt-6 grid grid-cols-4 gap-3">
            {[
              { l: "Departments", v: departments.length },
              { l: "Doctors", v: doctors.length },
              { l: "Patients", v: patients.length },
              { l: "Lab Techs", v: users.filter((u) => u.role === "lab_tech").length },
            ].map((x) => (
              <div key={x.l} className="rounded-lg bg-white/5 border border-white/10 p-3">
                <div className="text-xs text-white/60">{x.l}</div>
                <div className="mt-0.5 text-lg font-semibold">{x.v}</div>
              </div>
            ))}
          </div>
        </BentoItem>

        <BentoItem>
          <Stat label="Active doctors" value={<AnimatedNumber value={stats.activeDoctors} />} trend="All specialists available" icon={<Stethoscope size={18} />} />
        </BentoItem>

        <BentoItem>
          <Stat label="Lab results today" value={<AnimatedNumber value={stats.labToday} />} icon={<FlaskConical size={18} />} />
        </BentoItem>

        <BentoItem className={stats.emergencyPending > 0 ? "border-red-200 bg-red-50/30" : ""}>
          <Stat
            label="Emergency pending"
            value={<span className={stats.emergencyPending > 0 ? "text-red-600" : ""}>{stats.emergencyPending}</span>}
            icon={<Ambulance size={18} />}
          />
          {stats.emergencyPending > 0 && (
            <Link to="/dashboard/ambulance" className="mt-2 inline-flex items-center text-xs font-medium text-red-700 hover:text-red-900">
              Review emergencies <ArrowUpRight size={12} className="ml-1" />
            </Link>
          )}
        </BentoItem>

        <BentoItem className={stats.drugsLow > 0 ? "border-amber-200 bg-amber-50/30" : ""}>
          <Stat
            label="Low-stock drugs"
            value={<span className={stats.drugsLow > 0 ? "text-amber-600" : ""}>{stats.drugsLow}</span>}
            icon={<Pill size={18} />}
          />
        </BentoItem>

        <BentoItem span={2}>
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold text-neutral-900">Recent activity</div>
            <Link to="/dashboard/audit" className="text-xs text-neutral-500 hover:text-neutral-900">View all</Link>
          </div>
          <div className="space-y-2">
            {labResults.slice(-5).reverse().map((l) => {
              const pat = patients.find((p) => p.id === l.patient_id);
              return (
                <div key={l.id} className="flex items-center gap-3 text-xs p-2 rounded-md hover:bg-neutral-50">
                  <FlaskConical size={14} className="text-purple-600" />
                  <div className="flex-1">
                    <span className="font-medium text-neutral-900">{l.technician_name}</span>
                    <span className="text-neutral-500"> uploaded result for </span>
                    <span className="font-medium">{pat?.full_name}</span>
                    <span className="text-neutral-500"> — {l.diagnosed_condition}</span>
                  </div>
                  <span className="text-neutral-400">{formatDistanceToNow(new Date(l.uploaded_at), { addSuffix: true })}</span>
                </div>
              );
            })}
          </div>
        </BentoItem>
      </BentoGrid>

      {/* Quick access grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "All users", to: "/dashboard/users", icon: <Users size={18} />, count: users.length },
          { label: "Departments", to: "/dashboard/departments", icon: <Building2 size={18} />, count: departments.length },
          { label: "All doctors", to: "/dashboard/doctors", icon: <Stethoscope size={18} />, count: doctors.length },
          { label: "All patients", to: "/dashboard/patients", icon: <Activity size={18} />, count: patients.length },
        ].map((q) => (
          <Link key={q.label} to={q.to} className="block">
            <Card className="p-4 hover:border-neutral-300 hover:shadow-sm transition-all">
              <div className="flex items-center justify-between">
                <div className="h-9 w-9 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-700">{q.icon}</div>
                <ArrowUpRight size={14} className="text-neutral-400" />
              </div>
              <div className="mt-3 text-xs text-neutral-500">{q.label}</div>
              <div className="text-lg font-semibold text-neutral-900">{q.count}</div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ============ ADMIN — Department-scoped overview ============
export function AdminOverview() {
  const { currentUser, users, doctors, patients, labResults, ambulanceBookings, drugs } = useHospital();
  if (!currentUser) return null;
  const deptId = currentUser.department_id;
  const deptUsers = users.filter((u) => u.department_id === deptId);
  const deptDoctors = doctors.filter((d) => d.department_id === deptId);
  const deptPatients = patients.filter((p) => p.department_id === deptId);
  const deptLabResults = labResults.filter((l) => deptPatients.some((p) => p.id === l.patient_id));
  const pendingEmergencies = ambulanceBookings.filter((b) => b.type === "emergency" && !b.is_resolved);

  const deptName = { "d-cardio": "Cardiology", "d-neuro": "Neurology", "d-peds": "Pediatrics", "d-ortho": "Orthopedics" }[deptId ?? ""] ?? "Department";

  return (
    <div className="space-y-6 animate-float-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">{deptName} Department</h1>
          <p className="text-sm text-neutral-500 mt-1">Manage staff and patients in your department.</p>
        </div>
        <Badge variant="info"><span className="h-1.5 w-1.5 rounded-full bg-blue-600" /> Admin</Badge>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card className="p-5"><Stat label="Department staff" value={deptUsers.length} icon={<Users size={18} />} /></Card>
        <Card className="p-5"><Stat label="Doctors" value={deptDoctors.length} icon={<Stethoscope size={18} />} /></Card>
        <Card className="p-5"><Stat label="Patients" value={deptPatients.length} icon={<Activity size={18} />} /></Card>
        <Card className="p-5"><Stat label="Lab results" value={deptLabResults.length} icon={<FlaskConical size={18} />} /></Card>
      </div>

      {pendingEmergencies.length > 0 && (
        <EmergencyBanner
          title={`${pendingEmergencies.length} emergency request${pendingEmergencies.length > 1 ? "s" : ""} pending`}
          description="Review and dispatch in the Ambulance section."
          onAccept={() => {}}
          onDismiss={() => {}}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Department doctors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-3">
            {deptDoctors.map((d) => (
              <Link key={d.id} to={`/dashboard/doctors/${d.id}`} className="flex items-center gap-3 p-3 rounded-lg border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 transition-colors">
                <Avatar name={d.full_name} size="md" />
                <div className="flex-1">
                  <div className="font-medium text-sm text-neutral-900">{d.full_name}</div>
                  <div className="text-xs text-neutral-500">{d.specialty.join(", ")}</div>
                </div>
                <Badge variant={d.availability_status === "available" ? "success" : d.availability_status === "busy" ? "warning" : "default"}>
                  {d.availability_status.replace("_", " ")}
                </Badge>
              </Link>
            ))}
            {deptDoctors.length === 0 && <div className="col-span-2 text-center text-sm text-neutral-500 py-8">No doctors in this department yet.</div>}
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Low-stock drugs</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {drugs.filter((d) => d.status !== "available").slice(0, 4).map((d) => (
                <div key={d.id} className="flex items-center justify-between text-sm py-2 border-b border-neutral-100 last:border-0">
                  <div>
                    <div className="font-medium text-neutral-900">{d.drug_name}</div>
                    <div className="text-xs text-neutral-500">{d.category}</div>
                  </div>
                  <Badge variant={d.status === "out_of_stock" ? "danger" : "warning"}>{d.status === "out_of_stock" ? "Out of stock" : `Low (${d.quantity})`}</Badge>
                </div>
              ))}
              {drugs.filter((d) => d.status !== "available").length === 0 && <div className="text-sm text-neutral-500 text-center py-4">All stock levels healthy.</div>}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Recent patients</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {deptPatients.slice(0, 4).map((p) => (
                <Link key={p.id} to={`/dashboard/patients/${p.id}`} className="flex items-center gap-3 py-2 border-b border-neutral-100 last:border-0 hover:bg-neutral-50 px-2 -mx-2 rounded">
                  <Avatar name={p.full_name} size="sm" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-neutral-900">{p.full_name}</div>
                    <div className="text-xs text-neutral-500">{p.blood_type} · {p.symptoms.length} symptom record(s)</div>
                  </div>
                  <ArrowUpRight size={14} className="text-neutral-400" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ============ DOCTOR overview ============
export function DoctorOverview() {
  const { currentUser, currentUserDoctor, patients, treatments, labResults, assignments, notifications, acceptEmergency, markNotificationRead } = useHospital();
  const navigate = useNavigate();
  if (!currentUser || !currentUserDoctor) return null;

  const myAssignments = assignments.filter((a) => a.doctor_id === currentUser.id && a.status === "active");
  const myPatientIds = new Set(myAssignments.map((a) => a.patient_id));
  const myPatients = patients.filter((p) => myPatientIds.has(p.id));
  const myTreatments = treatments.filter((t) => t.doctor_id === currentUser.id);
  const myNotifs = notifications.filter((n) => n.recipient_id === currentUser.id).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const emergencyNotifs = myNotifs.filter((n) => n.type === "emergency_available_patient" && !n.is_resolved);

  return (
    <div className="space-y-6 animate-float-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Welcome, {currentUser.full_name}</h1>
          <p className="text-sm text-neutral-500 mt-1">{currentUserDoctor.specialty.join(" · ")}</p>
        </div>
        <Badge variant="success"><span className="h-1.5 w-1.5 rounded-full bg-emerald-600" /> Doctor</Badge>
      </div>

      {emergencyNotifs.map((n) => (
        <EmergencyBanner
          key={n.id}
          title={n.message}
          description="First to accept is auto-assigned to the patient."
          onAccept={() => { acceptEmergency(n.id, currentUser.id); }}
          onDismiss={() => markNotificationRead(n.id)}
        />
      ))}

      <div className="grid md:grid-cols-4 gap-4">
        <Card className="p-5"><Stat label="Active patients" value={<AnimatedNumber value={myPatients.length} />} icon={<Users size={18} />} /></Card>
        <Card className="p-5"><Stat label="Treatments logged" value={myTreatments.length} icon={<Activity size={18} />} /></Card>
        <Card className="p-5"><Stat label="Lab results" value={labResults.filter((l) => myPatientIds.has(l.patient_id)).length} icon={<FlaskConical size={18} />} /></Card>
        <Card className="p-5"><Stat label="Notifications" value={myNotifs.filter((n) => !n.is_read).length} icon={<Clock size={18} />} /></Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Your active patients</CardTitle>
            <Button size="sm" variant="outline" onClick={() => navigate("/dashboard/patients")}>View all</Button>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={myPatients}
            columns={[
              { key: "full_name", header: "Patient", sortable: true, cell: (p) => (
                <div className="flex items-center gap-3">
                  <Avatar name={p.full_name} size="sm" />
                  <div>
                    <div className="font-medium text-neutral-900">{p.full_name}</div>
                    <div className="text-xs text-neutral-500">{p.blood_type} · Age {new Date().getFullYear() - new Date(p.date_of_birth).getFullYear()}</div>
                  </div>
                </div>
              )},
              { key: "symptoms", header: "Latest symptom", cell: (p) => <span className="text-xs">{p.symptoms[p.symptoms.length - 1]?.text.slice(0, 50) ?? "—"}...</span> },
              { key: "status", header: "Lab status", cell: (p) => {
                const latest = p.symptoms[p.symptoms.length - 1];
                return latest?.lab_test_status === "Results Uploaded" ? <Badge variant="success">Uploaded</Badge> : <Badge variant="warning">Pending</Badge>;
              }},
              { key: "actions", header: "", cell: (p) => (
                <Link to={`/dashboard/patients/${p.id}`}><Button size="sm" variant="outline">Open</Button></Link>
              )},
            ]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Recent notifications</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {myNotifs.slice(0, 5).map((n) => (
              <div key={n.id} className={`flex items-center gap-3 p-3 rounded-lg border text-sm ${n.is_read ? "border-neutral-100 bg-neutral-50/50" : "border-blue-200 bg-blue-50/40"}`}>
                <div className={`h-2 w-2 rounded-full ${n.is_read ? "bg-neutral-300" : "bg-blue-500"}`} />
                <div className="flex-1 text-neutral-700">{n.message}</div>
                <div className="text-xs text-neutral-500">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</div>
              </div>
            ))}
            {myNotifs.length === 0 && <div className="text-sm text-neutral-500 text-center py-6">No notifications yet.</div>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============ LAB TECH overview ============
export function LabTechOverview() {
  const { currentUser, labResults, patients } = useHospital();
  if (!currentUser) return null;
  const myResults = labResults.filter((l) => l.technician_id === currentUser.id);

  return (
    <div className="space-y-6 animate-float-up">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Lab Technician Dashboard</h1>
        <p className="text-sm text-neutral-500 mt-1">Upload results. Each upload triggers smart patient assignment.</p>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-5"><Stat label="My uploads" value={myResults.length} icon={<FlaskConical size={18} />} /></Card>
        <Card className="p-5"><Stat label="Total patients" value={patients.length} icon={<Users size={18} />} /></Card>
        <Card className="p-5"><Stat label="This week" value={myResults.filter((r) => Date.now() - new Date(r.uploaded_at).getTime() < 7 * 864e5).length} icon={<Activity size={18} />} /></Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Quick action</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-neutral-600 mb-4">Upload a new lab result. The diagnosed condition will be matched to an available specialist.</p>
            <Link to="/dashboard/upload"><Button className="w-full"><Plus size={16} /> Upload new result</Button></Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Recent uploads</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {myResults.slice(-5).reverse().map((r) => {
                const pat = patients.find((p) => p.id === r.patient_id);
                return (
                  <div key={r.id} className="flex items-center justify-between py-2 text-sm border-b border-neutral-100 last:border-0">
                    <div>
                      <div className="font-medium text-neutral-900">{pat?.full_name}</div>
                      <div className="text-xs text-neutral-500">{r.diagnosed_condition}</div>
                    </div>
                    <span className="text-xs text-neutral-500">{format(new Date(r.uploaded_at), "MMM d")}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ============ PHARMACIST overview ============
export function PharmacistOverview() {
  const { drugs } = useHospital();
  const available = drugs.filter((d) => d.status === "available").length;
  const low = drugs.filter((d) => d.status === "low").length;
  const out = drugs.filter((d) => d.status === "out_of_stock").length;

  return (
    <div className="space-y-6 animate-float-up">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Pharmacy Inventory</h1>
        <p className="text-sm text-neutral-500 mt-1">Manage drug stock, add new entries, and flag low-stock items.</p>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-5"><Stat label="Total drugs" value={drugs.length} icon={<Pill size={18} />} /></Card>
        <Card className="p-5"><Stat label="In stock" value={available} icon={<Activity size={18} />} /></Card>
        <Card className="p-5 border-amber-200"><Stat label="Needs attention" value={low + out} icon={<AlertTriangle size={18} />} /></Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Inventory at a glance</CardTitle>
            <Link to="/dashboard/drugs"><Button size="sm">Manage inventory</Button></Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {drugs.slice(0, 6).map((d) => (
              <div key={d.id} className="flex items-center justify-between py-2 text-sm border-b border-neutral-100 last:border-0">
                <div>
                  <div className="font-medium text-neutral-900">{d.drug_name}</div>
                  <div className="text-xs text-neutral-500">{d.category} · {d.quantity} units</div>
                </div>
                <Badge variant={d.status === "available" ? "success" : d.status === "low" ? "warning" : "danger"}>
                  {d.status === "out_of_stock" ? "Out of stock" : d.status === "low" ? `Low (${d.quantity})` : "Available"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============ PATIENT overview ============
export function PatientOverview() {
  const { currentUser, currentUserPatient, treatments, labResults, assignments, doctors, ambulanceBookings } = useHospital();
  if (!currentUser || !currentUserPatient) return null;

  const myAssignments = assignments.filter((a) => a.patient_id === currentUser.id);
  const myDoctorId = myAssignments[myAssignments.length - 1]?.doctor_id;
  const myDoctor = doctors.find((d) => d.id === myDoctorId);
  const myTreatments = treatments.filter((t) => t.patient_id === currentUser.id);
  const myLabs = labResults.filter((l) => l.patient_id === currentUser.id);
  const myBookings = ambulanceBookings.filter((b) => b.patient_id === currentUser.id);

  return (
    <div className="space-y-6 animate-float-up">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Hello, {currentUser.full_name.split(" ")[0]}</h1>
        <p className="text-sm text-neutral-500 mt-1">Your health summary at SatCity Hospital.</p>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card className="p-5"><Stat label="Blood type" value={currentUserPatient.blood_type} icon={<Activity size={18} />} /></Card>
        <Card className="p-5"><Stat label="Treatments" value={myTreatments.length} icon={<FileText size={18} />} /></Card>
        <Card className="p-5"><Stat label="Lab results" value={myLabs.length} icon={<FlaskConical size={18} />} /></Card>
        <Card className="p-5"><Stat label="Ambulance trips" value={myBookings.length} icon={<Ambulance size={18} />} /></Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Your assigned doctor</CardTitle></CardHeader>
          <CardContent>
            {myDoctor ? (
              <div className="flex items-center gap-3">
                <Avatar name={myDoctor.full_name} size="lg" />
                <div className="flex-1">
                  <div className="font-semibold text-neutral-900">{myDoctor.full_name}</div>
                  <div className="text-sm text-neutral-500">{myDoctor.specialty.join(", ")}</div>
                  <Badge variant={myDoctor.availability_status === "available" ? "success" : "warning"} className="mt-2">
                    {myDoctor.availability_status === "available" ? "Available now" : "Currently unavailable"}
                  </Badge>
                </div>
                <Link to="/dashboard/doctor"><Button size="sm" variant="outline">View profile</Button></Link>
              </div>
            ) : (
              <p className="text-sm text-neutral-500">No doctor assigned yet. Your lab results will trigger smart assignment.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Quick actions</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Link to="/dashboard/ambulance" className="block">
              <Button variant="outline" className="w-full justify-start"><CalendarClock size={16} /> Book scheduled ambulance</Button>
            </Link>
            <Link to="/dashboard/profile" className="block">
              <Button variant="outline" className="w-full justify-start"><FileText size={16} /> View my profile</Button>
            </Link>
            <Link to="/dashboard/treatments" className="block">
              <Button variant="outline" className="w-full justify-start"><Activity size={16} /> My treatment history</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {myTreatments.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Recent treatments</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {myTreatments.slice(-3).reverse().map((t) => (
                <div key={t.id} className="p-3 rounded-lg border border-neutral-200">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-neutral-900">{t.illness_type}</div>
                    <Badge variant={t.basis_type === "lab_confirmed" ? "info" : t.basis_type === "external_report" ? "teal" : "warning"}>
                      {t.basis_type === "lab_confirmed" ? "Lab-confirmed" : t.basis_type === "external_report" ? "External scan" : "Doctor experience"}
                    </Badge>
                  </div>
                  <div className="text-sm text-neutral-600 mt-1">{t.treatment_details}</div>
                  <div className="text-xs text-neutral-500 mt-2">{t.doctor_name} · {format(new Date(t.administered_at), "MMM d, yyyy")}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

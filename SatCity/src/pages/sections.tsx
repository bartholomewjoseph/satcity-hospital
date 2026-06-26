import { useState, FormEvent } from "react";
import { useParams, Link } from "react-router-dom";
import { useHospital, Role } from "../lib/store";
import {
  Card, CardContent, CardHeader, CardTitle, Badge, Button, Avatar,
  DataTable, Tabs, Input, Label, Select, Textarea, Dialog, Dropdown,
} from "../components/ui/primitives";
import { Dropzone, Stat, MovingBorderCard } from "../components/aceternity";
import {
  Download, Plus, MoreVertical, FileText, FlaskConical,
  Bell, Ambulance, MapPin, CheckCircle2, Eye,
  ShieldCheck, AlertTriangle, Trash2,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

// CSV helper (papaparse-equivalent)
function downloadCSV(filename: string, rows: Record<string, any>[]) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => {
      const v = r[h] ?? "";
      const s = String(v).replace(/"/g, '""');
      return /[",\n]/.test(s) ? `"${s}"` : s;
    }).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ============ USERS (Super Admin + Admin) ============
import { toast } from "../components/ui/primitives";

export function UsersSection() {
  const { currentUser, users, toggleUserActive, registerUser, deleteUser } = useHospital();
  const [showAdd, setShowAdd] = useState(false);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [form, setForm] = useState({ full_name: "", email: "", role: "doctor" as Role, department_id: "d-cardio" });

  if (!currentUser) return null;
  const scope = currentUser.role === "super_admin"
    ? users
    : users.filter((u) => u.department_id === currentUser.department_id || u.role === "patient");

  const filtered = roleFilter === "all" ? scope : scope.filter((u) => u.role === roleFilter);

  const add = () => {
    if (!form.full_name || !form.email) return;
    registerUser({ ...form, is_active: false });
    setShowAdd(false);
    setForm({ full_name: "", email: "", role: "doctor", department_id: "d-cardio" });
  };

  return (
    <div className="space-y-6 animate-float-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Users</h1>
          <p className="text-sm text-neutral-500 mt-1">{currentUser.role === "super_admin" ? "Platform-wide" : "Department-scoped"} user management.</p>
        </div>
        <div className="flex gap-2">
          <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="w-40">
            <option value="all">All roles</option>
            <option value="super_admin">Super Admin</option>
            <option value="admin">Admin</option>
            <option value="doctor">Doctor</option>
            <option value="lab_tech">Lab Tech</option>
            <option value="pharmacist">Pharmacist</option>
            <option value="patient">Patient</option>
          </Select>
          <Button onClick={() => setShowAdd(true)}><Plus size={14} /> New user</Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-5">
          <DataTable
            data={filtered}
            columns={[
              { key: "full_name", header: "User", sortable: true, cell: (u) => (
                <div className="flex items-center gap-3">
                  <Avatar name={u.full_name} size="sm" />
                  <div>
                    <div className="font-medium text-neutral-900">{u.full_name}</div>
                    <div className="text-xs text-neutral-500">{u.email}</div>
                  </div>
                </div>
              )},
              { key: "role", header: "Role", cell: (u) => <Badge variant="outline">{u.role.replace("_", " ")}</Badge> },
              { key: "department", header: "Department", cell: (u) => <span className="text-xs text-neutral-600">{u.department_id ? { "d-cardio": "Cardiology", "d-neuro": "Neurology", "d-peds": "Pediatrics", "d-ortho": "Orthopedics" }[u.department_id] : "—"}</span> },
              { key: "status", header: "Status", cell: (u) => u.is_active ? <Badge variant="success">Active</Badge> : <Badge variant="danger">Inactive</Badge> },
              { key: "created_at", header: "Joined", cell: (u) => <span className="text-xs text-neutral-500">{format(new Date(u.created_at), "MMM d, yyyy")}</span> },
              { key: "actions", header: "", cell: (u) => {
                const isSuperAdmin = currentUser?.role === "super_admin";
                const isSelf = currentUser?.id === u.id;
                const items: any[] = [
                  { label: u.is_active ? "Deactivate" : "Activate", onClick: () => toggleUserActive(u.id), icon: <ShieldCheck size={14} /> },
                ];
                if (isSuperAdmin && !isSelf) {
                  items.push({
                    label: "Delete permanently",
                    onClick: () => {
                      if (confirm(`Permanently delete ${u.full_name}? This removes all their data from the system.`)) {
                        const ok = deleteUser(u.id);
                        if (ok) toast({ title: "User deleted", description: `${u.full_name} has been permanently removed.`, variant: "danger" });
                        else toast({ title: "Delete failed", description: "Only Super Admin can delete users.", variant: "danger" });
                      }
                    },
                    icon: <Trash2 size={14} />,
                    danger: true,
                  });
                }
                return (
                  <Dropdown
                    trigger={<Button variant="ghost" size="icon"><MoreVertical size={14} /></Button>}
                    items={items}
                  />
                );
              }},
            ]}
          />
        </CardContent>
      </Card>

      <Dialog open={showAdd} onClose={() => setShowAdd(false)} title="Create new user" description="Staff accounts require admin approval before activation.">
        <div className="space-y-4">
          <div>
            <Label>Full name</Label>
            <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Jane Doe" />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="jane@satcity.com" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Role</Label>
              <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
                <option value="doctor">Doctor</option>
                <option value="lab_tech">Lab Technician</option>
                <option value="pharmacist">Pharmacist</option>
                <option value="admin">Admin</option>
                <option value="patient">Patient</option>
              </Select>
            </div>
            <div>
              <Label>Department</Label>
              <Select value={form.department_id} onChange={(e) => setForm({ ...form, department_id: e.target.value })}>
                <option value="d-cardio">Cardiology</option>
                <option value="d-neuro">Neurology</option>
                <option value="d-peds">Pediatrics</option>
                <option value="d-ortho">Orthopedics</option>
              </Select>
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-3 border-t border-neutral-100">
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={add}>Create user</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

// ============ PATIENTS LIST ============
export function PatientsList() {
  const { currentUser, patients, assignments, doctors, treatments } = useHospital();
  if (!currentUser) return null;
  const scope = currentUser.role === "super_admin" || currentUser.role === "admin"
    ? (currentUser.role === "admin" ? patients.filter((p) => p.department_id === currentUser.department_id) : patients)
    : currentUser.role === "doctor"
      ? (() => {
          const ids = new Set(assignments.filter((a) => a.doctor_id === currentUser.id && a.status === "active").map((a) => a.patient_id));
          return patients.filter((p) => ids.has(p.id));
        })()
      : patients.filter((p) => p.id === currentUser.id);

  const rows = scope.map((p) => {
    const latestAssignment = assignments.filter((a) => a.patient_id === p.id && a.status === "active").slice(-1)[0];
    const doc = latestAssignment ? doctors.find((d) => d.id === latestAssignment.doctor_id) : null;
    const tCount = treatments.filter((t) => t.patient_id === p.id).length;
    return { ...p, doctor_name: doc?.full_name ?? "Unassigned", treatments_count: tCount };
  });

  return (
    <div className="space-y-6 animate-float-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Patients</h1>
          <p className="text-sm text-neutral-500 mt-1">{scope.length} patients {currentUser.role === "doctor" ? "assigned to you" : "in scope"}.</p>
        </div>
        {currentUser.role === "doctor" && (
          <Button variant="outline" onClick={() => downloadCSV(`patients-${format(new Date(), "yyyy-MM-dd")}.csv`, rows.map((p) => ({
            name: p.full_name,
            email: p.email,
            blood_type: p.blood_type,
            doctor: p.doctor_name,
            treatments: p.treatments_count,
          })))}>
            <Download size={14} /> Export CSV
          </Button>
        )}
      </div>
      <Card>
        <CardContent className="pt-5">
          <DataTable
            data={rows}
            columns={[
              { key: "full_name", header: "Patient", sortable: true, cell: (p) => (
                <div className="flex items-center gap-3">
                  <Avatar name={p.full_name} size="sm" />
                  <div>
                    <div className="font-medium text-neutral-900">{p.full_name}</div>
                    <div className="text-xs text-neutral-500">{p.blood_type} · DOB {format(new Date(p.date_of_birth), "MMM d, yyyy")}</div>
                  </div>
                </div>
              )},
              { key: "doctor_name", header: "Assigned doctor", cell: (p) => <span className="text-sm">{p.doctor_name}</span> },
              { key: "treatments_count", header: "Treatments", cell: (p) => <Badge variant="outline">{p.treatments_count}</Badge> },
              { key: "actions", header: "", cell: (p) => (
                <Link to={`/dashboard/patients/${p.id}`}><Button size="sm" variant="outline">Open profile</Button></Link>
              )},
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}

// ============ PATIENT DETAIL (tabs) ============
export function PatientDetail() {
  const { id } = useParams();
  const { patients, labResults, treatments, assignments, doctors, currentUser, addTreatment } = useHospital();
  const patient = patients.find((p) => p.id === id);
  const [tab, setTab] = useState("personal");
  const [showAddTreatment, setShowAddTreatment] = useState(false);
  const [tForm, setTForm] = useState({ illness_type: "", treatment_details: "", basis_type: "lab_confirmed" as "lab_confirmed" | "doctor_experience" | "external_report" });

  if (!patient) return <div className="text-center py-20 text-neutral-500">Patient not found.</div>;

  const myLabResults = labResults.filter((l) => l.patient_id === patient.id);
  const myTreatments = treatments.filter((t) => t.patient_id === patient.id);
  const myAssignments = assignments.filter((a) => a.patient_id === patient.id && a.status === "active");
  const myDoctor = myAssignments.length ? doctors.find((d) => d.id === myAssignments[myAssignments.length - 1].doctor_id) : null;

  const canEdit = currentUser && (currentUser.role === "super_admin" || currentUser.role === "admin" || (currentUser.role === "doctor" && myAssignments.some((a) => a.doctor_id === currentUser.id)));

  const submitTreatment = () => {
    if (!currentUser || !tForm.illness_type || !tForm.treatment_details) return;
    addTreatment({
      patient_id: patient.id,
      doctor_id: currentUser.id,
      doctor_name: currentUser.full_name,
      doctor_specialty: currentUser.role === "doctor" ? (doctors.find((d) => d.id === currentUser.id)?.specialty.join(", ") ?? "") : "",
      illness_type: tForm.illness_type,
      treatment_details: tForm.treatment_details,
      basis_type: tForm.basis_type,
    });
    setShowAddTreatment(false);
    setTForm({ illness_type: "", treatment_details: "", basis_type: "lab_confirmed" });
  };

  const tabs = [
    { value: "personal", label: "Personal Info" },
    { value: "symptoms", label: "Symptom History", count: patient.symptoms.length },
    { value: "lab", label: "Lab Results", count: myLabResults.length },
    { value: "treatments", label: "Treatment History", count: myTreatments.length },
    { value: "external", label: "External Reports", count: patient.external_reports.length },
    { value: "doctor", label: "Assigned Doctor" },
  ];

  return (
    <div className="space-y-6 animate-float-up">
      <div className="flex items-center gap-4">
        <Avatar name={patient.full_name} size="lg" />
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-neutral-900">{patient.full_name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline">{patient.blood_type}</Badge>
            <Badge variant="outline">{new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear()} yrs</Badge>
            <span className="text-xs text-neutral-500">Patient ID: {patient.patient_id}</span>
          </div>
        </div>
        {canEdit && (
          <Button onClick={() => setShowAddTreatment(true)}><Plus size={14} /> Log treatment</Button>
        )}
      </div>

      <Card>
        <CardContent className="pt-5">
          <Tabs tabs={tabs} active={tab} onChange={setTab}>
            {tab === "personal" && (
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Field label="Full name" value={patient.full_name} />
                  <Field label="Email" value={patient.email} />
                  <Field label="Date of birth" value={format(new Date(patient.date_of_birth), "MMMM d, yyyy")} />
                  <Field label="Blood type" value={patient.blood_type} />
                </div>
                <div className="space-y-3">
                  <Field label="Address" value={patient.address} />
                  <Field label="Emergency contact" value={patient.emergency_contact} />
                  <Field label="Department" value={{ "d-cardio": "Cardiology", "d-neuro": "Neurology", "d-peds": "Pediatrics", "d-ortho": "Orthopedics" }[patient.department_id ?? ""] ?? "—"} />
                  <Field label="Account status" value={patient.is_active ? "Active" : "Inactive"} />
                </div>
              </div>
            )}

            {tab === "symptoms" && (
              <div className="space-y-3">
                {patient.symptoms.map((s) => (
                  <div key={s.id} className="p-4 rounded-lg border border-neutral-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs text-neutral-500">{format(new Date(s.at), "PPP p")}</div>
                      {s.lab_test_status === "Results Uploaded" ? (
                        <Badge variant="success">Results Uploaded</Badge>
                      ) : s.lab_test_ordered ? (
                        <Badge variant="warning">Pending</Badge>
                      ) : null}
                    </div>
                    <div className="text-sm text-neutral-800">{s.text}</div>
                    {s.lab_test_ordered && <div className="text-xs text-neutral-500 mt-2">Ordered: {s.lab_test_ordered}</div>}
                  </div>
                ))}
                {patient.symptoms.length === 0 && <div className="text-sm text-neutral-500 text-center py-8">No symptom history.</div>}
              </div>
            )}

            {tab === "lab" && (
              <div className="space-y-3">
                {myLabResults.map((r) => (
                  <div key={r.id} className="p-4 rounded-lg border border-neutral-200 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                      <FlaskConical size={18} />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-neutral-900">{r.diagnosed_condition}</div>
                      <div className="text-xs text-neutral-500">Uploaded by {r.technician_name} · {format(new Date(r.uploaded_at), "PPP")}</div>
                    </div>
                    <Button size="sm" variant="outline"><Download size={14} /> Download</Button>
                  </div>
                ))}
                {myLabResults.length === 0 && <div className="text-sm text-neutral-500 text-center py-8">No lab results yet.</div>}
              </div>
            )}

            {tab === "treatments" && (
              <div className="space-y-3">
                {myTreatments.map((t) => (
                  <div key={t.id} className="p-4 rounded-lg border border-neutral-200">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-neutral-900">{t.illness_type}</div>
                      <Badge variant={t.basis_type === "lab_confirmed" ? "info" : t.basis_type === "external_report" ? "teal" : "warning"}>
                        {t.basis_type === "lab_confirmed" ? "Lab-confirmed" : t.basis_type === "external_report" ? "External scan" : "Doctor experience"}
                      </Badge>
                    </div>
                    <div className="text-sm text-neutral-700 mt-2">{t.treatment_details}</div>
                    <div className="text-xs text-neutral-500 mt-3 flex items-center gap-3">
                      <span>{t.doctor_name}</span>
                      {t.doctor_specialty && <span>· {t.doctor_specialty}</span>}
                      <span>· {format(new Date(t.administered_at), "PPP p")}</span>
                    </div>
                  </div>
                ))}
                {myTreatments.length === 0 && <div className="text-sm text-neutral-500 text-center py-8">No treatments recorded.</div>}
              </div>
            )}

            {tab === "external" && (
              <div className="space-y-3">
                {patient.external_reports.map((r) => (
                  <div key={r.id} className="p-4 rounded-lg border border-neutral-200 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
                      <FileText size={18} />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-neutral-900">{r.name}</div>
                      <div className="text-xs text-neutral-500">From {r.from} · {format(new Date(r.uploaded_at), "PPP")}</div>
                    </div>
                    <Button size="sm" variant="outline"><Eye size={14} /> View</Button>
                  </div>
                ))}
                {patient.external_reports.length === 0 && <div className="text-sm text-neutral-500 text-center py-8">No external reports uploaded.</div>}
              </div>
            )}

            {tab === "doctor" && (
              myDoctor ? (
                <div className="p-5 rounded-lg border border-neutral-200 flex items-center gap-4">
                  <Avatar name={myDoctor.full_name} size="lg" />
                  <div className="flex-1">
                    <div className="font-semibold text-neutral-900">{myDoctor.full_name}</div>
                    <div className="text-sm text-neutral-500">{myDoctor.specialty.join(", ")}</div>
                    <div className="text-xs text-neutral-500 mt-1">{myDoctor.bio}</div>
                    <div className="mt-2">
                      <Badge variant={myDoctor.availability_status === "available" ? "success" : myDoctor.availability_status === "busy" ? "warning" : "default"}>
                        {myDoctor.availability_status.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                  <Link to={`/dashboard/doctors/${myDoctor.id}`}><Button size="sm" variant="outline">View profile</Button></Link>
                </div>
              ) : <div className="text-sm text-neutral-500 text-center py-8">No doctor assigned yet.</div>
            )}
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={showAddTreatment} onClose={() => setShowAddTreatment(false)} title="Log new treatment" description={`For patient ${patient.full_name}`}>
        <div className="space-y-4">
          <div>
            <Label>Illness / condition</Label>
            <Input value={tForm.illness_type} onChange={(e) => setTForm({ ...tForm, illness_type: e.target.value })} placeholder="e.g. Hypertension Stage 1" />
          </div>
          <div>
            <Label>Treatment details</Label>
            <Textarea value={tForm.treatment_details} onChange={(e) => setTForm({ ...tForm, treatment_details: e.target.value })} placeholder="Describe medications, procedures, and follow-up instructions." />
          </div>
          <div>
            <Label>Treatment basis</Label>
            <Select value={tForm.basis_type} onChange={(e) => setTForm({ ...tForm, basis_type: e.target.value as any })}>
              <option value="lab_confirmed">Lab-confirmed</option>
              <option value="doctor_experience">Doctor experience</option>
              <option value="external_report">External scan / report</option>
            </Select>
          </div>
          <div className="flex gap-2 justify-end pt-3 border-t border-neutral-100">
            <Button variant="outline" onClick={() => setShowAddTreatment(false)}>Cancel</Button>
            <Button onClick={submitTreatment}>Save treatment</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-neutral-500 mb-1">{label}</div>
      <div className="text-sm font-medium text-neutral-900">{value}</div>
    </div>
  );
}

// ============ DOCTORS LIST ============
export function DoctorsList() {
  const { doctors, currentUser } = useHospital();
  const scope = currentUser?.role === "super_admin" ? doctors : doctors.filter((d) => d.department_id === currentUser?.department_id);

  return (
    <div className="space-y-6 animate-float-up">
      <h1 className="text-2xl font-semibold text-neutral-900">Doctors</h1>
      <Card>
        <CardContent className="pt-5">
          <DataTable
            data={scope}
            columns={[
              { key: "full_name", header: "Doctor", sortable: true, cell: (d) => (
                <div className="flex items-center gap-3">
                  <Avatar name={d.full_name} size="sm" />
                  <div>
                    <div className="font-medium text-neutral-900">{d.full_name}</div>
                    <div className="text-xs text-neutral-500">{d.email}</div>
                  </div>
                </div>
              )},
              { key: "specialty", header: "Specialty", cell: (d) => <span className="text-xs">{d.specialty.join(", ")}</span> },
              { key: "availability_status", header: "Status", cell: (d) => (
                <Badge variant={d.availability_status === "available" ? "success" : d.availability_status === "busy" ? "warning" : "default"}>
                  {d.availability_status.replace("_", " ")}
                </Badge>
              )},
              { key: "active_patient_count", header: "Active patients", sortable: true, cell: (d) => <Badge variant="outline">{d.active_patient_count}</Badge> },
              { key: "actions", header: "", cell: (d) => (
                <Link to={`/dashboard/doctors/${d.id}`}><Button size="sm" variant="outline">Open</Button></Link>
              )},
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}

// ============ DOCTOR DETAIL ============
export function DoctorDetail() {
  const { id } = useParams();
  const { doctors, currentUser, updateDoctorStatus, patients, treatments, assignments } = useHospital();
  const doctor = doctors.find((d) => d.id === id);
  if (!doctor) return <div className="text-center py-20 text-neutral-500">Doctor not found.</div>;

  const myPatientIds = new Set(assignments.filter((a) => a.doctor_id === doctor.id && a.status === "active").map((a) => a.patient_id));
  const myPatients = patients.filter((p) => myPatientIds.has(p.id));
  const myTreatments = treatments.filter((t) => t.doctor_id === doctor.id);
  const isMe = currentUser?.id === doctor.id;

  const exportCSV = () => {
    const rows = myTreatments.map((t) => {
      const pat = patients.find((p) => p.id === t.patient_id);
      return {
        patient_name: pat?.full_name ?? "",
        illness: t.illness_type,
        basis: t.basis_type,
        treatment: t.treatment_details,
        administered_at: t.administered_at,
      };
    });
    downloadCSV(`${doctor.full_name.replace(/\s/g, "_")}_records.csv`, rows);
  };

  return (
    <div className="space-y-6 animate-float-up">
      <div className="flex items-start gap-4">
        <Avatar name={doctor.full_name} size="lg" />
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-neutral-900">{doctor.full_name}</h1>
          <p className="text-sm text-neutral-500 mt-1">{doctor.specialty.join(" · ")}</p>
          <p className="text-sm text-neutral-600 mt-2">{doctor.bio}</p>
        </div>
        {isMe && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-500">Status:</span>
            <Select value={doctor.availability_status} onChange={(e) => updateDoctorStatus(doctor.id, e.target.value as any)} className="w-40">
              <option value="available">Available</option>
              <option value="busy">Busy</option>
              <option value="off_duty">Off duty</option>
            </Select>
          </div>
        )}
        {!isMe && (
          <Badge variant={doctor.availability_status === "available" ? "success" : doctor.availability_status === "busy" ? "warning" : "default"}>
            {doctor.availability_status.replace("_", " ")}
          </Badge>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-5"><Stat label="Active patients" value={myPatients.length} /></Card>
        <Card className="p-5"><Stat label="Total treatments" value={myTreatments.length} /></Card>
        <Card className="p-5"><Stat label="Specialty" value={doctor.specialty[0]} /></Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Active patients</CardTitle>
            <Button variant="outline" onClick={exportCSV}><Download size={14} /> Download CSV</Button>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={myPatients}
            columns={[
              { key: "full_name", header: "Patient", cell: (p) => (
                <div className="flex items-center gap-3">
                  <Avatar name={p.full_name} size="sm" />
                  <span className="font-medium">{p.full_name}</span>
                </div>
              )},
              { key: "blood_type", header: "Blood", cell: (p) => <Badge variant="outline">{p.blood_type}</Badge> },
              { key: "latest", header: "Latest symptom", cell: (p) => <span className="text-xs">{p.symptoms[p.symptoms.length - 1]?.text.slice(0, 60) ?? "—"}...</span> },
              { key: "actions", header: "", cell: (p) => (
                <Link to={`/dashboard/patients/${p.id}`}><Button size="sm" variant="outline">Open</Button></Link>
              )},
            ]}
            emptyState="No active patients."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Treatment history</CardTitle></CardHeader>
        <CardContent>
          <DataTable
            data={myTreatments}
            columns={[
              { key: "patient", header: "Patient", cell: (t) => <span className="font-medium">{patients.find((p) => p.id === t.patient_id)?.full_name ?? "—"}</span> },
              { key: "illness_type", header: "Illness", cell: (t) => <span className="text-sm">{t.illness_type}</span> },
              { key: "basis_type", header: "Basis", cell: (t) => (
                <Badge variant={t.basis_type === "lab_confirmed" ? "info" : t.basis_type === "external_report" ? "teal" : "warning"}>
                  {t.basis_type === "lab_confirmed" ? "Lab-confirmed" : t.basis_type === "external_report" ? "External" : "Experience"}
                </Badge>
              )},
              { key: "date", header: "Date", cell: (t) => <span className="text-xs text-neutral-500">{format(new Date(t.administered_at), "PPP")}</span> },
            ]}
            emptyState="No treatments logged."
          />
        </CardContent>
      </Card>
    </div>
  );
}

// ============ DEPARTMENTS ============
export function DepartmentsSection() {
  const { departments, users, doctors, patients } = useHospital();
  return (
    <div className="space-y-6 animate-float-up">
      <h1 className="text-2xl font-semibold text-neutral-900">Departments</h1>
      <div className="grid md:grid-cols-2 gap-4">
        {departments.map((d) => {
          const deptUsers = users.filter((u) => u.department_id === d.id);
          const deptDocs = doctors.filter((x) => x.department_id === d.id);
          const deptPats = patients.filter((p) => p.department_id === d.id);
          const admin = users.find((u) => u.id === d.admin_id);
          return (
            <Card key={d.id} className="p-5">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-neutral-900">{d.name}</div>
                <Badge variant="outline">{deptUsers.length} staff</Badge>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-neutral-600">
                <div><div className="text-neutral-500">Doctors</div><div className="font-semibold text-neutral-900 mt-0.5">{deptDocs.length}</div></div>
                <div><div className="text-neutral-500">Patients</div><div className="font-semibold text-neutral-900 mt-0.5">{deptPats.length}</div></div>
                <div><div className="text-neutral-500">Admin</div><div className="font-semibold text-neutral-900 mt-0.5 truncate">{admin?.full_name.split(" ")[0] ?? "—"}</div></div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ============ LAB RESULTS ============
export function LabResultsSection() {
  const { labResults, patients, currentUser } = useHospital();
  const scope = currentUser?.role === "patient"
    ? labResults.filter((l) => l.patient_id === currentUser.id)
    : currentUser?.role === "admin"
      ? labResults.filter((l) => patients.find((p) => p.id === l.patient_id)?.department_id === currentUser.department_id)
      : labResults;

  return (
    <div className="space-y-6 animate-float-up">
      <h1 className="text-2xl font-semibold text-neutral-900">Lab Results</h1>
      <Card>
        <CardContent className="pt-5">
          <DataTable
            data={scope}
            columns={[
              { key: "patient", header: "Patient", cell: (l) => <span className="font-medium">{patients.find((p) => p.id === l.patient_id)?.full_name ?? "—"}</span> },
              { key: "diagnosed_condition", header: "Diagnosis", cell: (l) => <Badge variant="info">{l.diagnosed_condition}</Badge> },
              { key: "technician_name", header: "Uploaded by", cell: (l) => <span className="text-sm">{l.technician_name}</span> },
              { key: "uploaded_at", header: "Date", sortable: true, cell: (l) => <span className="text-xs text-neutral-500">{format(new Date(l.uploaded_at), "PPP")}</span> },
              { key: "file", header: "", cell: () => <Button size="sm" variant="outline"><Download size={12} /> File</Button> },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}

// ============ LAB UPLOAD (Lab Tech) ============
export function LabUpload() {
  const { patients, currentUser, uploadLabResult } = useHospital();
  const [patientId, setPatientId] = useState("");
  const [condition, setCondition] = useState("");
  const [fileName, setFileName] = useState("");
  const [success, setSuccess] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!patientId || !condition || !currentUser) return;
    uploadLabResult({
      patient_id: patientId,
      technician_id: currentUser.id,
      technician_name: currentUser.full_name,
      diagnosed_condition: condition,
      result_file_url: fileName || "result.pdf",
    });
    setSuccess(true);
    setTimeout(() => { setSuccess(false); setPatientId(""); setCondition(""); setFileName(""); }, 2500);
  };

  return (
    <div className="space-y-6 animate-float-up max-w-2xl">
      <h1 className="text-2xl font-semibold text-neutral-900">Upload lab result</h1>
      <p className="text-sm text-neutral-600">After upload, the smart-assignment edge function will match the diagnosed condition to an available specialist.</p>
      <Card>
        <CardContent className="pt-5">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label>Patient</Label>
              <Select value={patientId} onChange={(e) => setPatientId(e.target.value)}>
                <option value="">Select a patient</option>
                {patients.map((p) => <option key={p.id} value={p.id}>{p.full_name} ({p.blood_type})</option>)}
              </Select>
            </div>
            <div>
              <Label>Diagnosed condition</Label>
              <Input value={condition} onChange={(e) => setCondition(e.target.value)} placeholder="e.g. Malaria, Hypertension, Fractures" />
              <p className="text-xs text-neutral-500 mt-1">Used to match doctor specialties.</p>
            </div>
            <div>
              <Label>Result file</Label>
              <Dropzone label="Drop lab result file here or click to browse" onFile={(f) => setFileName(f.name)} />
              {fileName && <div className="mt-2 text-xs text-neutral-600">Selected: {fileName}</div>}
            </div>
            {success && (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                ✓ Result uploaded. Smart-assignment edge function triggered.
              </div>
            )}
            <Button type="submit" disabled={!patientId || !condition}>Upload & trigger assignment</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// ============ LAB TECH UPLOADS ============
export function LabTechUploads() {
  const { currentUser, labResults, patients } = useHospital();
  const mine = labResults.filter((l) => l.technician_id === currentUser?.id);
  return (
    <div className="space-y-6 animate-float-up">
      <h1 className="text-2xl font-semibold text-neutral-900">My uploads</h1>
      <Card>
        <CardContent className="pt-5">
          <DataTable
            data={mine}
            columns={[
              { key: "patient", header: "Patient", cell: (l) => <span className="font-medium">{patients.find((p) => p.id === l.patient_id)?.full_name ?? "—"}</span> },
              { key: "diagnosed_condition", header: "Diagnosis", cell: (l) => <Badge variant="info">{l.diagnosed_condition}</Badge> },
              { key: "uploaded_at", header: "Uploaded", sortable: true, cell: (l) => <span className="text-xs text-neutral-500">{format(new Date(l.uploaded_at), "PPP")}</span> },
            ]}
            emptyState="You haven't uploaded any results yet."
          />
        </CardContent>
      </Card>
    </div>
  );
}

// ============ TREATMENTS ============
export function TreatmentsSection() {
  const { treatments, patients, currentUser } = useHospital();
  const scope = currentUser?.role === "patient"
    ? treatments.filter((t) => t.patient_id === currentUser.id)
    : currentUser?.role === "doctor"
      ? treatments.filter((t) => t.doctor_id === currentUser.id)
      : treatments;

  return (
    <div className="space-y-6 animate-float-up">
      <h1 className="text-2xl font-semibold text-neutral-900">Treatments</h1>
      <Card>
        <CardContent className="pt-5">
          <DataTable
            data={scope}
            columns={[
              { key: "patient", header: "Patient", cell: (t) => <span className="font-medium">{patients.find((p) => p.id === t.patient_id)?.full_name ?? "—"}</span> },
              { key: "illness_type", header: "Condition", cell: (t) => <span className="text-sm">{t.illness_type}</span> },
              { key: "basis_type", header: "Basis", cell: (t) => (
                <Badge variant={t.basis_type === "lab_confirmed" ? "info" : t.basis_type === "external_report" ? "teal" : "warning"}>
                  {t.basis_type === "lab_confirmed" ? "Lab-confirmed" : t.basis_type === "external_report" ? "External scan" : "Doctor experience"}
                </Badge>
              )},
              { key: "doctor_name", header: "Doctor", cell: (t) => <span className="text-sm">{t.doctor_name}</span> },
              { key: "administered_at", header: "Date", sortable: true, cell: (t) => <span className="text-xs text-neutral-500">{format(new Date(t.administered_at), "PPP")}</span> },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}

// ============ AMBULANCE SECTION (patient booking + admin dispatch) ============
export function AmbulanceSection() {
  const { currentUser, ambulanceBookings, bookAmbulance, updateBookingStatus } = useHospital();
  const [showBook, setShowBook] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ pickup_location: "", destination: "SatCity Hospital, Victoria Island", scheduled_time: "", reason: "" });

  if (!currentUser) return null;
  const isAdmin = currentUser.role === "super_admin" || currentUser.role === "admin";
  const scope = isAdmin ? ambulanceBookings : ambulanceBookings.filter((b) => b.patient_id === currentUser.id);

  const submitBooking = () => {
    if (!form.pickup_location || !form.scheduled_time) return;
    bookAmbulance({
      patient_id: currentUser.id,
      patient_name: currentUser.full_name,
      type: "scheduled",
      pickup_location: form.pickup_location,
      destination: form.destination,
      scheduled_time: new Date(form.scheduled_time).toISOString(),
      reason: form.reason,
    });
    setShowBook(false);
    setStep(1);
    setForm({ pickup_location: "", destination: "SatCity Hospital, Victoria Island", scheduled_time: "", reason: "" });
  };

  return (
    <div className="space-y-6 animate-float-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Ambulance & Emergency</h1>
          <p className="text-sm text-neutral-500 mt-1">{isAdmin ? "Dispatch, scheduled bookings, and public emergency requests." : "Your ambulance bookings."}</p>
        </div>
        {currentUser.role === "patient" && (
          <Button onClick={() => setShowBook(true)}><Plus size={14} /> Book ambulance</Button>
        )}
      </div>

      <Card>
        <CardContent className="pt-5">
          <DataTable
            data={scope}
            columns={[
              { key: "patient_name", header: "Patient / Caller", cell: (b) => (
                <div>
                  <div className="font-medium">{b.patient_name}</div>
                  <div className="text-xs text-neutral-500">{b.type === "emergency" ? "Public emergency" : "Scheduled booking"}</div>
                </div>
              )},
              { key: "pickup_location", header: "Location", cell: (b) => (
                <div className="flex items-center gap-1 text-xs"><MapPin size={12} /> {b.pickup_location.slice(0, 40)}...</div>
              )},
              { key: "scheduled_time", header: "Time", sortable: true, cell: (b) => <span className="text-xs text-neutral-500">{format(new Date(b.scheduled_time), "PPP p")}</span> },
              { key: "status", header: "Status", cell: (b) => {
                const v: any = b.status === "Pending" ? "warning" : b.status === "Confirmed" || b.status === "Handled" ? "success" : b.status === "En Route" ? "info" : "default";
                return <Badge variant={v}>{b.status}</Badge>;
              }},
              { key: "actions", header: "", cell: (b) => isAdmin ? (
                <Dropdown
                  trigger={<Button size="sm" variant="ghost"><MoreVertical size={14} /></Button>}
                  items={b.type === "emergency" ? [
                    { label: "Mark as Handled", onClick: () => updateBookingStatus(b.id, "Handled"), icon: <CheckCircle2 size={14} /> },
                  ] : [
                    { label: "Confirm", onClick: () => updateBookingStatus(b.id, "Confirmed"), icon: <CheckCircle2 size={14} /> },
                    { label: "En Route", onClick: () => updateBookingStatus(b.id, "En Route"), icon: <Ambulance size={14} /> },
                    { label: "Completed", onClick: () => updateBookingStatus(b.id, "Completed"), icon: <CheckCircle2 size={14} /> },
                  ]}
                />
              ) : <span className="text-xs text-neutral-500">—</span>},
            ]}
            emptyState="No bookings."
          />
        </CardContent>
      </Card>

      {/* Multi-step booking dialog */}
      <Dialog open={showBook} onClose={() => { setShowBook(false); setStep(1); }} title="Book scheduled ambulance" description={`Step ${step} of 3`} width="max-w-md">
        {step === 1 && (
          <div className="space-y-4">
            <div><Label>Pickup location</Label><Input value={form.pickup_location} onChange={(e) => setForm({ ...form, pickup_location: e.target.value })} placeholder="Full address" /></div>
            <div><Label>Destination</Label><Input value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} /></div>
            <div className="flex justify-end gap-2"><Button onClick={() => setStep(2)} disabled={!form.pickup_location}>Next</Button></div>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-4">
            <div><Label>Scheduled date & time</Label><Input type="datetime-local" value={form.scheduled_time} onChange={(e) => setForm({ ...form, scheduled_time: e.target.value })} /></div>
            <div className="flex justify-between gap-2"><Button variant="outline" onClick={() => setStep(1)}>Back</Button><Button onClick={() => setStep(3)} disabled={!form.scheduled_time}>Next</Button></div>
          </div>
        )}
        {step === 3 && (
          <div className="space-y-4">
            <div><Label>Reason for transport</Label><Textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="e.g. Follow-up appointment" /></div>
            <div className="p-3 rounded-md bg-neutral-50 text-xs">
              <div className="font-medium mb-1">Summary</div>
              <div>Pickup: {form.pickup_location}</div>
              <div>Destination: {form.destination}</div>
              <div>Time: {form.scheduled_time && format(new Date(form.scheduled_time), "PPP p")}</div>
            </div>
            <div className="flex justify-between gap-2"><Button variant="outline" onClick={() => setStep(2)}>Back</Button><Button onClick={submitBooking}>Confirm booking</Button></div>
          </div>
        )}
      </Dialog>
    </div>
  );
}

// ============ DRUGS (Pharmacist + read-only for others) ============
export function DrugsSection() {
  const { currentUser, drugs, addDrug, updateDrugQty } = useHospital();
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ drug_name: "", category: "", description: "", usage: "", side_effects: "", quantity: 0 });

  const canEdit = currentUser?.role === "pharmacist" || currentUser?.role === "super_admin" || currentUser?.role === "admin";
  const filtered = drugs.filter((d) => {
    const matchesFilter = filter === "all" || d.status === filter;
    const matchesSearch = d.drug_name.toLowerCase().includes(search.toLowerCase()) || d.category.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const submit = () => {
    if (!form.drug_name) return;
    addDrug(form);
    setShowAdd(false);
    setForm({ drug_name: "", category: "", description: "", usage: "", side_effects: "", quantity: 0 });
  };

  return (
    <div className="space-y-6 animate-float-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Drug inventory</h1>
          <p className="text-sm text-neutral-500 mt-1">{canEdit ? "Manage stock and add new drugs." : "Read-only drug reference."}</p>
        </div>
        {canEdit && <Button onClick={() => setShowAdd(true)}><Plus size={14} /> Add drug</Button>}
      </div>

      <div className="flex gap-2">
        <Input placeholder="Search by name or category..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
        <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="w-40">
          <option value="all">All status</option>
          <option value="available">Available</option>
          <option value="low">Low stock</option>
          <option value="out_of_stock">Out of stock</option>
        </Select>
      </div>

      <Card>
        <CardContent className="pt-5">
          <DataTable
            data={filtered}
            columns={[
              { key: "drug_name", header: "Drug", sortable: true, cell: (d) => (
                <div>
                  <div className="font-medium text-neutral-900">{d.drug_name}</div>
                  <div className="text-xs text-neutral-500">{d.category}</div>
                </div>
              )},
              { key: "quantity", header: "Stock", sortable: true, cell: (d) => canEdit ? (
                <div className="flex items-center gap-2">
                  <Input type="number" value={d.quantity} onChange={(e) => updateDrugQty(d.id, parseInt(e.target.value) || 0)} className="w-20 h-8 text-xs" />
                  <span className="text-xs text-neutral-500">units</span>
                </div>
              ) : <span className="text-sm">{d.quantity} units</span> },
              { key: "status", header: "Status", cell: (d) => (
                <Badge variant={d.status === "available" ? "success" : d.status === "low" ? "warning" : "danger"}>
                  {d.status === "out_of_stock" ? "Out of stock" : d.status === "low" ? `Low (${d.quantity})` : "Available"}
                </Badge>
              )},
              { key: "updated_at", header: "Updated", cell: (d) => <span className="text-xs text-neutral-500">{formatDistanceToNow(new Date(d.updated_at), { addSuffix: true })}</span> },
            ]}
          />
        </CardContent>
      </Card>

      <Dialog open={showAdd} onClose={() => setShowAdd(false)} title="Add new drug" description="Creates entry in Sanity CMS and Supabase inventory.">
        <div className="space-y-4">
          <div><Label>Drug name</Label><Input value={form.drug_name} onChange={(e) => setForm({ ...form, drug_name: e.target.value })} placeholder="Paracetamol 500mg" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Category</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Analgesic" /></div>
            <div><Label>Initial quantity</Label><Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 0 })} /></div>
          </div>
          <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div><Label>Usage instructions</Label><Textarea value={form.usage} onChange={(e) => setForm({ ...form, usage: e.target.value })} /></div>
          <div><Label>Side effects</Label><Textarea value={form.side_effects} onChange={(e) => setForm({ ...form, side_effects: e.target.value })} /></div>
          <div className="flex gap-2 justify-end pt-3 border-t border-neutral-100">
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={submit}>Create drug</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

// ============ LOW STOCK ============
export function LowStockSection() {
  const { drugs } = useHospital();
  const low = drugs.filter((d) => d.status !== "available");
  return (
    <div className="space-y-6 animate-float-up">
      <div className="flex items-center gap-2">
        <AlertTriangle size={18} className="text-amber-600" />
        <h1 className="text-2xl font-semibold text-neutral-900">Low stock alerts</h1>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {low.map((d) => (
          <MovingBorderCard key={d.id}>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-neutral-900">{d.drug_name}</div>
                <div className="text-xs text-neutral-500 mt-1">{d.category}</div>
              </div>
              <Badge variant={d.status === "out_of_stock" ? "danger" : "warning"}>
                {d.status === "out_of_stock" ? "Out of stock" : `${d.quantity} left`}
              </Badge>
            </div>
          </MovingBorderCard>
        ))}
        {low.length === 0 && <div className="col-span-2 text-sm text-neutral-500 text-center py-8">All stock levels healthy.</div>}
      </div>
    </div>
  );
}

// ============ NOTIFICATIONS ============
export function NotificationsSection() {
  const { currentUser, notifications, markNotificationRead, acceptEmergency } = useHospital();
  const mine = notifications.filter((n) => n.recipient_id === currentUser?.id).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="space-y-6 animate-float-up">
      <h1 className="text-2xl font-semibold text-neutral-900">Notifications</h1>
      <Card>
        <CardContent className="pt-5 space-y-2">
          {mine.map((n) => (
            <div key={n.id} className={`flex items-center gap-3 p-3 rounded-lg border ${n.is_read ? "border-neutral-100 bg-neutral-50/50" : n.type === "emergency_available_patient" ? "border-red-200 bg-red-50" : "border-blue-200 bg-blue-50/40"}`}>
              <Bell size={16} className={n.type === "emergency_available_patient" ? "text-red-600" : "text-blue-600"} />
              <div className="flex-1 text-sm text-neutral-800">{n.message}</div>
              <div className="text-xs text-neutral-500">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</div>
              {!n.is_read && n.type === "emergency_available_patient" && (
                <Button size="sm" onClick={() => { acceptEmergency(n.id, currentUser!.id); }}>Accept</Button>
              )}
              {!n.is_read && n.type !== "emergency_available_patient" && (
                <Button size="sm" variant="outline" onClick={() => markNotificationRead(n.id)}>Mark read</Button>
              )}
            </div>
          ))}
          {mine.length === 0 && <div className="text-sm text-neutral-500 text-center py-8">No notifications.</div>}
        </CardContent>
      </Card>
    </div>
  );
}

// ============ AUDIT LOG ============
export function AuditSection() {
  const { labResults, treatments, ambulanceBookings, patients } = useHospital();
  const events = [
    ...labResults.map((l) => ({ id: l.id, type: "lab_upload", actor: l.technician_name, detail: `Uploaded ${l.diagnosed_condition} for ${patients.find((p) => p.id === l.patient_id)?.full_name ?? "—"}`, at: l.uploaded_at })),
    ...treatments.map((t) => ({ id: t.id, type: "treatment", actor: t.doctor_name, detail: `Logged ${t.illness_type} (${t.basis_type})`, at: t.administered_at })),
    ...ambulanceBookings.map((b) => ({ id: b.id, type: "ambulance", actor: b.caller_name ?? b.patient_name, detail: `${b.type === "emergency" ? "Emergency" : "Scheduled"} booking at ${b.pickup_location}`, at: b.created_at })),
  ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  return (
    <div className="space-y-6 animate-float-up">
      <h1 className="text-2xl font-semibold text-neutral-900">Audit log</h1>
      <Card>
        <CardContent className="pt-5">
          <DataTable
            data={events}
            columns={[
              { key: "at", header: "Time", sortable: true, cell: (e) => <span className="text-xs text-neutral-500">{format(new Date(e.at), "PPP p")}</span> },
              { key: "type", header: "Type", cell: (e) => <Badge variant="outline">{e.type.replace("_", " ")}</Badge> },
              { key: "actor", header: "Actor", cell: (e) => <span className="text-sm font-medium">{e.actor}</span> },
              { key: "detail", header: "Details", cell: (e) => <span className="text-xs text-neutral-600">{e.detail}</span> },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}

// ============ SETTINGS ============
export function SettingsSection() {
  return (
    <div className="space-y-6 animate-float-up max-w-2xl">
      <h1 className="text-2xl font-semibold text-neutral-900">Platform settings</h1>
      <Card>
        <CardHeader><CardTitle>Integrations</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          {[
            { name: "Supabase", desc: "Auth · Database · Realtime · Storage · Edge Functions", status: "Connected" },
            { name: "Sanity CMS", desc: "Drug catalog and content management", status: "Connected" },
            { name: "Papaparse", desc: "Client-side CSV export", status: "Active" },
            { name: "Supabase Realtime", desc: "Push notifications and live updates", status: "Listening" },
          ].map((i) => (
            <div key={i.name} className="flex items-center justify-between p-3 rounded-lg border border-neutral-200">
              <div>
                <div className="font-medium text-neutral-900">{i.name}</div>
                <div className="text-xs text-neutral-500">{i.desc}</div>
              </div>
              <Badge variant="success">{i.status}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Edge Functions</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          {[
            "assign-patient-to-doctor",
            "accept-emergency-patient",
            "check-available-doctors",
            "notify-emergency-admins",
          ].map((f) => (
            <div key={f} className="flex items-center justify-between p-3 rounded-lg border border-neutral-200 font-mono text-xs">
              <span>{f}</span>
              <Badge variant="success">Deployed</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ============ MY DOCTOR (patient) ============
export function MyDoctorSection() {
  const { currentUser, assignments, doctors } = useHospital();
  const myAssignments = assignments.filter((a) => a.patient_id === currentUser?.id && a.status === "active");
  const doctor = myAssignments.length ? doctors.find((d) => d.id === myAssignments[myAssignments.length - 1].doctor_id) : null;

  if (!doctor) {
    return (
      <div className="space-y-6 animate-float-up">
        <h1 className="text-2xl font-semibold text-neutral-900">My assigned doctor</h1>
        <Card><CardContent className="py-12 text-center text-sm text-neutral-500">No doctor assigned yet. Once lab results are uploaded, a specialist will be automatically matched to you.</CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-float-up">
      <h1 className="text-2xl font-semibold text-neutral-900">My assigned doctor</h1>
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <Avatar name={doctor.full_name} size="lg" />
          <div className="flex-1">
            <div className="font-semibold text-xl text-neutral-900">{doctor.full_name}</div>
            <div className="text-sm text-neutral-500 mt-1">{doctor.specialty.join(" · ")}</div>
            <p className="text-sm text-neutral-700 mt-3">{doctor.bio}</p>
            <div className="mt-4 flex items-center gap-2">
              <Badge variant={doctor.availability_status === "available" ? "success" : doctor.availability_status === "busy" ? "warning" : "default"}>
                {doctor.availability_status === "available" ? "Available now" : doctor.availability_status === "busy" ? "Currently busy" : "Off duty"}
              </Badge>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ============ PROFILE (doctor/patient) ============
export function ProfileSection() {
  const { currentUser, currentUserDoctor, currentUserPatient } = useHospital();
  if (!currentUser) return null;

  return (
    <div className="space-y-6 animate-float-up max-w-2xl">
      <h1 className="text-2xl font-semibold text-neutral-900">Profile</h1>
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <Avatar name={currentUser.full_name} size="lg" />
          <div>
            <div className="font-semibold text-lg text-neutral-900">{currentUser.full_name}</div>
            <div className="text-sm text-neutral-500">{currentUser.email}</div>
            <Badge variant="outline" className="mt-2">{currentUser.role.replace("_", " ")}</Badge>
          </div>
        </div>
      </Card>
      {currentUserDoctor && (
        <Card>
          <CardHeader><CardTitle>Credentials</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Field label="Specialty" value={currentUserDoctor.specialty.join(", ")} />
            <Field label="Bio" value={currentUserDoctor.bio} />
          </CardContent>
        </Card>
      )}
      {currentUserPatient && (
        <Card>
          <CardHeader><CardTitle>Medical details</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Field label="Blood type" value={currentUserPatient.blood_type} />
            <Field label="Date of birth" value={format(new Date(currentUserPatient.date_of_birth), "PPP")} />
            <Field label="Address" value={currentUserPatient.address} />
            <Field label="Emergency contact" value={currentUserPatient.emergency_contact} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

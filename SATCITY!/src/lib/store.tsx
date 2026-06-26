import { createContext, useContext, useState, useEffect, ReactNode } from "react";

// ============ Types ============
export type Role = "super_admin" | "admin" | "doctor" | "lab_tech" | "pharmacist" | "patient";

export interface User {
  id: string;
  full_name: string;
  email: string;
  role: Role;
  department_id: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Department { id: string; name: string; admin_id: string; }

export interface Doctor extends User {
  doctor_id: string;
  specialty: string[];
  availability_status: "available" | "busy" | "off_duty";
  bio: string;
  active_patient_count: number;
}

export interface Patient extends User {
  patient_id: string;
  date_of_birth: string;
  blood_type: string;
  emergency_contact: string;
  address: string;
  symptoms: { id: string; text: string; at: string; lab_test_ordered?: string; lab_test_status?: "Pending" | "Results Uploaded" }[];
  external_reports: { id: string; name: string; from: string; url: string; uploaded_at: string }[];
}

export interface LabResult {
  id: string;
  patient_id: string;
  technician_id: string;
  technician_name: string;
  diagnosed_condition: string;
  result_file_url: string;
  uploaded_at: string;
}

export interface Treatment {
  id: string;
  patient_id: string;
  doctor_id: string;
  doctor_name: string;
  doctor_specialty: string;
  illness_type: string;
  treatment_details: string;
  basis_type: "lab_confirmed" | "doctor_experience" | "external_report";
  administered_at: string;
}

export interface Assignment {
  id: string;
  patient_id: string;
  doctor_id: string;
  assigned_at: string;
  status: "active" | "resolved";
}

export interface AmbulanceBooking {
  id: string;
  patient_id: string;
  patient_name: string;
  type: "scheduled" | "emergency";
  pickup_location: string;
  destination: string;
  scheduled_time: string;
  reason?: string;
  caller_name?: string;
  description?: string;
  status: "Pending" | "Confirmed" | "En Route" | "Completed" | "Handled";
  created_at: string;
  is_resolved?: boolean;
  handled_by?: string;
}

export interface Drug {
  id: string;
  sanity_drug_id: string;
  drug_name: string;
  category: string;
  description: string;
  usage: string;
  side_effects: string;
  quantity: number;
  status: "available" | "low" | "out_of_stock";
  updated_at: string;
}

export interface Notification {
  id: string;
  recipient_id: string;
  type: "assignment" | "emergency_available_patient" | "emergency_request";
  message: string;
  specialty_context?: string;
  patient_id?: string;
  is_read: boolean;
  is_resolved?: boolean;
  created_at: string;
}

// ============ Mock seed data ============
const now = new Date().toISOString();
const daysAgo = (n: number) => new Date(Date.now() - n * 864e5).toISOString();

const departments: Department[] = [
  { id: "d-cardio", name: "Cardiology", admin_id: "u-admin-cardio" },
  { id: "d-neuro", name: "Neurology", admin_id: "u-admin-neuro" },
  { id: "d-peds", name: "Pediatrics", admin_id: "u-admin-peds" },
  { id: "d-ortho", name: "Orthopedics", admin_id: "u-admin-ortho" },
];

const usersSeed: User[] = [
  { id: "u-super", full_name: "Dr. Adaeze Okafor", email: "super@satcity.com", role: "super_admin", department_id: null, is_active: true, created_at: daysAgo(180) },
  { id: "u-admin-cardio", full_name: "Chidi Nwosu", email: "admin.cardio@satcity.com", role: "admin", department_id: "d-cardio", is_active: true, created_at: daysAgo(120) },
  { id: "u-admin-neuro", full_name: "Funke Adebayo", email: "admin.neuro@satcity.com", role: "admin", department_id: "d-neuro", is_active: true, created_at: daysAgo(120) },
  { id: "u-admin-peds", full_name: "Ibrahim Musa", email: "admin.peds@satcity.com", role: "admin", department_id: "d-peds", is_active: true, created_at: daysAgo(90) },
  { id: "u-admin-ortho", full_name: "Ngozi Eze", email: "admin.ortho@satcity.com", role: "admin", department_id: "d-ortho", is_active: true, created_at: daysAgo(90) },
];

const doctorsSeed: Doctor[] = [
  { id: "u-doc-1", full_name: "Dr. Emeka Uzoma", email: "emeka@satcity.com", role: "doctor", department_id: "d-cardio", is_active: true, created_at: daysAgo(100), doctor_id: "doc-1", specialty: ["Cardiology", "Hypertension"], availability_status: "available", bio: "Consultant cardiologist with 12 years of experience.", active_patient_count: 2 },
  { id: "u-doc-2", full_name: "Dr. Halima Bello", email: "halima@satcity.com", role: "doctor", department_id: "d-neuro", is_active: true, created_at: daysAgo(80), doctor_id: "doc-2", specialty: ["Neurology", "Epilepsy"], availability_status: "busy", bio: "Specializes in pediatric neurology and seizure disorders.", active_patient_count: 4 },
  { id: "u-doc-3", full_name: "Dr. Tunde Akin", email: "tunde@satcity.com", role: "doctor", department_id: "d-peds", is_active: true, created_at: daysAgo(70), doctor_id: "doc-3", specialty: ["Pediatrics", "Malaria"], availability_status: "available", bio: "Senior pediatrician with focus on infectious diseases.", active_patient_count: 1 },
  { id: "u-doc-4", full_name: "Dr. Amara Obi", email: "amara@satcity.com", role: "doctor", department_id: "d-ortho", is_active: true, created_at: daysAgo(60), doctor_id: "doc-4", specialty: ["Orthopedics", "Fractures"], availability_status: "off_duty", bio: "Orthopedic surgeon specializing in sports injuries.", active_patient_count: 0 },
];

const labTechs: User[] = [
  { id: "u-lab-1", full_name: "Kemi Adegoke", email: "kemi@satcity.com", role: "lab_tech", department_id: "d-cardio", is_active: true, created_at: daysAgo(60) },
  { id: "u-lab-2", full_name: "Sade Ojo", email: "sade@satcity.com", role: "lab_tech", department_id: "d-neuro", is_active: true, created_at: daysAgo(55) },
];

const pharmacists: User[] = [
  { id: "u-pharm-1", full_name: "Bola Adeyemi", email: "bola@satcity.com", role: "pharmacist", department_id: null, is_active: true, created_at: daysAgo(100) },
];

const patientsSeed: Patient[] = [
  {
    id: "u-pat-1", full_name: "Chioma Nwachukwu", email: "chioma@example.com", role: "patient", department_id: "d-cardio", is_active: true, created_at: daysAgo(30),
    patient_id: "pat-1", date_of_birth: "1992-06-14", blood_type: "O+", emergency_contact: "+234 801 223 1190", address: "14 Lekki Phase 1, Lagos",
    symptoms: [
      { id: "s1", text: "Recurring chest tightness, shortness of breath after light exercise, occasional dizziness.", at: daysAgo(12), lab_test_ordered: "ECG + Lipid Panel", lab_test_status: "Results Uploaded" },
    ],
    external_reports: [
      { id: "er1", name: "Cardiac Stress Test - UCH Ibadan", from: "University College Hospital", url: "#", uploaded_at: daysAgo(15) },
    ],
  },
  {
    id: "u-pat-2", full_name: "Yusuf Danjuma", email: "yusuf@example.com", role: "patient", department_id: "d-neuro", is_active: true, created_at: daysAgo(20),
    patient_id: "pat-2", date_of_birth: "1987-02-03", blood_type: "A-", emergency_contact: "+234 803 556 7812", address: "27 Wuse II, Abuja",
    symptoms: [
      { id: "s2", text: "Sudden severe migraine, blurred vision, brief loss of consciousness.", at: daysAgo(8), lab_test_ordered: "Brain MRI", lab_test_status: "Pending" },
    ],
    external_reports: [],
  },
  {
    id: "u-pat-3", full_name: "Adaora Okeke", email: "adaora@example.com", role: "patient", department_id: "d-peds", is_active: true, created_at: daysAgo(10),
    patient_id: "pat-3", date_of_birth: "2018-09-22", blood_type: "B+", emergency_contact: "+234 706 112 9983", address: "5 Trans Amadi, Port Harcourt",
    symptoms: [
      { id: "s3", text: "High fever, persistent cough, lethargy, loss of appetite for 4 days.", at: daysAgo(4), lab_test_ordered: "Malaria Parasite + Full Blood Count", lab_test_status: "Results Uploaded" },
    ],
    external_reports: [],
  },
  {
    id: "u-pat-4", full_name: "Oluwaseun Bakare", email: "seun@example.com", role: "patient", department_id: "d-cardio", is_active: true, created_at: daysAgo(5),
    patient_id: "pat-4", date_of_birth: "1975-11-08", blood_type: "AB+", emergency_contact: "+234 812 445 2201", address: "88 GRA, Enugu",
    symptoms: [
      { id: "s4", text: "Palpitations at rest, swollen ankles, fatigue climbing stairs.", at: daysAgo(2), lab_test_ordered: "Echocardiogram", lab_test_status: "Pending" },
    ],
    external_reports: [],
  },
];

const labResultsSeed: LabResult[] = [
  { id: "lr-1", patient_id: "u-pat-1", technician_id: "u-lab-1", technician_name: "Kemi Adegoke", diagnosed_condition: "Hypertension", result_file_url: "#", uploaded_at: daysAgo(10) },
  { id: "lr-2", patient_id: "u-pat-3", technician_id: "u-lab-1", technician_name: "Kemi Adegoke", diagnosed_condition: "Malaria", result_file_url: "#", uploaded_at: daysAgo(3) },
];

const treatmentsSeed: Treatment[] = [
  { id: "t-1", patient_id: "u-pat-1", doctor_id: "u-doc-1", doctor_name: "Dr. Emeka Uzoma", doctor_specialty: "Cardiology", illness_type: "Hypertension Stage 1", treatment_details: "Prescribed Amlodipine 5mg daily. Lifestyle counseling, low-sodium diet plan. Follow-up in 2 weeks.", basis_type: "lab_confirmed", administered_at: daysAgo(9) },
  { id: "t-2", patient_id: "u-pat-3", doctor_id: "u-doc-3", doctor_name: "Dr. Tunde Akin", doctor_specialty: "Pediatrics", illness_type: "Plasmodium falciparum malaria", treatment_details: "Artemether-Lumefantrine 6-dose regimen, oral rehydration, paracetamol for fever.", basis_type: "lab_confirmed", administered_at: daysAgo(2) },
  { id: "t-3", patient_id: "u-pat-2", doctor_id: "u-doc-2", doctor_name: "Dr. Halima Bello", doctor_specialty: "Neurology", illness_type: "Suspected migraine with aura", treatment_details: "Sumatriptan 50mg PRN, neurological observation while awaiting MRI results.", basis_type: "doctor_experience", administered_at: daysAgo(7) },
];

const assignmentsSeed: Assignment[] = [
  { id: "a-1", patient_id: "u-pat-1", doctor_id: "u-doc-1", assigned_at: daysAgo(10), status: "active" },
  { id: "a-2", patient_id: "u-pat-3", doctor_id: "u-doc-3", assigned_at: daysAgo(3), status: "active" },
  { id: "a-3", patient_id: "u-pat-2", doctor_id: "u-doc-2", assigned_at: daysAgo(8), status: "active" },
];

const drugsSeed: Drug[] = [
  { id: "dr-1", sanity_drug_id: "s-dr-1", drug_name: "Amlodipine 5mg", category: "Cardiovascular", description: "Calcium channel blocker for hypertension.", usage: "One tablet orally once daily.", side_effects: "Ankle edema, flushing, headache.", quantity: 240, status: "available", updated_at: daysAgo(2) },
  { id: "dr-2", sanity_drug_id: "s-dr-2", drug_name: "Artemether-Lumefantrine 20/120mg", category: "Antimalarial", description: "First-line ACT for uncomplicated malaria.", usage: "6-dose regimen over 3 days with fatty meal.", side_effects: "Nausea, dizziness, headache.", quantity: 8, status: "low", updated_at: daysAgo(1) },
  { id: "dr-3", sanity_drug_id: "s-dr-3", drug_name: "Sumatriptan 50mg", category: "Neurology", description: "Serotonin agonist for acute migraine attacks.", usage: "One tablet at onset; may repeat after 2 hours.", side_effects: "Tingling, chest tightness, dizziness.", quantity: 0, status: "out_of_stock", updated_at: daysAgo(3) },
  { id: "dr-4", sanity_drug_id: "s-dr-4", drug_name: "Paracetamol 500mg", category: "Analgesic", description: "Non-opioid analgesic and antipyretic.", usage: "1-2 tablets every 4-6 hours, max 8/day.", side_effects: "Rare, liver toxicity at overdose.", quantity: 1200, status: "available", updated_at: daysAgo(1) },
  { id: "dr-5", sanity_drug_id: "s-dr-5", drug_name: "Metformin 500mg", category: "Endocrine", description: "First-line therapy for Type 2 diabetes.", usage: "One tablet twice daily with meals.", side_effects: "GI upset, lactic acidosis (rare).", quantity: 480, status: "available", updated_at: daysAgo(4) },
  { id: "dr-6", sanity_drug_id: "s-dr-6", drug_name: "Ibuprofen 400mg", category: "Analgesic", description: "NSAID for pain and inflammation.", usage: "One tablet every 6-8 hours with food.", side_effects: "Gastric irritation, renal effects.", quantity: 6, status: "low", updated_at: daysAgo(1) },
];

const bookingsSeed: AmbulanceBooking[] = [
  { id: "ab-1", patient_id: "u-pat-1", patient_name: "Chioma Nwachukwu", type: "scheduled", pickup_location: "14 Lekki Phase 1, Lagos", destination: "SatCity Hospital, Victoria Island", scheduled_time: new Date(Date.now() + 3 * 864e5).toISOString(), reason: "Follow-up appointment with cardiology", status: "Confirmed", created_at: daysAgo(1) },
  { id: "ab-2", patient_id: "public-1", patient_name: "Unknown caller", type: "emergency", pickup_location: "Murtala Muhammed Way, Abuja", destination: "SatCity Hospital", scheduled_time: now, caller_name: "Ibrahim S.", description: "RTA, male ~35, conscious but bleeding from head wound", status: "Pending", created_at: new Date(Date.now() - 1000 * 60 * 4).toISOString(), is_resolved: false },
];

const notificationsSeed: Notification[] = [
  { id: "n-1", recipient_id: "u-doc-1", type: "assignment", message: "You have been assigned a new patient: Chioma Nwachukwu (Hypertension).", patient_id: "u-pat-1", is_read: false, created_at: daysAgo(10) },
  { id: "n-2", recipient_id: "u-doc-3", type: "assignment", message: "You have been assigned a new patient: Adaora Okeke (Malaria).", patient_id: "u-pat-3", is_read: false, created_at: daysAgo(3) },
];

// ============ Store ============
interface HospitalState {
  currentUserId: string | null;
  users: User[];
  departments: Department[];
  doctors: Doctor[];
  patients: Patient[];
  labResults: LabResult[];
  treatments: Treatment[];
  assignments: Assignment[];
  ambulanceBookings: AmbulanceBooking[];
  drugs: Drug[];
  notifications: Notification[];
  labTechs: User[];
  pharmacists: User[];
}

interface HospitalContextValue extends HospitalState {
  currentUser: User | null;
  currentUserDoctor: Doctor | null;
  currentUserPatient: Patient | null;
  login: (email: string) => boolean;
  logout: () => void;
  registerUser: (u: Omit<User, "id" | "created_at">) => User;
  toggleUserActive: (id: string) => void;
  deleteUser: (id: string) => boolean;
  updateDoctorStatus: (id: string, status: Doctor["availability_status"]) => void;
  uploadLabResult: (r: Omit<LabResult, "id" | "uploaded_at">) => void;
  addTreatment: (t: Omit<Treatment, "id" | "administered_at">) => void;
  bookAmbulance: (b: Omit<AmbulanceBooking, "id" | "created_at" | "status">) => void;
  submitEmergency: (b: Omit<AmbulanceBooking, "id" | "created_at" | "status" | "patient_id" | "patient_name" | "type" | "destination" | "scheduled_time">) => void;
  updateBookingStatus: (id: string, status: AmbulanceBooking["status"]) => void;
  addDrug: (d: Omit<Drug, "id" | "updated_at" | "status" | "sanity_drug_id">) => void;
  updateDrugQty: (id: string, qty: number) => void;
  markNotificationRead: (id: string) => void;
  acceptEmergency: (notifId: string, doctorId: string) => void;
}

const HospitalContext = createContext<HospitalContextValue | null>(null);

const genId = (p: string) => `${p}-${Math.random().toString(36).slice(2, 8)}`;

export function HospitalProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<HospitalState>({
    currentUserId: null,
    users: [...usersSeed, ...doctorsSeed, ...patientsSeed, ...labTechs, ...pharmacists],
    departments,
    doctors: doctorsSeed,
    patients: patientsSeed,
    labResults: labResultsSeed,
    treatments: treatmentsSeed,
    assignments: assignmentsSeed,
    ambulanceBookings: bookingsSeed,
    drugs: drugsSeed,
    notifications: notificationsSeed,
    labTechs,
    pharmacists,
  });

  // Persist current user to localStorage
  useEffect(() => {
    const saved = localStorage.getItem("satcity_current_user");
    if (saved) setState((s) => ({ ...s, currentUserId: saved }));
  }, []);
  useEffect(() => {
    if (state.currentUserId) localStorage.setItem("satcity_current_user", state.currentUserId);
    else localStorage.removeItem("satcity_current_user");
  }, [state.currentUserId]);

  const currentUser = state.users.find((u) => u.id === state.currentUserId) ?? null;
  const currentUserDoctor = currentUser?.role === "doctor" ? state.doctors.find((d) => d.id === currentUser.id) ?? null : null;
  const currentUserPatient = currentUser?.role === "patient" ? state.patients.find((p) => p.id === currentUser.id) ?? null : null;

  // Smart-assignment helper (simulates Edge Function: assign-patient-to-doctor)
  const runSmartAssignment = (lab: LabResult, st: HospitalState): HospitalState => {
    const matchedDoctors = st.doctors.filter((d) =>
      d.specialty.some((s) => s.toLowerCase().includes(lab.diagnosed_condition.toLowerCase()) ||
                             lab.diagnosed_condition.toLowerCase().includes(s.toLowerCase()))
    );
    const available = matchedDoctors.filter((d) => d.availability_status === "available");
    const notifs: Notification[] = [...st.notifications];
    const assignments = [...st.assignments];

    if (available.length > 0) {
      const target = [...available].sort((a, b) => a.active_patient_count - b.active_patient_count)[0];
      assignments.push({ id: genId("a"), patient_id: lab.patient_id, doctor_id: target.id, assigned_at: new Date().toISOString(), status: "active" });
      const pat = st.patients.find((p) => p.id === lab.patient_id);
      notifs.push({
        id: genId("n"),
        recipient_id: target.id,
        type: "assignment",
        message: `You have been assigned a new patient: ${pat?.full_name ?? "Unknown"} (${lab.diagnosed_condition}).`,
        patient_id: lab.patient_id,
        is_read: false,
        created_at: new Date().toISOString(),
      });
      const doctors = st.doctors.map((d) =>
        d.id === target.id ? { ...d, active_patient_count: d.active_patient_count + 1 } : d
      );
      return { ...st, assignments, notifications: notifs, doctors };
    } else if (matchedDoctors.length > 0) {
      matchedDoctors.forEach((d) => {
        const pat = st.patients.find((p) => p.id === lab.patient_id);
        notifs.push({
          id: genId("n"),
          recipient_id: d.id,
          type: "emergency_available_patient",
          message: `Unassigned patient with ${lab.diagnosed_condition} is awaiting a specialist. Accept to assign.`,
          specialty_context: d.specialty[0],
          patient_id: lab.patient_id,
          is_read: false,
          is_resolved: false,
          created_at: new Date().toISOString(),
        });
        void pat;
      });
      return { ...st, notifications: notifs };
    }
    return st;
  };

  const value: HospitalContextValue = {
    ...state,
    currentUser,
    currentUserDoctor,
    currentUserPatient,

    login: (email) => {
      const u = state.users.find((x) => x.email.toLowerCase() === email.toLowerCase());
      if (!u || !u.is_active) return false;
      setState((s) => ({ ...s, currentUserId: u.id }));
      return true;
    },
    logout: () => setState((s) => ({ ...s, currentUserId: null })),

    registerUser: (u) => {
      const id = genId("u");
      const newUser: User = { ...u, id, created_at: new Date().toISOString(), is_active: u.role === "patient" || u.role === "super_admin" };
      setState((s) => ({ ...s, users: [...s.users, newUser], currentUserId: newUser.id }));
      return newUser;
    },

    toggleUserActive: (id) => {
      setState((s) => ({ ...s, users: s.users.map((u) => (u.id === id ? { ...u, is_active: !u.is_active } : u)) }));
    },

    deleteUser: (id) => {
      // Only super admin can delete. Returns true if deleted.
      let deleted = false;
      setState((s) => {
        const requester = s.users.find((u) => u.id === s.currentUserId);
        if (!requester || requester.role !== "super_admin") return s;
        // Prevent deleting yourself
        if (id === requester.id) return s;
        deleted = true;
        // Cascade: remove from all related tables
        const users = s.users.filter((u) => u.id !== id);
        const doctors = s.doctors.filter((d) => d.id !== id);
        const patients = s.patients.filter((p) => p.id !== id);
        const assignments = s.assignments.filter((a) => a.patient_id !== id && a.doctor_id !== id);
        const labResults = s.labResults.filter((l) => l.patient_id !== id && l.technician_id !== id);
        const treatments = s.treatments.filter((t) => t.patient_id !== id && t.doctor_id !== id);
        const notifications = s.notifications.filter((n) => n.recipient_id !== id);
        const ambulanceBookings = s.ambulanceBookings.filter((b) => b.patient_id !== id);
        return { ...s, users, doctors, patients, assignments, labResults, treatments, notifications, ambulanceBookings };
      });
      return deleted;
    },

    updateDoctorStatus: (id, status) => {
      setState((s) => {
        const doctors = s.doctors.map((d) => (d.id === id ? { ...d, availability_status: status } : d));
        let next = { ...s, doctors };
        // check-available-doctors edge function
        if (status === "available") {
          const doc = next.doctors.find((d) => d.id === id);
          if (doc) {
            const waiting = next.notifications.filter(
              (n) => n.type === "emergency_available_patient" && !n.is_resolved &&
                doc.specialty.some((sp) => (n.specialty_context ?? "").toLowerCase() === sp.toLowerCase())
            );
            if (waiting.length > 0) {
              const first = waiting[0];
              if (first.patient_id) {
                next.assignments = [...next.assignments, { id: genId("a"), patient_id: first.patient_id, doctor_id: id, assigned_at: new Date().toISOString(), status: "active" }];
                next.doctors = next.doctors.map((d) => (d.id === id ? { ...d, active_patient_count: d.active_patient_count + 1 } : d));
              }
              // resolve all emergency notifications of same specialty for same patient
              next.notifications = next.notifications.map((n) => {
                if (n.type === "emergency_available_patient" && n.patient_id === first.patient_id) return { ...n, is_resolved: true, is_read: true };
                return n;
              });
              const pat = next.patients.find((p) => p.id === first.patient_id);
              next.notifications = [...next.notifications, {
                id: genId("n"),
                recipient_id: id,
                type: "assignment",
                message: `Auto-assigned emergency patient: ${pat?.full_name ?? "Unknown"}.`,
                patient_id: first.patient_id,
                is_read: false,
                created_at: new Date().toISOString(),
              }];
            }
          }
        }
        return next;
      });
    },

    uploadLabResult: (r) => {
      setState((s) => {
        const newResult: LabResult = { ...r, id: genId("lr"), uploaded_at: new Date().toISOString() };
        const labResults = [...s.labResults, newResult];
        // update patient symptom status
        const patients = s.patients.map((p) => {
          if (p.id !== r.patient_id) return p;
          return { ...p, symptoms: p.symptoms.map((sy) => sy.lab_test_ordered ? { ...sy, lab_test_status: "Results Uploaded" as const } : sy) };
        });
        // run smart assignment edge function
        const withAssignment = runSmartAssignment(newResult, { ...s, labResults, patients });
        return withAssignment;
      });
    },

    addTreatment: (t) => {
      setState((s) => ({
        ...s,
        treatments: [...s.treatments, { ...t, id: genId("t"), administered_at: new Date().toISOString() }],
      }));
    },

    bookAmbulance: (b) => {
      setState((s) => ({
        ...s,
        ambulanceBookings: [...s.ambulanceBookings, { ...b, id: genId("ab"), created_at: new Date().toISOString(), status: "Pending" }],
      }));
    },

    submitEmergency: (b) => {
      setState((s) => {
        const booking: AmbulanceBooking = {
          id: genId("ab"),
          patient_id: "public-" + genId("p"),
          patient_name: b.caller_name ?? "Anonymous",
          type: "emergency",
          pickup_location: b.pickup_location,
          destination: "SatCity Hospital",
          scheduled_time: new Date().toISOString(),
          caller_name: b.caller_name,
          description: b.description,
          status: "Pending",
          created_at: new Date().toISOString(),
          is_resolved: false,
        };
        // notify all admins (simulate notify-emergency-admins edge function)
        const adminIds = s.users.filter((u) => u.role === "admin" || u.role === "super_admin").map((u) => u.id);
        const notifications = [
          ...s.notifications,
          ...adminIds.map((id) => ({
            id: genId("n"),
            recipient_id: id,
            type: "emergency_request" as const,
            message: `Emergency ambulance request from ${b.caller_name ?? "Anonymous"} at ${b.pickup_location}.`,
            is_read: false,
            is_resolved: false,
            created_at: new Date().toISOString(),
          })),
        ];
        return { ...s, ambulanceBookings: [...s.ambulanceBookings, booking], notifications };
      });
    },

    updateBookingStatus: (id, status) => {
      setState((s) => ({
        ...s,
        ambulanceBookings: s.ambulanceBookings.map((b) =>
          b.id === id ? { ...b, status, ...(status === "Handled" || status === "Completed" ? { is_resolved: true } : {}) } : b
        ),
      }));
    },

    addDrug: (d) => {
      setState((s) => {
        const status: Drug["status"] = d.quantity === 0 ? "out_of_stock" : d.quantity < 10 ? "low" : "available";
        return {
          ...s,
          drugs: [...s.drugs, { ...d, id: genId("dr"), sanity_drug_id: "s-" + genId("dr"), status, updated_at: new Date().toISOString() }],
        };
      });
    },

    updateDrugQty: (id, qty) => {
      setState((s) => {
        const status: Drug["status"] = qty === 0 ? "out_of_stock" : qty < 10 ? "low" : "available";
        return { ...s, drugs: s.drugs.map((d) => (d.id === id ? { ...d, quantity: qty, status, updated_at: new Date().toISOString() } : d)) };
      });
    },

    markNotificationRead: (id) => {
      setState((s) => ({ ...s, notifications: s.notifications.map((n) => (n.id === id ? { ...n, is_read: true } : n)) }));
    },

    acceptEmergency: (notifId, doctorId) => {
      setState((s) => {
        const notif = s.notifications.find((n) => n.id === notifId);
        if (!notif || !notif.patient_id) return s;
        const assignments = [...s.assignments, { id: genId("a"), patient_id: notif.patient_id, doctor_id: doctorId, assigned_at: new Date().toISOString(), status: "active" as const }];
        const doctors = s.doctors.map((d) => (d.id === doctorId ? { ...d, active_patient_count: d.active_patient_count + 1 } : d));
        const notifications = s.notifications.map((n) => {
          if (n.type === "emergency_available_patient" && n.patient_id === notif.patient_id) return { ...n, is_resolved: true, is_read: true };
          return n;
        });
        const pat = s.patients.find((p) => p.id === notif.patient_id);
        notifications.push({
          id: genId("n"),
          recipient_id: doctorId,
          type: "assignment",
          message: `You accepted emergency patient: ${pat?.full_name ?? "Unknown"}.`,
          patient_id: notif.patient_id,
          is_read: false,
          created_at: new Date().toISOString(),
        });
        return { ...s, assignments, doctors, notifications };
      });
    },
  };

  return <HospitalContext.Provider value={value}>{children}</HospitalContext.Provider>;
}

export function useHospital() {
  const ctx = useContext(HospitalContext);
  if (!ctx) throw new Error("useHospital must be used within HospitalProvider");
  return ctx;
}

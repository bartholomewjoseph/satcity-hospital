import React from "react";

export type Role = "super_admin" | "admin" | "doctor" | "lab_tech" | "pharmacist" | "patient";

export type User = {
  id: string;
  full_name: string;
  email: string;
  role: Role;
  department_id?: string;
  is_active: boolean;
  created_at: string;
  specialty?: string[];
  availability_status?: "available" | "busy" | "off-duty";
  blood_type?: string;
  date_of_birth?: string;
  emergency_contact?: string;
  active_patient_count?: number;
};

export type Patient = {
  id: string;
  user_id: string;
  full_name: string;
  age: number;
  blood_type: string;
  phone: string;
  email: string;
  emergency_contact: string;
  assigned_doctor_id?: string;
  symptoms: { id: string; text: string; at: string }[];
  lab_tests_ordered: { id: string; name: string; status: "Pending" | "Results Uploaded" }[];
  lab_results: { id: string; diagnosed_condition: string; file_name: string; uploaded_by: string; uploaded_at: string }[];
  treatments: { id: string; illness_type: string; treatment_details: string; basis_type: "lab" | "experience" | "external"; doctor_name: string; doctor_specialty: string; administered_at: string }[];
  external_reports: { id: string; title: string; file_name: string; uploaded_at: string }[];
  created_at: string;
};

export type Drug = {
  id: string;
  sanity_drug_id: string;
  drug_name: string;
  category: string;
  description: string;
  quantity: number;
  status: "available" | "low" | "out of stock";
  updated_at: string;
};

export type AmbulanceBooking = {
  id: string;
  patient_name: string;
  type: "scheduled";
  pickup_location: string;
  destination: string;
  scheduled_time: string;
  reason: string;
  status: "Pending" | "Confirmed" | "En Route" | "Completed";
  created_at: string;
};

export type EmergencyRequest = {
  id: string;
  caller_name: string;
  location: string;
  description: string;
  created_at: string;
  is_resolved: boolean;
  handled_by?: string;
};

export type Notification = {
  id: string;
  recipient_id: string;
  type: "assignment" | "emergency_available_patient" | "info";
  message: string;
  specialty_context?: string;
  patient_id?: string;
  is_read: boolean;
  created_at: string;
};

const now = new Date().toISOString();

export const seedUsers: User[] = [
  { id: "u1", full_name: "Dr. Amelia Carter", email: "super@satcity.hosp", role: "super_admin", is_active: true, created_at: now, specialty: ["Administration"] },
  { id: "u2", full_name: "Dr. Raj Patel", email: "admin@satcity.hosp", role: "admin", department_id: "d1", is_active: true, created_at: now },
  { id: "u3", full_name: "Dr. Hannah Lee", email: "doctor@satcity.hosp", role: "doctor", department_id: "d1", is_active: true, created_at: now, specialty: ["Cardiology", "Internal Medicine"], availability_status: "available", active_patient_count: 2 },
  { id: "u4", full_name: "Dr. Marcus Chen", email: "doctor2@satcity.hosp", role: "doctor", department_id: "d1", is_active: true, created_at: now, specialty: ["Neurology"], availability_status: "busy", active_patient_count: 4 },
  { id: "u5", full_name: "Dr. Sofia Alvarez", email: "doctor3@satcity.hosp", role: "doctor", department_id: "d2", is_active: true, created_at: now, specialty: ["Pediatrics"], availability_status: "available", active_patient_count: 1 },
  { id: "u6", full_name: "Tech. Noah Bennett", email: "lab@satcity.hosp", role: "lab_tech", department_id: "d3", is_active: true, created_at: now },
  { id: "u7", full_name: "Pharm. Iris Quinn", email: "pharmacy@satcity.hosp", role: "pharmacist", department_id: "d4", is_active: true, created_at: now },
  { id: "u8", full_name: "John Doe", email: "patient@satcity.hosp", role: "patient", is_active: true, created_at: now, blood_type: "O+", date_of_birth: "1990-04-12", emergency_contact: "Jane Doe +1 555 0101" },
  { id: "u9", full_name: "Emma Wilson", email: "staff-pending@satcity.hosp", role: "doctor", department_id: "d1", is_active: false, created_at: now, specialty: ["Orthopedics"] },
];

export const seedPatients: Patient[] = [
  {
    id: "p1",
    user_id: "u8",
    full_name: "John Doe",
    age: 34,
    blood_type: "O+",
    phone: "+1 555 0199",
    email: "john@example.com",
    emergency_contact: "Jane Doe +1 555 0101",
    assigned_doctor_id: "u3",
    symptoms: [
      { id: "s1", text: "Chest discomfort on exertion, shortness of breath.", at: "2025-03-12T09:15:00Z" },
      { id: "s2", text: "Mild dizziness in the evening.", at: "2025-03-14T18:40:00Z" },
    ],
    lab_tests_ordered: [
      { id: "lt1", name: "Complete Blood Count", status: "Results Uploaded" },
      { id: "lt2", name: "Troponin Level", status: "Results Uploaded" },
      { id: "lt3", name: "Stress ECG", status: "Pending" },
    ],
    lab_results: [
      { id: "lr1", diagnosed_condition: "Mild Cardiac Ischemia", file_name: "troponin-report.pdf", uploaded_by: "Tech. Noah Bennett", uploaded_at: "2025-03-13T11:20:00Z" },
    ],
    treatments: [
      { id: "t1", illness_type: "Cardiac Ischemia", treatment_details: "Aspirin 75mg OD, lifestyle modification plan, follow-up in 2 weeks.", basis_type: "lab", doctor_name: "Dr. Hannah Lee", doctor_specialty: "Cardiology", administered_at: "2025-03-13T14:00:00Z" },
      { id: "t2", illness_type: "General fatigue", treatment_details: "Multivitamin supplementation, hydration protocol.", basis_type: "experience", doctor_name: "Dr. Hannah Lee", doctor_specialty: "Cardiology", administered_at: "2025-03-15T10:00:00Z" },
    ],
    external_reports: [
      { id: "er1", title: "External Echocardiogram", file_name: "echo-report-feb.pdf", uploaded_at: "2025-02-22T10:00:00Z" },
    ],
    created_at: "2025-03-10T08:00:00Z",
  },
  {
    id: "p2",
    user_id: "u10",
    full_name: "Maria Gonzalez",
    age: 29,
    blood_type: "A+",
    phone: "+1 555 0233",
    email: "maria@example.com",
    emergency_contact: "Carlos Gonzalez +1 555 0234",
    assigned_doctor_id: "u3",
    symptoms: [{ id: "s3", text: "Palpitations and occasional chest tightness.", at: "2025-03-18T08:10:00Z" }],
    lab_tests_ordered: [{ id: "lt4", name: "Holter Monitor", status: "Pending" }],
    lab_results: [],
    treatments: [],
    external_reports: [],
    created_at: "2025-03-18T08:00:00Z",
  },
  {
    id: "p3",
    user_id: "u11",
    full_name: "Liam O'Connor",
    age: 58,
    blood_type: "B-",
    phone: "+1 555 0444",
    email: "liam@example.com",
    emergency_contact: "Maggie O'Connor +1 555 0445",
    assigned_doctor_id: "u4",
    symptoms: [{ id: "s4", text: "Severe migraine with aura, blurred vision.", at: "2025-03-20T07:55:00Z" }],
    lab_tests_ordered: [{ id: "lt5", name: "MRI Brain", status: "Results Uploaded" }],
    lab_results: [{ id: "lr2", diagnosed_condition: "Classic Migraine", file_name: "mri-brain.pdf", uploaded_by: "Tech. Noah Bennett", uploaded_at: "2025-03-20T12:10:00Z" }],
    treatments: [{ id: "t3", illness_type: "Migraine", treatment_details: "Sumatriptan 50mg PRN, magnesium supplementation.", basis_type: "external", doctor_name: "Dr. Marcus Chen", doctor_specialty: "Neurology", administered_at: "2025-03-20T15:00:00Z" }],
    external_reports: [{ id: "er2", title: "Prior CT scan", file_name: "ct-head-2024.pdf", uploaded_at: "2024-11-02T09:00:00Z" }],
    created_at: "2025-03-20T07:00:00Z",
  },
  {
    id: "p4",
    user_id: "u12",
    full_name: "Sophie Laurent",
    age: 7,
    blood_type: "AB+",
    phone: "+1 555 0900",
    email: "sophie@example.com",
    emergency_contact: "Pierre Laurent +1 555 0901",
    assigned_doctor_id: "u5",
    symptoms: [{ id: "s5", text: "Fever and cough for 3 days.", at: "2025-03-22T08:00:00Z" }],
    lab_tests_ordered: [{ id: "lt6", name: "CBC + CRP", status: "Results Uploaded" }],
    lab_results: [{ id: "lr3", diagnosed_condition: "Viral Bronchitis", file_name: "cbc-crp.pdf", uploaded_by: "Tech. Noah Bennett", uploaded_at: "2025-03-22T11:30:00Z" }],
    treatments: [{ id: "t4", illness_type: "Bronchitis", treatment_details: "Supportive care, fluids, paracetamol.", basis_type: "lab", doctor_name: "Dr. Sofia Alvarez", doctor_specialty: "Pediatrics", administered_at: "2025-03-22T14:00:00Z" }],
    external_reports: [],
    created_at: "2025-03-22T07:00:00Z",
  },
];

export const seedDrugs: Drug[] = [
  { id: "dr1", sanity_drug_id: "san-1", drug_name: "Amoxicillin 500mg", category: "Antibiotic", description: "Broad-spectrum penicillin antibiotic.", quantity: 240, status: "available", updated_at: now },
  { id: "dr2", sanity_drug_id: "san-2", drug_name: "Atorvastatin 20mg", category: "Statin", description: "Lipid-lowering agent.", quantity: 8, status: "low", updated_at: now },
  { id: "dr3", sanity_drug_id: "san-3", drug_name: "Metformin 500mg", category: "Antidiabetic", description: "Biguanide antihyperglycemic.", quantity: 0, status: "out of stock", updated_at: now },
  { id: "dr4", sanity_drug_id: "san-4", drug_name: "Omeprazole 20mg", category: "Antacid", description: "Proton pump inhibitor.", quantity: 120, status: "available", updated_at: now },
  { id: "dr5", sanity_drug_id: "san-5", drug_name: "Aspirin 75mg", category: "Analgesic", description: "Antiplatelet analgesic.", quantity: 500, status: "available", updated_at: now },
  { id: "dr6", sanity_drug_id: "san-6", drug_name: "Sumatriptan 50mg", category: "Antimigraine", description: "Serotonin agonist.", quantity: 6, status: "low", updated_at: now },
];

export const seedBookings: AmbulanceBooking[] = [
  { id: "b1", patient_name: "John Doe", type: "scheduled", pickup_location: "12 Maple St, SatCity", destination: "SatCity Hospital — Main Entrance", scheduled_time: "2025-04-02T09:30:00Z", reason: "Routine cardiology follow-up, requires assistance.", status: "Confirmed", created_at: now },
  { id: "b2", patient_name: "Maria Gonzalez", type: "scheduled", pickup_location: "44 Cedar Ave, SatCity", destination: "SatCity Hospital — Cardiology Wing", scheduled_time: "2025-04-05T11:00:00Z", reason: "Holter monitor placement.", status: "Pending", created_at: now },
];

export const seedEmergencies: EmergencyRequest[] = [
  { id: "e1", caller_name: "Anonymous caller", location: "Intersection of 5th & Main, SatCity", description: "Person down, unresponsive, possible cardiac event.", created_at: "2025-03-28T06:12:00Z", is_resolved: true, handled_by: "Dr. Raj Patel" },
];

export const seedNotifications: Notification[] = [
  { id: "n1", recipient_id: "u3", type: "assignment", message: "New patient Maria Gonzalez assigned to you.", specialty_context: "Cardiology", patient_id: "p2", is_read: false, created_at: now },
];

type Store = {
  users: User[];
  patients: Patient[];
  drugs: Drug[];
  bookings: AmbulanceBooking[];
  emergencies: EmergencyRequest[];
  notifications: Notification[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  setPatients: React.Dispatch<React.SetStateAction<Patient[]>>;
  setDrugs: React.Dispatch<React.SetStateAction<Drug[]>>;
  setBookings: React.Dispatch<React.SetStateAction<AmbulanceBooking[]>>;
  setEmergencies: React.Dispatch<React.SetStateAction<EmergencyRequest[]>>;
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
};

const StoreContext = React.createContext<Store | null>(null);

const STORAGE_KEY = "satcity_store_v1";

function loadInitial<T>(key: string, seed: T): T {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}_${key}`);
    if (!raw) return seed;
    return JSON.parse(raw) as T;
  } catch {
    return seed;
  }
}

function usePersistedState<T>(key: string, seed: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = React.useState<T>(() => loadInitial(key, seed));
  React.useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_${key}`, JSON.stringify(state));
    } catch {}
  }, [key, state]);
  return [state, setState];
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = usePersistedState("users", seedUsers);
  const [patients, setPatients] = usePersistedState("patients", seedPatients);
  const [drugs, setDrugs] = usePersistedState("drugs", seedDrugs);
  const [bookings, setBookings] = usePersistedState("bookings", seedBookings);
  const [emergencies, setEmergencies] = usePersistedState("emergencies", seedEmergencies);
  const [notifications, setNotifications] = usePersistedState("notifications", seedNotifications);

  return (
    <StoreContext.Provider value={{ users, patients, drugs, bookings, emergencies, notifications, setUsers, setPatients, setDrugs, setBookings, setEmergencies, setNotifications }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = React.useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

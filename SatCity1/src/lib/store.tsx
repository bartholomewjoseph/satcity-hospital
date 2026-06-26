import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { supabase } from "./supabaseClient";

// ============================================================================
// Types — same shape as the mock store so consumers don't need changes.
// We JOIN users into doctors/patients/etc. in refreshAll().
// ============================================================================

export type Role =
  | "super_admin"
  | "admin"
  | "doctor"
  | "lab_tech"
  | "pharmacist"
  | "patient";

export type AvailabilityStatus = "available" | "busy" | "off_duty";
export type TreatmentBasis =
  | "lab_confirmed"
  | "doctor_experience"
  | "external_report";
export type BookingStatus =
  | "Pending"
  | "Confirmed"
  | "En Route"
  | "Completed"
  | "Handled";

export interface User {
  id: string;
  full_name: string;
  email: string;
  role: Role;
  department_id: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Department {
  id: string;
  name: string;
  admin_id: string | null;
}

export interface Doctor extends User {
  doctor_id: string;
  user_id: string;
  specialty: string[];
  availability_status: AvailabilityStatus;
  bio: string;
  active_patient_count: number;
}

export interface Patient extends User {
  patient_id: string;
  user_id: string;
  date_of_birth: string;
  blood_type: string;
  emergency_contact: string;
  address: string;
  symptoms: Array<{
    id: string;
    text: string;
    at: string;
    lab_test_ordered?: string;
    lab_test_status?: "Pending" | "Results Uploaded";
  }>;
  external_reports: Array<{
    id: string;
    name: string;
    from: string;
    url: string;
    uploaded_at: string;
  }>;
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
  basis_type: TreatmentBasis;
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
  status: BookingStatus;
  created_at: string;
  is_resolved?: boolean;
  handled_by?: string | null;
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

// ============================================================================
// Store shape
// ============================================================================

interface HospitalState {
  currentUserId: string | null;
  loading: boolean;
  authError: string | null;

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

  // derived
  currentUser: User | null;
  currentUserDoctor: Doctor | null;
  currentUserPatient: Patient | null;

  // actions
  login: (email: string, password?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  registerUser: (u: {
    full_name: string;
    email: string;
    password?: string;
    role: Role;
    department_id?: string | null;
    is_active?: boolean;
    date_of_birth?: string;
    blood_type?: string;
    emergency_contact?: string;
    address?: string;
  }) => Promise<User | null>;

  toggleUserActive: (id: string) => Promise<void>;
  deleteUser: (id: string) => boolean;

  updateDoctorStatus: (
    id: string,
    status: AvailabilityStatus
  ) => Promise<void>;

  uploadLabResult: (r: {
    patient_id: string;
    technician_id: string;
    technician_name: string;
    diagnosed_condition: string;
    result_file_url: string;
  }) => Promise<void>;

  addTreatment: (t: {
    patient_id: string;
    doctor_id: string;
    doctor_name?: string;
    doctor_specialty?: string;
    illness_type: string;
    treatment_details: string;
    basis_type: TreatmentBasis;
  }) => Promise<void>;

  bookAmbulance: (b: {
    patient_id: string;
    patient_name: string;
    type?: "scheduled" | "emergency";
    pickup_location: string;
    destination: string;
    scheduled_time: string;
    reason?: string;
  }) => Promise<void>;

  submitEmergency: (b: {
    caller_name: string;
    pickup_location: string;
    description: string;
  }) => Promise<void>;

  updateBookingStatus: (id: string, status: BookingStatus) => Promise<void>;

  addDrug: (d: {
    drug_name: string;
    category?: string;
    description?: string;
    usage?: string;
    side_effects?: string;
    quantity: number;
  }) => Promise<void>;

  updateDrugQty: (id: string, qty: number) => Promise<void>;

  markNotificationRead: (id: string) => Promise<void>;
  acceptEmergency: (notifId: string, doctorId: string) => Promise<void>;

  refreshAll: () => Promise<void>;
}

const HospitalContext = createContext<HospitalState | null>(null);

// ============================================================================
// Helper
// ============================================================================

function computeDrugStatus(qty: number): "available" | "low" | "out_of_stock" {
  if (qty === 0) return "out_of_stock";
  if (qty < 10) return "low";
  return "available";
}

// ============================================================================
// Provider
// ============================================================================

export function HospitalProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<HospitalState>({
    currentUserId: null,
    loading: true,
    authError: null,
    users: [],
    departments: [],
    doctors: [],
    patients: [],
    labResults: [],
    treatments: [],
    assignments: [],
    ambulanceBookings: [],
    drugs: [],
    notifications: [],
    labTechs: [],
    pharmacists: [],
    currentUser: null,
    currentUserDoctor: null,
    currentUserPatient: null,
    // placeholder functions — replaced below
    login: async () => false,
    logout: async () => {},
    registerUser: async () => null,
    toggleUserActive: async () => {},
    deleteUser: () => false,
    updateDoctorStatus: async () => {},
    uploadLabResult: async () => {},
    addTreatment: async () => {},
    bookAmbulance: async () => {},
    submitEmergency: async () => {},
    updateBookingStatus: async () => {},
    addDrug: async () => {},
    updateDrugQty: async () => {},
    markNotificationRead: async () => {},
    acceptEmergency: async () => {},
    refreshAll: async () => {},
  });

  // ============ Data loader ============
  const refreshAll = useCallback(async () => {
    try {
      const [usersRes, deptRes, doctorsRes, patientsRes, labRes, treatRes, assignRes, ambRes, drugsRes, notifRes] =
        await Promise.all([
          supabase.from("users").select("*").order("created_at", { ascending: false }),
          supabase.from("departments").select("*"),
          supabase.from("doctors").select("*"),
          supabase.from("patients").select("*"),
          supabase.from("lab_results").select("*").order("uploaded_at", { ascending: false }),
          supabase.from("treatments").select("*").order("administered_at", { ascending: false }),
          supabase.from("patient_doctor_assignments").select("*"),
          supabase.from("ambulance_bookings").select("*").order("created_at", { ascending: false }),
          supabase.from("drug_inventory").select("*").order("drug_name", { ascending: true }),
          supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(500),
        ]);

      const users: User[] = usersRes.data ?? [];
      const userById = new Map(users.map((u) => [u.id, u]));

      // JOIN: doctors ← users
      const doctors: Doctor[] = (doctorsRes.data ?? []).map((d: any) => {
        const u = userById.get(d.user_id);
        return {
          ...(u ?? ({ id: d.user_id, full_name: "?", email: "?", role: "doctor", department_id: null, is_active: false, created_at: "" } as User)),
          doctor_id: d.id,
          user_id: d.user_id,
          specialty: d.specialty ?? [],
          availability_status: d.availability_status ?? "off_duty",
          bio: d.bio ?? "",
          active_patient_count: d.active_patient_count ?? 0,
        };
      });

      // JOIN: patients ← users
      const patients: Patient[] = (patientsRes.data ?? []).map((p: any) => {
        const u = userById.get(p.user_id);
        return {
          ...(u ?? ({ id: p.user_id, full_name: "?", email: "?", role: "patient", department_id: null, is_active: false, created_at: "" } as User)),
          patient_id: p.id,
          user_id: p.user_id,
          date_of_birth: p.date_of_birth ?? "",
          blood_type: p.blood_type ?? "",
          emergency_contact: p.emergency_contact ?? "",
          address: p.address ?? "",
          symptoms: p.symptoms ?? [],
          external_reports: p.external_reports ?? [],
        };
      });

      // JOIN: lab_results → add technician_name
      const labResults: LabResult[] = (labRes.data ?? []).map((l: any) => ({
        id: l.id,
        patient_id: l.patient_id,
        technician_id: l.technician_id,
        technician_name: userById.get(l.technician_id)?.full_name ?? "Unknown",
        diagnosed_condition: l.diagnosed_condition,
        result_file_url: l.result_file_url,
        uploaded_at: l.uploaded_at,
      }));

      // JOIN: treatments → add doctor_name + doctor_specialty
      const doctorByUserId = new Map(doctors.map((d) => [d.id, d]));
      const treatments: Treatment[] = (treatRes.data ?? []).map((t: any) => {
        const d = doctorByUserId.get(t.doctor_id) ?? doctors.find((x) => x.id === t.doctor_id);
        return {
          id: t.id,
          patient_id: t.patient_id,
          doctor_id: t.doctor_id,
          doctor_name: d?.full_name ?? userById.get(t.doctor_id)?.full_name ?? "Unknown",
          doctor_specialty: d?.specialty?.join(", ") ?? "",
          illness_type: t.illness_type,
          treatment_details: t.treatment_details,
          basis_type: t.basis_type,
          administered_at: t.administered_at,
        };
      });

      const assignments: Assignment[] = (assignRes.data ?? []).map((a: any) => ({
        id: a.id,
        patient_id: a.patient_id,
        doctor_id: a.doctor_id,
        assigned_at: a.assigned_at,
        status: a.status,
      }));

      const ambulanceBookings: AmbulanceBooking[] = (ambRes.data ?? []).map((b: any) => ({
        id: b.id,
        patient_id: b.patient_id ?? "",
        patient_name: b.patient_name,
        type: b.type,
        pickup_location: b.pickup_location,
        destination: b.destination,
        scheduled_time: b.scheduled_time,
        reason: b.reason ?? undefined,
        caller_name: b.caller_name ?? undefined,
        description: b.description ?? undefined,
        status: b.status,
        created_at: b.created_at,
        is_resolved: b.is_resolved,
        handled_by: b.handled_by,
      }));

      const drugs: Drug[] = (drugsRes.data ?? []).map((d: any) => ({
        id: d.id,
        sanity_drug_id: d.sanity_drug_id,
        drug_name: d.drug_name,
        category: d.category ?? "",
        description: d.description ?? "",
        usage: d.usage ?? "",
        side_effects: d.side_effects ?? "",
        quantity: d.quantity,
        status: d.status,
        updated_at: d.updated_at,
      }));

      const notifications: Notification[] = (notifRes.data ?? []).map((n: any) => ({
        id: n.id,
        recipient_id: n.recipient_id,
        type: n.type,
        message: n.message,
        specialty_context: n.specialty_context ?? undefined,
        patient_id: n.patient_id ?? undefined,
        is_read: n.is_read,
        is_resolved: n.is_resolved ?? undefined,
        created_at: n.created_at,
      }));

      setState((s) => ({
        ...s,
        users,
        departments: deptRes.data ?? [],
        doctors,
        patients,
        labResults,
        treatments,
        assignments,
        ambulanceBookings,
        drugs,
        notifications,
        labTechs: users.filter((u) => u.role === "lab_tech"),
        pharmacists: users.filter((u) => u.role === "pharmacist"),
      }));
    } catch (err) {
      console.error("refreshAll failed:", err);
    }
  }, []);

  // ============ Initial session + data load ============
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setState((s) => ({ ...s, currentUserId: data.session?.user?.id ?? null }));
      await refreshAll();
      if (!mounted) return;
      setState((s) => ({ ...s, loading: false }));
    };
    init();
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setState((s) => ({ ...s, currentUserId: session?.user?.id ?? null }));
      refreshAll();
    });
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [refreshAll]);

  // ============ Realtime ============
  useEffect(() => {
    const channel = supabase
      .channel("hospital-realtime")
      .on("postgres_changes", { event: "*", schema: "public" }, () => refreshAll())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshAll]);

  // ============ Actions ============

  const login = async (email: string, password?: string): Promise<boolean> => {
    setState((s) => ({ ...s, authError: null }));

    // If no password provided → demo lookup (backward compat with seeded demo accounts).
    // In real mode, password is required.
    if (!password) {
      const user = state.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (!user || !user.is_active) {
        setState((s) => ({ ...s, authError: "Invalid email or account inactive." }));
        return false;
      }
      setState((s) => ({ ...s, currentUserId: user.id }));
      return true;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setState((s) => ({ ...s, authError: error.message }));
      return false;
    }
    // Wait a tick for the session to settle, then check is_active
    await refreshAll();
    return true;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setState((s) => ({ ...s, currentUserId: null }));
  };

  const registerUser: HospitalState["registerUser"] = async (u) => {
    setState((s) => ({ ...s, authError: null }));

    // If password provided → real Supabase auth signup
    if (u.password) {
      const metadata: Record<string, string> = { full_name: u.full_name, role: u.role };
      if (u.department_id) metadata.department_id = u.department_id;
      if (u.date_of_birth) metadata.date_of_birth = u.date_of_birth;
      if (u.blood_type) metadata.blood_type = u.blood_type;
      if (u.emergency_contact) metadata.emergency_contact = u.emergency_contact;
      if (u.address) metadata.address = u.address;

      const { data, error } = await supabase.auth.signUp({
        email: u.email,
        password: u.password,
        options: { data: metadata },
      });

      if (error) {
        setState((s) => ({ ...s, authError: error.message }));
        return null;
      }

      if (data.user && u.department_id) {
        await supabase.from("users").update({ department_id: u.department_id }).eq("id", data.user.id);
      }
      await refreshAll();
      const newUser = state.users.find((x) => x.id === data.user?.id) ?? null;
      if (newUser) setState((s) => ({ ...s, currentUserId: newUser.id }));
      return newUser;
    }

    // No password → demo mode (insert into users directly for local testing)
    const id = `u-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const newUser: User = {
      id,
      full_name: u.full_name,
      email: u.email,
      role: u.role,
      department_id: u.department_id ?? null,
      is_active: u.is_active ?? u.role === "patient",
      created_at: new Date().toISOString(),
    };
    setState((s) => ({
      ...s,
      users: [...s.users, newUser],
      currentUserId: newUser.id,
      labTechs: u.role === "lab_tech" ? [...s.labTechs, newUser] : s.labTechs,
      pharmacists: u.role === "pharmacist" ? [...s.pharmacists, newUser] : s.pharmacists,
    }));
    return newUser;
  };

  const toggleUserActive = async (id: string) => {
    const current = state.users.find((u) => u.id === id);
    if (!current) return;
    await supabase.from("users").update({ is_active: !current.is_active }).eq("id", id);
    await refreshAll();
  };

  const deleteUser = (id: string): boolean => {
    const requester = state.users.find((u) => u.id === state.currentUserId);
    if (!requester || requester.role !== "super_admin") return false;
    if (id === requester.id) return false;

    // Fire-and-forget: RLS enforces the policy.
    supabase.from("users").delete().eq("id", id).then(() => refreshAll());
    // Optimistic local update
    setState((s) => ({
      ...s,
      users: s.users.filter((u) => u.id !== id),
      doctors: s.doctors.filter((d) => d.id !== id),
      patients: s.patients.filter((p) => p.id !== id),
      assignments: s.assignments.filter((a) => a.patient_id !== id && a.doctor_id !== id),
      notifications: s.notifications.filter((n) => n.recipient_id !== id),
    }));
    return true;
  };

  const updateDoctorStatus = async (id: string, status: AvailabilityStatus) => {
    await supabase.from("doctors").update({ availability_status: status }).eq("user_id", id);
    await refreshAll();
  };

  const uploadLabResult: HospitalState["uploadLabResult"] = async (r) => {
    await supabase.from("lab_results").insert({
      patient_id: r.patient_id,
      technician_id: r.technician_id,
      diagnosed_condition: r.diagnosed_condition,
      result_file_url: r.result_file_url,
    });
    // DB webhook fires assign-patient-to-doctor edge function.
    await refreshAll();
  };

  const addTreatment: HospitalState["addTreatment"] = async (t) => {
    await supabase.from("treatments").insert({
      patient_id: t.patient_id,
      doctor_id: t.doctor_id,
      illness_type: t.illness_type,
      treatment_details: t.treatment_details,
      basis_type: t.basis_type,
    });
    await refreshAll();
  };

  const bookAmbulance: HospitalState["bookAmbulance"] = async (b) => {
    await supabase.from("ambulance_bookings").insert({
      patient_id: b.patient_id,
      patient_name: b.patient_name,
      type: b.type ?? "scheduled",
      pickup_location: b.pickup_location,
      destination: b.destination,
      scheduled_time: b.scheduled_time,
      reason: b.reason,
      status: "Pending",
    });
    await refreshAll();
  };

  const submitEmergency: HospitalState["submitEmergency"] = async (b) => {
    await supabase.from("emergency_requests").insert({
      caller_name: b.caller_name,
      location: b.pickup_location,
      description: b.description,
    });
    // DB webhook fires notify-emergency-admins edge function.
    await refreshAll();
  };

  const updateBookingStatus = async (id: string, status: BookingStatus) => {
    const isResolved = status === "Completed" || status === "Handled";
    await supabase.from("ambulance_bookings").update({ status, is_resolved: isResolved }).eq("id", id);
    await refreshAll();
  };

  const addDrug: HospitalState["addDrug"] = async (d) => {
    await supabase.from("drug_inventory").insert({
      sanity_drug_id: `s-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      drug_name: d.drug_name,
      category: d.category ?? null,
      description: d.description ?? null,
      usage: d.usage ?? null,
      side_effects: d.side_effects ?? null,
      quantity: d.quantity,
      status: computeDrugStatus(d.quantity),
    });
    await refreshAll();
  };

  const updateDrugQty = async (id: string, qty: number) => {
    await supabase
      .from("drug_inventory")
      .update({ quantity: qty, status: computeDrugStatus(qty) })
      .eq("id", id);
    await refreshAll();
  };

  const markNotificationRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
  };

  const acceptEmergency = async (notifId: string, doctorId: string) => {
    // Find the doctor's DB id (not user id)
    const doc = state.doctors.find((d) => d.id === doctorId);
    const doctorDbId = doc?.doctor_id ?? doctorId;
    await supabase.functions.invoke("accept-emergency-patient", {
      body: { notification_id: notifId, doctor_id: doctorDbId },
    });
    await refreshAll();
  };

  // ============ Derived ============

  const currentUser = state.users.find((u) => u.id === state.currentUserId) ?? null;
  const currentUserDoctor =
    currentUser?.role === "doctor" ? state.doctors.find((d) => d.id === currentUser.id) ?? null : null;
  const currentUserPatient =
    currentUser?.role === "patient" ? state.patients.find((p) => p.id === currentUser.id) ?? null : null;

  const value: HospitalState = {
    ...state,
    currentUser,
    currentUserDoctor,
    currentUserPatient,
    login,
    logout,
    registerUser,
    toggleUserActive,
    deleteUser,
    updateDoctorStatus,
    uploadLabResult,
    addTreatment,
    bookAmbulance,
    submitEmergency,
    updateBookingStatus,
    addDrug,
    updateDrugQty,
    markNotificationRead,
    acceptEmergency,
    refreshAll,
  };

  return <HospitalContext.Provider value={value}>{children}</HospitalContext.Provider>;
}

// ============================================================================
// Hooks — both names exported for convenience
// ============================================================================

export function useHospital(): HospitalState {
  const ctx = useContext(HospitalContext);
  if (!ctx) throw new Error("useHospital must be used within HospitalProvider");
  return ctx;
}

export const useStore = useHospital;

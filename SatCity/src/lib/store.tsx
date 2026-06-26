import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "./supabase";

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

type RegisterUserInput = Omit<User, "id" | "created_at"> & Partial<Pick<Patient, "date_of_birth" | "blood_type" | "emergency_contact" | "address" | "symptoms" | "external_reports">> & {
  password?: string;
};

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
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  registerUser: (u: RegisterUserInput, password?: string) => Promise<User>;
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

const DEFAULT_SUPERADMIN_EMAIL = "superadmin@satcity";
const DEFAULT_SUPERADMIN_PASSWORD = "admin@satcity!";
const genId = (p: string) => `${p}-${Math.random().toString(36).slice(2, 8)}`;

const generateTempPassword = () => `Temp-${Math.random().toString(36).slice(2, 10)}!`;

const initialHospitalState: HospitalState = {
  currentUserId: null,
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
};

export function HospitalProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<HospitalState>(initialHospitalState);

  // Persist current user to localStorage
  useEffect(() => {
    const saved = localStorage.getItem("satcity_current_user");
    if (saved) setState((s) => ({ ...s, currentUserId: saved }));
  }, []);
  useEffect(() => {
    if (state.currentUserId) localStorage.setItem("satcity_current_user", state.currentUserId);
    else localStorage.removeItem("satcity_current_user");
  }, [state.currentUserId]);

  useEffect(() => {
    const loadData = async () => {
      const [usersRes, depsRes, doctorsRes, patientsRes, labResultsRes, treatmentsRes, assignmentsRes, bookingsRes, drugsRes, notificationsRes] = await Promise.all([
        supabase.from("users").select("*"),
        supabase.from("departments").select("*"),
        supabase.from("doctors").select("*"),
        supabase.from("patients").select("*"),
        supabase.from("lab_results").select("*"),
        supabase.from("treatments").select("*"),
        supabase.from("patient_doctor_assignments").select("*"),
        supabase.from("ambulance_bookings").select("*"),
        supabase.from("drug_inventory").select("*"),
        supabase.from("notifications").select("*"),
      ]);

      const error = usersRes.error ?? depsRes.error ?? doctorsRes.error ?? patientsRes.error ?? labResultsRes.error ?? treatmentsRes.error ?? assignmentsRes.error ?? bookingsRes.error ?? drugsRes.error ?? notificationsRes.error;
      if (error) {
        console.error("Supabase load error", error);
        return;
      }

      const users = usersRes.data ?? [];
      const usersById = new Map(users.map((u) => [u.id, u]));
      const doctorRows = doctorsRes.data ?? [];
      const patientRows = patientsRes.data ?? [];
      const patientRowIdToUserId = new Map(patientRows.map((p) => [p.id, p.user_id]));
      const doctorRowIdToUserId = new Map(doctorRows.map((d) => [d.id, d.user_id]));

      const doctors = doctorRows
        .map((doc) => {
          const user = usersById.get(doc.user_id);
          if (!user) return null;
          return {
            ...user,
            doctor_id: doc.id,
            specialty: doc.specialty ?? [],
            availability_status: doc.availability_status as Doctor["availability_status"],
            bio: doc.bio ?? "",
            active_patient_count: doc.active_patient_count ?? 0,
          } as Doctor;
        })
        .filter((d): d is Doctor => d !== null);

      const patients = patientRows
        .map((pat) => {
          const user = usersById.get(pat.user_id);
          if (!user) return null;
          return {
            ...user,
            patient_id: pat.id,
            date_of_birth: pat.date_of_birth,
            blood_type: pat.blood_type,
            emergency_contact: pat.emergency_contact ?? "",
            address: pat.address ?? "",
            symptoms: pat.symptoms ?? [],
            external_reports: pat.external_reports ?? [],
          } as Patient;
        })
        .filter((p): p is Patient => p !== null);

      const labResults = (labResultsRes.data ?? []).map((row) => {
        const technician = usersById.get(row.technician_id);
        return {
          ...row,
          patient_id: patientRowIdToUserId.get(row.patient_id) ?? row.patient_id,
          technician_name: technician?.full_name ?? "",
          uploaded_at: row.uploaded_at,
        } as LabResult;
      });

      const treatments = (treatmentsRes.data ?? []).map((row) => {
        const doctorUser = usersById.get(row.doctor_id);
        const doctorUserRecord = doctors.find((d) => d.id === row.doctor_id);
        return {
          ...row,
          doctor_name: doctorUser?.full_name ?? "",
          doctor_specialty: doctorUserRecord?.specialty?.[0] ?? "",
        } as Treatment;
      });

      const assignments = (assignmentsRes.data ?? []).map((row) => ({
        ...row,
        patient_id: patientRowIdToUserId.get(row.patient_id) ?? row.patient_id,
        doctor_id: doctorRowIdToUserId.get(row.doctor_id) ?? row.doctor_id,
      })) as Assignment[];

      const bookings = bookingsRes.data ?? [];
      const drugs = drugsRes.data ?? [];
      const notifications = (notificationsRes.data ?? []).map((row) => ({
        ...row,
        patient_id: patientRowIdToUserId.get(row.patient_id) ?? row.patient_id,
      })) as Notification[];

      setState((s) => ({
        ...s,
        users,
        departments: depsRes.data ?? [],
        doctors,
        patients,
        labResults,
        treatments,
        assignments,
        ambulanceBookings: bookings,
        drugs,
        notifications,
        labTechs: users.filter((u) => u.role === "lab_tech"),
        pharmacists: users.filter((u) => u.role === "pharmacist"),
      }));

      const ensureSuperAdmin = async () => {
        const defaultEmail = "superadmin@satcity";
        const defaultPassword = "admin@satcity!";
        const existingSuper = users.find((u) => u.email === defaultEmail && u.role === "super_admin");
        if (users.some((u) => u.role === "super_admin" && u.is_active)) return;

        const { data: authData } = await supabase.auth.signInWithPassword({ email: defaultEmail, password: defaultPassword });
        if (authData?.user) {
          const userId = authData.user.id;
          if (!existingSuper) {
            const { data: profileData } = await supabase
              .from("users")
              .insert([
                {
                  id: userId,
                  full_name: "Super Admin",
                  email: defaultEmail,
                  role: "super_admin",
                  department_id: null,
                  is_active: true,
                },
              ])
              .select()
              .single();
            if (profileData) {
              setState((s) => ({
                ...s,
                users: [...s.users, profileData as User],
                labTechs: [...s.labTechs],
                pharmacists: [...s.pharmacists],
              }));
            }
          } else if (!existingSuper.is_active) {
            const { data: profileData } = await supabase
              .from("users")
              .update({ is_active: true })
              .eq("id", userId)
              .select()
              .single();
            if (profileData) {
              setState((s) => ({
                ...s,
                users: s.users.map((u) => (u.id === userId ? (profileData as User) : u)),
              }));
            }
          }
          return;
        }

        if (!existingSuper) {
          const { data: adminData } = await supabase.auth.admin.createUser({
            email: defaultEmail,
            password: defaultPassword,
            email_confirm: true,
            user_metadata: { full_name: "Super Admin" },
          });
          if (adminData?.user?.id) {
            const authUserId = adminData.user.id;
            const { data: profileData } = await supabase
              .from("users")
              .insert([
                {
                  id: authUserId,
                  full_name: "Super Admin",
                  email: defaultEmail,
                  role: "super_admin",
                  department_id: null,
                  is_active: true,
                },
              ])
              .select()
              .single();
            if (profileData) {
              setState((s) => ({
                ...s,
                users: [...s.users, profileData as User],
              }));
            }
          }
        }
      };

      await ensureSuperAdmin();
    };

    loadData();
  }, []);

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

    login: async (email, password) => {
      if (!email || !password) return false;

      if (email === DEFAULT_SUPERADMIN_EMAIL && password === DEFAULT_SUPERADMIN_PASSWORD) {
        const superRes = await supabase.from("users").select("*").eq("email", DEFAULT_SUPERADMIN_EMAIL).single();
        const superProfile = !superRes.error ? superRes.data as User | null : null;

        if (!superProfile) {
          const createSuper = await supabase.auth.admin.createUser({
            email: DEFAULT_SUPERADMIN_EMAIL,
            password: DEFAULT_SUPERADMIN_PASSWORD,
            email_confirm: true,
            user_metadata: { full_name: "Super Admin" },
          });
          if (!createSuper.data?.user || createSuper.error) return false;
          const authUserId = createSuper.data.user.id;
          const { data: profileData } = await supabase
            .from("users")
            .insert([
              {
                id: authUserId,
                full_name: "Super Admin",
                email: DEFAULT_SUPERADMIN_EMAIL,
                role: "super_admin",
                department_id: null,
                is_active: true,
              },
            ])
            .select()
            .single();
          if (!profileData) return false;
          setState((s) => ({
            ...s,
            currentUserId: profileData.id,
            users: s.users.some((u) => u.id === profileData.id) ? s.users : [...s.users, profileData],
          }));
          return true;
        }

        if (!superProfile.is_active) {
          const { data: updatedSuper, error: updateError } = await supabase
            .from("users")
            .update({ is_active: true })
            .eq("email", DEFAULT_SUPERADMIN_EMAIL)
            .select()
            .single();
          if (!updatedSuper || updateError) return false;
          setState((s) => ({
            ...s,
            currentUserId: updatedSuper.id,
            users: s.users.some((u) => u.id === updatedSuper.id) ? s.users : [...s.users, updatedSuper],
          }));
          return true;
        }

        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
        let authUserId = authData?.user?.id ?? null;
        if (!authUserId) {
          const createSuper = await supabase.auth.admin.createUser({
            email: DEFAULT_SUPERADMIN_EMAIL,
            password: DEFAULT_SUPERADMIN_PASSWORD,
            email_confirm: true,
            user_metadata: { full_name: "Super Admin" },
          });
          if (createSuper.data?.user?.id) {
            authUserId = createSuper.data.user.id;
          } else if (createSuper.error && !createSuper.error.message.includes("already exists")) {
            return false;
          }
        }

        setState((s) => ({
          ...s,
          currentUserId: superProfile.id,
          users: s.users.some((u) => u.id === superProfile.id) ? s.users : [...s.users, superProfile],
        }));
        return true;
      }

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError || !authData?.user) return false;
      const userId = authData.user.id;
      const { data, error } = await supabase.from("users").select("*").eq("id", userId).single();
      if (error || !data || !data.is_active) return false;
      const user = data as User;
      setState((s) => ({
        ...s,
        currentUserId: user.id,
        users: s.users.some((u) => u.id === user.id) ? s.users : [...s.users, user],
      }));
      return true;
    },
    logout: () => setState((s) => ({ ...s, currentUserId: null })),

    registerUser: async (u, password) => {
      if (!u.email || !u.full_name || !u.role) {
        throw new Error("Email, full name, and role are required.");
      }

      const effectivePassword = password || generateTempPassword();
      const shouldSignIn = Boolean(password);

      let authUserId: string | null = null;
      let authUserEmail = u.email;
      let authUserFullName = u.full_name;
      let authErrorMessage: string | null = null;

      try {
        const { data, error } = await supabase.auth.admin.createUser({
          email: authUserEmail,
          password: effectivePassword,
          email_confirm: true,
          user_metadata: { full_name: authUserFullName },
        });

        if (error) {
          authErrorMessage = error.message;
        } else if (data?.user) {
          authUserId = data.user.id;
        }
      } catch (adminError) {
        authErrorMessage = (adminError as Error)?.message ?? String(adminError);
      }

      if (!authUserId) {
        const { data, error } = await supabase.auth.signUp({ email: authUserEmail, password: effectivePassword });
        console.log("signUp user:", data.user);
        console.log("signUp user id:", data.user?.id);
        if (error || !data?.user) {
          throw new Error(error?.message ?? authErrorMessage ?? "Unable to create auth user.");
        }
        authUserId = data.user.id;
        console.log("authUserId before insert:", authUserId);
      }

      console.log("Inserting profile:", {
        id: authUserId,
        email: u.email,
        role: u.role,
      });
      const departmentId = u.department_id && state.departments.some((d) => d.id === u.department_id)
        ? u.department_id
        : null;

      if (u.department_id && !departmentId) {
        throw new Error("Selected department is invalid. Please choose a valid department.");
      }

      const { data: profileData, error: profileError } = await supabase
        .from("users")
        .insert([
          {
            id: authUserId,
            full_name: u.full_name,
            email: u.email,
            role: u.role,
            department_id: departmentId,
            is_active: u.is_active,
          },
        ])
        .select()
        .single();

      if (profileError || !profileData) {
        throw new Error(profileError?.message ?? "Failed to create user profile.");
      }

      const newUser = profileData as User;
      const createDoctor = newUser.role === "doctor";
      const createPatient = newUser.role === "patient";

      setState((s) => {
        let doctors = s.doctors;
        let patients = s.patients;

        if (createDoctor) {
          const doctorRow = {
            user_id: newUser.id,
            specialty: [],
            availability_status: "off_duty",
            bio: "",
            active_patient_count: 0,
          };
          const doctorData = { ...doctorRow, id: genId("doc") };
          doctors = [...doctors, { ...newUser, doctor_id: doctorData.id, specialty: doctorRow.specialty, availability_status: doctorRow.availability_status as Doctor["availability_status"], bio: doctorRow.bio, active_patient_count: doctorRow.active_patient_count }];
          const { error: doctorError } = await supabase
            .from("doctors")
            .insert([doctorRow]);
          if (doctorError) {
            console.error("Doctor table error:", doctorError);
            throw new Error(doctorError.message);
          }
        }

        if (createPatient) {
          const patientRow = {
            user_id: newUser.id,
            date_of_birth: u.date_of_birth ?? new Date().toISOString().slice(0, 10),
            blood_type: u.blood_type ?? "O+",
            emergency_contact: u.emergency_contact ?? "",
            address: u.address ?? "",
            symptoms: [],
            external_reports: [],
          };
          const patientData = { ...patientRow, id: genId("pat") };
          patients = [...patients, { ...newUser, patient_id: patientData.id, date_of_birth: patientRow.date_of_birth, blood_type: patientRow.blood_type, emergency_contact: patientRow.emergency_contact, address: patientRow.address, symptoms: patientRow.symptoms, external_reports: patientRow.external_reports }];
          const { error: patientError } = await supabase
            .from("patients")
            .insert([patientRow]);
          if (patientError) {
            console.error("Patient table error:", patientError);
            throw new Error(patientError.message);
          }
        }

        return {
          ...s,
          users: s.users.some((existing) => existing.id === newUser.id) ? s.users : [...s.users, newUser],
          doctors,
          patients,
          currentUserId: shouldSignIn && newUser.is_active ? newUser.id : s.currentUserId,
        };
      });

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

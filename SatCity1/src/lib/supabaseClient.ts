import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "❌ Supabase env vars missing. Create .env.local with:\n" +
      "VITE_SUPABASE_URL=https://xxxx.supabase.co\n" +
      "VITE_SUPABASE_ANON_KEY=eyJ..."
  );
}

export const supabase = createClient(
  supabaseUrl ?? "https://placeholder.supabase.co",
  supabaseAnonKey ?? "placeholder",
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);

// ============================================================================
// TypeScript types for our database (matches schema.sql)
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
export type DrugStatus = "available" | "low" | "out_of_stock";
export type NotifType =
  | "assignment"
  | "emergency_available_patient"
  | "emergency_request";

export interface UserRow {
  id: string;
  full_name: string;
  email: string;
  role: Role;
  department_id: string | null;
  is_active: boolean;
  created_at: string;
}

export interface DepartmentRow {
  id: string;
  name: string;
  admin_id: string | null;
  created_at: string;
}

export interface DoctorRow {
  id: string;
  user_id: string;
  specialty: string[];
  availability_status: AvailabilityStatus;
  bio: string | null;
  active_patient_count: number;
}

export interface PatientRow {
  id: string;
  user_id: string;
  date_of_birth: string;
  blood_type: string;
  emergency_contact: string | null;
  address: string | null;
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

export interface LabResultRow {
  id: string;
  patient_id: string;
  technician_id: string;
  diagnosed_condition: string;
  result_file_url: string;
  uploaded_at: string;
}

export interface TreatmentRow {
  id: string;
  patient_id: string;
  doctor_id: string;
  illness_type: string;
  treatment_details: string;
  basis_type: TreatmentBasis;
  administered_at: string;
}

export interface AssignmentRow {
  id: string;
  patient_id: string;
  doctor_id: string;
  assigned_at: string;
  status: "active" | "resolved";
}

export interface AmbulanceBookingRow {
  id: string;
  patient_id: string | null;
  patient_name: string;
  type: "scheduled" | "emergency";
  pickup_location: string;
  destination: string;
  scheduled_time: string;
  reason?: string | null;
  caller_name?: string | null;
  description?: string | null;
  status: BookingStatus;
  is_resolved: boolean;
  handled_by: string | null;
  created_at: string;
}

export interface DrugRow {
  id: string;
  sanity_drug_id: string;
  drug_name: string;
  category: string | null;
  description: string | null;
  usage: string | null;
  side_effects: string | null;
  quantity: number;
  status: DrugStatus;
  updated_at: string;
}

export interface NotificationRow {
  id: string;
  recipient_id: string;
  type: NotifType;
  message: string;
  specialty_context: string | null;
  patient_id: string | null;
  is_read: boolean;
  is_resolved: boolean;
  created_at: string;
}

export interface EmergencyRequestRow {
  id: string;
  caller_name: string | null;
  location: string;
  description: string | null;
  created_at: string;
  handled_by: string | null;
  is_resolved: boolean;
}

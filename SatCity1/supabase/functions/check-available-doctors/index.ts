// supabase/functions/check-available-doctors/index.ts
//
// TRIGGER: Database Webhook on UPDATE of doctors.availability_status
//          (specifically when it becomes 'available')
//
// LOGIC:
//  1. Check if the new status is actually 'available' — if not, exit
//  2. Query notifications for unresolved 'emergency_available_patient'
//     entries whose specialty_context matches this doctor's specialty
//  3. If a match exists, auto-assign the first waiting patient to this
//     newly-available doctor
//  4. Resolve all other emergency notifications for that patient
//

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

interface DoctorUpdateRecord {
  id: string;
  user_id: string;
  specialty: string[];
  availability_status: string;
  active_patient_count: number;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  let payload: { record?: DoctorUpdateRecord; old_record?: DoctorUpdateRecord };
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const record = payload.record;
  if (!record) {
    return new Response(JSON.stringify({ error: "Missing record" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Only act when status JUST BECAME available
  if (record.availability_status !== "available") {
    return new Response(
      JSON.stringify({ ok: true, skipped: true, reason: "not_available_status" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Find all unresolved emergency notifications that match this doctor's specialty
  const doctorSpecialties = record.specialty ?? [];

  const { data: waitingNotifs, error: notErr } = await supabase
    .from("notifications")
    .select("*")
    .eq("type", "emergency_available_patient")
    .eq("is_resolved", false);

  if (notErr) {
    return new Response(JSON.stringify({ error: notErr.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const matching = (waitingNotifs ?? []).filter((n) => {
    const ctx = (n.specialty_context ?? "").toLowerCase();
    return doctorSpecialties.some((s) => s.toLowerCase() === ctx);
  });

  if (matching.length === 0) {
    return new Response(
      JSON.stringify({ ok: true, assigned: false, reason: "no_waiting_patients" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  // Take the oldest waiting notification
  const first = matching.sort((a, b) =>
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )[0];

  const patientId = first.patient_id;

  // Insert assignment
  const { error: assignErr } = await supabase.from("patient_doctor_assignments").insert({
    patient_id: patientId,
    doctor_id: record.id,
    assigned_at: new Date().toISOString(),
    status: "active",
  });

  if (assignErr) {
    return new Response(JSON.stringify({ error: assignErr.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Increment doctor count
  await supabase
    .from("doctors")
    .update({ active_patient_count: (record.active_patient_count ?? 0) + 1 })
    .eq("id", record.id);

  // Resolve ALL emergency notifications for that patient
  await supabase
    .from("notifications")
    .update({ is_resolved: true, is_read: true })
    .eq("patient_id", patientId)
    .eq("type", "emergency_available_patient");

  // Notify doctor of auto-assignment
  await supabase.from("notifications").insert({
    recipient_id: record.user_id,
    type: "assignment",
    message: `Auto-assigned emergency patient ${patientId} — you just came online.`,
    patient_id: patientId,
    is_read: false,
    created_at: new Date().toISOString(),
  });

  return new Response(
    JSON.stringify({
      ok: true,
      auto_assigned: true,
      doctor_id: record.id,
      patient_id: patientId,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
});

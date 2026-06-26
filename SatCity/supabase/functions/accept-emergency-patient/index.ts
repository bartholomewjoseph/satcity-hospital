// supabase/functions/accept-emergency-patient/index.ts
//
// TRIGGER: HTTP POST from doctor dashboard when clicking "Accept" on an
//          emergency_available_patient notification banner.
//
// LOGIC:
//  1. Read notif_id + doctor_id from body
//  2. Fetch the notification, confirm it's unresolved and emergency type
//  3. Insert a patient_doctor_assignments row
//  4. Increment the doctor's active_patient_count
//  5. Mark ALL emergency_available_patient notifications for that patient
//     as resolved (so other doctors stop seeing them)
//  6. Insert an 'assignment' notification for the accepting doctor
//

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

interface AcceptPayload {
  notification_id: string;
  doctor_id: string;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: AcceptPayload;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!body.notification_id || !body.doctor_id) {
    return new Response(JSON.stringify({ error: "notification_id and doctor_id required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("https://gnfnfcgwyykzashpzfzb.supabase.co") ?? "";
  const supabaseServiceKey = Deno.env.get("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduZm5mY2d3eXlremFzaHB6ZnpiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjQwMjc1NiwiZXhwIjoyMDk3OTc4NzU2fQ.dz-OpJmu06-JW_JbmIESjflDo1hKL6odiNiKsklKNm0") ?? "";
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // 1. Fetch the notification
  const { data: notif, error: nErr } = await supabase
    .from("notifications")
    .select("*")
    .eq("id", body.notification_id)
    .single();

  if (nErr || !notif) {
    return new Response(JSON.stringify({ error: "Notification not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (notif.type !== "emergency_available_patient" || notif.is_resolved) {
    return new Response(
      JSON.stringify({ error: "Notification already resolved or wrong type" }),
      { status: 409, headers: { "Content-Type": "application/json" } }
    );
  }

  const patientId = notif.patient_id;

  // 2. Insert assignment
  const { error: assignErr } = await supabase.from("patient_doctor_assignments").insert({
    patient_id: patientId,
    doctor_id: body.doctor_id,
    assigned_at: new Date().toISOString(),
    status: "active",
  });

  if (assignErr) {
    return new Response(JSON.stringify({ error: assignErr.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 3. Increment doctor active patient count
  const { data: doctor } = await supabase
    .from("doctors")
    .select("active_patient_count")
    .eq("id", body.doctor_id)
    .single();

  await supabase
    .from("doctors")
    .update({ active_patient_count: (doctor?.active_patient_count ?? 0) + 1 })
    .eq("id", body.doctor_id);

  // 4. Resolve ALL emergency notifications for this patient
  await supabase
    .from("notifications")
    .update({ is_resolved: true, is_read: true })
    .eq("patient_id", patientId)
    .eq("type", "emergency_available_patient")
    .eq("is_resolved", false);

  // 5. Notify the accepting doctor
  await supabase.from("notifications").insert({
    recipient_id: doctor ? body.doctor_id : body.doctor_id,
    type: "assignment",
    message: `You accepted emergency patient ${patientId}. Please proceed with examination.`,
    patient_id: patientId,
    is_read: false,
    created_at: new Date().toISOString(),
  });

  return new Response(
    JSON.stringify({ ok: true, patient_id: patientId, doctor_id: body.doctor_id }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
});

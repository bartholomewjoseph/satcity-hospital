
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

interface LabResultRecord {
  id: string;
  patient_id: string;
  technician_id: string;
  diagnosed_condition: string;
  result_file_url: string;
  uploaded_at: string;
}

interface DoctorRecord {
  id: string;
  user_id: string;
  full_name: string;
  specialty: string[];
  availability_status: "available" | "busy" | "off_duty";
  active_patient_count: number;
}

Deno.serve(async (req: Request) => {
  // ---------- 1. Verify & parse incoming webhook ----------
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  let payload: { record?: LabResultRecord; type?: string; table?: string };
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const record = payload.record;
  if (!record || !record.patient_id || !record.diagnosed_condition) {
    return new Response(
      JSON.stringify({ error: "Missing patient_id or diagnosed_condition in record" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // ---------- 2. Initialize service-role Supabase client ----------
  const supabaseUrl = Deno.env.get("https://gnfnfcgwyykzashpzfzb.supabase.co") ?? "";
  const supabaseServiceKey = Deno.env.get("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduZm5mY2d3eXlremFzaHB6ZnpiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjQwMjc1NiwiZXhwIjoyMDk3OTc4NzU2fQ.dz-OpJmu06-JW_JbmIESjflDo1hKL6odiNiKsklKNm0") ?? "";

  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(JSON.stringify({ error: "Supabase env vars missing" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const condition = record.diagnosed_condition.trim().toLowerCase();

  // ---------- 3. Find doctors whose specialty matches ----------
  // Using Postgres array contains + ILIKE fallback. We fetch all doctors,
  // then filter in JS because specialty is a text[] and condition matching
  // can be fuzzy (e.g. "Malaria" vs "Plasmodium falciparum malaria").
  const { data: allDoctors, error: docErr } = await supabase
    .from("doctors")
    .select("id, user_id, specialty, availability_status, active_patient_count, users(full_name)");

  if (docErr) {
    console.error("Failed to fetch doctors:", docErr);
    return new Response(JSON.stringify({ error: docErr.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const doctors = (allDoctors ?? []) as unknown as Array<DoctorRecord & { users: { full_name: string } }>;

  // Fuzzy specialty match — case-insensitive substring match
  const matchedDoctors = doctors.filter((d) =>
    d.specialty?.some((s: string) => {
      const sp = s.toLowerCase();
      return sp.includes(condition) || condition.includes(sp);
    })
  );

  if (matchedDoctors.length === 0) {
    console.log(`No matching specialty for condition: ${condition}`);
    return new Response(
      JSON.stringify({ ok: true, assigned: false, reason: "no_matching_specialist" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  // ---------- 4. Filter by availability ----------
  const availableDoctors = matchedDoctors.filter((d) => d.availability_status === "available");

  // ---------- 5A. Happy path: at least one available doctor ----------
  if (availableDoctors.length > 0) {
    // Load balance: pick the doctor with the fewest active patients
    const target = availableDoctors.sort(
      (a, b) => (a.active_patient_count ?? 0) - (b.active_patient_count ?? 0)
    )[0];

    // 5A-i. Insert assignment
    const { error: assignErr } = await supabase.from("patient_doctor_assignments").insert({
      patient_id: record.patient_id,
      doctor_id: target.id,
      assigned_at: new Date().toISOString(),
      status: "active",
    });

    if (assignErr) {
      console.error("Failed to insert assignment:", assignErr);
      return new Response(JSON.stringify({ error: assignErr.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 5A-ii. Increment doctor's active_patient_count
    await supabase
      .from("doctors")
      .update({ active_patient_count: (target.active_patient_count ?? 0) + 1 })
      .eq("id", target.id);

    // 5A-iii. Notify the chosen doctor
    await supabase.from("notifications").insert({
      recipient_id: target.user_id,
      type: "assignment",
      message: `You have been assigned a new patient with ${record.diagnosed_condition}.`,
      specialty_context: target.specialty?.[0] ?? null,
      patient_id: record.patient_id,
      is_read: false,
      created_at: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        ok: true,
        assigned: true,
        doctor_id: target.id,
        doctor_name: target.users?.full_name,
        patient_id: record.patient_id,
        condition: record.diagnosed_condition,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  // ---------- 5B. No available specialist: broadcast emergency ----------
  const notificationRows = matchedDoctors.map((d) => ({
    recipient_id: d.user_id,
    type: "emergency_available_patient",
    message: `Unassigned patient with ${record.diagnosed_condition} is awaiting a ${d.specialty?.[0]} specialist. Accept to take the case.`,
    specialty_context: d.specialty?.[0] ?? null,
    patient_id: record.patient_id,
    is_read: false,
    is_resolved: false,
    created_at: new Date().toISOString(),
  }));

  const { error: notifErr } = await supabase.from("notifications").insert(notificationRows);

  if (notifErr) {
    console.error("Failed to insert emergency notifications:", notifErr);
    return new Response(JSON.stringify({ error: notifErr.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({
      ok: true,
      assigned: false,
      reason: "no_available_specialist",
      emergency_notified_count: notificationRows.length,
      patient_id: record.patient_id,
      condition: record.diagnosed_condition,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
});

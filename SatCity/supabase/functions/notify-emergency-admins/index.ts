// supabase/functions/notify-emergency-admins/index.ts
//
// TRIGGER: Database Webhook on INSERT into emergency_requests (public form)
//
// LOGIC:
//  1. Read the new emergency_requests row
//  2. Fetch all users with role = 'admin' or role = 'super_admin'
//  3. Insert a notification for each active admin
//  4. Supabase Realtime automatically broadcasts these to each admin's
//     active session (because notifications table has RLS + realtime enabled)
//

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

interface EmergencyRequestRecord {
  id: string;
  caller_name: string | null;
  location: string;
  description: string | null;
  created_at: string;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  let payload: { record?: EmergencyRequestRecord };
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const record = payload.record;
  if (!record || !record.location) {
    return new Response(JSON.stringify({ error: "Missing location in record" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("https://gnfnfcgwyykzashpzfzb.supabase.co") ?? "";
  const supabaseServiceKey = Deno.env.get("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduZm5mY2d3eXlremFzaHB6ZnpiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjQwMjc1NiwiZXhwIjoyMDk3OTc4NzU2fQ.dz-OpJmu06-JW_JbmIESjflDo1hKL6odiNiKsklKNm0") ?? "";
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Fetch all active admins
  const { data: admins, error: adminErr } = await supabase
    .from("users")
    .select("id, full_name")
    .in("role", ["admin", "super_admin"])
    .eq("is_active", true);

  if (adminErr) {
    return new Response(JSON.stringify({ error: adminErr.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!admins || admins.length === 0) {
    return new Response(
      JSON.stringify({ ok: true, notified: 0, reason: "no_active_admins" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  // Build notification rows for each admin
  const notifications = admins.map((a) => ({
    recipient_id: a.id,
    type: "emergency_request",
    message: `🚨 EMERGENCY: ${record.caller_name ?? "Anonymous"} at ${record.location}. ${record.description ?? ""}`.slice(0, 500),
    is_read: false,
    is_resolved: false,
    created_at: new Date().toISOString(),
  }));

  const { error: notifErr } = await supabase.from("notifications").insert(notifications);

  if (notifErr) {
    return new Response(JSON.stringify({ error: notifErr.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({
      ok: true,
      emergency_id: record.id,
      notified_admins: admins.map((a) => a.full_name),
      count: notifications.length,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
});

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      throw new Error("Missing Supabase Edge Function environment variables.");
    }

    const authorization = req.headers.get("Authorization");
    if (!authorization) throw new Error("Missing Authorization header.");

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } }
    });
    const serviceClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: userData, error: userError } = await callerClient.auth.getUser();
    if (userError || !userData.user) throw new Error("Invalid session.");

    const { data: callerProfile, error: profileError } = await serviceClient
      .from("profiles")
      .select("role,status")
      .eq("id", userData.user.id)
      .maybeSingle();

    if (profileError) throw profileError;
    if (!callerProfile || callerProfile.role !== "admin" || callerProfile.status !== "approved") {
      return new Response(JSON.stringify({ error: "Only approved admins can change employee passwords." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const { user_id, password } = await req.json();
    if (!user_id || !password || String(password).length < 6) {
      throw new Error("User ID and a password of at least 6 characters are required.");
    }

    const { error: updateError } = await serviceClient.auth.admin.updateUserById(user_id, {
      password
    });
    if (updateError) throw updateError;

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});

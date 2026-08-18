// Deploy with: supabase functions deploy send-notification --no-verify-jwt
// Then add RESEND_API_KEY and NOTIFICATION_FROM as Edge Function secrets.
const corsHeaders = {
  "Access-Control-Allow-Origin": "https://givenmkwara7-maker.github.io",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const submission = await request.json();
    const fields = [
      ["Type", submission.kind], ["Name", submission.name], ["Email", submission.email],
      ["Phone", submission.phone], ["Amount", submission.amount ? `MWK ${Number(submission.amount).toLocaleString()}` : ""],
      ["Giving", submission.method], ["Subject", submission.subject], ["Area", submission.area],
      ["Availability", submission.availability], ["Message", submission.message],
    ].filter(([, value]) => value).map(([label, value]) => `<p><strong>${label}:</strong> ${String(value)}</p>`).join("");
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: Deno.env.get("NOTIFICATION_FROM"), to: ["givenmkwara7@gmail.com"],
        reply_to: submission.email,
        subject: `New website ${String(submission.kind || "submission").replace(/-/g, " ")}`,
        html: `<h2>New New Community Organization website submission</h2>${fields}`,
      }),
    });
    if (!response.ok) throw new Error(await response.text());
    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

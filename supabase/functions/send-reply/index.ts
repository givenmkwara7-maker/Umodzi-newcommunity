const corsHeaders = {
  "Access-Control-Allow-Origin": "https://givenmkwara7-maker.github.io",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]!));
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authorization = request.headers.get("Authorization") || "";
    const userResponse = await fetch(`${Deno.env.get("SUPABASE_URL")}/auth/v1/user`, {
      headers: { Authorization: authorization, apikey: Deno.env.get("SUPABASE_ANON_KEY") || "" },
    });
    const user = await userResponse.json();
    if (!userResponse.ok || user.email !== "givenmkwara7@gmail.com") throw new Error("Administrator access is required.");

    const { to, subject, message } = await request.json();
    if (!/^\S+@\S+\.\S+$/.test(to || "") || !subject?.trim() || !message?.trim()) throw new Error("Recipient, subject, and message are required.");
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: Deno.env.get("NOTIFICATION_FROM"), to: [to], subject: subject.trim(), html: `<p>${escapeHtml(message.trim()).replace(/\n/g, "<br>")}</p>` }),
    });
    if (!response.ok) throw new Error(await response.text());
    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

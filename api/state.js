const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Single shared row: this app has no per-user auth, everyone who has the
// link shares one saved state (matches the "shared with everyone here" UI copy).
const ROW_ID = "main";

module.exports = async function handler(req, res) {
  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("app_state")
      .select("payload")
      .eq("id", ROW_ID)
      .maybeSingle();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data ? data.payload : null);
  }

  if (req.method === "POST") {
    let body = req.body;
    if (typeof body === "string") {
      try { body = JSON.parse(body); }
      catch (e) { return res.status(400).json({ error: "invalid json" }); }
    }

    const { error } = await supabase
      .from("app_state")
      .upsert({ id: ROW_ID, payload: body, updated_at: new Date().toISOString() });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).end("Method Not Allowed");
};

/* ==========================================================
   Rafaq Tec — Worker
   Serves the static site and a tiny reviews API backed by D1.
   GET  /api/reviews  → latest published reviews
   POST /api/reviews  → add a review (shown on the site right away)
   ========================================================== */

const LIMITS = { name: 60, company: 80, text: 600, minText: 10, perDay: 3, list: 60 };
// Requests from other sites are refused, so the form can't be abused from elsewhere.
const ALLOWED_HOSTS = /^(www\.)?rafaqtech\.com$|\.workers\.dev$|^localhost$|^127\.0\.0\.1$/;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/reviews") {
      try {
        if (request.method === "GET") return await listReviews(env);
        if (request.method === "POST") return await addReview(request, env);
        return json({ error: "method_not_allowed" }, 405);
      } catch (err) {
        console.error(err);
        return json({ error: "server_error" }, 500);
      }
    }
    return env.ASSETS.fetch(request);
  },
};

async function listReviews(env) {
  const { results } = await env.DB.prepare(
    "SELECT id, name, company, rating, text, created_at FROM reviews WHERE hidden = 0 ORDER BY created_at DESC LIMIT ?"
  ).bind(LIMITS.list).all();
  return json({ reviews: results }, 200, { "Cache-Control": "no-store" });
}

async function addReview(request, env) {
  const origin = request.headers.get("Origin");
  if (!origin || !ALLOWED_HOSTS.test(new URL(origin).hostname)) return json({ error: "forbidden" }, 403);

  let data;
  try { data = await request.json(); } catch { return json({ error: "invalid" }, 400); }

  // Bots fill the hidden "website" field; answer as if it worked and store nothing.
  if (data.website) return json({ ok: true, review: null }, 201);

  const clean = (v, max) => String(v ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
  const name = clean(data.name, LIMITS.name);
  const company = clean(data.company, LIMITS.company);
  const text = String(data.text ?? "").replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, " ").replace(/\n{3,}/g, "\n\n").trim().slice(0, LIMITS.text);
  const rating = Number(data.rating);

  if (name.length < 2 || text.length < LIMITS.minText || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return json({ error: "invalid" }, 400);
  }

  // A few reviews per visitor per day at most. Only a salted hash of the IP is kept.
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const ipHash = await sha256(`rafaqtec-reviews:${ip}`);
  const { count } = await env.DB.prepare(
    "SELECT COUNT(*) AS count FROM reviews WHERE ip_hash = ? AND created_at > datetime('now', '-1 day')"
  ).bind(ipHash).first();
  if (count >= LIMITS.perDay) return json({ error: "too_many" }, 429);

  const review = await env.DB.prepare(
    "INSERT INTO reviews (name, company, rating, text, ip_hash) VALUES (?, ?, ?, ?, ?) RETURNING id, name, company, rating, text, created_at"
  ).bind(name, company, rating, text, ipHash).first();

  return json({ ok: true, review }, 201);
}

async function sha256(input) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...headers },
  });
}

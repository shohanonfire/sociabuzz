// server/src/tg.ts
export async function sendToTelegram(apiUrl: string, payload: unknown) {
  try {
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("Telegram relay failed:", res.status, text);
      return { ok: false, status: res.status };
    }
    return { ok: true };
  } catch (err) {
    console.error("Telegram relay error:", err);
    return { ok: false, error: String(err) };
  }
}

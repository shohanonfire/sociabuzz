import fetch from "node-fetch";
const RELAY = process.env.TELEGRAM_RELAY_URL!;

export async function sendTelegram(message: string) {
  try {
    await fetch(RELAY, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, parse_mode: "Markdown" })
    });
  } catch {}
}

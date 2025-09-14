import { Router } from "express";
import { prisma } from "../prisma";
import { sendToTelegram } from "../tg";
import { maskEmail } from "../auth";
import { z } from "zod";

export const pub = Router();

function clientIP(req: any) {
  return (req.headers["x-forwarded-for"]?.split(",")[0] || req.ip || "").toString();
}

// services
pub.get("/services", async (_req, res) => {
  const items = await prisma.service.findMany({ where: { active: true }, orderBy: [{ platform: "asc" }, { titleEn: "asc" }] });
  res.json({ ok: true, items });
});

// ensure user
pub.post("/users/ensure", async (req, res) => {
  const body = z.object({ username: z.string(), email: z.string().nullable().optional(), language: z.string().default("bn") }).parse(req.body);
  const ip = clientIP(req);
  const emailMasked = maskEmail(body.email || undefined);
  const user = await prisma.user.upsert({
    where: { username: body.username },
    create: { username: body.username, email: body.email || undefined, emailMasked, ip, lastActive: new Date(), language: body.language },
    update: { email: body.email || undefined, emailMasked, ip, lastActive: new Date(), language: body.language }
  });
  if (user.banned) return res.status(403).json({ ok: false, error: "banned" });
  res.json({ ok: true, user });
});

// track
pub.post("/track", async (req, res) => {
  const body = z.object({ username: z.string().optional(), event: z.string(), meta: z.any().optional() }).parse(req.body);
  const ip = clientIP(req);
  if (body.username) {
    const u = await prisma.user.findUnique({ where: { username: body.username } });
    if (u?.banned) return res.status(403).json({ ok: false, error: "banned" });
    await prisma.track.create({ data: { event: body.event, meta: body.meta || {}, ip, userId: u?.id } });
    await prisma.user.update({ where: { id: u?.id }, data: { lastActive: new Date(), ip } });
  } else {
    await prisma.track.create({ data: { event: body.event, meta: body.meta || {}, ip } });
  }
  res.json({ ok: true });
});

async function cancelExpiredPayments(){
  const now = new Date();
  await prisma.order.updateMany({
    where: { status: "CONFIRMED", payDeadline: { lt: now } },
    data: { status: "CANCELED", note: "Auto-canceled after payment window" }
  });
}

// create order
pub.post("/orders", async (req, res) => {
  const body = z.object({
    username: z.string(),
    language: z.enum(["bn","en"]).default("bn"),
    serviceKey: z.string(),
    details: z.object({
      link: z.string().optional(),
      username: z.string().optional(),
      dob: z.string().optional(),
      months: z.number().int().optional(),
      quantity: z.number().int().optional(),
      whatsapp: z.string().optional()
    })
  }).parse(req.body);

  const u = await prisma.user.findUnique({ where: { username: body.username } });
  if (!u) return res.status(400).json({ ok: false, error: "user_not_found" });
  if (u.banned) return res.status(403).json({ ok: false, error: "banned" });

  const ip = clientIP(req);
  const ord = await prisma.order.create({ data: {
    userId: u.id, username: body.username, ip, language: body.language,
    serviceKey: body.serviceKey, details: body.details, status: "PENDING", unreadAdmin: true
  }});

  await sendTelegram(`*New order*\nUser: ${body.username}\nService: ${body.serviceKey}\nLang: ${body.language}\nDetails: \`${JSON.stringify(body.details)}\``);
  res.json({ ok: true, order: ord });
});

// my orders
pub.get("/orders/:username", async (req, res) => {
  const username = req.params.username;
  const u = await prisma.user.findUnique({ where: { username } });
  if (!u) return res.json({ ok: true, items: [] });
  const items = await prisma.order.findMany({ where: { userId: u.id }, orderBy: { createdAt: "desc" } });
  res.json({ ok: true, items });
});

// poll
pub.get("/orders/poll/:username", async (req, res) => {
  await cancelExpiredPayments();
  const username = req.params.username;
  const u = await prisma.user.findUnique({ where: { username } });
  if (!u) return res.json({ ok: true, items: [], positions: {} });
  const items = await prisma.order.findMany({ where: { userId: u.id }, orderBy: { createdAt: "desc" } });
  const pending = await prisma.order.findMany({ where: { status: "PENDING" }, orderBy: { createdAt: "asc" } });
  const positions: Record<string, number> = {};
  pending.forEach((o, idx) => positions[o.id] = idx + 1);
  res.json({ ok: true, items, positions });
});

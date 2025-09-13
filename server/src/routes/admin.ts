import { Router } from "express";
import { prisma } from "../prisma";
import { requireAdmin, issueAdminToken } from "../auth";
import { z } from "zod";

export const admin = Router();

admin.post("/login", async (req, res) => {
  const { password } = z.object({ password: z.string() }).parse(req.body);
  const token = issueAdminToken(password);
  if (!token) return res.status(401).json({ ok: false, error: "bad_password" });
  res.json({ ok: true, token });
});

admin.use(requireAdmin);

admin.get("/stats/unread", async (_req, res) => {
  const unread = await prisma.order.count({ where: { unreadAdmin: true } });
  res.json({ ok: true, unread });
});

admin.get("/orders", async (_req, res) => {
  const items = await prisma.order.findMany({ orderBy: { createdAt: "desc" } });
  res.json({ ok: true, items });
});

admin.post("/orders/:id/status", async (req, res) => {
  const id = req.params.id;
  const body = z.object({ status: z.enum(["CONFIRMED","HOLD","CANCELED"]), note: z.string().optional() }).parse(req.body);
  const now = new Date();
  const data: any = { status: body.status, note: body.note, unreadAdmin: false };
  if (body.status === "CONFIRMED") {
    data.approvedAt = now;
    data.payDeadline = new Date(now.getTime() + 2 * 60 * 1000);
  } else {
    data.payDeadline = null;
  }
  const updated = await prisma.order.update({ where: { id }, data });
  res.json({ ok: true, order: updated });
});

admin.delete("/orders/:id", async (req, res) => {
  const id = req.params.id;
  await prisma.order.delete({ where: { id } });
  res.json({ ok: true });
});

admin.get("/users", async (_req, res) => {
  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
  res.json({ ok: true, users });
});

admin.post("/users/:username/ban", async (req, res) => {
  const { username } = req.params;
  const { reason } = z.object({ reason: z.string().optional() }).parse(req.body);
  const u = await prisma.user.update({ where: { username }, data: { banned: true, banReason: reason || "violations" } });
  res.json({ ok: true, user: u });
});

admin.post("/users/:username/unban", async (req, res) => {
  const { username } = req.params;
  const u = await prisma.user.update({ where: { username }, data: { banned: false, banReason: null } });
  res.json({ ok: true, user: u });
});

admin.get("/services", async (_req, res) => {
  const items = await prisma.service.findMany({ orderBy: { platform: "asc" } });
  res.json({ ok: true, items });
});

admin.post("/services", async (req, res) => {
  const s = z.object({
    platform: z.string(), key: z.string(), titleBn: z.string(), titleEn: z.string(),
    requires: z.any(), minQty: z.number().int().nullable().optional(), maxQty: z.number().int().nullable().optional(),
    pricePerK: z.number().int().nullable().optional(), fixedPrice: z.number().int().nullable().optional(), active: z.boolean().optional()
  }).parse(req.body);
  const item = await prisma.service.create({ data: s as any });
  res.json({ ok: true, item });
});

admin.put("/services/:id", async (req, res) => {
  const id = req.params.id;
  const data = req.body;
  const item = await prisma.service.update({ where: { id }, data });
  res.json({ ok: true, item });
});

admin.delete("/services/:id", async (req, res) => {
  const id = req.params.id;
  await prisma.service.delete({ where: { id } });
  res.json({ ok: true });
});

admin.get("/tracks", async (_req, res) => {
  const items = await prisma.track.findMany({ orderBy: { createdAt: "desc" }, take: 500 });
  res.json({ ok: true, items });
});

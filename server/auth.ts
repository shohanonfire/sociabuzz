import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

const JWT_SECRET = process.env.JWT_SECRET || "change";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin";

export function issueAdminToken(password: string) {
  if (password !== ADMIN_PASSWORD) return null;
  return jwt.sign({ role: "admin" }, JWT_SECRET, { expiresIn: "7d" });
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const hdr = req.headers.authorization || "";
  const token = hdr.replace("Bearer ", "");
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    if (payload.role !== "admin") throw new Error("no admin");
    return next();
  } catch (e) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }
}

export function maskEmail(email?: string | null) {
  if (!email) return undefined;
  const [u, d] = email.split("@");
  if (!d) return email as any;
  const head = u.slice(0, 2);
  return `${head}***@${d}`;
}

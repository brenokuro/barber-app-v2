import type { Express, Request, Response, NextFunction } from "express";
import { storage } from "./storage";

function getToken(req: Request): string | null {
  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  return null;
}

async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = getToken(req);
  if (!token) return res.status(401).json({ message: "Não autenticado" });
  const user = await storage.validateSession(token);
  if (!user) return res.status(401).json({ message: "Sessão expirada" });
  (req as any).user = user;
  next();
}

async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const token = getToken(req);
  if (!token) return res.status(401).json({ message: "Não autenticado" });
  const user = await storage.validateSession(token);
  if (!user || user.role !== "admin") return res.status(403).json({ message: "Acesso negado" });
  (req as any).user = user;
  next();
}

export function registerRoutes(app: Express): void {
  // Auth
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { name, email, password, phone } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ message: "Campos obrigatórios: nome, email, senha" });
      }
      const user = await storage.register(name, email, password, phone);
      const session = await storage.login(email, password);
      res.json({ user, token: session?.token });
    } catch (e: any) {
      if (e.code === "23505") return res.status(400).json({ message: "Email já cadastrado" });
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const result = await storage.login(email, password);
      if (!result) return res.status(401).json({ message: "Email ou senha incorretos" });
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/auth/logout", requireAuth, async (req, res) => {
    const token = getToken(req)!;
    await storage.logout(token);
    res.json({ ok: true });
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    res.json((req as any).user);
  });

  // Services
  app.get("/api/services", async (_req, res) => {
    const services = await storage.getServices();
    res.json(services);
  });

  app.post("/api/services", requireAdmin, async (req, res) => {
    try {
      const service = await storage.createService(req.body);
      res.json(service);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.put("/api/services/:id", requireAdmin, async (req, res) => {
    try {
      const service = await storage.updateService(req.params.id, req.body);
      res.json(service);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // Packages
  app.get("/api/packages", async (_req, res) => {
    const packages = await storage.getPackages();
    res.json(packages);
  });

  app.post("/api/packages", requireAdmin, async (req, res) => {
    try {
      const pkg = await storage.createPackage(req.body);
      res.json(pkg);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.put("/api/packages/:id", requireAdmin, async (req, res) => {
    try {
      const pkg = await storage.updatePackage(req.params.id, req.body);
      res.json(pkg);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.delete("/api/packages/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deletePackage(req.params.id);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.delete("/api/services/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteService(req.params.id);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // Appointments
  app.get("/api/appointments", requireAuth, async (req, res) => {
    const user = (req as any).user;
    const appointments = await storage.getAppointments(user.id, user.role === "admin");
    res.json(appointments);
  });

  app.post("/api/appointments", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const appointment = await storage.createAppointment({
        ...req.body,
        client_id: user.id,
      });
      res.json(appointment);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.patch("/api/appointments/:id/status", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const { status } = req.body;
      const appointment = await storage.updateAppointmentStatus(
        req.params.id,
        status,
        user.id,
        user.role === "admin"
      );
      res.json(appointment);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  // Available slots
  app.get("/api/slots", async (req, res) => {
    try {
      const { serviceId, date } = req.query as { serviceId: string; date: string };
      if (!serviceId || !date) return res.status(400).json({ message: "serviceId e date são obrigatórios" });
      const slots = await storage.getAvailableSlots(serviceId, date);
      res.json(slots);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });
}

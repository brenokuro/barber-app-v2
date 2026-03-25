import { Pool } from "pg";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL || 
    `postgresql://${process.env.PGUSER}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_HOST}/${process.env.PGDATABASE}?sslmode=require`
});

export type UserRole = "client" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  created_at: string;
}

export interface Service {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  duration_minutes: number;
  active: boolean;
  created_at: string;
}

export interface Package {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  credits: number;
  period_days: number;
  active: boolean;
  created_at: string;
}

export interface Appointment {
  id: string;
  client_id: string;
  service_id: string;
  starts_at: string;
  ends_at: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  notes: string | null;
  price_cents: number;
  created_at: string;
  client_name?: string;
  client_email?: string;
  service_name?: string;
  service_duration?: number;
}

export const storage = {
  async register(name: string, email: string, password: string, phone?: string): Promise<User> {
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, phone, password_hash, role)
       VALUES ($1, $2, $3, $4, 'client')
       RETURNING id, name, email, phone, role, created_at`,
      [name, email, phone || null, hash]
    );
    return rows[0];
  },

  async login(email: string, password: string): Promise<{ user: User; token: string } | null> {
    const { rows } = await pool.query(
      `SELECT id, name, email, phone, role, created_at, password_hash FROM users WHERE email = $1`,
      [email.toLowerCase().trim()]
    );
    if (!rows[0]) return null;
    const valid = await bcrypt.compare(password, rows[0].password_hash);
    if (!valid) return null;
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await pool.query(
      `INSERT INTO sessions (user_id, token, expires_at) VALUES ($1, $2, $3)`,
      [rows[0].id, token, expiresAt]
    );
    const { password_hash: _, ...user } = rows[0];
    return { user, token };
  },

  async validateSession(token: string): Promise<User | null> {
    const { rows } = await pool.query(
      `SELECT u.id, u.name, u.email, u.phone, u.role, u.created_at
       FROM sessions s JOIN users u ON s.user_id = u.id
       WHERE s.token = $1 AND s.expires_at > NOW()`,
      [token]
    );
    return rows[0] || null;
  },

  async logout(token: string): Promise<void> {
    await pool.query(`DELETE FROM sessions WHERE token = $1`, [token]);
  },

  async getServices(): Promise<Service[]> {
    const { rows } = await pool.query(
      `SELECT * FROM services WHERE active = TRUE ORDER BY price_cents ASC`
    );
    return rows;
  },

  async createService(data: { name: string; description?: string; price_cents: number; duration_minutes: number }): Promise<Service> {
    const { rows } = await pool.query(
      `INSERT INTO services (name, description, price_cents, duration_minutes)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [data.name, data.description || null, data.price_cents, data.duration_minutes]
    );
    return rows[0];
  },

  async updateService(id: string, data: { name?: string; description?: string; price_cents?: number; duration_minutes?: number; active?: boolean }): Promise<Service> {
    const entries = Object.entries(data).filter(([, v]) => v !== undefined);
    const fields = entries.map(([k], i) => `${k} = $${i + 2}`).join(", ");
    const values = entries.map(([, v]) => v);
    const { rows } = await pool.query(
      `UPDATE services SET ${fields} WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    return rows[0];
  },

  async createPackage(data: { name: string; description?: string; price_cents: number; credits: number; period_days: number }): Promise<Package> {
    const { rows } = await pool.query(
      `INSERT INTO packages (name, description, price_cents, credits, period_days)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [data.name, data.description || null, data.price_cents, data.credits, data.period_days]
    );
    return rows[0];
  },

  async updatePackage(id: string, data: { name?: string; description?: string; price_cents?: number; credits?: number; period_days?: number; active?: boolean }): Promise<Package> {
    const entries = Object.entries(data).filter(([, v]) => v !== undefined);
    const fields = entries.map(([k], i) => `${k} = $${i + 2}`).join(", ");
    const values = entries.map(([, v]) => v);
    const { rows } = await pool.query(
      `UPDATE packages SET ${fields} WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    return rows[0];
  },

  async deletePackage(id: string): Promise<void> {
    await pool.query(`DELETE FROM packages WHERE id = $1`, [id]);
  },

  async deleteService(id: string): Promise<void> {
    await pool.query(`DELETE FROM services WHERE id = $1`, [id]);
  },

  async getAppointments(userId?: string, isAdmin?: boolean): Promise<Appointment[]> {
    if (isAdmin) {
      const { rows } = await pool.query(
        `SELECT a.*, u.name as client_name, u.email as client_email,
                s.name as service_name, s.duration_minutes as service_duration
         FROM appointments a
         JOIN users u ON a.client_id = u.id
         JOIN services s ON a.service_id = s.id
         ORDER BY a.starts_at DESC`
      );
      return rows;
    }
    const { rows } = await pool.query(
      `SELECT a.*, u.name as client_name, u.email as client_email,
              s.name as service_name, s.duration_minutes as service_duration
       FROM appointments a
       JOIN users u ON a.client_id = u.id
       JOIN services s ON a.service_id = s.id
       WHERE a.client_id = $1
       ORDER BY a.starts_at DESC`,
      [userId]
    );
    return rows;
  },

  async createAppointment(data: {
    client_id: string;
    service_id: string;
    starts_at: string;
    ends_at: string;
    notes?: string;
    price_cents: number;
  }): Promise<Appointment> {
    const conflict = await pool.query(
      `SELECT id FROM appointments
       WHERE status NOT IN ('cancelled')
         AND (starts_at, ends_at) OVERLAPS ($1::timestamptz, $2::timestamptz)`,
      [data.starts_at, data.ends_at]
    );
    if (conflict.rows.length > 0) {
      throw new Error("Horário já reservado");
    }
    const { rows } = await pool.query(
      `INSERT INTO appointments (client_id, service_id, starts_at, ends_at, notes, price_cents)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [data.client_id, data.service_id, data.starts_at, data.ends_at, data.notes || null, data.price_cents]
    );
    return rows[0];
  },

  async updateAppointmentStatus(
    id: string,
    status: string,
    userId?: string,
    isAdmin?: boolean
  ): Promise<Appointment> {
    let query: string;
    let params: unknown[];
    if (isAdmin) {
      query = `UPDATE appointments SET status = $2 WHERE id = $1 RETURNING *`;
      params = [id, status];
    } else {
      query = `UPDATE appointments SET status = $2 WHERE id = $1 AND client_id = $3 RETURNING *`;
      params = [id, status, userId];
    }
    const { rows } = await pool.query(query, params);
    if (!rows[0]) throw new Error("Agendamento não encontrado");
    return rows[0];
  },

  async getAvailableSlots(serviceId: string, date: string): Promise<string[]> {
    const { rows: serviceRows } = await pool.query(
      `SELECT duration_minutes FROM services WHERE id = $1`,
      [serviceId]
    );
    if (!serviceRows[0]) return [];
    const duration = serviceRows[0].duration_minutes as number;

    const { rows: booked } = await pool.query(
      `SELECT starts_at, ends_at FROM appointments
       WHERE status NOT IN ('cancelled')
         AND starts_at::date = $1::date`,
      [date]
    );

    const slots: string[] = [];
    const openHour = 9;
    const closeHour = 19;

    for (let hour = openHour; hour < closeHour; hour++) {
      for (const min of [0, 30]) {
        const slotStart = new Date(`${date}T${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}:00`);
        const slotEnd = new Date(slotStart.getTime() + duration * 60000);

        if (slotEnd.getHours() > closeHour || (slotEnd.getHours() === closeHour && slotEnd.getMinutes() > 0)) continue;

        const overlaps = booked.some((b) => {
          const bs = new Date(b.starts_at).getTime();
          const be = new Date(b.ends_at).getTime();
          const ss = slotStart.getTime();
          const se = slotEnd.getTime();
          return ss < be && se > bs;
        });

        if (!overlaps) {
          slots.push(slotStart.toISOString());
        }
      }
    }
    return slots;
  },
};

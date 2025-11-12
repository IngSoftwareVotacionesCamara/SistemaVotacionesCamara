// ===============================
// Servidor principal
// ===============================
import express from "express";
import session from "express-session";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "./db.js";

import authRoutes from "./routes/auth.js";
import votoRoutes from "./routes/voto.js";
import catalogosRoutes from "./routes/catalogos.js";
import votoRouter from './routes/voto.js';
import electoresRouter from './routes/electores.js';
import certificadoRouter from "./routes/certificado.js";
import adminRouter from "./routes/admin.js";
import estadoRouter from "./routes/estado.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API_URL = "https://sistemavotacionescamara.onrender.com/api";


dotenv.config();
const app = express();

app.set('trust proxy', 1);

app.use(cors({
  origin: true,        // mismo origen
  credentials: true,   // necesario para enviar cookies
}));

app.use(cors());
app.use(express.json());
app.use("/api/admin", adminRouter);

app.use(session({
  secret: process.env.SESSION_SECRET || "super-secret",
  resave: false,
  saveUninitialized: false,
  cookie: { sameSite: "lax" }
}));


// Rutas
app.use("/api", authRoutes);
app.use("/api", votoRoutes);
app.use("/api", catalogosRoutes);
app.use('/api', votoRouter);
app.use('/api', electoresRouter);
app.use("/api", certificadoRouter);
app.use("/api/estado", estadoRouter);
app.use("/admin/js",  express.static(path.join(__dirname, "../frontend/admin/js")));
app.use("/admin/img", express.static(path.join(__dirname, "../frontend/admin/img")));
app.use("/admin/admin.css", (req,res) =>
  res.sendFile(path.join(__dirname, "../frontend/admin/admin.css"))
);
app.use("/api/admin", adminRouter);

app.use(session({
  name: "sid",
  secret: process.env.SESSION_SECRET || "supersecret-change-this",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production", // en Render = true
    maxAge: 1000 * 60 * 60 * 8, // 8h
  },
}));

function ensureAdmin(req, res, next) {
  if (req.session && req.session.admin) return next();
  // si no hay sesión, redirige al login del admin
  return res.redirect("/admin/login.html");
}


// Salud
app.get("/api/health", (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));

app.use(express.static(path.join(__dirname, "../frontend")));

app.use(session({
  name: "sid",
  secret: process.env.SESSION_SECRET || "supersecret-change-this",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 60 * 8, // 8h
  },
}));

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});
app.get("/votar.html", (_req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/votar.html"));
});

app.get("/api/_diag", async (_req, res) => {
  try {
    const a = await pool.query("select current_database() as db");
    const b = await pool.query(`
      select count(*)::int as ok
      from information_schema.tables
      where table_schema='votaciones' and table_name='electores'
    `);
    res.json({ db: a.rows[0].db, electoresTable: !!b.rows[0].ok });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// --- Páginas del admin: login SIEMPRE público ---
app.get("/admin/login.html", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/admin/login.html"));
});

// --- Páginas del admin: panel PROTEGIDO ---
app.get("/admin/panel.html", ensureAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/admin/panel.html"));
});

// (opcional) atajo: /admin -> según haya sesión
app.get("/admin", (req, res) => {
  if (req.session?.admin) return res.redirect("/admin/panel.html");
  return res.redirect("/admin/login.html");
});
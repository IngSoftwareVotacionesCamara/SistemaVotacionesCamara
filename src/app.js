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
import electoresRouter from "./routes/electores.js";
import certificadoRouter from "./routes/certificado.js";
import adminRouter from "./routes/admin.js";
import estadoRouter from "./routes/estado.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app = express();
app.set("trust proxy", 1);

// CORS + JSON
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// 🔐 **UNA SOLA** sesión y ANTES de montar rutas
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

// Estáticos (frontend)
app.use(express.static(path.join(__dirname, "../frontend")));
app.use("/admin/js",  express.static(path.join(__dirname, "../frontend/admin/js")));
app.use("/admin/img", express.static(path.join(__dirname, "../frontend/admin/img")));
app.get("/admin/admin.css", (_req, res) =>
  res.sendFile(path.join(__dirname, "../frontend/admin/admin.css"))
);

// API
app.use("/api", authRoutes);
app.use("/api", votoRoutes);
app.use("/api", catalogosRoutes);
app.use("/api", electoresRouter);
app.use("/api", certificadoRouter);
app.use("/api/estado", estadoRouter);
app.use("/api/admin", adminRouter);  // <- una sola vez

// Protección de páginas admin
function ensureAdmin(req, res, next) {
  if (req.session && req.session.admin) return next();
  return res.redirect("/admin/login.html");
}

// Páginas
app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});
app.get("/votar.html", (_req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/votar.html"));
});

// Admin pages
app.get("/admin/login.html", (_req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/admin/login.html"));
});
app.get("/admin/panel.html", ensureAdmin, (_req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/admin/panel.html"));
});
app.get("/admin", (req, res) => {
  if (req.session?.admin) return res.redirect("/admin/panel.html");
  return res.redirect("/admin/login.html");
});

// Salud
app.get("/api/health", (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));

// ===============================
// Servidor principal
// ===============================
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/auth.js";
import votoRoutes from "./routes/voto.js";
import catalogosRoutes from "./routes/catalogos.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Rutas
app.use("/api", authRoutes);
app.use("/api", votoRoutes);
app.use("/api", catalogosRoutes);

// Salud
app.get("/api/health", (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Servidor corriendo en puerto ${PORT}`));

app.use(express.static(path.join(__dirname, "../frontend")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

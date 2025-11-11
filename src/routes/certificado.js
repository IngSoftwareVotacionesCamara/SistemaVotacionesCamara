import express from "express";
import PDFDocument from "pdfkit";
import { pool } from "../db.js";

const router = express.Router();

/**
 * POST /api/certificado
 * body: { id_elector, nombres, codigo_dane, cod_vota?, seleccion? }
 */
router.post("/certificado", async (req, res) => {
  try {
    const { id_elector, nombres, codigo_dane, cod_vota, seleccion } = req.body || {};
    if (!id_elector) return res.status(400).json({ message: "id_elector es requerido" });

    // Verifica que el elector esté EFECTUADO
    const q = await pool.query(
      `SELECT estado FROM votaciones.electores WHERE id_elector = $1::bigint LIMIT 1`,
      [id_elector]
    );
    if (q.rowCount === 0) return res.status(404).json({ message: "Elector no encontrado" });
    if ((q.rows[0].estado || "").toUpperCase() !== "EFECTUADO") {
      return res.status(409).json({ message: "El elector no tiene voto efectivado" });
    }

    // Genera PDF
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="certificado_votacion_${id_elector}.pdf"`);

    doc.fontSize(16).text("República de Colombia", { align: "center" });
    doc.moveDown(0.2);
    doc.fontSize(18).text("CERTIFICADO DE VOTACIÓN - CÁMARA DE REPRESENTANTES", { align: "center" });
    doc.moveDown();

    doc.fontSize(12).text(`Fecha de emisión: ${new Date().toLocaleString("es-CO")}`);
    doc.moveDown(0.5);

    doc.text(`Elector: ${nombres || ""} (ID: ${id_elector})`);
    if (codigo_dane) doc.text(`Código DANE (adscripción votante): ${codigo_dane}`);
    if (cod_vota) doc.text(`Folio de voto: ${cod_vota}`);

    // Resumen de selección
    if (seleccion) {
      doc.moveDown(0.5);
      doc.text("Detalle de selección:");
      const circ = seleccion.cod_cir ? `Circunscripción: ${seleccion.cod_cir}` : "Circunscripción: N/D";
      if (seleccion.tipo === "blanco") {
        doc.text(` - Voto en blanco`);
        doc.text(` - ${circ}`);
      } else if (seleccion.tipo === "partido") {
        doc.text(` - Partido: ${seleccion.nombre_partido || seleccion.cod_partido}`);
        doc.text(` - ${circ}`);
      } else if (seleccion.tipo === "candidato") {
        doc.text(` - Candidato: ${seleccion.nombre_candidato || ""}`);
        doc.text(` - Tarjetón #${seleccion.num_lista}`);
        doc.text(` - Partido: ${seleccion.nombre_partido || seleccion.cod_partido}`);
        doc.text(` - ${circ}`);
      }
    }

    doc.moveDown();
    doc.text("Este certificado se expide como constancia de la participación del elector en la jornada de votación descrita.", { align: "left" });

    doc.end();
    doc.pipe(res);
  } catch (e) {
    console.error("CERT ERROR:", e);
    return res.status(500).json({ message: "Error al generar certificado" });
  }
});

export default router;

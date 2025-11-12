// frontend/js/certificado.js
// Requiere jsPDF ya cargado en la página (CDN)
// Genera un certificado *sin información del voto* (secreto)

const { jsPDF } = window.jspdf;

/** Util: cargar imagen y devolverla como HTMLImageElement */
function loadImg(src) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}

/** Formatos de fecha para el certificado */
function fechaLargaHoy() {
  // Solo la FECHA DEL EVENTO si quieres fijarla, si no, hoy:
  // return "19 de noviembre de 2025";
  const f = new Date();
  return f.toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" });
}
function fechaHoraEmision() {
  return new Date().toLocaleString("es-CO", { dateStyle: "short", timeStyle: "medium" });
}

/**
 * Genera y descarga el certificado con el estilo solicitado.
 * @param {{nombres:string, id_elector:string|number}} elector
 */
export async function descargarCertificado(elector) {
  if (!elector) return;

  const doc = new jsPDF({ unit: "pt", format: "letter" }); // 612x792 pt
  const W = doc.internal.pageSize.getWidth();
  const center = (y, text, opts = {}) => doc.text(text, W / 2, y, { align: "center", ...opts });

  // Cargar imágenes (colócalas en /frontend/img)
  //  - /img/cne_logo_grande.png   (versión grande horizontal)
  //  - /img/firma_cne.png         (firma manuscrita)
  let logo, firma;
  try {
    logo  = await loadImg("/img/CNE_logo.png");
  } catch { /* fallback: sin logo */ }
  try {
    firma = await loadImg("/img/firma_cne.png");
  } catch { /* fallback: sin firma */ }

  // ---------- Encabezado ----------
  let y = 70;
  if (logo) {
    const targetW = 240;           // ancho objetivo del logo
    const ratio   = logo.height / logo.width;
    const targetH = targetW * ratio;
    const x = (W - targetW) / 2;
    doc.addImage(logo, "PNG", x, y - 10, targetW, targetH, undefined, "FAST");
    y += targetH + 30;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  center(y, "República de Colombia"); y += 35;

  doc.setFontSize(20);
  center(y, "Certificado de Votación"); y += 45;

  // ---------- Cuerpo ----------
  const nombre = String(elector.nombres || "").trim();
  const idDoc  = String(elector.id_elector || "").trim();
  const fecha  = fechaLargaHoy();
  const emite  = fechaHoraEmision();

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);

  center(y, "El consejo nacional electoral certifica que el ciudadano:"); y += 22;

  doc.setFont("helvetica", "bold");
  center(y, nombre); y += 22;

  doc.setFont("helvetica", "normal");
  center(y, `con número de identificación: ${idDoc},`); y += 22;

  center(y, `participó en las elecciones de Cámara de Representantes del ${fecha}.`); y += 60;

  // ---------- Firma y pie ----------
  const firmaW = 160;
  if (firma) {
    const r  = firma.height / firma.width;
    const fh = firmaW * r;
    const fx = (W - firmaW) / 2;
    doc.addImage(firma, "PNG", fx, y - fh + 8, firmaW, fh, undefined, "FAST");
  }
  y += 24;

  doc.setFont("helvetica", "bold");
  center(y, "Consejo Nacional Electoral"); y += 28;

  doc.setFont("helvetica", "normal");
  doc.text(`Fecha de emisión: ${emite}.`, 72, y);

  doc.setFontSize(10);
  doc.setTextColor(140);
  center(760, "Este documento es de uso personal y está sujeto a las leyes colombianas.");
  doc.setTextColor(0);

  doc.save(`certificado_votacion_${idDoc}.pdf`);
}

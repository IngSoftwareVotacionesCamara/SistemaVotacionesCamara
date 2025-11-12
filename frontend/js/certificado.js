// frontend/js/certificado.js
(function () {
  // 1) Verifica que jsPDF esté cargado
  const jspdf = window.jspdf || window.jspdf?.default;
  const jsPDF = window.jspdf?.jsPDF || jspdf?.jsPDF;
  if (!jsPDF) {
    console.error("jsPDF no está disponible. Revisa el <script> del CDN.");
    return;
  }

  // 2) Logos en Base64 para evitar CORS (pon los tuyos si quieres)
  // Mini logo CNE (placeholder; reemplaza por el tuyo en base64 si deseas mejor calidad)
  const LOGO_CNE =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAA..."; // <-- pon tu base64 real

  const FIRMA =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAA..."; // <-- opcional

  // 3) Exporta la función global que usa confirmacion.html
  window.generarCertificado = async function generarCertificado(elector) {
    if (!elector || !elector.id_elector) {
      throw new Error("Elector inválido o sesión expirada.");
    }

    const doc = new jsPDF({ unit: "pt", format: "letter" }); // 612x792

    const pageW = doc.internal.pageSize.getWidth();
    const safeText = (t) => String(t ?? "").toString();

    // Encabezado con logo/leyenda
    try {
      if (LOGO_CNE && LOGO_CNE.startsWith("data:image/")) {
        doc.addImage(LOGO_CNE, "PNG", pageW - 180, 40, 120, 48);
      }
    } catch (e) {
      console.warn("No se pudo dibujar el logo:", e);
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Consejo Nacional Electoral", 72, 58);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text("República de Colombia", 72, 76);

    // Títulos
    doc.setFont("helvetica", "bold");
    doc.setFontSize(26);
    doc.text("República de Colombia", pageW / 2, 160, { align: "center" });
    doc.setFontSize(22);
    doc.text("Certificado de Votación", pageW / 2, 195, { align: "center" });

    // Cuerpo (sin datos del voto)
    const nombre = safeText(elector.nombres);
    const cedula = safeText(elector.id_elector);
    const fechaEleccion = new Date().toLocaleDateString("es-CO", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const emision = new Date().toLocaleString("es-CO", {
      dateStyle: "short",
      timeStyle: "medium",
    });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(13);

    const y0 = 240;
    const lineas = [
      "El Consejo Nacional Electoral certifica que el(la) ciudadano(a):",
      ` ${nombre}`,
      `con número de identificación: ${cedula},`,
      `participó en las elecciones de Cámara de Representantes del ${fechaEleccion}.`,
    ];

    let y = y0;
    lineas.forEach((t) => {
      doc.text(t, 72, y);
      y += 24;
    });

    // Firma (opcional)
    try {
      if (FIRMA && FIRMA.startsWith("data:image/")) {
        doc.addImage(FIRMA, "PNG", 72, y + 10, 150, 50);
      }
    } catch (e) {
      console.warn("No se pudo dibujar la firma:", e);
    }
    y += 75;

    doc.setFont("helvetica", "bold");
    doc.text("Consejo Nacional Electoral", 72, y);
    y += 20;

    doc.setFont("helvetica", "normal");
    doc.text(`Fecha de emisión: ${emision}`, 72, y);

    // Pie
    doc.setFontSize(10);
    doc.text(
      "Este documento es de uso personal y está sujeto a las leyes colombianas.",
      pageW / 2,
      760,
      { align: "center" }
    );

    // Descarga
    const filename = `certificado_votacion_${cedula}.pdf`;
    doc.save(filename);
  };
})();

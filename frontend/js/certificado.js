(function () {
  // 1) Verifica que jsPDF esté disponible
  const jspdf = window.jspdf || window.jspdf?.default;
  const jsPDF = window.jspdf?.jsPDF || jspdf?.jsPDF;
  if (!jsPDF) {
    console.error("jsPDF no está disponible. Revisa el <script> del CDN en confirmacion.html");
    return;
  }

  // 2) Exporta la función global usada en confirmacion.html
  window.generarCertificado = async function generarCertificado(elector) {
    if (!elector || !elector.id_elector) {
      throw new Error("Elector inválido o sesión expirada.");
    }

    // Configura documento
    const doc = new jsPDF({ unit: "pt", format: "letter" });
    const pageW = doc.internal.pageSize.getWidth();

    // Función segura de texto
    const safeText = (t) => String(t ?? "").toString();

    // Carga imágenes desde rutas locales (frontend/img)
    const logoURL = "img/CNE_logo.png";
    const firmaURL = "img/firma_cne.png";

    // Función para cargar imagen y convertirla a Base64 (por CORS)
    async function cargarImagen(url) {
      const resp = await fetch(url);
      const blob = await resp.blob();
      return await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    }

    // Encabezado
    try {
      const logo = await cargarImagen(logoURL);
      doc.addImage(logo, "PNG", pageW - 180, 40, 120, 48);
    } catch (e) {
      console.warn("No se pudo cargar el logo:", e);
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

    // Cuerpo
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

    // Firma
    try {
      const firma = await cargarImagen(firmaURL);
      doc.addImage(firma, "PNG", 72, y + 10, 150, 50);
    } catch (e) {
      console.warn("No se pudo cargar la firma:", e);
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

    // Descarga PDF
    const filename = `certificado_votacion_${cedula}.pdf`;
    doc.save(filename);
  };
})();

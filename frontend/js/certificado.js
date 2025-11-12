// frontend/js/certificado.js
// Genera el PDF del certificado SIN información del voto

(function(){
  // Carga una imagen y la devuelve como dataURL (para jsPDF)
  async function toDataURL(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = function () {
        const canvas = document.createElement("canvas");
        canvas.width = this.naturalWidth;
        canvas.height = this.naturalHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(this, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }

  function fmtFechaLarga(d = new Date()) {
    // “19 de noviembre de 2025”
    const opt = { day: "2-digit", month: "long", year: "numeric" };
    return d.toLocaleDateString("es-CO", opt);
  }
  function fmtFechaHora(d = new Date()) {
    // “9/11/2025, 6:42:05 p. m.”
    const opt = { year:"numeric", month:"numeric", day:"numeric", hour:"numeric", minute:"2-digit", second:"2-digit" };
    return d.toLocaleString("es-CO", opt);
  }

  // API pública:
  // generarCertificado({ nombres, id_elector })
  window.generarCertificado = async function generarCertificado(elector){
    if (!elector) return;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "pt", format: "letter" }); // 612x792 pt aprox
    const W = doc.internal.pageSize.getWidth();

    // ====== Encabezado (logo + título) ======
    const logo = await toDataURL("/img/logo_cne.png"); // opcional
    if (logo) {
      // logo arriba derecha ~ 110x45
      doc.addImage(logo, "PNG", W - 110 - 50, 40, 110, 45);
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Consejo Nacional Electoral", 50, 65);
    doc.setFont("helvetica","normal");
    doc.setFontSize(11);
    doc.text("República de Colombia", 50, 82);

    // Títulos centrar
    doc.setFont("helvetica","bold");
    doc.setFontSize(22);
    doc.text("República de Colombia", W/2, 150, { align:"center" });
    doc.setFontSize(20);
    doc.text("Certificado de Votación", W/2, 184, { align:"center" });

    // ====== Cuerpo ======
    const yStart = 230;
    const nombre = elector.nombres || "";
    const id     = elector.id_elector || "";
    const fechaEleccion = fmtFechaLarga(new Date());
    const emision = fmtFechaHora(new Date());

    doc.setFont("helvetica","normal");
    doc.setFontSize(12);

    const lines = [
      "El Consejo Nacional Electoral certifica que el(la) ciudadano(a):",
      ` ${nombre}`,
      `con número de identificación: ${id},`,
      `participó en las elecciones de Cámara de Representantes del ${fechaEleccion}.`
    ];
    let y = yStart;
    lines.forEach(t => { doc.text(t, 72, y); y += 22; });

    // Firma / autoridad (opcional)
    y += 36;
    const firma = await toDataURL("/img/firma_cne.png"); // opcional
    if (firma) {
      doc.addImage(firma, "PNG", 72, y-18, 110, 40);
      y += 26;
    }
    doc.setFont("helvetica","bold");
    doc.text("Consejo Nacional Electoral", 72, y); y += 18;

    // Emisión
    doc.setFont("helvetica","normal");
    doc.text(`Fecha de emisión: ${emision}`, 72, y);

    // Nota legal
    doc.setFontSize(10);
    doc.text(
      "Este documento es de uso personal y está sujeto a las leyes colombianas.",
      W/2, 760, { align:"center" }
    );

    doc.save(`certificado_votacion_${id}.pdf`);
  };
})();

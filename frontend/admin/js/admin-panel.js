// frontend/admin/js/admin-panel.js
const API_ADMIN  = "/api/admin";
const API_ESTADO = "/api/estado/jornada";

let countdownTimer = null;

function clearCountdown() {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
}

function toLocalInput(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function renderEstado(info) {
  const badge        = document.getElementById("estadoBadge");
  const txt          = document.getElementById("estadoText");
  const flash        = document.getElementById("flash");
  const form         = document.getElementById("frmJornada");
  const btnRecalcular = document.getElementById("btnRecalcular");

  clearCountdown();

  if (!info) {
    if (badge) badge.className = "badge bg-secondary";
    if (badge) badge.textContent = "—";
    if (txt)   txt.textContent = "";
    if (flash) {
      flash.className = "alert alert-info mt-2";
      flash.textContent = "No se pudo obtener el estado de la jornada.";
    }
    if (btnRecalcular) btnRecalcular.disabled = true;
    return;
  }

  const inicio = info.inicio ? new Date(info.inicio) : null;
  const fin    = info.fin ? new Date(info.fin) : null;
  const ahora  = info.ahora ? new Date(info.ahora) : new Date();

  const inicioStr = inicio ? inicio.toLocaleString("es-CO") : null;
  const finStr    = fin ? fin.toLocaleString("es-CO") : null;

  if (!inicio || !fin) {
    // SIN CONFIGURAR
    if (badge) {
      badge.className = "badge bg-secondary";
      badge.textContent = "Sin jornada";
    }
    if (txt) txt.textContent = "No hay una jornada de votación configurada.";
    if (flash) {
      flash.className = "alert alert-info mt-2";
      flash.textContent = "Configura una nueva jornada de votación usando el formulario.";
    }
    if (form) form.classList.remove("d-none");
    if (btnRecalcular) btnRecalcular.disabled = true;
    return;
  }

  // ya hay inicio y fin, vemos estado
  const estado = info.estado || (info.abierta ? "abierta" : "cerrada");

  if (estado === "abierta") {
    // JORNADA ABIERTA: ocultar formulario, deshabilitar recálculo
    if (badge) {
      badge.className = "badge bg-success";
      badge.textContent = "Abierta";
    }
    if (txt) txt.textContent = `Cierra: ${finStr}`;
    if (form) form.classList.add("d-none");
    if (btnRecalcular) btnRecalcular.disabled = true;

    if (flash) {
      flash.className = "alert alert-success mt-2";
      flash.innerHTML =
        `Jornada de votación configurada desde <strong>${inicioStr}</strong> hasta <strong>${finStr}</strong>.<br>` +
        `<span id="countdownLabel"></span>`;
    }

    const label = document.getElementById("countdownLabel");
    if (label) {
      countdownTimer = setInterval(() => {
        const ms = fin - new Date();
        if (ms <= 0) {
          clearCountdown();
          label.textContent = "La jornada está finalizando...";
          // recargar para que pase a 'cerrada'
          window.location.reload();
          return;
        }
        const mins = Math.floor(ms / 60000);
        const secs = Math.floor((ms % 60000) / 1000);
        label.textContent = `La jornada finalizará en ${mins} min ${secs
          .toString()
          .padStart(2, "0")} s.`;
      }, 1000);
    }
  } else if (estado === "no_iniciada") {
    // JORNADA CONFIGURADA, AÚN NO EMPIEZA
    if (badge) {
      badge.className = "badge bg-warning text-dark";
      badge.textContent = "Programada";
    }
    if (txt) txt.textContent = `Inicio programado: ${inicioStr}`;
    if (form) form.classList.remove("d-none");
    if (btnRecalcular) btnRecalcular.disabled = true;

    if (flash) {
      flash.className = "alert alert-info mt-2";
      flash.innerHTML =
        `Jornada de votación configurada desde <strong>${inicioStr}</strong> hasta <strong>${finStr}</strong>.<br>` +
        `<span id="countdownLabel"></span>`;
    }

    const label = document.getElementById("countdownLabel");
    if (label) {
      countdownTimer = setInterval(() => {
        const ms = inicio - new Date();
        if (ms <= 0) {
          clearCountdown();
          label.textContent = "La jornada está por comenzar...";
          window.location.reload();
          return;
        }
        const mins = Math.floor(ms / 60000);
        const secs = Math.floor((ms % 60000) / 1000);
        label.textContent = `La jornada empezará en ${mins} min ${secs
          .toString()
          .padStart(2, "0")} s.`;
      }, 1000);
    }
  } else {
    // CERRADA (estado === "cerrada" o "sin_configurar" con fechas)
    if (badge) {
      badge.className = "badge bg-danger";
      badge.textContent = "Cerrada";
    }
    if (txt) txt.textContent = "La jornada ya finalizó.";
    if (form) form.classList.remove("d-none");

    if (flash) {
      flash.className = "alert alert-success mt-2";
      flash.textContent =
        `Jornada de votación configurada desde ${inicioStr} hasta ${finStr}.`;
    }
    if (btnRecalcular) btnRecalcular.disabled = false;
  }
}

async function cargar() {
  try {
    // Obtenemos estado general (incluye inicio/fin)
    const r = await fetch(API_ESTADO);
    const info = await r.json();

    // Llenamos los inputs con las fechas actuales (si existen)
    if (info && info.inicio) {
      document.getElementById("inicio").value = toLocalInput(info.inicio);
    } else {
      document.getElementById("inicio").value = "";
    }
    if (info && info.fin) {
      document.getElementById("fin").value = toLocalInput(info.fin);
    } else {
      document.getElementById("fin").value = "";
    }

    renderEstado(info);
  } catch (err) {
    console.error("Error cargando estado jornada:", err);
    renderEstado(null);
  }
}

// Guardar jornada
document.getElementById("frmJornada")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const msg = document.getElementById("msg");
  if (msg) msg.textContent = "";

  const inicioStr = document.getElementById("inicio").value;
  const finStr    = document.getElementById("fin").value;

  if (!inicioStr || !finStr) {
    if (msg) msg.textContent = "Inicio y fin son obligatorios.";
    return;
  }

  const inicio = new Date(inicioStr);
  const fin    = new Date(finStr);
  const ahora  = new Date();

  // 1) inicio > ahora
  if (inicio <= ahora) {
    if (msg) {
      msg.textContent =
        "La fecha y hora de inicio deben ser posteriores al momento actual.";
    }
    return;
  }

  // 2) fin > inicio
  if (fin <= inicio) {
    if (msg) {
      msg.textContent =
        "La fecha y hora de fin deben ser posteriores a la fecha de inicio.";
    }
    return;
  }

  try {
    const r = await fetch(`${API_ADMIN}/jornada`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ inicio: inicioStr, fin: finStr }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      if (msg) msg.textContent = data.message || "Error al guardar la jornada.";
      return;
    }
    await cargar();
  } catch (err) {
    console.error(err);
    if (msg) msg.textContent = "Error de conexión al guardar.";
  }
});

// Recalcular resultados (stub)
document.getElementById("btnRecalcular")?.addEventListener("click", async () => {
  const out = document.getElementById("msgRes");
  if (out) out.textContent = "";
  try {
    const r = await fetch(`${API_ADMIN}/resultados/recalcular`, {
      method: "POST",
      credentials: "include",
    });
    const data = await r.json().catch(() => ({}));
    if (out) out.textContent = data.message || "Recalculo disparado (stub).";
  } catch (err) {
    console.error(err);
    if (out) out.textContent = "Error de conexión al recalcular.";
  }
});

// Cerrar sesión (aunque de momento esté medio rebelde lo dejamos igual)
document.getElementById("btnLogout")?.addEventListener("click", async () => {
  try {
    const res = await fetch(`${API_ADMIN}/logout`, {
      method: "POST",
      credentials: "include",
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.ok) {
      try {
        sessionStorage.clear();
        localStorage.clear();
      } catch {}
      window.location.replace("/admin/login.html");
    } else {
      alert(data.message || "No se pudo cerrar sesión.");
    }
  } catch (err) {
    console.error("Logout error:", err);
    alert("Error de conexión al cerrar sesión.");
  }
});

function setMinDates() {
  const inicioInput = document.getElementById("inicio");
  const finInput    = document.getElementById("fin");
  if (!inicioInput || !finInput) return;

  // now -> yyyy-MM-ddTHH:mm
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const nowStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
    now.getDate()
  )}T${pad(now.getHours())}:${pad(now.getMinutes())}`;

  inicioInput.min = nowStr;
  finInput.min    = nowStr;

  // cuando el usuario cambie inicio, fin.min debe ser como mínimo ese inicio
  inicioInput.addEventListener("change", () => {
    if (inicioInput.value) {
      finInput.min = inicioInput.value;
    }
  });
}

// Cargar estado al inicio
window.addEventListener("DOMContentLoaded", () => {
  setMinDates();
  cargar();
});
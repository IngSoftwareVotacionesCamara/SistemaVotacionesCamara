// frontend/admin/js/admin-panel.js
const API        = "/api/admin";
const API_ESTADO = "/api/estado/jornada";

// -------------------- helpers de fecha --------------------
function toLocalInput(ts) {
  if (!ts) return "";
  const d   = new Date(ts);
  const pad = (n) => String(n).padStart(2, "0");
  // yyyy-MM-ddTHH:mm (formato que espera <input type="datetime-local">)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function niceDateTime(ts) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("es-CO", {
    dateStyle: "short",
    timeStyle: "medium",
  });
}

// -------------------- badge de estado --------------------
function badgeEstado(info) {
  const badge = document.getElementById("estadoBadge");
  const txt   = document.getElementById("estadoText");
  const btnRecalc = document.getElementById("btnRecalcular");

  if (!badge || !txt) return;

  if (!info || !info.inicio || !info.fin) {
    // jornada sin configurar (null / null)
    badge.textContent = "Cerrada";
    badge.className   = "badge bg-secondary";
    txt.textContent   = "La jornada no está configurada.";
    if (btnRecalc) btnRecalc.disabled = true;
    return;
  }

  const ahora  = new Date();
  const ini    = new Date(info.inicio);
  const fin    = new Date(info.fin);

  if (ahora < ini) {
    badge.textContent = "Programada";
    badge.className   = "badge bg-info";
    const diffMs      = ini - ahora;
    const mins        = Math.floor(diffMs / 60000);
    txt.textContent   = `La jornada empezará en aproximadamente ${mins} minuto(s).`;
    if (btnRecalc) btnRecalc.disabled = true;
  } else if (ahora >= ini && ahora <= fin) {
    badge.textContent = "Abierta";
    badge.className   = "badge bg-success";
    txt.textContent   = `La jornada está en curso. Cierra el ${niceDateTime(info.fin)}.`;
    if (btnRecalc) btnRecalc.disabled = true;
  } else {
    badge.textContent = "Cerrada";
    badge.className   = "badge bg-danger";
    txt.textContent   = "La jornada ya finalizó.";
    if (btnRecalc) btnRecalc.disabled = false;
  }
}

// -------------------- cargar datos desde el backend --------------------
async function cargar() {
  const flash = document.getElementById("flash");
  if (flash) {
    flash.className = "";
    flash.textContent = "";
  }

  // 1) jornada guardada
  const r1 = await fetch(`${API}/jornada`, { credentials: "include" });
  if (r1.status === 401) {
    window.location.replace("/admin/login.html");
    return;
  }
  const jor = await r1.json();

  const inicioInput = document.getElementById("inicio");
  const finInput    = document.getElementById("fin");

  if (inicioInput && finInput) {
    inicioInput.value = toLocalInput(jor.inicio);
    finInput.value    = toLocalInput(jor.fin);
  }

  // 2) estado calculado (abierta/cerrada/etc)
  const r2  = await fetch(API_ESTADO);
  const est = await r2.json();
  badgeEstado(est);

  // 3) mensaje verde de configuración
  if (flash) {
    if (jor.inicio && jor.fin) {
      flash.className = "alert alert-success";
      flash.textContent =
        `Jornada de votación configurada desde ${niceDateTime(
          jor.inicio
        )} hasta ${niceDateTime(jor.fin)}.`;
    } else {
      flash.className = "alert alert-secondary";
      flash.textContent = "Jornada de votación sin configurar.";
    }
  }
}

// -------------------- envío del formulario --------------------
document.getElementById("frmJornada")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const msg = document.getElementById("msg");
  if (msg) msg.textContent = "";

  const inicioVal = document.getElementById("inicio")?.value;
  const finVal    = document.getElementById("fin")?.value;

  // validaciones básicas en el cliente
  if (!inicioVal || !finVal) {
    if (msg) msg.textContent = "Debes indicar inicio y fin.";
    return;
  }

  const inicio = new Date(inicioVal);
  const fin    = new Date(finVal);
  const ahora  = new Date();

  if (inicio <= ahora) {
    if (msg) msg.textContent = "El inicio debe ser en una fecha/hora futura.";
    return;
  }
  if (fin <= inicio) {
    if (msg) msg.textContent = "La hora de fin debe ser mayor a la de inicio.";
    return;
  }

  // --- 1) Guardar en el backend ---
  try {
    const r = await fetch(`${API}/jornada`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ inicio: inicioVal, fin: finVal }),
    });

    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      if (msg) msg.textContent = data.message || "Error al guardar la jornada.";
      return;
    }
  } catch (err) {
    console.error("Error guardando jornada:", err);
    if (msg) msg.textContent = "Error de conexión al guardar.";
    return; // importante: aquí paramos, aunque el PUT en realidad sea el que falle
  }

  // --- 2) Recargar UI (aunque falle, ya no mostramos 'error al guardar') ---
  try {
    await cargar();
  } catch (err) {
    console.error("Error recargando jornada:", err);
  }
});

// -------------------- botón Recalcular resultados (stub) --------------------
document.getElementById("btnRecalcular")?.addEventListener("click", async () => {
  const msgRes = document.getElementById("msgRes");
  if (msgRes) msgRes.textContent = "";

  try {
    const r = await fetch(`${API}/resultados/recalcular`, {
      method: "POST",
      credentials: "include",
    });
    const data = await r.json().catch(() => ({}));
    if (msgRes) msgRes.textContent = data.message || "Recalculo disparado.";
  } catch (err) {
    console.error("Error recalculando resultados:", err);
    if (msgRes) msgRes.textContent = "Error de conexión al recalcular.";
  }
});

// -------------------- botón Cerrar sesión (aunque no lo usemos aún) --------------------
document.getElementById("btnLogout")?.addEventListener("click", async () => {
  try {
    const res = await fetch("/api/admin/logout", {
      method: "POST",
      credentials: "include",
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.ok) {
      try {
        sessionStorage.clear();
        localStorage.clear();
      } catch {}
      location.replace("/admin/login.html");
    } else {
      alert(data.message || "No se pudo cerrar sesión.");
    }
  } catch (err) {
    console.error("Logout error:", err);
    alert("Error de conexión al cerrar sesión.");
  }
});

// Cargar todo al entrar
cargar().catch((err) => console.error("Error inicial cargando jornada:", err));

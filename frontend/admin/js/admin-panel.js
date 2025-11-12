// frontend/admin/js/admin-panel.js
const API_ADMIN = "/api/admin";

const inicioInput   = document.getElementById("inicio");
const finInput      = document.getElementById("fin");
const msgElem       = document.getElementById("msg");
const flashElem     = document.getElementById("flash");
const estadoBadge   = document.getElementById("estadoBadge");
const estadoText    = document.getElementById("estadoText");
const btnRecalcular = document.getElementById("btnRecalcular");
const btnLogout     = document.getElementById("btnLogout");

/* ------------ helpers de formato ------------ */

// Convierte "2025-11-12T10:36:00.000000" → "2025-11-12T10:36"
function toInputValue(dbString) {
  if (!dbString) return "";
  return dbString.substring(0, 16);
}

// Convierte "2025-11-12T10:36" → "12/11/2025, 10:36"
function prettyFromInput(inputValue) {
  if (!inputValue) return "";
  const [datePart, timePart] = inputValue.split("T"); // "YYYY-MM-DD", "HH:MM"
  const [yyyy, mm, dd] = datePart.split("-");
  const [hh, min] = timePart.split(":");
  return `${dd}/${mm}/${yyyy}, ${hh}:${min}`;
}

/* ------------ pintar estado / tarjeta verde ------------ */

function renderEstado(inicioDb, finDb) {
  // limpiar
  flashElem.innerHTML   = "";
  estadoBadge.textContent = "—";
  estadoBadge.className   = "badge bg-secondary";
  estadoText.textContent  = "";
  if (btnRecalcular) btnRecalcular.disabled = true;

  if (!inicioDb || !finDb) {
    estadoText.textContent = "La jornada no está configurada.";
    return;
  }

  const inicioInputVal = toInputValue(inicioDb);
  const finInputVal    = toInputValue(finDb);

  const inicioNice = prettyFromInput(inicioInputVal);
  const finNice    = prettyFromInput(finInputVal);

  // Tarjeta verde con el rango EXACTO que configuraste
  flashElem.innerHTML = `
    <div class="alert alert-success py-2 mb-3">
      Jornada de votación configurada desde <strong>${inicioNice}</strong>
      hasta <strong>${finNice}</strong>.
    </div>
  `;

  const ahora      = new Date();
  const inicioDate = new Date(inicioDb);
  const finDate    = new Date(finDb);

  if (ahora < inicioDate) {
    estadoBadge.textContent = "Programada";
    estadoBadge.className   = "badge bg-warning text-dark";
    estadoText.textContent  = "La jornada aún no inicia.";
  } else if (ahora >= inicioDate && ahora <= finDate) {
    estadoBadge.textContent = "Abierta";
    estadoBadge.className   = "badge bg-success";
    estadoText.textContent  = "La jornada está en curso.";
  } else {
    estadoBadge.textContent = "Cerrada";
    estadoBadge.className   = "badge bg-danger";
    estadoText.textContent  = "La jornada ya finalizó.";
    if (btnRecalcular) btnRecalcular.disabled = false;
  }
}

/* ------------ cargar jornada desde el backend ------------ */

async function cargarJornada() {
  msgElem.textContent = "";

  const res = await fetch(`${API_ADMIN}/jornada`, {
    credentials: "include",
  });

  if (res.status === 401) {
    // sesión expirada o sin login de admin
    window.location.replace("/admin/login.html");
    return;
  }

  const data = await res.json();
  const { inicio, fin } = data;

  // rellenar inputs exactamente con lo que viene de la BD
  inicioInput.value = toInputValue(inicio);
  finInput.value    = toInputValue(fin);

  renderEstado(inicio, fin);
}

/* ------------ validación y guardado ------------ */

document.getElementById("frmJornada")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  msgElem.textContent = "";

  const inicio = inicioInput.value; // "YYYY-MM-DDTHH:MM"
  const fin    = finInput.value;

  if (!inicio || !fin) {
    msgElem.textContent = "Debes seleccionar inicio y fin.";
    return;
  }

  const ahora      = new Date();
  const inicioDate = new Date(inicio);
  const finDate    = new Date(fin);

  if (inicioDate <= ahora) {
    msgElem.textContent = "La fecha/hora de inicio debe ser mayor a la hora actual.";
    return;
  }

  if (finDate <= inicioDate) {
    msgElem.textContent = "La fecha/hora de fin debe ser mayor a la de inicio.";
    return;
  }

  try {
    const res = await fetch(`${API_ADMIN}/jornada`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ inicio, fin }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      msgElem.textContent = data.message || "Error al guardar la jornada.";
      return;
    }

    // recargar con los valores que quedaron en la BD
    await cargarJornada();
  } catch (err) {
    console.error(err);
    msgElem.textContent = "Error de conexión al guardar.";
  }
});

/* ------------ botón Recalcular (stub) ------------ */

btnRecalcular?.addEventListener("click", async () => {
  try {
    const res = await fetch(`${API_ADMIN}/resultados/recalcular`, {
      method: "POST",
      credentials: "include",
    });
    const data = await res.json().catch(() => ({}));
    document.getElementById("msgRes").textContent =
      data.message || "Recalculo disparado.";
  } catch (err) {
    console.error(err);
    document.getElementById("msgRes").textContent = "Error al recalcular.";
  }
});

/* ------------ botón Cerrar sesión (aunque lo dejemos para después) ------------ */
btnLogout?.addEventListener("click", async () => {
  try {
    await fetch(`${API_ADMIN}/logout`, {
      method: "POST",
      credentials: "include",
    });
  } catch (e) {
    console.error(e);
  } finally {
    window.location.replace("/admin/login.html");
  }
});

/* ------------ inicialización ------------ */

// Opcional: evitar seleccionar fechas pasadas en el picker
(function setMinInputs() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const nowStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
    now.getDate()
  )}T${pad(now.getHours())}:${pad(now.getMinutes())}`;

  inicioInput.min = nowStr;
  finInput.min    = nowStr;
})();

cargarJornada();

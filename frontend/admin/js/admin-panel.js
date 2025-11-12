const API = "/api/admin";
const API_ESTADO = "/api/estado/jornada";

let _ticker = null;

function fmt(dt) {
  return new Date(dt).toLocaleString("es-CO", { dateStyle: "full", timeStyle: "short" });
}

function toISOFromLocal(inputValue) {
  // input type="datetime-local" => "YYYY-MM-DDTHH:mm"
  // Lo interpretamos como hora local y lo convertimos a ISO (UTC) para enviarlo al servidor
  if (!inputValue) return null;
  const d = new Date(inputValue);
  if (isNaN(d.getTime())) return null;
  return d.toISOString(); // ej: "2025-11-12T18:00:00.000Z"
}

function setFlash(kind, html) {
  const box = document.getElementById("flash");
  if (!box) return;
  const cls = kind === "ok" ? "alert alert-success" : kind === "warn" ? "alert alert-warning" : "alert alert-danger";
  box.className = cls;
  box.innerHTML = html || "";
}

function setBadgeEstado(info) {
  const badge = document.getElementById("estadoBadge");
  const txt = document.getElementById("estadoText");
  if (!info || !info.inicio || !info.fin) {
    badge.textContent = "—";
    badge.className = "badge bg-secondary";
    txt.textContent = "";
    return;
  }
  if (info.abierta) {
    badge.textContent = "Abierta";
    badge.className = "badge bg-success";
    txt.textContent = `Cierra: ${fmt(info.fin)}`;
  } else {
    badge.textContent = "Cerrada";
    badge.className = "badge bg-danger";
    txt.textContent = `Abrió: ${fmt(info.inicio)}`;
  }
}

function startCountdown(ms, onTick, onEnd) {
  if (_ticker) clearInterval(_ticker);
  const until = Date.now() + ms;
  const fmtLeft = (msec) => {
    const s = Math.max(0, Math.floor(msec / 1000));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const ss = s % 60;
    if (h > 0) return `${h} h ${String(m).padStart(2, "0")} m ${String(ss).padStart(2, "0")} s`;
    if (m > 0) return `${m} m ${String(ss).padStart(2, "0")} s`;
    return `${ss} s`;
  };
  onTick?.(fmtLeft(until - Date.now()));
  _ticker = setInterval(() => {
    const left = until - Date.now();
    if (left <= 0) {
      clearInterval(_ticker);
      _ticker = null;
      onTick?.("0 s");
      onEnd?.();
      return;
    }
    onTick?.(fmtLeft(left));
  }, 1000);
}

function renderEstadoYMensaje(jor, est) {
  const btnRecalcular = document.getElementById("btnRecalcular");
  btnRecalcular.disabled = true; // default

  if (!jor?.inicio || !jor?.fin) {
    setFlash("warn", "Configura la jornada para habilitar el acceso de electores.");
    return;
  }

  const t0 = new Date(jor.inicio).getTime();
  const t1 = new Date(jor.fin).getTime();
  const now = Date.now();

  if (now < t0) {
    // Aún no inicia
    setFlash("ok",
      `Jornada de votación configurada desde <strong>${fmt(jor.inicio)}</strong> hasta <strong>${fmt(jor.fin)}</strong>.<br>
       <small class="text-muted">La jornada empezará en <span id="tick"></span>.</small>`
    );
    const tickSpan = () => {
      const s = document.getElementById("tick");
      return (txt) => (s ? (s.textContent = txt) : null);
    };
    startCountdown(t0 - now, tickSpan());
  } else if (now >= t0 && now <= t1) {
    // En curso
    setFlash("ok",
      `Jornada de votación en curso. Cierra el <strong>${fmt(jor.fin)}</strong>.<br>
       <small class="text-muted">Termina en <span id="tick"></span>.</small>`
    );
    const tickSpan = () => {
      const s = document.getElementById("tick");
      return (txt) => (s ? (s.textContent = txt) : null);
    };
    startCountdown(t1 - now, tickSpan());
  } else {
    // Cerrada
    setFlash("ok", `Jornada cerrada. Ya puedes <strong>calcular los resultados</strong>.`);
    btnRecalcular.disabled = false;
  }

  setBadgeEstado(est);
}

async function cargar() {
  // Jornada configurada (admin)
  const r1 = await fetch(`${API}/jornada`, { credentials: "include" });
  if (r1.status === 401) { window.location.replace("/admin/login.html"); return; }
  const jor = await r1.json();

  // Estado público (abierta/cerrada)
  const r2 = await fetch(API_ESTADO);
  const est = await r2.json();

  // Pinta inputs
  document.getElementById("inicio").value = jor.inicio ? toLocalInput(jor.inicio) : "";
  document.getElementById("fin").value    = jor.fin    ? toLocalInput(jor.fin)    : "";
  renderEstadoYMensaje(jor, est);
}

// Convertir ISO -> value para input datetime-local
function toLocalInput(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

document.getElementById("frmJornada")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const msg = document.getElementById("msg");
  msg.textContent = "";

  const inicioLocal = document.getElementById("inicio").value; // "YYYY-MM-DDTHH:mm"
  const finLocal    = document.getElementById("fin").value;

  const inicioISO = toISOFromLocal(inicioLocal);
  const finISO    = toISOFromLocal(finLocal);

  if (!inicioISO || !finISO) {
    msg.textContent = "Fechas inválidas.";
    return;
  }

  try {
    const r = await fetch(`${API}/jornada`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ inicio: inicioISO, fin: finISO }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      msg.textContent = data.message || "Error al guardar";
      return;
    }

    // Re-cargar estado y mostrar aviso
    await cargar();
  } catch (err) {
    console.error(err);
    msg.textContent = "Error de conexión";
  }
});

document.getElementById("btnCerrarAhora")?.addEventListener("click", async () => {
  const r = await fetch(`${API}/jornada/cerrar_ahora`, { method: "POST", credentials: "include" });
  if (r.ok) await cargar();
});

document.getElementById("btnRecalcular")?.addEventListener("click", async () => {
  const r = await fetch(`${API}/resultados/recalcular`, { method: "POST", credentials: "include" });
  const data = await r.json().catch(() => ({}));
  document.getElementById("msgRes").textContent = data.message || "OK";
});

cargar();

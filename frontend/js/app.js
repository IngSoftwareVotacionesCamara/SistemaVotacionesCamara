const API_URL = "/api";
const $ = (sel) => document.querySelector(sel);
const msg = $("#msg");

/* -------------------------
   LOGIN DEL ELECTOR
-------------------------- */
$("#loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  msg.classList.remove("text-success");
  msg.classList.add("text-danger");
  msg.textContent = "";

  const id_elector = $("#id_elector").value.trim();
  const password   = $("#password").value.trim();
  const tipo_id    = $("#tipo_id").value;

  if (!id_elector || !password) {
    msg.textContent = "Ingrese su identificación y contraseña.";
    return;
  }

  try {
    const resp = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_elector, password, tipo_id })
    });

    if (!resp.ok) {
      let detail = `Error ${resp.status}`;
      try {
        const j = await resp.json();
        detail = j?.message || detail;
      } catch {
        detail = await resp.text();
      }
      msg.textContent = detail;
      return;
    }

    const data = await resp.json();
    // Guarda al elector para la siguiente pantalla
    localStorage.setItem("elector", JSON.stringify(data.elector));

    // Muestra éxito y redirige con un pequeño delay
    msg.classList.remove("text-danger");
    msg.classList.add("text-success");
    msg.textContent = "Ingreso exitoso. Redirigiendo…";
    setTimeout(() => {
      window.location.href = "/votar.html";
    }, 1200);
  } catch (err) {
    console.error(err);
    msg.textContent = "Error de conexión con el servidor.";
  }
});

/* -------------------------
   CATÁLOGOS DE DATOS
-------------------------- */

async function cargarCircunscripciones(codigo_dane) {
  const res = await fetch(`${API_URL}/circunscripciones?codigo_dane=${codigo_dane}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Error circunscripciones (HTTP ${res.status}): ${text}`);
  }
  return res.json();
}

async function cargarPartidos(codigo_dane, cod_cir) {
  const url = `${API_URL}/partidos?codigo_dane=${codigo_dane}&cod_cir=${cod_cir}`;
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Error partidos (HTTP ${res.status}): ${text}`);
  }
  return res.json();
}

async function cargarCandidatos(codigo_dane, cod_cir, cod_partido) {
  const res = await fetch(
    `${API_URL}/candidatos?codigo_dane=${codigo_dane}&cod_cir=${cod_cir}&cod_partido=${cod_partido}`
  );
  if (res.status === 204 && res.headers.get("X-Lista") === "cerrada") {
    return { tipo_lista: "cerrada", candidatos: [] };
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Error candidatos (HTTP ${res.status}): ${text}`);
  }
  const data = await res.json();
  return { tipo_lista: "abierta", candidatos: data };
}

/* -------------------------
   VOTAR
-------------------------- */
if (document.getElementById("btnVotar")) {
  document.getElementById("btnVotar").addEventListener("click", async () => {
    const elector = JSON.parse(sessionStorage.getItem("elector"));
    const cod_cir = Number(sessionStorage.getItem("cod_cir")); // ⭐
    const cod_partido = window.partidoSeleccionado || document.getElementById("partido")?.value || null;
    const msg = document.getElementById("msg");
    msg.textContent = "";

    if (!elector) return (msg.textContent = "Debe iniciar sesión nuevamente.");
    if (!cod_cir) return (msg.textContent = "No se pudo determinar la circunscripción.");
    if (!cod_partido) return (msg.textContent = "Debe seleccionar un partido antes de votar.");

    const body = {
      id_elector: elector.id_elector,
      codigo_dane: elector.codigo_dane,
      cod_cir,
      cod_partido,
    };

    try {
      const res = await fetch(`${API_URL}/votar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        msg.textContent = "✅ Voto registrado exitosamente. Redirigiendo...";
        msg.classList.remove("text-danger");
        msg.classList.add("text-success");
        setTimeout(() => (window.location.href = "gracias.html"), 1500);
      } else {
        msg.textContent = data.message || `No se pudo registrar el voto (HTTP ${res.status}).`;
        msg.classList.add("text-danger");
      }
    } catch (error) {
      console.error("Error al votar:", error);
      msg.textContent = "Error de conexión con el servidor.";
      msg.classList.add("text-danger");
    }
  });
}

/* -------------------------
   AUTOEJECUTABLES PARA VOTAR.HTML
-------------------------- */
if (window.location.pathname.includes("votar.html")) {
  (async () => {
    const elector = JSON.parse(sessionStorage.getItem("elector"));
    const listaPartidos = document.getElementById("listaPartidos");
    const msg = document.getElementById("msg");

    if (!elector) {
      msg.textContent = "Debe iniciar sesión nuevamente.";
      return;
    }

    try {
      // 1) Circunscripciones del elector
      const circuns = await cargarCircunscripciones(elector.codigo_dane);
      if (!Array.isArray(circuns) || circuns.length === 0) {
        msg.textContent = "No hay circunscripciones para tu departamento.";
        return;
      }
      const cod_cir = circuns[0].cod_cir;
      sessionStorage.setItem("cod_cir", String(cod_cir)); // ⭐ guarda para usar después

      // 2) Partidos (con control de error)
      const partidos = await cargarPartidos(elector.codigo_dane, cod_cir);
      if (!Array.isArray(partidos) || partidos.length === 0) {
        msg.textContent = "No hay partidos disponibles para tu circunscripción.";
        return;
      }

      // 3) Pintar tarjetas
      listaPartidos.innerHTML = "";
      partidos.forEach((p) => {
        const div = document.createElement("div");
        div.className = "col-md-4";
        div.innerHTML = `
          <div class="p-3 text-center border partido-card" data-id="${p.cod_partido}">
            <strong>${p.nombre}</strong><br/>
            <small>${p.tipo_lista ? "Lista " + p.tipo_lista : ""}</small>
          </div>
        `;
        div.querySelector(".partido-card").addEventListener("click", (e) => {
          document.querySelectorAll(".partido-card").forEach((c) => c.classList.remove("active"));
          e.currentTarget.classList.add("active");
          // ✅ usa variable o un hidden existente
          window.partidoSeleccionado = p.cod_partido;
          document.getElementById("btnVotar").disabled = false;
        });
        listaPartidos.appendChild(div);
      });
    } catch (e) {
      console.error(e);
      msg.textContent = String(e.message || e);
    }
  })();
}
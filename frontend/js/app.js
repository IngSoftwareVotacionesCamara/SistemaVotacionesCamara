const API_URL = "/api";
const $ = (sel) => document.querySelector(sel);
const msg = $("#msg");

/* -------------------------
   LOGIN DEL ELECTOR
-------------------------- */
const formLogin = $("#loginForm");
if (formLogin) {
  formLogin.addEventListener("submit", async (e) => {
    e.preventDefault();
    msg.classList.remove("text-success");
    msg.classList.add("text-danger");
    msg.textContent = "";

    const id_elector = $("#id_elector").value.trim();
    const password   = $("#password").value.trim();
    const tipo_id    = $("#tipo_id")?.value || "CC";

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

      // Guarda sesión en sessionStorage y respaldo en localStorage
      sessionStorage.setItem("elector", JSON.stringify(data.elector));
      localStorage.setItem("elector_backup", JSON.stringify(data.elector));

      msg.classList.remove("text-danger");
      msg.classList.add("text-success");
      msg.textContent = "Ingreso exitoso. Redirigiendo…";

      // Redirige al formulario de votación
      setTimeout(() => {
        window.location.href = "/votar.html";
      }, 1000);
    } catch (err) {
      console.error(err);
      msg.textContent = "Error de conexión con el servidor.";
    }
  });
}

/* -------------------------
   CATÁLOGOS DE DATOS
-------------------------- */
async function cargarCircunscripciones(codigo_dane) {
  const res = await fetch(`${API_URL}/circunscripciones?codigo_dane=${codigo_dane}`);
  if (!res.ok) throw new Error(`Error circunscripciones (HTTP ${res.status})`);
  return res.json();
}

async function cargarPartidos(codigo_dane, cod_cir) {
  const url = `${API_URL}/partidos?codigo_dane=${codigo_dane}&cod_cir=${cod_cir}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Error partidos (HTTP ${res.status})`);
  return res.json();
}

async function cargarCandidatos(codigo_dane, cod_cir, cod_partido) {
  const res = await fetch(
    `${API_URL}/candidatos?codigo_dane=${codigo_dane}&cod_cir=${cod_cir}&cod_partido=${cod_partido}`
  );
  if (res.status === 204 && res.headers.get("X-Lista") === "cerrada") {
    return { tipo_lista: "cerrada", candidatos: [] };
  }
  if (!res.ok) throw new Error(`Error candidatos (HTTP ${res.status})`);
  const data = await res.json();
  return { tipo_lista: "abierta", candidatos: data };
}

/* -------------------------
   VOTAR
-------------------------- */
if (window.location.pathname.includes("votar.html")) {
  (async () => {
    // 1) Recuperar sesión
    let elector = null;
    try {
      elector = JSON.parse(sessionStorage.getItem("elector"));
      if (!elector) {
        elector = JSON.parse(localStorage.getItem("elector_backup") || "null");
        if (elector) sessionStorage.setItem("elector", JSON.stringify(elector));
      }
    } catch {
      elector = null;
    }

    const msg = document.getElementById("msg");
    const listaPartidos = document.getElementById("listaPartidos");

    if (!elector || !elector.id_elector) {
      msg.textContent = "Debe iniciar sesión nuevamente.";
      setTimeout(() => (window.location.href = "/"), 1000);
      return;
    }

    try {
      // 2) Cargar circunscripción
      const circuns = await cargarCircunscripciones(elector.codigo_dane);
      if (!Array.isArray(circuns) || circuns.length === 0) {
        msg.textContent = "No hay circunscripciones disponibles.";
        return;
      }

      const cod_cir = circuns[0].cod_cir;
      sessionStorage.setItem("cod_cir", String(cod_cir));

      // 3) Cargar partidos
      const partidos = await cargarPartidos(elector.codigo_dane, cod_cir);
      if (!Array.isArray(partidos) || partidos.length === 0) {
        msg.textContent = "No hay partidos disponibles.";
        return;
      }

      // 4) Renderizar partidos
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
          window.partidoSeleccionado = p.cod_partido;
          document.getElementById("btnVotar").disabled = false;
        });
        listaPartidos.appendChild(div);
      });
    } catch (err) {
      console.error(err);
      msg.textContent = String(err.message || err);
    }

    // 5) Confirmar voto
    const btnVotar = document.getElementById("btnVotar");
    btnVotar?.addEventListener("click", async () => {
      const cod_cir = Number(sessionStorage.getItem("cod_cir"));
      const cod_partido = window.partidoSeleccionado || null;
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
  })();
}
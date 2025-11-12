const API = "/api/admin";
const API_ESTADO = "/api/estado/jornada";

function toLocalInput(ts){
  if(!ts) return "";
  const d = new Date(ts);
  const pad = n => String(n).padStart(2,"0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function badgeEstado(info){
  const badge = document.getElementById("estadoBadge");
  const txt = document.getElementById("estadoText");
  if(!info){ badge.textContent="—"; badge.className="badge bg-secondary"; txt.textContent=""; return; }
  if(info.abierta){
    badge.textContent = "Abierta";
    badge.className = "badge bg-success";
    txt.textContent = `Cierra: ${new Date(info.fin).toLocaleString("es-CO")}`;
  }else{
    badge.textContent = "Cerrada";
    badge.className = "badge bg-danger";
    txt.textContent = `Abrió: ${new Date(info.inicio).toLocaleString("es-CO")}`;
  }
}

async function cargar(){
  const r1 = await fetch(`${API}/jornada`, { credentials:"include" });
  if(r1.status===401){ window.location.replace("/admin/login.html"); return; }
  const jor = await r1.json();

  document.getElementById("inicio").value = toLocalInput(jor.inicio);
  document.getElementById("fin").value    = toLocalInput(jor.fin);

  const r2 = await fetch(API_ESTADO);
  const est = await r2.json();
  badgeEstado(est);
}

document.getElementById("frmJornada")?.addEventListener("submit", async (e)=>{
  e.preventDefault();
  const msg = document.getElementById("msg");
  msg.textContent = "";
  const inicio = document.getElementById("inicio").value;
  const fin    = document.getElementById("fin").value;
  try{
    const r = await fetch(`${API}/jornada`, {
      method:"PUT",
      headers:{ "Content-Type":"application/json" },
      credentials:"include",
      body: JSON.stringify({ inicio, fin })
    });
    const data = await r.json().catch(()=> ({}));
    if(!r.ok){ msg.textContent = data.message || "Error al guardar"; return; }
    await cargar();
  }catch(err){ msg.textContent = "Error de conexión"; }
});

document.getElementById("btnCerrarAhora")?.addEventListener("click", async ()=>{
  const r = await fetch(`${API}/jornada/cerrar_ahora`, { method:"POST", credentials:"include" });
  if(r.ok) await cargar();
});

document.getElementById("btnRecalcular")?.addEventListener("click", async ()=>{
  const r = await fetch(`${API}/resultados/recalcular`, { method:"POST", credentials:"include" });
  const data = await r.json().catch(()=> ({}));
  document.getElementById("msgRes").textContent = data.message || "OK";
});

document.getElementById("btnLogout")?.addEventListener("click", async ()=>{
  await fetch(`${API}/logout`, { method:"POST", credentials:"include" });
  window.location.replace("/admin/login.html");
});

cargar();

window.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("btnLogout");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    try {
      const res = await fetch("/api/admin/logout", {
        method: "POST",
        credentials: "include", // envía la cookie 'sid'
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.ok) {
        // Limpieza cliente y redirección
        try { sessionStorage.clear(); localStorage.clear(); } catch {}
        location.replace("/admin/login.html");
      } else {
        alert(data.message || "No se pudo cerrar sesión. Intenta nuevamente.");
      }
    } catch (err) {
      console.error("Logout error:", err);
      alert("Error de conexión al cerrar sesión.");
    }
  });
});

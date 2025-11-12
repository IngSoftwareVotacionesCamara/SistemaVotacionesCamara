const API = "/api/admin";
const API_ESTADO = "/api/estado/jornada";

function toLocalInput(ts){ /* igual que tienes */ }
function badgeEstado(info){ /* igual que tienes */ }

async function cargar(){
  const r1 = await fetch(`${API}/jornada`, { credentials:"include" });
  if (r1.status === 401) { location.replace("/admin/login.html"); return; }
  const jor = await r1.json();
  document.getElementById("inicio").value = toLocalInput(jor.inicio);
  document.getElementById("fin").value    = toLocalInput(jor.fin);

  const r2 = await fetch(API_ESTADO);
  const est = await r2.json();
  badgeEstado(est);
}

document.getElementById("frmJornada")?.addEventListener("submit", async (e)=>{ /* igual */ });
document.getElementById("btnCerrarAhora")?.addEventListener("click", async ()=>{ /* igual */ });
document.getElementById("btnRecalcular")?.addEventListener("click", async ()=>{ /* igual */ });

// 🔐 Logout (uno solo)
document.getElementById("btnLogout")?.addEventListener("click", async ()=> {
  try{
    const res = await fetch(`${API}/logout`, { method:"POST", credentials:"include" });
    const data = await res.json().catch(()=> ({}));
    if (res.ok && data.ok) {
      try { sessionStorage.clear(); localStorage.clear(); } catch {}
      location.replace("/admin/login.html");
    } else {
      alert(data.message || "No se pudo cerrar sesión. Intenta nuevamente.");
    }
  } catch (e) {
    console.error(e);
    alert("Error de conexión al cerrar sesión.");
  }
});

cargar();

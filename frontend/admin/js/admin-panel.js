// frontend/admin/js/admin-panel.js
const API_ADMIN  = "/api/admin";
const API_ESTADO = "/api/estado/jornada"; // tu endpoint público de estado

const $ = (sel)=>document.querySelector(sel);

function toLocalInput(ts){
  if(!ts) return "";
  const d = new Date(ts);
  const pad = n => String(n).padStart(2,"0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function msToStr(ms){
  if(ms <= 0) return "0 s";
  let s = Math.floor(ms/1000);
  const d = Math.floor(s/86400); s -= d*86400;
  const h = Math.floor(s/3600); s -= h*3600;
  const m = Math.floor(s/60);   s -= m*60;
  const parts=[];
  if(d) parts.push(`${d} d`);
  if(h) parts.push(`${h} h`);
  if(m) parts.push(`${m} min`);
  if(s) parts.push(`${s} s`);
  return parts.join(" ");
}

let countdownIv = null;
function setFlashOk(inicio, fin, estado){
  const box = $("#flash");
  if(!box) return;

  const di = inicio ? new Date(inicio) : null;
  const df = fin    ? new Date(fin)    : null;

  let html = `<div class="alert alert-success py-2 mb-2">
    <div><strong>Jornada de votación configurada</strong>${di && df ? ` desde <b>${di.toLocaleString("es-CO")}</b> hasta <b>${df.toLocaleString("es-CO")}</b>.` : "."}</div>
    <div class="mt-1" id="countdown"></div>
  </div>`;

  box.innerHTML = html;

  const cd = $("#countdown");
  if(countdownIv){ clearInterval(countdownIv); countdownIv = null; }

  function tick(){
    const now = Date.now();
    if(di && now < di.getTime()){
      cd.textContent = `La jornada empezará en ${msToStr(di.getTime()-now)}.`;
    } else if(di && df && now >= di.getTime() && now <= df.getTime()){
      cd.textContent = `Jornada en curso. Quedan ${msToStr(df.getTime()-now)}.`;
    } else if(df && now > df.getTime()){
      cd.textContent = "Jornada cerrada. Ya puedes calcular los resultados.";
    } else {
      cd.textContent = "Configura inicio y fin para habilitar la jornada.";
    }
  }
  tick();
  countdownIv = setInterval(tick, 1000);

  // habilitar/inhabilitar botón “Recalcular resultados”
  const btnRecalc = $("#btnRecalcular");
  if(btnRecalc){
    const now = Date.now();
    const cerrada = df && now > new Date(df).getTime();
    btnRecalc.disabled = !cerrada;
  }
}

function setEstadoBadge(info){
  const badge = $("#estadoBadge");
  const txt   = $("#estadoText");
  if(!badge || !txt) return;

  if(!info){ badge.textContent="—"; badge.className="badge bg-secondary"; txt.textContent=""; return; }

  if(info.abierta){
    badge.textContent = "Abierta";
    badge.className   = "badge bg-success";
    txt.textContent   = `Cierra: ${new Date(info.fin).toLocaleString("es-CO")}`;
  } else {
    badge.textContent = "Cerrada";
    badge.className   = "badge bg-danger";
    txt.textContent   = info.inicio ? `Abrió: ${new Date(info.inicio).toLocaleString("es-CO")}` : "";
  }
}

async function cargar(){
  // si no hay sesión, 401 → volver al login
  const r1 = await fetch(`${API_ADMIN}/jornada`, { credentials: "include" });
  if(r1.status === 401){ location.replace("/admin/login.html"); return; }

  const jor = await r1.json().catch(()=> ({}));
  $("#inicio").value = toLocalInput(jor.inicio);
  $("#fin").value    = toLocalInput(jor.fin);

  // estado público
  const r2 = await fetch(API_ESTADO);
  const est = await r2.json().catch(()=> ({}));
  setEstadoBadge(est);

  // flash + countdown + habilitar recálculo
  setFlashOk(jor.inicio, jor.fin, est);
}

// Guardar jornada
$("#frmJornada")?.addEventListener("submit", async (e)=>{
  e.preventDefault();
  $("#msg").textContent = "";

  const inicio = $("#inicio").value;
  const fin    = $("#fin").value;

  try{
    const r = await fetch(`${API_ADMIN}/jornada`, {
      method:"PUT",
      headers:{ "Content-Type":"application/json" },
      credentials:"include",
      body: JSON.stringify({ inicio, fin })
    });
    const data = await r.json().catch(()=> ({}));
    if(!r.ok){ $("#msg").textContent = data.message || "Error al guardar"; return; }

    // refrescar UI y mostrar “flash”
    setFlashOk(data.inicio, data.fin);
    await cargar();
  }catch(err){
    $("#msg").textContent = "Error de conexión";
  }
});

// Cerrar ahora
$("#btnCerrarAhora")?.addEventListener("click", async ()=>{
  const r = await fetch(`${API_ADMIN}/jornada/cerrar_ahora`, {
    method:"POST", credentials:"include"
  });
  if(r.ok) await cargar();
});

// Recalcular (stub)
$("#btnRecalcular")?.addEventListener("click", async ()=>{
  const r = await fetch(`${API_ADMIN}/resultados/recalcular`, {
    method:"POST", credentials:"include"
  });
  const data = await r.json().catch(()=> ({}));
  $("#msgRes").textContent = data.message || "OK";
});

// Cerrar sesión (lo dejamos aunque ahora te concentras en jornada)
$("#btnLogout")?.addEventListener("click", async ()=>{
  try{
    const r = await fetch(`${API_ADMIN}/logout`, { method:"POST", credentials:"include" });
    const d = await r.json().catch(()=> ({}));
    if(r.ok && d.ok){
      try { sessionStorage.clear(); localStorage.clear(); } catch {}
      location.replace("/admin/login.html");
    }else{
      alert(d.message || "No se pudo cerrar sesión.");
    }
  }catch(e){
    alert("Error de conexión al cerrar sesión.");
  }
});

// boot
cargar();

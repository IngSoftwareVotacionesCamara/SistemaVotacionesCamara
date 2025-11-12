const API = "/api/admin";

document.getElementById("frmLogin")?.addEventListener("submit", async (e)=>{
  e.preventDefault();
  const user = document.getElementById("user").value.trim();
  const pass = document.getElementById("pass").value;
  const msg  = document.getElementById("msg");
  msg.textContent = "";

  try{
    const r = await fetch(`${API}/login`, {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      credentials: "include",
      body: JSON.stringify({ user, pass })
    });
    const data = await r.json().catch(()=> ({}));
    if(!r.ok || !data.ok){ msg.textContent = data.message || "Credenciales inválidas"; return; }
    window.location.assign("/admin/panel.html");
  }catch(err){
    console.error(err);
    msg.textContent = "Error de conexión";
  }
});

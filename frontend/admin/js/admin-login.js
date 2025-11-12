const API = "/api/admin";

(function () {
  const form = document.getElementById("frmLogin");
  if (!form) {
    console.error("No se encontró #frmLogin");
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const user = document.getElementById("user")?.value.trim();
    const pass = document.getElementById("pass")?.value;
    const msg  = document.getElementById("msg");
    if (msg) msg.textContent = "";

    try {
      const r = await fetch(`${API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ user, pass }),
      });

      const data = await r.json().catch(() => ({}));

      if (!r.ok || !data?.ok) {
        if (msg) msg.textContent = data?.message || "Credenciales inválidas";
        return;
      }

      window.location.assign("/admin/panel.html");
    } catch (err) {
      console.error(err);
      if (msg) msg.textContent = "Error de conexión";
    }
  });
})();

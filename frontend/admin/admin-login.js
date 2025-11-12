// frontend/js/admin-login.js

const API = "/api/admin";

(function () {
  const form = document.getElementById("frmLogin");
  if (!form) {
    console.error("No se encontró #frmLogin. Revisa el id del formulario.");
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const user = document.getElementById("user")?.value.trim() || "";
    const pass = document.getElementById("pass")?.value || "";
    const msg  = document.getElementById("msg");
    if (msg) msg.textContent = "";

    if (!user || !pass) {
      if (msg) msg.textContent = "Ingresa usuario y contraseña.";
      return;
    }

    try {
      const r = await fetch(`${API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // importante para enviar cookie de sesión
        body: JSON.stringify({ user, pass }),
      });

      let data = {};
      try { data = await r.json(); } catch {}

      if (!r.ok || !data.ok) {
        if (msg) msg.textContent = data?.message || "Usuario o contraseña inválidos";
        return;
      }

      // Éxito: redirigir al panel
      window.location.assign("/admin/panel.html");
    } catch (err) {
      console.error("Error de conexión:", err);
      if (msg) msg.textContent = "Error de conexión";
    }
  });
})();

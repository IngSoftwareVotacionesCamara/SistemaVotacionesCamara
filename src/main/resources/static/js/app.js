
// app.js — extensiones no intrusivas para carga CSV y UX básica

const $ = (sel, ctx=document) => ctx.querySelector(sel);
const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));

function toast(msg, type='success'){
  const el = document.createElement('div');
  el.className = `alert ${type}`;
  el.textContent = msg;
  const container = document.querySelector('.container') || document.body;
  container.prepend(el);
  setTimeout(()=> el.remove(), 3200);
}

// Confirmación genérica para botones de eliminar con clase .link.danger
$$('form .link.danger, form button.link.danger').forEach(btn=>{
  btn.addEventListener('click', e=>{
    if(!confirm('¿Eliminar este registro?')) e.preventDefault();
  });
});

// Dropzone CSV (opcional). Para usarlo, envuelve tu input file en .dropzone
$$('.dropzone').forEach(zone => {
  const fileInput = zone.querySelector('input[type=file]');
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('dragover'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
  zone.addEventListener('drop', e => {
    e.preventDefault(); zone.classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const f = e.dataTransfer.files[0];
      if (fileInput) fileInput.files = e.dataTransfer.files;
      previewCsv(f, zone);
    }
  });
  if (fileInput) {
    fileInput.addEventListener('change', e => {
      const f = e.target.files && e.target.files[0];
      if (f) previewCsv(f, zone);
    });
  }
});

function previewCsv(file, container){
  if(!file.name.toLowerCase().endsWith('.csv')){ toast('Selecciona un CSV válido','error'); return; }
  const reader = new FileReader();
  reader.onload = () => {
    const text = reader.result;
    const lines = text.split(/\r?\n/).filter(Boolean);
    const head = (lines[0]||'').split(';');
    const sample = lines.slice(1, 6).map(l => l.split(';'));
    let html = `<div class="panel csv-preview"><strong>Vista previa:</strong>
      <div style="overflow:auto"><table class="table"><thead><tr>${head.map(h=>`<th>${escapeHtml(h)}</th>`).join('')}</tr></thead><tbody>`;
    html += sample.map(row=>`<tr>${head.map((_,i)=>`<td>${escapeHtml(row[i]||'')}</td>`).join('')}</tr>`).join('');
    html += `</tbody></table></div></div>`;
    let prev = container.querySelector('.csv-preview');
    if(prev) prev.remove();
    container.insertAdjacentHTML('beforeend', html);
  };
  reader.readAsText(file, 'utf-8');
}

function escapeHtml(str){
  return String(str ?? '').replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
}

// Evitar doble submit básico
$$('form').forEach(f=>{
  f.addEventListener('submit', e=>{
    const btn = f.querySelector('button[type=submit], .btn-primary');
    if(btn && !btn.dataset.lock){
      btn.dataset.lock = '1';
      btn.disabled = true;
      setTimeout(()=>{ btn.disabled = false; btn.dataset.lock=''; }, 3000);
    }
  });
});

// Accesibilidad: Ctrl/Cmd+K foco en búsqueda si existe
document.addEventListener('keydown', e=>{
  if((e.ctrlKey || e.metaKey) && e.key.toLowerCase()==='k'){
    const q = document.querySelector('input[name="q"]');
    if(q){ q.focus(); q.select(); e.preventDefault(); }
  }
});

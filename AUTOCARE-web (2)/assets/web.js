// AUTOCARE · utilidades compartidas de la web y el portal
export const CFG = window.AUTOCARE || {};
export const LOGO = `<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M4.6 22.2v-3.4c0-1 .6-1.9 1.5-2.3l3.6-1.6 2.3-3c.5-.7 1.3-1.1 2.2-1.1h7.3c.9 0 1.8.4 2.3 1.2l2.1 2.9 3.9.9c1.2.3 2 1.4 2 2.6v3.8z"/><circle cx="10.2" cy="22.6" r="2.9"/><circle cx="22.4" cy="22.6" r="2.9"/><path d="M25.4 3.2l1 2.7 2.7 1-2.7 1-1 2.7-1-2.7-2.7-1 2.7-1z"/></svg>`;
export const WA_ICONO = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.4 14.1c-.2.6-1.3 1.2-1.8 1.3-.5 0-1 .2-3.3-.7a11.6 11.6 0 0 1-4.5-4c-.3-.5-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.3.5-.4.4c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.7-.1l.9-1.1c.2-.3.4-.2.7-.1l1.9.9c.3.1.5.2.5.4.1.1.1.7-.1 1.2Z"/></svg>`;
export async function api(a, d = {}) {
  if (!CFG.API) throw new Error("La web aún no está conectada a su servidor.");
  const r = await fetch(CFG.API, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ a, d }) });
  const j = await r.json();
  if (!j.ok) throw new Error(j.error || "No se pudo completar.");
  return j;
}
export const h = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
export function soles(n) { n = Number(n) || 0; return "S/ " + (Math.round(n) === n ? n.toLocaleString("es-PE") : n.toFixed(2)); }
export const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"], DC = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
export const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "setiembre", "octubre", "noviembre", "diciembre"];
const utc = iso => { const [y, m, d] = iso.split("-").map(Number); return new Date(Date.UTC(y, m - 1, d, 12)); };
export const diaSem = iso => utc(iso).getUTCDay();
export const fechaLarga = iso => { const d = utc(iso); return `${DIAS[d.getUTCDay()]} ${d.getUTCDate()} de ${MESES[d.getUTCMonth()]}`; };
export function duracion(m) { m = Math.round(m || 0); return m < 60 ? m + " min" : Math.floor(m / 60) + " h" + (m % 60 ? " " + (m % 60) + " min" : ""); }
export function wa(tel, txt) { let n = String(tel || "").replace(/\D/g, ""); if (n.length === 9) n = "51" + n; return "https://wa.me/" + n + (txt ? "?text=" + encodeURIComponent(txt) : ""); }
export function firma(canvas) {
  const r = devicePixelRatio || 1; canvas.width = canvas.clientWidth * r; canvas.height = canvas.clientHeight * r;
  const x = canvas.getContext("2d"); x.scale(r, r); x.lineWidth = 2.4; x.lineCap = "round"; x.strokeStyle = "#111";
  let dib = false, hay = false;
  const p = e => { const b = canvas.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top]; };
  canvas.onpointerdown = e => { e.preventDefault(); dib = true; canvas.setPointerCapture(e.pointerId); x.beginPath(); x.moveTo(...p(e)); };
  canvas.onpointermove = e => { if (dib) { x.lineTo(...p(e)); x.stroke(); hay = true; } };
  canvas.onpointerup = canvas.onpointercancel = () => (dib = false);
  return { datos: () => (hay ? canvas.toDataURL("image/png") : ""), limpiar: () => { x.clearRect(0, 0, canvas.width, canvas.height); hay = false; } };
}

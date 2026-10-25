// AUTOCARE · utilidades pequeñas que usa toda la app
// Fechas: siempre en hora de Perú (UTC−5, sin horario de verano).

const DESFASE = -300; // minutos respecto a UTC (Lima)
export const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
export const DIAS_CORTOS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
export const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "setiembre", "octubre", "noviembre", "diciembre"];
export const MESES_CORTOS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "set", "oct", "nov", "dic"];

// ---------------------------------------------------------------- fechas
export const ahora = () => Date.now();
export function isoDe(ms) { return new Date(Number(ms) + DESFASE * 60000).toISOString().slice(0, 10); }
export function horaDe(ms) { return new Date(Number(ms) + DESFASE * 60000).toISOString().slice(11, 16); }
export const hoy = () => isoDe(Date.now());
export function msDe(iso, hhmm) {
  const [y, m, d] = String(iso).split("-").map(Number);
  const [h, mi] = String(hhmm || "00:00").split(":").map(Number);
  return Date.UTC(y, m - 1, d, h || 0, mi || 0) - DESFASE * 60000;
}
function utc(iso) { const [y, m, d] = String(iso).split("-").map(Number); return new Date(Date.UTC(y, m - 1, d, 12)); }
export function sumarDias(iso, n) { const d = utc(iso); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
export function sumarMeses(iso, n) {
  const d = utc(iso), dia = d.getUTCDate();
  d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() + n);
  const ultimo = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0, 12)).getUTCDate();
  d.setUTCDate(Math.min(dia, ultimo));
  return d.toISOString().slice(0, 10);
}
export const diaSemana = iso => utc(iso).getUTCDay();
export function inicioSemana(iso) { const d = diaSemana(iso); return sumarDias(iso, d === 0 ? -6 : 1 - d); }
export const mesDe = iso => String(iso || "").slice(0, 7);
export const inicioMes = iso => mesDe(iso) + "-01";
export function finMes(iso) { return sumarDias(sumarMeses(inicioMes(iso), 1), -1); }
export function diasEntre(a, b) { return Math.round((utc(b) - utc(a)) / 86400000); }
export function semanaISO(iso) {
  const d = utc(iso), dia = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dia + 3);
  const y = d.getUTCFullYear(), primero = new Date(Date.UTC(y, 0, 4, 12));
  const n = 1 + Math.round(((d - primero) / 86400000 - 3 + ((primero.getUTCDay() + 6) % 7)) / 7);
  return y + "-S" + String(n).padStart(2, "0");
}
export function trimestre(iso) { const m = Number(String(iso).slice(5, 7)); return String(iso).slice(0, 4) + "-T" + Math.ceil(m / 3); }
export function rangoTrimestre(t) {
  const [y, q] = t.split("-T").map(Number), ini = `${y}-${String((q - 1) * 3 + 1).padStart(2, "0")}-01`;
  return [ini, finMes(sumarMeses(ini, 2))];
}
export function minutos(hhmm) { if (!hhmm) return null; const p = String(hhmm).split(":"); return p.length < 2 ? null : Number(p[0]) * 60 + Number(p[1] || 0); }
export function hhmm(m) { m = Math.max(0, Math.round(m)); return String(Math.floor(m / 60) % 24).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0"); }
export function duracion(min) {
  min = Math.round(Number(min) || 0);
  if (min < 60) return min + " min";
  const h = Math.floor(min / 60), r = min % 60;
  return h + " h" + (r ? " " + r + " min" : "");
}

// "mar 21 oct", "martes 21 de octubre", "hoy"
export function fechaCorta(iso, conAnio) {
  if (!iso) return "";
  const [y, m, d] = String(iso).split("-").map(Number);
  return `${DIAS_CORTOS[diaSemana(iso)]} ${d} ${MESES_CORTOS[m - 1]}` + (conAnio || y !== Number(hoy().slice(0, 4)) ? " " + y : "");
}
export function fechaSimple(iso) {
  if (!iso) return "";
  const [y, m, d] = String(iso).split("-").map(Number);
  return `${d} ${MESES_CORTOS[m - 1]}` + (y !== Number(hoy().slice(0, 4)) ? " " + y : "");
}
export function fechaLarga(iso) {
  if (!iso) return "";
  const [, m, d] = String(iso).split("-").map(Number);
  return `${DIAS[diaSemana(iso)]} ${d} de ${MESES[m - 1]}`;
}
export function mesLargo(mes) { const [y, m] = String(mes).split("-").map(Number); return `${MESES[m - 1]} ${y}`; }
export function relativa(iso) {
  if (!iso) return "";
  const n = diasEntre(hoy(), iso);
  if (n === 0) return "hoy";
  if (n === 1) return "mañana";
  if (n === -1) return "ayer";
  if (n > 1 && n < 7) return DIAS[diaSemana(iso)];
  if (n < 0 && n > -31) return `hace ${-n} días`;
  if (n > 0 && n < 31) return `en ${n} días`;
  return fechaSimple(iso);
}
export function hace(ms) {
  if (!ms) return "";
  const s = Math.round((Date.now() - Number(ms)) / 1000);
  if (s < 50) return "ahora";
  if (s < 3600) return `hace ${Math.round(s / 60)} min`;
  if (s < 86400) return `hace ${Math.round(s / 3600)} h`;
  const d = Math.round(s / 86400);
  return d === 1 ? "ayer" : d < 31 ? `hace ${d} días` : fechaSimple(isoDe(ms));
}
export function fechaHora(ms) { return ms ? fechaSimple(isoDe(ms)) + ", " + horaDe(ms) : ""; }

// ---------------------------------------------------------------- números
const NF = {};
function nf(dec) { return NF[dec] || (NF[dec] = new Intl.NumberFormat("es-PE", { minimumFractionDigits: dec, maximumFractionDigits: dec })); }
export function num(n, dec = 0) { return nf(dec).format(Number(n) || 0); }
export function soles(n, dec) {
  n = Number(n) || 0;
  if (dec === undefined) dec = Math.round(n) === n || Math.abs(n) >= 1000 ? 0 : 2;
  return (n < 0 ? "−S/ " : "S/ ") + nf(dec).format(Math.abs(n));
}
export function pct(x, dec = 0) { return x === null || x === undefined || !isFinite(x) ? "—" : num(x * 100, dec) + "%"; }
export const redondear = (n, a = 1) => Math.round((Number(n) || 0) / a) * a;
export const n0 = v => Number(v) || 0;

// ---------------------------------------------------------------- texto
export function norm(s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim(); }
export function coincide(texto, q) {
  const t = norm(texto), p = norm(q).split(" ").filter(Boolean);
  return p.every(x => t.includes(x));
}
export function telNorm(t) {
  let d = String(t || "").replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("51")) d = d.slice(2);
  return d;
}
export function telBonito(t) { const d = telNorm(t); return d.length === 9 ? d.replace(/(\d{3})(\d{3})(\d{3})/, "$1 $2 $3") : String(t || ""); }
export function wa(tel, texto) {
  let n = telNorm(tel); if (n.length === 9) n = "51" + n;
  return "https://wa.me/" + n + (texto ? "?text=" + encodeURIComponent(texto) : "");
}
export function mapa(direccion, distrito) { return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent([direccion, distrito || "Arequipa"].filter(Boolean).join(", ")); }
export function nombreDe(c) { return c ? [c.nombre, c.apellido].filter(Boolean).join(" ") : ""; }
export function primerNombre(c) { return String((c && c.nombre) || "").split(" ")[0]; }
export function iniciales(s) { return String(s || "").split(" ").filter(Boolean).slice(0, 2).map(x => x[0]).join("").toUpperCase() || "?"; }
export function capital(s) { s = String(s || ""); return s.charAt(0).toUpperCase() + s.slice(1); }
export function plural(n, uno, varios) { return `${num(n)} ${Number(n) === 1 ? uno : (varios || uno + "s")}`; }
export function rellenar(texto, v) { return String(texto || "").replace(/\{(\w+)\}/g, (m, k) => (v[k] !== undefined && v[k] !== null ? v[k] : m)); }
export function recorta(s, n) { s = String(s || ""); return s.length > n ? s.slice(0, n - 1) + "…" : s; }

// ---------------------------------------------------------------- listas
export function suma(l, f) { return (l || []).reduce((a, x) => a + (Number(typeof f === "function" ? f(x) : x[f]) || 0), 0); }
export function agrupar(l, f) { const o = {}; (l || []).forEach(x => { const k = f(x); (o[k] = o[k] || []).push(x); }); return o; }
export function porId(l) { const o = {}; (l || []).forEach(x => { if (x && x.id) o[x.id] = x; }); return o; }
export function ordenar(l, f, desc) {
  const c = (l || []).slice();
  c.sort((a, b) => { const x = f(a), y = f(b); return (x < y ? -1 : x > y ? 1 : 0) * (desc ? -1 : 1); });
  return c;
}
export function mediana(a) {
  const l = (a || []).filter(x => isFinite(x)).sort((x, y) => x - y);
  if (!l.length) return null;
  const m = Math.floor(l.length / 2);
  return l.length % 2 ? l[m] : (l[m - 1] + l[m]) / 2;
}
export const promedio = a => { const l = (a || []).filter(x => isFinite(x)); return l.length ? l.reduce((s, x) => s + x, 0) / l.length : null; };
export const unicos = l => Array.from(new Set(l));

// ---------------------------------------------------------------- identificadores
export function nuevoId() {
  const b = new Uint8Array(6); crypto.getRandomValues(b);
  return Array.from(b, x => x.toString(16).padStart(2, "0")).join("");
}
export function llave(n) {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789", b = new Uint8Array(n);
  crypto.getRandomValues(b);
  return Array.from(b, x => abc[x % abc.length]).join("");
}

// ---------------------------------------------------------------- navegador
export function clases(...a) { return a.filter(Boolean).join(" "); }
export function retrasar(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }
export async function copiar(texto) {
  try { await navigator.clipboard.writeText(texto); return true; }
  catch (e) {
    const t = document.createElement("textarea"); t.value = texto; t.style.position = "fixed"; t.style.opacity = "0";
    document.body.appendChild(t); t.select();
    let ok = false; try { ok = document.execCommand("copy"); } catch (e2) { }
    t.remove(); return ok;
  }
}
export function descargar(nombre, contenido, tipo = "application/json") {
  const blob = contenido instanceof Blob ? contenido : new Blob([contenido], { type: tipo });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = nombre;
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}
export function abrir(url) { window.open(url, "_blank", "noopener"); }
export const esMovil = () => window.matchMedia("(max-width: 759px)").matches;
export const esIOS = () => /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
export const instalada = () => window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;

// Reduce y comprime una foto antes de subirla (ahorra datos y espacio en Drive)
export async function comprimir(archivo, lado = 1600, calidad = 0.82) {
  let img;
  try { img = await createImageBitmap(archivo, { imageOrientation: "from-image" }); }
  catch (e) {
    img = await new Promise((ok, mal) => { const i = new Image(); i.onload = () => ok(i); i.onerror = mal; i.src = URL.createObjectURL(archivo); });
  }
  const w = img.width, h = img.height, k = Math.min(1, lado / Math.max(w, h));
  const c = document.createElement("canvas"); c.width = Math.round(w * k); c.height = Math.round(h * k);
  c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", calidad);
}
export function dataABlob(dataUrl) {
  const [cab, b64] = dataUrl.split(","), tipo = cab.match(/data:(.*?);/)[1], bin = atob(b64), arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: tipo });
}

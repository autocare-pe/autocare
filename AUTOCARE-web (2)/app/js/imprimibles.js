// AUTOCARE · Piezas para imprimir con QR: tarjeta del cliente, sticker para su auto y carteles del negocio.
// Se dibujan a 600 ppp y se guardan como imagen PNG para mandarla a una imprenta (o imprimirla tú).
// Buenas prácticas de QR: alto contraste, margen blanco alrededor, una llamada a la acción al lado
// («Escanea y…») y nunca más chico de 2 cm.
import { qrCanvas } from "../../assets/qr.js";

const LIMA = "#D0FF14", GRIS = "#A6A6A0";
const RUTA = n => new URL("../../assets/" + n, import.meta.url).href;
const LOGO_PROP = 763 / 189; // proporción exacta del logo horizontal

function cargarImg(src) {
  return new Promise((ok, mal) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => mal(new Error("No pude cargar el logo.")); i.src = src; });
}
async function lienzo(w, h) {
  const k = 2, cv = document.createElement("canvas");
  cv.width = w * k; cv.height = h * k;
  const ctx = cv.getContext("2d"); ctx.scale(k, k);
  try { await Promise.all(["800", "700", "500"].map(p => document.fonts.load(p + " 40px Archivo"))); } catch (e) { }
  return { cv, ctx, w, h };
}
function fuente(ctx, tam, peso, ancho) {
  ctx.font = `${peso} ${tam}px Archivo, system-ui, sans-serif`;
  if ("fontStretch" in ctx) ctx.fontStretch = ancho ? "expanded" : "normal";
}
function cortar(ctx, t, max) {
  if (!max || ctx.measureText(t).width <= max) return t;
  while (t.length > 1 && ctx.measureText(t + "…").width > max) t = t.slice(0, -1);
  return t.trim() + "…";
}
function escribir(ctx, txt, x, y, { tam = 28, peso = 700, color = "#fff", alinear = "left", ancho = false, max = 0, esp = 0 } = {}) {
  fuente(ctx, tam, peso, ancho);
  ctx.fillStyle = color; ctx.textAlign = alinear; ctx.textBaseline = "alphabetic";
  if ("letterSpacing" in ctx) ctx.letterSpacing = esp + "px";
  ctx.fillText(cortar(ctx, String(txt || ""), max), x, y);
  if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";
}
function lineas(ctx, txt, max, tam, peso, ancho) {
  fuente(ctx, tam, peso, ancho);
  const out = []; let l = "";
  String(txt || "").split(/\s+/).forEach(p => { const t = l ? l + " " + p : p; if (ctx.measureText(t).width > max && l) { out.push(l); l = p; } else l = t; });
  if (l) out.push(l);
  return out;
}
function rect(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function fondo(ctx, w, h) {
  ctx.fillStyle = "#000"; ctx.fillRect(0, 0, w, h);
  const g = ctx.createRadialGradient(w, 0, 0, w, 0, Math.max(w, h) * 0.95);
  g.addColorStop(0, "rgba(208,255,20,.30)"); g.addColorStop(0.45, "rgba(208,255,20,.07)"); g.addColorStop(1, "rgba(208,255,20,0)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
}
function panelQr(ctx, url, x, y, lado, r) {
  ctx.fillStyle = "#fff"; rect(ctx, x, y, lado, lado, r); ctx.fill();
  const m = Math.round(lado * 0.07);
  qrCanvas(ctx, url, x + m, y + m, lado - m * 2);
}
// símbolo «sin contacto» (ondas), el que la gente ya reconoce de las tarjetas de pago
function ondas(ctx, x, y, s, color) {
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = s * 0.1; ctx.lineCap = "round";
  [0.22, 0.45, 0.68].forEach(r => { ctx.beginPath(); ctx.arc(x, y + s / 2, s * r, -Math.PI / 3.2, Math.PI / 3.2); ctx.stroke(); });
  ctx.restore();
}
async function logo(ctx, x, y, alto, centrado) {
  const img = await cargarImg(RUTA("logo-horizontal-claro.svg")), w = alto * LOGO_PROP;
  ctx.drawImage(img, centrado ? x - w / 2 : x, y, w, alto);
}
async function terminar(cv, nombre, nota) {
  const blob = await new Promise(r => cv.toBlob(r, "image/png"));
  return { src: URL.createObjectURL(blob), archivo: new File([blob], nombre + ".png", { type: "image/png" }), nombre, nota };
}
const telBonito = t => { const d = String(t || "").replace(/\D/g, "").slice(-9); return d.length === 9 ? d.replace(/(\d{3})(\d{3})(\d{3})/, "$1 $2 $3") : t || ""; };
const dominio = u => String(u || "").replace(/^https?:\/\//, "").replace(/\/+$/, "");

/** Tarjeta del cliente, tamaño tarjeta de crédito (8.6 × 5.4 cm). Sirve en cartulina o en PVC con chip NFC. */
export async function tarjetaCliente({ nombre, url, tel }) {
  const { cv, ctx, w, h } = await lienzo(1011, 638);
  fondo(ctx, w, h);
  await logo(ctx, 56, 52, 62);
  ondas(ctx, w - 92, 50, 62, LIMA);
  escribir(ctx, "TARJETA DE CLIENTE", 56, 226, { tam: 21, peso: 800, color: LIMA, esp: 3 });
  escribir(ctx, nombre, 56, 286, { tam: 50, peso: 800, ancho: true, max: 530 });
  escribir(ctx, "Tus sellos, las fotos de tu auto", 56, 338, { tam: 25, peso: 500, color: GRIS });
  escribir(ctx, "y tu próxima hora en un toque.", 56, 372, { tam: 25, peso: 500, color: GRIS });
  escribir(ctx, "Escanea o acerca tu celular", 56, 540, { tam: 28, peso: 700 });
  if (tel) escribir(ctx, "WhatsApp " + telBonito(tel), 56, 582, { tam: 23, peso: 500, color: GRIS });
  panelQr(ctx, url, w - 56 - 326, 196, 326, 22);
  return terminar(cv, "tarjeta-" + String(nombre).toLowerCase().replace(/[^a-z0-9]+/gi, "-"),
    "Pídela en una imprenta en tamaño tarjeta de crédito (8.6 × 5.4 cm). Si la haces en PVC con chip NFC (NTAG213 o NTAG215), grábale el mismo enlace y sirve también acercándola al celular.");
}

/** Sticker para su auto (5 × 5 cm): como el del cambio de aceite, le recuerda cuándo le toca y dónde separar. */
export async function stickerAuto({ fecha, url }) {
  const { cv, ctx, w, h } = await lienzo(591, 591);
  ctx.fillStyle = "#000"; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = LIMA; ctx.lineWidth = 6; rect(ctx, 16, 16, w - 32, h - 32, 42); ctx.stroke();
  await logo(ctx, w / 2, 46, 48, true);
  escribir(ctx, "TU PRÓXIMO LAVADO", w / 2, 142, { tam: 25, peso: 800, color: LIMA, alinear: "center", esp: 2 });
  escribir(ctx, fecha || "____ / ____", w / 2, 198, { tam: 44, peso: 800, ancho: true, alinear: "center", max: 500 });
  panelQr(ctx, url, (w - 262) / 2, 226, 262, 20);
  escribir(ctx, "Escanea y separa tu hora", w / 2, 540, { tam: 27, peso: 700, alinear: "center" });
  return terminar(cv, "sticker-auto", "Imprímelo en vinil adhesivo de 5 × 5 cm. Pégalo dentro del parabrisas (esquina del copiloto) o en el marco de la puerta: lo ve cada vez que sube a su auto.");
}

/** Cartel con QR (1080 × 1350): para la ventana de tu auto, volantes o pedir reseñas. También sirve como post.
 *  Dan Kennedy (No B.S. Direct Marketing): una oferta clara, con fecha límite y una forma de medir la respuesta. */
export async function cartel({ titulo, sub, cta, url, tel, web, nota, nombre = "cartel", oferta = "", vence = "" }) {
  const { cv, ctx, w, h } = await lienzo(1080, 1350);
  fondo(ctx, w, h);
  await logo(ctx, w / 2, 78, 86, true);
  let y = 300;
  lineas(ctx, titulo, 940, 72, 800, true).slice(0, 2).forEach(l => { escribir(ctx, l, w / 2, y, { tam: 72, peso: 800, ancho: true, alinear: "center" }); y += 82; });
  y += 4;
  lineas(ctx, sub, 900, 34, 500, false).slice(0, 2).forEach(l => { escribir(ctx, l, w / 2, y, { tam: 34, peso: 500, color: GRIS, alinear: "center" }); y += 46; });
  if (oferta) {
    const txt = oferta + (vence ? "  ·  hasta el " + vence : "");
    fuente(ctx, 32, 800, false); const ancho = Math.min(980, ctx.measureText(txt).width + 64);
    ctx.fillStyle = LIMA; rect(ctx, (w - ancho) / 2, y + 2, ancho, 62, 31); ctx.fill();
    escribir(ctx, txt, w / 2, y + 44, { tam: 32, peso: 800, color: "#000", alinear: "center", max: ancho - 40 });
    y += 84;
  }
  const lado = oferta ? 480 : 540, qy = Math.max(y + 24, oferta ? 640 : 590);
  panelQr(ctx, url, (w - lado) / 2, qy, lado, 34);
  escribir(ctx, cta, w / 2, qy + lado + 78, { tam: 42, peso: 800, color: LIMA, alinear: "center", max: 980 });
  const pie = [tel && "WhatsApp " + telBonito(tel), dominio(web)].filter(Boolean).join("   ·   ");
  escribir(ctx, pie, w / 2, h - 50, { tam: 28, peso: 500, color: GRIS, alinear: "center", max: 1000 });
  return terminar(cv, nombre, nota);
}

/** Guarda la imagen: en el iPhone abre «Compartir» (Guardar imagen, WhatsApp a la imprenta, AirDrop…) */
export async function guardar(p) {
  if (navigator.canShare && navigator.canShare({ files: [p.archivo] })) {
    try { await navigator.share({ files: [p.archivo], title: p.nombre }); return; } catch (e) { if (e && e.name === "AbortError") return; }
  }
  const a = document.createElement("a"); a.href = p.src; a.download = p.archivo.name;
  document.body.appendChild(a); a.click(); a.remove();
}

// AUTOCARE · Merchandising: tu polo, gorra, stickers y todo lo que lleva tu marca.
// Cada pieza puede llevar un QR con una frase gancho y la app cuenta cuántas personas escanean cada una.
// Por qué un gancho: la curiosidad aparece cuando sentimos que nos falta un dato (Loewenstein, 1994) y lo prohibido
// tienta más (Brehm, reactancia). La página que abre el QR cierra esa curiosidad con la misma gracia y lleva a precios
// y fotos (Heath, Made to Stick: lo inesperado capta la atención; lo concreto la mantiene).
import { html, useState, useEffect, useRef } from "../../vendor/preact-htm.js";
import * as D from "../datos.js";
import * as N from "../negocio.js";
import { api } from "../api.js";
import { usarTitulo } from "../app.js";
import { Boton, Hoja, Entrada, Numero, Dinero, Area, Selector, Interruptor, Insignia, Vacio, Bloque, Resumen, AvisoLinea, MasDatos, Icono, aviso, confirmar, useFicha, b } from "../ui.js";
import { CampoFotos } from "../piezas.js";
import { soles, n0, copiar, hoy, sumarDias } from "../util.js";
import { TIPOS_MERCH, ESTADOS_MERCH, GANCHOS } from "../esquema.js";
import { qrMatriz } from "../../../assets/qr.js";

const COLOR_ESTADO = { idea: "", diseno: "violeta", cotizando: "ambar", produccion: "azul", uso: "verde", agotado: "rojo" };
const lista = () => (D.ajuste("merch", []) || []).filter(Boolean);
const guardarLista = l => D.fijarAjuste("merch", l);
export const urlQr = m => N.webBase() + "/enlaces.html?src=" + encodeURIComponent(m.src || "");
/** Cómo aparece cada pieza en «De dónde vienen» (lo mismo que guarda el servidor) */
export const fuenteDe = m => ({ polo: "QR del polo", gorra: "QR de la gorra" })[m.src] || ("QR: " + String(m.nombre || "Pieza").trim().slice(0, 40)).trim().slice(0, 30);

export default function Merch({ ruta }) {
  D.useDatos();
  usarTitulo("Merchandising");
  const l = lista(), [ed, setEd] = useState(null), [vis, setVis] = useState(null);
  useEffect(() => { api("visitas", { desde: sumarDias(hoy(), -120) }).then(r => setVis(r.visitas || [])).catch(() => setVis([])); }, []);
  const escaneos = (m, dias = 30) => !vis ? null : vis.filter(v => v.fuente === fuenteDe(m) && v.fecha >= sumarDias(hoy(), -dias)).reduce((a, v) => a + n0(v.n), 0);
  const total30 = vis ? l.filter(m => m.qr).reduce((a, m) => a + (escaneos(m) || 0), 0) : null;
  const inversion = l.reduce((a, m) => a + n0(m.costo) * n0(m.cantidad), 0);
  const empezar = () => {
    const g = GANCHOS[0], base = { qr: true, frase: g.frase, sub: g.sub, respTitulo: g.titulo, respTexto: g.texto, estado: "diseno" };
    guardarLista([...l,
      Object.assign({ id: nuevoId(), nombre: "Polo negro", tipo: "polo", src: "polo", tecnica: "Logo bordado en el pecho; QR impreso en DTF en la espalda (7 × 7 cm)", tallas: "S, M, L, XL" }, base),
      Object.assign({ id: nuevoId(), nombre: "Gorra negra", tipo: "gorra", src: "gorra", tecnica: "Isotipo bordado en relieve al frente; @autocare.pe atrás", qr: false, estado: "diseno" })]);
    aviso("Listo: tu polo y tu gorra. Sube sus fotos y ajusta lo que quieras.");
  };
  return html`<header class="pagina-cab"><div><h1>Merchandising</h1><p>Tu polo, gorra, stickers y todo lo que lleva tu marca. Cada pieza con QR te dice cuántas personas trae.</p></div>
      <div class="acciones"><${Boton} tipo="primario" icono="plus" onClick=${() => setEd({})}>Nueva pieza<//></div></header>
    ${l.length > 0 && html`<${Resumen} items=${[{ n: "Piezas", v: l.length }, { n: "En uso", v: l.filter(m => m.estado === "uso").length }, { n: "Escaneos (30 días)", v: total30 === null ? "…" : total30 }, { n: "Inversión", v: soles(inversion) }]} />`}
    ${!l.length ? html`<${Vacio} icono="shirt" titulo="Aún no registras tu merchandising" texto="Empieza con tu polo y tu gorra: ya traen la frase gancho y su QR. Después sube las fotos del diseño y del producto real.">
        <${Boton} tipo="primario" icono="sparkles" onClick=${empezar}>Agregar mi polo y mi gorra<//><${Boton} onClick=${() => setEd({})}>Otra pieza<//><//>`
      : html`<div class="merch-grilla" style="margin-top:20px">${l.map(m => { const e = m.qr ? escaneos(m) : null; return html`<button class="merch-tarjeta" onClick=${() => setEd(m)}>
          <div class="merch-foto">${(m.fotos || [])[0] ? html`<img src=${D.srcFoto(m.fotos[0], 500)} alt="" loading="lazy" />` : m.qr ? html`<${ArteQR} m=${m} chico />` : html`<${Icono} n="shirt" />`}</div>
          <div class="merch-cuerpo"><b>${m.nombre || "Pieza"}</b><span class="tenue chico">${TIPOS_MERCH[m.tipo] || "Pieza"}${n0(m.cantidad) ? " · " + m.cantidad + " u." : ""}${n0(m.costo) ? " · " + soles(m.costo) + " c/u" : ""}</span>
            <span class="merch-pie"><${Insignia} c=${COLOR_ESTADO[m.estado] || ""}>${ESTADOS_MERCH[m.estado] || "Idea"}<//>${m.qr ? html`<span class="chico"><${Icono} n="scan-qr-code" t=${14} /> ${e === null ? "…" : e + (e === 1 ? " escaneo" : " escaneos")}</span>` : null}</span></div></button>`; })}</div>`}
    <p class="nota" style="margin-top:18px">Los escaneos de cada QR también aparecen en Resultados → De dónde vienen.</p>
    ${ed && html`<${FormMerch} m=${ed} cerrar=${() => setEd(null)} escaneos=${ed.id ? escaneos(ed) : null} />`}`;
}
const nuevoId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

function FormMerch({ m, cerrar, escaneos }) {
  const [f, set] = useFicha(Object.assign({ nombre: "", tipo: "polo", estado: "idea", fotos: [], proveedor: "", costo: null, cantidad: null, tecnica: "", tallas: "", notas: "", enlace: "",
    qr: false, frase: "", sub: "", respTitulo: "", respTexto: "" }, m));
  const nuevo = !m.id;
  const conSrc = r => {
    if (!r.qr || r.src) return r;
    const usados = new Set(lista().filter(x => x.id !== r.id).map(x => x.src));
    return Object.assign(r, { src: ["polo", "gorra"].includes(r.tipo) && !usados.has(r.tipo) ? r.tipo : "m-" + Math.random().toString(36).slice(2, 8) });
  };
  const guardar = () => {
    if (!String(f.nombre).trim()) return aviso("Ponle un nombre (ej.: Polo negro).", { error: true });
    if (f.qr && !String(f.frase).trim()) return aviso("Escribe la frase gancho o elige una.", { error: true });
    const r = conSrc(Object.assign({}, f, { id: f.id || nuevoId() }));
    const l = lista(); guardarLista(l.some(x => x.id === r.id) ? l.map(x => (x.id === r.id ? r : x)) : [...l, r]);
    aviso("Guardado."); cerrar();
  };
  const borrar = async () => { if (await confirmar({ titulo: "Eliminar pieza", texto: "Sus escaneos pasados siguen en Resultados.", si: "Eliminar", peligro: true })) { guardarLista(lista().filter(x => x.id !== m.id)); cerrar(); } };
  const gancho = g => set({ frase: g.frase, sub: g.sub, respTitulo: g.titulo, respTexto: g.texto });
  const vista = conSrc(Object.assign({}, f, { id: f.id || "nuevo" }));
  return html`<${Hoja} titulo=${nuevo ? "Nueva pieza" : f.nombre || "Pieza"} cerrar=${cerrar} pie=${html`${!nuevo && html`<${Boton} tipo="fantasma peligro" icono="trash-2" titulo="Eliminar" onClick=${borrar} />`}<${Boton} tipo="fantasma" onClick=${cerrar}>Cancelar<//><${Boton} tipo="primario" onClick=${guardar}>Guardar<//>`}>
    <div class="form">
      <${Entrada} etiqueta="Nombre" ...${b(f, set, "nombre")} placeholder="Polo negro" />
      <div class="rejilla"><${Selector} etiqueta="Tipo" opciones=${Object.keys(TIPOS_MERCH).map(k => ({ v: k, n: TIPOS_MERCH[k] }))} ...${b(f, set, "tipo")} />
        <${Selector} etiqueta="Estado" opciones=${Object.keys(ESTADOS_MERCH).map(k => ({ v: k, n: ESTADOS_MERCH[k] }))} ...${b(f, set, "estado")} /></div>
      <${CampoFotos} etiqueta="Fotos (diseño, prueba del taller, foto real)" valor=${f.fotos || []} cambiar=${v => set("fotos", v)} tipo="marketing" nombre=${"merch " + f.nombre} max=${8} />
      <div class="titulo-seccion"><h3>QR con gancho</h3><p>Una frase que despierte curiosidad y un QR que la responda. Imprime el QR en DTF o vinil (no bordado), de 5 × 5 cm o más.</p></div>
      <${Interruptor} etiqueta="Esta pieza lleva QR" ...${b(f, set, "qr")} />
      ${f.qr && html`
        <div class="chips">${GANCHOS.map(g => html`<button type="button" class=${"chip" + (f.frase === g.frase ? " activo" : "")} onClick=${() => gancho(g)}>${g.frase}</button>`)}</div>
        <div class="rejilla"><${Entrada} etiqueta="Frase gancho (grande)" ...${b(f, set, "frase")} placeholder="NO ESCANEES ESTO" /><${Entrada} etiqueta="Debajo (pequeño)" ...${b(f, set, "sub")} placeholder="si te gusta tu auto sucio" /></div>
        <div class="merch-arte"><${ArteQR} m=${vista} /></div>
        <div class="btns"><${Boton} icono="download" onClick=${() => descargarArte(vista)}>Descargar arte para imprimir<//><${Boton} tipo="fantasma" icono="copy" onClick=${() => { copiar(urlQr(vista)); aviso("Enlace copiado."); }}>Copiar enlace<//></div>
        ${escaneos !== null && escaneos !== undefined && html`<${AvisoLinea} icono="scan-qr-code">${escaneos} ${escaneos === 1 ? "persona escaneó" : "personas escanearon"} este QR en los últimos 30 días.<//>`}
        <${MasDatos} titulo="Lo que responde tu página al escanear" abierto=${!!(f.respTitulo && f.respTitulo !== (GANCHOS.find(g => g.frase === f.frase) || {}).titulo)}>
          <${Entrada} etiqueta="Título" ...${b(f, set, "respTitulo")} placeholder="Sabíamos que no ibas a resistir." />
          <${Area} etiqueta="Texto" ...${b(f, set, "respTexto")} ayuda="Cierra la curiosidad con la misma gracia y lleva a lo concreto: precios, fotos, reservar." />
        <//>
        <p class="nota">Antes de mandar a producir: imprime una prueba y escanéala con 3 celulares distintos, de cerca y a un metro.</p>`}
      <${MasDatos} titulo="Producción y costos" abierto=${!!(f.proveedor || n0(f.costo))}>
        <div class="rejilla"><${Entrada} etiqueta="Taller o proveedor" ...${b(f, set, "proveedor")} /><${Entrada} etiqueta="Técnica" ...${b(f, set, "tecnica")} placeholder="Bordado, DTF, vinil, serigrafía…" /></div>
        <div class="rejilla" style="--col:3"><${Dinero} etiqueta="Costo por unidad" ...${b(f, set, "costo")} /><${Numero} etiqueta="Cantidad" decimales=${0} ...${b(f, set, "cantidad")} /><${Entrada} etiqueta="Tallas" ...${b(f, set, "tallas")} placeholder="S, M, L" /></div>
        <${Entrada} etiqueta="Enlace del diseño (opcional)" ...${b(f, set, "enlace")} placeholder="https://…" />
        <${Area} etiqueta="Notas" ...${b(f, set, "notas")} placeholder="Color de hilo, fecha de entrega, lo que acordaste…" />
      <//>
    </div><//>`;
}

// ---------------------------------------------------------------- arte del QR (negro, como el uniforme)
const LIMA = "#D0FF14";
let MARCA = null;
const marca = () => MARCA || (MARCA = new Promise(ok => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = "../assets/marca-chica-clara.svg"; }));
function lineas(ctx, texto, ancho) {
  const palabras = String(texto || "").split(/\s+/).filter(Boolean), out = [];
  let l = "";
  palabras.forEach(p => { const t = l ? l + " " + p : p; if (ctx.measureText(t).width > ancho && l) { out.push(l); l = p; } else l = t; });
  if (l) out.push(l);
  return out;
}
/** Dibuja el arte: frase gancho, parche lima con el QR (nivel H, isotipo al centro) y tu Instagram. 4:5. */
export async function dibujarArte(cv, m, ancho = 1200) {
  const W = ancho, H = Math.round(ancho * 1.25), k = W / 1000, ctx = cv.getContext("2d");
  cv.width = W; cv.height = H;
  try { await document.fonts.load("800 80px Archivo"); } catch (e) { }
  ctx.fillStyle = "#0E0E0E"; ctx.fillRect(0, 0, W, H);
  ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
  // frase
  let fs = 96 * k; ctx.font = `800 ${fs}px Archivo, system-ui, sans-serif`;
  let ls = lineas(ctx, String(m.frase || "ESCANÉAME").toUpperCase(), 860 * k);
  while (ls.length > 3 && fs > 50 * k) { fs -= 6 * k; ctx.font = `800 ${fs}px Archivo, system-ui, sans-serif`; ls = lineas(ctx, String(m.frase || "").toUpperCase(), 860 * k); }
  let y = 90 * k + fs;
  ctx.fillStyle = "#FFFFFF"; ls.forEach(t => { ctx.fillText(t, W / 2, y); y += fs * 1.02; });
  if (m.sub) { ctx.font = `600 ${40 * k}px Archivo, system-ui, sans-serif`; ctx.fillStyle = LIMA; lineas(ctx, "(" + String(m.sub).replace(/^\(|\)$/g, "") + ")", 820 * k).forEach(t => { y += 6 * k; ctx.fillText(t, W / 2, y + 22 * k); y += 46 * k; }); }
  // parche QR
  const lado = 560 * k, x0 = (W - lado) / 2, y0 = Math.max(y + 50 * k, H - lado - 190 * k);
  ctx.fillStyle = LIMA; redondo(ctx, x0, y0, lado, lado, 44 * k); ctx.fill();
  const q = qrMatriz(urlQr(m), "H"), zona = 4, mod = lado / (q.n + zona * 2);
  ctx.fillStyle = "#000";
  for (let r = 0; r < q.n; r++) for (let c = 0; c < q.n; c++) if (q.oscuro(r, c)) ctx.fillRect(Math.floor(x0 + (c + zona) * mod), Math.floor(y0 + (r + zona) * mod), Math.ceil(mod), Math.ceil(mod));
  const ci = lado * 0.2, cx = x0 + (lado - ci) / 2, cy = y0 + (lado - ci) / 2;
  ctx.fillStyle = "#000"; redondo(ctx, cx - 6 * k, cy - 6 * k, ci + 12 * k, ci + 12 * k, 16 * k); ctx.fill();
  const im = await marca(); if (im) ctx.drawImage(im, cx + ci * 0.12, cy + ci * 0.12, ci * 0.76, ci * 0.76);
  // instagram
  const ig = ((N.negocio().redes || {}).ig || "").replace(/^@/, "");
  ctx.font = `700 ${44 * k}px Archivo, system-ui, sans-serif`; ctx.fillStyle = "#FFFFFF";
  ctx.fillText(ig ? "@" + ig : N.nombreNegocio(), W / 2, y0 + lado + 92 * k);
  return cv;
}
function redondo(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
function ArteQR({ m, chico }) {
  const ref = useRef(null), clave = [m.frase, m.sub, m.src].join("|");
  useEffect(() => { if (ref.current) dibujarArte(ref.current, m, chico ? 400 : 800); }, [clave]);
  return html`<canvas ref=${ref} class=${chico ? "arte-chico" : "arte"} role="img" aria-label=${"Arte del QR: " + (m.frase || "")}></canvas>`;
}
async function descargarArte(m) {
  const cv = document.createElement("canvas");
  await dibujarArte(cv, m, 2400);   // 2400 × 3000 px: unos 20 × 25 cm a 300 ppp
  cv.toBlob(bl => { const a = document.createElement("a"); a.href = URL.createObjectURL(bl); a.download = "QR " + (m.nombre || "pieza") + ".png"; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500); }, "image/png");
}

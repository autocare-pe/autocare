// AUTOCARE · datos de la app
// Trabaja "primero en el celular": todo se guarda al instante en el equipo (IndexedDB) y se envía
// a tu hoja de Google en segundo plano. Si no hay señal, los cambios esperan en una cola y salen solos.

import { useState, useEffect } from "../vendor/preact-htm.js";
import { api, token, fijarToken } from "./api.js";
import { ENT, AJUSTES_MOD, AREAS, ENT_PRACTICA } from "./esquema.js";
import { nuevoId, llave } from "./util.js";

const DB_NOMBRE = "autocare", DB_VERSION = 1;
let db = null;
const L = {};            // lista → Map(id → registro)
const ARR = {};          // lista → arreglo (caché)
let AJ = {}, YO = null, SRV = null, REV = 0, EQ = [], EQ_T = 0;
let COLA = [], SEQ = 0;
const EN_VUELO = new Set();
const FOTOS = new Map(); // fotos tomadas que aún no suben: lid → {lid, data, tipo, nombre}
let REAL = {};           // lid → id en Drive (cuando ya subió)
const VISTA = {};        // id de Drive → dataURL (para verla al instante en esta sesión)
const CALC = {};

export const estado = { sync: "ok", error: "", pendientes: 0, ultima: 0, cargado: false, fotos: 0 };
let version = 0;
const subs = new Set();
let avisoPendiente = false;
let alRechazo = () => { };
export function cuandoRechace(fn) { alRechazo = fn; }

function notificar() {
  version++;
  if (avisoPendiente) return;
  avisoPendiente = true;
  queueMicrotask(() => { avisoPendiente = false; subs.forEach(f => { try { f(version); } catch (e) { console.error(e); } }); });
}
export function suscribir(f) { subs.add(f); return () => { subs.delete(f); }; }
export function useDatos() {
  const [v, setV] = useState(version);
  useEffect(() => suscribir(setV), []);
  return v;
}
export const versionDatos = () => version;
// Cálculos pesados que se reutilizan mientras no cambie nada
export function calculado(clave, fn) {
  const c = CALC[clave];
  if (c && c.v === version) return c.x;
  const x = fn();
  CALC[clave] = { v: version, x };
  return x;
}

// ---------------------------------------------------------------- IndexedDB
function abrirDB() {
  return new Promise((ok, mal) => {
    if (!("indexedDB" in window)) return mal(new Error("sin IndexedDB"));
    const r = indexedDB.open(DB_NOMBRE, DB_VERSION);
    r.onupgradeneeded = () => {
      const d = r.result;
      if (!d.objectStoreNames.contains("reg")) d.createObjectStore("reg", { keyPath: "k" });
      if (!d.objectStoreNames.contains("kv")) d.createObjectStore("kv");
      if (!d.objectStoreNames.contains("fotos")) d.createObjectStore("fotos", { keyPath: "lid" });
    };
    r.onsuccess = () => ok(r.result);
    r.onerror = () => mal(r.error);
    r.onblocked = () => mal(new Error("bloqueada"));
  });
}
function leerTodo(store) {
  return new Promise((ok, mal) => {
    const q = db.transaction(store).objectStore(store).getAll();
    q.onsuccess = () => ok(q.result || []); q.onerror = () => mal(q.error);
  });
}
function leerKv() {
  return new Promise((ok, mal) => {
    const out = {}, q = db.transaction("kv").objectStore("kv").openCursor();
    q.onsuccess = () => { const c = q.result; if (c) { out[c.key] = c.value; c.continue(); } else ok(out); };
    q.onerror = () => mal(q.error);
  });
}
function hecho(t) { return new Promise((ok, mal) => { t.oncomplete = () => ok(); t.onerror = () => mal(t.error); t.onabort = () => mal(t.error); }); }

const sucioReg = new Map(), sucioKv = new Map();
let tPersistir = null;
function persistir() { if (!db) return; clearTimeout(tPersistir); tPersistir = setTimeout(volcar, 80); }
async function volcar() {
  if (!db) return;
  const regs = [...sucioReg], kvs = [...sucioKv];
  sucioReg.clear(); sucioKv.clear();
  if (!regs.length && !kvs.length) return;
  try {
    const t = db.transaction(["reg", "kv"], "readwrite"), sr = t.objectStore("reg"), sk = t.objectStore("kv");
    regs.forEach(([k, v]) => (v ? sr.put(v) : sr.delete(k)));
    kvs.forEach(([k, v]) => (v === undefined ? sk.delete(k) : sk.put(v, k)));
    await hecho(t);
  } catch (e) { console.warn("No se pudo guardar en el equipo", e); }
}
const ponerReg = (e, r) => { sucioReg.set(e + "/" + r.id, { k: e + "/" + r.id, e, r }); persistir(); };
const quitarReg = (e, id) => { sucioReg.set(e + "/" + id, null); persistir(); };
const ponerKv = (k, v) => { sucioKv.set(k, v); persistir(); };

function mapa(e) { return L[e] || (L[e] = new Map()); }

// ---------------------------------------------------------------- arranque
export async function iniciar() {
  try { db = await abrirDB(); } catch (e) { db = null; }
  if (db) {
    try {
      const [regs, kv, fotos] = await Promise.all([leerTodo("reg"), leerKv(), leerTodo("fotos")]);
      regs.forEach(x => { if (x && x.r && x.r.id) mapa(x.e).set(x.r.id, x.r); });
      AJ = kv.ajustes || {}; YO = kv.yo || null; SRV = kv.servidor || null; REV = kv.rev || 0; EQ = kv.equipo || [];
      COLA = kv.cola || []; REAL = kv.real || {};
      SEQ = COLA.reduce((m, o) => Math.max(m, o.n || 0), 0);
      fotos.forEach(f => FOTOS.set(f.lid, f));
    } catch (e) { console.warn(e); }
  }
  estado.cargado = !!YO && !!token();
  estado.pendientes = COLA.length; estado.fotos = FOTOS.size;
  notificar();
  return estado.cargado;
}

// Después de entrar: si es otra persona, borramos lo de la anterior
export async function alEntrar(respuesta, recordar) {
  fijarToken(respuesta.token, recordar);
  if (YO && respuesta.usuario && YO.id !== respuesta.usuario.id) await borrarLocal(false);
  YO = respuesta.usuario; ponerKv("yo", YO);
  await cargarTodo();
}

function clavesPendientes() {
  const s = new Set();
  COLA.forEach(o => s.add(o.e === "ajustes" ? "aj/" + o.k : o.e + "/" + (o.r ? o.r.id : o.id)));
  return s;
}

export async function cargarTodo() {
  const j = await api("todo");
  const pend = new Map(), borr = new Set();
  COLA.forEach(o => {
    if (o.op === "up") pend.set(o.e + "/" + o.r.id, o.r);
    if (o.op === "del") borr.add(o.e + "/" + o.id);
  });
  Object.keys(L).forEach(e => delete L[e]);
  Object.keys(ARR).forEach(e => delete ARR[e]);
  Object.keys(ENT).forEach(e => {
    const m = mapa(e);
    (j.datos[e] || []).forEach(r => { if (!borr.has(e + "/" + r.id)) m.set(r.id, r); });
  });
  pend.forEach((r, k) => { const e = k.split("/")[0]; mapa(e).set(r.id, r); });
  AJ = j.ajustes || {};
  COLA.forEach(o => { if (o.e === "ajustes") AJ[o.k] = o.v; });
  YO = j.yo; SRV = j.servidor; REV = j.rev; EQ = j.equipo || EQ; EQ_T = Date.now();
  if (db) {
    try {
      const t = db.transaction(["reg", "kv"], "readwrite"), sr = t.objectStore("reg"), sk = t.objectStore("kv");
      sr.clear();
      Object.keys(L).forEach(e => L[e].forEach(r => sr.put({ k: e + "/" + r.id, e, r })));
      sk.put(AJ, "ajustes"); sk.put(YO, "yo"); sk.put(SRV, "servidor"); sk.put(REV, "rev"); sk.put(COLA, "cola"); sk.put(EQ, "equipo");
      await hecho(t);
    } catch (e) { console.warn(e); }
  }
  estado.cargado = true; estado.ultima = Date.now();
  notificar();
}

export async function traerCambios() {
  if (!REV) { await cargarTodo(); return true; }
  const j = await api("cambios", { desde: REV });
  estado.ultima = Date.now();
  if (j.reiniciar) { await cargarTodo(); return true; }   // hubo una limpieza grande: recargamos todo
  if (j.sinCambios) { if (estado.sync === "sinred") fijarSync("ok"); return false; }
  const pend = clavesPendientes();
  (j.borrados || []).forEach(b => {
    if (pend.has(b.e + "/" + b.id) || !L[b.e]) return;
    if (L[b.e].delete(b.id)) { quitarReg(b.e, b.id); delete ARR[b.e]; }
  });
  Object.keys(j.cambios || {}).forEach(e => {
    j.cambios[e].forEach(r => {
      if (pend.has(e + "/" + r.id)) return;
      mapa(e).set(r.id, r); ponerReg(e, r);
    });
    delete ARR[e];
  });
  if (j.ajustes) {
    AJ = j.ajustes;
    COLA.forEach(o => { if (o.e === "ajustes") AJ[o.k] = o.v; });
    ponerKv("ajustes", AJ);
  }
  REV = j.rev; ponerKv("rev", REV);
  notificar();
  if (Date.now() - EQ_T > 10 * 60000) refrescarEquipo();
  return true;
}
// ---------------------------------------------------------------- equipo y áreas (socios)
export async function refrescarEquipo() {
  EQ_T = Date.now();
  try {
    const r = await api("equipo"); EQ = r.equipo || []; ponerKv("equipo", EQ);
    const yo = YO && EQ.find(x => x.id === YO.id);
    if (yo && JSON.stringify(yo.areas) !== JSON.stringify(YO.areas)) { YO = Object.assign({}, YO, { areas: yo.areas }); ponerKv("yo", YO); }
    notificar();
  } catch (e) { }
}
export const enPractica = () => !!(AJ.practica && AJ.practica.activo);
export const equipo = () => EQ;
export const somosVarios = () => EQ.length > 1;
export function misAreas() { const a = (YO && YO.areas) || []; return a.length ? a : AREAS.map(x => x.v); }
export const tengoArea = a => misAreas().includes(a);
/** Quién se encarga de un área: prefiere a quien no está en el campo */
export function responsable(area) {
  const l = EQ.filter(x => (x.areas || []).includes(area)), sin = l.filter(x => !(x.areas || []).includes("campo"));
  return (sin[0] || l[0] || {}).id || "";
}
export function nombreUsuario(id) { const x = EQ.find(y => y.id === id); return x ? x.nombre : ""; }

// ---------------------------------------------------------------- lectura
export function lista(e) { return ARR[e] || (ARR[e] = Array.from(mapa(e).values())); }
export function uno(e, id) { return id ? mapa(e).get(id) || null : null; }
export const ajustes = () => AJ;
export function ajuste(k, def) { return AJ[k] !== undefined && AJ[k] !== null ? AJ[k] : def; }
export const yo = () => YO;
export const servidor = () => SRV;

export function puede(mod, nivel = 1) {
  if (!YO) return false;
  if (YO.rol === "admin") return true;
  return Number((YO.permisos || {})[mod] || 0) >= nivel;
}
export const esAdmin = () => !!YO && YO.rol === "admin";
export function puedeEditar(e) { const d = ENT[e]; return !!d && d.mod.some(m => puede(m, 2)); }
export function puedeVer(e) { const d = ENT[e]; return !!d && (d.base || (d.ver || d.mod).some(m => puede(m, 1))); }
export function puedeAjuste(k) { return puede(AJUSTES_MOD[k] || "config", 2); }

// ---------------------------------------------------------------- escritura
function claveOp(o) { return o.e === "ajustes" ? "aj/" + o.k : o.e + "/" + (o.r ? o.r.id : o.id); }
function encolar(op) {
  op.n = ++SEQ;
  const k = claveOp(op);
  COLA = COLA.filter(o => claveOp(o) !== k || EN_VUELO.has(o.n));
  COLA.push(op);
  ponerKv("cola", COLA);
  estado.pendientes = COLA.length;
  programarEnvio();
}
function conFotosReales(rec) {
  const s = JSON.stringify(rec);
  if (!s.includes("local:")) return rec;
  return JSON.parse(s.replace(/local:([A-Za-z0-9]+)/g, (m, lid) => (REAL[lid] ? REAL[lid] : m)));
}

/** Guarda un registro completo (crea o reemplaza). Devuelve el registro guardado. */
export function guardar(e, r) {
  if (!ENT[e]) throw new Error("Lista desconocida: " + e);
  const prev = r.id ? mapa(e).get(r.id) : null;
  let rec = {};
  Object.keys(r).forEach(k => { if (r[k] !== undefined) rec[k] = r[k]; });
  if (!rec.id) rec.id = nuevoId();
  rec.creado = (prev && prev.creado) || rec.creado || Date.now();
  rec.act = Date.now();
  rec.por = (YO && YO.nombre) || rec.por || "";
  if (!prev && rec.prueba === undefined && enPractica() && ENT_PRACTICA.includes(e)) rec.prueba = true;
  if (e === "pagos" && !prev && YO) {
    rec.cobradoPor = rec.cobradoPor || YO.nombre; rec.cobradoPorId = rec.cobradoPorId || YO.id;
    if (rec.verificado === undefined) rec.verificado = !EQ.some(x => x.id !== YO.id && (x.areas || []).includes("pagos")) || misAreas().includes("pagos");
  }
  if (prev && prev.numero && !rec.numero) rec.numero = prev.numero;
  rec = conFotosReales(rec);
  mapa(e).set(rec.id, rec); ponerReg(e, rec); delete ARR[e];
  encolar({ e, op: "up", r: rec });
  notificar();
  return rec;
}
/** Cambia solo algunos datos de un registro que ya existe */
export function cambiar(e, id, parche) {
  const prev = uno(e, id);
  if (!prev) return null;
  return guardar(e, Object.assign({}, prev, typeof parche === "function" ? parche(prev) : parche));
}
export function borrar(e, id) {
  const prev = uno(e, id);
  if (!prev) return null;
  mapa(e).delete(id); quitarReg(e, id); delete ARR[e];
  encolar({ e, op: "del", id });
  notificar();
  return prev;
}
export function fijarAjuste(k, v) {
  AJ = Object.assign({}, AJ, { [k]: conFotosReales(v) });
  ponerKv("ajustes", AJ);
  encolar({ e: "ajustes", op: "set", k, v: AJ[k] });
  notificar();
}

// ---------------------------------------------------------------- envío al servidor
let tEnvio = null, tReintento = null, enviando = false, reintentos = 0, trayendo = false;
function programarEnvio(ms = 700) { clearTimeout(tEnvio); tEnvio = setTimeout(enviar, ms); }
function fijarSync(s, err = "") { if (estado.sync !== s || estado.error !== err) { estado.sync = s; estado.error = err; notificar(); } }
function programarReintento() {
  clearTimeout(tReintento);
  const espera = [4000, 10000, 20000, 45000, 90000][Math.min(reintentos++, 4)];
  tReintento = setTimeout(enviar, espera);
}
function tieneLocal(o) {
  const s = JSON.stringify(o.r || o.v || "");
  if (!s.includes("local:")) return false;
  return Array.from(s.matchAll(/local:([A-Za-z0-9]+)/g)).some(m => FOTOS.has(m[1]));
}

export async function enviar() {
  if (enviando || !token()) return;
  if (!COLA.length && !FOTOS.size) { if (estado.sync !== "sinred" || navigator.onLine !== false) fijarSync("ok"); return; }
  if (navigator.onLine === false) { fijarSync("sinred", "Sin internet"); return; }
  enviando = true; fijarSync("enviando");
  let rechazados = false;
  try {
    await subirFotos();
    for (let vuelta = 0; vuelta < 20; vuelta++) {
      const lote = COLA.filter(o => !tieneLocal(o)).slice(0, 120);
      if (!lote.length) break;
      lote.forEach(o => EN_VUELO.add(o.n));
      let j;
      try { j = await api("guardar", { ops: lote.map(o => (o.op === "up" ? { e: o.e, op: "up", r: o.r } : o.op === "del" ? { e: o.e, op: "del", id: o.id } : { e: "ajustes", op: "set", k: o.k, v: o.v })) }); }
      catch (err) {
        lote.forEach(o => EN_VUELO.delete(o.n));
        if (err.codigo === "RED" || err.codigo === "SESION" || err.codigo === "SIN_URL") throw err;
        rechazados = true;
        await aislar(lote);
        continue;
      }
      lote.forEach(o => EN_VUELO.delete(o.n));
      const listos = new Set(lote.map(o => o.n));
      COLA = COLA.filter(o => !listos.has(o.n));
      aplicarAsignados(j.asignados || {});
      ponerKv("cola", COLA); estado.pendientes = COLA.length;
    }
    reintentos = 0;
    fijarSync("ok");
  } catch (err) {
    fijarSync(err.codigo === "RED" ? "sinred" : "error", err.message);
    if (err.codigo !== "SESION") programarReintento();
  } finally {
    enviando = false; estado.pendientes = COLA.length; estado.fotos = FOTOS.size; notificar();
  }
  if (rechazados) setTimeout(() => cargarTodo().catch(() => { }), 500);
  else if (estado.sync === "ok") setTimeout(traerSeguro, 300);
}
async function aislar(lote) {
  for (const o of lote) {
    try {
      const j = await api("guardar", { ops: [o.op === "up" ? { e: o.e, op: "up", r: o.r } : o.op === "del" ? { e: o.e, op: "del", id: o.id } : { e: "ajustes", op: "set", k: o.k, v: o.v }] });
      aplicarAsignados(j.asignados || {});
      COLA = COLA.filter(x => x.n !== o.n);
    } catch (err) {
      if (err.codigo === "RED" || err.codigo === "SESION") throw err;
      COLA = COLA.filter(x => x.n !== o.n);
      alRechazo(o, err.message);
    }
  }
  ponerKv("cola", COLA); estado.pendientes = COLA.length;
}
function aplicarAsignados(as) {
  Object.keys(as).forEach(e => Object.keys(as[e]).forEach(id => {
    const r = uno(e, id);
    if (r) { r.numero = as[e][id].numero; ponerReg(e, r); delete ARR[e]; }
    COLA.forEach(o => { if (o.e === e && o.r && o.r.id === id) o.r.numero = as[e][id].numero; });
  }));
  notificar();
}

export async function traerSeguro() {
  if (trayendo || !token() || navigator.onLine === false) return;
  trayendo = true;
  try { await traerCambios(); }
  catch (e) { if (e.codigo === "RED") fijarSync("sinred", e.message); }
  finally { trayendo = false; }
}

let arrancado = false;
export function arrancarSync() {
  if (arrancado) return;
  arrancado = true;
  setInterval(() => { if (document.visibilityState === "visible") { if (COLA.length) enviar(); traerSeguro(); } }, 40000);
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") { enviar(); traerSeguro(); } });
  window.addEventListener("online", () => { reintentos = 0; enviar(); traerSeguro(); });
  window.addEventListener("offline", () => fijarSync("sinred", "Sin internet"));
  window.addEventListener("pagehide", () => volcar());
  enviar(); traerSeguro();
}

// ---------------------------------------------------------------- fotos
/** Guarda la foto en el equipo y devuelve una referencia "local:…" que se cambia sola cuando sube a Drive */
export async function agregarFoto(dataUrl, tipo = "orden", nombre = "") {
  const lid = llave(12), f = { lid, data: dataUrl, tipo, nombre, creado: Date.now() };
  FOTOS.set(lid, f); estado.fotos = FOTOS.size;
  if (db) { try { const t = db.transaction("fotos", "readwrite"); t.objectStore("fotos").put(f); await hecho(t); } catch (e) { } }
  programarEnvio(300);
  notificar();
  return "local:" + lid;
}
async function subirFotos() {
  for (const f of Array.from(FOTOS.values())) {
    if (!REAL[f.lid]) {
      try {
        const j = await api("subirFoto", { data: f.data, tipo: f.tipo, nombre: f.nombre }, { espera: 120000 });
        REAL = Object.assign({}, REAL, { [f.lid]: j.id }); ponerKv("real", REAL);
        VISTA[j.id] = f.data;
      } catch (err) {
        if (err.codigo === "RED" || err.codigo === "SESION" || err.codigo === "SIN_URL") throw err;
        alRechazo({ e: "fotos", op: "foto" }, err.message);
      }
    }
    if (REAL[f.lid]) reemplazarReferencias(f.lid);
    FOTOS.delete(f.lid); estado.fotos = FOTOS.size;
    if (db) { try { const t = db.transaction("fotos", "readwrite"); t.objectStore("fotos").delete(f.lid); await hecho(t); } catch (e) { } }
    notificar();
  }
}
function reemplazarReferencias(lid) {
  const viejo = "local:" + lid;
  Object.keys(L).forEach(e => {
    Array.from(L[e].values()).forEach(r => { if (JSON.stringify(r).includes(viejo)) guardar(e, r); });
  });
  Object.keys(AJ).forEach(k => { if (JSON.stringify(AJ[k]).includes(viejo)) fijarAjuste(k, AJ[k]); });
}
/** Dirección para mostrar una foto (local, recién subida o en Drive) */
export function srcFoto(ref, ancho = 800) {
  if (!ref) return "";
  ref = String(ref);
  if (ref.startsWith("data:") || ref.startsWith("http")) return ref;
  if (ref.startsWith("local:")) {
    const lid = ref.slice(6);
    if (FOTOS.has(lid)) return FOTOS.get(lid).data;
    if (REAL[lid]) ref = REAL[lid]; else return "";
  }
  if (VISTA[ref]) return VISTA[ref];
  return `https://drive.google.com/thumbnail?id=${encodeURIComponent(ref)}&sz=w${ancho}`;
}
export const fotoPendiente = ref => String(ref || "").startsWith("local:") && FOTOS.has(String(ref).slice(6));
export const idReal = ref => { ref = String(ref || ""); return ref.startsWith("local:") ? REAL[ref.slice(6)] || "" : ref; };
/** Trae fotos como datos (para dibujarlas en el estudio sin que el navegador las bloquee) */
export async function fotosComoDatos(refs) {
  const out = {}, faltan = [];
  refs.forEach(r => {
    const s = srcFoto(r);
    if (s.startsWith("data:")) out[r] = s; else { const id = idReal(r); if (id) faltan.push([r, id]); }
  });
  if (faltan.length) {
    const j = await api("fotos", { ids: faltan.map(x => x[1]) });
    faltan.forEach(([r, id]) => { if (j.fotos[id]) { out[r] = j.fotos[id]; VISTA[id] = j.fotos[id]; } });
  }
  return out;
}

// ---------------------------------------------------------------- sesión y respaldo
export const hayPendientes = () => COLA.length + FOTOS.size;
export async function salir() {
  try { await api("salir", {}, { espera: 8000 }); } catch (e) { }
  await borrarLocal(true);
}
export async function borrarLocal(conToken) {
  if (conToken) fijarToken("");
  Object.keys(L).forEach(e => delete L[e]);
  Object.keys(ARR).forEach(e => delete ARR[e]);
  AJ = {}; YO = null; SRV = null; REV = 0; COLA = []; REAL = {}; FOTOS.clear();
  estado.cargado = false; estado.pendientes = 0; estado.fotos = 0;
  if (db) {
    try { const t = db.transaction(["reg", "kv", "fotos"], "readwrite"); ["reg", "kv", "fotos"].forEach(s => t.objectStore(s).clear()); await hecho(t); } catch (e) { }
  }
  notificar();
}
export function fijarYo(u) { YO = u; ponerKv("yo", YO); notificar(); }
export function copiaLocal() {
  const datos = {};
  Object.keys(L).forEach(e => (datos[e] = Array.from(L[e].values())));
  return { app: "autocare", tipo: "copia del equipo", fecha: new Date().toISOString(), datos, ajustes: AJ, pendientes: COLA };
}

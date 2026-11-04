// AUTOCARE · conexión con tu servidor de Google (Apps Script)
// Todas las llamadas son POST de texto simple: así Google no pide permisos extra (CORS).

const LS_URL = "autocare.servidor";
const LS_TOKEN = "autocare.sesion";

export class ErrorApi extends Error {
  constructor(mensaje, codigo) { super(mensaje); this.codigo = codigo || ""; }
}

export function urlServidor() {
  let u = "";
  try { u = localStorage.getItem(LS_URL) || ""; } catch (e) { }
  return u || (window.AUTOCARE && window.AUTOCARE.API) || "";
}
export function fijarServidor(url) {
  try { if (url) localStorage.setItem(LS_URL, url.trim()); else localStorage.removeItem(LS_URL); } catch (e) { }
}
export function token() {
  try { return localStorage.getItem(LS_TOKEN) || sessionStorage.getItem(LS_TOKEN) || ""; } catch (e) { return ""; }
}
export function fijarToken(t, recordar = true) {
  try {
    localStorage.removeItem(LS_TOKEN); sessionStorage.removeItem(LS_TOKEN);
    if (t) (recordar ? localStorage : sessionStorage).setItem(LS_TOKEN, t);
  } catch (e) { }
}

let alTerminarSesion = () => { };
export function cuandoTermineSesion(fn) { alTerminarSesion = fn; }

export function urlValida(u) { return /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(String(u || "").trim()) || /^http:\/\/localhost:\d+\/exec$/.test(String(u || "").trim()); }

export async function api(a, d = {}, opciones = {}) {
  const url = opciones.url || urlServidor();
  if (!url) throw new ErrorApi("Falta la dirección de tu servidor.", "SIN_URL");
  const ctrl = new AbortController();
  const limite = setTimeout(() => ctrl.abort(), opciones.espera || 60000);
  let res;
  try {
    res = await fetch(url, {
      method: "POST", redirect: "follow", signal: ctrl.signal,
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ a, d, t: opciones.sinSesion ? "" : token() })
    });
  } catch (e) {
    throw new ErrorApi(navigator.onLine === false ? "Estás sin internet." : (e.name === "AbortError" ? "El servidor tardó demasiado en responder." : "No se pudo conectar con tu servidor."), "RED");
  } finally { clearTimeout(limite); }
  if (!res.ok) throw new ErrorApi(`El servidor respondió con un error (${res.status}). Revisa que esté publicado para «Cualquier usuario».`, res.status >= 500 ? "RED" : "HTTP");
  let j;
  try { j = await res.json(); }
  catch (e) { throw new ErrorApi("El servidor no respondió como se esperaba. ¿La dirección termina en /exec y está publicada para «Cualquier usuario»?", "FORMATO"); }
  if (!j.ok) {
    if (j.codigo === "SESION" && !opciones.sinSesion) alTerminarSesion();
    throw new ErrorApi(j.error || "El servidor no pudo hacerlo.", j.codigo || "SERVIDOR");
  }
  return j;
}

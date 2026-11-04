// AUTOCARE · Pon tu negocio en marcha: la configuración en orden, un paso a la vez y solo lo esencial.
// Steve Krug (No me hagas pensar) y BJ Fogg (Tiny Habits): pasos chicos y claros se terminan; un formulario
// largo se abandona. Cada paso se puede saltar y todo se cambia después en Configuración.
import { html, useState, useEffect } from "../../vendor/preact-htm.js";
import * as D from "../datos.js";
import * as N from "../negocio.js";
import { api } from "../api.js";
import { ir, usarTitulo } from "../app.js";
import { Boton, Entrada, Numero, Dinero, Interruptor, Fila, Bloque, AvisoLinea, Progreso, Icono, aviso, useFicha, b } from "../ui.js";
import { soles, telNorm } from "../util.js";

export const PASOS = [
  { id: "negocio", t: "Tu negocio", d: "Nombre, frase y zonas que atiendes", i: "store" },
  { id: "contacto", t: "Contacto y pagos", d: "WhatsApp del negocio y Yape", i: "phone" },
  { id: "redes", t: "Redes y reseñas", d: "Instagram, TikTok, Facebook y Google", i: "globe" },
  { id: "servicios", t: "Servicios y precios", d: "Lo que vendes, cuánto cuesta y cuánto demora", i: "sparkles" },
  { id: "horario", t: "Horario", d: "Qué días y a qué hora trabajas", i: "clock" },
  { id: "avisos", t: "Avisos al celular", d: "Telegram: te enteras de reservas y consultas", i: "bell", opcional: true },
  { id: "equipo", t: "Tu socia", d: "Darle acceso con sus áreas", i: "users", opcional: true },
  { id: "practica", t: "Practica antes del primer cliente", d: "Un servicio de prueba de principio a fin", i: "flask-conical", opcional: true }];

const estadoArranque = () => D.ajuste("arranque", {}) || {};
/** Qué pasos ya están listos (se calcula con tus datos: no hay que marcar nada a mano) */
export function pasosHechos() {
  const n = N.negocio() || {}, r = n.redes || {}, A = estadoArranque(), h = D.ajuste("horario", null);
  return {
    negocio: !!(n.nombre && n.zonas), contacto: telNorm(n.tel || "").length === 9 && !!(n.yape && n.yape.numero),
    redes: !!(r.ig || r.tt || r.fb), servicios: N.serviciosActivos().some(s => Number(s.precio) > 0),
    horario: !!(h && h.dias && Object.values(h.dias).some(x => x && x.length)), avisos: !!A.avisos,
    equipo: D.equipo().length > 1 || !!A.equipo, practica: (P => !!(P.desde || P.hecha))(D.ajuste("practica", {}) || {}) || !!A.practica
  };
}
export function progresoArranque() {
  const h = pasosHechos(), s = estadoArranque().saltados || [];
  const listos = PASOS.filter(p => h[p.id] || s.includes(p.id)).length;
  return { listos, total: PASOS.length, completo: listos === PASOS.length, oculto: !!estadoArranque().oculto };
}

export default function Arranque({ ruta }) {
  D.useDatos();
  usarTitulo("Puesta en marcha");
  const h = pasosHechos(), A = estadoArranque(), saltados = A.saltados || [];
  const primero = (PASOS.find(p => !h[p.id] && !saltados.includes(p.id)) || PASOS[0]).id;
  const [actual, setActual] = useState(ruta.partes[0] || primero);
  if (!D.puede("config", 2)) return html`<div class="vacio"><h3>Esto lo configura el administrador</h3><p>Pídele acceso a Configuración en Configuración → Usuarios.</p></div>`;
  const p = PASOS.find(x => x.id === actual) || PASOS[0];
  const listos = PASOS.filter(x => h[x.id] || saltados.includes(x.id)).length;
  const siguiente = () => {
    const h2 = pasosHechos(), sk = estadoArranque().saltados || [], i = PASOS.findIndex(x => x.id === actual);
    const pendiente = x => !h2[x.id] && !sk.includes(x.id) && x.id !== actual;
    const sig = PASOS.slice(i + 1).find(pendiente) || PASOS.find(pendiente);
    if (sig) setActual(sig.id);
    else { const faltan = PASOS.filter(x => !h2[x.id]).length; aviso(faltan ? `¡Listo! Te quedan ${faltan} ${faltan === 1 ? "paso saltado" : "pasos saltados"}: vuelve cuando quieras.` : "¡Listo! Tu negocio está configurado."); ir(""); }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const saltar = () => { D.fijarAjuste("arranque", Object.assign({}, A, { saltados: [...new Set([...saltados, actual])] })); siguiente(); };
  const marcar = k => D.fijarAjuste("arranque", Object.assign({}, estadoArranque(), { [k]: Date.now() }));
  const Paso = { negocio: PasoNegocio, contacto: PasoContacto, redes: PasoRedes, servicios: PasoServicios, horario: PasoHorario, avisos: PasoAvisos, equipo: PasoEquipo, practica: PasoPractica }[p.id];
  return html`<header class="pagina-cab"><div><h1>Pon tu negocio en marcha</h1><p>En orden, un paso a la vez y solo lo esencial. Todo se puede cambiar después en Configuración.</p></div></header>
    <div style="margin-bottom:20px"><${Progreso} v=${listos} max=${PASOS.length} /><p class="nota" style="margin-top:6px">${listos} de ${PASOS.length} listos</p></div>
    <div class="columnas arranque">
      <div><p class="marcador-lista">Todos los pasos</p><div class="grupo">${PASOS.map((x, i) => html`<${Fila} icono=${h[x.id] ? "circle-check" : x.i} colorIcono=${h[x.id] ? "verde" : x.id === actual ? "oro" : ""} titulo=${(i + 1) + ". " + x.t}
        sub=${h[x.id] ? "Listo" : saltados.includes(x.id) ? "Saltado: puedes volver cuando quieras" : x.d + (x.opcional ? " · opcional" : "")} clase=${x.id === actual ? "activa" : ""} onClick=${() => { setActual(x.id); window.scrollTo({ top: 0, behavior: "smooth" }); }} flecha />`)}</div></div>
      <section class="panel form paso-arranque">
        <div class="titulo-seccion"><p class="marcador">PASO ${PASOS.indexOf(p) + 1} DE ${PASOS.length}${p.opcional ? " · OPCIONAL" : ""}</p><h2>${p.t}</h2></div>
        <${Paso} key=${p.id} listo=${siguiente} marcar=${marcar} hecho=${h[p.id]} />
        <div class="btns" style="margin-top:4px"><${Boton} tipo="fantasma" onClick=${h[p.id] ? siguiente : saltar}>${h[p.id] ? "Siguiente paso" : "Saltar por ahora"}<//></div>
      </section>
    </div>`;
}

// ---------------------------------------------------------------- cada paso
function guardarNegocio(cambios) { const n = D.ajuste("negocio", {}) || {}; D.fijarAjuste("negocio", Object.assign({}, n, cambios)); }

function PasoNegocio({ listo }) {
  const n = D.ajuste("negocio", {}) || {};
  const [f, set] = useFicha({ nombre: n.nombre || "AUTOCARE", eslogan: n.eslogan || "Detailing a domicilio", distrito: n.distrito || "", zonas: n.zonas || "" });
  const ok = () => { if (!f.nombre.trim()) return aviso("Escribe el nombre.", { error: true }); guardarNegocio(f); aviso("Guardado."); listo(); };
  return html`<${Entrada} etiqueta="Nombre" ...${b(f, set, "nombre")} />
    <${Entrada} etiqueta="Frase corta" ...${b(f, set, "eslogan")} placeholder="Detailing a domicilio" ayuda="Sale debajo de tu nombre en la web." />
    <${Entrada} etiqueta="Ciudad o distrito base" ...${b(f, set, "distrito")} placeholder="Cayma, Arequipa" />
    <${Entrada} etiqueta="Zonas que atiendes" ...${b(f, set, "zonas")} placeholder="Cayma, Yanahuara, Cerro Colorado…" />
    <${Boton} tipo="primario" grande onClick=${ok}>Guardar y seguir<//>`;
}
function PasoContacto({ listo }) {
  const n = D.ajuste("negocio", {}) || {}, y = n.yape || {};
  const [f, set] = useFicha({ tel: n.tel || "", yapeNum: y.numero || "", yapeTit: y.titular || "", pagos: n.pagos || "Efectivo, Yape o Plin" });
  const ok = () => {
    const t = telNorm(f.tel);
    if (t.length !== 9) return aviso("El WhatsApp debe tener 9 dígitos.", { error: true });
    guardarNegocio({ tel: t, pagos: f.pagos, yape: f.yapeNum ? { numero: telNorm(f.yapeNum), titular: f.yapeTit } : null }); aviso("Guardado."); listo();
  };
  return html`<${AvisoLinea} icono="info">¿Cambias de número más adelante? Solo vuelves aquí o a Configuración → Negocio. Lo impreso no lleva tu número, así que no hay que reimprimir.<//>
    <${Entrada} etiqueta="WhatsApp del negocio" tipo="tel" inputmode="tel" ...${b(f, set, "tel")} placeholder="987654321" />
    <div class="rejilla"><${Entrada} etiqueta="Yape: número" tipo="tel" inputmode="tel" ...${b(f, set, "yapeNum")} /><${Entrada} etiqueta="Yape: titular" ...${b(f, set, "yapeTit")} /></div>
    <${Entrada} etiqueta="Cómo te pagan" ...${b(f, set, "pagos")} ayuda="Sale en tu web y en las respuestas rápidas." />
    <${Boton} tipo="primario" grande onClick=${ok}>Guardar y seguir<//>`;
}
function PasoRedes({ listo }) {
  const n = D.ajuste("negocio", {}) || {}, r = n.redes || {};
  const [f, set] = useFicha({ ig: r.ig || "", tt: r.tt || "", fb: r.fb || "", google: n.google || "" });
  const ok = () => { guardarNegocio({ redes: Object.assign({}, r, N.limpiarRedes(f)), google: f.google.trim() }); aviso("Guardado."); listo(); };
  return html`<p class="nota">Salen como botones en tu web, en la tarjeta de tus clientes y en tu página de enlaces. Llena solo las que tengas.</p>
    <div class="rejilla"><${Entrada} etiqueta="Instagram (usuario)" ...${b(f, set, "ig")} placeholder="autocare.pe" /><${Entrada} etiqueta="TikTok (usuario)" ...${b(f, set, "tt")} /></div>
    <${Entrada} etiqueta="Facebook (enlace)" ...${b(f, set, "fb")} />
    <${Entrada} etiqueta="Enlace para dejar reseña en Google" ...${b(f, set, "google")} ayuda="Cuando tengas tu perfil de empresa en Google: «Pedir reseñas» → copia el enlace. Si aún no lo tienes, déjalo vacío." />
    <${Boton} tipo="primario" grande onClick=${ok}>Guardar y seguir<//>`;
}
function PasoServicios({ listo }) {
  const servs = N.serviciosActivos();
  const [cambios, setCambios] = useState({});
  const val = (s, k) => (cambios[s.id] && cambios[s.id][k] !== undefined ? cambios[s.id][k] : s[k]);
  const poner = (s, k, v) => setCambios(Object.assign({}, cambios, { [s.id]: Object.assign({}, cambios[s.id], { [k]: v }) }));
  const ok = () => { Object.keys(cambios).forEach(id => D.cambiar("servicios", id, cambios[id])); aviso("Precios guardados."); listo(); };
  const sugeridos = async () => { const m = await import("../semilla.js"); const r = m.aplicar(); aviso(`Listo: ${r.servicios} servicios sugeridos. Ajusta los precios a tu gusto.`); };
  if (!servs.length) return html`<p>Aún no tienes servicios. Puedes empezar con los paquetes sugeridos (Esencial, Brillo Total y Detallado Premium, más adicionales) y ajustar los precios.</p>
    <div class="btns"><${Boton} tipo="primario" grande icono="sparkles" onClick=${sugeridos}>Cargar paquetes sugeridos<//><${Boton} href="#/config/servicios">Crear los míos<//></div>`;
  return html`<p class="nota">Revisa el precio (para auto o sedán) y cuánto demora cada uno. SUV y camioneta suben solos. Para fotos, pasos y más detalles: Configuración → Servicios.</p>
    <div class="grupo">${servs.map(s => html`<div class="fila servicio-rapido"><span class="cuerpo"><span class="t">${s.nombre}</span><span class="s">${s.paquete ? "Paquete" : "Adicional"}</span></span>
      <span class="campos"><span><${Dinero} valor=${val(s, "precio")} cambiar=${v => poner(s, "precio", v)} aria-label=${"Precio de " + s.nombre} /></span>
      <span><${Numero} valor=${val(s, "minutos")} cambiar=${v => poner(s, "minutos", v)} decimales=${0} sufijo="min" aria-label=${"Minutos de " + s.nombre} /></span></span></div>`)}</div>
    <div class="btns"><${Boton} tipo="primario" grande onClick=${ok}>Guardar y seguir<//><${Boton} href="#/config/servicios" icono="plus">Agregar otro servicio<//></div>`;
}
const DIAS_CORTOS = [[1, "Lun"], [2, "Mar"], [3, "Mié"], [4, "Jue"], [5, "Vie"], [6, "Sáb"], [0, "Dom"]];
function PasoHorario({ listo }) {
  const H = N.horario(), actual = Object.keys(H.dias || {}).filter(k => (H.dias[k] || []).length).map(Number);
  const primero = (H.dias[String(actual[0])] || [])[0] || ["08:00", "18:00"];
  const [dias, setDias] = useState(actual.length ? actual : [1, 2, 3, 4, 5, 6]);
  const [desde, setDesde] = useState(primero[0]), [hasta, setHasta] = useState(primero[1]);
  const ok = () => {
    if (!dias.length) return aviso("Elige al menos un día.", { error: true });
    const d = {}; for (let i = 0; i < 7; i++) d[i] = dias.includes(i) ? [[desde, hasta]] : [];
    D.fijarAjuste("horario", Object.assign({}, D.ajuste("horario", {}) || {}, { dias: d, intervalo: H.intervalo, traslado: H.traslado, maxHoras: H.maxHoras, anticipacion: H.anticipacion, diasAdelante: H.diasAdelante }));
    aviso("Horario guardado."); listo();
  };
  return html`<p class="nota">Con esto tu web solo ofrece horas libres en tus días de trabajo. Si un día tienes otro horario, ajústalo en Configuración → Horario.</p>
    <div class="chips">${DIAS_CORTOS.map(([i, t]) => html`<button type="button" class=${"chip" + (dias.includes(i) ? " activo" : "")} aria-pressed=${dias.includes(i)} onClick=${() => setDias(dias.includes(i) ? dias.filter(x => x !== i) : [...dias, i])}>${t}</button>`)}</div>
    <div class="rejilla"><${Entrada} etiqueta="Desde" tipo="time" valor=${desde} cambiar=${setDesde} /><${Entrada} etiqueta="Hasta" tipo="time" valor=${hasta} cambiar=${setHasta} /></div>
    <${Boton} tipo="primario" grande onClick=${ok}>Guardar y seguir<//>`;
}
function PasoAvisos({ listo, marcar, hecho }) {
  const [t, setT] = useState(null);
  useEffect(() => { if (D.esAdmin()) api("integraciones").then(r => { setT(r.telegram); if (r.telegram && r.telegram.mio) marcar("avisos"); }).catch(() => setT({ error: true })); }, []);
  return html`<p>Te llega un mensaje al celular cuando alguien reserva o consulta por tu web, antes de cada cita y un resumen cada noche. Es gratis.</p>
    ${t && t.mio ? html`<${AvisoLinea} c="verde" icono="circle-check">Tu Telegram ya está conectado${t.personas && t.personas.length ? " · reciben: " + t.personas.join(", ") : ""}.<//>`
      : html`<ol class="pasos-nfc"><li>Instala Telegram en tu celular.</li><li>Toca abajo «Conectar Telegram» y sigue los 2 pasos (crear tu bot una sola vez y tocar Iniciar).</li><li>Tu socia lo conecta desde su celular, en la misma pantalla.</li></ol>`}
    <div class="btns"><${Boton} tipo="primario" grande icono="bell" href="#/config/integraciones">Conectar Telegram<//>${!hecho && html`<${Boton} onClick=${() => { marcar("avisos"); listo(); }}>Ya lo conecté<//>`}</div>`;
}
function PasoEquipo({ listo, marcar, hecho }) {
  return html`<p>Si trabajas con tu socia: crea su usuario como <b>Co-gerente</b> con sus áreas (WhatsApp y ventas, cobros, logística, marketing) y deja las tuyas en <b>Servicio en campo</b>. Así cada uno ve primero lo suyo.</p>
    <div class="btns"><${Boton} tipo="primario" grande icono="user-plus" href="#/config/usuarios">Crear su usuario<//>${!hecho && html`<${Boton} onClick=${() => { marcar("equipo"); listo(); }}>Trabajo solo, seguir<//>`}</div>`;
}
function PasoPractica({ listo, marcar, hecho }) {
  return html`<p>Haz un servicio de prueba con datos falsos: agenda, recepción con fotos, cobro y entrega. Al terminar borras la práctica con un toque y empiezas limpio.</p>
    <div class="btns"><${Boton} tipo="primario" grande icono="flask-conical" href="#/datos">Ir a practicar<//>${!hecho && html`<${Boton} onClick=${() => { marcar("practica"); listo(); }}>Ya practiqué<//>`}</div>`;
}

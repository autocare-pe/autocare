// AUTOCARE · Campañas por WhatsApp (una por una, gratis) y plantillas de mensajes
// Mensaje correcto a la persona correcta: segmentos por recencia, frecuencia y monto (RFM, Arthur Hughes).
// Ley 29733: solo se escribe a quien aceptó recibir mensajes.
import { html, useState } from "../../vendor/preact-htm.js";
import * as D from "../datos.js";
import * as N from "../negocio.js";
import { ir, usarTitulo } from "../app.js";
import { Boton, Hoja, Entrada, Area, Selector, Chips, Pestanas, Insignia, Vacio, Fila, Bloque, Progreso, AvisoLinea, Check, aviso, confirmar, useFicha, b } from "../ui.js";
import { enviarWa } from "../piezas.js";
import { hoy, relativa, nombreDe, telNorm, fechaCorta, hace, rellenar, clases, copiar } from "../util.js";
import { PLANTILLAS, estadoDe } from "../esquema.js";

const GRUPOS = {
  toca: { n: "Les toca volver", plantilla: "volver", d: "Ya pasó su tiempo normal entre lavados." },
  riesgo: { n: "En riesgo (2 a 4 meses)", plantilla: "dormido", d: "Un mensaje personal suele recuperarlos." },
  dormido: { n: "Dormidos (más de 4 meses)", plantilla: "dormido", d: "Ofréceles algo especial." },
  nuevo: { n: "Vinieron una sola vez", plantilla: "volver", d: "La segunda visita crea el hábito." },
  campeon: { n: "Campeones", plantilla: "referido", d: "Pídeles que te recomienden." },
  leal: { n: "Frecuentes", plantilla: "plan", d: "Ofréceles el plan mensual." },
  cumple: { n: "Cumpleaños este mes", plantilla: "cumple", d: "Un detalle que se recuerda." },
  todos: { n: "Todos los que aceptan mensajes", plantilla: "", d: "Úsalo poco: un mensaje genérico cansa." }
};
function destinatariosDe(g) {
  const P = N.perfiles(), mes = hoy().slice(5, 7);
  return D.lista("clientes").filter(c => c.acepta !== false && c.estado !== "inactivo" && telNorm(c.tel).length === 9).filter(c => {
    if (g === "todos") return true;
    if (g === "cumple") return String(c.cumple || "").slice(5, 7) === mes;
    return (P.get(c.id) || {}).seg === g;
  });
}
const todasPlantillas = () => {
  const propias = D.lista("plantillas");
  return [...PLANTILLAS.map(p => propias.find(x => x.clave === p.clave) || p), ...propias.filter(x => !x.clave || !PLANTILLAS.some(p => p.clave === x.clave))];
};

export default function Campanas({ ruta }) {
  D.useDatos();
  usarTitulo("Campañas");
  const t = ["plantillas", "respuestas"].includes(ruta.partes[0]) ? ruta.partes[0] : "campanas";
  const id = ruta.partes[0] && t === "campanas" ? ruta.partes[0] : null;
  return html`<header class="pagina-cab"><div><h1>Campañas</h1><p>Mensajes por WhatsApp a cada tipo de cliente, uno por uno y sin costo.</p></div></header>
    <${Pestanas} valor=${t} cambiar=${v => ir("campanas" + (v === "campanas" ? "" : "/" + v), true)} opciones=${[{ v: "campanas", n: "Campañas" }, { v: "respuestas", n: "Respuestas rápidas" }, { v: "plantillas", n: "Plantillas de mensajes" }]} />
    ${t === "plantillas" ? html`<${Plantillas} />` : t === "respuestas" ? html`<${Respuestas} />` : id ? html`<${Envio} id=${id} />` : html`<${Lista} />`}`;
}

function Lista() {
  const [nueva, setNueva] = useState(null);
  const pasadas = D.lista("campanas").slice().sort((a, c) => String(c.fecha).localeCompare(String(a.fecha)));
  return html`<div class="columnas">
    <div><${Bloque} titulo="¿A quién le escribes hoy?" sub="Cada grupo con el mensaje que le corresponde">
      <div class="grupo">${Object.keys(GRUPOS).map(g => { const n = destinatariosDe(g).length; return html`<${Fila} icono=${g === "cumple" ? "cake" : g === "todos" ? "users" : "megaphone"} colorIcono=${n ? "oro" : ""} titulo=${GRUPOS[g].n} sub=${GRUPOS[g].d}
        der=${html`<b class="cifra">${n}</b>${n > 0 && html`<${Boton} chico tipo="primario" onClick=${() => setNueva(g)}>Preparar<//>`}`} />`; })}</div><//></div>
    <div><${Bloque} titulo="Campañas anteriores">${pasadas.length ? html`<div class="grupo">${pasadas.map(c => { const env = (c.destinatarios || []).filter(x => x.enviado).length; return html`<${Fila} icono="megaphone" titulo=${c.nombre} sub=${fechaCorta(c.fecha) + " · " + env + " de " + (c.destinatarios || []).length + " enviados"} der=${html`<${Insignia} c=${estadoDe("campanas", c.estado).c}>${estadoDe("campanas", c.estado).n}<//>`} href=${"#/campanas/" + c.id} flecha />`; })}</div>` : html`<p class="nota">Aún no envías campañas.</p>`}<//>
      <${AvisoLinea} icono="info">WhatsApp puede bloquear números que envían muchos mensajes iguales seguidos. Envía de a pocos, personaliza el inicio y nunca escribas a quien pidió no recibir mensajes.<//></div>
    ${nueva && html`<${Preparar} grupo=${nueva} cerrar=${() => setNueva(null)} />`}
  </div>`;
}
function Preparar({ grupo, cerrar }) {
  const lista = destinatariosDe(grupo), pls = todasPlantillas();
  const base = pls.find(p => p.clave === GRUPOS[grupo].plantilla) || pls[0];
  const [f, set] = useFicha({ nombre: GRUPOS[grupo].n + " · " + fechaCorta(hoy()), mensaje: base ? base.texto : "", plantilla: base ? base.clave || base.id : "" });
  const [sel, setSel] = useState(() => lista.map(c => c.id));
  const ejemplo = lista[0] ? N.mensaje(f.mensaje, N.varsCliente(lista[0])) : "";
  const crear = () => {
    if (!sel.length) return aviso("Elige al menos un cliente.", { error: true });
    const c = D.guardar("campanas", { nombre: f.nombre, fecha: hoy(), estado: "enviando", mensaje: f.mensaje, segmento: { tipo: grupo }, plantillaId: f.plantilla,
      destinatarios: lista.filter(x => sel.includes(x.id)).map(x => ({ clienteId: x.id, nombre: nombreDe(x), tel: telNorm(x.tel), enviado: null })) });
    cerrar(); ir("campanas/" + c.id);
  };
  return html`<${Hoja} ancha titulo=${"Campaña: " + GRUPOS[grupo].n} cerrar=${cerrar} pie=${html`<${Boton} tipo="fantasma" onClick=${cerrar}>Cancelar<//><${Boton} tipo="primario" onClick=${crear}>Crear y empezar a enviar (${sel.length})<//>`}>
    <div class="form"><${Entrada} etiqueta="Nombre de la campaña" ...${b(f, set, "nombre")} />
      <${Selector} etiqueta="Plantilla" opciones=${pls.filter(p => !["respuesta", "business"].includes(p.categoria)).map(p => ({ v: p.clave || p.id, n: p.nombre }))} valor=${f.plantilla} cambiar=${v => { const p = pls.find(x => (x.clave || x.id) === v); set({ plantilla: v, mensaje: p ? p.texto : f.mensaje }); }} />
      <${Area} etiqueta="Mensaje" filas=${5} ...${b(f, set, "mensaje")} ayuda="{nombre}, {placa}, {fecha} (próximo horario libre), {codigo} y {portal} se cambian solos para cada cliente." />
      ${ejemplo && html`<div class="panel"><p class="nota">Así le llega a ${lista[0].nombre}:</p><p style="white-space:pre-wrap;margin-top:6px">${ejemplo}</p></div>`}
      <div class="grupo">${lista.map(c => html`<div class="fila compacta"><${Check} si=${sel.includes(c.id)} cambiar=${v => setSel(v ? [...sel, c.id] : sel.filter(x => x !== c.id))} /><span class="cuerpo"><span class="t">${nombreDe(c)}</span><span class="s">${N.perfil(c.id).ultima ? "Última vez " + relativa(N.perfil(c.id).ultima) : ""}</span></span></div>`)}</div>
    </div><//>`;
}
function Envio({ id }) {
  const c = D.uno("campanas", id);
  if (!c) return html`<${Vacio} titulo="No encuentro esta campaña"><${Boton} href="#/campanas">Volver<//><//>`;
  const ds = c.destinatarios || [], env = ds.filter(x => x.enviado).length;
  const enviar = i => {
    const d = ds[i], cli = D.uno("clientes", d.clienteId);
    if (!enviarWa(d.tel, N.mensaje(c.mensaje, cli ? N.varsCliente(cli) : { nombre: d.nombre.split(" ")[0] }))) return;
    const nuevos = ds.map((x, j) => (j === i ? Object.assign({}, x, { enviado: Date.now() }) : x));
    D.cambiar("campanas", c.id, { destinatarios: nuevos, estado: nuevos.every(x => x.enviado) ? "terminada" : "enviando" });
  };
  const sig = ds.findIndex(x => !x.enviado);
  return html`<div class="dia-cab"><${Boton} icono="chevron-left" href="#/campanas">Campañas<//><h2>${c.nombre}</h2></div>
    <div class="panel" style="margin-bottom:16px"><div style="display:flex;justify-content:space-between;margin-bottom:8px"><b>${env} de ${ds.length} enviados</b>${sig >= 0 && html`<${Boton} tipo="primario" icono="send" onClick=${() => enviar(sig)}>Enviar al siguiente: ${ds[sig].nombre.split(" ")[0]}<//>`}</div>
      <${Progreso} v=${env} max=${ds.length || 1} c=${env === ds.length ? "verde" : ""} /><p class="nota" style="margin-top:8px">Se abre WhatsApp con el mensaje listo. Lo envías y vuelves aquí para el siguiente.</p></div>
    <div class="grupo">${ds.map((d, i) => html`<div class=${clases("fila", d.enviado && "hecha")}><span class="cuerpo"><span class="t">${d.nombre}</span><span class="s">${d.enviado ? "Enviado " + hace(d.enviado) : "Pendiente"}</span></span>
      <span class="der"><${Boton} chico tipo=${d.enviado ? "fantasma" : ""} icono="message-circle" onClick=${() => enviar(i)}>${d.enviado ? "Otra vez" : "Enviar"}<//></span></div>`)}</div>`;
}

function Plantillas() {
  const [ed, setEd] = useState(null);
  const pls = todasPlantillas(), cats = { agenda: "Agenda", ordenes: "Órdenes", comercial: "Ventas", campana: "Campañas", otra: "Otras" };
  return html`<div class="filtros"><p class="tenue" style="flex:1">Los mensajes que usa la app. Cámbialos a tu forma de hablar.</p><${Boton} tipo="primario" icono="plus" onClick=${() => setEd({ categoria: "otra" })}>Nueva plantilla<//></div>
    ${Object.keys(cats).map(k => { const l = pls.filter(p => (p.categoria || "otra") === k); return l.length ? html`<${Bloque} titulo=${cats[k]}><div class="grupo">${l.map(p => html`<${Fila} icono="message-square-text" titulo=${p.nombre} sub=${p.texto} der=${p.id ? html`<${Insignia} c="oro" sinPunto>Tuya<//>` : null} onClick=${() => setEd(p)} />`)}</div><//>` : null; })}
    ${ed && html`<${FormPlantilla} p=${ed} cerrar=${() => setEd(null)} />`}`;
}
function FormPlantilla({ p, cerrar }) {
  const [f, set] = useFicha(Object.assign({ nombre: "", categoria: "otra", texto: "" }, p));
  const base = p.clave && PLANTILLAS.find(x => x.clave === p.clave);
  const guardar = () => { if (!f.nombre || !f.texto) return aviso("Escribe el nombre y el texto.", { error: true }); D.guardar("plantillas", f); aviso("Plantilla guardada."); cerrar(); };
  const restaurar = async () => { if (p.id && (await confirmar({ titulo: base ? "Volver al mensaje original" : "Eliminar plantilla", si: base ? "Restaurar" : "Eliminar", peligro: !base }))) { D.borrar("plantillas", p.id); cerrar(); } };
  return html`<${Hoja} titulo=${p.nombre || "Nueva plantilla"} cerrar=${cerrar} pie=${html`${p.id && html`<${Boton} tipo="fantasma" onClick=${restaurar}>${base ? "Restaurar original" : "Eliminar"}<//>`}<${Boton} tipo="fantasma" onClick=${cerrar}>Cancelar<//><${Boton} tipo="primario" onClick=${guardar}>Guardar<//>`}>
    <div class="form"><${Entrada} etiqueta="Nombre" ...${b(f, set, "nombre")} />
      <${Area} etiqueta="Mensaje" filas=${7} ...${b(f, set, "texto")} ayuda=${p.categoria === "respuesta" || p.categoria === "business" ? "Variables: {precios} {paquetes} {libre} {zonas} {web} {tamanos} {pagos} {planes} {negocio}" : "Variables: {nombre} {negocio} {fecha} {hora} {servicio} {total} {direccion} {adelanto} {yape} {placa} {codigo} {portal} {resena}"} />
      <div class="panel"><p class="nota">Vista previa</p><p style="white-space:pre-wrap;margin-top:6px">${p.categoria === "respuesta" || p.categoria === "business" ? textoRespuesta(f) : rellenar(f.texto, { nombre: "Carla", negocio: N.nombreNegocio(), fecha: "martes 4 de noviembre", hora: "10:00", servicio: "Lavado completo", total: "S/ 45", direccion: "Calle Los Arces 123", adelanto: "S/ 15", yape: (N.negocio().yape || {}).numero || "987654321", placa: "V1K-121", codigo: "CARLA7X", portal: "(enlace personal)", resena: N.negocio().google || "(enlace de Google)" })}</p></div></div><//>`;
}

// ---------------------------------------------------------------- respuestas rápidas (con tus precios actuales)
export const respuestas = () => todasPlantillas().filter(p => p.categoria === "respuesta");
export function textoRespuesta(p, extra = {}) { return N.mensaje(p.texto, Object.assign(N.varsRespuesta(), extra)); }
function Respuestas() {
  const [ed, setEd] = useState(null);
  const rs = respuestas(), wb = todasPlantillas().filter(p => p.categoria === "business");
  const tarjeta = p => { const t = textoRespuesta(p); return html`<div class="panel" style="margin-bottom:10px">
    <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px"><b style="flex:1">${p.nombre}</b>${p.id && html`<${Insignia} c="oro" sinPunto>Tuya<//>`}<${Boton} chico tipo="fantasma" icono="pencil" titulo="Editar" onClick=${() => setEd(p)} /></div>
    <p style="white-space:pre-wrap;font-size:14.5px" class="tenue">${t}</p>
    <div class="btns" style="margin-top:10px"><${Boton} chico icono="copy" onClick=${async () => { await copiar(t); aviso("Copiado. Pégalo en el chat."); }}>Copiar<//><${Boton} chico icono="message-circle" href=${"https://wa.me/?text=" + encodeURIComponent(t)}>Enviar por WhatsApp<//></div></div>`; };
  return html`<${AvisoLinea} c="oro" icono="zap">Responde en menos de una hora: es cuando más se cierra (Oldroyd, HBR 2011). Los precios, paquetes y horas libres se llenan solos con lo que tienes en la app; si cambias un precio, la respuesta cambia sola.<//>
    <div class="columnas" style="margin-top:16px"><div><${Bloque} titulo="Respuestas para consultas">${rs.map(tarjeta)}<//></div>
    <div><${Bloque} titulo="Para tu WhatsApp Business" sub="Gratis, desde tu celular"><div class="panel" style="margin-bottom:10px"><p class="tenue chico">En WhatsApp Business ve a <b>Herramientas para la empresa</b>. Ahí pega estos textos en <b>Mensaje de bienvenida</b> y <b>Mensaje de ausencia</b>. En <b>Respuestas rápidas</b> crea atajos como /precios con las respuestas de la izquierda.</p></div>${wb.map(tarjeta)}<//></div></div>
    ${ed && html`<${FormPlantilla} p=${ed} cerrar=${() => setEd(null)} />`}`;
}

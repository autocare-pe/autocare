// AUTOCARE · Mi día: lo que toca hoy, en orden, según tu puesto (campo u oficina).
import { html, useState } from "../../vendor/preact-htm.js";
import * as D from "../datos.js";
import * as N from "../negocio.js";
import { ir, usarTitulo, menuCrear, abrir } from "../app.js";
import { Boton, Icono, Fila, Insignia, Resumen, Bloque, Vacio, Progreso, Segmentos, aviso, preguntar } from "../ui.js";
import { FilaCita } from "./agenda.js";
import { progresoArranque } from "./arranque.js";
import { enviarWa } from "../piezas.js";
import { AREAS, ESTADOS } from "../esquema.js";
import { hoy, sumarDias, inicioSemana, fechaLarga, relativa, soles, hace, horaDe, minutos, duracion, nombreDe, primerNombre, suma, mesDe, sumarMeses, inicioMes, n0, mapa, clases } from "../util.js";

// «Mi día»: una pantalla para cada puesto (Alan Cooper, About Face: se diseña para la persona y su meta).
// Campo: una secuencia lineal, un paso a la vez y un solo botón al alcance del pulgar (trabajo estándar de Toyota;
// Wroblewski, Mobile First; Hoober: la mitad usa el celular con una mano). Oficina: prioridades numeradas, rotuladas y
// desplegables (Covey: urgente e importante; Newport: bloques de tiempo; Allen: la siguiente acción).
// El puesto sale de tus áreas (Configuración → Usuarios); si haces los dos, cambias con un toque.
const leerLS = (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } };
const ponerLS = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } };
export default function Inicio() {
  D.useDatos();
  usarTitulo("Mi día");
  const H = hoy(), u = D.yo() || {}, pu = N.puestos(), ambos = pu.campo && pu.oficina;
  const m = N.modoTrabajo(), cambiar = v => N.fijarModo(v);
  const hora = Number(horaDe(Date.now()).slice(0, 2));
  const saludo = hora < 12 ? "Buenos días" : hora < 19 ? "Buenas tardes" : "Buenas noches";
  return html`<header class="pagina-cab dia-cab"><div><h1>${saludo}, ${primerNombre(u) || u.nombre}</h1><p>${fechaLarga(H).replace(/^./, x => x.toUpperCase())}</p></div>
      ${ambos && html`<div class="acciones"><${Segmentos} valor=${m} cambiar=${cambiar} opciones=${[{ v: "campo", n: "En campo" }, { v: "oficina", n: "En oficina" }]} /></div>`}</header>
    ${m === "campo" ? html`<${DiaCampo} />` : html`<${DiaOficina} />`}
    <${ParaEmpezar} />`;
}

// ---------------------------------------------------------------- gráficos del día (Tufte: datos, no adornos)
const ETAPA = { recepcion: "Recepción", proceso: "Trabajo", calidad: "Calidad", listo: "Entrega", entregado: "Entregado" };
function estadoCita(c) {
  const o = c.ordenId ? D.uno("ordenes", c.ordenId) : D.lista("ordenes").find(x => x.citaId === c.id);
  if (c.estado === "completada" || (o && o.estado === "entregado")) return { k: "hecho", o, t: "Entregado" };
  if (o && o.estado !== "anulado") return { k: "curso", o, t: ETAPA[o.estado] || "En curso" };
  if (c.camino) return { k: "camino", o: null, t: "En camino" };
  return { k: "pend", o: null, t: c.estado === "solicitada" ? "Por confirmar" : "Pendiente" };
}
/** Línea de tiempo del día: cada servicio en su hora, con la marca de «ahora» */
export function LineaDia({ citas, titulo }) {
  if (!citas.length) return null;
  const ini = Math.min(8 * 60, ...citas.map(c => minutos(c.hora || "08:00"))), fin = Math.max(18 * 60, ...citas.map(c => minutos(c.hora || "08:00") + (n0(c.minutos) || 60)));
  const pct = mm => ((mm - ini) / (fin - ini)) * 100, ahora = minutos(horaDe(Date.now()));
  const horas = []; for (let hh = Math.ceil(ini / 60); hh * 60 <= fin; hh += 2) horas.push(hh);
  const NOMBRE = { hecho: "entregado", curso: "en servicio", camino: "en camino", pend: "pendiente" };
  // Tufte: una sola línea de tiempo, colores con significado, sin adornos. HTML (no SVG) para que el texto se lea en el celular.
  return html`<figure class="linea-dia" aria-label=${titulo || "Tu día"}>
    <div class="ld-pista">
      ${citas.map(c => { const e = estadoCita(c), a = pct(minutos(c.hora || "08:00")), w = Math.max(4, pct(minutos(c.hora || "08:00") + (n0(c.minutos) || 60)) - a);
        return html`<span class=${"ld-bar ld-" + e.k} style=${{ left: a + "%", width: w + "%" }} title=${(c.hora || "") + " · " + (c._cliente || "") + " · " + NOMBRE[e.k]}><b>${c.hora || ""}</b><small>${primerNombre({ nombre: c._cliente })}</small></span>`; })}
      ${ahora >= ini && ahora <= fin && html`<i class="ld-ahora" style=${{ left: pct(ahora) + "%" }} aria-label="Ahora"></i>`}
    </div>
    <div class="ld-horas" aria-hidden="true">${horas.map(hh => { const p = pct(hh * 60); return html`<span style=${{ left: p + "%", transform: p < 4 ? "none" : p > 96 ? "translateX(-100%)" : "translateX(-50%)" }}>${hh}:00</span>`; })}</div>
  </figure>`;
}
/** Anillo de avance */
export function Anillo({ v, max, t }) {
  const r = 26, C = 2 * Math.PI * r, p = max ? Math.min(1, v / max) : 0;
  return html`<div class="anillo" role="img" aria-label=${`${v} de ${max} ${t || ""}`}><svg viewBox="0 0 64 64"><circle cx="32" cy="32" r=${r} class="an-fondo" /><circle cx="32" cy="32" r=${r} class="an-valor" style=${{ strokeDasharray: C, strokeDashoffset: C * (1 - p) }} /></svg>
    <span><b>${v}</b><small>de ${max}</small></span></div>`;
}

// ---------------------------------------------------------------- campo: antes de salir → cada servicio → cierre
function kitDelDia(citas) {
  const uso = {};
  citas.filter(N.citaActiva).forEach(c => N.consumoDeServicios(N.itemsDeServicios(c.servicios, c.tamano)).forEach(x => { uso[x.productoId] = (uso[x.productoId] || 0) + n0(x.usos); }));
  return Object.keys(uso).map(id => { const p = D.uno("productos", id); if (!p) return null; const disp = n0(p.stock) * (n0(p.rinde) || 1); return { id, n: p.nombre, usos: Math.round(uso[id] * 10) / 10, disp, falta: disp < uso[id] }; }).filter(Boolean);
}
function DiaCampo() {
  const H = hoy(), citas = N.citasDelDia(H).filter(c => N.citaActiva(c) || c.estado === "completada");
  const [kit, setKit] = useState(() => leerLS("autocare.kit." + H, {})), [cierre, setCierre] = useState(() => leerLS("autocare.cierre." + H, false));
  const marcarKit = (k, v) => { const n = Object.assign({}, kit, { [k]: v }); setKit(n); ponerLS("autocare.kit." + H, n); };
  const insumos = kitDelDia(citas), equipos = D.lista("activos").filter(a => ["equipo", "herramienta"].includes(a.tipo) && a.estado !== "baja").slice(0, 8);
  const items = [...insumos.map(x => ({ k: "p" + x.id, n: x.n, d: x.falta ? `Necesitas ${x.usos} usos y quedan ${Math.floor(x.disp)}: avisa a la oficina` : `${x.usos} ${x.usos === 1 ? "uso" : "usos"} para hoy`, falta: x.falta })),
    ...equipos.map(a => ({ k: "a" + a.id, n: a.nombre, d: "Cargado y funcionando" })), { k: "comb", n: "Combustible y agua", d: rutaHoy(citas) }];
  // Goldratt: si la batería es el cuello de botella, que se vea antes de salir
  const porCarga = n0(N.horario().autosCarga), pend = citas.filter(c => c.estado !== "completada").length;
  if (porCarga > 0 && pend > 0) items.unshift({ k: "bat", n: pend > porCarga ? `Baterías: ${pend} autos hoy, una carga rinde ${porCarga}` : "Baterías cargadas", d: pend > porCarga ? "Lleva batería extra o carga en el auto entre servicios" : `Hoy tienes ${pend} ${pend === 1 ? "auto" : "autos"}; una carga alcanza`, falta: pend > porCarga });
  const kitListo = !!kit.listo || (items.length > 0 && items.every(i => kit[i.k]));
  const est = citas.map(c => Object.assign({ c }, estadoCita(c)));
  const hechos = est.filter(e => e.k === "hecho").length, actual = est.find(e => e.k !== "hecho");
  const pasos = 2 + citas.length, listos = (kitListo ? 1 : 0) + hechos + (cierre ? 1 : 0);
  const yoEnvio = N.soyWhatsapp(), porEnviar = yoEnvio ? N.bandeja() : [];
  const camino = c => {
    const cli = D.uno("clientes", c.clienteId);
    D.cambiar("citas", c.id, { camino: Date.now() });
    if (yoEnvio && cli && cli.tel) { enviarWa(cli.tel, N.mensaje("camino", N.varsCita(c))); D.cambiar("citas", c.id, { caminoEnviado: Date.now() }); }
    else { N.avisarA(N.idWhatsapp(), `🚗 <b>Va en camino</b> donde ${c._cliente || ""} (${c.hora || ""}). Avísale desde la app (Por enviar).`, "agenda/cita/" + c.id); aviso(N.nombreWhatsapp() + " le avisa que vas en camino."); }
  };
  const empezar = async c => { const m = await import("./ordenes.js"); const o = m.crearOrdenDesdeCita(c); ir("ordenes/" + o.id); };
  // la siguiente acción (Allen): siempre una, con su botón
  const sig = !citas.length ? null : !kitListo ? { t: "Preparar el kit", f: () => document.getElementById("paso-kit").scrollIntoView({ behavior: "smooth", block: "start" }) }
    : actual ? (actual.o ? { t: "Continuar: " + actual.t + " · " + primerNombre({ nombre: actual.c._cliente }), f: () => ir("ordenes/" + actual.o.id) }
      : actual.k === "camino" ? { t: "Llegué: empezar con " + primerNombre({ nombre: actual.c._cliente }), f: () => empezar(actual.c) }
      : { t: "Voy en camino donde " + primerNombre({ nombre: actual.c._cliente }) + " · " + (actual.c.hora || ""), f: () => camino(actual.c) })
    : !cierre ? { t: "Cerrar el día", f: () => document.getElementById("paso-cierre").scrollIntoView({ behavior: "smooth", block: "start" }) } : null;
  if (!citas.length) return html`<div class="panel al-dia"><b>Hoy no tienes servicios</b><p class="tenue">Revisa la agenda de mañana o ayuda a la oficina con lo que toca.</p><div class="btns" style="margin-top:10px"><${Boton} href="#/agenda" icono="calendar-days">Ver agenda<//></div></div>`;
  return html`<section class="dia-resumen panel"><${Anillo} v=${listos} max=${pasos} t="pasos" /><div style="flex:1;min-width:0"><b>${citas.length} ${citas.length === 1 ? "servicio" : "servicios"} hoy</b>
      <p class="tenue chico">${duracion(suma(citas, c => n0(c.minutos) || 60))} de trabajo · ${hechos} ${hechos === 1 ? "entregado" : "entregados"}</p></div></section>
    <${LineaDia} citas=${citas} />
    ${porEnviar.length > 0 && html`<${Bloque} titulo=${"Por enviar al cliente (" + porEnviar.length + ")"}><div class="grupo">${porEnviar.map(x => html`<${FilaEnviar} m=${x} />`)}</div><//>`}
    <ol class="secuencia">
      <li id="paso-kit" class=${clases("sec-paso", kitListo ? "hecho" : "actual")}><span class="sec-n">${kitListo ? "✓" : "1"}</span><div class="sec-cuerpo">
        <p class="sec-etq">Antes de salir</p><h3>Prepara el kit del día</h3>
        ${!kitListo ? html`<div class="kit">${items.map(i => html`<label class=${clases("kit-it", kit[i.k] && "si", i.falta && "falta")}><input type="checkbox" checked=${!!kit[i.k]} onChange=${e => marcarKit(i.k, e.currentTarget.checked)} /><span><b>${i.n}</b><small>${i.d}</small></span></label>`)}</div>
          <div class="btns"><${Boton} tipo="primario" icono="check" onClick=${() => marcarKit("listo", true)}>Listo, salgo<//>${insumos.some(i => i.falta) && html`<${Boton} icono="bell" onClick=${() => { N.avisarA(D.responsable("logistica") || N.idWhatsapp(), "📦 <b>Faltan insumos</b> para hoy: " + insumos.filter(i => i.falta).map(i => i.n).join(", "), "inventario"); aviso("Le avisé a la oficina."); }}>Avisar lo que falta<//>`}</div>`
          : html`<p class="tenue chico">Kit listo. <button class="enlace-btn" onClick=${() => { setKit({}); ponerLS("autocare.kit." + H, {}); }}>Revisar otra vez</button></p>`}</div></li>
      ${est.map((e, i) => html`<${PasoServicio} e=${e} n=${i + 2} actual=${kitListo && actual && actual.c.id === e.c.id} camino=${camino} empezar=${empezar} />`)}
      <li id="paso-cierre" class=${clases("sec-paso", cierre ? "hecho" : !actual && kitListo ? "actual" : "")}><span class="sec-n">${cierre ? "✓" : citas.length + 2}</span><div class="sec-cuerpo">
        <p class="sec-etq">Al terminar</p><h3>Cierra el día</h3>
        ${!cierre ? html`<ul class="cierre"><li>Cuenta el efectivo y revisa los Yape del día.</li><li>Registra combustible y otros gastos.</li><li>Avisa qué se acabó: la oficina lo compra (tú no pierdes tiempo en tiendas).</li></ul>
          <div class="btns"><${Boton} icono="receipt" onClick=${() => abrir(() => import("./finanzas.js"), "FormGasto", {})}>Registrar gasto<//><${Boton} icono="package" onClick=${async () => { const t = await preguntar({ titulo: "¿Qué se acabó o está por acabarse?", etiqueta: "Producto o equipo", si: "Avisar" }); if (t) { D.guardar("porComprar", { item: t, cant: 1, estado: "pendiente", tipo: "insumo", prioridad: 1, notas: "Lo pidió " + ((D.yo() || {}).nombre || "campo") }); N.avisarA(D.responsable("logistica") || N.idWhatsapp(), "📦 <b>Por comprar</b>: " + t, "inventario/comprar"); aviso("Anotado en Por comprar."); } }}>Avisar qué reponer<//>
            <${Boton} tipo="primario" icono="check" onClick=${() => { setCierre(true); ponerLS("autocare.cierre." + H, true); aviso("¡Buen trabajo hoy!"); }}>Día cerrado<//></div>` : html`<p class="tenue chico">¡Buen trabajo! Mañana: ${N.citasDelDia(sumarDias(H, 1)).filter(N.citaActiva).length} servicios.</p>`}</div></li>
    </ol>
    ${sig && html`<div class="siguiente-paso"><${Boton} tipo="primario" grande bloque icono="arrow-right" onClick=${sig.f}>${sig.t}<//></div>`}`;
}
const PASOS_SERV = ["ir", "recepcion", "proceso", "calidad", "listo"];
const N_PASO = { ir: "Ir", recepcion: "Recepción", proceso: "Trabajo", calidad: "Calidad", listo: "Entrega" };
function PasoServicio({ e, n, actual, camino, empezar }) {
  const c = e.c, o = e.o, k = e.k === "hecho" ? 5 : o ? Math.max(1, PASOS_SERV.indexOf(o.estado)) : 0;
  const cli = D.uno("clientes", c.clienteId);
  return html`<li class=${clases("sec-paso", e.k === "hecho" ? "hecho" : actual && "actual")}><span class="sec-n">${e.k === "hecho" ? "✓" : n}</span><div class="sec-cuerpo">
    <p class="sec-etq">${c.hora || ""} · ${e.t}</p><h3>${c._cliente || "Cliente"}</h3>
    <p class="tenue chico">${[c._servicios, c.direccion].filter(Boolean).join(" · ")}</p>
    ${(cli && (N.gustosTexto(cli) || cli.notas)) || c.nota ? html`<p class="sec-nota">💡 ${[c.nota, cli && N.gustosTexto(cli)].filter(Boolean).join(" · ")}</p>` : null}
    <div class="sec-mini">${PASOS_SERV.map((p, i) => html`<span class=${clases(i < k && "si", i === k && e.k !== "hecho" && "act")}>${N_PASO[p]}</span>`)}</div>
    ${actual && html`<div class="btns">${!o ? html`
        ${c.direccion && html`<a class="btn" href=${mapa(c.direccion, (N.negocio() || {}).distrito)} target="_blank" rel="noopener"><${Icono} n="navigation" />Cómo llegar<//>`}
        ${!c.camino && html`<${Boton} icono="send" onClick=${() => camino(c)}>Voy en camino<//>`}
        <${Boton} tipo="primario" icono="play" onClick=${() => empezar(c)}>Llegué: empezar<//>`
      : html`<${Boton} tipo="primario" icono="arrow-right" href=${"#/ordenes/" + o.id}>Continuar: ${e.t}<//>`}</div>`}
    ${e.k === "hecho" && o && html`<p class="tenue chico">Entregado${o.entregado ? " " + horaDe(o.entregado) : ""} · ${soles(o.total)}</p>`}</div></li>`;
}

// ---------------------------------------------------------------- oficina: prioridades numeradas y desplegables
function DiaOficina() {
  const H = hoy(), u = D.yo() || {}, manana = sumarDias(H, 1);
  const P = N.perfiles();
  const leads = D.puedeVer("leads") ? D.lista("leads").filter(l => l.etapa === "nuevo") : [];
  const solicitudes = D.lista("citas").filter(c => c.estado === "solicitada" && c.fecha >= H);
  const observaciones = D.lista("ordenes").filter(o => ["recepcion", "proceso", "calidad", "listo"].includes(o.estado) && ((o.recepcion || {}).cliente || {}).estado === "observacion");
  const yoEnvio = N.soyWhatsapp(), porEnviar = yoEnvio ? N.bandeja() : [];
  const caminos = yoEnvio ? N.caminosPorAvisar() : [];
  const verificar = D.puedeVer("pagos") ? N.pagosPorVerificar() : [];
  const adelantos = D.lista("citas").filter(c => c.fecha >= H && N.citaActiva(c) && n0(c.adelanto) > 0 && c.adelantoEstado !== "recibido");
  const porCobrar = N.porCobrar();
  const citasManana = N.citasDelDia(manana).filter(N.citaActiva), sinConfirmar = citasManana.filter(c => !c.clienteConfirmo && c.estado !== "solicitada");
  const faltaManana = kitDelDia(citasManana).filter(x => x.falta);
  const posts = D.puedeVer("contenido") ? D.lista("contenido").filter(c => c.fecha === H && ["borrador", "listo", "programado"].includes(c.estado)) : [];
  const cumple = D.lista("clientes").filter(c => c.cumple && String(c.cumple).slice(5) === H.slice(5));
  const tocan = D.lista("clientes").filter(c => c.acepta !== false && (P.get(c.id) || {}).seg === "toca" && !D.lista("citas").some(x => x.clienteId === c.id && x.fecha >= H && N.citaActiva(x))).slice(0, 5);
  const tareas = D.puedeVer("tareas") ? D.lista("tareas").filter(t => !t.hecho && t.fecha && t.fecha <= H && (!t.asignadoId || t.asignadoId === u.id)) : [];
  const porComprar = D.puedeVer("porComprar") ? D.lista("porComprar").filter(x => x.estado !== "comprado" && x.estado !== "hecho") : [];
  const bajos = D.puedeVer("productos") ? N.stockBajo() : [], alertas = D.puedeVer("activos") ? N.alertasActivos() : [];
  const citasHoy = N.citasDelDia(H).filter(c => N.citaActiva(c) || c.estado === "completada");
  const W = (tel, txt) => e => { e.preventDefault(); enviarWa(tel, txt); };
  const bloques = [
    { n: 1, id: "responder", t: "Responder", cuando: "Ya · en menos de 1 hora", i: "message-circle", d: "Quien responde primero, cierra (HBR: 7 veces más si es en la primera hora).", filas: [
      ...observaciones.map(o => html`<${Fila} icono="circle-alert" colorIcono="ambar" titulo=${"Observación de " + o._cliente} sub=${"«" + ((o.recepcion.cliente || {}).texto || "") + "»"} href=${"#/ordenes/" + o.id} flecha multi />`),
      ...leads.map(l => html`<${Fila} icono="message-circle" colorIcono=${(Date.now() - (l.creado || Date.now())) > 3600000 ? "rojo" : "ambar"} titulo=${"Consulta de " + l.nombre} sub=${(l.interes || l.canal || "") + " · llegó " + hace(l.creado)} href=${"#/ventas/lead/" + l.id} flecha />`),
      solicitudes.length > 0 && html`<${Fila} icono="calendar-clock" colorIcono="ambar" titulo=${solicitudes.length + (solicitudes.length === 1 ? " reserva web por confirmar" : " reservas web por confirmar")} sub="Confírmalas y pide el adelanto si toca" href="#/agenda?vista=confirmar" flecha />`].filter(Boolean) },
    { n: 2, id: "servicio", t: "Acompañar el servicio", cuando: "Mientras haya autos en servicio", i: "car", d: "Los mensajes que el campo deja listos: un toque y salen por WhatsApp.", filas: [
      ...caminos.map(c => { const cli = D.uno("clientes", c.clienteId); return html`<${Fila} icono="navigation" colorIcono="oro" titulo=${"Avisar que va en camino · " + (c._cliente || "")} sub=${(c.hora || "") + " · salió " + hace(c.camino)} href=${"#/agenda/cita/" + c.id}
        der=${cli && cli.tel && html`<${Boton} chico tipo="primario" icono="send" onClick=${e => { W(cli.tel, N.mensaje("camino", N.varsCita(c)))(e); D.cambiar("citas", c.id, { caminoEnviado: Date.now() }); }}>Enviar<//>`} />`; }),
      ...porEnviar.map(x => html`<${FilaEnviar} m=${x} />`)] },
    { n: 3, id: "cobros", t: "Cobros", cuando: "Antes del mediodía", i: "banknote", d: "El dinero que no se verifica hoy, se pierde de vista.", filas: [
      verificar.length > 0 && html`<${Fila} icono="shield-check" colorIcono="ambar" titulo=${verificar.length + (verificar.length === 1 ? " cobro por verificar" : " cobros por verificar")} sub=${soles(suma(verificar, "monto")) + " · confirma que llegó a la cuenta"} href="#/finanzas/verificar" flecha />`,
      ...adelantos.slice(0, 4).map(c => html`<${Fila} icono="banknote" colorIcono="ambar" titulo=${"Adelanto de " + c._cliente} sub=${"Cita " + relativa(c.fecha) + " · aún no llega"} der=${html`<b class="cifra">${soles(c.adelanto)}</b>`} href=${"#/agenda/cita/" + c.id} />`),
      ...porCobrar.slice(0, 5).map(x => html`<${Fila} icono="banknote" colorIcono="rojo" titulo=${"Cobrar a " + x.o._cliente} sub=${(x.o.numero || "") + " · " + relativa(x.o.fecha)} der=${html`<b class="cifra">${soles(x.s.saldo)}</b>`} href=${"#/ordenes/" + x.o.id} />`)].filter(Boolean) },
    { n: 4, id: "manana", t: "Preparar mañana", cuando: "Desde las 4 pm", i: "calendar-check", d: "Confirmar hoy evita viajes perdidos mañana.", filas: [
      ...sinConfirmar.map(c => { const cli = D.uno("clientes", c.clienteId); return html`<${Fila} icono="calendar-check" colorIcono="azul" titulo=${"Recordar a " + c._cliente} sub=${"Mañana " + c.hora + " · aún no confirma"} href=${"#/agenda/cita/" + c.id}
        der=${cli && cli.tel && html`<${Boton} chico icono="message-circle" onClick=${W(cli.tel, N.mensaje("recordatorio", N.varsCita(c)))}>Recordar<//>`} />`; }),
      faltaManana.length > 0 && html`<${Fila} icono="package" colorIcono="rojo" titulo=${"Para mañana falta: " + faltaManana.map(x => x.n).join(", ")} sub="Cómpralo hoy o avisa al campo" href="#/inventario" flecha multi />`,
      citasManana.length > 0 && !sinConfirmar.length && html`<${Fila} icono="truck" colorIcono="verde" titulo=${"Mañana: " + citasManana.length + (citasManana.length === 1 ? " servicio confirmado" : " servicios confirmados")} sub=${citasManana.map(c => c.hora + " " + primerNombre({ nombre: c._cliente })).slice(0, 4).join(" · ")} href="#/agenda" flecha />`].filter(Boolean) },
    { n: 5, id: "crecer", t: "Hacer crecer", cuando: "Un bloque de 30 minutos", i: "megaphone", d: "Lo importante que no es urgente (Covey): publicar y volver a escribir a quien ya te conoce.", filas: [
      ...posts.map(c => html`<${Fila} icono="megaphone" colorIcono="violeta" titulo=${"Publicar hoy: " + (c.titulo || "publicación")} sub=${(ESTADOS.contenido[c.estado] || {}).n || ""} href=${"#/marketing/contenido/" + c.id} flecha />`),
      ...cumple.map(c => html`<${Fila} icono="cake" colorIcono="oro" titulo=${"Cumpleaños de " + nombreDe(c)} sub="Un saludo hoy vale más que una promoción" der=${c.tel && html`<${Boton} chico icono="message-circle" onClick=${W(c.tel, N.mensaje("cumple", N.varsCliente(c)))}>Saludar<//>`} />`),
      ...tareas.slice(0, 5).map(t => html`<${Fila} icono="list-checks" colorIcono=${t.fecha < H ? "rojo" : "azul"} titulo=${t.titulo} sub=${t.fecha < H ? "Atrasado desde " + relativa(t.fecha) : "Para hoy" + (t.hora ? " a las " + t.hora : "")} href="#/ventas/seguimientos" flecha />`),
      ...tocan.map(c => { const p = P.get(c.id); return html`<${Fila} avatar=${nombreDe(c)} titulo=${"Le toca volver: " + nombreDe(c)} sub=${"Última vez " + relativa(p.ultima)} href=${"#/clientes/" + c.id}
        der=${c.tel && html`<${Boton} chico icono="message-circle" onClick=${W(c.tel, N.mensaje("volver", N.varsCliente(c)))}>Escribir<//>`} />`; })] },
    { n: 6, id: "compras", t: "Compras y logística", cuando: "Al final del día", i: "package", d: "En un solo bloque, para no cortar la atención al cliente.", filas: [
      porComprar.length > 0 && html`<${Fila} icono="shopping-cart" colorIcono="ambar" titulo=${porComprar.length + (porComprar.length === 1 ? " cosa por comprar" : " cosas por comprar")} sub=${porComprar.slice(0, 3).map(x => x.item).join(", ")} href="#/inventario/comprar" flecha multi />`,
      bajos.length > 0 && html`<${Fila} icono="package" colorIcono="ambar" titulo=${bajos.length + (bajos.length === 1 ? " producto por reponer" : " productos por reponer")} sub=${bajos.slice(0, 3).map(p => p.nombre).join(", ")} href="#/inventario" flecha />`,
      ...alertas.slice(0, 3).map(a => html`<${Fila} icono="wrench" colorIcono="ambar" titulo=${a.txt} sub=${a.a.nombre + " · " + relativa(a.fecha)} href="#/activos" flecha />`)].filter(Boolean) }];
  const total = bloques.reduce((a, b) => a + b.filas.length, 0), primero = bloques.find(b => b.filas.length);
  const enCurso = citasHoy.map(c => Object.assign({ c }, estadoCita(c))).filter(e => e.k === "curso" || e.k === "camino");
  const fin = D.puede("finanzas"), pagos = D.lista("pagos"), cobradoHoy = suma(pagos.filter(p => p.fecha === H), "monto");
  return html`<section class="dia-resumen panel"><${Anillo} v=${bloques.filter(b => !b.filas.length).length} max=${bloques.length} t="bloques al día" />
      <div style="flex:1;min-width:0"><b>${total ? `${total} ${total === 1 ? "cosa" : "cosas"} por hacer` : "Todo al día ✓"}</b>
        <p class="tenue chico">${primero ? "Empieza por: " + primero.n + ". " + primero.t : "Buen momento para escribirles a los que les toca volver."}${fin ? " · Cobrado hoy " + soles(cobradoHoy) : ""}</p></div></section>
    ${citasHoy.length > 0 && html`<section class="campo-vivo"><p class="campo-t">Así va el campo hoy</p><${LineaDia} citas=${citasHoy} titulo="El campo hoy" />
      ${enCurso.length > 0 && html`<div class="vivo">${enCurso.map(e => html`<a class="vivo-it" href=${e.o ? "#/ordenes/" + e.o.id : "#/agenda/cita/" + e.c.id}><span class="pulso"></span><b>${primerNombre({ nombre: e.c._cliente })}</b> ${e.t}</a>`)}</div>`}</section>`}
    <div class="prioridades">${bloques.map(b => html`<details class=${clases("prioridad", !b.filas.length && "vacia")} open=${b.filas.length > 0 && (b === primero || b.n <= 2)}>
        <summary><span class="pr-n">${b.n}</span><span class="pr-t"><b>${b.t}</b><small>${b.cuando}</small></span>${b.filas.length ? html`<span class="pr-c">${b.filas.length}</span>` : html`<span class="pr-ok">✓</span>`}<${Icono} n="chevron-down" /></summary>
        <div class="pr-cuerpo">${b.filas.length ? html`<p class="nota">${b.d}</p><div class="grupo">${b.filas}</div>` : html`<p class="nota">Al día.</p>`}</div></details>`)}</div>`;
}

function FilaEnviar({ m }) {
  const o = m.o, cli = D.uno("clientes", o.clienteId);
  const enviar = e => { e.preventDefault(); enviarWa(cli.tel, N.textoMensaje(o, m)); N.marcarEnviado(o, m.k); aviso("Marcado como enviado.", { accion: { n: "Deshacer", f: () => N.marcarEnviado(o, m.k, 0) } }); };
  return html`<${Fila} icono=${m.i} colorIcono="oro" titulo=${m.n + " · " + (o._cliente || "")} sub=${[String(o._vehiculo || "").replace(/\s*\(.*\)$/, ""), m.k === "recepcion" && (o.recepcion || {}).porEnviar ? "la pasó " + hace(o.recepcion.porEnviar) : o.act ? hace(o.act) : ""].filter(Boolean).join(" · ")}
    href=${"#/ordenes/" + o.id} der=${html`<${Boton} chico tipo="primario" icono="send" onClick=${enviar}>Enviar<//>`} />`;
}

// Puesta en marcha: mientras falte configurar algo, un solo botón lleva al paso a paso (Krug: un camino claro).
// Krug: lo importante de hoy va primero; configurar y practicar, abajo y compacto (se abren con un toque)
function ParaEmpezar() {
  const em = D.puede("config", 2) && EnMarcha(), pr = D.enPractica() && Practica();
  if (!em && !pr) return null;
  return html`<section class="para-empezar"><p class="sec-etq">Para empezar · cuando tengas un rato</p>${em}${pr}</section>`;
}
function EnMarcha() {
  const p = progresoArranque();
  if (p.completo || p.oculto) return null;
  const ocultar = e => { e.preventDefault(); D.fijarAjuste("arranque", Object.assign({}, D.ajuste("arranque", {}) || {}, { oculto: true })); };
  return html`<div class="empezar-fila"><span class="ico oro"><${Icono} n="flag" /></span>
    <div class="ef-cuerpo"><b>Pon tu negocio en marcha</b><small>${p.listos} de ${p.total} pasos · unos 10 minutos</small><${Progreso} v=${p.listos} max=${p.total} /></div>
    <${Boton} chico tipo="primario" href="#/arranque">${p.listos ? "Seguir" : "Empezar"}<//><${Boton} tipo="fantasma" chico icono="x" titulo="Ocultar (sigue en Configuración y Ayuda)" onClick=${ocultar} /></div>`;
}

// Aprender haciendo: un servicio completo de práctica, paso a paso. Cada paso se marca solo cuando lo haces.
function Practica() {
  const mio = e => D.lista(e).filter(r => r.prueba && !r.ejemplo);
  const hizo = k => { try { return !!localStorage.getItem("autocare.hizo." + k); } catch (e) { return false; } };
  const ots = mio("ordenes");
  const pasos = [
    { t: "Crea un cliente con su auto", d: "+ → Nuevo cliente. Ponle un nombre falso y agrega su vehículo.", ok: mio("clientes").length > 0, f: () => menuCrear() },
    { t: "Agenda una cita para hoy", d: "+ → Nueva cita: elige el cliente, el servicio y una hora libre.", ok: mio("citas").length > 0, ir: "agenda" },
    { t: "Empieza el servicio y haz la recepción", d: "Abre la cita → «Empezar servicio». Marca un rayón, toma una foto y firma.", ok: ots.some(o => o.estado !== "recepcion" || (o.recepcion && (o.recepcion.items || []).length)), ir: "agenda" },
    { t: "Termina: calidad, cobro y entrega", d: "En la orden: marca los pasos, pasa a calidad, cobra con Yape y entrega.", ok: ots.some(o => o.estado === "entregado") && mio("pagos").length > 0, ir: "ordenes" },
    { t: "Dale su tarjeta al cliente", d: "En la orden o en su ficha: «Darle su tarjeta». Mira el QR y su enlace.", ok: hizo("tarjeta"), ir: "clientes" },
    { t: "Anota una consulta y respóndela", d: "+ → Nueva consulta. Ábrela, toca «Responder» y muévela a «Contactado».", ok: mio("leads").some(l => l.etapa && l.etapa !== "nuevo"), ir: "ventas" },
    { t: "Registra un gasto y cierra la caja", d: "Finanzas → Gasto. Luego Caja del día → «Cerrar caja del día».", ok: mio("gastos").length > 0 && mio("cierres").length > 0, ir: "finanzas/caja" },
    { t: "Corrige y borra algo", d: "Mis datos → toca una lista → toca un dato → corrígelo o elimínalo.", ok: hizo("editor"), ir: "datos" }];
  const hechos = pasos.filter(p => p.ok).length;
  return html`<details class="empezar-fila practica"><summary><span class="ico"><${Icono} n="flask-conical" /></span>
    <div class="ef-cuerpo"><b>Aprende practicando</b><small>${hechos} de ${pasos.length} · toca para ver los pasos</small><${Progreso} v=${hechos} max=${pasos.length} /></div><${Icono} n="chevron-down" clase="pr-flecha" /></summary>
    <p class="tenue chico" style="margin:10px 0">Haz un servicio completo con datos falsos. Cada paso se marca solo. Al terminar, borra la práctica en Mis datos.</p>
    <div class="grupo">${pasos.map((p, i) => html`<${Fila} icono=${p.ok ? "circle-check" : "circle"} colorIcono=${p.ok ? "verde" : ""} titulo=${(i + 1) + ". " + p.t} sub=${p.ok ? "Hecho" : p.d}
      onClick=${() => (p.f ? p.f() : ir(p.ir))} flecha=${!p.ok} clase=${p.ok ? "hecha" : ""} multi />`)}</div>
    ${hechos === pasos.length && html`<div style="margin-top:12px"><${Boton} tipo="primario" icono="eraser" href="#/datos">¡Listo! Borrar la práctica<//></div>`}</details>`;
}

// Agua y gasolina para la ruta de hoy, según los autos que faltan
function rutaHoy(citas) {
  const n = citas.filter(c => c.estado !== "completada").length, agua = n0(N.horario().aguaAuto) * n, km = Math.round(n0(N.movil().km) * n);
  const t = [agua ? `~${agua} L de agua` : "", km ? `gasolina para ~${km} km` : ""].filter(Boolean).join(" · ");
  return t ? t + " (si agrupas citas por zona, menos)" : "Para toda la ruta de hoy";
}

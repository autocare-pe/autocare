// AUTOCARE · Inicio: lo que importa hoy, en orden.
// Primero lo urgente que trae dinero (reservas, consultas, cobros), luego lo que sostiene el negocio.
import { html } from "../../vendor/preact-htm.js";
import * as D from "../datos.js";
import * as N from "../negocio.js";
import { ir, usarTitulo, menuCrear } from "../app.js";
import { Boton, Icono, Fila, Insignia, Resumen, Bloque, Vacio, Progreso } from "../ui.js";
import { FilaCita } from "./agenda.js";
import { enviarWa } from "../piezas.js";
import { AREAS, ESTADOS } from "../esquema.js";
import { hoy, sumarDias, inicioSemana, fechaLarga, relativa, soles, hace, horaDe, minutos, duracion, nombreDe, primerNombre, suma, mesDe, sumarMeses, inicioMes, n0, mapa } from "../util.js";

export default function Inicio() {
  D.useDatos();
  usarTitulo("Inicio");
  const H = hoy(), u = D.yo() || {};
  const hora = Number(horaDe(Date.now()).slice(0, 2));
  const saludo = hora < 12 ? "Buenos días" : hora < 19 ? "Buenas tardes" : "Buenas noches";
  const citasHoy = N.citasDelDia(H).filter(c => N.citaActiva(c) || c.estado === "completada");
  const ahoraMin = minutos(horaDe(Date.now()));
  const proxima = citasHoy.find(c => N.citaActiva(c) && c.hora && minutos(c.hora) + (n0(c.minutos) || 60) > ahoraMin);
  const fin = D.puede("finanzas");
  const pagos = D.lista("pagos");
  const cobradoHoy = suma(pagos.filter(p => p.fecha === H), "monto");
  const semana = suma(pagos.filter(p => p.fecha >= inicioSemana(H) && p.fecha <= H), "monto");
  const mes = mesDe(H), ingMes = suma(pagos.filter(p => mesDe(p.fecha) === mes), "monto");
  const metaMes = n0((D.ajuste("metasKpi", {}) || {}).ingresos) || 0;
  const porCobrar = N.porCobrar();
  // pendientes del día
  const solicitudes = D.lista("citas").filter(c => c.estado === "solicitada" && c.fecha >= H);
  const leads = D.puedeVer("leads") ? D.lista("leads").filter(l => l.etapa === "nuevo") : [];
  const enCurso = D.lista("ordenes").filter(o => ["recepcion", "proceso", "calidad", "listo"].includes(o.estado));
  const tareas = D.puedeVer("tareas") ? D.lista("tareas").filter(t => !t.hecho && t.fecha && t.fecha <= H && (!t.asignadoId || t.asignadoId === u.id)) : [];
  const P = N.perfiles();
  const tocan = D.lista("clientes").filter(c => c.acepta !== false && (P.get(c.id) || {}).seg === "toca" && !D.lista("citas").some(x => x.clienteId === c.id && x.fecha >= H && N.citaActiva(x)));
  const bajos = D.puedeVer("productos") ? N.stockBajo() : [];
  const alertas = D.puedeVer("activos") ? N.alertasActivos() : [];
  const cap = N.capacidadDia(H), uso = N.cargaDia(H);
  // Cada persona ve primero lo de sus áreas (Configuración → Usuarios). Con socios, quien no está en el campo
  // tiene un «centro de control»: responder, cobrar, preparar mañana y marketing (Wickman: cada asiento, un dueño).
  const A = new Set(D.misAreas()), campo = A.has("campo"), manana = sumarDias(H, 1);
  const citasManana = N.citasDelDia(manana).filter(c => N.citaActiva(c));
  const sinConfirmar = citasManana.filter(c => !c.clienteConfirmo && c.estado !== "solicitada");
  const verificar = D.puedeVer("pagos") ? N.pagosPorVerificar() : [];
  const adelantos = D.lista("citas").filter(c => c.fecha >= H && N.citaActiva(c) && n0(c.adelanto) > 0 && c.adelantoEstado !== "recibido");
  const posts = D.puedeVer("contenido") ? D.lista("contenido").filter(c => c.fecha === H && ["borrador", "listo", "programado"].includes(c.estado)) : [];
  const cumple = D.lista("clientes").filter(c => c.cumple && String(c.cumple).slice(5) === H.slice(5));
  const F = {
    campo: [
      ...enCurso.map(o => html`<${Fila} icono="car" colorIcono="oro" titulo=${(o.numero || "Orden") + " · " + o._cliente} sub=${N.nombresItems(o.items)} der=${html`<${Insignia} c="oro">${{ recepcion: "Recepción", proceso: "En proceso", calidad: "Calidad", listo: "Listo" }[o.estado]}<//>`} href=${"#/ordenes/" + o.id} />`)],
    ventas: [
      solicitudes.length > 0 && html`<${Fila} icono="calendar-clock" colorIcono="ambar" titulo=${solicitudes.length + (solicitudes.length === 1 ? " reserva web por confirmar" : " reservas web por confirmar")} sub="Confírmalas pronto" href="#/agenda?vista=confirmar" flecha />`,
      ...leads.map(l => { const m = (Date.now() - (l.creado || Date.now())) / 60000; return html`<${Fila} icono="message-circle" colorIcono=${m > 60 ? "rojo" : "ambar"} titulo=${"Consulta de " + l.nombre} sub=${(l.interes || l.canal || "") + " · llegó " + hace(l.creado)} href=${"#/ventas/lead/" + l.id} flecha />`; }),
      ...sinConfirmar.map(c => { const cli = D.uno("clientes", c.clienteId); return html`<${Fila} icono="calendar-check" colorIcono="azul" titulo=${"Recordar a " + c._cliente} sub=${"Mañana " + c.hora + " · aún no confirma"} href=${"#/agenda/cita/" + c.id}
        der=${cli && cli.tel && html`<${Boton} chico icono="message-circle" onClick=${e => { e.preventDefault(); enviarWa(cli.tel, N.mensaje("recordatorio", N.varsCita(c))); }}>Recordar<//>`} />`; })],
    pagos: [
      verificar.length > 0 && html`<${Fila} icono="shield-check" colorIcono="ambar" titulo=${verificar.length + (verificar.length === 1 ? " cobro por verificar" : " cobros por verificar")} sub=${soles(suma(verificar, "monto")) + " · confirma que llegó a la cuenta"} href="#/finanzas/verificar" flecha />`,
      ...adelantos.slice(0, 4).map(c => html`<${Fila} icono="banknote" colorIcono="ambar" titulo=${"Adelanto de " + c._cliente} sub=${"Cita " + relativa(c.fecha) + " · aún no llega"} der=${html`<b class="cifra">${soles(c.adelanto)}</b>`} href=${"#/agenda/cita/" + c.id} />`),
      ...porCobrar.slice(0, 5).map(x => html`<${Fila} icono="banknote" colorIcono="rojo" titulo=${"Cobrar a " + x.o._cliente} sub=${(x.o.numero || "") + " · " + relativa(x.o.fecha)} der=${html`<b class="cifra">${soles(x.s.saldo)}</b>`} href=${"#/ordenes/" + x.o.id} />`)],
    logistica: [
      !campo && citasManana.length > 0 && html`<${Fila} icono="truck" colorIcono="azul" titulo=${"Mañana: " + citasManana.length + (citasManana.length === 1 ? " servicio" : " servicios")} sub=${citasManana.map(c => c.hora + " " + (c.direccion || c._cliente || "")).slice(0, 3).join(" · ")} href="#/agenda" flecha />`,
      bajos.length > 0 && html`<${Fila} icono="package" colorIcono="ambar" titulo=${bajos.length + (bajos.length === 1 ? " producto por reponer" : " productos por reponer")} sub=${bajos.slice(0, 3).map(p => p.nombre).join(", ")} href="#/inventario" flecha />`,
      ...alertas.slice(0, 3).map(a => html`<${Fila} icono="wrench" colorIcono="ambar" titulo=${a.txt} sub=${a.a.nombre + " · " + relativa(a.fecha)} href="#/activos" flecha />`)],
    marketing: [
      ...posts.map(c => html`<${Fila} icono="megaphone" colorIcono="violeta" titulo=${"Publicar hoy: " + (c.titulo || "publicación")} sub=${(ESTADOS.contenido[c.estado] || {}).n || ""} href=${"#/marketing/contenido/" + c.id} flecha />`),
      ...cumple.map(c => html`<${Fila} icono="cake" colorIcono="oro" titulo=${"Cumpleaños de " + nombreDe(c)} sub="Un saludo hoy vale más que una promoción" der=${c.tel && html`<${Boton} chico icono="message-circle" onClick=${e => { e.preventDefault(); enviarWa(c.tel, N.mensaje("cumple", N.varsCliente(c))); }}>Saludar<//>`} />`)]
  };
  const filasTareas = tareas.slice(0, 6).map(t => html`<${Fila} icono="list-checks" colorIcono=${t.fecha < H ? "rojo" : "azul"} titulo=${t.titulo} sub=${t.fecha < H ? "Atrasado desde " + relativa(t.fecha) : "Para hoy" + (t.hora ? " a las " + t.hora : "")} href="#/ventas/seguimientos" flecha />`);
  const orden = ["campo", "ventas", "pagos", "logistica", "marketing"].filter(a => A.has(a));
  const de = a => F[a].filter(Boolean);
  const todas = [...orden.flatMap(de), ...filasTareas];
  const AR = Object.fromEntries(AREAS.map(x => [x.v, x]));
  const resumenDinero = fin && html`<div style="margin-bottom:22px"><${Resumen} items=${[
      { n: "Cobrado hoy", v: soles(cobradoHoy) }, { n: "Esta semana", v: soles(semana) },
      { n: "Este mes", v: soles(ingMes), d: metaMes ? `${Math.round((ingMes / metaMes) * 100)}% de tu meta de ${soles(metaMes)}` : html`<a class="enlace" href="#/tablero">Ponte una meta</a>` },
      { n: "Por cobrar", v: soles(suma(porCobrar, x => x.s.saldo)), c: porCobrar.length ? "rojo" : "" }]} /></div>`;
  const agendaHoy = html`<${Bloque} titulo=${campo ? "Agenda de hoy" : "Agenda del equipo hoy"} der=${html`<a class="enlace" href="#/agenda">Ver agenda</a>`}>
      ${citasHoy.length ? html`<div class="grupo">${citasHoy.map(c => html`<${FilaCita} c=${c} />`)}</div>`
        : html`<div class="panel"><p class="tenue">Día libre. Buen momento para escribirles a los clientes que les toca volver${tocan.length ? ` (tienes ${tocan.length})` : ""}.</p></div>`}<//>`;
  const volver = A.has("marketing") && tocan.length > 0 && html`<${Bloque} titulo="Les toca volver" sub="La venta más fácil: ya te conocen" der=${html`<a class="enlace" href="#/clientes?seg=toca">Ver todos</a>`}>
      <div class="grupo">${tocan.slice(0, 5).map(c => { const p = P.get(c.id); return html`<${Fila} avatar=${nombreDe(c)} titulo=${nombreDe(c)} sub=${"Última vez " + relativa(p.ultima) + " · " + p.visitas + (p.visitas === 1 ? " visita" : " visitas")} href=${"#/clientes/" + c.id}
        der=${html`<${Boton} chico icono="message-circle" onClick=${e => { e.preventDefault(); enviarWa(c.tel, N.mensaje("volver", N.varsCliente(c))); }}>Escribir<//>`} />`; })}</div><//>`;
  const sub = campo ? `${fechaLarga(H).replace(/^./, x => x.toUpperCase())}. ${citasHoy.length ? `Tienes ${citasHoy.length} ${citasHoy.length === 1 ? "cita" : "citas"} hoy${cap ? `, ${Math.round((uso / cap) * 100)}% de tu día` : ""}.` : "Hoy no tienes citas."}`
    : `${fechaLarga(H).replace(/^./, x => x.toUpperCase())}. ${todas.length ? `Tienes ${todas.length} ${todas.length === 1 ? "cosa" : "cosas"} por resolver.` : "Todo al día."}`;
  const cab = html`<header class="pagina-cab"><div><h1>${saludo}, ${primerNombre(u) || u.nombre}</h1><p>${sub}</p></div></header>${D.enPractica() && html`<${Practica} />`}`;
  if (!campo) return html`${cab}${resumenDinero}
    <div class="columnas">
      <div>${orden.map(a => html`<${Bloque} titulo=${AR[a].n} sub=${de(a).length ? "" : "Al día"}>${de(a).length ? html`<div class="grupo">${de(a)}</div>` : html`<div class="panel"><p class="tenue">Nada pendiente aquí. ✓</p></div>`}<//>`)}
        ${filasTareas.length > 0 && html`<${Bloque} titulo="Tus seguimientos" der=${html`<a class="enlace" href="#/ventas/seguimientos">Ver todos</a>`}><div class="grupo">${filasTareas}</div><//>`}</div>
      <div>${agendaHoy}${volver}</div>
    </div>`;
  return html`${cab}${resumenDinero}
    <div class="columnas">
      <div>${proxima && html`<${Siguiente} c=${proxima} />`}${agendaHoy}${volver}</div>
      <div><${Bloque} titulo="Pendientes">
          ${!todas.length ? html`<div class="panel"><p class="tenue">Todo al día.</p></div>` : html`<div class="grupo">${todas}</div>`}<//></div>
    </div>`;
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
  return html`<section class="panel practica" style="margin-bottom:22px">
    <div style="display:flex;gap:10px;align-items:center;margin-bottom:6px"><${Icono} n="flask-conical" /><h3 style="flex:1">Aprende practicando · ${hechos} de ${pasos.length}</h3></div>
    <p class="tenue chico" style="margin-bottom:10px">Haz un servicio completo con datos falsos. Cada paso se marca solo. Al terminar, borra la práctica en Mis datos.</p>
    <${Progreso} v=${hechos} max=${pasos.length} />
    <div class="grupo" style="margin-top:12px">${pasos.map((p, i) => html`<${Fila} icono=${p.ok ? "circle-check" : "circle"} colorIcono=${p.ok ? "verde" : ""} titulo=${(i + 1) + ". " + p.t} sub=${p.ok ? "Hecho" : p.d}
      onClick=${() => (p.f ? p.f() : ir(p.ir))} flecha=${!p.ok} clase=${p.ok ? "hecha" : ""} multi />`)}</div>
    ${hechos === pasos.length && html`<div style="margin-top:12px"><${Boton} tipo="primario" icono="eraser" href="#/datos">¡Listo! Borrar la práctica<//></div>`}</section>`;
}

function Siguiente({ c }) {
  const cli = D.uno("clientes", c.clienteId);
  const falta = minutos(c.hora) - minutos(horaDe(Date.now()));
  return html`<div class="panel oro" style="margin-bottom:22px">
    <p class="tenue" style="font-weight:600">${falta > 0 ? `Tu próxima cita, en ${duracion(falta)}` : "En curso ahora"}</p>
    <div class="cifra-media" style="margin:6px 0 2px">${c.hora} · ${c._cliente}</div>
    <p>${c._servicios}${c.direccion ? " · " + c.direccion : ""}</p>
    <div class="btns" style="margin-top:14px">
      ${c.direccion && html`<a class="btn" style="background:#000;color:#fff;border-color:#000" href=${mapa(c.direccion, (N.negocio() || {}).distrito)} target="_blank" rel="noopener"><${Icono} n="navigation" />Cómo llegar</a>`}
      ${cli && html`<button class="btn" style="background:rgba(0,0,0,.08);border-color:rgba(0,0,0,.2);color:#000" onClick=${() => enviarWa(cli.tel, N.mensaje("camino", N.varsCita(c)))}><${Icono} n="message-circle" />Voy en camino</button>`}
      <button class="btn" style="background:rgba(0,0,0,.08);border-color:rgba(0,0,0,.2);color:#000" onClick=${() => ir("agenda/cita/" + c.id)}>Abrir</button>
    </div></div>`;
}

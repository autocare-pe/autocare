// AUTOCARE · Inicio: lo que importa hoy, en orden.
// Primero lo urgente que trae dinero (reservas, consultas, cobros), luego lo que sostiene el negocio.
import { html } from "../../vendor/preact-htm.js";
import * as D from "../datos.js";
import * as N from "../negocio.js";
import { ir, usarTitulo, menuCrear } from "../app.js";
import { Boton, Icono, Fila, Insignia, Resumen, Bloque, Vacio, Progreso } from "../ui.js";
import { FilaCita } from "./agenda.js";
import { enviarWa } from "../piezas.js";
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
  const tareas = D.puedeVer("tareas") ? D.lista("tareas").filter(t => !t.hecho && t.fecha && t.fecha <= H) : [];
  const P = N.perfiles();
  const tocan = D.lista("clientes").filter(c => c.acepta !== false && (P.get(c.id) || {}).seg === "toca" && !D.lista("citas").some(x => x.clienteId === c.id && x.fecha >= H && N.citaActiva(x)));
  const bajos = D.puedeVer("productos") ? N.stockBajo() : [];
  const alertas = D.puedeVer("activos") ? N.alertasActivos() : [];
  const cap = N.capacidadDia(H), uso = N.cargaDia(H);
  const nada = !solicitudes.length && !leads.length && !enCurso.length && !tareas.length && !porCobrar.length;
  return html`
    <header class="pagina-cab"><div><h1>${saludo}, ${primerNombre(u) || u.nombre}</h1><p>${fechaLarga(H).replace(/^./, x => x.toUpperCase())}. ${citasHoy.length ? `Tienes ${citasHoy.length} ${citasHoy.length === 1 ? "cita" : "citas"} hoy${cap ? `, ${Math.round((uso / cap) * 100)}% de tu día` : ""}.` : "Hoy no tienes citas."}</p></div></header>
    ${fin && html`<div style="margin-bottom:22px"><${Resumen} items=${[
      { n: "Cobrado hoy", v: soles(cobradoHoy) }, { n: "Esta semana", v: soles(semana) },
      { n: "Este mes", v: soles(ingMes), d: metaMes ? `${Math.round((ingMes / metaMes) * 100)}% de tu meta de ${soles(metaMes)}` : html`<a class="enlace" href="#/tablero">Ponte una meta</a>` },
      { n: "Por cobrar", v: soles(suma(porCobrar, x => x.s.saldo)), c: porCobrar.length ? "rojo" : "" }]} /></div>`}
    <div class="columnas">
      <div>
        ${proxima && html`<${Siguiente} c=${proxima} />`}
        <${Bloque} titulo="Agenda de hoy" der=${html`<a class="enlace" href="#/agenda">Ver agenda</a>`}>
          ${citasHoy.length ? html`<div class="grupo">${citasHoy.map(c => html`<${FilaCita} c=${c} />`)}</div>`
            : html`<div class="panel"><p class="tenue">Día libre. Buen momento para escribirles a los clientes que les toca volver${tocan.length ? ` (tienes ${tocan.length})` : ""}.</p></div>`}
        <//>
        ${tocan.length > 0 && html`<${Bloque} titulo="Les toca volver" sub="La venta más fácil: ya te conocen" der=${html`<a class="enlace" href="#/clientes?seg=toca">Ver todos</a>`}>
          <div class="grupo">${tocan.slice(0, 5).map(c => { const p = P.get(c.id); return html`<${Fila} avatar=${nombreDe(c)} titulo=${nombreDe(c)} sub=${"Última vez " + relativa(p.ultima) + " · " + p.visitas + (p.visitas === 1 ? " visita" : " visitas")} href=${"#/clientes/" + c.id}
            der=${html`<${Boton} chico icono="message-circle" onClick=${e => { e.preventDefault(); enviarWa(c.tel, N.mensaje("volver", N.varsCliente(c))); }}>Escribir<//>`} />`; })}</div><//>`}
      </div>
      <div>
        <${Bloque} titulo="Pendientes">
          ${nada && !bajos.length && !alertas.length ? html`<div class="panel"><p class="tenue">Todo al día.</p></div>` : html`<div class="grupo">
            ${solicitudes.length > 0 && html`<${Fila} icono="calendar-clock" colorIcono="ambar" titulo=${solicitudes.length + (solicitudes.length === 1 ? " reserva web por confirmar" : " reservas web por confirmar")} sub="Confírmalas pronto" href="#/agenda?vista=confirmar" flecha />`}
            ${leads.map(l => { const m = (Date.now() - (l.creado || Date.now())) / 60000; return html`<${Fila} icono="message-circle" colorIcono=${m > 60 ? "rojo" : "ambar"} titulo=${"Consulta de " + l.nombre} sub=${(l.interes || l.canal || "") + " · llegó " + hace(l.creado)} href=${"#/ventas/lead/" + l.id} flecha />`; })}
            ${enCurso.map(o => html`<${Fila} icono="car" colorIcono="oro" titulo=${(o.numero || "Orden") + " · " + o._cliente} sub=${N.nombresItems(o.items)} der=${html`<${Insignia} c="oro">${{ recepcion: "Recepción", proceso: "En proceso", calidad: "Calidad", listo: "Listo" }[o.estado]}<//>`} href=${"#/ordenes/" + o.id} />`)}
            ${porCobrar.slice(0, 5).map(x => html`<${Fila} icono="banknote" colorIcono="rojo" titulo=${"Cobrar a " + x.o._cliente} sub=${(x.o.numero || "") + " · " + relativa(x.o.fecha)} der=${html`<b class="cifra">${soles(x.s.saldo)}</b>`} href=${"#/ordenes/" + x.o.id} />`)}
            ${tareas.slice(0, 6).map(t => html`<${Fila} icono="list-checks" colorIcono=${t.fecha < H ? "rojo" : "azul"} titulo=${t.titulo} sub=${t.fecha < H ? "Atrasado desde " + relativa(t.fecha) : "Para hoy" + (t.hora ? " a las " + t.hora : "")} href="#/ventas/seguimientos" flecha />`)}
            ${bajos.length > 0 && html`<${Fila} icono="package" colorIcono="ambar" titulo=${bajos.length + (bajos.length === 1 ? " producto por reponer" : " productos por reponer")} sub=${bajos.slice(0, 3).map(p => p.nombre).join(", ")} href="#/inventario" flecha />`}
            ${alertas.slice(0, 3).map(a => html`<${Fila} icono="wrench" colorIcono="ambar" titulo=${a.txt} sub=${a.a.nombre + " · " + relativa(a.fecha)} href="#/activos" flecha />`)}
          </div>`}
        <//>
      </div>
    </div>`;
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

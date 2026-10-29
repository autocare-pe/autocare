// AUTOCARE · Agenda: día, semana, reservas por confirmar y el formulario de cita
import { html, useState, useMemo } from "../../vendor/preact-htm.js";
import * as D from "../datos.js";
import * as N from "../negocio.js";
import { ir, usarTitulo, abrir } from "../app.js";
import { Boton, Icono, Hoja, Entrada, Numero, Dinero, Area, Selector, Pestanas, Segmentos, Insignia, Vacio, Fila, Par, Progreso, AvisoLinea, aviso, confirmar, preguntar, menu, useFicha, b } from "../ui.js";
import { ElegirCliente, ElegirVehiculo, ElegirServicios, enviarWa, EstadoBadge } from "../piezas.js";
import { hoy, sumarDias, inicioSemana, fechaCorta, fechaLarga, relativa, minutos, hhmm, duracion, soles, nombreDe, mapa, clases, diaSemana, DIAS_CORTOS, n0, msDe, isoDe, horaDe } from "../util.js";
import { estadoDe, METODOS } from "../esquema.js";

export default function Agenda({ ruta }) {
  D.useDatos();
  usarTitulo("Agenda");
  const [vista, setVista] = useState(ruta.q.vista || "dia");
  const [fecha, setFecha] = useState(ruta.q.fecha || hoy());
  const [nueva, setNueva] = useState(null);
  const porConfirmar = D.lista("citas").filter(c => c.estado === "solicitada" && c.fecha >= hoy()).sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora));
  const idCita = ruta.partes[0] === "cita" ? ruta.partes[1] : null;
  const puede = D.puedeEditar("citas");
  return html`
    <header class="pagina-cab"><div><h1>Agenda</h1><p>${capacidadTexto(fecha)}</p></div>
      <div class="acciones">${puede && html`<${Boton} tipo="primario" icono="calendar-plus" onClick=${() => setNueva({ fecha })}>Nueva cita<//>`}</div></header>
    <${Pestanas} valor=${vista} cambiar=${setVista} opciones=${[{ v: "dia", n: "Día" }, { v: "semana", n: "Semana" }, { v: "confirmar", n: "Por confirmar", cuenta: porConfirmar.length }]} />
    ${vista === "dia" && html`<${Dia} fecha=${fecha} setFecha=${setFecha} nueva=${(h) => puede && setNueva({ fecha, hora: h })} />`}
    ${vista === "semana" && html`<${Semana} fecha=${fecha} setFecha=${setFecha} abrirDia=${f => { setFecha(f); setVista("dia"); }} />`}
    ${vista === "confirmar" && html`<${PorConfirmar} lista=${porConfirmar} />`}
    ${nueva && html`<${FormCita} inicial=${nueva} cerrar=${() => setNueva(null)} />`}
    ${idCita && html`<${DetalleCita} id=${idCita} cerrar=${() => ir("agenda", true)} />`}`;
}
function capacidadTexto(f) {
  const cap = N.capacidadDia(f), uso = N.cargaDia(f);
  if (!cap) return fechaLarga(f) + ": no atiendes ese día.";
  return `${relativa(f) === "hoy" ? "Hoy" : fechaLarga(f)}: ${duracion(uso)} ocupadas de ${duracion(cap)} disponibles.`;
}

// ---------------------------------------------------------------- día (línea de tiempo)
function Dia({ fecha, setFecha, nueva }) {
  const H = N.horario(), rangos = N.rangosDia(fecha, H), citas = N.citasDelDia(fecha);
  const ini = Math.min(rangos.length ? minutos(rangos[0][0]) : 480, ...citas.filter(c => c.hora).map(c => minutos(c.hora))) - 30;
  const fin = Math.max(rangos.length ? minutos(rangos[rangos.length - 1][1]) : 1080, ...citas.filter(c => c.hora).map(c => minutos(c.hora) + (n0(c.minutos) || 60))) + 30;
  const PX = 1.3, alto = (fin - ini) * PX, cap = N.capacidadDia(fecha), uso = N.cargaDia(fecha);
  const ahoraMin = fecha === hoy() ? minutos(horaDe(Date.now())) : null;
  const tr = n0(H.traslado);
  const horas = []; for (let m = Math.ceil(ini / 60) * 60; m < fin; m += 60) horas.push(m);
  const libres = rangos.length ? N.slotsDia(fecha, 60).filter((h, i, a) => i === 0 || minutos(h) - minutos(a[i - 1]) >= 60) : [];
  const sinHora = citas.filter(c => !c.hora);
  return html`
    <div class="dia-cab">
      <${Boton} icono="chevron-left" titulo="Día anterior" onClick=${() => setFecha(sumarDias(fecha, -1))} />
      <${Boton} onClick=${() => setFecha(hoy())}>Hoy<//>
      <${Boton} icono="chevron-right" titulo="Día siguiente" onClick=${() => setFecha(sumarDias(fecha, 1))} />
      <h2>${fechaLarga(fecha)}</h2>
      ${cap > 0 && html`<span class="carga"><${Progreso} v=${uso} max=${cap} c=${uso / cap > 0.9 ? "rojo" : uso / cap > 0.7 ? "ambar" : "verde"} />${Math.round((uso / cap) * 100)}% ocupado</span>`}
      <input class="entrada" type="date" value=${fecha} onChange=${e => e.currentTarget.value && setFecha(e.currentTarget.value)} style="width:auto;margin-left:auto;height:38px" aria-label="Elegir fecha" />
    </div>
    ${!rangos.length && !citas.length ? html`<${Vacio} icono="calendar-x" titulo="No atiendes este día" texto="Puedes cambiar tu horario en Configuración → Horario y reservas." />` : html`
    <div class="linea-tiempo" style=${{ height: alto + "px" }}>
      ${horas.map(m => html`<div class="lt-hora" style=${{ top: (m - ini) * PX + "px" }}><span>${hhmm(m)}</span></div>`)}
      ${libres.map(h => html`<button class="lt-libre" style=${{ top: (minutos(h) - ini) * PX + "px", height: 60 * PX - 4 + "px" }} onClick=${() => nueva(h)}>+ ${h} libre</button>`)}
      ${citas.filter(c => c.hora && N.citaActiva(c) && tr).map(c => html`<div class="lt-traslado" style=${{ top: (minutos(c.hora) - tr - ini) * PX + "px", height: tr * PX - 2 + "px" }}>traslado</div>`)}
      ${citas.filter(c => c.hora).map(c => {
        const t = minutos(c.hora), h = (n0(c.minutos) || 60) * PX;
        return html`<button class=${clases("lt-cita", c.estado)} style=${{ top: (t - ini) * PX + "px", height: Math.max(34, h - 3) + "px" }} onClick=${() => ir("agenda/cita/" + c.id)}>
          <b>${c.hora} · ${c._cliente || "Sin nombre"}</b>${h > 44 && html`<small>${c._servicios || ""}${c.direccion ? " · " + c.direccion : ""}</small>`}${h > 70 && html`<small>${estadoDe("citas", c.estado).n}${c.total ? " · " + soles(c.total) : ""}</small>`}</button>`;
      })}
      ${ahoraMin !== null && ahoraMin > ini && ahoraMin < fin && html`<div class="lt-ahora" style=${{ top: (ahoraMin - ini) * PX + "px" }}></div>`}
    </div>`}
    ${sinHora.length > 0 && html`<section class="bloque" style="margin-top:20px"><div class="bloque-cab"><h2>Sin hora</h2></div><div class="grupo">${sinHora.map(c => html`<${FilaCita} c=${c} />`)}</div></section>`}`;
}
export function FilaCita({ c, conFecha }) {
  const e = estadoDe("citas", c.estado);
  return html`<${Fila} icono=${c.estado === "solicitada" ? "calendar-clock" : "calendar-check"} colorIcono=${e.c} titulo=${(conFecha ? relativa(c.fecha) + ", " : "") + (c.hora || "sin hora") + " · " + (c._cliente || "Sin nombre")}
    sub=${[c._servicios, c.direccion].filter(Boolean).join(" · ")} der=${html`<${Insignia} c=${e.c}>${e.n}<//>`} onClick=${() => ir("agenda/cita/" + c.id)} />`;
}

// ---------------------------------------------------------------- semana
function Semana({ fecha, setFecha, abrirDia }) {
  const lunes = inicioSemana(fecha), dias = Array.from({ length: 7 }, (_, i) => sumarDias(lunes, i));
  const tot = dias.reduce((a, f) => ({ cap: a.cap + N.capacidadDia(f), uso: a.uso + N.cargaDia(f) }), { cap: 0, uso: 0 });
  return html`<div class="dia-cab">
      <${Boton} icono="chevron-left" titulo="Semana anterior" onClick=${() => setFecha(sumarDias(lunes, -7))} />
      <${Boton} onClick=${() => setFecha(hoy())}>Esta semana<//>
      <${Boton} icono="chevron-right" titulo="Semana siguiente" onClick=${() => setFecha(sumarDias(lunes, 7))} />
      <h2>Del ${fechaCorta(lunes)} al ${fechaCorta(dias[6])}</h2>
      ${tot.cap > 0 && html`<span class="carga"><${Progreso} v=${tot.uso} max=${tot.cap} />${Math.round((tot.uso / tot.cap) * 100)}% de tu capacidad</span>`}
    </div>
    <div class="semana">${dias.map(f => {
      const cs = N.citasDelDia(f), cap = N.capacidadDia(f);
      return html`<div class=${clases("semana-dia", f === hoy() && "hoy", !cap && "cerrado")}>
        <h4><button class="enlace" style="color:inherit" onClick=${() => abrirDia(f)}>${DIAS_CORTOS[diaSemana(f)]} <b>${Number(f.slice(8))}</b></button>${cap ? html`<span class="mas-tenue cifra">${Math.round((N.cargaDia(f) / cap) * 100)}%</span>` : html`<span class="mas-tenue">cerrado</span>`}</h4>
        ${cs.map(c => html`<button class=${clases("semana-cita", c.estado)} onClick=${() => ir("agenda/cita/" + c.id)}><b>${c.hora || "—"} ${c._cliente || ""}</b><span>${c._servicios || ""}</span></button>`)}
      </div>`;
    })}</div>`;
}

// ---------------------------------------------------------------- reservas web por confirmar
function PorConfirmar({ lista }) {
  if (!lista.length) return html`<${Vacio} icono="calendar-check" titulo="No hay reservas por confirmar" texto="Cuando alguien reserve desde tu web, aparece aquí y te llega un aviso por Telegram." />`;
  return html`<${AvisoLinea} c="oro" icono="zap">Confirma rápido: responder en la primera hora multiplica las ventas (Oldroyd, Harvard Business Review, 2011).<//>
    <div class="grupo" style="margin-top:14px">${lista.map(c => html`<div class="fila">
      <span class="ico ambar"><${Icono} n="calendar-clock" /></span>
      <span class="cuerpo"><span class="t">${relativa(c.fecha)}, ${c.hora} · ${c._cliente}</span><span class="s">${c._servicios} · ${soles(c.total)}${c.adelanto ? " · adelanto " + soles(c.adelanto) : ""}</span><span class="s">${c.direccion}</span></span>
      <span class="der"><${Boton} chico tipo="primario" icono="check" onClick=${() => confirmarCita(c)}>Confirmar<//><${Boton} chico icono="chevron-right" titulo="Ver" onClick=${() => ir("agenda/cita/" + c.id)} /></span>
    </div>`)}</div>`;
}
function confirmarCita(c, mandar = true) {
  D.cambiar("citas", c.id, { estado: "confirmada", confirmadaEn: Date.now() });
  const lead = D.lista("leads").find(l => l.citaId === c.id && !l.contactadoEn);
  if (lead) D.cambiar("leads", lead.id, { contactadoEn: Date.now() });
  const cli = D.uno("clientes", c.clienteId);
  aviso("Cita confirmada.");
  if (mandar && cli) enviarWa(cli.tel, N.mensaje(c.adelanto && c.adelantoEstado !== "recibido" ? "adelanto" : "confirmar", N.varsCita(c)));
}

// ---------------------------------------------------------------- detalle de cita
export function DetalleCita({ id, cerrar }) {
  D.useDatos();
  const c = D.uno("citas", id);
  const [editar, setEditar] = useState(false);
  if (!c) return html`<${Hoja} titulo="Cita" cerrar=${cerrar}><${Vacio} titulo="No encuentro esta cita" texto="Puede que se haya eliminado." /><//>`;
  const cli = D.uno("clientes", c.clienteId), veh = D.uno("vehiculos", c.vehiculoId), e = estadoDe("citas", c.estado);
  const orden = D.uno("ordenes", c.ordenId), puede = D.puedeEditar("citas");
  const wa = () => menu("Mensaje por WhatsApp", [
    { n: "Confirmar la cita", icono: "calendar-check", f: () => enviarWa(cli.tel, N.mensaje("confirmar", N.varsCita(c))) },
    c.adelanto ? { n: "Pedir el adelanto", icono: "banknote", f: () => enviarWa(cli.tel, N.mensaje("adelanto", N.varsCita(c))) } : null,
    { n: "Recordatorio", icono: "bell", f: () => enviarWa(cli.tel, N.mensaje("recordatorio", N.varsCita(c))) },
    { n: "Voy en camino", icono: "navigation", f: () => enviarWa(cli.tel, N.mensaje("camino", N.varsCita(c))) },
    { n: "Mensaje libre", icono: "message-circle", f: () => enviarWa(cli.tel, "") }
  ]);
  const adelanto = () => {
    if (!D.puedeEditar("pagos")) return aviso("No tienes permiso para registrar cobros.", { error: true });
    menu("¿Cómo pagó el adelanto de " + soles(c.adelanto) + "?", Object.keys(METODOS).map(m => ({ n: METODOS[m], icono: "banknote", f: () => {
      N.avisarCobro(D.guardar("pagos", { fecha: hoy(), _cliente: c._cliente, concepto: "Adelanto de cita", monto: c.adelanto, metodo: m, citaId: c.id, clienteId: c.clienteId }));
      D.cambiar("citas", c.id, { adelantoEstado: "recibido", estado: c.estado === "solicitada" ? "confirmada" : c.estado });
      aviso("Adelanto registrado.");
    } })));
  };
  const cancelar = async () => {
    const m = await preguntar({ titulo: "Cancelar cita", etiqueta: "Motivo", valor: "", si: "Cancelar cita", ayuda: "Te sirve para ver por qué se caen las citas." });
    if (m === null) return;
    D.cambiar("citas", c.id, { estado: "cancelada", motivo: m || "Sin motivo", canceladaPor: "negocio" });
    aviso("Cita cancelada.");
  };
  const empezar = async () => {
    const m = await import("./ordenes.js");
    const o = m.crearOrdenDesdeCita(c);
    cerrar(); ir("ordenes/" + o.id);
  };
  const eliminar = async () => {
    if (!(await confirmar({ titulo: "Eliminar cita", texto: "Se borra de tu agenda y de tu hoja. Si solo no se hizo, mejor márcala como cancelada.", si: "Eliminar", peligro: true }))) return;
    const r = D.borrar("citas", c.id); cerrar();
    aviso("Cita eliminada.", { accion: { n: "Deshacer", f: () => D.guardar("citas", r) } });
  };
  if (editar) return html`<${FormCita} inicial=${c} cerrar=${() => setEditar(false)} />`;
  return html`<${Hoja} titulo=${(c.hora || "") + " · " + (c._cliente || "Cita")} sub=${fechaLarga(c.fecha)} cerrar=${cerrar}
    acciones=${puede && html`<${Boton} tipo="fantasma" icono="pencil" titulo="Editar" onClick=${() => setEditar(true)} />`}
    pie=${puede && html`
      ${c.estado === "solicitada" && html`<${Boton} tipo="primario" icono="check" onClick=${() => confirmarCita(c)}>Confirmar<//>`}
      ${["confirmada", "en_curso"].includes(c.estado) && !orden && D.puedeEditar("ordenes") && html`<${Boton} tipo="primario" icono="play" onClick=${empezar}>Empezar servicio<//>`}
      ${orden && html`<${Boton} tipo="primario" icono="clipboard-list" onClick=${() => { cerrar(); ir("ordenes/" + orden.id); }}>Ver orden ${orden.numero || ""}<//>`}
      <${Boton} icono="ellipsis" titulo="Más" onClick=${() => menu("Cita", [
        N.citaActiva(c) && { n: "Cancelar cita", icono: "calendar-x", f: cancelar },
        N.citaActiva(c) && { n: "Marcar que no se realizó", icono: "circle-alert", d: "El cliente no estuvo o no contestó", f: () => D.cambiar("citas", c.id, { estado: "no_asistio" }) },
        !N.citaActiva(c) && { n: "Volver a activar", icono: "rotate-ccw", f: () => D.cambiar("citas", c.id, { estado: "confirmada" }) },
        { n: "Eliminar", icono: "trash-2", peligro: true, f: eliminar }])} />`}>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px"><${Insignia} c=${e.c}>${e.n}<//>${c.origen === "web" && html`<${Insignia} c="azul" sinPunto>Reserva web<//>`}${c.clienteConfirmo && html`<${Insignia} c="verde" sinPunto>El cliente confirmó<//>`}</div>
    <div class="grupo" style="margin-bottom:16px">
      <${Fila} avatar=${c._cliente || ""} titulo=${cli ? nombreDe(cli) : c._cliente} sub=${cli ? cli.tel : ""} href=${cli ? "#/clientes/" + cli.id : null} flecha=${!!cli} />
      ${veh && html`<${Fila} icono="car" titulo=${N.nombreVehiculo(veh)} sub=${N.tamanoDe(c.tamano || veh.tamano).n} />`}
      <${Fila} icono="sparkles" titulo=${c._servicios || "Sin servicios"} sub=${duracion(c.minutos || 60) + (c.total ? " · " + soles(c.total) : "")} />
      ${c.direccion && html`<${Fila} icono="map-pin" titulo=${c.direccion} sub="Abrir en Google Maps" href=${mapa(c.direccion, (N.negocio() || {}).distrito)} flecha />`}
      ${c.adelanto > 0 && html`<${Fila} icono="banknote" colorIcono=${c.adelantoEstado === "recibido" ? "verde" : "ambar"} titulo=${"Adelanto " + soles(c.adelanto)} sub=${c.adelantoEstado === "recibido" ? "Recibido" : "Pendiente"}
        der=${c.adelantoEstado !== "recibido" && puede && html`<${Boton} chico onClick=${adelanto}>Lo recibí<//>`} />`}
      ${c.nota && html`<${Fila} icono="notebook-pen" titulo="Nota" sub=${c.nota} multi />`}
      ${c.motivo && html`<${Fila} icono="info" titulo="Motivo de cancelación" sub=${c.motivo} multi />`}
    </div>
    ${cli && html`<div class="btns"><${Boton} icono="message-circle" onClick=${wa}>WhatsApp<//><${Boton} icono="phone" href=${"tel:" + cli.tel}>Llamar<//>${c.direccion && html`<${Boton} icono="navigation" href=${mapa(c.direccion, (N.negocio() || {}).distrito)}>Cómo llegar<//>`}</div>`}
  <//>`;
}

// ---------------------------------------------------------------- formulario de cita
export function FormCita({ inicial = {}, cerrar }) {
  const editando = !!inicial.id;
  const [f, set] = useFicha(Object.assign({ fecha: hoy(), hora: "", servicios: [], tamano: "auto", estado: "confirmada", origen: "app", direccion: "", nota: "", clienteId: "", vehiculoId: "" }, inicial));
  const cat = D.lista("servicios"), elegidos = cat.filter(s => (f.servicios || []).includes(s.id));
  const dur = elegidos.length ? N.minutosCon(elegidos, f.tamano) : n0(f.minutos) || 60;
  const total = elegidos.reduce((a, s) => a + N.precioCon(s, f.tamano), 0);
  const R = Object.assign({ adelantoDesdeMin: 180, adelantoPct: 30 }, D.ajuste("reservas", {}));
  const pideAdelanto = dur >= n0(R.adelantoDesdeMin) || elegidos.some(s => s.adelanto);
  const sugerido = pideAdelanto ? Math.ceil((total * n0(R.adelantoPct)) / 100 / 5) * 5 : 0;
  const libres = useMemo(() => N.slotsDia(f.fecha, dur, { excluir: inicial.id }), [f.fecha, dur, D.versionDatos()]);
  const dias = Array.from({ length: 14 }, (_, i) => sumarDias(hoy(), i));
  const elegirCliente = (id, c) => {
    const vs = id ? N.vehiculosDe(id) : [];
    set({ clienteId: id, vehiculoId: vs[0] ? vs[0].id : "", tamano: vs[0] ? vs[0].tamano || "auto" : f.tamano, direccion: f.direccion || (c ? [c.direccion, c.distrito].filter(Boolean).join(", ") : "") });
  };
  const guardar = () => {
    if (!f.clienteId) return aviso("Elige o crea el cliente.", { error: true });
    if (!elegidos.length) return aviso("Elige al menos un servicio.", { error: true });
    if (!f.fecha) return aviso("Elige la fecha.", { error: true });
    const cli = D.uno("clientes", f.clienteId);
    const adelanto = f.adelanto === undefined || f.adelanto === null ? sugerido : n0(f.adelanto);
    const r = D.guardar("citas", Object.assign({}, inicial, f, { minutos: dur, total, adelanto, adelantoEstado: adelanto ? f.adelantoEstado || "pendiente" : "", _cliente: nombreDe(cli), _servicios: elegidos.map(s => s.nombre).join(" + ") }));
    if (!editando) N.asegurarPortal(cli);
    aviso(editando ? "Cita actualizada." : "Cita agendada para " + relativa(r.fecha) + (r.hora ? " a las " + r.hora : "") + ".",
      !editando && cli && cli.tel ? { accion: { n: "Avisar por WhatsApp", f: () => enviarWa(cli.tel, N.mensaje(adelanto ? "adelanto" : "confirmar", N.varsCita(r))) } } : {});
    cerrar(r);
  };
  return html`<${Hoja} titulo=${editando ? "Editar cita" : "Nueva cita"} cerrar=${cerrar} pie=${html`<${Boton} tipo="fantasma" onClick=${cerrar}>Cancelar<//><${Boton} tipo="primario" onClick=${guardar}>${editando ? "Guardar cambios" : "Agendar"}<//>`}>
    <div class="form">
      <${ElegirCliente} valor=${f.clienteId} cambiar=${elegirCliente} />
      <${ElegirVehiculo} clienteId=${f.clienteId} valor=${f.vehiculoId} cambiar=${(id, v) => set({ vehiculoId: id, tamano: (v && v.tamano) || f.tamano })} />
      <${Segmentos} etiqueta="Tamaño del vehículo" valor=${f.tamano} cambiar=${v => set("tamano", v)} opciones=${N.tamanos().map(t => ({ v: t.id, n: t.n.split(" ")[0] }))} />
      <${ElegirServicios} valor=${f.servicios} cambiar=${v => set("servicios", v)} tamano=${f.tamano} />
      <div class="campo"><span class="etq">Fecha</span>
        <div class="dias-rapidos">${dias.map(d => html`<button type="button" class=${clases("dia-rapido", d === f.fecha && "activo", !N.capacidadDia(d) && "lleno")} onClick=${() => set("fecha", d)}><small>${DIAS_CORTOS[diaSemana(d)]}</small><b>${Number(d.slice(8))}</b></button>`)}</div>
        <input class="entrada" type="date" value=${f.fecha} onChange=${e => set("fecha", e.currentTarget.value)} aria-label="Otra fecha" /></div>
      <div class="campo"><span class="etq">Hora · ${duracion(dur)} con traslado aparte</span>
        ${libres.length ? html`<div class="franjas">${libres.map(h => html`<button type="button" class=${clases("franja", f.hora === h && "activa")} onClick=${() => set("hora", h)}>${h}</button>`)}</div>`
          : html`<p class="nota">No hay horas libres ese día para ${duracion(dur)}. Puedes poner una hora a mano.</p>`}
        <input class="entrada" type="time" value=${f.hora} onChange=${e => set("hora", e.currentTarget.value)} aria-label="Hora a mano" /></div>
      <${Entrada} etiqueta="Dirección" ...${b(f, set, "direccion")} placeholder="Calle, número y distrito" />
      ${total > 0 && html`<div class="rejilla">
        <${Dinero} etiqueta="Adelanto" valor=${f.adelanto === undefined || f.adelanto === null ? sugerido : f.adelanto} cambiar=${v => set("adelanto", v || 0)} ayuda=${pideAdelanto ? `Sugerido ${R.adelantoPct}% porque es un servicio largo. Evita citas perdidas.` : "Opcional para servicios cortos."} />
        <${Selector} etiqueta="Estado" opciones=${[{ v: "confirmada", n: "Confirmada" }, { v: "solicitada", n: "Por confirmar" }]} ...${b(f, set, "estado")} /></div>`}
      <${Area} etiqueta="Nota" ...${b(f, set, "nota")} placeholder="Ej.: dejar el auto en la cochera, perro en casa" />
      ${total > 0 && html`<${Par} total n="Total estimado" v=${soles(total)} />`}
    </div><//>`;
}

// AUTOCARE · Ventas: embudo de consultas y seguimientos
// Responder rápido es la palanca más barata de ventas (Oldroyd y otros, HBR 2011).
import { html, useState, useEffect, useRef } from "../../vendor/preact-htm.js";
import * as D from "../datos.js";
import * as N from "../negocio.js";
import { ir, usarTitulo, abrir } from "../app.js";
import { Boton, Icono, Hoja, Entrada, Dinero, Area, Selector, Chips, Pestanas, Insignia, Vacio, Fila, Check, AvisoLinea, aviso, confirmar, menu, useFicha, b } from "../ui.js";
import { enviarWa } from "../piezas.js";
import { hoy, sumarDias, relativa, hace, soles, suma, telNorm, telBonito, nombreDe, clases, esMovil, duracion, primerNombre } from "../util.js";
import { ESTADOS, CANALES, MOTIVOS_PERDIDA, estadoDe } from "../esquema.js";

const ETAPAS = ["nuevo", "contactado", "cotizado", "agendado", "ganado", "perdido"];

export default function Ventas({ ruta }) {
  D.useDatos();
  usarTitulo("Ventas");
  const t = ruta.partes[0] === "seguimientos" ? "seguimientos" : "embudo";
  const [nuevo, setNuevo] = useState(false), [tarea, setTarea] = useState(false);
  const idLead = ruta.partes[0] === "lead" ? ruta.partes[1] : null;
  const pendientes = D.lista("tareas").filter(x => !x.hecho && x.fecha && x.fecha <= hoy()).length;
  return html`<header class="pagina-cab"><div><h1>Ventas</h1><p>Cada consulta es una venta posible. Muévela por el embudo hasta cerrarla.</p></div>
      <div class="acciones"><${Boton} icono="list-checks" onClick=${() => setTarea(true)}>Seguimiento<//><${Boton} tipo="primario" icono="plus" onClick=${() => setNuevo(true)}>Nueva consulta<//></div></header>
    <${Pestanas} valor=${t} cambiar=${v => ir("ventas" + (v === "embudo" ? "" : "/" + v), true)} opciones=${[{ v: "embudo", n: "Embudo" }, { v: "seguimientos", n: "Seguimientos", cuenta: pendientes }]} />
    ${t === "embudo" ? html`<${Embudo} />` : html`<${Seguimientos} nueva=${() => setTarea(true)} />`}
    ${nuevo && html`<${FormLead} cerrar=${() => setNuevo(false)} />`}${tarea && html`<${FormTarea} cerrar=${() => setTarea(false)} />`}
    ${idLead && html`<${DetalleLead} id=${idLead} cerrar=${() => ir("ventas", true)} />`}`;
}

export function moverLead(l, etapa) {
  const p = { etapa };
  if (etapa !== "nuevo" && !l.contactadoEn) p.contactadoEn = Date.now();
  if (etapa === "perdido") {
    menu("¿Por qué se perdió?", MOTIVOS_PERDIDA.map(m => ({ n: m, icono: "circle-alert", f: () => D.cambiar("leads", l.id, Object.assign(p, { motivo: m })) })));
    return;
  }
  D.cambiar("leads", l.id, p);
}

// ---------------------------------------------------------------- embudo (kanban)
function Embudo() {
  const leads = D.lista("leads").slice().sort((a, c) => (c.creado || 0) - (a.creado || 0));
  const abiertos = leads.filter(l => !["ganado", "perdido"].includes(l.etapa));
  const mes = hoy().slice(0, 7), delMes = leads.filter(l => String(l.fecha).slice(0, 7) === mes);
  const tasa = delMes.length ? delMes.filter(l => ["agendado", "ganado"].includes(l.etapa)).length / delMes.length : null;
  const ref = useRef();
  useEffect(() => {
    if (esMovil() || !ref.current) return;
    let instancias = [];
    import("../../vendor/sortable.js").then(m => {
      const S = m.default || m.Sortable;
      instancias = Array.from(ref.current.querySelectorAll(".kanban-lista")).map(el => S.create(el, {
        group: "leads", animation: 150, ghostClass: "fantasma", dragClass: "arrastre",
        onEnd: e => { const id = e.item.dataset.id, et = e.to.dataset.etapa; e.from.insertBefore(e.item, e.from.children[e.oldIndex] || null); const l = D.uno("leads", id); if (l && l.etapa !== et) moverLead(l, et); }
      }));
    });
    return () => instancias.forEach(s => s.destroy());
  }, []);
  if (!leads.length) return html`<${Vacio} icono="filter" titulo="Aún no hay consultas" texto="Las consultas de tu web y las reservas llegan solas. También puedes anotar las que te llegan por WhatsApp o Instagram." />`;
  const tarjeta = l => {
    const min = l.creado ? (Date.now() - l.creado) / 60000 : 0;
    return html`<a class="tarjeta" href=${"#/ventas/lead/" + l.id} data-id=${l.id} key=${l.id}><b>${l.nombre}</b><span class="s">${l.interes || "Sin detalle"}</span>
      <span class="pie">${l.etapa === "nuevo" ? html`<span class=${clases("reloj", min > 60 ? "rojo" : min > 15 ? "ambar" : "verde")}><${Icono} n="clock" />${duracion(Math.round(min))}</span>` : html`<span>${l.canal || ""}</span>`}${l.valor ? html`<span class="der">${soles(l.valor)}</span>` : null}</span></a>`;
  };
  return html`<div style="margin-bottom:16px"><${AvisoLinea} icono="zap" c="oro">${abiertos.length === 1 ? "1 consulta abierta" : abiertos.length + " consultas abiertas"} por ${soles(suma(abiertos, "valor"))}. Este mes, ${tasa === null ? "aún sin consultas" : Math.round(tasa * 100) + "% terminaron en cita"}.${esMovil() ? "" : " Arrastra las tarjetas para cambiar de etapa."}<//></div>
    ${esMovil() ? ETAPAS.map(e => { const l = leads.filter(x => x.etapa === e); return l.length ? html`<section class="bloque"><div class="bloque-cab"><h2>${ESTADOS.leads[e].n}</h2><p>${l.length}</p></div>
        <div class="grupo">${l.slice(0, e === "ganado" || e === "perdido" ? 5 : 50).map(x => html`<${Fila} icono="message-circle" colorIcono=${ESTADOS.leads[e].c} titulo=${x.nombre} sub=${(x.interes || "") + " · " + hace(x.creado)} der=${x.valor ? html`<b class="cifra">${soles(x.valor)}</b>` : null} href=${"#/ventas/lead/" + x.id} />`)}</div></section>` : null; })
    : html`<div class="kanban" ref=${ref}>${ETAPAS.map(e => { const l = leads.filter(x => x.etapa === e); return html`<div class="kanban-col">
        <div class="kanban-cab"><${Insignia} c=${ESTADOS.leads[e].c}>${ESTADOS.leads[e].n}<//><span class="n">${l.length}</span><span class="v">${soles(suma(l, "valor"))}</span></div>
        <div class="kanban-lista" data-etapa=${e}>${l.slice(0, e === "ganado" || e === "perdido" ? 15 : 100).map(tarjeta)}</div></div>`; })}</div>`}`;
}

// ---------------------------------------------------------------- detalle de una consulta
function DetalleLead({ id, cerrar }) {
  D.useDatos();
  const l = D.uno("leads", id);
  const [editar, setEditar] = useState(false);
  if (!l) return html`<${Hoja} titulo="Consulta" cerrar=${cerrar}><${Vacio} titulo="No encuentro esta consulta" /><//>`;
  if (editar) return html`<${FormLead} inicial=${l} cerrar=${() => setEditar(false)} />`;
  const cli = D.uno("clientes", l.clienteId);
  const responder = async () => {
    const m = await import("./campanas.js");
    menu("Responder a " + primerNombre({ nombre: l.nombre }), [{ n: "Saludo y preguntas", icono: "message-circle", f: () => { enviarWa(l.tel, N.mensaje("respuesta", { nombre: primerNombre({ nombre: l.nombre }) })); if (l.etapa === "nuevo") moverLead(l, "contactado"); } },
      ...m.respuestas().map(p => ({ n: p.nombre, icono: "zap", f: () => { enviarWa(l.tel, m.textoRespuesta(p)); if (l.etapa === "nuevo") moverLead(l, "contactado"); } }))]);
  };
  const agendar = () => {
    let c = cli || N.clientePorTel(l.tel);
    if (!c) { const p = l.nombre.split(" "); c = N.asegurarPortal(D.guardar("clientes", { nombre: p[0], apellido: p.slice(1).join(" "), tel: telNorm(l.tel), canal: l.canal, estado: "activo", acepta: true, alta: hoy() })); }
    D.cambiar("leads", l.id, { clienteId: c.id, contactadoEn: l.contactadoEn || Date.now() });
    cerrar();
    abrir(() => import("./agenda.js"), "FormCita", { inicial: { clienteId: c.id }, alCerrar: r => { if (r && r.id) D.cambiar("leads", l.id, { etapa: "agendado", citaId: r.id }); } });
  };
  return html`<${Hoja} titulo=${l.nombre} sub=${"Llegó " + hace(l.creado) + (l.canal ? " por " + l.canal : "")} cerrar=${cerrar} acciones=${html`<${Boton} tipo="fantasma" icono="pencil" titulo="Editar" onClick=${() => setEditar(true)} />`}
    pie=${html`<${Boton} icono="message-circle" onClick=${responder}>Responder<//><${Boton} tipo="primario" icono="calendar-plus" onClick=${agendar}>Agendar cita<//>`}>
    <div style="margin-bottom:16px"><${Insignia} c=${estadoDe("leads", l.etapa).c}>${estadoDe("leads", l.etapa).n}<//></div>
    <div class="grupo" style="margin-bottom:16px">
      ${l.tel && html`<${Fila} icono="phone" titulo=${telBonito(l.tel)} sub="WhatsApp" />`}
      <${Fila} icono="sparkles" titulo=${l.interes || "Sin detalle"} sub=${l.valor ? "Valor estimado " + soles(l.valor) : ""} />
      ${l.notas && html`<${Fila} icono="notebook-pen" titulo="Notas" sub=${l.notas} multi />`}
      ${l.motivo && html`<${Fila} icono="circle-alert" titulo="Motivo de pérdida" sub=${l.motivo} />`}
      ${l.contactadoEn && l.creado && html`<${Fila} icono="clock" titulo=${"Respondiste en " + duracion(Math.round((l.contactadoEn - l.creado) / 60000))} />`}
      ${cli && html`<${Fila} icono="user" titulo=${"Cliente: " + nombreDe(cli)} href=${"#/clientes/" + cli.id} flecha />`}
    </div>
    <p class="etq" style="font-weight:600;color:var(--texto-2);font-size:13px;margin-bottom:8px">Mover a</p>
    <${Chips} valor=${l.etapa} cambiar=${v => v && moverLead(l, v)} opciones=${ETAPAS.map(e => ({ v: e, n: ESTADOS.leads[e].n }))} />
  <//>`;
}

export function FormLead({ cerrar, inicial }) {
  const [f, set] = useFicha(Object.assign({ fecha: hoy(), nombre: "", tel: "", canal: "WhatsApp", interes: "", valor: null, etapa: "nuevo", notas: "", origen: "Manual" }, inicial || {}));
  const guardar = () => {
    if (!String(f.nombre).trim()) return aviso("Escribe el nombre.", { error: true });
    D.guardar("leads", Object.assign({}, f, { tel: telNorm(f.tel) })); aviso(inicial ? "Consulta guardada." : "Consulta anotada. Respóndela en la primera hora."); cerrar();
  };
  const borrar = async () => { if (await confirmar({ titulo: "Eliminar consulta", si: "Eliminar", peligro: true })) { D.borrar("leads", inicial.id); cerrar(); ir("ventas", true); } };
  return html`<${Hoja} titulo=${inicial ? "Editar consulta" : "Nueva consulta"} cerrar=${cerrar} pie=${html`${inicial && html`<${Boton} tipo="fantasma peligro" icono="trash-2" titulo="Eliminar" onClick=${borrar} />`}<${Boton} tipo="fantasma" onClick=${cerrar}>Cancelar<//><${Boton} tipo="primario" onClick=${guardar}>Guardar<//>`}>
    <div class="form"><div class="rejilla"><${Entrada} etiqueta="Nombre" ...${b(f, set, "nombre")} /><${Entrada} etiqueta="WhatsApp" tipo="tel" ...${b(f, set, "tel")} /></div>
      <${Selector} etiqueta="¿Por dónde llegó?" opciones=${CANALES} ...${b(f, set, "canal")} />
      <div class="rejilla"><${Entrada} etiqueta="Qué le interesa" ...${b(f, set, "interes")} placeholder="Detallado interior, SUV" /><${Dinero} etiqueta="Valor estimado" ...${b(f, set, "valor")} /></div>
      <${Area} etiqueta="Notas" ...${b(f, set, "notas")} /></div><//>`;
}

// ---------------------------------------------------------------- seguimientos
function Seguimientos({ nueva }) {
  const H = hoy(), [ver, setVer] = useState("pendientes");
  const todas = D.lista("tareas").slice().sort((a, c) => String(a.fecha || "9").localeCompare(String(c.fecha || "9")) || String(a.hora || "").localeCompare(String(c.hora || "")));
  const l = ver === "pendientes" ? todas.filter(t => !t.hecho) : todas.filter(t => t.hecho).reverse().slice(0, 50);
  const grupos = ver === "pendientes" ? [["Atrasados", l.filter(t => t.fecha && t.fecha < H)], ["Hoy", l.filter(t => t.fecha === H)], ["Próximos", l.filter(t => !t.fecha || t.fecha > H)]] : [["Hechos", l]];
  const marcar = (t, v) => D.cambiar("tareas", t.id, { hecho: v, hechoEn: v ? Date.now() : null });
  return html`<div style="margin-bottom:14px"><${Chips} valor=${ver} cambiar=${v => setVer(v || "pendientes")} opciones=${[{ v: "pendientes", n: "Pendientes" }, { v: "hechos", n: "Hechos" }]} /></div>
    ${!l.length ? html`<${Vacio} icono="list-checks" titulo=${ver === "pendientes" ? "Nada pendiente" : "Aún no completas seguimientos"} texto="Anota a quién llamar o escribir y cuándo. Lo que no se agenda, se olvida."><${Boton} tipo="primario" onClick=${nueva}>Nuevo seguimiento<//><//>`
      : grupos.filter(g => g[1].length).map(([n, ts]) => html`<section class="bloque"><div class="bloque-cab"><h2>${n}</h2><p>${ts.length}</p></div><div class="grupo">${ts.map(t => {
        const c = D.uno("clientes", t.clienteId);
        return html`<div class=${clases("fila", t.hecho && "hecha")}><${Check} si=${t.hecho} cambiar=${v => marcar(t, v)} />
          <span class="cuerpo"><span class="t">${t.titulo}</span><span class="s">${[t.fecha ? relativa(t.fecha) + (t.hora ? " " + t.hora : "") : "Sin fecha", c ? nombreDe(c) : "", t.prioridad === "alta" ? "prioridad alta" : ""].filter(Boolean).join(" · ")}</span></span>
          ${c && c.tel && html`<span class="der"><${Boton} chico icono="message-circle" titulo="WhatsApp" onClick=${() => enviarWa(c.tel, "")} /></span>`}</div>`;
      })}</div></section>`)}`;
}
export function FormTarea({ cerrar, inicial }) {
  const [f, set] = useFicha(Object.assign({ fecha: hoy(), hora: "", titulo: "", tipo: "whatsapp", prioridad: "media", hecho: false, clienteId: "" }, inicial || {}));
  const clientes = D.lista("clientes").slice().sort((a, c) => nombreDe(a).localeCompare(nombreDe(c)));
  const guardar = () => { if (!String(f.titulo).trim()) return aviso("Escribe qué hay que hacer.", { error: true }); D.guardar("tareas", f); aviso("Seguimiento guardado."); cerrar(); };
  return html`<${Hoja} centro titulo="Nuevo seguimiento" cerrar=${cerrar} pie=${html`<${Boton} tipo="fantasma" onClick=${cerrar}>Cancelar<//><${Boton} tipo="primario" onClick=${guardar}>Guardar<//>`}>
    <div class="form"><${Entrada} etiqueta="Qué hay que hacer" ...${b(f, set, "titulo")} placeholder="Escribirle a Carla para su mantenimiento" />
      <div class="rejilla dos-movil"><${Entrada} etiqueta="Fecha" tipo="date" ...${b(f, set, "fecha")} /><${Entrada} etiqueta="Hora" tipo="time" ...${b(f, set, "hora")} /></div>
      <${Selector} etiqueta="Cliente (opcional)" vacio="Ninguno" opciones=${clientes.map(c => ({ v: c.id, n: nombreDe(c) }))} ...${b(f, set, "clienteId")} />
      <${Chips} valor=${f.prioridad} cambiar=${v => set("prioridad", v || "media")} opciones=${[{ v: "alta", n: "Alta" }, { v: "media", n: "Media" }, { v: "baja", n: "Baja" }]} /></div><//>`;
}

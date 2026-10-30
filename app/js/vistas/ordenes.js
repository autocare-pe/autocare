// AUTOCARE · Órdenes de servicio: recepción → proceso → control de calidad → listo → entregado
// El mismo proceso cada vez (Gerber, El mito del emprendedor; Gawande, El efecto checklist).
import { html, useState, useEffect } from "../../vendor/preact-htm.js";
import * as D from "../datos.js";
import * as N from "../negocio.js";
import { ir, usarTitulo } from "../app.js";
import { Boton, BotonAccion, Icono, Hoja, Entrada, Numero, Dinero, Area, Selector, Segmentos, Chips, Pestanas, Insignia, Vacio, Fila, Par, Check, AvisoLinea, Tabla, Firma, Bloque, Sellos, aviso, confirmar, preguntar, menu, useFicha, b } from "../ui.js";
import { ElegirCliente, ElegirVehiculo, ElegirServicios, CampoFotos, enviarWa, EstadoBadge } from "../piezas.js";
import { hoy, fechaCorta, relativa, duracion, soles, nombreDe, clases, n0, suma, hace, fechaHora, esMovil } from "../util.js";
import { estadoDe, ESTADOS, PASOS_ORDEN, ZONAS, DANOS, PARTES, COBROS, METODOS } from "../esquema.js";

const EN_CURSO = ["recepcion", "proceso", "calidad", "listo"];

export default function Ordenes({ ruta }) {
  D.useDatos();
  const [vista, setVista] = useState("curso");
  const [nueva, setNueva] = useState(false);
  usarTitulo(ruta.partes[0] ? null : "Órdenes de servicio");
  if (ruta.partes[0]) return html`<${Detalle} id=${ruta.partes[0]} />`;
  const todas = D.lista("ordenes").slice().sort((a, b) => String(b.fecha + (b.numero || "")).localeCompare(String(a.fecha + (a.numero || ""))));
  const curso = todas.filter(o => EN_CURSO.includes(o.estado));
  const puede = D.puedeEditar("ordenes");
  return html`
    <header class="pagina-cab"><div><h1>Órdenes de servicio</h1><p>Cada auto pasa por las mismas 5 etapas. Así no se olvida nada y el cliente ve un trabajo profesional.</p></div>
      <div class="acciones">${puede && html`<${Boton} tipo="primario" icono="plus" onClick=${() => setNueva(true)}>Nueva orden<//>`}</div></header>
    <${Pestanas} valor=${vista} cambiar=${setVista} opciones=${[{ v: "curso", n: "En curso", cuenta: curso.length }, { v: "entregadas", n: "Entregadas" }, { v: "todas", n: "Todas" }]} />
    ${vista === "curso" && (curso.length ? (esMovil() ? html`<div class="grupo">${curso.map(o => html`<${FilaOrden} o=${o} />`)}</div>` : html`<${Tablero} lista=${curso} />`)
      : html`<${Vacio} icono="clipboard-list" titulo="No hay autos en proceso" texto="Empieza una orden desde una cita de la agenda o crea una nueva.">${puede && html`<${Boton} tipo="primario" icono="plus" onClick=${() => setNueva(true)}>Nueva orden<//>`}<//>`)}
    ${vista !== "curso" && html`<${Lista} lista=${vista === "entregadas" ? todas.filter(o => o.estado === "entregado") : todas} />`}
    ${nueva && html`<${NuevaOrden} cerrar=${() => setNueva(false)} />`}`;
}
function FilaOrden({ o }) {
  const s = N.saldoOrden(o);
  return html`<${Fila} icono="car" colorIcono=${estadoDe("ordenes", o.estado).c} titulo=${(o.numero || "Orden nueva") + " · " + (o._cliente || "")}
    sub=${[o._vehiculo, N.nombresItems(o.items)].filter(Boolean).join(" · ")} href=${"#/ordenes/" + o.id} flecha
    der=${html`<${EstadoBadge} ent="ordenes" v=${o.estado} />${s.saldo > 0 && o.estado !== "anulado" ? html`<b class="cifra">${soles(s.saldo)}</b>` : null}`} />`;
}
function Tablero({ lista }) {
  return html`<div class="kanban">${EN_CURSO.map(est => {
    const l = lista.filter(o => o.estado === est), e = ESTADOS.ordenes[est];
    return html`<div class="kanban-col"><div class="kanban-cab"><${Insignia} c=${e.c}>${e.n}<//><span class="n">${l.length}</span><span class="v">${soles(suma(l, "total"))}</span></div>
      <div class="kanban-lista">${l.map(o => html`<a class="tarjeta" href=${"#/ordenes/" + o.id}><b>${o._cliente}</b><span class="s">${o._vehiculo || ""}</span><span class="s">${N.nombresItems(o.items)}</span>
        <span class="pie"><span>${o.numero || "…"}</span>${o.inicio && html`<span>${hace(o.inicio)}</span>`}<span class="der">${soles(o.total)}</span></span></a>`)}</div></div>`;
  })}</div>`;
}
function Lista({ lista }) {
  return html`<${Tabla} filas=${lista} onFila=${o => ir("ordenes/" + o.id)} movil=${o => html`<${FilaOrden} o=${o} />`}
    vacio=${html`<${Vacio} titulo="Aún no hay órdenes" />`}
    cols=${[{ k: "numero", n: "Número", clase: "prin" }, { k: "fecha", n: "Fecha", f: o => fechaCorta(o.fecha) }, { k: "_cliente", n: "Cliente" }, { k: "_vehiculo", n: "Vehículo", clase: "tenue" },
      { k: "items", n: "Servicios", f: o => N.nombresItems(o.items), ordenar: false, clase: "tenue" }, { k: "estado", n: "Estado", f: o => html`<${EstadoBadge} ent="ordenes" v=${o.estado} />` },
      { k: "calificacion", n: "Nota", num: true, f: o => (o.calificacion ? o.calificacion + "★" : "") }, { k: "total", n: "Total", num: true, f: o => soles(o.total) },
      { k: "saldo", n: "Por cobrar", num: true, v: o => N.saldoOrden(o).saldo, f: o => { const s = N.saldoOrden(o).saldo; return s ? html`<span style="color:var(--ambar)">${soles(s)}</span>` : ""; } }]} />`;
}

// ---------------------------------------------------------------- crear
function base(cli, veh, items, extra) {
  const t = (veh && veh.tamano) || "auto";
  return Object.assign({
    fecha: hoy(), estado: "recepcion", clienteId: cli ? cli.id : "", vehiculoId: veh ? veh.id : "", _cliente: nombreDe(cli), _vehiculo: N.nombreVehiculo(veh),
    tamano: t, items, total: N.totalItems(items, 0), descuento: 0, cobro: "normal", tecnico: (D.yo() || {}).nombre || "",
    recepcion: { items: [], obs: "", objetos: "" }, pasos: pasosDe(items), calidad: [], fotosAntes: [], fotosDespues: [], consumo: N.consumoDeServicios(items)
  }, extra || {});
}
function pasosDe(items) {
  const cat = D.lista("servicios"), out = [];
  items.forEach(i => { const s = cat.find(x => x.id === i.servicioId); ((s && s.pasos) || []).forEach(p => out.push({ t: (items.length > 1 ? s.nombre + ": " : "") + (p.t || p), ok: false })); });
  return out;
}
export function crearOrdenDesdeCita(c) {
  const cli = D.uno("clientes", c.clienteId), veh = D.uno("vehiculos", c.vehiculoId);
  const items = N.itemsDeServicios(c.servicios, c.tamano);
  const o = D.guardar("ordenes", base(cli, veh, items, { citaId: c.id, tamano: c.tamano || (veh && veh.tamano) || "auto", notas: c.nota || "" }));
  D.cambiar("citas", c.id, { estado: "en_curso", ordenId: o.id });
  return o;
}
export function NuevaOrden({ cerrar }) {
  const [f, set] = useFicha({ clienteId: "", vehiculoId: "", tamano: "auto", servicios: [] });
  const crear = () => {
    if (!f.clienteId) return aviso("Elige el cliente.", { error: true });
    if (!f.servicios.length) return aviso("Elige al menos un servicio.", { error: true });
    const o = D.guardar("ordenes", base(D.uno("clientes", f.clienteId), D.uno("vehiculos", f.vehiculoId), N.itemsDeServicios(f.servicios, f.tamano), { tamano: f.tamano }));
    cerrar(); ir("ordenes/" + o.id);
  };
  return html`<${Hoja} titulo="Nueva orden de servicio" cerrar=${cerrar} pie=${html`<${Boton} tipo="fantasma" onClick=${cerrar}>Cancelar<//><${Boton} tipo="primario" onClick=${crear}>Crear y empezar la recepción<//>`}>
    <div class="form">
      <${ElegirCliente} valor=${f.clienteId} cambiar=${id => { const v = N.vehiculosDe(id)[0]; set({ clienteId: id, vehiculoId: v ? v.id : "", tamano: v ? v.tamano || "auto" : f.tamano }); }} />
      <${ElegirVehiculo} clienteId=${f.clienteId} valor=${f.vehiculoId} cambiar=${(id, v) => set({ vehiculoId: id, tamano: (v && v.tamano) || f.tamano })} />
      <${Segmentos} etiqueta="Tamaño" valor=${f.tamano} cambiar=${v => set("tamano", v)} opciones=${N.tamanos().map(t => ({ v: t.id, n: t.n.split(" ")[0] }))} />
      <${ElegirServicios} valor=${f.servicios} cambiar=${v => set("servicios", v)} tamano=${f.tamano} />
    </div><//>`;
}

// ---------------------------------------------------------------- detalle (una página por orden)
function Detalle({ id }) {
  D.useDatos();
  const o = D.uno("ordenes", id);
  usarTitulo(o ? (o.numero || "Orden") + " · " + (o._cliente || "") : "Orden");
  const [ver, setVer] = useState(o ? o.estado : "");
  useEffect(() => { if (o) setVer(o.estado); }, [o && o.estado]);
  if (!o) return html`<${Vacio} titulo="No encuentro esta orden" texto="Puede que se haya eliminado o que aún no llegue a este equipo."><${Boton} href="#/ordenes">Ver órdenes<//><//>`;
  const g = parche => D.cambiar("ordenes", o.id, parche);
  const cli = D.uno("clientes", o.clienteId), paso = (ESTADOS.ordenes[o.estado] || {}).paso;
  const puede = D.puedeEditar("ordenes");
  const anular = async () => {
    const m = await preguntar({ titulo: "Anular orden", etiqueta: "Motivo", si: "Anular" });
    if (m === null) return;
    g({ estado: "anulado", motivo: m });
    if (o.citaId) D.cambiar("citas", o.citaId, { estado: "cancelada", motivo: m });
  };
  return html`
    <div class="ficha-cab">
      <div><h1>${o.numero || "Orden nueva"} · ${o._cliente}</h1><p class="tenue">${[o._vehiculo, N.tamanoDe(o.tamano).n, fechaCorta(o.fecha)].filter(Boolean).join(" · ")}</p>
        ${cli && (N.gustosTexto(cli) || cli.notas) && html`<p class="nota" style="margin-top:6px;max-width:640px">💡 ${[N.gustosTexto(cli), cli.notas].filter(Boolean).join(" · ")}</p>`}</div>
      <div class="acciones">
        <${EstadoBadge} ent="ordenes" v=${o.estado} />
        ${cli && html`<${Boton} icono="message-circle" onClick=${() => enviarWa(cli.tel, "")}>WhatsApp<//>`}
        ${puede && html`<${Boton} icono="ellipsis" titulo="Más" onClick=${() => menu("Orden", [
          { n: "Editar servicios y precio", icono: "pencil", f: () => setVer("listo") },
          { n: "Imprimir o guardar PDF", icono: "printer", f: () => window.print() },
          o.estado !== "anulado" && { n: "Anular orden", icono: "circle-alert", peligro: true, d: "Queda en el historial como anulada", f: anular },
          D.esAdmin() && { n: "Eliminar orden", icono: "trash-2", peligro: true, d: o.prueba ? "Es de práctica" : "Se borra con sus cobros", f: async () => { const m = await import("./datos.js"); if (await m.eliminarConConfirmacion("ordenes", o)) ir("ordenes"); } }])} />`}
      </div>
    </div>
    ${o.estado === "anulado" ? html`<${AvisoLinea} c="rojo" icono="circle-alert">Orden anulada${o.motivo ? ": " + o.motivo : ""}.<//>` : html`
    <div class="etapas">${PASOS_ORDEN.map((p, i) => html`<button class=${clases("etapa", i < paso && "hecha", p === ver && "actual")} onClick=${() => i <= paso && setVer(p)}><span>${ESTADOS.ordenes[p].n}</span></button>`)}</div>`}
    ${ver === "recepcion" && html`<${Recepcion} o=${o} g=${g} cli=${cli} puede=${puede} />`}
    ${ver === "proceso" && html`<${Proceso} o=${o} g=${g} puede=${puede} />`}
    ${ver === "calidad" && html`<${Calidad} o=${o} g=${g} puede=${puede} />`}
    ${(ver === "listo" || ver === "entregado" || ver === "anulado") && html`<${Cierre} o=${o} g=${g} cli=${cli} puede=${puede} />`}`;
}

// 1) Recepción: revisión del auto con fotos. La conformidad del cliente NO es obligatoria (Dixon, The Effortless
// Experience: menos esfuerzo para el cliente = más lealtad; Thaler y Sunstein, Nudge: lo normal pasa solo).
// · En persona: marca un recuadro en tu celular (la firma es opcional).
// · Por WhatsApp: le llega el enlace; tú ves si lo abrió y qué respondió.
// · Si no responde, al entregar queda «sin observaciones hasta la entrega», con la hora. Tu respaldo son las fotos.
// Todo se puede cambiar hasta que entregas; después queda cerrado.
export function respuestaCliente(o) {
  const rec = (o && o.recepcion) || {};
  if (rec.cliente && rec.cliente.estado !== "pendiente") return rec.cliente;
  if (rec.firmadoEn) return { estado: "conforme", en: rec.firmadoEn, via: "firma", nombre: rec.firmaNombre };
  return null;
}
const VIA = { "en persona": "en persona", "su celular": "desde su celular", firma: "con firma", "hasta la entrega": "al entregar" };
function Recepcion({ o, g, cli, puede }) {
  const rec = o.recepcion || {}, items = rec.items || [];
  const cerrada = ["entregado", "anulado"].includes(o.estado), edita = puede && !cerrada;
  const [firmando, setFirmando] = useState(false);
  const cl = respuestaCliente(o), desact = cl && rec.editado && rec.editado > cl.en && cl.via !== "hasta la entrega";
  const estadoZona = z => (items.find(i => i.zona === z) || {}).estado || "ok";
  const setRec = p => g({ recepcion: Object.assign({}, rec, p, { editado: Date.now() }) });
  const setCliente = c => g({ recepcion: Object.assign({}, rec, { cliente: c }) });
  const marcar = z => menu(z, Object.keys(DANOS).map(k => ({ n: DANOS[k], icono: k === "ok" ? "circle-check" : "circle-alert", f: async () => {
    let nota = "";
    if (k !== "ok") { nota = await preguntar({ titulo: z + ": " + DANOS[k], etiqueta: "Detalle (opcional)", si: "Anotar" }); if (nota === null) return; }
    const resto = items.filter(i => i.zona !== z);
    setRec({ items: k === "ok" ? resto : [...resto, { zona: z, estado: k, nota }] });
  } })));
  const enviar = () => { if (!cli) return; g({ recepcion: Object.assign({}, rec, { enviada: Date.now(), visto: null }) }); enviarWa(cli.tel, N.mensaje("recepcion", N.varsOrden(o))); };
  const enPersona = v => setCliente(v ? { estado: "conforme", en: Date.now(), via: "en persona", nombre: nombreDe(cli) } : { estado: "pendiente", en: Date.now() });
  const firmar = async data => { setFirmando(false); const ref = await D.agregarFoto(data, "comprobante", "firma recepcion " + (o.numero || "")); setCliente({ estado: "conforme", en: Date.now(), via: "firma", nombre: nombreDe(cli), firmaLocal: ref }); aviso("Firma guardada. Puedes rehacerla hasta entregar."); };
  const empezar = () => { g({ estado: "proceso", inicio: o.inicio || Date.now(), reloj: { desde: Date.now(), acum: 0 } }); };
  return html`<div class="columnas">
    <div>
      ${cerrada && html`<div style="margin-bottom:14px"><${AvisoLinea} icono="lock">Revisión cerrada al entregar${o.entregado ? " el " + fechaHora(o.entregado) : ""}. Ya no se puede cambiar.<//></div>`}
      <${Bloque} titulo="Estado del auto al llegar" sub=${cerrada ? "" : "Toca una zona si tiene algún detalle. Protege tu trabajo ante reclamos."}>
        <div class="zonas">${ZONAS.map(z => { const e = estadoZona(z), it = items.find(i => i.zona === z); return html`<button class=${clases("zona", e !== "ok" && "mal")} disabled=${!edita} onClick=${() => edita && marcar(z)}><b>${z}</b><span class=${e === "ok" ? "mas-tenue chico" : "chico"}>${DANOS[e]}${it && it.nota ? ": " + it.nota : ""}</span></button>`; })}</div>
      <//>
      <${Bloque} titulo="Fotos de llegada"><${CampoFotos} valor=${o.fotosAntes || []} cambiar=${v => g({ fotosAntes: v, recepcion: Object.assign({}, rec, { fotos: v, editado: Date.now() }) })} tipo="orden" nombre=${"antes " + (o.numero || "")} soloLeer=${!edita} ayuda="4 esquinas, interior y cualquier daño. Son tu respaldo y luego tu antes y después." /><//>
    </div>
    <div>
      <div class="panel form">
        <${Entrada} etiqueta="Objetos de valor en el auto" valor=${rec.objetos} cambiar=${v => setRec({ objetos: v })} placeholder="Lentes, cargador, monedas…" disabled=${!edita} />
        <${Area} etiqueta="Observaciones" valor=${rec.obs} cambiar=${v => setRec({ obs: v })} placeholder="Pedidos del cliente, manchas difíciles…" disabled=${!edita} />
        <div class="separador"></div>
        <div class="titulo-seccion"><h3>Conformidad del cliente</h3><p>Opcional. Si no responde, al entregar queda registrado «sin observaciones hasta la entrega».</p></div>
        <${EstadoConformidad} rec=${rec} cl=${cl} desact=${desact} cerrada=${cerrada} />
        ${edita && !firmando && html`
          <label class=${clases("conforme-check", cl && cl.estado === "conforme" && "si")}><input type="checkbox" checked=${!!(cl && cl.estado === "conforme")} onChange=${e => enPersona(e.currentTarget.checked)} />
            <span><b>El cliente revisó y está conforme</b><small>Muéstrale las fotos en tu celular y que marque aquí. Se puede desmarcar hasta entregar.</small></span></label>
          <div class="btns">${cli && html`<${Boton} icono="send" onClick=${enviar}>${rec.enviada ? "Reenviar por WhatsApp" : "Enviar por WhatsApp"}<//>`}<${Boton} tipo="fantasma" icono="signature" onClick=${() => setFirmando(true)}>${cl && cl.via === "firma" ? "Rehacer firma" : "Prefiere firmar"}<//></div>`}
        ${edita && firmando && html`<${Firma} cambiar=${d => d && firmar(d)} /><${Boton} tipo="fantasma" chico onClick=${() => setFirmando(false)}>Cancelar<//>`}
      </div>
      ${puede && o.estado === "recepcion" && html`<div style="margin-top:14px"><${Boton} tipo="primario" grande bloque icono="play" onClick=${empezar}>Empezar el trabajo<//><p class="nota" style="margin-top:6px">No necesitas esperar la respuesta del cliente para empezar.</p></div>`}
    </div></div>`;
}
function EstadoConformidad({ rec, cl, desact, cerrada }) {
  const pasos = [];
  if (rec.enviada) {
    pasos.push(html`<li class="hecho"><${Icono} n="send" /><span>Enviado por WhatsApp · ${fechaHora(rec.enviada)}</span></li>`);
    pasos.push(rec.visto ? html`<li class="hecho"><${Icono} n="eye" /><span>Lo abrió · ${fechaHora(rec.visto)}</span></li>`
      : html`<li><${Icono} n="eye-off" /><span>Aún no abre el enlace</span></li>`);
  }
  if (cl) pasos.push(cl.estado === "observacion"
    ? html`<li class="alerta"><${Icono} n="circle-alert" /><span><b>Tiene una observación</b> · ${fechaHora(cl.en)}<br />«${cl.texto}»<br /><small>Revísalo con él y anótalo arriba si corresponde.</small></span></li>`
    : html`<li class="ok"><${Icono} n="circle-check" /><span><b>${cl.estado === "sin observaciones" ? "Sin observaciones hasta la entrega" : "Conforme"}</b> ${VIA[cl.via] || ""} · ${fechaHora(cl.en)}${cl.nombre ? " · " + cl.nombre : ""}${cl.firmaLocal || cl.firmaId ? " · firmó" : ""}</span></li>`);
  else if (!cerrada) pasos.push(html`<li><${Icono} n="hourglass" /><span>Sin respuesta todavía. No es obligatoria.</span></li>`);
  return html`<ul class="linea-estado">${pasos}</ul>
    ${desact && html`<${AvisoLinea} c="ambar" icono="triangle-alert">Cambiaste la revisión después de su respuesta. Si el cambio es importante, muéstraselo o reenvíaselo.<//>`}`;
}
// 2) Proceso: cronómetro, pasos e insumos
function Cronometro({ o, g, puede }) {
  const r = o.reloj || { desde: null, acum: 0 };
  const [, tic] = useState(0);
  useEffect(() => { if (!r.desde) return; const t = setInterval(() => tic(x => x + 1), 1000); return () => clearInterval(t); }, [r.desde]);
  const ms = n0(r.acum) + (r.desde ? Date.now() - r.desde : 0), min = Math.floor(ms / 60000), est = N.minutosEstandar(o);
  const t = `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}:${String(Math.floor(ms / 1000) % 60).padStart(2, "0")}`;
  const alternar = () => g({ reloj: r.desde ? { desde: null, acum: ms } : { desde: Date.now(), acum: n0(r.acum) } });
  return html`<div class="cronometro">
    <div style="flex:1"><div class="cifra-grande">${t}</div><div class="tenue">Tiempo estándar: ${duracion(est)}${min > est * 1.1 ? html` · <span style="color:var(--ambar)">vas ${duracion(min - est)} por encima</span>` : ""}</div></div>
    ${puede && html`<${Boton} grande icono=${r.desde ? "pause" : "play"} onClick=${alternar}>${r.desde ? "Pausar" : "Seguir"}<//>`}
  </div>`;
}
export function minutosReloj(o) { const r = o.reloj || {}; const ms = n0(r.acum) + (r.desde ? Date.now() - r.desde : 0); return ms ? Math.max(1, Math.round(ms / 60000)) : null; }
function Proceso({ o, g, puede }) {
  const pasos = o.pasos || [], hechos = pasos.filter(p => p.ok).length;
  const consumo = o.consumo || [];
  const marcar = (i, v) => g({ pasos: pasos.map((p, j) => (j === i ? Object.assign({}, p, { ok: v, en: v ? Date.now() : null }) : p)) });
  const agregar = async () => { const t = await preguntar({ titulo: "Agregar paso", etiqueta: "Paso", si: "Agregar" }); if (t) g({ pasos: [...pasos, { t, ok: false }] }); };
  const usos = (i, v) => { const p = D.uno("productos", consumo[i].productoId); g({ consumo: consumo.map((c, j) => (j === i ? Object.assign({}, c, { usos: v || 0, costo: Math.round(n0(v) * N.costoUso(p) * 100) / 100 }) : c)) }); };
  return html`<div class="columnas">
    <div>
      <${Cronometro} o=${o} g=${g} puede=${puede} />
      <${Bloque} titulo="Pasos" sub=${pasos.length ? `${hechos} de ${pasos.length}` : "Agrega los pasos de cada servicio en Configuración → Servicios"} der=${puede && html`<${Boton} chico tipo="fantasma" icono="plus" onClick=${agregar}>Paso<//>`} clase="" >
        ${pasos.length > 0 && html`<div class="grupo">${pasos.map((p, i) => html`<div class=${clases("fila compacta", p.ok && "hecha")}><${Check} si=${p.ok} cambiar=${v => puede && marcar(i, v)} /><span class="cuerpo"><span class="t">${p.t}</span></span></div>`)}</div>`}
      <//>
    </div>
    <div>
      <${Bloque} titulo="Insumos usados" sub="Se descuentan del inventario al entregar">
        ${consumo.length ? html`<div class="grupo">${consumo.map((c, i) => html`<div class="fila compacta"><span class="cuerpo"><span class="t">${c.nombre}</span><span class="s">${soles(c.costo)}</span></span>
          <span class="der" style="width:110px"><${Numero} valor=${c.usos} cambiar=${v => usos(i, v)} sufijo="usos" aria-label=${"Usos de " + c.nombre} /></span></div>`)}</div>`
          : html`<p class="nota">Los servicios no tienen receta de insumos. Agrégala en Configuración → Servicios para saber tu costo real.</p>`}
      <//>
      ${puede && html`<${Boton} tipo="primario" grande bloque icono="shield-check" onClick=${() => g({ estado: "calidad", reloj: Object.assign({}, o.reloj, { desde: null, acum: n0((o.reloj || {}).acum) + ((o.reloj || {}).desde ? Date.now() - o.reloj.desde : 0) }) })}>Pasar a control de calidad<//>`}
    </div></div>`;
}

// 3) Control de calidad: solo lo que aplica a lo que hiciste (Gawande: corta, por partes, con lo que no puede fallar)
function Calidad({ o, g, puede }) {
  const lista = N.calidadDeOrden(o), partes = N.partesOrden(o);
  const marcas = o.calidad || [];
  const ok = t => (marcas.find(m => m.t === t) || {}).ok;
  const marcar = (t, v) => g({ calidad: [...marcas.filter(m => m.t !== t), { t, ok: v }] });
  const hechos = lista.filter(x => ok(x.t)).length, todo = hechos === lista.length;
  const aprobar = async () => {
    if (!todo) return aviso("Revisa todos los puntos antes de aprobar.", { error: true });
    if (!(o.fotosDespues || []).length && !(await confirmar({ titulo: "No hay fotos de después", texto: "Son tu antes y después y tu respaldo. ¿Aprobar igual?", si: "Aprobar igual" }))) return;
    g({ estado: "listo", fin: Date.now(), minutosReales: minutosReloj(o) || N.minutosEstandar(o), calidadOk: !(o.reintentos > 0) });
  };
  const corregir = () => { g({ estado: "proceso", reintentos: n0(o.reintentos) + 1, reloj: Object.assign({}, o.reloj, { desde: Date.now() }) }); aviso("Vuelve a proceso. Cuenta como reproceso en tus indicadores."); };
  return html`<div class="columnas">
    <div><${Bloque} titulo="Revisión final" sub=${`Según lo que hiciste: ${partes.map(p => PARTES[p] || p).join(" · ")} · ${hechos} de ${lista.length}`}>
      <div class="grupo">${lista.map(x => html`<div class=${clases("fila compacta", ok(x.t) && "hecha")}><${Check} si=${ok(x.t)} cambiar=${v => puede && marcar(x.t, v)} /><span class="cuerpo"><span class="t" style="white-space:normal">${x.t}</span>${x.a === "siempre" ? html`<span class="s">Siempre</span>` : null}</span></div>`)}</div>
      <p class="nota" style="margin-top:8px">La lista se arma con las partes que trabaja cada servicio. Cámbiala en Configuración → Servicios → Revisión final.</p><//></div>
    <div>
      <${Bloque} titulo="Fotos de después"><${CampoFotos} valor=${o.fotosDespues || []} cambiar=${v => g({ fotosDespues: v })} tipo="orden" nombre=${"despues " + (o.numero || "")} soloLeer=${!puede} ayuda="Mismos ángulos que las de llegada. Son tu mejor publicidad." /><//>
      ${puede && html`<div class="btns"><${Boton} tipo="primario" grande icono="circle-check" onClick=${aprobar} disabled=${!todo}>Aprobar: auto listo<//><${Boton} grande onClick=${corregir}>Falta corregir<//></div>`}
    </div></div>`;
}

// 4 y 5) Cobro y entrega: el momento que el cliente recuerda (Heath, The Power of Moments)
function Cierre({ o, g, cli, puede }) {
  const s = N.saldoOrden(o), pagos = N.pagosDeOrden(o);
  const [cobro, setCobro] = useState(null);
  const [editar, setEditar] = useState(false);
  const fid = cli ? N.fidelidad(cli) : null;
  const entregar = () => {
    if (s.saldo > 0 && !confirm(`Falta cobrar ${soles(s.saldo)}. ¿Entregar igual? Quedará en Por cobrar.`)) return;
    (o.consumo || []).forEach(c => { if (n0(c.usos) > 0) { const p = D.uno("productos", c.productoId); if (p) N.moverInventario({ productoId: p.id, tipo: "salida", cantidad: n0(p.rinde) > 0 ? n0(c.usos) / n0(p.rinde) : n0(c.usos), motivo: "Orden " + (o.numero || ""), ordenId: o.id }); } });
    // Si el cliente no respondió la revisión de llegada, queda «sin observaciones hasta la entrega» con la hora.
    const rec = o.recepcion || {}, tacita = !respuestaCliente(o);
    const recepcion = Object.assign({}, rec, tacita ? { cliente: { estado: "sin observaciones", en: Date.now(), via: "hasta la entrega" } } : {}, { cerrada: Date.now() });
    const fin = g({ estado: "entregado", entregado: Date.now(), recepcion, costoInsumos: suma(o.consumo || [], "costo"), minutosReales: o.minutosReales || minutosReloj(o) || N.minutosEstandar(o), fin: o.fin || Date.now() }) || o;
    if (o.citaId) D.cambiar("citas", o.citaId, { estado: "completada" });
    // La reseña NO se pide aquí (Google: sin presión en el lugar). Queda un seguimiento para más tarde, a quien lleva el WhatsApp.
    if (cli && cli.tel && !D.lista("tareas").some(t => t.ordenId === o.id && t.tipo === "opinion")) {
      const h = Math.min(20, Math.max(new Date().getHours() + 3, 9));
      D.guardar("tareas", { fecha: hoy(), hora: String(h).padStart(2, "0") + ":00", titulo: "Agradecer y pedir su opinión a " + (o._cliente || nombreDe(cli)), tipo: "opinion", prioridad: "media", hecho: false,
        clienteId: cli.id, ordenId: o.id, mensaje: N.mensaje("resena", N.varsOrden(fin)), asignadoId: D.responsable("ventas") || (D.yo() || {}).id || "" });
    }
    aviso("Entregado. Mándale sus fotos ahora; la opinión se la pide " + (D.somosVarios() ? "quien lleva el WhatsApp" : "tú") + " más tarde (quedó en Seguimientos).",
      cli ? { accion: { n: "Enviar fotos", f: () => enviarWa(cli.tel, N.mensaje("listo", N.varsOrden(fin))) } } : {});
  };
  return html`<div class="columnas">
    <div>
      <${Bloque} titulo="Servicios" der=${puede && o.estado !== "entregado" && html`<${Boton} chico tipo="fantasma" icono="pencil" onClick=${() => setEditar(true)}>Editar<//>`}>
        <div class="panel">
          ${(o.items || []).map(i => html`<${Par} n=${i.nombre + (n0(i.cant) > 1 ? " ×" + i.cant : "")} v=${soles(n0(i.precio) * (n0(i.cant) || 1))} />`)}
          ${n0(o.descuento) > 0 && html`<${Par} n="Descuento" v=${"−" + soles(o.descuento)} />`}
          <${Par} total n=${o.cobro && o.cobro !== "normal" ? "Total (" + COBROS[o.cobro].n.toLowerCase() + ")" : "Total"} v=${soles(o.total)} />
          ${pagos.map(p => html`<${Par} n=${"Pagó " + (METODOS[p.metodo] || p.metodo) + " · " + fechaCorta(p.fecha)} v=${soles(p.monto)} />`)}
          ${s.cobra && html`<${Par} total n="Falta cobrar" v=${html`<span style=${{ color: s.saldo ? "var(--ambar)" : "var(--verde)" }}>${soles(s.saldo)}</span>`} />`}
        </div>
      <//>
      <${RuletaOrden} o=${o} g=${g} cli=${cli} puede=${puede} />
      ${fid && fid.activo && html`<${Bloque} titulo="Tarjeta de sellos"><div class="panel">
        <${Sellos} actuales=${fid.actuales} cada=${fid.cada} />
        <p style="margin:12px 0">${fid.disponibles ? html`<b>¡Tiene ${fid.disponibles} premio disponible!</b> ${fid.premio}. Para usarlo, pon el tipo de cobro en «Premio de fidelidad» y toca Canjear.` : fid.sellos ? `${fid.sellos} de ${fid.cada} sellos. Le faltan ${fid.cada - fid.sellos} para su regalo: ${N.premioCorto(fid.premio)}.` : `Aún no tiene sellos. Al sumar el primero recibe ${fid.regalo} de regalo: se siente más cerca del premio y vuelve antes.`}</p>
        <div class="btns">${o.sello ? html`<span class="nota">✓ Ya sumaste el sello de esta orden</span>` : puede && (!o.cobro || o.cobro === "normal") && html`<${Boton} tipo="primario" chico icono="sparkles" onClick=${() => { const r = N.sumarSello(cli, o.id); aviso(r.sumados > 1 ? `Sumaste ${r.sumados} sellos (incluye el regalo de bienvenida).` : "Sello sumado."); }}>${fid.sellos ? "Sumar sello" : `Sumar primer sello (+${fid.regalo})`}<//>`}
          ${fid.disponibles > 0 && puede && html`<${Boton} chico icono="gift" onClick=${() => { N.canjearPremio(cli); g({ cobro: "premio" }); aviso("Premio canjeado. La tarjeta vuelve a empezar."); }}>Canjear premio<//>`}
          <${Boton} chico icono="qr-code" onClick=${() => import("../app.js").then(m => m.abrir(() => import("./acceso.js"), "AccesoCliente", { id: cli.id }))}>Darle su tarjeta<//></div>
        <p class="nota" style="margin-top:8px">Dale su tarjeta ahora, mientras ve su auto terminado: el final es lo que más recuerda.</p>
      </div><//>`}
    </div>
    <div>
      ${o.estado === "entregado" ? html`<div class="panel">
          <h3>Entregado ${o.entregado ? fechaHora(o.entregado) : ""}</h3>
          <p class="tenue">${o.minutosReales ? "Tiempo real " + duracion(o.minutosReales) + " · estándar " + duracion(N.minutosEstandar(o)) : ""}</p>
          ${o.calificacion ? html`<p style="margin-top:10px">Calificación: <b>${o.calificacion} de 5</b>${o.nps !== undefined && o.nps !== null && o.nps !== "" ? " · recomendaría " + o.nps + "/10" : ""}${o.comentario ? html`<br /><span class="tenue">«${o.comentario}»</span>` : ""}</p>` : html`<p class="nota" style="margin-top:10px">Aún no califica. Lo hace con un toque en su enlace personal.</p>`}
          ${cli && html`<div class="btns" style="margin-top:12px"><${Boton} icono="message-circle" onClick=${() => enviarWa(cli.tel, N.mensaje("listo", N.varsOrden(o)))}>Enviar fotos${N.varsOrden(o).regalo ? " y su giro" : ""}<//><${Boton} icono="star" onClick=${() => enviarWa(cli.tel, N.mensaje("resena", N.varsOrden(o)))}>Pedir opinión<//></div>`}
        </div>` : html`<div class="panel form">
          ${s.cobra && s.saldo > 0 && puede && D.puedeEditar("pagos") && html`<${Boton} tipo="primario" grande bloque icono="banknote" onClick=${() => setCobro(true)}>Cobrar ${soles(s.saldo)}<//>`}
          ${cli && html`<${Boton} grande bloque icono="message-circle" onClick=${() => enviarWa(cli.tel, N.mensaje("listo", N.varsOrden(o)))}>Avisar que está listo<//>`}
          ${puede && html`<${Boton} tipo=${s.saldo > 0 ? "" : "primario"} grande bloque icono="circle-check" onClick=${entregar}>Entregar el auto<//>`}
        </div>`}
    </div>
    ${cobro && html`<${FormPago} o=${o} saldo=${s.saldo} cerrar=${() => setCobro(null)} />`}
    ${editar && html`<${EditarItems} o=${o} g=${g} cerrar=${() => setEditar(false)} />`}
  </div>`;
}
function FormPago({ o, saldo, cerrar }) {
  const [f, set] = useFicha({ monto: saldo, metodo: "yape", referencia: "" });
  const guardar = () => {
    if (!(n0(f.monto) > 0)) return aviso("Escribe el monto.", { error: true });
    N.avisarCobro(D.guardar("pagos", { fecha: hoy(), _cliente: o._cliente, concepto: "Orden " + (o.numero || ""), monto: n0(f.monto), metodo: f.metodo, referencia: f.referencia, ordenId: o.id, clienteId: o.clienteId, citaId: o.citaId || "" }));
    aviso("Cobro de " + soles(f.monto) + " registrado."); cerrar();
  };
  return html`<${Hoja} centro titulo="Registrar cobro" cerrar=${cerrar} pie=${html`<${Boton} tipo="fantasma" onClick=${cerrar}>Cancelar<//><${Boton} tipo="primario" onClick=${guardar}>Guardar cobro<//>`}>
    <div class="form"><${Dinero} etiqueta="Monto" ...${b(f, set, "monto")} />
      <${Chips} valor=${f.metodo} cambiar=${v => set("metodo", v || f.metodo)} opciones=${Object.keys(METODOS).map(k => ({ v: k, n: METODOS[k] }))} />
      ${f.metodo !== "efectivo" && html`<${Entrada} etiqueta="Número de operación (opcional)" ...${b(f, set, "referencia")} />`}</div><//>`;
}
function EditarItems({ o, g, cerrar }) {
  const [items, setItems] = useState((o.items || []).map(i => Object.assign({ cant: 1 }, i)));
  const [desc, setDesc] = useState(n0(o.descuento)), [cobro, setCobro] = useState(o.cobro || "normal");
  const agregar = ids => { const nuevos = N.itemsDeServicios(ids.filter(id => !items.some(i => i.servicioId === id)), o.tamano); setItems([...items.filter(i => !i.servicioId || ids.includes(i.servicioId)), ...nuevos]); };
  const guardar = () => { g({ items, descuento: desc, cobro, total: N.totalItems(items, desc), consumo: N.consumoDeServicios(items) }); cerrar(); };
  return html`<${Hoja} titulo="Servicios y precio" cerrar=${cerrar} pie=${html`<${Boton} tipo="fantasma" onClick=${cerrar}>Cancelar<//><${Boton} tipo="primario" onClick=${guardar}>Guardar<//>`}>
    <div class="form">
      <${ElegirServicios} valor=${items.map(i => i.servicioId).filter(Boolean)} cambiar=${agregar} tamano=${o.tamano} />
      ${items.map((it, k) => html`<div class="rejilla dos-movil"><${Entrada} etiqueta="Servicio" valor=${it.nombre} cambiar=${v => setItems(items.map((x, j) => (j === k ? Object.assign({}, x, { nombre: v }) : x)))} /><${Dinero} etiqueta="Precio" valor=${it.precio} cambiar=${v => setItems(items.map((x, j) => (j === k ? Object.assign({}, x, { precio: v || 0 }) : x)))} /></div>`)}
      <${Dinero} etiqueta="Descuento" valor=${desc} cambiar=${v => setDesc(v || 0)} />
      <${Selector} etiqueta="Tipo de cobro" valor=${cobro} cambiar=${setCobro} opciones=${Object.keys(COBROS).map(k => ({ v: k, n: COBROS[k].n + " · " + COBROS[k].d }))} />
      <${Par} total n="Total" v=${soles(N.totalItems(items, desc))} />
    </div><//>`;
}

// Ruleta: su giro de esta orden y los premios que tiene para usar (se aplican aquí con un toque)
function RuletaOrden({ o, g, cli, puede }) {
  const R = N.ruleta();
  const mios = cli ? N.premiosRuletaDe(cli.id).filter(p => p.ordenId !== o.id) : [];
  const elegible = R.activo && (!o.cobro || o.cobro === "normal") && n0(o.total) >= n0(R.minimo);
  if (!o.ruleta && !mios.length && !(elegible && o.estado === "entregado")) return null;
  const aplicar = async p => {
    if (!(await confirmar({ titulo: "Usar su premio", texto: p.n + (p.tipo === "regalo" ? ". Entrégaselo y queda marcado como usado." : ". Se agrega a esta orden."), si: "Usar ahora" }))) return;
    N.canjearRuleta(p, o.estado === "entregado" ? null : o); aviso("Premio aplicado.");
  };
  const diasGiro = o.entregado ? sumarDiasMs(o.entregado, n0(R.dias) || 7) : "";
  return html`<${Bloque} titulo="Ruleta de premios"><div class="panel">
    ${o.ruleta ? html`<p>Ganó <b>${o.ruleta.n}</b>${o.ruleta.tipo === "sello" ? " (ya está en su tarjeta)." : o.ruleta.estado === "canjeado" ? " · ya lo usó." : ` · lo usa hasta el ${fechaCorta(o.ruleta.vence)}.`}</p>`
      : elegible && o.estado === "entregado" ? html`<p>Tiene un giro esperándolo en su enlace${diasGiro ? " hasta el " + fechaCorta(diasGiro) : ""}. Se lo mandas con sus fotos.</p>` : null}
    ${mios.length > 0 && html`<p class="nota" style="margin:${o.ruleta || elegible ? "10px" : "0"} 0 8px">Premios que tiene para usar:</p>
      <div class="grupo">${mios.map(p => html`<div class="fila compacta"><span class="ico oro"><${Icono} n="gift" /></span><span class="cuerpo"><span class="t" style="white-space:normal">${p.n}</span><span class="s">Vence ${relativa(p.vence)}</span></span>
        ${puede && html`<span class="der"><${Boton} chico tipo="primario" onClick=${() => aplicar(p)}>Usar<//></span>`}</div>`)}</div>`}
  </div><//>`;
}
const sumarDiasMs = (ms, d) => new Date(ms + d * 86400000 - 5 * 3600000).toISOString().slice(0, 10);

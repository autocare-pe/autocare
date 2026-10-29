// AUTOCARE · Clientes: lista por segmentos y ficha 360 (historial, vehículos, fidelidad, portal)
// Retener cuesta menos que conseguir (Reichheld y Sasser, HBR 1990). Los segmentos salen de recencia,
// frecuencia y monto (RFM, Arthur Hughes).
import { html, useState, useMemo } from "../../vendor/preact-htm.js";
import * as D from "../datos.js";
import * as N from "../negocio.js";
import { ir, usarTitulo } from "../app.js";
import { Boton, Icono, Hoja, Entrada, Area, Selector, Interruptor, Buscador, Chips, Insignia, Vacio, Fila, Tabla, Resumen, Sellos, Bloque, AvisoLinea, aviso, confirmar, menu, useFicha, b } from "../ui.js";
import { FormVehiculoRapido, enviarWa, EstadoBadge } from "../piezas.js";
import { FilaCita } from "./agenda.js";
import { hoy, fechaCorta, relativa, soles, nombreDe, telBonito, telNorm, coincide, copiar, n0 } from "../util.js";
import { CANALES } from "../esquema.js";

export default function Clientes({ ruta }) {
  D.useDatos();
  usarTitulo(ruta.partes[0] ? null : "Clientes");
  const [q, setQ] = useState(""), [seg, setSeg] = useState(ruta.q.seg || ""), [nuevo, setNuevo] = useState(false);
  if (ruta.partes[0]) return html`<${Ficha} id=${ruta.partes[0]} />`;
  const P = N.perfiles(), vehs = D.lista("vehiculos");
  const todos = D.lista("clientes");
  const cuenta = {}; todos.forEach(c => { const s = (P.get(c.id) || {}).seg || "sin"; cuenta[s] = (cuenta[s] || 0) + 1; });
  const filas = todos.filter(c => (!seg || (P.get(c.id) || {}).seg === seg) && (!q || coincide(nombreDe(c) + " " + c.tel + " " + c.distrito + " " + vehs.filter(v => v.clienteId === c.id).map(v => v.placa + " " + v.marca).join(" "), q)))
    .map(c => Object.assign({ c }, P.get(c.id) || {}, { id: c.id }));
  const S = N.SEGMENTOS;
  return html`
    <header class="pagina-cab"><div><h1>Clientes</h1><p>${todos.length} clientes. ${cuenta.toca ? `A ${cuenta.toca} les toca volver: escríbeles hoy.` : ""}</p></div>
      <div class="acciones">${D.puedeEditar("clientes") && html`<${Boton} tipo="primario" icono="user-plus" onClick=${() => setNuevo(true)}>Nuevo cliente<//>`}</div></header>
    <div class="filtros"><${Buscador} valor=${q} cambiar=${setQ} placeholder="Nombre, celular, placa o distrito" /></div>
    <div style="margin-bottom:16px"><${Chips} desliza valor=${seg} cambiar=${setSeg} opciones=${[{ v: "", n: "Todos", cuenta: todos.length, fijo: true }, ...Object.keys(S).filter(k => cuenta[k]).map(k => ({ v: k, n: S[k].n, cuenta: cuenta[k] }))]} /></div>
    ${seg && html`<div style="margin-bottom:16px"><${AvisoLinea} c=${S[seg].c === "rojo" ? "rojo" : "oro"} icono="lightbulb">${S[seg].d}<//></div>`}
    <${Tabla} filas=${filas} onFila=${r => ir("clientes/" + r.id)}
      vacio=${html`<${Vacio} icono="users" titulo=${q || seg ? "Nadie coincide" : "Aún no tienes clientes"} texto="Se crean solos cuando reservan en tu web, o agrégalos tú." />`}
      movil=${r => html`<${Fila} avatar=${nombreDe(r.c)} titulo=${nombreDe(r.c)} sub=${(r.ultima ? "Última vez " + relativa(r.ultima) : "Sin servicios") + (r.visitas ? " · " + r.visitas + (r.visitas === 1 ? " visita" : " visitas") : "")} href=${"#/clientes/" + r.id}
        der=${html`<${Insignia} c=${S[r.seg].c}>${S[r.seg].n}<//>`} />`}
      cols=${[{ k: "nombre", n: "Cliente", v: r => nombreDe(r.c), f: r => html`<span class="prin">${nombreDe(r.c)}</span>` }, { k: "tel", n: "WhatsApp", v: r => r.c.tel, f: r => telBonito(r.c.tel), clase: "tenue" },
        { k: "distrito", n: "Distrito", v: r => r.c.distrito || "", f: r => r.c.distrito || "", clase: "tenue" },
        { k: "visitas", n: "Visitas", num: true }, { k: "ultima", n: "Última vez", v: r => r.ultima || "", f: r => (r.ultima ? relativa(r.ultima) : "—") },
        { k: "gasto", n: "Gastó en total", num: true, f: r => soles(r.gasto) }, { k: "seg", n: "Segmento", f: r => html`<${Insignia} c=${S[r.seg].c}>${S[r.seg].n}<//>` }]} />
    ${nuevo && html`<${FormCliente} cerrar=${() => setNuevo(false)} alGuardar=${c => ir("clientes/" + c.id)} />`}`;
}

// ---------------------------------------------------------------- ficha 360
function Ficha({ id }) {
  D.useDatos();
  const c = D.uno("clientes", id);
  usarTitulo(c ? nombreDe(c) : "Cliente");
  const [editar, setEditar] = useState(false), [veh, setVeh] = useState(null);
  if (!c) return html`<${Vacio} titulo="No encuentro este cliente"><${Boton} href="#/clientes">Ver clientes<//><//>`;
  const p = N.perfil(c.id), S = N.SEGMENTOS[p.seg], fid = N.fidelidad(c), vehs = N.vehiculosDe(c.id);
  const ots = D.lista("ordenes").filter(o => o.clienteId === c.id).sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));
  const citas = D.lista("citas").filter(x => x.clienteId === c.id && x.fecha >= hoy() && N.citaActiva(x)).sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora));
  const saldo = ots.reduce((a, o) => a + (o.estado === "entregado" ? N.saldoOrden(o).saldo : 0), 0);
  const refs = D.lista("clientes").filter(x => x.referidoPor === c.id);
  const puede = D.puedeEditar("clientes");
  const mensajes = () => menu("Mensaje para " + c.nombre, [
    { n: "Le toca su mantenimiento", icono: "repeat", f: () => enviarWa(c.tel, N.mensaje("volver", N.varsCliente(c))) },
    { n: "Ofrecer plan mensual", icono: "crown", f: () => enviarWa(c.tel, N.mensaje("plan", N.varsCliente(c))) },
    { n: "Invitar a recomendar", icono: "gift", f: () => enviarWa(c.tel, N.mensaje("referido", N.varsCliente(c))) },
    { n: "Pedir reseña", icono: "star", f: () => enviarWa(c.tel, N.mensaje("resena", N.varsCliente(c))) },
    { n: "Mensaje libre", icono: "message-circle", f: () => enviarWa(c.tel, "") }]);
  const portal = () => import("../app.js").then(m => m.abrir(() => import("./acceso.js"), "AccesoCliente", { id: c.id }));
  const eliminar = async () => {
    if (ots.length) return aviso("Tiene órdenes registradas. Márcalo como inactivo en vez de eliminarlo.", { error: true });
    if (!(await confirmar({ titulo: "Eliminar cliente", texto: "Se borra de tu hoja.", si: "Eliminar", peligro: true }))) return;
    D.borrar("clientes", c.id); ir("clientes");
  };
  return html`
    <div class="ficha-cab"><span class="avatar grande oro">${(c.nombre || "?")[0]}</span>
      <div><h1>${nombreDe(c)}</h1><p class="tenue">${telBonito(c.tel)}${c.distrito ? " · " + c.distrito : ""}${c.canal ? " · llegó por " + c.canal : ""}</p>
        <div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap"><${Insignia} c=${S.c}>${S.n}<//>${p.membresia && html`<${Insignia} c="oro" sinPunto>Plan activo<//>`}${c.acepta === false && html`<${Insignia} sinPunto>No quiere promociones<//>`}</div></div>
      <div class="acciones">
        <${Boton} icono="message-circle" onClick=${mensajes}>WhatsApp<//>
        ${D.puedeEditar("citas") && html`<${Boton} tipo="primario" icono="calendar-plus" onClick=${() => import("../app.js").then(m => m.abrir(() => import("./agenda.js"), "FormCita", { inicial: { clienteId: c.id, vehiculoId: vehs[0] ? vehs[0].id : "", tamano: vehs[0] ? vehs[0].tamano : "auto", direccion: [c.direccion, c.distrito].filter(Boolean).join(", ") } }))}>Agendar<//>`}
        <${Boton} icono="ellipsis" titulo="Más" onClick=${() => menu(nombreDe(c), [
          puede && { n: "Editar datos", icono: "pencil", f: () => setEditar(true) },
          { n: "Darle su tarjeta", icono: "qr-code", d: "QR, WhatsApp, NFC, tarjeta y sticker para imprimir", f: portal },
          { n: "Llamar", icono: "phone", f: () => (location.href = "tel:" + c.tel) },
          puede && { n: "Eliminar", icono: "trash-2", peligro: true, f: eliminar }])} />
      </div></div>
    <${Resumen} items=${[{ n: "Visitas", v: p.visitas }, { n: "Gastó en total", v: soles(p.gasto) }, { n: "Ticket promedio", v: p.visitas ? soles(Math.round(p.ticket)) : "—" },
      { n: "Última vez", v: p.ultima ? relativa(p.ultima) : "—" }, { n: "Le toca volver", v: p.proxima ? relativa(p.proxima) : "—", c: p.proxima && p.proxima <= hoy() ? "oro" : "" },
      saldo > 0 ? { n: "Te debe", v: soles(saldo), c: "rojo" } : null]} />
    <div class="columnas" style="margin-top:22px">
      <div>
        ${citas.length > 0 && html`<${Bloque} titulo="Próximas citas"><div class="grupo">${citas.map(x => html`<${FilaCita} c=${x} conFecha />`)}</div><//>`}
        <${Bloque} titulo="Historial" sub=${ots.length ? ots.length + " órdenes" : ""}>
          ${ots.length ? html`<div class="grupo">${ots.slice(0, 30).map(o => html`<${Fila} icono="clipboard-list" titulo=${fechaCorta(o.fecha) + " · " + (N.nombresItems(o.items) || "Servicio")} sub=${[o.numero, o._vehiculo, o.calificacion ? o.calificacion + "★" : ""].filter(Boolean).join(" · ")}
            der=${html`<b class="cifra">${soles(o.total)}</b><${EstadoBadge} ent="ordenes" v=${o.estado} />`} href=${"#/ordenes/" + o.id} />`)}</div>`
            : html`<p class="nota">Todavía no lo atiendes.</p>`}<//>
        ${(c.notas || c.gustos || puede) && html`<${Bloque} titulo="Preferencias y notas" der=${puede && html`<${Boton} chico tipo="fantasma" icono="pencil" onClick=${() => setEditar(true)}>Editar<//>`}>
          <div class="panel">${N.gustosTexto(c) && html`<p style="margin-bottom:10px"><b>Nos contó en su tarjeta:</b> ${N.gustosTexto(c)}</p>`}<p class=${c.notas ? "" : "nota"} style=${"white-space:pre-wrap" + (!c.notas && c.gustos ? ";display:none" : "")}>${c.notas || "Anota lo que le gusta: aroma, cómo deja las llaves, si tiene mascota. La próxima vez lo atiendes como si lo recordaras todo."}</p></div><//>`}
      </div>
      <div>
        <${Bloque} titulo="Vehículos" der=${puede && html`<${Boton} chico tipo="fantasma" icono="plus" onClick=${() => setVeh({})}>Agregar<//>`}>
          ${vehs.length ? html`<div class="grupo">${vehs.map(v => html`<${Fila} icono="car" titulo=${[v.marca, v.modelo].filter(Boolean).join(" ") || "Vehículo"} sub=${[v.placa, v.color, N.tamanoDe(v.tamano).n].filter(Boolean).join(" · ")} onClick=${() => puede && setVeh(v)} />`)}</div>` : html`<p class="nota">Sin vehículos registrados.</p>`}
          ${veh && html`<div style="margin-top:10px"><${FormVehiculoRapido} clienteId=${c.id} inicial=${veh.id ? veh : null} cancelar=${() => setVeh(null)} listo=${() => setVeh(null)} /></div>`}
        <//>
        ${fid.activo && html`<${Bloque} titulo="Tarjeta de sellos"><div class="panel">
          <${Sellos} actuales=${fid.actuales} cada=${fid.cada} />
          <p style="margin-top:12px">${fid.disponibles ? html`<b>Tiene ${fid.disponibles} premio para canjear:</b> ${fid.premio}.` : fid.sellos ? `${fid.sellos} de ${fid.cada}. Le faltan ${fid.cada - fid.sellos} para su regalo: ${N.premioCorto(fid.premio)}.` : `Sin sellos todavía. El primero llega con ${fid.regalo} de regalo.`}</p>
          ${D.puedeEditar("clientes") && html`<div class="btns" style="margin-top:10px"><${Boton} chico tipo="primario" icono="plus" onClick=${() => { const r = N.sumarSello(c); aviso(r.sumados > 1 ? `Sumaste ${r.sumados} sellos (con regalo).` : "Sello sumado."); }}>Sumar sello<//>
            ${fid.sellos > 0 && html`<${Boton} chico tipo="fantasma" icono="minus" onClick=${() => N.quitarSello(c)}>Quitar<//>`}
            ${fid.disponibles > 0 && html`<${Boton} chico icono="gift" onClick=${() => { N.canjearPremio(c); aviso("Premio canjeado."); }}>Canjear premio<//>`}</div>`}
          <p class="nota" style="margin-top:10px">Código para recomendar: <b>${c.codigo || "—"}</b>${refs.length ? ` · recomendó a ${refs.length}` : ""}${fid.usados ? ` · canjeó ${fid.usados} premio(s)` : ""}</p><div class="btns" style="margin-top:12px"><${Boton} chico icono="qr-code" onClick=${portal}>Darle su tarjeta<//></div></div><//>`}
      </div>
    </div>
    ${editar && html`<${FormCliente} inicial=${c} cerrar=${() => setEditar(false)} />`}`;
}

// ---------------------------------------------------------------- formulario
export function FormCliente({ inicial, cerrar, alGuardar }) {
  const [f, set] = useFicha(Object.assign({ nombre: "", apellido: "", tel: "", email: "", distrito: "", direccion: "", referencia: "", canal: "", notas: "", cumple: "", docTipo: "", docNum: "", acepta: true, estado: "activo" }, inicial || {}));
  const guardar = () => {
    if (!String(f.nombre).trim()) return aviso("Escribe el nombre.", { error: true });
    const t = telNorm(f.tel);
    if (t && t.length !== 9) return aviso("El WhatsApp debe tener 9 dígitos.", { error: true });
    const otro = t && N.clientePorTel(t);
    if (otro && otro.id !== f.id) return aviso("Ese WhatsApp ya es de " + nombreDe(otro) + ".", { error: true });
    const c = N.asegurarPortal(D.guardar("clientes", Object.assign({}, f, { tel: t, nombre: f.nombre.trim(), alta: f.alta || hoy() })));
    aviso(inicial ? "Datos guardados." : "Cliente creado.");
    cerrar(); alGuardar && alGuardar(c);
  };
  return html`<${Hoja} titulo=${inicial ? "Editar cliente" : "Nuevo cliente"} cerrar=${cerrar} pie=${html`<${Boton} tipo="fantasma" onClick=${cerrar}>Cancelar<//><${Boton} tipo="primario" onClick=${guardar}>Guardar<//>`}>
    <div class="form">
      <div class="rejilla"><${Entrada} etiqueta="Nombre" ...${b(f, set, "nombre")} /><${Entrada} etiqueta="Apellido" ...${b(f, set, "apellido")} /></div>
      <div class="rejilla"><${Entrada} etiqueta="WhatsApp" tipo="tel" inputmode="tel" ...${b(f, set, "tel")} /><${Entrada} etiqueta="Correo" tipo="email" ...${b(f, set, "email")} /></div>
      <div class="rejilla"><${Entrada} etiqueta="Distrito" ...${b(f, set, "distrito")} /><${Entrada} etiqueta="Cumpleaños" tipo="date" ...${b(f, set, "cumple")} /></div>
      <${Entrada} etiqueta="Dirección" ...${b(f, set, "direccion")} />
      <${Entrada} etiqueta="Referencia" ...${b(f, set, "referencia")} placeholder="Frente al parque, portón negro" />
      <${Selector} etiqueta="¿Cómo te conoció?" vacio="Elegir" opciones=${CANALES} ...${b(f, set, "canal")} />
      <${Area} etiqueta="Preferencias y notas" ...${b(f, set, "notas")} />
      <div class="rejilla"><${Selector} etiqueta="Documento (para boleta o factura)" vacio="Ninguno" opciones=${["DNI", "RUC", "CE"]} ...${b(f, set, "docTipo")} /><${Entrada} etiqueta="Número" ...${b(f, set, "docNum")} /></div>
      <${Interruptor} etiqueta="Acepta recibir promociones" ayuda="Ley 29733: solo envía campañas a quien aceptó." ...${b(f, set, "acepta")} />
      ${inicial && html`<${Interruptor} etiqueta="Cliente activo" valor=${f.estado !== "inactivo"} cambiar=${v => set("estado", v ? "activo" : "inactivo")} />`}
    </div><//>`;
}

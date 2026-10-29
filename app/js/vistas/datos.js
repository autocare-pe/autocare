// AUTOCARE · Mis datos: ver, corregir y borrar cualquier dato; modo práctica y empezar de cero.
// Un solo lugar para arreglar lo que se cargó mal (Krug, «No me hagas pensar»: si algo está mal, que se vea
// dónde corregirlo) y para practicar sin miedo: lo de práctica se borra junto con un toque.
import { html, useState, useEffect, useMemo } from "../../vendor/preact-htm.js";
import * as D from "../datos.js";
import * as N from "../negocio.js";
import { api } from "../api.js";
import { ir, usarTitulo } from "../app.js";
import { Boton, BotonAccion, Hoja, Entrada, Numero, Area, Selector, Interruptor, Insignia, Vacio, Fila, Bloque, AvisoLinea, Buscador, Icono, aviso, confirmar, preguntar } from "../ui.js";
import { fechaCorta, soles, coincide, fechaHora, n0 } from "../util.js";
import { ENT, ESTADOS, METODOS, CATEGORIAS_GASTO, CANALES, COBROS } from "../esquema.js";

const GRUPOS = [
  { n: "Clientes", i: "users", e: ["clientes", "vehiculos", "membresias", "resenas", "reclamos"] },
  { n: "Ventas", i: "filter", e: ["leads", "cotizaciones", "tareas", "campanas"] },
  { n: "Agenda y servicios", i: "calendar-days", e: ["citas", "ordenes"] },
  { n: "Dinero", i: "wallet", e: ["pagos", "gastos", "cierres", "transferencias", "costosFijos"] },
  { n: "Inventario", i: "package", e: ["productos", "movimientos", "compras", "porComprar", "proveedores"] },
  { n: "Equipos y vehículo", i: "car", e: ["activos", "mantenimientos"] },
  { n: "Marketing", i: "megaphone", e: ["contenido", "metricas", "plantillas"] },
  { n: "Plan", i: "target", e: ["objetivos", "revisiones", "mejoras"] },
  { n: "Configuración", i: "settings", e: ["servicios", "planes"] }];
const RUTA_PROPIA = { clientes: id => "clientes/" + id, ordenes: id => "ordenes/" + id, citas: id => "agenda/cita/" + id, leads: id => "ventas/lead/" + id };
const OCULTOS = /^(id|creado|act|por|token|hash|sal)$|Id$/;
const GRUPOS_BORRAR = [
  { v: "clientes", n: "Clientes, vehículos, planes de clientes y reseñas" }, { v: "ventas", n: "Consultas, cotizaciones, seguimientos y campañas" },
  { v: "operacion", n: "Citas y órdenes de servicio" }, { v: "dinero", n: "Cobros, gastos, cierres de caja y reparto" },
  { v: "inventario", n: "Movimientos de inventario, compras y lista por comprar" }, { v: "marketing", n: "Publicaciones y métricas de redes" },
  { v: "plan", n: "Prioridades, revisiones semanales y mejoras" }, { v: "activos", n: "Mantenimientos de equipos" }];

export function tituloDe(e, r) {
  const nombre = [r.nombre, r.apellido].filter(Boolean).join(" ");
  if (r.numero) return r.numero + (r._cliente ? " · " + r._cliente : "");
  return nombre || r.titulo || (e === "vehiculos" ? [r.marca, r.modelo, r.placa].filter(Boolean).join(" ") : "") || r._cliente || r.descripcion || r.concepto || r._producto || r.item || r.texto || r.semana || "(sin nombre)";
}
function subDe(e, r) {
  const est = ESTADOS[e] && r.estado && ESTADOS[e][r.estado] ? ESTADOS[e][r.estado].n : "";
  const monto = r.monto !== undefined ? r.monto : r.total !== undefined ? r.total : r.precio;
  return [r.fecha && fechaCorta(r.fecha), r.hora, r.placa && e !== "vehiculos" ? r.placa : "", e === "clientes" ? r.tel : "", monto !== undefined && monto !== "" ? soles(n0(monto)) : "", est].filter(Boolean).join(" · ");
}

// columnas de cada lista (las da el servidor; se guardan para usarlas sin señal)
let ESQ = null;
function useEsquema() {
  const [e, setE] = useState(() => { if (ESQ) return ESQ; try { return (ESQ = JSON.parse(localStorage.getItem("autocare.esquema") || "null")); } catch (x) { return null; } });
  useEffect(() => { api("esquema").then(r => { ESQ = r.entidades; try { localStorage.setItem("autocare.esquema", JSON.stringify(ESQ)); } catch (x) { } setE(ESQ); }).catch(() => { }); }, []);
  return e;
}

export default function MisDatos({ ruta }) {
  D.useDatos();
  const e = ruta.partes[0];
  usarTitulo(e && ENT[e] ? ENT[e].n : "Mis datos");
  return e && ENT[e] ? html`<${Lista} e=${e} />` : html`<${Portada} />`;
}

function Portada() {
  const admin = D.esAdmin(), pr = D.enPractica(), P = D.ajuste("practica", {}) || {};
  const conteo = e => { const l = D.puedeVer(e) ? D.lista(e) : []; return { t: l.length, p: l.filter(r => r.prueba).length }; };
  const totalPrueba = Object.keys(ENT).reduce((a, e) => a + conteo(e).p, 0);
  const [reinicio, setReinicio] = useState(false);
  const activar = async v => {
    if (!v && totalPrueba && !(await confirmar({ titulo: "Terminar la práctica", texto: `Tienes ${totalPrueba} datos de práctica. Si terminas sin borrarlos, se quedan como si fueran reales. ¿Seguro?`, si: "Terminar sin borrar" }))) return;
    D.fijarAjuste("practica", v ? { activo: true, desde: Date.now(), por: (D.yo() || {}).nombre || "" } : { activo: false, hecha: true });
    aviso(v ? "Modo práctica activado: todo lo nuevo se marca para borrarlo después." : "Modo práctica terminado.");
  };
  const ejemplo = async () => {
    const m = await import("../practica.js");
    const n = await m.cargarEjemplo(); aviso(`Listo: ${n} datos de ejemplo. Mira Inicio, Agenda y Clientes.`);
  };
  const borrarPractica = async () => {
    if (D.hayPendientes()) return aviso("Espera a que se guarden tus últimos cambios (punto verde arriba) y vuelve a intentar.", { error: true });
    if (!(await confirmar({ titulo: "Borrar todo lo de práctica", texto: `Se borran ${totalPrueba} datos marcados como práctica (clientes, citas, órdenes, cobros…), en los dos celulares. Tu configuración, servicios y precios no se tocan.`, si: "Borrar práctica", peligro: true }))) return;
    const r = await api("borrarPrueba"); await D.cargarTodo();
    aviso(`Listo: se borraron ${r.borrados} datos de práctica.`);
  };
  return html`<header class="pagina-cab"><div><h1>Mis datos</h1><p>Practica sin miedo, corrige lo que se cargó mal y borra lo que no sirve.</p></div></header>
    ${admin && html`<section class="panel" style=${{ marginBottom: "22px", borderColor: pr ? "var(--oro)" : "" }}>
      <div style="display:flex;gap:12px;align-items:flex-start"><span class="ico oro"><${Icono} n="flask-conical" /></span><div style="flex:1">
        <h3>Modo práctica ${pr ? html`<${Insignia} c="oro">Activo<//>` : ""}</h3>
        <p class="tenue chico" style="margin-top:4px">Mientras está activo, todo lo que crees (clientes, citas, órdenes, cobros…) queda marcado como <b>práctica</b>, en tu celular y en el de tu socia. Cuando terminen de aprender, lo borran todo junto y empiezan limpio. Tus servicios, precios y configuración nunca se borran.</p>
        ${pr && P.desde && html`<p class="nota" style="margin-top:6px">Activo desde ${fechaHora(P.desde)}${P.por ? " · lo activó " + P.por : ""}. Datos de práctica: <b>${totalPrueba}</b>.</p>`}
        <div class="btns" style="margin-top:12px">
          <${Interruptor} etiqueta="Practicar" valor=${pr} cambiar=${activar} />
          <${BotonAccion} icono="sparkles" accion=${ejemplo}>Cargar datos de ejemplo<//>
          ${totalPrueba > 0 && html`<${BotonAccion} tipo="peligro" icono="eraser" accion=${borrarPractica}>Borrar práctica (${totalPrueba})<//>`}
        </div></div></div></section>`}
    <${AvisoLinea} icono="info">Toca una lista para ver sus datos. Ahí puedes corregir cualquier campo o eliminar lo que no sirve.<//>
    ${GRUPOS.map(g => { const es = g.e.filter(e => ENT[e] && D.puedeVer(e)); if (!es.length) return null;
      return html`<${Bloque} titulo=${g.n}><div class="grupo">${es.map(e => { const c = conteo(e);
        return html`<${Fila} icono=${g.i} titulo=${ENT[e].n} sub=${c.t ? c.t + (c.t === 1 ? " registro" : " registros") + (c.p ? " · " + c.p + " de práctica" : "") : "Vacío"} href=${"#/datos/" + e} flecha />`; })}</div><//>`; })}
    ${admin && html`<${Bloque} titulo="Empezar de cero" sub="Para cuando terminen de probar">
      <div class="panel"><p class="tenue chico">Borra los datos del día a día (clientes, citas, órdenes, cobros…) y deja intacta tu configuración: servicios, precios, planes, productos, equipos, usuarios y ajustes. Antes de borrar, el servidor guarda una copia completa en tu Drive (carpeta Respaldos).</p>
        <div class="btns" style="margin-top:12px"><${Boton} tipo="peligro" icono="list-restart" onClick=${() => setReinicio(true)}>Empezar de cero…<//></div></div><//>`}
    ${reinicio && html`<${Reiniciar} cerrar=${() => setReinicio(false)} />`}`;
}

function Reiniciar({ cerrar }) {
  const [g, setG] = useState(GRUPOS_BORRAR.filter(x => x.v !== "plan").map(x => x.v)), [txt, setTxt] = useState(""), [stock, setStock] = useState(false);
  const ir2 = async () => {
    if (D.hayPendientes()) throw new Error("Espera a que se guarden tus últimos cambios y vuelve a intentar.");
    const r = await api("reiniciarDatos", { grupos: g, confirmar: txt, stockCero: stock });
    await D.cargarTodo(); cerrar();
    await confirmar({ titulo: "Listo, empezaste de cero", texto: `Se borraron ${r.borrados} datos. La copia de seguridad quedó en tu Drive: ${r.respaldo && r.respaldo.nombre}. La numeración vuelve a OT-0001.`, si: "Entendido", no: "Cerrar" });
  };
  return html`<${Hoja} titulo="Empezar de cero" cerrar=${cerrar} pie=${html`<${Boton} tipo="fantasma" onClick=${cerrar}>Cancelar<//><${BotonAccion} tipo="peligro" accion=${ir2} disabled=${txt.trim().toUpperCase() !== "BORRAR" || !g.length}>Borrar para siempre<//>`}>
    <div class="form"><${AvisoLinea} c="rojo" icono="triangle-alert">Esto borra datos en los celulares de todo el equipo. Primero se guarda una copia en tu Drive, por si acaso.<//>
      <p class="etq" style="font-size:13px;font-weight:600;color:var(--texto-2)">¿Qué borro?</p>
      <div class="grupo">${GRUPOS_BORRAR.map(x => html`<label class="fila compacta" style="cursor:pointer"><span class="cuerpo"><span class="t">${x.n}</span></span>
        <span class="der"><input type="checkbox" checked=${g.includes(x.v)} onChange=${ev => setG(ev.target.checked ? [...g, x.v] : g.filter(y => y !== x.v))} style="width:22px;height:22px;accent-color:var(--oro)" /></span></label>`)}</div>
      ${g.includes("inventario") && html`<${Interruptor} etiqueta="Poner en cero el stock de todos los productos" ayuda="Útil si el stock que tienes ahora es de prueba. Después haz un conteo real en Inventario." valor=${stock} cambiar=${setStock} />`}
      <${Entrada} etiqueta="Escribe BORRAR para confirmar" valor=${txt} cambiar=${setTxt} autocapitalize="characters" /></div><//>`;
}

function Lista({ e }) {
  const [q, setQ] = useState(""), [ver, setVer] = useState(null), [solo, setSolo] = useState(false);
  const puede = D.puedeEditar(e);
  const l = useMemo(() => D.lista(e).filter(r => (!solo || r.prueba) && (!q || coincide(tituloDe(e, r) + " " + subDe(e, r) + " " + JSON.stringify(r), q)))
    .sort((a, b) => String(b.fecha || "").localeCompare(String(a.fecha || "")) || (b.creado || 0) - (a.creado || 0)), [D.lista(e), q, solo]);
  const prueba = D.lista(e).filter(r => r.prueba);
  const borrarPrueba = async () => {
    if (!(await confirmar({ titulo: "Eliminar los de práctica", texto: `Se eliminan ${prueba.length} ${ENT[e].n.toLowerCase()} marcados como práctica.`, si: "Eliminar", peligro: true }))) return;
    prueba.forEach(r => borrarUno(e, r)); aviso("Eliminados.");
  };
  return html`<div style="margin-bottom:14px"><${Boton} tipo="fantasma" icono="chevron-left" href="#/datos">Mis datos<//></div>
    <header class="pagina-cab"><div><h1>${ENT[e].n}</h1><p>${D.lista(e).length} registros. Toca uno para corregirlo o eliminarlo.</p></div></header>
    <div class="filtros"><${Buscador} valor=${q} cambiar=${setQ} placeholder="Buscar" />
      ${prueba.length > 0 && html`<${Boton} chico tipo=${solo ? "primario" : ""} onClick=${() => setSolo(!solo)}>Solo práctica (${prueba.length})<//>`}
      ${prueba.length > 0 && puede && html`<${Boton} chico tipo="peligro" icono="eraser" onClick=${borrarPrueba}>Eliminar los de práctica<//>`}</div>
    ${l.length ? html`<div class="grupo">${l.slice(0, 300).map(r => html`<${Fila} titulo=${tituloDe(e, r)} sub=${subDe(e, r)} der=${r.prueba ? html`<${Insignia} c="oro">Práctica<//>` : ""} onClick=${() => setVer(r.id)} flecha />`)}</div>`
      : html`<${Vacio} icono="database" titulo="No hay datos aquí" texto=${q ? "Prueba con otra búsqueda." : "Cuando agregues " + ENT[e].n.toLowerCase() + ", aparecerán aquí."} />`}
    ${ver && html`<${Editor} e=${e} id=${ver} cerrar=${() => setVer(null)} />`}`;
}

/** Borra un registro; si es cliente u orden, se lleva lo relacionado */
function borrarUno(e, r) {
  if (e === "clientes") return N.borrarClienteCompleto(r);
  if (e === "ordenes") return N.borrarOrden(r);
  if (e === "movimientos") return N.revertirMovimiento(r);
  return D.borrar(e, r.id);
}
export async function eliminarConConfirmacion(e, r) {
  const rel = e === "clientes" ? N.relacionadosCliente(r) : e === "ordenes" ? N.relacionadosOrden(r) : null;
  const txt = rel && N.textoRelacionados(rel);
  const ok = await confirmar({ titulo: "Eliminar " + (ENT[e] ? ENT[e].uno : "registro"), peligro: true, si: "Eliminar",
    texto: `«${tituloDe(e, r)}» se borra de la app y de tu hoja.` + (txt ? ` También se borra lo relacionado: ${txt}.` : "") + (e === "movimientos" ? " El stock del producto vuelve a como estaba." : "") });
  if (!ok) return false;
  borrarUno(e, r); aviso("Eliminado."); return true;
}

// listas de opciones para que no haya que escribir códigos a mano
function opcionesDe(e, k) {
  const o = obj => Object.keys(obj).map(v => ({ v, n: obj[v] && obj[v].n ? obj[v].n : obj[v] }));
  if (k === "metodo") return o(METODOS);
  if (k === "cobro") return o(COBROS);
  if (k === "categoria" && (e === "gastos" || e === "costosFijos")) return o(CATEGORIAS_GASTO);
  if (k === "tamano") return N.tamanos().map(t => ({ v: t.id, n: t.n }));
  if (k === "canal") return CANALES.map(c => ({ v: c, n: c }));
  if (k === "etapa" && ESTADOS.leads) return o(ESTADOS.leads);
  if (k === "prioridad") return [{ v: "alta", n: "Alta" }, { v: "media", n: "Media" }, { v: "baja", n: "Baja" }];
  return null;
}
function Editor({ e, id, cerrar }) {
  D.useDatos();
  const r = D.uno(e, id), esq = useEsquema();
  const [f, setF] = useState(() => Object.assign({}, r || {}));
  if (!r) return null;
  const puede = D.puedeEditar(e);
  const cols = (esq && esq[e] && esq[e].cols) || Object.keys(r).map(k => [k, k, typeof r[k] === "number" ? "n" : typeof r[k] === "boolean" ? "b" : typeof r[k] === "object" ? "j" : "t"]);
  const set = (k, v) => setF(Object.assign({}, f, { [k]: v }));
  const campo = ([k, et, t]) => {
    if (OCULTOS.test(k) || k === "numero") return null;
    if (t === "j") { const v = f[k]; const n = Array.isArray(v) ? v.length : v && typeof v === "object" ? Object.keys(v).length : 0; return n ? html`<p class="nota">${et}: ${n} ${n === 1 ? "elemento" : "elementos"} (se edita desde su pantalla)</p>` : null; }
    if (t === "d") return f[k] ? html`<p class="nota">${et}: ${fechaHora(f[k])}</p>` : null;
    if (!puede) return f[k] !== undefined && f[k] !== "" ? html`<div class="par"><span>${et}</span><b>${String(f[k])}</b></div>` : null;
    if (k === "estado" && ESTADOS[e]) return html`<${Selector} etiqueta=${et} opciones=${Object.keys(ESTADOS[e]).map(x => ({ v: x, n: ESTADOS[e][x].n }))} valor=${f[k] || ""} cambiar=${v => set(k, v)} />`;
    const ops = opcionesDe(e, k);
    if (ops) return html`<${Selector} etiqueta=${et} vacio="—" opciones=${ops} valor=${f[k] || ""} cambiar=${v => set(k, v)} />`;
    if (t === "b") return html`<${Interruptor} etiqueta=${et} valor=${!!f[k]} cambiar=${v => set(k, v)} />`;
    if (t === "n") return html`<${Numero} etiqueta=${et} valor=${f[k]} cambiar=${v => set(k, v)} />`;
    if (t === "f") return html`<${Entrada} etiqueta=${et} tipo="date" valor=${f[k] || ""} cambiar=${v => set(k, v)} />`;
    if (t === "h") return html`<${Entrada} etiqueta=${et} tipo="time" valor=${f[k] || ""} cambiar=${v => set(k, v)} />`;
    return String(f[k] || "").length > 70 || /nota|descripcion|incluye|texto|obs|caption/i.test(k)
      ? html`<${Area} etiqueta=${et} valor=${f[k] || ""} cambiar=${v => set(k, v)} />` : html`<${Entrada} etiqueta=${et} valor=${f[k] || ""} cambiar=${v => set(k, v)} />`;
  };
  const hizo = () => { try { localStorage.setItem("autocare.hizo.editor", "1"); } catch (x) { } };
  const guardar = () => { D.guardar(e, f); hizo(); aviso("Guardado."); cerrar(); };
  const eliminar = async () => { if (await eliminarConConfirmacion(e, r)) { hizo(); cerrar(); } };
  const propia = RUTA_PROPIA[e];
  return html`<${Hoja} titulo=${tituloDe(e, r)} sub=${(ENT[e] || {}).uno} cerrar=${cerrar} pie=${html`${puede && html`<${Boton} tipo="fantasma peligro" icono="trash-2" onClick=${eliminar}>Eliminar<//>`}<${Boton} tipo="fantasma" onClick=${cerrar}>Cancelar<//>${puede && html`<${Boton} tipo="primario" onClick=${guardar}>Guardar<//>`}`}>
    <div class="form">
      ${r.prueba && html`<${AvisoLinea} c="oro" icono="flask-conical">Dato de práctica: se borra cuando borres la práctica.<//>`}
      ${propia && html`<${Boton} icono="external-link" onClick=${() => { cerrar(); ir(propia(r.id)); }}>Abrir en su pantalla<//>`}
      ${cols.map(campo)}
      <p class="nota">Creado ${r.creado ? fechaHora(r.creado) : "—"}${r.por ? " · último cambio de " + r.por : ""}</p></div><//>`;
}

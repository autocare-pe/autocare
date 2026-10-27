// AUTOCARE · armazón de la app: menú, rutas, barra superior, búsqueda y botón "+"
import { html, useState, useEffect, useMemo, useRef } from "../vendor/preact-htm.js";
import * as D from "./datos.js";
import { Icono, Logo, LogoHorizontal, Boton, Capas, menu, capaExtra, aviso } from "./ui.js";
import { clases, coincide, nombreDe, telBonito, esMovil, fechaCorta, plural } from "./util.js";
import { srcFoto } from "./datos.js";

// ---------------------------------------------------------------- menú
export const NAV = [
  { g: "", items: [{ r: "", n: "Inicio", i: "house" }] },
  { g: "Dirección", items: [
    { r: "tablero", n: "Tablero", i: "layout-dashboard", mod: "direccion", d: "Tus indicadores en 4 perspectivas" },
    { r: "plan", n: "Plan y revisión", i: "target", mod: "direccion", d: "Prioridades del trimestre, revisión semanal y mejoras" }] },
  { g: "Operación", items: [
    { r: "agenda", n: "Agenda", i: "calendar-days", mod: "agenda", d: "Citas, reservas web y capacidad" },
    { r: "ordenes", n: "Órdenes de servicio", i: "clipboard-list", mod: "ordenes", d: "Recepción, proceso, calidad y entrega" }] },
  { g: "Clientes y ventas", items: [
    { r: "clientes", n: "Clientes", i: "users", mod: "clientes", d: "Ficha completa, vehículos y segmentos" },
    { r: "ventas", n: "Ventas", i: "filter", mod: "comercial", d: "Embudo, cotizaciones y seguimientos" },
    { r: "campanas", n: "Campañas", i: "megaphone", mod: "comercial", d: "Mensajes por tipo de cliente y plantillas" }] },
  { g: "Marketing", items: [
    { r: "contenido", n: "Contenido", i: "calendar-range", mod: "marketing", d: "Calendario, estudio de diseño y publicación" },
    { r: "resultados", n: "Resultados", i: "chart-column", mod: "marketing", d: "Redes, canales que traen clientes y reseñas" },
    { r: "fidelidad", n: "Fidelidad y planes", i: "gift", mod: "clientes", d: "Sellos, referidos, planes y membresías" }] },
  { g: "Administración", items: [
    { r: "finanzas", n: "Finanzas", i: "wallet", mod: "finanzas", d: "Caja, por cobrar, gastos, reparto y rentabilidad" },
    { r: "inventario", n: "Inventario", i: "package", mod: "inventario", d: "Productos, movimientos, compras y proveedores" },
    { r: "activos", n: "Activos y vehículo", i: "car", mod: "activos", d: "Equipos, mantenimientos y depreciación" }] },
  { g: "Sistema", items: [{ r: "config", n: "Configuración", i: "settings", d: "Negocio, servicios, horario, usuarios e integraciones" }, { r: "ayuda", n: "Ayuda", i: "circle-help", d: "Primeros pasos, uso diario, WhatsApp Business, Google y redes" }] }
];
const VISTAS = {
  "": () => import("./vistas/inicio.js"), agenda: () => import("./vistas/agenda.js"), ordenes: () => import("./vistas/ordenes.js"),
  clientes: () => import("./vistas/clientes.js"), ventas: () => import("./vistas/ventas.js"), campanas: () => import("./vistas/campanas.js"),
  contenido: () => import("./vistas/contenido.js"), resultados: () => import("./vistas/resultados.js"), fidelidad: () => import("./vistas/fidelidad.js"),
  finanzas: () => import("./vistas/finanzas.js"), inventario: () => import("./vistas/inventario.js"), activos: () => import("./vistas/activos.js"),
  tablero: () => import("./vistas/tablero.js"), plan: () => import("./vistas/plan.js"), config: () => import("./vistas/config.js"), ayuda: () => import("./vistas/ayuda.js"), mas: () => import("./vistas/mas.js")
};
// Enlaces que manda el servidor por Telegram
const ALIAS = { comercial: "ventas", direccion: "tablero", marketing: "contenido" };
export const puedeRuta = it => !it.mod || D.puede(it.mod, 1);
export const itemsNav = () => NAV.flatMap(g => g.items);

// ---------------------------------------------------------------- rutas (#/agenda/cita/123)
function leerRuta() {
  let partes = decodeURI(location.hash.replace(/^#\/?/, "")).split("?")[0].split("/").filter(Boolean);
  if (ALIAS[partes[0]]) {
    if (partes[0] === "marketing" && partes[1] === "contenido") partes = ["contenido", ...partes.slice(2)];
    else partes = [ALIAS[partes[0]], ...partes.slice(1)];
  }
  const q = {}; (location.hash.split("?")[1] || "").split("&").filter(Boolean).forEach(x => { const [k, v] = x.split("="); q[k] = decodeURIComponent(v || ""); });
  return { modulo: partes[0] || "", partes: partes.slice(1), q, hash: location.hash };
}
export function ir(ruta, reemplazar) {
  const h = "#/" + String(ruta || "").replace(/^#?\/?/, "");
  if (reemplazar) history.replaceState(null, "", h); else if (location.hash !== h) location.hash = h;
  if (reemplazar) window.dispatchEvent(new HashChangeEvent("hashchange"));
}
export function useRuta() {
  const [r, setR] = useState(leerRuta);
  useEffect(() => { const f = () => setR(leerRuta()); window.addEventListener("hashchange", f); return () => window.removeEventListener("hashchange", f); }, []);
  return r;
}
let tituloActual = "";
const subsTitulo = new Set();
export function usarTitulo(t) { useEffect(() => { tituloActual = t || ""; subsTitulo.forEach(f => f(t)); document.title = (t ? t + " · " : "") + "AUTOCARE"; }, [t]); }

// ---------------------------------------------------------------- abrir formularios desde cualquier parte
export async function abrir(cargar, nombre, props = {}) {
  const m = await cargar();
  const Comp = m[nombre];
  const cerrar = r => { capaExtra(null); if (props.alCerrar) props.alCerrar(r); };
  capaExtra(html`<${Comp} ...${props} cerrar=${cerrar} />`);
}
export const CREAR = [
  { n: "Nueva cita", i: "calendar-plus", mod: "agenda", f: () => abrir(VISTAS.agenda, "FormCita") },
  { n: "Nueva orden de servicio", i: "clipboard-list", mod: "ordenes", f: () => abrir(VISTAS.ordenes, "NuevaOrden") },
  { n: "Registrar cobro", i: "banknote", mod: "finanzas", f: () => abrir(VISTAS.finanzas, "FormCobro") },
  { n: "Registrar gasto", i: "receipt", mod: "finanzas", alt: ["inventario", "activos"], f: () => abrir(VISTAS.finanzas, "FormGasto") },
  { n: "Nuevo cliente", i: "user-plus", mod: "clientes", f: () => abrir(VISTAS.clientes, "FormCliente", { alGuardar: c => ir("clientes/" + c.id) }) },
  { n: "Nueva consulta (prospecto)", i: "message-circle", mod: "comercial", f: () => abrir(VISTAS.ventas, "FormLead") },
  { n: "Nuevo seguimiento", i: "list-checks", mod: "comercial", alt: ["agenda", "clientes"], f: () => abrir(VISTAS.ventas, "FormTarea") },
  { n: "Nueva publicación", i: "wand-sparkles", mod: "marketing", f: () => ir("contenido/estudio") }
];
export function menuCrear() {
  menu("Crear", CREAR.filter(c => D.puede(c.mod, 2) || (c.alt || []).some(m => D.puede(m, 2))).map(c => ({ n: c.n, icono: c.i, f: c.f })));
}

// ---------------------------------------------------------------- cuentas en el menú
function cuentas() {
  const H = new Date().toISOString().slice(0, 10);
  return {
    agenda: D.lista("citas").filter(c => c.estado === "solicitada" && c.fecha >= H).length,
    ordenes: D.lista("ordenes").filter(o => ["recepcion", "proceso", "calidad", "listo"].includes(o.estado)).length,
    ventas: D.lista("leads").filter(l => l.etapa === "nuevo").length
  };
}

function Marca() {
  const n = D.ajuste("negocio", {});
  return html`<a class="marca" href="#/" style="display:block"><${LogoHorizontal} /><span class="marca-esl">${n.eslogan || "Gestión del negocio"}</span></a>`;
}
function Lateral({ ruta }) {
  const c = cuentas(), u = D.yo() || {};
  return html`<aside class="lateral" aria-label="Menú principal">
    <${Marca} />
    ${NAV.map(g => {
      const items = g.items.filter(puedeRuta);
      if (!items.length) return null;
      return html`${g.g && html`<div class="nav-grupo">${g.g}</div>`}
        ${items.map(it => html`<a class=${clases("nav-item", ruta.modulo === it.r && "activo")} href=${"#/" + it.r} title=${it.n}>
          <${Icono} n=${it.i} /><span>${it.n}</span>${c[it.r] ? html`<span class="cuenta">${c[it.r]}</span>` : null}</a>`)}`;
    })}
    <div class="lateral-pie">
      <a class="yo" href="#/config/cuenta" title="Mi cuenta"><span class="avatar">${(u.nombre || "?").slice(0, 1).toUpperCase()}</span><div><b>${u.nombre}</b><small>${u.rol === "admin" ? "Administrador" : u.rol === "ventas" ? "Ventas" : "Técnico"}</small></div></a>
    </div>
  </aside>`;
}
function EstadoSync({ chico }) {
  const e = D.estado, p = e.pendientes + e.fotos;
  const txt = e.sync === "enviando" ? "Guardando…" : e.sync === "sinred" ? (p ? `${plural(p, "cambio")} por enviar` : "Sin internet") : e.sync === "error" ? "No se pudo guardar" : p ? `${p} por enviar` : "Guardado";
  const clic = () => {
    if (e.sync === "error") aviso(e.error || "Revisa tu conexión.", { error: true, accion: { n: "Reintentar", f: () => D.enviar() } });
    else { D.enviar(); D.traerSeguro(); aviso(p ? "Enviando tus cambios…" : "Todo está guardado en tu hoja de Google.", { icono: "cloud" }); }
  };
  return html`<button class=${clases("sync", e.sync)} onClick=${clic} title=${e.error || txt}><span class="punto"></span>${!chico && html`<span>${txt}</span>`}</button>`;
}
function Barra({ titulo, abrirPaleta }) {
  const [borde, setBorde] = useState(false);
  useEffect(() => { const f = () => setBorde(window.scrollY > 4); window.addEventListener("scroll", f, { passive: true }); return () => window.removeEventListener("scroll", f); }, []);
  return html`<header class=${clases("barra", borde && "con-borde")}>
    <span class="barra-titulo">${titulo}</span>
    <button class="barra-buscar" onClick=${abrirPaleta}><${Icono} n="search" t=${17} /><span>Buscar cliente, placa, orden…</span><kbd>${/Mac/.test(navigator.platform) ? "⌘K" : "Ctrl K"}</kbd></button>
    <${EstadoSync} />
    <${Boton} tipo="primario" icono="plus" onClick=${menuCrear}>Nuevo<//>
  </header>`;
}
function BarraMovil({ titulo, abrirPaleta }) {
  return html`<header class="barra-movil">
    <${Logo} />
    <span class="titulo">${titulo}</span>
    <${EstadoSync} chico />
    <${Boton} tipo="fantasma" icono="search" titulo="Buscar" onClick=${abrirPaleta} />
  </header>`;
}
const TABS = [{ r: "", n: "Inicio", i: "house" }, { r: "agenda", n: "Agenda", i: "calendar-days", mod: "agenda" }, { r: "ordenes", n: "Órdenes", i: "clipboard-list", mod: "ordenes" }, { r: "clientes", n: "Clientes", i: "users", mod: "clientes" }];
function Tabbar({ ruta }) {
  const c = cuentas();
  const tabs = TABS.filter(puedeRuta);
  const enMas = !tabs.some(t => t.r === ruta.modulo);
  return html`<nav class="tabbar" style=${{ gridTemplateColumns: `repeat(${tabs.length + 1}, 1fr)` }} aria-label="Navegación">
    ${tabs.map(t => html`<a class=${clases("tab", ruta.modulo === t.r && "activo")} href=${"#/" + t.r}><${Icono} n=${t.i} /><span>${t.n}</span>${c[t.r] ? html`<span class="cuenta">${c[t.r]}</span>` : null}</a>`)}
    <a class=${clases("tab", enMas && "activo")} href="#/mas"><${Icono} n="layout-grid" /><span>Más</span>${c.ventas ? html`<span class="cuenta">${c.ventas}</span>` : null}</a>
  </nav>`;
}

// ---------------------------------------------------------------- búsqueda rápida
function Paleta({ cerrar }) {
  const [q, setQ] = useState(""), [sel, setSel] = useState(0);
  const inp = useRef();
  useEffect(() => { inp.current && inp.current.focus(); }, []);
  const res = useMemo(() => {
    const out = [];
    const t = q.trim();
    const paginas = itemsNav().filter(puedeRuta).filter(i => !t || coincide(i.n + " " + (i.d || ""), t)).map(i => ({ g: "Ir a", t: i.n, s: "", i: i.i, f: () => ir(i.r) }));
    if (!t) return [...CREAR.filter(c => D.puede(c.mod, 2)).slice(0, 5).map(c => ({ g: "Crear", t: c.n, i: c.i, f: c.f })), ...paginas];
    const vehs = D.lista("vehiculos");
    if (D.puedeVer("clientes")) D.lista("clientes").forEach(c => {
      const placas = vehs.filter(v => v.clienteId === c.id).map(v => v.placa + " " + (v.marca || "")).join(" ");
      if (coincide(nombreDe(c) + " " + c.tel + " " + placas + " " + (c.codigo || ""), t)) out.push({ g: "Clientes", t: nombreDe(c), s: telBonito(c.tel), i: "user", f: () => ir("clientes/" + c.id) });
    });
    if (D.puedeVer("ordenes")) D.lista("ordenes").forEach(o => { if (coincide((o.numero || "") + " " + (o._cliente || "") + " " + (o._vehiculo || ""), t)) out.push({ g: "Órdenes", t: (o.numero || "Orden") + " · " + (o._cliente || ""), s: fechaCorta(o.fecha), i: "clipboard-list", f: () => ir("ordenes/" + o.id) }); });
    if (D.puedeVer("cotizaciones")) D.lista("cotizaciones").forEach(c => { if (coincide((c.numero || "") + " " + (c._cliente || ""), t)) out.push({ g: "Cotizaciones", t: (c.numero || "Cotización") + " · " + (c._cliente || ""), s: fechaCorta(c.fecha), i: "file-text", f: () => ir("ventas/cotizaciones/" + c.id) }); });
    if (D.puedeVer("leads")) D.lista("leads").forEach(l => { if (!l.clienteId && coincide(l.nombre + " " + (l.tel || ""), t)) out.push({ g: "Prospectos", t: l.nombre, s: l.etapa, i: "filter", f: () => ir("ventas/lead/" + l.id) }); });
    if (D.puedeVer("productos")) D.lista("productos").forEach(p => { if (coincide(p.nombre + " " + (p.marca || ""), t)) out.push({ g: "Inventario", t: p.nombre, s: "stock " + (p.stock || 0), i: "package", f: () => ir("inventario/producto/" + p.id) }); });
    return [...out.slice(0, 40), ...paginas];
  }, [q]);
  useEffect(() => setSel(0), [q]);
  const elegir = r => { cerrar(); r.f(); };
  const tecla = e => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSel(s => Math.min(res.length - 1, s + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSel(s => Math.max(0, s - 1)); }
    else if (e.key === "Enter" && res[sel]) { e.preventDefault(); elegir(res[sel]); }
    else if (e.key === "Escape") cerrar();
  };
  let grupo = "";
  return html`<div class="velo" onClick=${cerrar}></div><div class="paleta" role="dialog" aria-label="Buscar">
    <div class="paleta-entrada"><${Icono} n="search" /><input ref=${inp} value=${q} onInput=${e => setQ(e.currentTarget.value)} onKeyDown=${tecla} placeholder="Nombre, celular, placa, número de orden…" /><${Boton} tipo="fantasma" chico onClick=${cerrar}>Cerrar<//></div>
    <div class="paleta-lista">
      ${res.length ? res.map((r, i) => {
        const cab = r.g !== grupo ? (grupo = r.g, html`<div class="paleta-grupo">${r.g}</div>`) : null;
        return html`${cab}<button class=${clases("paleta-item", i === sel && "sel")} onMouseEnter=${() => setSel(i)} onClick=${() => elegir(r)}><${Icono} n=${r.i} /><span class="t">${r.t}</span>${r.s && html`<span class="s">${r.s}</span>`}</button>`;
      }) : html`<p class="nota" style="padding:16px">No encontré nada con «${q}».</p>`}
    </div></div>`;
}

// ---------------------------------------------------------------- la app
const cacheVistas = {};
export function App() {
  D.useDatos();
  const ruta = useRuta();
  const [mod, setMod] = useState(() => cacheVistas[ruta.modulo] || null);
  const [paleta, setPaleta] = useState(false);
  const [titulo, setTitulo] = useState(tituloActual);
  useEffect(() => {
    subsTitulo.add(setTitulo);
    const limpiar = () => { tituloActual = ""; setTitulo(""); };
    window.addEventListener("hashchange", limpiar);
    return () => { subsTitulo.delete(setTitulo); window.removeEventListener("hashchange", limpiar); };
  }, []);
  useEffect(() => {
    const clave = VISTAS[ruta.modulo] ? ruta.modulo : "";
    if (cacheVistas[clave]) { setMod(cacheVistas[clave]); return; }
    let vivo = true;
    VISTAS[clave]().then(m => { cacheVistas[clave] = m; if (vivo) setMod(m); }).catch(e => { console.error(e); aviso("No se pudo abrir esta sección. Revisa tu conexión.", { error: true }); });
    return () => { vivo = false; };
  }, [ruta.modulo]);
  useEffect(() => { window.scrollTo(0, 0); }, [ruta.modulo, ruta.partes[0]]);
  useEffect(() => {
    const f = e => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPaleta(p => !p); } };
    window.addEventListener("keydown", f); return () => window.removeEventListener("keydown", f);
  }, []);
  const item = itemsNav().find(i => i.r === ruta.modulo);
  const permitido = !item || puedeRuta(item);
  const Vista = mod && mod.default;
  const conFab = ["", "agenda", "ordenes", "clientes"].includes(ruta.modulo) && !ruta.partes.length;
  return html`<div class="app">
    <${Lateral} ruta=${ruta} />
    <div class="principal">
      <${Barra} titulo=${titulo || (item ? item.n : "")} abrirPaleta=${() => setPaleta(true)} />
      <${BarraMovil} titulo=${titulo || (item ? item.n : "AUTOCARE")} abrirPaleta=${() => setPaleta(true)} />
      <main class="contenido" id="contenido">
        ${!permitido ? html`<div class="vacio"><h3>No tienes acceso a esta sección</h3><p>Pídele al administrador que te dé permiso en Configuración → Usuarios.</p></div>`
          : Vista ? html`<${Vista} key=${ruta.modulo} ruta=${ruta} />` : null}
      </main>
    </div>
    <${Tabbar} ruta=${ruta} />
    ${conFab && html`<button class="fab" onClick=${menuCrear} aria-label="Crear"><${Icono} n="plus" /></button>`}
    ${paleta && html`<${Paleta} cerrar=${() => setPaleta(false)} />`}
    <${Capas} />
  </div>`;
}

// AUTOCARE · piezas de la interfaz (botones, campos, hojas, listas, indicadores, gráficos)
import { html, useState, useEffect, useRef, useMemo, useCallback } from "../vendor/preact-htm.js";
import { ICONOS } from "./iconos.js";
import { AYUDA_CAMPOS, EJEMPLOS } from "./guias.js";
import { clases, esMovil, num, soles, iniciales } from "./util.js";

// ---------------------------------------------------------------- íconos y marca
const ALIAS = { whatsapp: "message-circle", inicio: "house", agenda: "calendar-days", ordenes: "clipboard-list", clientes: "users", mas: "ellipsis" };
export function Icono({ n, t, clase, titulo }) {
  const d = ICONOS[ALIAS[n] || n] || ICONOS["circle"];
  const s = t ? { width: t + "px", height: t + "px" } : null;
  return html`<svg class=${clases("i", clase)} style=${s} viewBox="0 0 24 24" aria-hidden=${titulo ? null : "true"} role=${titulo ? "img" : null} dangerouslySetInnerHTML=${{ __html: (titulo ? `<title>${titulo}</title>` : "") + d }}></svg>`;
}
export function Logo({ src }) {
  if (src) return html`<span class="marca-logo"><img src=${src} alt="" /></span>`;
  return html`<span class="marca-logo"><img class="solo-oscuro" src="../assets/marca-clara.svg" alt="AUTOCARE" /><img class="solo-claro" src="../assets/marca.svg" alt="AUTOCARE" /></span>`;
}
export function LogoHorizontal() {
  return html`<img class="marca-h solo-oscuro" src="../assets/logo-horizontal-claro.svg" alt="AUTOCARE" /><img class="marca-h solo-claro" src="../assets/logo-horizontal.svg" alt="AUTOCARE" />`;
}

// ---------------------------------------------------------------- botones
export function Boton({ tipo, icono, children, onClick, cargando, chico, grande, bloque, href, disabled, titulo, clase, enviar, nueva, ...resto }) {
  const c = clases("btn", tipo, chico && "chico", grande && "grande", bloque && "bloque", !children && icono && "icono", clase);
  const dentro = html`${cargando ? html`<span class="giro"></span>` : icono ? html`<${Icono} n=${icono} />` : null}${children}`;
  if (href) return html`<a class=${c} href=${href} target=${nueva || /^https?:/.test(href) ? "_blank" : null} rel="noopener" title=${titulo} aria-label=${!children ? titulo : null} onClick=${onClick} ...${resto}>${dentro}</a>`;
  return html`<button type=${enviar ? "submit" : "button"} class=${c} onClick=${onClick} disabled=${disabled || cargando} title=${titulo} aria-label=${!children ? titulo : null} ...${resto}>${dentro}</button>`;
}
// Un botón que muestra "cargando" mientras la acción termina, y el error si falla
export function BotonAccion({ accion, children, ...resto }) {
  const [c, setC] = useState(false);
  const clic = async e => {
    if (c) return;
    setC(true);
    try { await accion(e); } catch (err) { aviso(err.message || String(err), { error: true }); }
    finally { setC(false); }
  };
  return html`<${Boton} ...${resto} cargando=${c} onClick=${clic}>${children}<//>`;
}

// ---------------------------------------------------------------- campos
// Si el formulario no trae su propia ayuda, usamos la de guias.js según la etiqueta del campo
const ayudaDe = (etiqueta, ayuda) => (ayuda !== undefined ? ayuda : typeof etiqueta === "string" ? AYUDA_CAMPOS[etiqueta] : undefined);
const ejemploDe = (etiqueta, resto) => (resto.placeholder !== undefined || typeof etiqueta !== "string" ? {} : EJEMPLOS[etiqueta] ? { placeholder: EJEMPLOS[etiqueta] } : {});
export function Campo({ etiqueta, ayuda, error, children, clase, id }) {
  ayuda = ayudaDe(etiqueta, ayuda);
  return html`<div class=${clases("campo", clase)}>
    ${etiqueta && html`<label for=${id}>${etiqueta}</label>`}
    ${children}
    ${error ? html`<span class="error">${error}</span>` : ayuda ? html`<span class="ayuda">${ayuda}</span>` : null}
  </div>`;
}
let idCampo = 0;
const useId = () => useMemo(() => "c" + (++idCampo), []);
export function Entrada({ etiqueta, ayuda, error, valor, cambiar, tipo = "text", prefijo, clase, ...resto }) {
  const id = useId();
  const inp = html`<input id=${id} class="entrada" type=${tipo} value=${valor == null ? "" : valor} onInput=${e => cambiar && cambiar(e.currentTarget.value)} ...${ejemploDe(etiqueta, resto)} ...${resto} />`;
  return html`<${Campo} etiqueta=${etiqueta} ayuda=${ayuda} error=${error} id=${id} clase=${clase}>${prefijo ? html`<div class="con-prefijo"><span>${prefijo}</span>${inp}</div>` : inp}<//>`;
}
export function Numero({ etiqueta, ayuda, error, valor, cambiar, prefijo, sufijo, decimales = 2, clase, ...resto }) {
  const id = useId();
  const [t, setT] = useState(valor == null || valor === "" ? "" : String(valor));
  useEffect(() => {
    const actual = t === "" ? null : Number(t.replace(",", "."));
    if ((valor == null || valor === "") && t !== "" && actual === null) return;
    if (Number(valor) !== actual) setT(valor == null || valor === "" ? "" : String(valor));
  }, [valor]);
  const al = e => {
    let v = e.currentTarget.value.replace(",", ".").replace(/[^\d.\-]/g, "");
    setT(v);
    if (cambiar) cambiar(v === "" || v === "-" || v === "." ? null : Math.round(Number(v) * 10 ** decimales) / 10 ** decimales);
  };
  const inp = html`<input id=${id} class="entrada cifra" type="text" inputmode="decimal" value=${t} onInput=${al} ...${resto} />`;
  return html`<${Campo} etiqueta=${etiqueta} ayuda=${ayuda} error=${error} id=${id} clase=${clase}>
    ${prefijo || sufijo ? html`<div class="con-prefijo">${prefijo && html`<span>${prefijo}</span>`}${inp}${sufijo && html`<span style="left:auto;right:13px">${sufijo}</span>`}</div>` : inp}<//>`;
}
export const Dinero = p => html`<${Numero} prefijo="S/" ...${p} />`;
export function Area({ etiqueta, ayuda, error, valor, cambiar, filas = 3, clase, ...resto }) {
  const id = useId();
  return html`<${Campo} etiqueta=${etiqueta} ayuda=${ayuda} error=${error} id=${id} clase=${clase}>
    <textarea id=${id} class="area" rows=${filas} value=${valor || ""} onInput=${e => cambiar(e.currentTarget.value)} ...${resto}></textarea><//>`;
}
export function Selector({ etiqueta, ayuda, error, valor, cambiar, opciones, vacio, clase, ...resto }) {
  const id = useId();
  const ops = (opciones || []).map(o => (typeof o === "string" ? { v: o, n: o } : o));
  return html`<${Campo} etiqueta=${etiqueta} ayuda=${ayuda} error=${error} id=${id} clase=${clase}>
    <select id=${id} class="lista-sel" value=${valor == null ? "" : valor} onChange=${e => cambiar(e.currentTarget.value)} ...${resto}>
      ${vacio !== undefined && html`<option value="">${vacio}</option>`}
      ${ops.map(o => html`<option value=${o.v} selected=${String(o.v) === String(valor == null ? "" : valor)}>${o.n}</option>`)}
    </select><//>`;
}
export function Interruptor({ etiqueta, ayuda, valor, cambiar, disabled }) {
  ayuda = ayudaDe(etiqueta, ayuda);
  return html`<label class="interruptor">
    <input type="checkbox" checked=${!!valor} disabled=${disabled} onChange=${e => cambiar(e.currentTarget.checked)} />
    <span class="pista"></span>
    <span class="txt"><b>${etiqueta}</b>${ayuda && html`<small>${ayuda}</small>`}</span>
  </label>`;
}
export function Segmentos({ valor, cambiar, opciones, bloque, etiqueta }) {
  const s = html`<div class=${clases("segmentos", bloque && "bloque")} role="tablist">
    ${opciones.map(o => html`<button type="button" role="tab" aria-selected=${o.v === valor} class=${o.v === valor ? "activo" : ""} onClick=${() => cambiar(o.v)}>${o.n}</button>`)}
  </div>`;
  return etiqueta ? html`<${Campo} etiqueta=${etiqueta}>${s}<//>` : s;
}
export function Chips({ valor, cambiar, opciones, multi, desliza }) {
  const activo = v => (multi ? (valor || []).includes(v) : valor === v);
  const tocar = v => {
    if (!multi) return cambiar(valor === v && !opciones.find(o => o.v === v)?.fijo ? "" : v);
    const l = valor || [];
    cambiar(l.includes(v) ? l.filter(x => x !== v) : [...l, v]);
  };
  return html`<div class=${clases("chips", desliza && "desliza")}>
    ${opciones.map(o => html`<button type="button" class=${clases("chip", activo(o.v) && "activo")} onClick=${() => tocar(o.v)}>${o.n}${o.cuenta !== undefined && html`<span class="n">${o.cuenta}</span>`}</button>`)}
  </div>`;
}
export function Buscador({ valor, cambiar, placeholder = "Buscar", auto }) {
  const r = useRef();
  useEffect(() => { if (auto && r.current && !esMovil()) r.current.focus(); }, []);
  return html`<div class="buscador"><${Icono} n="search" />
    <input ref=${r} class="entrada" type="search" placeholder=${placeholder} value=${valor} onInput=${e => cambiar(e.currentTarget.value)} autocomplete="off" />
  </div>`;
}
// Para no repetir: <${Entrada} ...${b(f, set, "nombre")} />
export const b = (f, set, k) => ({ valor: f[k], cambiar: v => set(k, v) });
export function useFicha(inicial) {
  const [f, setF] = useState(() => Object.assign({}, inicial));
  const set = useCallback((k, v) => setF(p => Object.assign({}, p, typeof k === "object" ? k : { [k]: v })), []);
  return [f, set, setF];
}

// ---------------------------------------------------------------- hojas (paneles que se abren)
const PILA = [];
let bloqueos = 0;
if (typeof window !== "undefined") {
  window.addEventListener("keydown", e => { if (e.key === "Escape" && PILA.length) { e.preventDefault(); PILA[PILA.length - 1](); } });
}
export function Hoja({ titulo, sub, cerrar, children, pie, ancha, centro, media, acciones, clase, onSubmit }) {
  const ref = useRef(cerrar);
  ref.current = cerrar;
  useEffect(() => {
    const f = () => ref.current && ref.current();
    PILA.push(f);
    if (bloqueos++ === 0) document.documentElement.style.overflow = "hidden";
    return () => {
      const i = PILA.indexOf(f); if (i >= 0) PILA.splice(i, 1);
      if (--bloqueos === 0) document.documentElement.style.overflow = "";
    };
  }, []);
  const cuerpo = html`
    <header class="hoja-cab">
      <h2>${titulo}${sub && html`<span class="sub">${sub}</span>`}</h2>
      ${acciones}
      <${Boton} tipo="fantasma" icono="x" titulo="Cerrar" onClick=${cerrar} />
    </header>
    <div class="hoja-cuerpo">${children}</div>
    ${pie && html`<footer class="hoja-pie">${pie}</footer>`}`;
  return html`<div class="velo" onClick=${cerrar}></div>
    ${onSubmit
      ? html`<form class=${clases("hoja", ancha && "ancha", centro && "centro", media && "media", clase)} role="dialog" aria-modal="true" aria-label=${titulo} onSubmit=${e => { e.preventDefault(); onSubmit(e); }}>${cuerpo}</form>`
      : html`<section class=${clases("hoja", ancha && "ancha", centro && "centro", media && "media", clase)} role="dialog" aria-modal="true" aria-label=${titulo}>${cuerpo}</section>`}`;
}

// ---------------------------------------------------------------- capas globales: avisos, confirmación, menús, visor
const CAPAS = { avisos: [], dialogo: null, menu: null, visor: null, extra: null };
const subsCapas = new Set();
const repintarCapas = () => subsCapas.forEach(f => f({}));
let nAviso = 0;
export function aviso(texto, op = {}) {
  const id = ++nAviso;
  CAPAS.avisos = [...CAPAS.avisos.slice(-2), { id, texto, error: op.error, accion: op.accion, icono: op.icono }];
  repintarCapas();
  setTimeout(() => { CAPAS.avisos = CAPAS.avisos.filter(a => a.id !== id); repintarCapas(); }, op.duracion || (op.accion ? 6500 : op.error ? 6000 : 3200));
}
export function confirmar({ titulo, texto, si = "Sí, continuar", no = "Cancelar", peligro }) {
  return new Promise(ok => { CAPAS.dialogo = { titulo, texto, si, no, peligro, ok }; repintarCapas(); });
}
export function preguntar({ titulo, texto, etiqueta, valor = "", si = "Guardar", tipo = "text", ayuda, area }) {
  return new Promise(ok => { CAPAS.dialogo = { titulo, texto, si, no: "Cancelar", ok, entrada: { etiqueta, valor, tipo, ayuda, area } }; repintarCapas(); });
}
// opciones: [{n, icono, f, peligro, d}]
export function menu(titulo, opciones) { CAPAS.menu = { titulo, opciones: opciones.filter(Boolean) }; repintarCapas(); }
export function verFoto(src) { CAPAS.visor = src; repintarCapas(); }
export function capaExtra(nodo) { CAPAS.extra = nodo; repintarCapas(); }

function Dialogo({ d }) {
  const [v, setV] = useState(d.entrada ? d.entrada.valor : "");
  const cerrar = r => { CAPAS.dialogo = null; repintarCapas(); d.ok(r); };
  return html`<${Hoja} centro titulo=${d.titulo} cerrar=${() => cerrar(d.entrada ? null : false)} onSubmit=${() => cerrar(d.entrada ? v : true)}
    pie=${html`<${Boton} tipo="fantasma" onClick=${() => cerrar(d.entrada ? null : false)}>${d.no}<//><${Boton} enviar tipo=${d.peligro ? "peligro lleno" : "primario"} autofocus=${!d.entrada}>${d.si}<//>`}>
    ${d.texto && html`<p class="tenue" style="margin-bottom:${d.entrada ? 16 : 0}px">${d.texto}</p>`}
    ${d.entrada && (d.entrada.area
      ? html`<${Area} etiqueta=${d.entrada.etiqueta} valor=${v} cambiar=${setV} ayuda=${d.entrada.ayuda} autofocus />`
      : html`<${Entrada} etiqueta=${d.entrada.etiqueta} valor=${v} cambiar=${setV} tipo=${d.entrada.tipo} ayuda=${d.entrada.ayuda} autofocus />`)}
  <//>`;
}
export function Capas() {
  const [, set] = useState({});
  useEffect(() => { subsCapas.add(set); return () => subsCapas.delete(set); }, []);
  const m = CAPAS.menu;
  const cerrarMenu = () => { CAPAS.menu = null; repintarCapas(); };
  return html`
    ${CAPAS.extra}
    ${m && html`<${Hoja} media centro=${!esMovil()} titulo=${m.titulo} cerrar=${cerrarMenu}>
      <div class="menu-acciones">${m.opciones.map(o => html`<button class=${o.peligro ? "peligro" : ""} onClick=${() => { cerrarMenu(); o.f(); }}><${Icono} n=${o.icono || "chevron-right"} /><span>${o.n}${o.d && html`<small>${o.d}</small>`}</span></button>`)}</div>
    <//>`}
    ${CAPAS.dialogo && html`<${Dialogo} key=${CAPAS.dialogo.titulo} d=${CAPAS.dialogo} />`}
    ${CAPAS.visor && html`<div class="visor" onClick=${() => { CAPAS.visor = null; repintarCapas(); }}><img src=${CAPAS.visor} alt="Foto" /><${Boton} icono="x" titulo="Cerrar" /></div>`}
    <div class="avisos" role="status" aria-live="polite">
      ${CAPAS.avisos.map(a => html`<div class=${clases("aviso", a.error && "error")} key=${a.id}>
        <${Icono} n=${a.icono || (a.error ? "circle-alert" : "circle-check")} /><span>${a.texto}</span>
        ${a.accion && html`<button onClick=${() => { CAPAS.avisos = CAPAS.avisos.filter(x => x.id !== a.id); repintarCapas(); a.accion.f(); }}>${a.accion.n}</button>`}
      </div>`)}
    </div>`;
}

// ---------------------------------------------------------------- listas y estados
export function Insignia({ c, children, sinPunto }) { return html`<span class=${clases("insignia", c, sinPunto && "sin-punto")}>${children}</span>`; }
export function Vacio({ icono = "inbox", titulo, texto, children }) {
  return html`<div class="vacio"><div class="ico-v"><${Icono} n=${icono} /></div><h3>${titulo}</h3>${texto && html`<p>${texto}</p>`}${children && html`<div class="btns">${children}</div>`}</div>`;
}
export function Bloque({ titulo, sub, der, children, clase }) {
  return html`<section class=${clases("bloque", clase)}>
    ${(titulo || der) && html`<div class="bloque-cab">${titulo && html`<h2>${titulo}</h2>`}${sub && html`<p>${sub}</p>`}${der && html`<div class="der">${der}</div>`}</div>`}
    ${children}
  </section>`;
}
export function Fila({ icono, colorIcono, avatar, titulo, sub, der, onClick, href, flecha, clase, multi, children }) {
  const dentro = html`
    ${avatar !== undefined ? html`<span class="avatar">${iniciales(avatar)}</span>` : icono ? html`<span class=${clases("ico", colorIcono)}><${Icono} n=${icono} /></span>` : null}
    <span class="cuerpo"><span class="t">${titulo}</span>${sub && html`<span class=${clases("s", multi && "multi")}>${sub}</span>`}${children}</span>
    ${(der || flecha) && html`<span class="der">${der}${flecha && html`<${Icono} n="chevron-right" clase="flecha" />`}</span>`}`;
  if (href) return html`<a class=${clases("fila", clase)} href=${href}>${dentro}</a>`;
  if (onClick) return html`<button type="button" class=${clases("fila", clase)} onClick=${onClick}>${dentro}</button>`;
  return html`<div class=${clases("fila", clase)}>${dentro}</div>`;
}
export function Pestanas({ valor, cambiar, opciones }) {
  return html`<nav class="pestanas" role="tablist">
    ${opciones.filter(Boolean).map(o => html`<button type="button" role="tab" aria-selected=${o.v === valor} class=${clases("pestana", o.v === valor && "activa")} onClick=${() => cambiar(o.v)}>
      ${o.n}${o.cuenta ? html`<span class="cuenta">${o.cuenta}</span>` : null}</button>`)}
  </nav>`;
}
export function Cabecera({ titulo, texto, children }) {
  return html`<header class="pagina-cab"><div><h1>${titulo}</h1>${texto && html`<p>${texto}</p>`}</div>${children && html`<div class="acciones">${children}</div>`}</header>`;
}
export function Avatar({ nombre, grande, oro }) { return html`<span class=${clases("avatar", grande && "grande", oro && "oro")}>${iniciales(nombre)}</span>`; }
export function Check({ si, cambiar, titulo }) {
  return html`<button type="button" class=${clases("marca-check", si && "si")} aria-pressed=${!!si} aria-label=${titulo || "Marcar"} onClick=${e => { e.stopPropagation(); cambiar(!si); }}>${si && html`<${Icono} n="check" />`}</button>`;
}
export function Par({ n, v, total, clase }) { return html`<div class=${clases("par", total && "total", clase)}><span>${n}</span><b>${v}</b></div>`; }
export function AvisoLinea({ icono = "info", c, children, accion }) {
  return html`<div class=${clases("aviso-linea", c)}><${Icono} n=${icono} /><div class="cuerpo">${children}</div>${accion}</div>`;
}

/**
 * Tabla ordenable que en el celular se vuelve una lista.
 * cols: [{k, n, f(r) → contenido, v(r) → valor para ordenar, num, clase, movil:false}]
 */
export function Tabla({ cols, filas, onFila, vacio, clave = "id", pie, movil, limite = 200, ordenInicial }) {
  const [orden, setOrden] = useState(ordenInicial || null);
  const [mas, setMas] = useState(limite);
  const datos = useMemo(() => {
    if (!orden) return filas;
    const c = cols.find(x => x.k === orden.k);
    if (!c) return filas;
    const v = c.v || (r => r[c.k]);
    return filas.slice().sort((a, b) => { const x = v(a), y = v(b); return (x < y ? -1 : x > y ? 1 : 0) * (orden.d ? -1 : 1); });
  }, [filas, orden]);
  if (!filas.length) return vacio || html`<${Vacio} titulo="Sin datos todavía" />`;
  const visibles = datos.slice(0, mas);
  if (esMovil() && movil) {
    return html`<div class="grupo">${visibles.map(r => movil(r))}${datos.length > mas && html`<div class="tabla-pie"><span>${num(datos.length)} en total</span><${Boton} chico tipo="fantasma" onClick=${() => setMas(mas + limite)}>Ver más<//></div>`}</div>`;
  }
  const ord = c => { if (c.ordenar === false) return; setOrden(o => (o && o.k === c.k ? (o.d ? null : { k: c.k, d: true }) : { k: c.k, d: false })); };
  return html`<div class="tabla-caja"><div class="tabla-desliza"><table class="tabla">
    <thead><tr>${cols.map(c => html`<th class=${clases(c.num && "num", c.ordenar !== false && "ord")} onClick=${() => ord(c)} style=${c.ancho ? { width: c.ancho } : null}>
      ${c.n}${orden && orden.k === c.k ? (orden.d ? " ↓" : " ↑") : ""}</th>`)}</tr></thead>
    <tbody>${visibles.map(r => html`<tr key=${r[clave]} class=${onFila ? "clic" : ""} onClick=${onFila ? () => onFila(r) : null}>
      ${cols.map(c => html`<td class=${clases(c.num && "num", c.clase)}>${c.f ? c.f(r) : r[c.k]}</td>`)}</tr>`)}</tbody>
    ${pie && html`<tfoot><tr>${pie.map((p, i) => html`<td class=${cols[i] && cols[i].num ? "num" : ""}>${p}</td>`)}</tr></tfoot>`}
  </table></div>
  ${datos.length > mas && html`<div class="tabla-pie"><span>Mostrando ${num(mas)} de ${num(datos.length)}</span><${Boton} chico tipo="fantasma" onClick=${() => setMas(mas + limite)}>Ver más<//></div>`}
  </div>`;
}

// ---------------------------------------------------------------- indicadores y gráficos
export function Semaforo({ c }) { return html`<span class=${clases("sem", c)}></span>`; }
export function Spark({ valores, ancho = 84, alto = 26, color }) {
  const v = (valores || []).map(x => (isFinite(x) && x !== null ? Number(x) : null));
  const ok = v.filter(x => x !== null);
  if (ok.length < 2) return null;
  const min = Math.min(...ok), max = Math.max(...ok), r = max - min || 1;
  const pts = v.map((x, i) => (x === null ? null : [(i / (v.length - 1)) * ancho, alto - 3 - ((x - min) / r) * (alto - 6)])).filter(Boolean);
  const u = pts[pts.length - 1];
  return html`<svg class="spark" width=${ancho} height=${alto} viewBox=${`0 0 ${ancho} ${alto}`} aria-hidden="true">
    <polyline points=${pts.map(p => p.map(n => n.toFixed(1)).join(",")).join(" ")} fill="none" stroke=${color || "var(--texto-3)"} stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round" />
    <circle cx=${u[0]} cy=${u[1]} r="2.6" fill=${color || "var(--oro)"} />
  </svg>`;
}
export function Tendencia({ actual, previo, mejorSube = true, formato }) {
  if (previo === null || previo === undefined || actual === null || actual === undefined || !isFinite(previo) || !isFinite(actual)) return null;
  const d = actual - previo;
  if (Math.abs(d) < 1e-9) return html`<span class="tendencia">igual</span>`;
  const bien = (d > 0) === mejorSube;
  const txt = formato ? formato(Math.abs(d)) : previo ? num(Math.abs(d / previo) * 100) + "%" : formato ? "" : num(Math.abs(d));
  return html`<span class=${clases("tendencia", bien ? "bien" : "mal")}><${Icono} n=${d > 0 ? "arrow-up-right" : "arrow-down-right"} />${txt}</span>`;
}
// Gráfico de barras: datos [{n, v, actual}], meta opcional
export function Barras({ datos, alto = 170, meta, formato = v => num(v), colorActual = true }) {
  const W = Math.max(280, datos.length * 46), H = alto, pad = 22, base = H - 22;
  const max = Math.max(1, meta || 0, ...datos.map(d => d.v || 0));
  const bw = Math.min(34, (W - pad) / datos.length - 10);
  return html`<svg class="grafico" viewBox=${`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label="Gráfico de barras">
    <line class="eje" x1="0" x2=${W} y1=${base} y2=${base} />
    ${meta ? html`<line class="meta-g" x1="0" x2=${W} y1=${base - (meta / max) * (base - pad)} y2=${base - (meta / max) * (base - pad)} /><text x=${W - 2} y=${base - (meta / max) * (base - pad) - 5} text-anchor="end">meta ${formato(meta)}</text>` : null}
    ${datos.map((d, i) => {
      const x = (i + 0.5) * (W / datos.length), h = Math.max(d.v > 0 ? 2 : 0, ((d.v || 0) / max) * (base - pad));
      return html`<g>
        <rect class=${clases("barra-g", colorActual && d.actual && "actual")} x=${x - bw / 2} y=${base - h} width=${bw} height=${h} rx="4" />
        <text x=${x} y=${H - 6} text-anchor="middle">${d.n}</text>
        ${d.v ? html`<text x=${x} y=${base - h - 6} text-anchor="middle" style="fill:var(--texto-2)">${formato(d.v)}</text>` : null}
      </g>`;
    })}
  </svg>`;
}
export function Linea({ datos, alto = 160, formato = v => num(v), meta }) {
  const W = 560, H = alto, pad = 16, base = H - 22;
  const vals = datos.map(d => d.v).filter(v => v !== null && isFinite(v));
  if (vals.length < 2) return html`<p class="nota">Aún no hay suficientes datos para la tendencia.</p>`;
  const max = Math.max(...vals, meta || -Infinity), min = Math.min(...vals, meta !== undefined ? meta : Infinity, 0), r = max - min || 1;
  const X = i => 10 + (i / (datos.length - 1)) * (W - 20), Y = v => base - ((v - min) / r) * (base - pad);
  const pts = datos.map((d, i) => (d.v === null || !isFinite(d.v) ? null : [X(i), Y(d.v)])).filter(Boolean);
  const paso = Math.ceil(datos.length / 8);
  return html`<svg class="grafico" viewBox=${`0 0 ${W} ${H}`} role="img" aria-label="Gráfico de tendencia">
    <line class="eje" x1="0" x2=${W} y1=${base} y2=${base} />
    ${meta !== undefined && meta !== null ? html`<line class="meta-g" x1="0" x2=${W} y1=${Y(meta)} y2=${Y(meta)} />` : null}
    <polyline class="linea-g" points=${pts.map(p => p.join(",")).join(" ")} />
    ${pts.map((p, i) => html`<circle cx=${p[0]} cy=${p[1]} r=${i === pts.length - 1 ? 4 : 2.5} fill=${i === pts.length - 1 ? "var(--oro)" : "var(--texto-3)"} />`)}
    ${datos.map((d, i) => (i % paso === 0 || i === datos.length - 1 ? html`<text x=${X(i)} y=${H - 6} text-anchor="middle">${d.n}</text>` : null))}
    <text x=${pts[pts.length - 1][0]} y=${pts[pts.length - 1][1] - 9} text-anchor="end" style="fill:var(--texto);font-weight:600">${formato(datos[datos.length - 1].v)}</text>
  </svg>`;
}
export function BarrasH({ datos, formato = v => num(v) }) {
  const max = Math.max(1, ...datos.map(d => d.v || 0));
  return html`<div class="barras-h">${datos.map(d => html`<div class="barra-h"><span class="n" title=${d.n}>${d.n}</span><span class="pista-h"><i style=${{ width: ((d.v || 0) / max) * 100 + "%", background: d.color }}></i></span><span class="v">${formato(d.v)}</span></div>`)}</div>`;
}
export function Progreso({ v, max = 1, c }) {
  const p = Math.max(0, Math.min(1, max ? v / max : 0));
  return html`<div class=${clases("barra-meta", c)}><i style=${{ width: p * 100 + "%" }}></i></div>`;
}
export function Resumen({ items }) {
  return html`<div class="resumen">${items.filter(Boolean).map(x => html`<div><div class="et">${x.n}</div><div class=${clases("v", x.c)}>${x.v}</div>${x.d && html`<div class="d">${x.d}</div>`}</div>`)}</div>`;
}
export function Sellos({ actuales, cada }) {
  return html`<div class="sellos" aria-label=${`${actuales} de ${cada} sellos`}>${Array.from({ length: cada }, (_, i) => html`<span class=${clases("sello", i < actuales && "si")}>${i < actuales ? html`<${Icono} n="sparkles" />` : i === cada - 1 ? html`<${Icono} n="gift" />` : null}</span>`)}</div>`;
}

// ---------------------------------------------------------------- firma en pantalla
export function Firma({ cambiar }) {
  const c = useRef(), dib = useRef(false), hay = useRef(false);
  useEffect(() => {
    const cv = c.current, r = window.devicePixelRatio || 1, w = cv.clientWidth, h = cv.clientHeight;
    cv.width = w * r; cv.height = h * r;
    const x = cv.getContext("2d"); x.scale(r, r); x.lineWidth = 2.4; x.lineCap = "round"; x.lineJoin = "round"; x.strokeStyle = "#111";
    const pos = e => { const b = cv.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top]; };
    const ini = e => { e.preventDefault(); dib.current = true; cv.setPointerCapture(e.pointerId); const [a, b2] = pos(e); x.beginPath(); x.moveTo(a, b2); };
    const mov = e => { if (!dib.current) return; const [a, b2] = pos(e); x.lineTo(a, b2); x.stroke(); hay.current = true; };
    const fin = () => { if (!dib.current) return; dib.current = false; if (hay.current) cambiar(cv.toDataURL("image/png")); };
    cv.addEventListener("pointerdown", ini); cv.addEventListener("pointermove", mov); cv.addEventListener("pointerup", fin); cv.addEventListener("pointercancel", fin);
    return () => { cv.removeEventListener("pointerdown", ini); cv.removeEventListener("pointermove", mov); cv.removeEventListener("pointerup", fin); cv.removeEventListener("pointercancel", fin); };
  }, []);
  const limpiar = () => { const cv = c.current; cv.getContext("2d").clearRect(0, 0, cv.width, cv.height); hay.current = false; cambiar(""); };
  return html`<div class="campo"><div class="firma-caja"><canvas ref=${c}></canvas><span class="linea-firma"></span><span class="txt">Firma aquí con el dedo</span></div>
    <div class="btns fin"><${Boton} chico tipo="fantasma" icono="rotate-ccw" onClick=${limpiar}>Borrar firma<//></div></div>`;
}

export function money(n) { return soles(n); }

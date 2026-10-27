// AUTOCARE · Resultados: redes sociales, de dónde vienen tus clientes (y tu dinero) y reseñas
import { html, useState, useEffect } from "../../vendor/preact-htm.js";
import * as D from "../datos.js";
import * as N from "../negocio.js";
import { api } from "../api.js";
import { ir, usarTitulo } from "../app.js";
import { Boton, BotonAccion, Hoja, Entrada, Numero, Area, Selector, Interruptor, Chips, Pestanas, Insignia, Vacio, Fila, Bloque, Resumen, Tabla, Linea, BarrasH, AvisoLinea, aviso, confirmar, useFicha, b } from "../ui.js";
import { hoy, sumarDias, fechaCorta, relativa, hace, soles, suma, n0, num, nombreDe, copiar, MESES_CORTOS } from "../util.js";
import { REDES } from "../esquema.js";

export default function Resultados({ ruta }) {
  D.useDatos();
  usarTitulo("Resultados");
  const t = ruta.partes[0] || "canales";
  return html`<header class="pagina-cab"><div><h1>Resultados</h1><p>Mide para decidir: invierte tu tiempo en lo que trae clientes de verdad.</p></div></header>
    <${Pestanas} valor=${t} cambiar=${v => ir("resultados/" + v, true)} opciones=${[{ v: "canales", n: "De dónde vienen" }, { v: "redes", n: "Redes sociales" }, { v: "resenas", n: "Reseñas", cuenta: D.lista("resenas").filter(r => !r.publicar && r.texto).length }]} />
    ${t === "canales" && html`<${Canales} />`}${t === "redes" && html`<${Redes} />`}${t === "resenas" && html`<${Resenas} />`}`;
}

// ---------------------------------------------------------------- canales: visitas → consultas → clientes → dinero
function Canales() {
  const [dias, setDias] = useState(90), [vis, setVis] = useState(null);
  const desde = sumarDias(hoy(), -dias);
  useEffect(() => { api("visitas", { desde }).then(r => setVis(r.visitas)).catch(() => setVis([])); }, [dias]);
  const cls = D.lista("clientes"), canalDe = id => ((cls.find(c => c.id === id) || {}).canal || "Sin dato");
  const pagos = D.lista("pagos").filter(p => p.fecha >= desde && p.clienteId);
  const leads = D.lista("leads").filter(l => l.fecha >= desde);
  const nuevos = cls.filter(c => (c.alta || "") >= desde || (c.creado && new Date(c.creado).toISOString().slice(0, 10) >= desde));
  const canales = {};
  const sumar = (k, campo, v = 1) => { const c = canales[k] || (canales[k] = { canal: k, visitas: 0, consultas: 0, clientes: 0, ingresos: 0 }); c[campo] += v; };
  (vis || []).forEach(v => sumar(v.fuente || "Directo", "visitas", n0(v.n)));
  leads.forEach(l => sumar(l.canal || "Sin dato", "consultas"));
  nuevos.forEach(c => sumar(c.canal || "Sin dato", "clientes"));
  pagos.forEach(p => sumar(canalDe(p.clienteId), "ingresos", n0(p.monto)));
  const filas = Object.values(canales).map(c => Object.assign(c, { id: c.canal })).sort((a, c) => c.ingresos - a.ingresos || c.clientes - a.clientes);
  const mejor = filas[0];
  return html`<div class="filtros"><${Chips} valor=${String(dias)} cambiar=${v => setDias(Number(v || 90))} opciones=${[{ v: "30", n: "30 días" }, { v: "90", n: "90 días" }, { v: "365", n: "1 año" }]} /></div>
    ${mejor && mejor.ingresos > 0 && html`<div style="margin-bottom:16px"><${AvisoLinea} c="oro" icono="trending-up">Tu canal que más dinero trae es <b>${mejor.canal}</b> (${soles(Math.round(mejor.ingresos))}). Dale más tiempo a lo que funciona.<//></div>`}
    <${Tabla} filas=${filas} vacio=${html`<${Vacio} icono="chart-column" titulo="Aún no hay datos de canales" texto="Pregunta siempre «¿cómo nos conociste?» al crear un cliente, y comparte tu web con ?src=ig, ?src=tt o ?src=qr para saber de dónde llegan." />`}
      movil=${c => html`<${Fila} icono="share-2" titulo=${c.canal} sub=${`${c.visitas} visitas · ${c.consultas} consultas · ${c.clientes} clientes`} der=${html`<b class="cifra">${soles(Math.round(c.ingresos))}</b>`} />`}
      cols=${[{ k: "canal", n: "Canal", clase: "prin" }, { k: "visitas", n: "Visitas web", num: true }, { k: "consultas", n: "Consultas", num: true }, { k: "clientes", n: "Clientes nuevos", num: true }, { k: "ingresos", n: "Dinero cobrado", num: true, f: c => soles(Math.round(c.ingresos)) }]} />
    <${Bloque} titulo="Enlaces para medir cada canal" sub="Úsalos en tu bio, historias y stickers"><div class="grupo">
      ${[["ig", "Instagram (bio e historias)"], ["tt", "TikTok"], ["fb", "Facebook"], ["qr", "Sticker o QR en tu auto"], ["wa", "Estado de WhatsApp"]].map(([k, n]) => {
        const u = (N.negocio().web || location.origin + location.pathname.replace(/\/app\/.*$/, "")).replace(/\/+$/, "") + "/enlaces.html?src=" + k;
        return html`<${Fila} icono="link" titulo=${n} sub=${u} der=${html`<${Boton} chico icono="copy" onClick=${async () => { await copiar(u); aviso("Enlace copiado."); }}>Copiar<//>`} />`; })}</div><//>`;
}

// ---------------------------------------------------------------- redes sociales
function Redes() {
  const [ed, setEd] = useState(null);
  const ig = D.ajuste("igMedia"), fb = D.ajuste("fbMedia");
  const met = D.lista("metricas").slice().sort((a, c) => String(a.fecha).localeCompare(String(c.fecha)));
  const serie = red => met.filter(m => m.red === red).slice(-12).map(m => ({ n: fechaCorta(m.fecha).split(" ").slice(1).join(" "), v: n0(m.seguidores) }));
  const mejores = ((ig && ig.lista) || []).slice().sort((a, c) => (c.likes + c.comentarios * 3 + (c.shares || 0) * 5 + (c.saved || 0) * 4) - (a.likes + a.comentarios * 3 + (a.shares || 0) * 5 + (a.saved || 0) * 4)).slice(0, 6);
  const ult = red => met.filter(m => m.red === red).pop();
  return html`<div class="filtros"><p class="tenue" style="flex:1">${ig ? `Instagram actualizado ${hace(ig.en)}.` : "Conecta Instagram en Configuración → Avisos y redes para traer tus números solos. Mientras tanto, anótalos a mano."}</p>
      ${ig && html`<${BotonAccion} icono="refresh-cw" accion=${async () => { await api("redesSync"); aviso("Datos actualizados."); }}>Traer datos ahora<//>`}<${Boton} icono="plus" onClick=${() => setEd({})}>Anotar números<//></div>
    <${Resumen} items=${Object.keys(REDES).map(r => { const u = ult(r) || (r === "instagram" && ig ? { seguidores: ig.seguidores } : r === "facebook" && fb ? { seguidores: fb.seguidores } : null); return { n: REDES[r] + " · seguidores", v: u ? num(u.seguidores) : "—" }; })} />
    <div class="columnas" style="margin-top:20px"><div>
      ${["instagram", "tiktok", "facebook"].map(r => serie(r).length > 1 && html`<${Bloque} titulo=${"Seguidores en " + REDES[r]}><div class="panel"><${Linea} datos=${serie(r)} /></div><//>`)}
      ${mejores.length > 0 && html`<${Bloque} titulo="Tus publicaciones que mejor funcionaron" sub="Haz más de esto"><div class="grupo">${mejores.map(p => html`<a class="fila" href=${p.enlace} target="_blank" rel="noopener">
        ${p.imagen && html`<img src=${p.imagen} alt="" style="width:52px;height:52px;object-fit:cover;border-radius:10px" loading="lazy" />`}
        <span class="cuerpo"><span class="t">${p.texto || "Publicación"}</span><span class="s">${fechaCorta(p.fecha)} · ${p.likes} me gusta · ${p.comentarios} comentarios${p.shares ? " · " + p.shares + " envíos" : ""}${p.reach ? " · alcance " + num(p.reach) : ""}</span></span></a>`)}</div><//>`}
      ${!mejores.length && met.length < 2 && html`<${Vacio} icono="chart-line" titulo="Aún no hay números de redes" texto="Anota cada semana tus seguidores e interacciones. En un mes verás qué tipo de contenido te hace crecer." />`}
    </div><div>
      <${Bloque} titulo="Lo que más importa medir"><div class="panel">
        <p><b>Envíos por DM y guardados</b> antes que «me gusta»: Instagram dice que una de sus señales más importantes es cuántos envían tu publicación a un amigo (Adam Mosseri).</p>
        <p style="margin-top:10px"><b>Clientes, no solo seguidores.</b> Mira en «De dónde vienen» cuánto dinero trae cada red.</p></div><//>
      <${Bloque} titulo="Historial"><div class="grupo">${met.slice(-10).reverse().map(m => html`<${Fila} icono="chart-column" titulo=${REDES[m.red] || m.red} sub=${fechaCorta(m.fecha) + (m.origen === "api" ? " · automático" : " · a mano")} der=${html`<b class="cifra">${num(m.seguidores)}</b>`} onClick=${() => m.origen !== "api" && setEd(m)} />`)}</div><//>
    </div></div>
    ${ed && html`<${FormMetrica} m=${ed} cerrar=${() => setEd(null)} />`}`;
}
function FormMetrica({ m, cerrar }) {
  const [f, set] = useFicha(Object.assign({ fecha: hoy(), red: "instagram", seguidores: null, publicaciones: null, alcance: null, interacciones: null, nota: "", origen: "manual" }, m));
  return html`<${Hoja} centro titulo="Anotar números de redes" cerrar=${cerrar} pie=${html`${m.id && html`<${Boton} tipo="fantasma peligro" icono="trash-2" titulo="Eliminar" onClick=${() => { D.borrar("metricas", m.id); cerrar(); }} />`}<${Boton} tipo="primario" onClick=${() => { D.guardar("metricas", f); aviso("Guardado."); cerrar(); }}>Guardar<//>`}>
    <div class="form"><${Chips} valor=${f.red} cambiar=${v => set("red", v || f.red)} opciones=${Object.keys(REDES).map(k => ({ v: k, n: REDES[k] }))} />
      <div class="rejilla dos-movil"><${Numero} etiqueta="Seguidores" decimales=${0} ...${b(f, set, "seguidores")} /><${Entrada} etiqueta="Fecha" tipo="date" ...${b(f, set, "fecha")} /></div>
      <div class="rejilla dos-movil"><${Numero} etiqueta="Alcance (últimos 7 días)" decimales=${0} ...${b(f, set, "alcance")} /><${Numero} etiqueta="Interacciones" decimales=${0} ...${b(f, set, "interacciones")} /></div>
      <${Entrada} etiqueta="Nota" ...${b(f, set, "nota")} placeholder="Ej.: el reel del SUV pegó fuerte" /></div><//>`;
}

// ---------------------------------------------------------------- reseñas
function Resenas() {
  const [ed, setEd] = useState(null);
  const l = D.lista("resenas").slice().sort((a, c) => String(c.fecha).localeCompare(String(a.fecha)));
  const prom = l.length ? suma(l, r => n0(r.estrellas)) / l.length : 0, pub = l.filter(r => r.publicar).length;
  const google = N.negocio().google;
  return html`<${Resumen} items=${[{ n: "Reseñas", v: l.length }, { n: "Promedio", v: l.length ? num(prom, 1) + " ★" : "—", c: "oro" }, { n: "Mostradas en tu web", v: pub, d: pub < 5 ? "Con 5 o más, la gente confía mucho más" : "" }]} />
    <div class="filtros" style="margin-top:16px"><p class="tenue" style="flex:1">${google ? "Pide la reseña de Google a todos los clientes por igual (es la regla de Google)." : "Crea tu Perfil de Empresa en Google (mira Ayuda) y pega el enlace de reseñas en Configuración → Negocio."}</p>
      ${google && html`<${Boton} icono="copy" onClick=${async () => { await copiar(google); aviso("Enlace copiado."); }}>Copiar enlace de Google<//>`}<${Boton} icono="plus" onClick=${() => setEd({})}>Agregar reseña<//></div>
    ${l.length ? html`<div class="grupo">${l.map(r => html`<div class="fila"><span class="cuerpo"><span class="t">${"★".repeat(n0(r.estrellas) || 5)} ${r.nombre}</span><span class="s multi">${r.texto || "Sin comentario"}</span><span class="s">${fechaCorta(r.fecha)} · ${r.origen || "manual"}${r.servicio ? " · " + r.servicio : ""}</span></span>
      <span class="der"><${Interruptor} etiqueta="" valor=${!!r.publicar} cambiar=${v => D.cambiar("resenas", r.id, { publicar: v })} /><${Boton} chico tipo="fantasma" icono="pencil" titulo="Editar" onClick=${() => setEd(r)} /></span></div>`)}</div>`
      : html`<${Vacio} icono="star" titulo="Aún no tienes reseñas" texto="Llegan solas cuando el cliente califica desde su enlace. También puedes agregar las de Google o WhatsApp." />`}
    <p class="nota" style="margin-top:10px">El interruptor decide si la reseña sale en tu web. Muestra solo opiniones reales y con permiso del cliente.</p>
    ${ed && html`<${FormResena} r=${ed} cerrar=${() => setEd(null)} />`}`;
}
function FormResena({ r, cerrar }) {
  const [f, set] = useFicha(Object.assign({ fecha: hoy(), nombre: "", estrellas: 5, texto: "", servicio: "", origen: "google", publicar: true }, r));
  return html`<${Hoja} centro titulo=${r.id ? "Editar reseña" : "Agregar reseña"} cerrar=${cerrar} pie=${html`${r.id && html`<${Boton} tipo="fantasma peligro" icono="trash-2" titulo="Eliminar" onClick=${() => { D.borrar("resenas", r.id); cerrar(); }} />`}<${Boton} tipo="primario" onClick=${() => { if (!f.nombre) return aviso("Escribe el nombre.", { error: true }); D.guardar("resenas", f); cerrar(); }}>Guardar<//>`}>
    <div class="form"><div class="rejilla dos-movil"><${Entrada} etiqueta="Nombre (ej.: Carla M.)" ...${b(f, set, "nombre")} /><${Numero} etiqueta="Estrellas" decimales=${0} ...${b(f, set, "estrellas")} /></div>
      <${Area} etiqueta="Comentario" ...${b(f, set, "texto")} /><div class="rejilla"><${Entrada} etiqueta="Servicio" ...${b(f, set, "servicio")} /><${Selector} etiqueta="Dónde la dejó" opciones=${[{ v: "google", n: "Google" }, { v: "whatsapp", n: "WhatsApp" }, { v: "instagram", n: "Instagram" }, { v: "portal", n: "Su enlace personal" }, { v: "manual", n: "En persona" }]} ...${b(f, set, "origen")} /></div>
      <${Interruptor} etiqueta="Mostrar en mi web" ...${b(f, set, "publicar")} /></div><//>`;
}

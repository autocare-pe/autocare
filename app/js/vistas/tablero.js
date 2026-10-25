// AUTOCARE · Tablero de indicadores (Balanced Scorecard, Kaplan y Norton)
// 4 perspectivas: dinero, clientes, procesos y aprendizaje. Cada indicador dice su fórmula, tu meta y por qué importa.
import { html, useState } from "../../vendor/preact-htm.js";
import * as D from "../datos.js";
import * as N from "../negocio.js";
import { ir, usarTitulo } from "../app.js";
import { Boton, Hoja, Numero, Pestanas, Semaforo, Spark, Tendencia, Linea, Par, AvisoLinea, Fila, aviso } from "../ui.js";
import { hoy, mesDe, sumarMeses, sumarDias, finMes, mesLargo, soles, pct, num, suma, mediana, promedio, diasEntre, MESES_CORTOS, n0, clases } from "../util.js";

const fin = m => (mesDe(hoy()) === m ? hoy() : finMes(m + "-01"));
const enMes = (f, m) => String(f || "").slice(0, 7) === m;
const entregadas = m => D.lista("ordenes").filter(o => o.estado === "entregado" && enMes(o.fecha, m));
const msMes = ms => { if (!ms) return ""; return new Date(ms - 5 * 3600000).toISOString().slice(0, 7); };

// u: "S/" | "%" | "min" | "n" | "★" · mejor: "sube" | "baja"
export const KPIS = [
  { id: "ingresos", p: "finanzas", n: "Cobros del mes", u: "S/", mejor: "sube", meta: 4000, f: "Suma de todos los cobros registrados en el mes.",
    a: "Kaplan y Norton, Balanced Scorecard", porque: "Es el resultado final. Pero es un indicador de resultado: para moverlo actúa sobre los de clientes y procesos.", mejora: "Llena tu agenda con clientes que vuelven y sube el ticket con adicionales.",
    calc: m => suma(D.lista("pagos").filter(p => enMes(p.fecha, m)), "monto") },
  { id: "porHora", p: "finanzas", n: "Ganancia por hora", u: "S/", mejor: "sube", meta: 35, f: "(Servicios entregados − insumos usados) ÷ horas trabajadas, contando el traslado.",
    a: "Eliyahu Goldratt, La Meta (teoría de restricciones)", porque: "Tus horas son tu límite. No ganas más trabajando más horas, sino haciendo que cada hora deje más.", mejora: "Agrupa citas por zona, vende servicios que dejan más por hora y reduce tiempos muertos.",
    calc: m => N.resultadosMes(m).porHora },
  { id: "margen", p: "finanzas", n: "Margen del mes", u: "%", mejor: "sube", meta: 0.3, f: "(Cobros − gastos) ÷ cobros.",
    a: "Mike Michalowicz, La ganancia es primero", porque: "Vender mucho y que no quede nada es trabajar gratis. El margen dice cuánto de cada sol es tuyo.", mejora: "Revisa en qué se va el dinero y separa tu ganancia apenas cobras (Finanzas → Reparto).",
    calc: m => N.resultadosMes(m).margen },
  { id: "ticket", p: "finanzas", n: "Ticket promedio", u: "S/", mejor: "sube", meta: 70, f: "Valor de los servicios entregados ÷ número de servicios cobrados.",
    a: "Indicador clásico de ventas por cliente", porque: "Subir el ticket rinde más que buscar clientes nuevos: el traslado ya lo hiciste.", mejora: "Ofrece un adicional en cada visita (encerado, motor, ozono) y paquetes de 3 niveles.",
    calc: m => N.resultadosMes(m).ticket || null },
  { id: "recurrente", p: "finanzas", n: "Ingresos de planes", u: "%", mejor: "sube", meta: 0.2, f: "Cobros de membresías ÷ cobros totales.",
    a: "John Warrillow, The Automatic Customer", porque: "El dinero que llega solo cada mes da tranquilidad y te permite planificar.", mejora: "Ofrece el plan mensual a tus clientes frecuentes.",
    calc: m => N.resultadosMes(m).recurrente },

  { id: "activos", p: "clientes", n: "Clientes activos", u: "n", mejor: "sube", meta: 40, f: "Clientes con al menos un servicio en los últimos 90 días.",
    a: "Byron Sharp, How Brands Grow", porque: "Creces sumando clientes, no exprimiendo a los mismos. Esta es tu base real.", mejora: "Mantén el ritmo de clientes nuevos y escríbeles a los que les toca volver.",
    calc: m => { const h = fin(m), d = sumarDias(h, -90); return new Set(D.lista("ordenes").filter(o => o.estado === "entregado" && o.fecha >= d && o.fecha <= h).map(o => o.clienteId)).size; } },
  { id: "nuevos", p: "clientes", n: "Clientes nuevos", u: "n", mejor: "sube", meta: 10, f: "Clientes cuya primera orden entregada fue este mes.",
    a: "Byron Sharp, How Brands Grow", porque: "Sin clientes nuevos, la base se encoge sola con el tiempo.", mejora: "Publica antes y después, pide referidos y responde rápido las consultas.",
    calc: m => { const prim = {}; D.lista("ordenes").filter(o => o.estado === "entregado").forEach(o => { if (!prim[o.clienteId] || o.fecha < prim[o.clienteId]) prim[o.clienteId] = o.fecha; }); return Object.values(prim).filter(f => enMes(f, m)).length; } },
  { id: "regreso", p: "clientes", n: "Servicios a clientes que vuelven", u: "%", mejor: "sube", meta: 0.5, f: "Servicios del mes a clientes que ya te habían contratado ÷ servicios del mes.",
    a: "Reichheld y Sasser, Zero Defections (HBR, 1990)", porque: "Retener solo 5% más de clientes puede casi duplicar las utilidades en servicios. El cliente que vuelve no te cuesta publicidad.", mejora: "Recordatorio a los 21-30 días, plan mensual y una entrega impecable.",
    calc: m => { const l = entregadas(m); if (!l.length) return null; const todas = D.lista("ordenes").filter(o => o.estado === "entregado"); return l.filter(o => todas.some(x => x.clienteId === o.clienteId && x.fecha < o.fecha)).length / l.length; } },
  { id: "nps", p: "clientes", n: "¿Te recomendarían? (NPS)", u: "n", mejor: "sube", meta: 70, f: "% que califica 9-10 menos % que califica 0-6, últimos 90 días.",
    a: "Fred Reichheld, The One Number You Need to Grow (HBR, 2003)", porque: "Quien te recomienda trae clientes gratis. Es la mejor señal de que vas a crecer.", mejora: "Llama hoy a quien te puso 6 o menos: un problema bien resuelto crea un cliente fiel.",
    calc: m => { const h = fin(m), d = sumarDias(h, -90); const v = D.lista("ordenes").filter(o => o.fecha >= d && o.fecha <= h && o.nps !== undefined && o.nps !== null && o.nps !== "").map(o => n0(o.nps)); if (!v.length) return null; return Math.round(((v.filter(x => x >= 9).length - v.filter(x => x <= 6).length) / v.length) * 100); } },
  { id: "estrellas", p: "clientes", n: "Satisfacción", u: "★", mejor: "sube", meta: 4.8, f: "Promedio de estrellas que te dieron los clientes este mes.",
    a: "Peak-end rule, Daniel Kahneman", porque: "El cliente recuerda el mejor momento y el final. La entrega es el momento que más pesa.", mejora: "Entrega mostrando el antes y después, auto perfumado y vidrios impecables.",
    calc: m => promedio(entregadas(m).map(o => o.calificacion).filter(Boolean).map(Number)) },

  { id: "respuesta", p: "procesos", n: "Tiempo de respuesta", u: "min", mejor: "baja", meta: 60, f: "Mediana de minutos entre que llega una consulta y la contactas.",
    a: "Oldroyd y otros, The Short Life of Online Sales Leads (HBR, 2011)", porque: "Quien responde en la primera hora tiene casi 7 veces más probabilidad de concretar.", mejora: "Activa los avisos de Telegram y responde con la plantilla de consulta.",
    calc: m => mediana(D.lista("leads").filter(l => msMes(l.creado) === m && l.contactadoEn && l.creado).map(l => (l.contactadoEn - l.creado) / 60000)) },
  { id: "conversion", p: "procesos", n: "Consultas que se vuelven cita", u: "%", mejor: "sube", meta: 0.4, f: "Prospectos del mes que llegaron a agendado o ganado ÷ prospectos del mes.",
    a: "Embudo de ventas", porque: "Te dice si el problema es que no llegan consultas o que no las cierras.", mejora: "Responde rápido, manda precio claro con fotos y ofrece dos horarios concretos.",
    calc: m => { const l = D.lista("leads").filter(x => enMes(x.fecha, m)); return l.length ? l.filter(x => ["agendado", "ganado"].includes(x.etapa)).length / l.length : null; } },
  { id: "ocupacion", p: "procesos", n: "Ocupación de tu agenda", u: "%", mejor: "sube", meta: 0.7, f: "Minutos agendados ÷ minutos que atiendes según tu horario.",
    a: "Eliyahu Goldratt, La Meta", porque: "Una hora vacía no se recupera nunca. Pasar de 50% a 70% es crecer sin gastar en nada.", mejora: "Ofrece primero los huecos libres y escribe a los que les toca volver.",
    calc: m => N.ocupacion(m + "-01", fin(m)).pct },
  { id: "estandar", p: "procesos", n: "Servicios dentro del tiempo estándar", u: "%", mejor: "sube", meta: 0.8, f: "Órdenes que terminaron en el tiempo estándar (+10%) ÷ órdenes entregadas.",
    a: "Trabajo estandarizado, Sistema de Producción Toyota", porque: "Si cada servicio toma lo mismo, puedes prometer horas y meter más citas.", mejora: "Sigue los pasos del checklist y prepara el equipo antes de llegar.",
    calc: m => { const l = entregadas(m).filter(o => n0(o.minutosReales)); return l.length ? l.filter(o => n0(o.minutosReales) <= N.minutosEstandar(o) * 1.1).length / l.length : null; } },
  { id: "primera", p: "procesos", n: "Calidad a la primera", u: "%", mejor: "sube", meta: 0.95, f: "Órdenes que pasaron el control de calidad sin volver a proceso ÷ órdenes entregadas.",
    a: "Philip Crosby, La calidad no cuesta", porque: "Cada reproceso es tiempo que no cobras.", mejora: "Revisa el checklist en cada paso, no solo al final.",
    calc: m => { const l = entregadas(m); return l.length ? l.filter(o => !n0(o.reintentos)).length / l.length : null; } },
  { id: "perdidas", p: "procesos", n: "Citas que se cayeron", u: "%", mejor: "baja", meta: 0.05, f: "Citas canceladas o no realizadas ÷ citas del mes.",
    a: "Gestión de capacidad", porque: "Cada cita caída es un hueco que ya no llenas.", mejora: "Recordatorio un día antes y adelanto en servicios largos.",
    calc: m => { const l = D.lista("citas").filter(c => enMes(c.fecha, m)); return l.length ? l.filter(c => ["cancelada", "no_asistio"].includes(c.estado)).length / l.length : null; } },

  { id: "revisiones", p: "aprendizaje", n: "Revisiones semanales hechas", u: "n", mejor: "sube", meta: 4, f: "Revisiones de 15 minutos registradas en el mes.",
    a: "Verne Harnish, Scaling Up · McChesney y otros, Las 4 disciplinas de la ejecución", porque: "Lo que no se revisa cada semana no mejora. El ritmo es lo que convierte los planes en resultados.", mejora: "Cada lunes, 15 minutos: números, qué salió bien, qué harás distinto.",
    calc: m => D.lista("revisiones").filter(r => enMes(r.fecha, m)).length },
  { id: "mejoras", p: "aprendizaje", n: "Mejoras adoptadas", u: "n", mejor: "sube", meta: 2, f: "Mejoras marcadas como adoptadas este mes.",
    a: "Masaaki Imai, Kaizen", porque: "Pequeñas mejoras constantes ganan a los grandes cambios que nunca se hacen.", mejora: "Anota cada problema que se repite y prueba una solución a la vez.",
    calc: m => D.lista("mejoras").filter(x => x.estado === "adoptada" && enMes(x.fecha, m)).length },
  { id: "publicaciones", p: "aprendizaje", n: "Publicaciones del mes", u: "n", mejor: "sube", meta: 12, f: "Publicaciones marcadas como publicadas en el mes.",
    a: "Byron Sharp, How Brands Grow (disponibilidad mental)", porque: "La gente contrata a quien recuerda. Publicar seguido te mantiene en su cabeza.", mejora: "3 por semana: antes y después, un consejo y una opinión de cliente.",
    calc: m => D.lista("contenido").filter(c => c.estado === "publicado" && enMes(c.fecha, m)).length }
];
export const PERSPECTIVAS = {
  finanzas: { n: "Dinero", d: "¿El negocio deja ganancia?" }, clientes: { n: "Clientes", d: "¿Te eligen y vuelven?" },
  procesos: { n: "Procesos", d: "¿Trabajas bien y sin desperdicio?" }, aprendizaje: { n: "Aprendizaje", d: "¿Mejoras cada semana?" }
};
export function metaDe(k) { const m = D.ajuste("metasKpi", {}) || {}; return m[k.id] !== undefined && m[k.id] !== null ? Number(m[k.id]) : k.meta; }
export function valorKpi(k, m) { return D.calculado("kpi:" + k.id + m, () => { const v = k.calc(m); return v === undefined || v === null || !isFinite(v) ? null : v; }); }
export function formato(k, v) {
  if (v === null || v === undefined) return "—";
  return k.u === "S/" ? soles(Math.round(v)) : k.u === "%" ? pct(v) : k.u === "min" ? num(v) + " min" : k.u === "★" ? num(v, 1) : num(v);
}
export function colorKpi(k, v) {
  if (v === null) return "";
  const meta = metaDe(k);
  if (k.mejor === "baja") return v <= meta ? "verde" : v <= meta * 1.5 ? "ambar" : "rojo";
  return v >= meta ? "verde" : v >= meta * 0.8 ? "ambar" : "rojo";
}

export default function Tablero({ ruta }) {
  D.useDatos();
  usarTitulo("Tablero");
  const [mes, setMes] = useState(mesDe(hoy())), [ver, setVer] = useState(null);
  const t = ruta.partes[0] || "tablero";
  const ant = mesDe(sumarMeses(mes + "-01", -1));
  const meses = Array.from({ length: 6 }, (_, i) => mesDe(sumarMeses(mes + "-01", i - 5)));
  const rojos = KPIS.filter(k => colorKpi(k, valorKpi(k, mes)) === "rojo");
  return html`<header class="pagina-cab"><div><h1>Tablero</h1><p>${mesLargo(mes).replace(/^./, x => x.toUpperCase())}. Toca un indicador para ver su fórmula y cómo mejorarlo.</p></div>
      <div class="acciones"><${Boton} icono="chevron-left" titulo="Mes anterior" onClick=${() => setMes(ant)} /><${Boton} onClick=${() => setMes(mesDe(hoy()))}>Este mes<//><${Boton} icono="chevron-right" titulo="Mes siguiente" onClick=${() => setMes(mesDe(sumarMeses(mes + "-01", 1)))} /></div></header>
    <${Pestanas} valor=${t} cambiar=${v => ir("tablero/" + v, true)} opciones=${[{ v: "tablero", n: "Tablero" }, { v: "metas", n: "Metas" }]} />
    ${t === "metas" ? html`<${Metas} />` : html`
    ${rojos.length > 0 && html`<div style="margin-bottom:20px"><${AvisoLinea} c="oro" icono="target">Enfócate esta semana en <b>${rojos.slice(0, 2).map(k => k.n.toLowerCase()).join(" y ")}</b>. Pocas prioridades bien hechas valen más que muchas a medias (McChesney, Las 4 disciplinas).<//></div>`}
    ${Object.keys(PERSPECTIVAS).map(p => html`<section class="perspectiva"><div class="perspectiva-cab"><h2>${PERSPECTIVAS[p].n}</h2><p>${PERSPECTIVAS[p].d}</p></div>
      <div class="kpis">${KPIS.filter(k => k.p === p).map(k => {
        const v = valorKpi(k, mes), va = valorKpi(k, ant), c = colorKpi(k, v), meta = metaDe(k);
        return html`<button class=${clases("kpi", c)} onClick=${() => setVer(k)}>
          <span class="kpi-nombre">${k.n}<${Semaforo} c=${c} /></span>
          <span class="kpi-valor">${formato(k, v)}</span>
          <div class="meta-barra"><i style=${{ width: v === null ? "0%" : Math.min(100, k.mejor === "baja" ? (v ? (meta / v) * 100 : 100) : (v / (meta || 1)) * 100) + "%" }}></i></div>
          <span class="kpi-pie">meta ${formato(k, meta)} <${Tendencia} actual=${v} previo=${va} mejorSube=${k.mejor !== "baja"} /><${Spark} valores=${meses.map(x => valorKpi(k, x))} /></span>
        </button>`;
      })}</div></section>`)}`}
    ${ver && html`<${DetalleKpi} k=${ver} mes=${mes} meses=${meses} cerrar=${() => setVer(null)} />`}`;
}
function DetalleKpi({ k, mes, meses, cerrar }) {
  const v = valorKpi(k, mes), [meta, setMeta] = useState(k.u === "%" ? metaDe(k) * 100 : metaDe(k));
  const guardar = () => { D.fijarAjuste("metasKpi", Object.assign({}, D.ajuste("metasKpi", {}), { [k.id]: k.u === "%" ? n0(meta) / 100 : n0(meta) })); aviso("Meta guardada."); cerrar(); };
  return html`<${Hoja} titulo=${k.n} sub=${PERSPECTIVAS[k.p].n} cerrar=${cerrar} pie=${D.puedeAjuste("metasKpi") && html`<${Boton} tipo="primario" onClick=${guardar}>Guardar meta<//>`}>
    <div class="cifra-grande" style="margin-bottom:6px">${formato(k, v)}</div>
    <p class="tenue" style="margin-bottom:18px">Meta: ${formato(k, metaDe(k))} · ${k.mejor === "baja" ? "mientras más bajo, mejor" : "mientras más alto, mejor"}</p>
    <div class="panel" style="margin-bottom:16px"><${Linea} datos=${meses.map(x => ({ n: MESES_CORTOS[Number(x.slice(5)) - 1], v: valorKpi(k, x) }))} formato=${x => formato(k, x)} meta=${metaDe(k)} /></div>
    <div class="grupo" style="margin-bottom:16px">
      <${Fila} icono="calculator" titulo="Cómo se calcula" sub=${k.f} multi />
      <${Fila} icono="lightbulb" titulo="Por qué importa" sub=${k.porque} multi />
      <${Fila} icono="trending-up" titulo="Cómo mejorarlo" sub=${k.mejora} multi />
      <${Fila} icono="book-open" titulo="De dónde viene" sub=${k.a} multi />
    </div>
    ${D.puedeAjuste("metasKpi") && html`<${Numero} etiqueta=${"Tu meta" + (k.u === "%" ? " (%)" : k.u === "S/" ? " (S/)" : "")} valor=${meta} cambiar=${setMeta} decimales=${k.u === "★" ? 1 : 0} />`}
  <//>`;
}
function Metas() {
  const [m, setM] = useState(() => Object.fromEntries(KPIS.map(k => [k.id, k.u === "%" ? metaDe(k) * 100 : metaDe(k)])));
  const guardar = () => { D.fijarAjuste("metasKpi", Object.fromEntries(KPIS.map(k => [k.id, k.u === "%" ? n0(m[k.id]) / 100 : n0(m[k.id])]))); aviso("Metas guardadas."); };
  return html`<${AvisoLinea} icono="target">Pon metas que puedas alcanzar en 3 meses. Una meta imposible desanima; una muy fácil no te mueve.<//>
    ${Object.keys(PERSPECTIVAS).map(p => html`<section class="bloque" style="margin-top:18px"><div class="bloque-cab"><h2>${PERSPECTIVAS[p].n}</h2></div>
      <div class="panel"><div class="rejilla" style="--col:3">${KPIS.filter(k => k.p === p).map(k => html`<${Numero} etiqueta=${k.n + (k.u === "%" ? " (%)" : k.u === "S/" ? " (S/)" : k.u === "min" ? " (min)" : "")} decimales=${k.u === "★" ? 1 : 0} valor=${m[k.id]} cambiar=${v => setM(Object.assign({}, m, { [k.id]: v }))} />`)}</div></div></section>`)}
    ${D.puedeAjuste("metasKpi") && html`<${Boton} tipo="primario" grande onClick=${guardar}>Guardar metas<//>`}`;
}

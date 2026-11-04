// AUTOCARE · Plan y revisión: plan de una página, prioridades del trimestre, revisión semanal y mejoras
// Harnish (Scaling Up): plan de una página y ritmo de reuniones · Doerr (OKR) · Deming (planear, hacer, revisar, ajustar) · Imai (Kaizen)
import { html, useState } from "../../vendor/preact-htm.js";
import * as D from "../datos.js";
import * as N from "../negocio.js";
import { ir, usarTitulo } from "../app.js";
import { Boton, Hoja, Entrada, Numero, Area, Selector, Chips, Pestanas, Insignia, Vacio, Fila, Bloque, Resumen, Progreso, AvisoLinea, aviso, confirmar, useFicha, b } from "../ui.js";
import { hoy, sumarDias, inicioSemana, semanaISO, trimestre, rangoTrimestre, fechaCorta, relativa, soles, suma, mediana, duracion, n0, clases } from "../util.js";
import { ESTADOS, AREAS_MEJORA, estadoDe } from "../esquema.js";

export default function Plan({ ruta }) {
  D.useDatos();
  usarTitulo("Plan y revisión");
  const t = ruta.partes[0] || "plan";
  return html`<header class="pagina-cab"><div><h1>Plan y revisión</h1><p>Hacia dónde vas, qué 3 cosas importan este trimestre y cómo te fue cada semana.</p></div></header>
    <${Pestanas} valor=${t} cambiar=${v => ir("plan/" + v, true)} opciones=${[{ v: "plan", n: "Plan del trimestre" }, { v: "revision", n: "Revisión semanal" }, { v: "mejoras", n: "Mejoras" }]} />
    ${t === "plan" && html`<${PlanTrimestre} />`}${t === "revision" && html`<${Revision} />`}${t === "mejoras" && html`<${Mejoras} />`}`;
}

// ---------------------------------------------------------------- plan de una página + prioridades
function PlanTrimestre() {
  const [tri, setTri] = useState(trimestre(hoy())), [ed, setEd] = useState(null), [editPlan, setEditPlan] = useState(false);
  const P = D.ajuste("plan", {}), puede = D.puede("direccion", 2);
  const objs = D.lista("objetivos").filter(o => o.periodo === tri).sort((a, c) => (a.orden || 9) - (c.orden || 9));
  const avance = o => { const r = o.resultados || []; return r.length ? r.reduce((a, x) => a + Math.min(1, n0(x.meta) ? n0(x.actual) / n0(x.meta) : 0), 0) / r.length : 0; };
  const [ini, fin] = rangoTrimestre(tri);
  const mover = d => { const [y, q] = tri.split("-T").map(Number); const n = q + d; setTri(n < 1 ? `${y - 1}-T4` : n > 4 ? `${y + 1}-T1` : `${y}-T${n}`); };
  return html`<div class="columnas">
    <div>
      <div class="dia-cab"><${Boton} icono="chevron-left" titulo="Anterior" onClick=${() => mover(-1)} /><${Boton} icono="chevron-right" titulo="Siguiente" onClick=${() => mover(1)} />
        <h2>Trimestre ${tri.split("-T")[1]} de ${tri.split("-")[0]}</h2><span class="nota">${fechaCorta(ini)} al ${fechaCorta(fin)}</span>
        ${puede && html`<${Boton} tipo="primario" icono="plus" onClick=${() => setEd({ periodo: tri })} style="margin-left:auto">Prioridad<//>`}</div>
      ${objs.length > 3 && html`<div style="margin-bottom:12px"><${AvisoLinea} c="ambar" icono="triangle-alert">Tienes ${objs.length} prioridades. Con 3 o menos se logran más cosas: si todo es prioridad, nada lo es (Harnish, Scaling Up).<//></div>`}
      ${objs.length ? objs.map(o => html`<div class="panel" style="margin-bottom:12px">
          <div style="display:flex;gap:10px;align-items:center;margin-bottom:6px"><b style="font-size:16px;flex:1">${o.titulo}</b><${Insignia} c=${estadoDe("objetivos", o.estado || "en_curso").c}>${estadoDe("objetivos", o.estado || "en_curso").n}<//>${puede && html`<${Boton} chico tipo="fantasma" icono="pencil" titulo="Editar" onClick=${() => setEd(o)} />`}</div>
          ${o.responsableId && D.somosVarios() && html`<p class="nota" style="margin-bottom:6px">Responsable: <b>${D.nombreUsuario(o.responsableId) || "—"}</b></p>`}
          ${o.porque && html`<p class="tenue chico" style="margin-bottom:10px">${o.porque}</p>`}
          <${Progreso} v=${avance(o)} max=${1} c=${avance(o) >= 1 ? "verde" : ""} /><p class="nota" style="margin:4px 0 10px">${Math.round(avance(o) * 100)}% de avance</p>
          ${(o.resultados || []).map((r, i) => html`<div class="par"><span>${r.t}</span><span style="display:flex;gap:8px;align-items:center">
            ${puede ? html`<input class="entrada cifra" style="width:80px;height:34px;font-size:14px" inputmode="decimal" value=${r.actual ?? ""} onChange=${e => D.cambiar("objetivos", o.id, { resultados: o.resultados.map((x, j) => (j === i ? Object.assign({}, x, { actual: Number(e.currentTarget.value.replace(",", ".")) || 0 }) : x)) })} aria-label="Avance" />` : html`<b>${r.actual || 0}</b>`}
            <span class="tenue">de ${r.meta}${r.unidad ? " " + r.unidad : ""}</span></span></div>`)}
        </div>`)
      : html`<${Vacio} icono="target" titulo="Elige tus 3 prioridades del trimestre" texto="Ejemplos: llegar a 15 clientes con plan mensual; tener 30 reseñas en Google; bajar el tiempo de respuesta a menos de 30 minutos.">${puede && html`<${Boton} tipo="primario" onClick=${() => setEd({ periodo: tri })}>Agregar prioridad<//>`}<//>`}
    </div>
    <div><div class="panel"><h3>Tu plan en una página</h3>
      ${[["proposito", "Para qué existe AUTOCARE"], ["vision", "Cómo se ve en 3 años"], ["metaAnio", "Meta de este año"], ["cliente", "Tu cliente ideal"], ["promesa", "Tu promesa (por qué te eligen)"], ["valores", "Lo que nunca negocias"]].map(([k, n]) => html`<div style="margin-bottom:12px"><p class="nota">${n}</p><p style="white-space:pre-wrap">${P[k] || html`<span class="mas-tenue">Sin escribir</span>`}</p></div>`)}
      ${puede && html`<${Boton} icono="pencil" onClick=${() => setEditPlan(true)}>Editar plan<//>`}
    </div></div>
    ${ed && html`<${FormObjetivo} o=${ed} cerrar=${() => setEd(null)} />`}
    ${editPlan && html`<${FormPlan} cerrar=${() => setEditPlan(false)} />`}
  </div>`;
}
function FormPlan({ cerrar }) {
  const [f, set] = useFicha(Object.assign({ proposito: "", vision: "", metaAnio: "", cliente: "", promesa: "", valores: "" }, D.ajuste("plan", {})));
  return html`<${Hoja} titulo="Tu plan en una página" cerrar=${cerrar} pie=${html`<${Boton} tipo="fantasma" onClick=${cerrar}>Cancelar<//><${Boton} tipo="primario" onClick=${() => { D.fijarAjuste("plan", f); aviso("Plan guardado."); cerrar(); }}>Guardar<//>`}>
    <div class="form"><p class="nota">Basado en el plan de una página de Verne Harnish (Scaling Up). Escríbelo corto: si no cabe en una página, todavía no está claro.</p>
      <${Area} etiqueta="Para qué existe AUTOCARE" ...${b(f, set, "proposito")} placeholder="Que la gente de Arequipa tenga su auto impecable sin perder su tiempo." />
      <${Area} etiqueta="Cómo se ve en 3 años" ...${b(f, set, "vision")} placeholder="2 unidades móviles, 150 clientes con plan, marca conocida en Cayma y Yanahuara." />
      <${Entrada} etiqueta="Meta de este año" ...${b(f, set, "metaAnio")} placeholder="S/ 60,000 en ventas y 40 clientes con plan" />
      <${Area} etiqueta="Tu cliente ideal" ...${b(f, set, "cliente")} placeholder="Profesionales de 28-50 años con auto propio que valoran su tiempo." />
      <${Area} etiqueta="Tu promesa" ...${b(f, set, "promesa")} placeholder="Voy a tu casa con agua y equipos propios; si algo no queda bien, lo repaso gratis." />
      <${Area} etiqueta="Lo que nunca negocias" ...${b(f, set, "valores")} placeholder="Puntualidad, cuidado de cada auto como si fuera mío, precios claros." /></div><//>`;
}
function FormObjetivo({ o, cerrar }) {
  const [f, set] = useFicha(Object.assign({ titulo: "", porque: "", estado: "en_curso", orden: 1 }, o));
  const [rs, setRs] = useState(o.resultados && o.resultados.length ? o.resultados : [{ t: "", meta: null, actual: 0, unidad: "" }]);
  const guardar = () => {
    if (!String(f.titulo).trim()) return aviso("Escribe la prioridad.", { error: true });
    D.guardar("objetivos", Object.assign({}, f, { resultados: rs.filter(r => r.t) })); aviso("Prioridad guardada."); cerrar();
  };
  const borrar = async () => { if (await confirmar({ titulo: "Eliminar prioridad", si: "Eliminar", peligro: true })) { D.borrar("objetivos", o.id); cerrar(); } };
  return html`<${Hoja} titulo=${o.id ? "Editar prioridad" : "Nueva prioridad"} cerrar=${cerrar} pie=${html`${o.id && html`<${Boton} tipo="fantasma peligro" icono="trash-2" titulo="Eliminar" onClick=${borrar} />`}<${Boton} tipo="fantasma" onClick=${cerrar}>Cancelar<//><${Boton} tipo="primario" onClick=${guardar}>Guardar<//>`}>
    <div class="form"><${Entrada} etiqueta="Prioridad (qué quieres lograr)" ...${b(f, set, "titulo")} placeholder="Tener clientes que vuelven cada mes" />
      <${Area} etiqueta="Por qué importa" ...${b(f, set, "porque")} />
      ${D.somosVarios() && html`<${Selector} etiqueta="Responsable (una sola persona)" ayuda="Cada prioridad tiene un solo dueño que responde por ella (Wickman, Traction)." vacio="Elegir" opciones=${D.equipo().map(x => ({ v: x.id, n: x.nombre }))} ...${b(f, set, "responsableId")} />`}
      <p class="etq" style="font-size:13px;font-weight:600;color:var(--texto-2)">Resultados que lo demuestran (números, no tareas)</p>
      ${rs.map((r, i) => html`<div class="rejilla" style="--col:3"><${Entrada} etiqueta="Resultado" valor=${r.t} cambiar=${v => setRs(rs.map((x, j) => (j === i ? Object.assign({}, x, { t: v }) : x)))} placeholder="Clientes con plan" />
        <${Numero} etiqueta="Meta" valor=${r.meta} cambiar=${v => setRs(rs.map((x, j) => (j === i ? Object.assign({}, x, { meta: v }) : x)))} /><${Entrada} etiqueta="Unidad" valor=${r.unidad} cambiar=${v => setRs(rs.map((x, j) => (j === i ? Object.assign({}, x, { unidad: v }) : x)))} placeholder="clientes" /></div>`)}
      ${rs.length < 4 && html`<${Boton} chico tipo="fantasma" icono="plus" onClick=${() => setRs([...rs, { t: "", meta: null, actual: 0, unidad: "" }])}>Otro resultado<//>`}
      <${Selector} etiqueta="Estado" opciones=${Object.keys(ESTADOS.objetivos).map(k => ({ v: k, n: ESTADOS.objetivos[k].n }))} ...${b(f, set, "estado")} /></div><//>`;
}

// ---------------------------------------------------------------- revisión semanal (15 minutos, cada lunes)
function numerosSemana(lunes) {
  const fin = sumarDias(lunes, 6), en = f => f >= lunes && f <= fin;
  const ots = D.lista("ordenes").filter(o => o.estado === "entregado" && en(o.fecha));
  const leads = D.lista("leads").filter(l => en(l.fecha));
  const resp = mediana(leads.filter(l => l.contactadoEn && l.creado).map(l => (l.contactadoEn - l.creado) / 60000));
  const prim = {}; D.lista("ordenes").filter(o => o.estado === "entregado").forEach(o => { if (!prim[o.clienteId] || o.fecha < prim[o.clienteId]) prim[o.clienteId] = o.fecha; });
  return { cobros: suma(D.lista("pagos").filter(p => en(p.fecha)), "monto"), servicios: ots.length, nuevos: Object.values(prim).filter(en).length,
    consultas: leads.length, respuesta: resp, ocupacion: N.ocupacion(lunes, fin > hoy() ? hoy() : fin).pct,
    estrellas: ots.filter(o => o.calificacion).length ? suma(ots, o => n0(o.calificacion)) / ots.filter(o => o.calificacion).length : null };
}
function Revision() {
  const lunes = inicioSemana(hoy()), pasada = sumarDias(lunes, -7);
  const [sem, setSem] = useState(pasada), [abierta, setAbierta] = useState(false);
  const hechas = D.lista("revisiones").slice().sort((a, c) => String(c.fecha).localeCompare(String(a.fecha)));
  const yaHecha = hechas.find(r => r.semana === semanaISO(sem));
  const ant = hechas.find(r => r.semana === semanaISO(sumarDias(sem, -7)));
  const n = numerosSemana(sem);
  return html`<div class="columnas">
    <div>
      <div class="dia-cab"><${Boton} icono="chevron-left" titulo="Semana anterior" onClick=${() => setSem(sumarDias(sem, -7))} /><${Boton} icono="chevron-right" titulo="Semana siguiente" onClick=${() => setSem(sumarDias(sem, 7))} disabled=${sem >= lunes} />
        <h2>Semana del ${fechaCorta(sem)} al ${fechaCorta(sumarDias(sem, 6))}</h2></div>
      <${Resumen} items=${[{ n: "Cobros", v: soles(n.cobros) }, { n: "Servicios", v: n.servicios }, { n: "Clientes nuevos", v: n.nuevos },
        { n: "Respuesta a consultas", v: n.respuesta === null ? "—" : duracion(Math.round(n.respuesta)) }, { n: "Ocupación", v: n.ocupacion === null ? "—" : Math.round(n.ocupacion * 100) + "%" }]} />
      ${ant && ant.acciones && html`<div style="margin-top:16px"><${AvisoLinea} icono="rotate-ccw" c="oro"><b>La semana anterior dijiste que harías distinto:</b> ${ant.acciones}. ¿Lo hiciste?<//></div>`}
      <div style="margin-top:16px">${yaHecha ? html`<div class="panel"><h3>Tu revisión · nota ${yaHecha.nota || "—"}/10</h3>
          ${[["logros", "Qué salió bien"], ["problemas", "Qué salió mal"], ["aprendizajes", "Qué aprendí"], ["acciones", "Qué haré distinto"]].map(([k, t]) => yaHecha[k] && html`<p class="nota" style="margin-top:10px">${t}</p><p style="white-space:pre-wrap">${yaHecha[k]}</p>`)}
          <div style="margin-top:12px"><${Boton} chico icono="pencil" onClick=${() => setAbierta(yaHecha)}>Editar<//></div></div>`
        : D.puede("direccion", 2) && html`<${Boton} tipo="primario" grande icono="clipboard-check" onClick=${() => setAbierta({})}>${D.somosVarios() ? "Hacer la reunión de socios (30 min)" : "Hacer la revisión de esta semana (15 min)"}<//>`}</div>
      ${yaHecha && (yaHecha.acuerdos || []).length > 0 && html`<${Bloque} titulo="Acuerdos de la reunión"><div class="grupo">${yaHecha.acuerdos.map(a => { const t = a.tareaId && D.uno("tareas", a.tareaId);
        return html`<${Fila} icono=${t && t.hecho ? "circle-check" : "list-checks"} colorIcono=${t && t.hecho ? "verde" : "azul"} titulo=${a.t} sub=${[D.nombreUsuario(a.para) || "", a.fecha ? "para el " + fechaCorta(a.fecha) : "", t && t.hecho ? "hecho" : "pendiente"].filter(Boolean).join(" · ")} />`; })}</div><//>`}
    </div>
    <div>${D.somosVarios() && html`<div class="panel" style="margin-bottom:16px"><h3>Reunión de socios (30 min)</h3>
      <p class="tenue chico">El mismo día y hora cada semana, con el celular en silencio. Adaptada de la reunión semanal de EOS (Gino Wickman, <i>Traction</i>):</p>
      <ol class="tenue chico" style="padding-left:18px;margin-top:8px;display:grid;gap:4px">
        <li><b>Buenas noticias</b> (3 min): una personal y una del negocio, cada uno.</li>
        <li><b>Números de la semana</b> (5 min): los de la izquierda. Solo «en meta» o «fuera de meta».</li>
        <li><b>Prioridades del trimestre</b> (3 min): cada responsable dice si va «en camino» o no.</li>
        <li><b>Acuerdos de la semana pasada</b> (2 min): ¿hecho o no hecho? Sin excusas.</li>
        <li><b>Problemas</b> (15 min): elijan los 3 más importantes. Para cada uno: identificar la causa real, discutir y resolver con un acuerdo.</li>
        <li><b>Cierre</b> (2 min): repasen los acuerdos y pónganle nota a la reunión.</li></ol>
      <p class="tenue chico" style="margin-top:8px">Discutan las ideas, no a las personas: el conflicto sano es señal de confianza (Lencioni, <i>Las cinco disfunciones de un equipo</i>).</p></div>`}
      <div class="panel"><h3>Cómo hacerla</h3><p class="tenue chico">Cada lunes, 15 minutos, con un café. Mira los números, escribe con honestidad y elige <b>una sola</b> cosa que harás distinto. Es el ciclo de Deming: planear, hacer, revisar, ajustar. Lo que se revisa cada semana mejora; lo que no, se olvida.</p></div>
      <${Bloque} titulo="Revisiones anteriores">${hechas.length ? html`<div class="grupo">${hechas.slice(0, 12).map(r => html`<${Fila} icono="clipboard-check" titulo=${r.semana + " · nota " + (r.nota || "—") + "/10"} sub=${r.acciones || r.logros || ""} />`)}</div>` : html`<p class="nota">Aún no haces ninguna.</p>`}<//></div>
    ${abierta && html`<${FormRevision} r=${abierta} sem=${sem} numeros=${n} cerrar=${() => setAbierta(false)} />`}
  </div>`;
}
function FormRevision({ r, sem, numeros, cerrar }) {
  const [f, set] = useFicha(Object.assign({ nota: 7, logros: "", problemas: "", aprendizajes: "", acciones: "" }, r));
  const varios = D.somosVarios(), yo = (D.yo() || {}).id;
  const [acs, setAcs] = useState(r.acuerdos && r.acuerdos.length ? r.acuerdos : varios ? [{ t: "", para: yo, fecha: sumarDias(hoy(), 7) }] : []);
  const guardar = () => {
    // cada acuerdo se vuelve un seguimiento con responsable y fecha (EOS: «to-dos» de 7 días)
    const acuerdos = acs.filter(a => String(a.t || "").trim()).map(a => {
      const t = a.tareaId && D.uno("tareas", a.tareaId);
      const tarea = D.guardar("tareas", Object.assign({}, t || {}, { titulo: "Acuerdo: " + a.t.trim(), fecha: a.fecha || sumarDias(hoy(), 7), tipo: "acuerdo", prioridad: "alta", hecho: t ? t.hecho : false, asignadoId: a.para || yo }));
      return Object.assign({}, a, { t: a.t.trim(), tareaId: tarea.id });
    });
    D.guardar("revisiones", Object.assign({}, f, { fecha: r.fecha || hoy(), semana: semanaISO(sem), indicadores: numeros, acuerdos })); aviso(varios ? "Reunión guardada. Los acuerdos quedaron en Seguimientos." : "Revisión guardada."); cerrar();
  };
  return html`<${Hoja} titulo=${"Revisión " + semanaISO(sem)} cerrar=${cerrar} pie=${html`<${Boton} tipo="fantasma" onClick=${cerrar}>Cancelar<//><${Boton} tipo="primario" onClick=${guardar}>Guardar revisión<//>`}>
    <div class="form"><${Numero} etiqueta="¿Qué nota le pones a la semana? (1 a 10)" decimales=${0} ...${b(f, set, "nota")} />
      <${Area} etiqueta="Qué salió bien" ...${b(f, set, "logros")} /><${Area} etiqueta="Qué salió mal" ...${b(f, set, "problemas")} />
      <${Area} etiqueta="Qué aprendí" ...${b(f, set, "aprendizajes")} /><${Area} etiqueta=${varios ? "Qué haremos distinto esta semana (una sola cosa)" : "Qué haré distinto esta semana (una sola cosa)"} ...${b(f, set, "acciones")} />
      ${varios && html`<div><p class="etq" style="font-size:13px;font-weight:600;color:var(--texto-2);margin-bottom:8px">Acuerdos: qué, quién y para cuándo</p>
        ${acs.map((a, i) => html`<div class="panel" style="margin-bottom:8px"><${Entrada} etiqueta="Acuerdo" valor=${a.t} cambiar=${v => setAcs(acs.map((x, j) => (j === i ? Object.assign({}, x, { t: v }) : x)))} placeholder="Publicar 3 antes y después esta semana" />
          <div class="rejilla dos-movil" style="margin-top:8px"><${Selector} etiqueta="Responsable" opciones=${D.equipo().map(x => ({ v: x.id, n: x.nombre }))} valor=${a.para} cambiar=${v => setAcs(acs.map((x, j) => (j === i ? Object.assign({}, x, { para: v }) : x)))} />
          <${Entrada} etiqueta="Para cuándo" tipo="date" valor=${a.fecha} cambiar=${v => setAcs(acs.map((x, j) => (j === i ? Object.assign({}, x, { fecha: v }) : x)))} /></div></div>`)}
        ${acs.length < 7 && html`<${Boton} chico icono="plus" onClick=${() => setAcs([...acs, { t: "", para: yo, fecha: sumarDias(hoy(), 7) }])}>Otro acuerdo<//>`}</div>`}</div><//>`;
}

// ---------------------------------------------------------------- mejoras (kaizen)
function Mejoras() {
  const [ed, setEd] = useState(null), [ver, setVer] = useState("");
  const l = D.lista("mejoras").filter(m => !ver || m.estado === ver).sort((a, c) => String(c.fecha).localeCompare(String(a.fecha)));
  const cuenta = k => D.lista("mejoras").filter(m => m.estado === k).length;
  return html`<div class="filtros"><${Chips} valor=${ver} cambiar=${setVer} opciones=${[{ v: "", n: "Todas", fijo: true }, ...Object.keys(ESTADOS.mejoras).map(k => ({ v: k, n: ESTADOS.mejoras[k].n, cuenta: cuenta(k) }))]} />
      <${Boton} tipo="primario" icono="plus" onClick=${() => setEd({})} style="margin-left:auto">Anotar mejora<//></div>
    ${l.length ? html`<div class="grupo">${l.map(m => html`<${Fila} icono="lightbulb" colorIcono=${estadoDe("mejoras", m.estado).c} titulo=${m.idea || m.problema} sub=${[m.area, m.problema && m.idea ? "Problema: " + m.problema : "", relativa(m.fecha)].filter(Boolean).join(" · ")} der=${html`<${Insignia} c=${estadoDe("mejoras", m.estado).c}>${estadoDe("mejoras", m.estado).n}<//>`} onClick=${() => setEd(m)} />`)}</div>`
      : html`<${Vacio} icono="lightbulb" titulo="Anota cada cosa que se puede hacer mejor" texto="Un problema que se repite, una idea de un cliente, algo que te hizo perder tiempo. Prueba una solución a la vez y anota qué pasó (Imai, Kaizen)." />`}
    ${ed && html`<${FormMejora} m=${ed} cerrar=${() => setEd(null)} />`}`;
}
function FormMejora({ m, cerrar }) {
  const [f, set] = useFicha(Object.assign({ fecha: hoy(), area: "Servicio", problema: "", idea: "", estado: "idea", resultado: "" }, m));
  const guardar = () => { if (!f.problema && !f.idea) return aviso("Escribe el problema o la idea.", { error: true }); D.guardar("mejoras", f); aviso("Mejora guardada."); cerrar(); };
  return html`<${Hoja} titulo=${m.id ? "Mejora" : "Nueva mejora"} cerrar=${cerrar} pie=${html`${m.id && html`<${Boton} tipo="fantasma peligro" icono="trash-2" titulo="Eliminar" onClick=${() => { D.borrar("mejoras", m.id); cerrar(); }} />`}<${Boton} tipo="fantasma" onClick=${cerrar}>Cancelar<//><${Boton} tipo="primario" onClick=${guardar}>Guardar<//>`}>
    <div class="form"><${Selector} etiqueta="Área" opciones=${AREAS_MEJORA} ...${b(f, set, "area")} />
      <${Area} etiqueta="Problema (qué pasa)" ...${b(f, set, "problema")} placeholder="Llego tarde a la segunda cita del día" />
      <${Area} etiqueta="Idea (qué vas a probar)" ...${b(f, set, "idea")} placeholder="Dejar 45 min de traslado en vez de 30 en zonas lejanas" />
      <${Chips} valor=${f.estado} cambiar=${v => set("estado", v || f.estado)} opciones=${Object.keys(ESTADOS.mejoras).map(k => ({ v: k, n: ESTADOS.mejoras[k].n }))} />
      <${Area} etiqueta="Resultado (qué pasó al probarlo)" ...${b(f, set, "resultado")} /></div><//>`;
}

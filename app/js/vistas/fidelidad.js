// AUTOCARE · Fidelidad y planes: tarjeta de sellos, referidos, planes mensuales y membresías
// Suscripciones (Warrillow, The Automatic Customer): ingresos que llegan solos cada mes.
import { html, useState } from "../../vendor/preact-htm.js";
import * as D from "../datos.js";
import * as N from "../negocio.js";
import { ir, usarTitulo } from "../app.js";
import { Boton, Hoja, Entrada, Numero, Dinero, Area, Selector, Interruptor, Pestanas, Insignia, Vacio, Fila, Bloque, Resumen, Sellos, AvisoLinea, aviso, confirmar, useFicha, b } from "../ui.js";
import { ElegirCliente, enviarWa } from "../piezas.js";
import { hoy, sumarDias, fechaCorta, relativa, soles, suma, n0, nombreDe } from "../util.js";
import { METODOS, estadoDe, TIPOS_PREMIO, RULETA_BASE } from "../esquema.js";
import { ruletaSvg } from "../../../assets/ruleta.js";

export default function Fidelidad({ ruta }) {
  D.useDatos();
  usarTitulo("Fidelidad y planes");
  const t = ruta.partes[0] || "sellos";
  return html`<header class="pagina-cab"><div><h1>Fidelidad y planes</h1><p>Que vuelvan solos: sellos con regalo, recomendaciones y planes mensuales.</p></div></header>
    <${Pestanas} valor=${t} cambiar=${v => ir("fidelidad/" + v, true)} opciones=${[{ v: "sellos", n: "Sellos y referidos" }, { v: "ruleta", n: "Ruleta" }, { v: "planes", n: "Planes" }, { v: "membresias", n: "Membresías", cuenta: D.lista("membresias").filter(m => m.estado === "activa").length }]} />
    ${t === "sellos" && html`<${SellosVista} />`}${t === "ruleta" && html`<${Ruleta} />`}${t === "planes" && html`<${Planes} />`}${t === "membresias" && html`<${Membresias} />`}`;
}

function SellosVista() {
  const F = N.reglasFidelidad(), cls = D.lista("clientes");
  const con = cls.map(c => Object.assign({ c }, N.fidelidad(c))).filter(x => x.sellos > 0).sort((a, c) => c.sellos - a.sellos);
  const listos = con.filter(x => x.disponibles), cerca = con.filter(x => !x.disponibles && x.cada - x.sellos <= 2);
  const refs = cls.map(c => ({ c, n: cls.filter(x => x.referidoPor === c.id).length })).filter(x => x.n).sort((a, c) => c.n - a.n);
  return html`<${Resumen} items=${[{ n: "Clientes con sellos", v: con.length }, { n: "Premios por canjear", v: listos.length, c: listos.length ? "oro" : "" }, { n: "A 1 o 2 sellos del premio", v: cerca.length }, { n: "Clientes que recomiendan", v: refs.length }]} />
    <div class="columnas" style="margin-top:20px"><div>
      <${Bloque} titulo="Cómo funciona tu tarjeta"><div class="panel">
        <${Sellos} actuales=${F.regalo} cada=${F.cada} />
        <p style="margin-top:12px">Tarjeta de <b>${F.cada} sellos</b>. Con el primer servicio, el cliente recibe <b>${F.regalo} sellos de regalo</b>; desde ahí, un sello por servicio. Premio: <b>${F.premio}</b>.</p>
        <p class="nota" style="margin-top:8px">Por qué el regalo: en un car wash, 34% completó una tarjeta que ya traía 2 sellos frente a 19% sin regalo (Nunes y Drèze, 2006). Por cada amigo que traiga, suma ${F.bono} sello.</p>
        <div style="margin-top:10px"><${Boton} chico icono="settings" href="#/config/negocio">Cambiar reglas<//></div></div><//>
      ${cerca.length > 0 && html`<${Bloque} titulo="Están a punto del premio" sub="Avísales: la meta cercana motiva a volver (efecto de gradiente de meta, Kivetz)">
        <div class="grupo">${cerca.map(x => html`<${Fila} avatar=${nombreDe(x.c)} titulo=${nombreDe(x.c)} sub=${`${x.sellos} de ${x.cada} sellos`} href=${"#/clientes/" + x.c.id}
          der=${html`<${Boton} chico icono="message-circle" onClick=${e => { e.preventDefault(); enviarWa(x.c.tel, `Hola ${x.c.nombre}, ¡te falta${x.cada - x.sellos === 1 ? " solo 1 sello" : "n solo " + (x.cada - x.sellos) + " sellos"} para tu regalo en ${N.nombreNegocio()}! Tu regalo: ${N.premioCorto(F.premio)}. ¿Te separo una hora esta semana?`); }}>Avisar<//>`} />`)}</div><//>`}
    </div><div>
      ${listos.length > 0 && html`<${Bloque} titulo="Tienen premio para canjear"><div class="grupo">${listos.map(x => html`<${Fila} icono="gift" colorIcono="oro" titulo=${nombreDe(x.c)} sub=${x.premio} href=${"#/clientes/" + x.c.id} flecha />`)}</div><//>`}
      <${Bloque} titulo="Los que más te recomiendan" sub="Agradéceles: la reciprocidad trae más recomendaciones (Cialdini)">
        ${refs.length ? html`<div class="grupo">${refs.slice(0, 10).map(x => html`<${Fila} avatar=${nombreDe(x.c)} titulo=${nombreDe(x.c)} sub=${"Código " + (x.c.codigo || "—")} der=${html`<b class="cifra">${x.n}</b>`} href=${"#/clientes/" + x.c.id} />`)}</div>`
          : html`<p class="nota">Aún nadie se registra con un código. Cada cliente tiene su código en su enlace personal; invítalos desde Campañas → Campeones.</p>`}<//>
    </div></div>`;
}

function Planes() {
  const [ed, setEd] = useState(null);
  const l = D.lista("planes");
  return html`<${AvisoLinea} c="oro" icono="repeat">Un plan mensual convierte clientes ocasionales en ingresos fijos. Ofrécelo a quien lava 2 o más veces al mes (Clientes → Frecuentes) y en la web.<//>
    <div class="filtros" style="margin-top:14px"><span style="flex:1"></span><${Boton} tipo="primario" icono="plus" onClick=${() => setEd({})}>Nuevo plan<//></div>
    ${l.length ? html`<div class="grupo">${l.map(p => html`<${Fila} icono="crown" colorIcono=${p.activo !== false ? "oro" : ""} titulo=${p.nombre} sub=${p.incluye} multi der=${html`<b class="cifra">${soles(p.precio)}</b>${p.activo === false ? html`<${Insignia}>Pausado<//>` : null}`} onClick=${() => setEd(p)} />`)}</div>`
      : html`<${Vacio} icono="crown" titulo="Aún no tienes planes" texto="Ejemplo: Club AUTOCARE, 2 Brillo Total al mes por S/139." />`}
    ${ed && html`<${FormPlan} p=${ed} cerrar=${() => setEd(null)} />`}`;
}
function FormPlan({ p, cerrar }) {
  const [f, set] = useFicha(Object.assign({ nombre: "", tipo: "mensual", precio: null, incluye: "", vigencia: 30, activo: true, web: true, destacado: false }, p));
  const guardar = () => { if (!f.nombre || !n0(f.precio)) return aviso("Escribe el nombre y el precio.", { error: true }); D.guardar("planes", f); aviso("Plan guardado."); cerrar(); };
  return html`<${Hoja} titulo=${p.id ? "Editar plan" : "Nuevo plan"} cerrar=${cerrar} pie=${html`${p.id && html`<${Boton} tipo="fantasma peligro" icono="trash-2" titulo="Eliminar" onClick=${async () => { if (await confirmar({ titulo: "Eliminar plan", si: "Eliminar", peligro: true })) { D.borrar("planes", p.id); cerrar(); } }} />`}<${Boton} tipo="fantasma" onClick=${cerrar}>Cancelar<//><${Boton} tipo="primario" onClick=${guardar}>Guardar<//>`}>
    <div class="form"><${Entrada} etiqueta="Nombre" ...${b(f, set, "nombre")} placeholder="Club AUTOCARE" />
      <div class="rejilla"><${Dinero} etiqueta="Precio" ...${b(f, set, "precio")} /><${Numero} etiqueta="Dura (días)" decimales=${0} ...${b(f, set, "vigencia")} /></div>
      <${Area} etiqueta="Qué incluye (lo que gana el cliente)" ...${b(f, set, "incluye")} placeholder="2 Brillo Total al mes en tu día fijo · prioridad de horario · 10% en adicionales" />
      <${Interruptor} etiqueta="Mostrar en la web" ...${b(f, set, "web")} /><${Interruptor} etiqueta="Destacado" ...${b(f, set, "destacado")} /><${Interruptor} etiqueta="Activo" ...${b(f, set, "activo")} /></div><//>`;
}

function Membresias() {
  const [nueva, setNueva] = useState(false);
  const H = hoy(), l = D.lista("membresias").slice().sort((a, c) => String(a.fin || "").localeCompare(String(c.fin || "")));
  const activas = l.filter(m => m.estado === "activa");
  const mrr = suma(activas, m => n0((D.uno("planes", m.planId) || {}).precio));
  const renovar = m => {
    const p = D.uno("planes", m.planId), ini = m.fin && m.fin >= H ? m.fin : H;
    D.cambiar("membresias", m.id, { inicio: ini, fin: sumarDias(ini, n0(p && p.vigencia) || 30), estado: "activa" });
    if (p && D.puedeEditar("pagos")) D.guardar("pagos", { fecha: H, _cliente: m._cliente, concepto: "Plan " + p.nombre, monto: n0(p.precio), metodo: "yape", clienteId: m.clienteId, membresiaId: m.id });
    aviso("Renovado y cobro registrado.");
  };
  return html`<${Resumen} items=${[{ n: "Membresías activas", v: activas.length }, { n: "Ingreso mensual asegurado", v: soles(mrr), c: "oro" }, { n: "Vencen en 7 días", v: activas.filter(m => m.fin && m.fin <= sumarDias(H, 7)).length }]} />
    <div class="filtros" style="margin-top:16px"><span style="flex:1"></span><${Boton} tipo="primario" icono="plus" onClick=${() => setNueva(true)}>Inscribir cliente<//></div>
    ${l.length ? html`<div class="grupo">${l.map(m => { const e = m.estado === "activa" && m.fin && m.fin < H ? estadoDe("membresias", "vencida") : estadoDe("membresias", m.estado); return html`<${Fila} icono="crown" colorIcono=${e.c} titulo=${m._cliente + " · " + m._plan} sub=${"Hasta " + fechaCorta(m.fin) + " (" + relativa(m.fin) + ")"}
      der=${html`<${Insignia} c=${e.c}>${e.n}<//><${Boton} chico onClick=${() => renovar(m)}>Renovar<//>`} />`; })}</div>`
      : html`<${Vacio} icono="crown" titulo="Aún no hay membresías" texto="Cuando un cliente compre un plan, inscríbelo aquí: verás cuánto tienes asegurado cada mes." />`}
    ${nueva && html`<${FormMembresia} cerrar=${() => setNueva(false)} />`}`;
}
function FormMembresia({ cerrar }) {
  const planes = D.lista("planes").filter(p => p.activo !== false);
  const [f, set] = useFicha({ clienteId: "", planId: (planes[0] || {}).id || "", inicio: hoy(), cobrar: true, metodo: "yape" });
  const guardar = () => {
    const c = D.uno("clientes", f.clienteId), p = D.uno("planes", f.planId);
    if (!c || !p) return aviso("Elige el cliente y el plan.", { error: true });
    const m = D.guardar("membresias", { clienteId: c.id, planId: p.id, _cliente: nombreDe(c), _plan: p.nombre, inicio: f.inicio, fin: sumarDias(f.inicio, n0(p.vigencia) || 30), estado: "activa" });
    if (f.cobrar && D.puedeEditar("pagos")) D.guardar("pagos", { fecha: f.inicio, _cliente: nombreDe(c), concepto: "Plan " + p.nombre, monto: n0(p.precio), metodo: f.metodo, clienteId: c.id, membresiaId: m.id });
    aviso("Cliente inscrito en " + p.nombre + "."); cerrar();
  };
  return html`<${Hoja} titulo="Inscribir en un plan" cerrar=${cerrar} pie=${html`<${Boton} tipo="fantasma" onClick=${cerrar}>Cancelar<//><${Boton} tipo="primario" onClick=${guardar}>Inscribir<//>`}>
    <div class="form"><${ElegirCliente} valor=${f.clienteId} cambiar=${id => set("clienteId", id)} />
      <${Selector} etiqueta="Plan" opciones=${planes.map(p => ({ v: p.id, n: p.nombre + " · " + soles(p.precio) }))} ...${b(f, set, "planId")} />
      <${Entrada} etiqueta="Empieza" tipo="date" ...${b(f, set, "inicio")} />
      <${Interruptor} etiqueta="Registrar el cobro ahora" ...${b(f, set, "cobrar")} />
      ${f.cobrar && html`<${Selector} etiqueta="Método" opciones=${Object.keys(METODOS).map(k => ({ v: k, n: METODOS[k] }))} ...${b(f, set, "metodo")} />`}</div><//>`;
}

// ---------------------------------------------------------------- ruleta de premios
// Cómo no perder plata (y que sí traiga clientes de vuelta):
// · Premios para la PRÓXIMA visita y con vencimiento: es un motivo para volver, no un descuento de hoy.
// · Casi todos cuestan poco y valen mucho para el cliente; el grande es poco probable y tiene tope por mes
//   (Kahneman y Tversky: sobrevaloramos las probabilidades chicas: emociona igual).
// · Siempre gana algo: nadie se va con la sensación de perder (aversión a la pérdida).
// · Hermann Simon (Confessions of the Pricing Man): mejor regalar valor que bajar el precio.
// · Bases y probabilidades a la vista (Indecopi) y nunca a cambio de una reseña (Google).
function Ruleta() {
  const R0 = N.ruleta();
  const [R, setR] = useState(R0), [cambio, setCambio] = useState(false);
  const poner = (k, v) => { setR(Object.assign({}, R, { [k]: v })); setCambio(true); };
  const premio = (i, k, v) => { setR(Object.assign({}, R, { premios: R.premios.map((p, j) => (j === i ? Object.assign({}, p, { [k]: v }) : p)) })); setCambio(true); };
  const quitar = i => { setR(Object.assign({}, R, { premios: R.premios.filter((p, j) => j !== i) })); setCambio(true); };
  const agregar = () => { setR(Object.assign({}, R, { premios: [...R.premios, { id: "p" + Date.now().toString(36).slice(-5), n: "Nuevo premio", corto: "Premio", tipo: "regalo", valor: 0, peso: 5, costo: 0 }] })); setCambio(true); };
  const guardar = () => {
    if (!N.premiosActivos(R).length) return aviso("Deja al menos un premio activo.", { error: true });
    D.fijarAjuste("ruleta", R); setCambio(false); aviso(R.activo ? "Ruleta guardada y activa." : "Ruleta guardada (apagada).");
  };
  const num = N.numerosRuleta(R), act = N.premiosActivos(R);
  const mes = hoy().slice(0, 7), ots = D.lista("ordenes").filter(o => o.ruleta);
  const delMes = ots.filter(o => String(o.ruleta.fecha || "").slice(0, 7) === mes), pend = ots.filter(o => o.ruleta.estado === "pendiente" && o.ruleta.vence >= hoy());
  const usados = ots.filter(o => o.ruleta.estado === "canjeado"), volvieron = usados.length;
  const costoMes = delMes.reduce((a, o) => a + n0(o.ruleta.costo), 0);
  const alto = num.pct > 6;
  return html`<${Resumen} items=${[{ n: "Giros este mes", v: delMes.length }, { n: "Premios por usar", v: pend.length }, { n: "Volvieron a usarlo", v: volvieron, d: ots.length ? Math.round((volvieron / ots.length) * 100) + "% de los que ganaron" : "" }, { n: "Costo del mes", v: soles(costoMes) }]} />
    <div class="columnas" style="margin-top:20px">
      <div>
        <${Bloque} titulo="Cómo funciona"><div class="panel form">
          <${Interruptor} etiqueta="Ruleta activa" valor=${!!R.activo} cambiar=${v => poner("activo", v)} ayuda="Al activarla, cada cliente ve su giro en su enlace después de que entregas su auto. Puedes apagarla cuando quieras." />
          <div class="rejilla" style="--col:3"><${Dinero} etiqueta="Servicio mínimo para girar" decimales=${0} valor=${R.minimo} cambiar=${v => poner("minimo", v || 0)} />
            <${Numero} etiqueta="Días para girar" decimales=${0} sufijo="días" valor=${R.dias} cambiar=${v => poner("dias", v || 7)} />
            <${Numero} etiqueta="Días para usar el premio" decimales=${0} sufijo="días" valor=${R.vence} cambiar=${v => poner("vence", v || 45)} /></div>
          <p class="nota">Un giro por servicio pagado (no planes ni premios). El premio se usa en su próxima visita, uno por visita, y vence. Siempre gana algo.</p>
        <//></div>
        <${Bloque} titulo="Premios" sub="La probabilidad sale del peso de cada uno. El costo es lo que a ti te cuesta (producto y tiempo), no el precio."
          der=${html`<${Boton} chico icono="plus" onClick=${agregar}>Premio<//>`}>
          <div class="grupo">${R.premios.map((p, i) => html`<div class="fila" style="flex-direction:column;align-items:stretch;gap:10px">
            <div class="rejilla"><${Entrada} etiqueta="Premio (como lo lee el cliente)" valor=${p.n} cambiar=${v => premio(i, "n", v)} /><${Entrada} etiqueta="En la ruleta (corto)" valor=${p.corto} cambiar=${v => premio(i, "corto", v.slice(0, 12))} maxlength="12" /></div>
            <div class="rejilla" style="--col:4"><${Selector} etiqueta="Tipo" valor=${p.tipo} cambiar=${v => premio(i, "tipo", v)} opciones=${Object.keys(TIPOS_PREMIO).map(k => ({ v: k, n: TIPOS_PREMIO[k] }))} />
              <${Numero} etiqueta="Peso" decimales=${0} valor=${p.peso} cambiar=${v => premio(i, "peso", v || 0)} sufijo=${(num.prob[p.id] || 0) + "%"} />
              <${Dinero} etiqueta="Te cuesta" valor=${p.costo} cambiar=${v => premio(i, "costo", v || 0)} />
              <${Numero} etiqueta="Tope al mes" decimales=${0} valor=${p.max || null} cambiar=${v => premio(i, "max", v || 0)} placeholder="Sin tope" /></div>
            ${["descuento", "adicional", "servicio"].includes(p.tipo) && html`<${Dinero} etiqueta=${p.tipo === "descuento" ? "Descuento" : "Precio normal (para mostrar el ahorro)"} valor=${p.valor} cambiar=${v => premio(i, "valor", v || 0)} />`}
            <div class="btns"><${Interruptor} etiqueta="Activo" valor=${p.activo !== false} cambiar=${v => premio(i, "activo", v)} /><${Boton} chico tipo="fantasma" icono="trash-2" onClick=${() => quitar(i)}>Quitar<//></div>
          </div>`)}</div><//>
        <div class="btns" style="margin-top:6px"><${Boton} tipo="primario" grande icono="check" onClick=${guardar} disabled=${!cambio}>Guardar ruleta<//>
          <${Boton} tipo="fantasma" icono="rotate-ccw" onClick=${async () => { if (await confirmar({ titulo: "Premios sugeridos", texto: "Se reemplazan tus premios por los sugeridos. Luego toca Guardar.", si: "Usar sugeridos" })) { setR(Object.assign({}, R, { premios: RULETA_BASE.premios.map(p => Object.assign({}, p)) })); setCambio(true); } }}>Premios sugeridos<//></div>
      </div>
      <div>
        <div class="panel" style="text-align:center"><div class="ruleta-vista" dangerouslySetInnerHTML=${{ __html: ruletaSvg(act.map(p => ({ id: p.id, corto: p.corto, prob: num.prob[p.id] })), { marca: "../assets/marca-chica-clara.svg" }) }}></div>
          <p class="nota" style="margin-top:8px">Así la ve el cliente. Cada tajada mide lo que vale su probabilidad.</p></div>
        <${Bloque} titulo="¿Te conviene?"><div class="panel">
          <p style="font-size:17px">Cada giro te cuesta en promedio <b style="color:var(--oro-texto)">${soles(num.costo)}</b>, el <b>${num.pct.toFixed(1)}%</b> de tu ticket promedio (${soles(num.ticket)}).</p>
          <p class="nota" style="margin-top:8px">Y solo lo pagas si el cliente vuelve: si vuelve, ganas un servicio completo. ${alto ? "Está alto: baja el peso de los premios caros, ponles tope o sube el servicio mínimo para girar. Lo sano es menos de 5 a 6%." : "Está en un rango sano (menos de 5 a 6%)."}</p>
        </div><//>
        <${Bloque} titulo="Bases (las ve el cliente)"><div class="panel"><p class="nota" style="white-space:pre-line">${basesRuleta(R, num)}</p></div><//>
      </div>
    </div>`;
}
export function basesRuleta(R, num = N.numerosRuleta(R)) {
  const act = N.premiosActivos(R);
  return `Organiza: ${N.nombreNegocio()}. Participa quien recibe un servicio pagado de ${soles(R.minimo)} o más (no aplica a planes ni premios). Un giro por servicio, desde su enlace personal, hasta ${R.dias} días después de la entrega.\n` +
    `Premios y probabilidad: ${act.map(p => `${p.n} (${num.prob[p.id] || 0}%${n0(p.max) ? `, máximo ${p.max} al mes` : ""})`).join("; ")}. Si un premio con tope se agota en el mes, ese giro se reparte entre los demás.\n` +
    `Los premios se usan en la siguiente visita, uno por visita, dentro de ${R.vence} días; son personales, no se cambian por dinero ni se acumulan con otras promociones. Los sellos se suman solos a la tarjeta.`;
}
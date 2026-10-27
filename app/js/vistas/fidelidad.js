// AUTOCARE · Fidelidad y planes: tarjeta de sellos, referidos, planes mensuales y membresías
// Suscripciones (Warrillow, The Automatic Customer): ingresos que llegan solos cada mes.
import { html, useState } from "../../vendor/preact-htm.js";
import * as D from "../datos.js";
import * as N from "../negocio.js";
import { ir, usarTitulo } from "../app.js";
import { Boton, Hoja, Entrada, Numero, Dinero, Area, Selector, Interruptor, Pestanas, Insignia, Vacio, Fila, Bloque, Resumen, Sellos, AvisoLinea, aviso, confirmar, useFicha, b } from "../ui.js";
import { ElegirCliente, enviarWa } from "../piezas.js";
import { hoy, sumarDias, fechaCorta, relativa, soles, suma, n0, nombreDe } from "../util.js";
import { METODOS, estadoDe } from "../esquema.js";

export default function Fidelidad({ ruta }) {
  D.useDatos();
  usarTitulo("Fidelidad y planes");
  const t = ruta.partes[0] || "sellos";
  return html`<header class="pagina-cab"><div><h1>Fidelidad y planes</h1><p>Que vuelvan solos: sellos con regalo, recomendaciones y planes mensuales.</p></div></header>
    <${Pestanas} valor=${t} cambiar=${v => ir("fidelidad/" + v, true)} opciones=${[{ v: "sellos", n: "Sellos y referidos" }, { v: "planes", n: "Planes" }, { v: "membresias", n: "Membresías", cuenta: D.lista("membresias").filter(m => m.estado === "activa").length }]} />
    ${t === "sellos" && html`<${SellosVista} />`}${t === "planes" && html`<${Planes} />`}${t === "membresias" && html`<${Membresias} />`}`;
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
          der=${html`<${Boton} chico icono="message-circle" onClick=${e => { e.preventDefault(); enviarWa(x.c.tel, `Hola ${x.c.nombre}, ¡te falta${x.cada - x.sellos === 1 ? " solo 1 sello" : "n solo " + (x.cada - x.sellos) + " sellos"} para tu regalo en ${N.nombreNegocio()}! ${F.premio}. ¿Te separo una hora esta semana?`); }}>Avisar<//>`} />`)}</div><//>`}
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

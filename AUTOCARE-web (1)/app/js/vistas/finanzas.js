// AUTOCARE · Finanzas: resumen del mes, caja, por cobrar, movimientos, reparto (Profit First) y rentabilidad
import { html, useState } from "../../vendor/preact-htm.js";
import * as D from "../datos.js";
import * as N from "../negocio.js";
import { ir, usarTitulo } from "../app.js";
import { menu } from "../ui.js";
import { Boton, Hoja, Entrada, Numero, Dinero, Area, Selector, Chips, Pestanas, Insignia, Vacio, Fila, Bloque, Resumen, Barras, BarrasH, Tabla, Par, AvisoLinea, Progreso, aviso, confirmar, useFicha, b } from "../ui.js";
import { ElegirCliente } from "../piezas.js";
import { hoy, sumarDias, sumarMeses, mesDe, mesLargo, inicioMes, finMes, fechaCorta, fechaLarga, relativa, soles, pct, duracion, suma, nombreDe, n0, MESES_CORTOS, num } from "../util.js";
import { METODOS, CATEGORIAS_GASTO } from "../esquema.js";

export default function Finanzas({ ruta }) {
  D.useDatos();
  usarTitulo("Finanzas");
  const t = ruta.partes[0] || "resumen";
  const [cobro, setCobro] = useState(false), [gasto, setGasto] = useState(false);
  const pend = N.porCobrar().length, ver = N.pagosPorVerificar().length;
  return html`<header class="pagina-cab"><div><h1>Finanzas</h1><p>Lo que entra, lo que sale y cuánto te queda por cada hora de trabajo.</p></div>
      <div class="acciones"><${Boton} icono="receipt" onClick=${() => setGasto(true)}>Gasto<//><${Boton} tipo="primario" icono="banknote" onClick=${() => setCobro(true)}>Cobro<//></div></header>
    <${Pestanas} valor=${t} cambiar=${v => ir("finanzas/" + v, true)} opciones=${[{ v: "resumen", n: "Resumen" }, { v: "caja", n: "Caja del día" }, (ver || D.somosVarios()) && { v: "verificar", n: "Por verificar", cuenta: ver }, { v: "cobrar", n: "Por cobrar", cuenta: pend },
      { v: "movimientos", n: "Movimientos" }, { v: "reparto", n: "Reparto" }, { v: "rentabilidad", n: "Rentabilidad" }].filter(Boolean)} />
    ${t === "resumen" && html`<${ResumenMes} />`}${t === "caja" && html`<${Caja} />`}${t === "verificar" && html`<${PorVerificar} />`}${t === "cobrar" && html`<${PorCobrar} />`}
    ${t === "movimientos" && html`<${Movimientos} />`}${t === "reparto" && html`<${Reparto} />`}${t === "rentabilidad" && html`<${Rentabilidad} />`}
    ${cobro && html`<${FormCobro} cerrar=${() => setCobro(false)} />`}${gasto && html`<${FormGasto} cerrar=${() => setGasto(false)} />`}`;
}
function SelMes({ mes, setMes }) {
  return html`<div class="dia-cab"><${Boton} icono="chevron-left" titulo="Mes anterior" onClick=${() => setMes(mesDe(sumarMeses(mes + "-01", -1)))} />
    <${Boton} onClick=${() => setMes(mesDe(hoy()))}>Este mes<//><${Boton} icono="chevron-right" titulo="Mes siguiente" onClick=${() => setMes(mesDe(sumarMeses(mes + "-01", 1)))} />
    <h2>${mesLargo(mes).replace(/^./, x => x.toUpperCase())}</h2></div>`;
}

// ---------------------------------------------------------------- resumen del mes (estado de resultados simple)
function ResumenMes() {
  const [mes, setMes] = useState(mesDe(hoy()));
  const r = N.resultadosMes(mes), ant = N.resultadosMes(mesDe(sumarMeses(mes + "-01", -1)));
  const meses = Array.from({ length: 6 }, (_, i) => mesDe(sumarMeses(mes + "-01", i - 5)));
  const cats = Object.keys(r.porCat).map(k => ({ n: CATEGORIAS_GASTO[k] || k, v: r.porCat[k] })).sort((a, c) => c.v - a.v);
  return html`<${SelMes} mes=${mes} setMes=${setMes} />
    <${Resumen} items=${[{ n: "Cobraste", v: soles(r.ingresos), d: ant.ingresos ? "mes anterior " + soles(ant.ingresos) : "" }, { n: "Gastaste", v: soles(r.egresos) },
      { n: "Te quedó", v: soles(r.utilidad), c: r.utilidad >= 0 ? "verde" : "rojo", d: r.margen !== null ? "margen " + pct(r.margen) : "" },
      { n: "Ganancia por hora", v: r.porHora ? soles(Math.round(r.porHora)) : "—", d: r.horas ? num(r.horas, 1) + " h trabajadas" : "", c: "oro" }]} />
    <div class="columnas" style="margin-top:22px">
      <div><${Bloque} titulo="Cobros de los últimos 6 meses"><div class="panel"><${Barras} datos=${meses.map(m => ({ n: MESES_CORTOS[Number(m.slice(5)) - 1], v: Math.round(N.resultadosMes(m).ingresos), actual: m === mes }))} formato=${v => "S/" + num(v)} meta=${n0((D.ajuste("metasKpi", {}) || {}).ingresos) || undefined} /></div><//>
        <${Bloque} titulo="Estado de resultados"><div class="panel">
          <${Par} n=${"Servicios entregados (" + r.servicios + ")"} v=${soles(r.ventasServ)} /><${Par} n="Cobros del mes" v=${soles(r.ingresos)} />
          <${Par} n="Gastos variables" v=${"−" + soles(r.variables)} /><${Par} n="Gastos fijos" v=${"−" + soles(r.fijos)} />
          <${Par} total n="Resultado del mes" v=${soles(r.utilidad)} />
          <${Par} n="Insumos usados en los servicios" v=${soles(r.insumosUsados)} /><${Par} n="Ticket promedio" v=${soles(Math.round(r.ticket))} />
          <p class="nota" style="margin-top:8px">Ganancia por hora = (servicios − insumos usados) ÷ horas trabajadas con traslado. Tu tiempo es tu recurso más escaso (Goldratt, La Meta).</p></div><//></div>
      <div><${Bloque} titulo="En qué se fue el dinero">${cats.length ? html`<div class="panel"><${BarrasH} datos=${cats} formato=${v => soles(Math.round(v))} /></div>` : html`<p class="nota">Sin gastos este mes.</p>`}<//>
        <${Bloque} titulo="Cómo te pagan"><div class="panel"><${BarrasH} datos=${Object.keys(r.porMetodo).map(k => ({ n: METODOS[k] || k, v: r.porMetodo[k] }))} formato=${v => soles(Math.round(v))} /></div><//></div>
    </div>`;
}

// ---------------------------------------------------------------- cobros por verificar
// Separación de funciones (control interno, COSO): quien cobra en el campo no es quien confirma que el dinero llegó.
// No es desconfianza: protege a los dos socios y evita discusiones por plata.
function PorVerificar() {
  const l = N.pagosPorVerificar(), puede = D.puedeEditar("pagos");
  const opciones = p => menu(soles(p.monto) + " · " + (p._cliente || p.concepto || "Cobro"), [
    { n: p.metodo === "efectivo" ? "Me entregó el efectivo" : "Llegó a la cuenta", icono: "check", f: () => { N.verificarPago(p); aviso("Cobro verificado."); } },
    { n: "No aparece en la cuenta", icono: "triangle-alert", peligro: true, f: () => { N.verificarPago(p, false); aviso("Marcado. Coordínalo con " + (p.cobradoPor || "quien cobró") + "."); } },
    p.ordenId && { n: "Ver la orden", icono: "clipboard-list", f: () => ir("ordenes/" + p.ordenId) }]);
  return html`<${AvisoLinea} c="oro" icono="shield-check">Quien cobra en el servicio no es quien confirma que el dinero llegó. Revisa tu Yape o tu cuenta y marca cada cobro: así los dos socios están tranquilos y nada se pierde.<//>
    ${l.length ? html`<div style="margin:16px 0 8px"><${Resumen} items=${[{ n: "Por verificar", v: soles(suma(l, "monto")), c: "oro" }, { n: "Cobros", v: l.length }, { n: "Con problema", v: l.filter(p => p.problema).length, c: l.some(p => p.problema) ? "rojo" : "" }]} /></div>
      <div class="grupo">${l.map(p => html`<${Fila} icono=${p.metodo === "efectivo" ? "banknote" : "wallet"} colorIcono=${p.problema ? "rojo" : "ambar"} titulo=${soles(p.monto) + " · " + (p._cliente || p.concepto || "Cobro")}
        sub=${[METODOS[p.metodo] || p.metodo, p.referencia ? "Op. " + p.referencia : "", "cobró " + (p.cobradoPor || p.por || "—"), fechaCorta(p.fecha), p.problema ? "⚠ " + p.problema : ""].filter(Boolean).join(" · ")}
        der=${puede && html`<${Boton} chico tipo="primario" icono="check" onClick=${e => { e.stopPropagation(); N.verificarPago(p); aviso("Cobro verificado."); }}>${p.metodo === "efectivo" ? "Recibido" : "Llegó"}<//>`}
        onClick=${() => puede && opciones(p)} />`)}</div>`
    : html`<div style="margin-top:16px"><${Vacio} icono="shield-check" titulo="Todo verificado" texto="Cuando alguien registre un cobro en el servicio, aparece aquí para que confirmes que llegó." /></div>`}`;
}

// ---------------------------------------------------------------- caja del día y cierre
function Caja() {
  const [f, setF] = useState(hoy()), [cierre, setCierre] = useState(false), [edC, setEdC] = useState(null), [edG, setEdG] = useState(null);
  const pagos = D.lista("pagos").filter(p => p.fecha === f), gastos = D.lista("gastos").filter(g => g.fecha === f);
  const efe = suma(pagos.filter(p => (p.metodo || "efectivo") === "efectivo"), "monto") - suma(gastos.filter(g => (g.metodo || "efectivo") === "efectivo"), "monto");
  const hecho = D.lista("cierres").find(c => c.fecha === f);
  return html`<div class="dia-cab"><${Boton} icono="chevron-left" onClick=${() => setF(sumarDias(f, -1))} titulo="Día anterior" /><${Boton} onClick=${() => setF(hoy())}>Hoy<//><${Boton} icono="chevron-right" onClick=${() => setF(sumarDias(f, 1))} titulo="Día siguiente" /><h2>${fechaLarga(f)}</h2></div>
    <${Resumen} items=${[{ n: "Entró", v: soles(suma(pagos, "monto")) }, { n: "Salió", v: soles(suma(gastos, "monto")) }, { n: "Efectivo que debes tener", v: soles(efe), c: "oro" },
      { n: "Cierre", v: hecho ? (hecho.diferencia ? "Diferencia " + soles(hecho.diferencia) : "Cuadró") : "Pendiente", c: hecho ? (hecho.diferencia ? "rojo" : "verde") : "" }]} />
    <div class="columnas mitad" style="margin-top:22px">
      <${Bloque} titulo="Cobros">${pagos.length ? html`<div class="grupo">${pagos.map(p => html`<${Fila} icono="banknote" colorIcono="verde" titulo=${p._cliente || p.concepto || "Cobro"} sub=${(METODOS[p.metodo] || "") + (p.concepto ? " · " + p.concepto : "")} der=${html`<b class="cifra">${soles(p.monto)}</b>`} onClick=${() => setEdC(p)} />`)}</div>` : html`<p class="nota">Sin cobros este día.</p>`}<//>
      <${Bloque} titulo="Gastos">${gastos.length ? html`<div class="grupo">${gastos.map(g => html`<${Fila} icono="receipt" colorIcono="rojo" titulo=${g.descripcion || CATEGORIAS_GASTO[g.categoria] || "Gasto"} sub=${(CATEGORIAS_GASTO[g.categoria] || "") + " · " + (METODOS[g.metodo] || "")} der=${html`<b class="cifra">${soles(g.monto)}</b>`} onClick=${() => setEdG(g)} />`)}</div>` : html`<p class="nota">Sin gastos este día.</p>`}<//>
    </div>
    ${!hecho && html`<${Boton} tipo="primario" icono="calculator" onClick=${() => setCierre(true)}>Cerrar caja del día<//>`}
    ${cierre && html`<${FormCierre} fecha=${f} esperado=${efe} pagos=${pagos} gastos=${gastos} cerrar=${() => setCierre(false)} />`}
    ${edC && html`<${FormCobro} inicial=${edC} cerrar=${() => setEdC(null)} />`}${edG && html`<${FormGasto} inicial=${edG} cerrar=${() => setEdG(null)} />`}`;
}
function FormCierre({ fecha, esperado, pagos, gastos, cerrar }) {
  const [contado, setContado] = useState(null), [nota, setNota] = useState("");
  const guardar = () => {
    const detalle = {}; pagos.forEach(p => (detalle[p.metodo || "efectivo"] = (detalle[p.metodo || "efectivo"] || 0) + n0(p.monto)));
    D.guardar("cierres", { fecha, esperado, contado: n0(contado), diferencia: Math.round((n0(contado) - esperado) * 100) / 100, ingresos: suma(pagos, "monto"), egresos: suma(gastos, "monto"), nota, detalle });
    aviso("Caja cerrada."); cerrar();
  };
  return html`<${Hoja} centro titulo="Cierre de caja" cerrar=${cerrar} pie=${html`<${Boton} tipo="fantasma" onClick=${cerrar}>Cancelar<//><${Boton} tipo="primario" onClick=${guardar}>Guardar cierre<//>`}>
    <div class="form"><${Par} n="Efectivo que debería haber" v=${soles(esperado)} />
      <${Dinero} etiqueta="Efectivo que contaste" valor=${contado} cambiar=${setContado} />
      ${contado !== null && html`<${Par} total n="Diferencia" v=${soles(n0(contado) - esperado)} />`}
      <${Area} etiqueta="Nota" valor=${nota} cambiar=${setNota} /></div><//>`;
}

// ---------------------------------------------------------------- por cobrar
function PorCobrar() {
  const l = N.porCobrar().sort((a, c) => String(a.o.fecha).localeCompare(String(c.o.fecha)));
  if (!l.length) return html`<${Vacio} icono="circle-check" titulo="Nadie te debe" texto="Cobrar el mismo día es la regla más simple para no quedarte sin caja." />`;
  return html`<${AvisoLinea} icono="info">Total por cobrar: <b>${soles(suma(l, x => x.s.saldo))}</b>. Cobra lo más antiguo primero.<//>
    <div class="grupo" style="margin-top:14px">${l.map(x => html`<${Fila} icono="banknote" colorIcono=${x.o.fecha < sumarDias(hoy(), -7) ? "rojo" : "ambar"} titulo=${x.o._cliente} sub=${(x.o.numero || "") + " · entregado " + relativa(x.o.fecha)} der=${html`<b class="cifra">${soles(x.s.saldo)}</b>`} href=${"#/ordenes/" + x.o.id} flecha />`)}</div>`;
}

// ---------------------------------------------------------------- movimientos del mes
function Movimientos() {
  const [mes, setMes] = useState(mesDe(hoy())), [tipo, setTipo] = useState("");
  const filas = [...D.lista("pagos").filter(p => mesDe(p.fecha) === mes).map(p => ({ id: p.id, fecha: p.fecha, t: "cobro", det: p._cliente || p.concepto || "Cobro", cat: p.concepto || "", met: p.metodo, monto: n0(p.monto), p })),
    ...D.lista("gastos").filter(g => mesDe(g.fecha) === mes).map(g => ({ id: g.id, fecha: g.fecha, t: "gasto", det: g.descripcion || "", cat: CATEGORIAS_GASTO[g.categoria] || "", met: g.metodo, monto: -n0(g.monto), g }))]
    .filter(x => !tipo || x.t === tipo).sort((a, c) => String(c.fecha).localeCompare(String(a.fecha)));
  const [ed, setEd] = useState(null), [edC, setEdC] = useState(null);
  const abrirFila = x => (x.g ? setEd(x.g) : x.p && setEdC(x.p));
  return html`<${SelMes} mes=${mes} setMes=${setMes} />
    <p class="nota" style="margin-bottom:10px">Toca un cobro o un gasto para corregirlo o eliminarlo.</p>
    <div style="margin-bottom:14px"><${Chips} valor=${tipo} cambiar=${setTipo} opciones=${[{ v: "", n: "Todo", fijo: true }, { v: "cobro", n: "Cobros" }, { v: "gasto", n: "Gastos" }]} /></div>
    <${Tabla} filas=${filas} onFila=${abrirFila} vacio=${html`<${Vacio} icono="wallet" titulo="Sin movimientos este mes" />`}
      movil=${x => html`<${Fila} icono=${x.t === "cobro" ? "banknote" : "receipt"} colorIcono=${x.t === "cobro" ? "verde" : "rojo"} titulo=${x.det || x.cat} sub=${fechaCorta(x.fecha) + " · " + (METODOS[x.met] || "")} der=${html`<b class="cifra">${soles(x.monto)}</b>`} onClick=${() => abrirFila(x)} />`}
      cols=${[{ k: "fecha", n: "Fecha", f: x => fechaCorta(x.fecha) }, { k: "det", n: "Detalle", clase: "prin" }, { k: "cat", n: "Categoría", clase: "tenue" }, { k: "met", n: "Método", f: x => METODOS[x.met] || "" },
        { k: "monto", n: "Monto", num: true, f: x => html`<span style=${{ color: x.monto < 0 ? "var(--rojo)" : "var(--verde)" }}>${soles(x.monto)}</span>` }]}
      pie=${["", "Total", "", "", soles(suma(filas, "monto"))]} />
    ${ed && html`<${FormGasto} inicial=${ed} cerrar=${() => setEd(null)} />`}${edC && html`<${FormCobro} inicial=${edC} cerrar=${() => setEdC(null)} />`}`;
}

// ---------------------------------------------------------------- reparto de cada cobro (Profit First)
function Reparto() {
  const [mes, setMes] = useState(mesDe(hoy())), [tr, setTr] = useState(null), [pcts, setPcts] = useState(null);
  const r = N.reparto(mes + "-01", finMes(mes + "-01"));
  const total = r.cuentas.reduce((a, c) => a + c.pct, 0);
  return html`<${SelMes} mes=${mes} setMes=${setMes} />
    <${AvisoLinea} c="oro" icono="piggy-bank">Primero separa tu ganancia, luego gasta lo que queda (Michalowicz, <i>La ganancia es primero</i>). Abre una cuenta o un sobre por cada parte y mueve el dinero dos veces al mes.<//>
    <div style="margin:16px 0"><${Resumen} items=${[{ n: "Cobros del mes", v: soles(r.cobros) }, { n: "Compra de insumos", v: soles(r.materiales) }, { n: "Ingreso real para repartir", v: soles(r.real), c: "oro" }]} /></div>
    <div class="grupo">${r.cuentas.map(c => html`<div class="fila"><span class="cuerpo"><span class="t">${c.n} · ${c.pct}%</span><span class="s multi">${c.d}</span>
      <div style="margin-top:8px"><${Progreso} v=${c.hecho} max=${c.debe || 1} c=${c.falta < 1 ? "verde" : ""} /></div><span class="s">Separado ${soles(c.hecho)} de ${soles(Math.round(c.debe))} · saldo acumulado ${soles(c.saldo)}</span></span>
      <span class="der"><${Boton} chico onClick=${() => setTr({ cuenta: c.id, monto: Math.round(c.falta) })}>${c.falta >= 1 ? "Separar " + soles(Math.round(c.falta)) : "Mover"}<//></span></div>`)}</div>
    <div class="btns" style="margin-top:14px"><${Boton} tipo="fantasma" icono="sliders-horizontal" onClick=${() => setPcts(Object.fromEntries(r.cuentas.map(c => [c.id, c.pct])))}>Cambiar porcentajes<//>${total !== 100 && html`<${Insignia} c="rojo">Los % suman ${total}<//>`}</div>
    <${Socios} r=${r} />
    ${tr && html`<${FormTransferencia} inicial=${tr} cuentas=${r.cuentas} cerrar=${() => setTr(null)} />`}
    ${pcts && html`<${Hoja} centro titulo="Porcentajes del reparto" cerrar=${() => setPcts(null)} pie=${html`<${Boton} tipo="primario" onClick=${() => { D.fijarAjuste("distribucion", Object.assign({}, D.ajuste("distribucion", {}), { pcts })); setPcts(null); aviso("Porcentajes guardados."); }}>Guardar<//>`}>
      <div class="form">${r.cuentas.map(c => html`<${Numero} etiqueta=${c.n} sufijo="%" decimales=${0} valor=${pcts[c.id]} cambiar=${v => setPcts(Object.assign({}, pcts, { [c.id]: v || 0 }))} />`)}
        <${Par} total n="Suma" v=${Object.values(pcts).reduce((a, x) => a + n0(x), 0) + "%"} /></div><//>`}`;
}
// Socios: el sueldo se reparte por el trabajo de cada uno y la ganancia por lo que cada uno es dueño
// (Michalowicz, Profit First). Escríbanlo y fírmenlo antes de que haya plata de por medio (Gage, The Partnership Charter).
function Socios({ r }) {
  const guardados = D.ajuste("socios", []) || [], [ed, setEd] = useState(null);
  const eq = D.equipo().filter(x => x.rol === "admin");
  const base = guardados.length ? guardados : eq.length > 1 ? eq.map(x => ({ id: x.id, nombre: x.nombre, sueldo: Math.round(100 / eq.length), ganancia: Math.round(100 / eq.length) })) : [];
  const cS = r.cuentas.find(c => c.id === "sueldo") || { debe: 0 }, cG = r.cuentas.find(c => c.id === "ganancia") || { debe: 0 };
  const editar = () => setEd((base.length ? base : [{ nombre: (D.yo() || {}).nombre || "", sueldo: 50, ganancia: 50 }, { nombre: "", sueldo: 50, ganancia: 50 }]).map(x => Object.assign({}, x)));
  return html`<${Bloque} titulo="Reparto entre socios" sub="El sueldo, por el trabajo de cada uno; la ganancia, por lo que cada uno es dueño" der=${D.puedeAjuste("socios") && html`<${Boton} chico tipo="fantasma" icono="pencil" onClick=${editar}>${base.length ? "Cambiar" : "Agregar socios"}<//>`}>
    ${base.length ? html`<div class="grupo">${base.map(x => html`<${Fila} avatar=${x.nombre} titulo=${x.nombre || "Socio"} sub=${"Sueldo " + n0(x.sueldo) + "% · Ganancia " + n0(x.ganancia) + "%"}
        der=${html`<div style="text-align:right"><b class="cifra">${soles(Math.round(cS.debe * n0(x.sueldo) / 100 + cG.debe * n0(x.ganancia) / 100))}</b><div class="s">${soles(Math.round(cS.debe * n0(x.sueldo) / 100))} sueldo + ${soles(Math.round(cG.debe * n0(x.ganancia) / 100))} ganancia</div></div>`} />`)}</div>
      ${!guardados.length && html`<p class="nota" style="margin-top:8px">Propuesta 50/50. Tócala para ajustarla a lo que acuerden.</p>`}`
      : html`<div class="panel"><p class="tenue">Si tienes socios, agrega cuánto le toca a cada uno del sueldo y de la ganancia.</p></div>`}
    ${ed && html`<${Hoja} centro titulo="Socios y porcentajes" cerrar=${() => setEd(null)} pie=${html`<${Boton} tipo="fantasma" onClick=${() => setEd(null)}>Cancelar<//><${Boton} tipo="primario" onClick=${() => {
        const l = ed.filter(x => String(x.nombre || "").trim());
        const sS = l.reduce((a, x) => a + n0(x.sueldo), 0), sG = l.reduce((a, x) => a + n0(x.ganancia), 0);
        if (l.length && (sS !== 100 || sG !== 100)) return aviso("Cada columna debe sumar 100%. Sueldo: " + sS + "%, ganancia: " + sG + "%.", { error: true });
        D.fijarAjuste("socios", l); setEd(null); aviso("Socios guardados.");
      }}>Guardar<//>`}>
      <div class="form"><p class="nota">Ejemplo: si tú haces el servicio y tu socia la gestión, el sueldo puede repartirse por horas trabajadas y la ganancia por lo que cada uno puso al negocio.</p>
        ${ed.map((x, i) => html`<div class="panel"><${Entrada} etiqueta="Nombre" valor=${x.nombre} cambiar=${v => setEd(ed.map((y, j) => (j === i ? Object.assign({}, y, { nombre: v }) : y)))} />
          <div class="rejilla dos-movil" style="margin-top:8px"><${Numero} etiqueta="% del sueldo" sufijo="%" decimales=${0} valor=${x.sueldo} cambiar=${v => setEd(ed.map((y, j) => (j === i ? Object.assign({}, y, { sueldo: v || 0 }) : y)))} />
          <${Numero} etiqueta="% de la ganancia" sufijo="%" decimales=${0} valor=${x.ganancia} cambiar=${v => setEd(ed.map((y, j) => (j === i ? Object.assign({}, y, { ganancia: v || 0 }) : y)))} /></div>
          ${ed.length > 1 && html`<div class="btns fin" style="margin-top:6px"><${Boton} chico tipo="fantasma peligro" icono="trash-2" onClick=${() => setEd(ed.filter((y, j) => j !== i))}>Quitar<//></div>`}</div>`)}
        ${ed.length < 4 && html`<${Boton} chico icono="plus" onClick=${() => setEd([...ed, { nombre: "", sueldo: 0, ganancia: 0 }])}>Otro socio<//>`}
        <${Par} n="Suma sueldo" v=${ed.reduce((a, x) => a + n0(x.sueldo), 0) + "%"} /><${Par} n="Suma ganancia" v=${ed.reduce((a, x) => a + n0(x.ganancia), 0) + "%"} /></div><//>`}
  <//>`;
}
function FormTransferencia({ inicial, cuentas, cerrar }) {
  const [f, set] = useFicha(Object.assign({ fecha: hoy(), monto: 0, nota: "", sentido: "entra" }, inicial));
  const guardar = () => { D.guardar("transferencias", { fecha: f.fecha, cuenta: f.cuenta, monto: f.sentido === "sale" ? -n0(f.monto) : n0(f.monto), nota: f.nota }); aviso("Movimiento registrado."); cerrar(); };
  return html`<${Hoja} centro titulo="Mover dinero" cerrar=${cerrar} pie=${html`<${Boton} tipo="fantasma" onClick=${cerrar}>Cancelar<//><${Boton} tipo="primario" onClick=${guardar}>Guardar<//>`}>
    <div class="form"><${Selector} etiqueta="Cuenta" opciones=${cuentas.map(c => ({ v: c.id, n: c.n }))} ...${b(f, set, "cuenta")} />
      <${Chips} valor=${f.sentido} cambiar=${v => set("sentido", v || "entra")} opciones=${[{ v: "entra", n: "Separar (entra)" }, { v: "sale", n: "Usar (sale)" }]} />
      <div class="rejilla"><${Dinero} etiqueta="Monto" ...${b(f, set, "monto")} /><${Entrada} etiqueta="Fecha" tipo="date" ...${b(f, set, "fecha")} /></div>
      <${Entrada} etiqueta="Nota" ...${b(f, set, "nota")} placeholder="Ej.: SOAT, cambio de aceite" /></div><//>`;
}

// ---------------------------------------------------------------- rentabilidad por servicio (costeo por tiempo)
function Rentabilidad() {
  const [tam, setTam] = useState("auto"), [cf, setCf] = useState(null);
  const servs = N.serviciosActivos().map(s => Object.assign({ id: s.id, nombre: s.nombre }, N.rentabilidad(s, tam)));
  const fijos = D.lista("costosFijos"), tasa = N.tasaMinuto();
  return html`<${AvisoLinea} c="oro" icono="lightbulb">Cada servicio debe pagar los insumos <b>y el tiempo</b> que te toma, incluido el traslado. Costo de tu tiempo = costos fijos del mes ÷ minutos que puedes trabajar (Kaplan y Anderson, costeo por tiempo).<//>
    <div style="margin:16px 0"><${Resumen} items=${[{ n: "Costos fijos al mes", v: soles(Math.round(N.costosFijosMes())) }, { n: "Horas útiles al mes (80%)", v: num(N.capacidadMesMin() / 60) + " h" }, { n: "Costo de tu tiempo", v: soles(tasa * 60) + " / h", c: "oro" }]} /></div>
    <div style="margin-bottom:12px"><${Chips} valor=${tam} cambiar=${v => setTam(v || "auto")} opciones=${N.tamanos().map(t => ({ v: t.id, n: t.n }))} /></div>
    <${Tabla} filas=${servs} vacio=${html`<${Vacio} titulo="Agrega servicios en Configuración" />`}
      movil=${s => html`<${Fila} icono="sparkles" titulo=${s.nombre} sub=${soles(Math.round(s.porHora)) + " por hora · " + pct(s.margen) + " margen"} der=${html`<b class="cifra" style=${{ color: s.utilidad < 0 ? "var(--rojo)" : "" }}>${soles(Math.round(s.utilidad))}</b>`} />`}
      cols=${[{ k: "nombre", n: "Servicio", clase: "prin" }, { k: "precio", n: "Precio", num: true, f: s => soles(s.precio) }, { k: "insumos", n: "Insumos", num: true, f: s => soles(s.insumos) },
        { k: "minutos", n: "Tiempo + traslado", num: true, f: s => duracion(s.minutos + s.traslado) }, { k: "porHora", n: "Deja por hora", num: true, f: s => html`<b>${soles(Math.round(s.porHora))}</b>` },
        { k: "utilidad", n: "Utilidad real", num: true, f: s => html`<span style=${{ color: s.utilidad < 0 ? "var(--rojo)" : "var(--verde)" }}>${soles(Math.round(s.utilidad))}</span>` }, { k: "margen", n: "Margen", num: true, f: s => pct(s.margen) }]}
      ordenInicial=${{ k: "porHora", d: true }} />
    <${Bloque} titulo="Costos fijos del mes" sub="Lo que pagas aunque no laves ningún auto" der=${html`<${Boton} chico icono="plus" onClick=${() => setCf({})}>Agregar<//>`} clase="" >
      <div style="margin-top:4px"></div>${fijos.length ? html`<div class="grupo">${fijos.map(c => html`<${Fila} icono="calendar-clock" titulo=${c.nombre} sub=${CATEGORIAS_GASTO[c.categoria] || ""} der=${html`<b class="cifra">${soles(c.monto)}</b>`} onClick=${() => setCf(c)} />`)}</div>`
        : html`<p class="nota">Agrega celular, plan de datos, seguro, cuota del vehículo, publicidad fija y tu sueldo base. Sin esto, la utilidad real se ve mejor de lo que es.</p>`}<//>
    ${cf && html`<${FormCostoFijo} c=${cf} cerrar=${() => setCf(null)} />`}`;
}
function FormCostoFijo({ c, cerrar }) {
  const [f, set] = useFicha(Object.assign({ nombre: "", categoria: "telefono", monto: null }, c));
  return html`<${Hoja} centro titulo="Costo fijo" cerrar=${cerrar} pie=${html`${c.id && html`<${Boton} tipo="fantasma peligro" icono="trash-2" titulo="Eliminar" onClick=${() => { D.borrar("costosFijos", c.id); cerrar(); }} />`}<${Boton} tipo="primario" onClick=${() => { if (!f.nombre) return aviso("Escribe el concepto.", { error: true }); D.guardar("costosFijos", f); cerrar(); }}>Guardar<//>`}>
    <div class="form"><${Entrada} etiqueta="Concepto" ...${b(f, set, "nombre")} placeholder="Plan de celular" /><${Selector} etiqueta="Categoría" opciones=${Object.keys(CATEGORIAS_GASTO).map(k => ({ v: k, n: CATEGORIAS_GASTO[k] }))} ...${b(f, set, "categoria")} /><${Dinero} etiqueta="Monto al mes" ...${b(f, set, "monto")} /></div><//>`;
}

// ---------------------------------------------------------------- formularios que usa el botón "+"
export function FormCobro({ cerrar, inicial }) {
  const [f, set] = useFicha(Object.assign({ fecha: hoy(), clienteId: "", concepto: "", monto: null, metodo: "yape", referencia: "", ordenId: "" }, inicial || {}));
  const ots = f.clienteId ? D.lista("ordenes").filter(o => o.clienteId === f.clienteId && N.saldoOrden(o).saldo > 0) : [];
  const guardar = () => {
    if (!(n0(f.monto) > 0)) return aviso("Escribe el monto.", { error: true });
    const c = D.uno("clientes", f.clienteId), o = D.uno("ordenes", f.ordenId);
    N.avisarCobro(D.guardar("pagos", Object.assign({}, f, { monto: n0(f.monto), _cliente: c ? nombreDe(c) : "", concepto: f.concepto || (o ? "Orden " + (o.numero || "") : "Cobro"), citaId: o ? o.citaId || "" : "" })));
    aviso(inicial && inicial.id ? "Cobro actualizado." : "Cobro registrado."); cerrar();
  };
  const borrar = async () => { if (await confirmar({ titulo: "Eliminar cobro", texto: `Se borra el cobro de ${soles(n0(inicial.monto))}${inicial._cliente ? " de " + inicial._cliente : ""}. Si era de una orden, la orden vuelve a quedar por cobrar.`, si: "Eliminar", peligro: true })) { D.borrar("pagos", inicial.id); aviso("Cobro eliminado."); cerrar(); } };
  const editar = !!(inicial && inicial.id && D.uno("pagos", inicial.id));
  return html`<${Hoja} titulo=${editar ? "Editar cobro" : "Registrar cobro"} cerrar=${cerrar} pie=${html`${editar && html`<${Boton} tipo="fantasma peligro" icono="trash-2" titulo="Eliminar" onClick=${borrar} />`}<${Boton} tipo="fantasma" onClick=${cerrar}>Cancelar<//><${Boton} tipo="primario" onClick=${guardar}>Guardar cobro<//>`}>
    <div class="form"><${ElegirCliente} valor=${f.clienteId} cambiar=${id => set({ clienteId: id, ordenId: "" })} etiqueta="Cliente (opcional)" crear=${false} />
      ${ots.length > 0 && html`<${Selector} etiqueta="¿De qué orden?" vacio="Ninguna" opciones=${ots.map(o => ({ v: o.id, n: (o.numero || "Orden") + " · debe " + soles(N.saldoOrden(o).saldo) }))} valor=${f.ordenId} cambiar=${v => { const o = D.uno("ordenes", v); set({ ordenId: v, monto: o ? N.saldoOrden(o).saldo : f.monto }); }} />`}
      <div class="rejilla"><${Dinero} etiqueta="Monto" ...${b(f, set, "monto")} /><${Entrada} etiqueta="Fecha" tipo="date" ...${b(f, set, "fecha")} /></div>
      <${Chips} valor=${f.metodo} cambiar=${v => set("metodo", v || f.metodo)} opciones=${Object.keys(METODOS).map(k => ({ v: k, n: METODOS[k] }))} />
      <${Entrada} etiqueta="Concepto" ...${b(f, set, "concepto")} placeholder="Ej.: plan mensual de octubre" />
      ${f.metodo !== "efectivo" && html`<${Entrada} etiqueta="Número de operación" ...${b(f, set, "referencia")} />`}</div><//>`;
}
export function FormGasto({ cerrar, inicial }) {
  const [f, set] = useFicha(Object.assign({ fecha: hoy(), categoria: "insumos", descripcion: "", monto: null, metodo: "efectivo", tipo: "variable" }, inicial || {}));
  const guardar = () => {
    if (!(n0(f.monto) > 0)) return aviso("Escribe el monto.", { error: true });
    D.guardar("gastos", Object.assign({}, f, { monto: n0(f.monto) })); aviso("Gasto registrado."); cerrar();
  };
  const borrar = async () => { if (await confirmar({ titulo: "Eliminar gasto", si: "Eliminar", peligro: true })) { D.borrar("gastos", inicial.id); cerrar(); } };
  return html`<${Hoja} titulo=${inicial && inicial.id ? "Editar gasto" : "Registrar gasto"} cerrar=${cerrar} pie=${html`${inicial && inicial.id && html`<${Boton} tipo="fantasma peligro" icono="trash-2" titulo="Eliminar" onClick=${borrar} />`}<${Boton} tipo="fantasma" onClick=${cerrar}>Cancelar<//><${Boton} tipo="primario" onClick=${guardar}>Guardar gasto<//>`}>
    <div class="form"><div class="rejilla"><${Dinero} etiqueta="Monto" ...${b(f, set, "monto")} /><${Entrada} etiqueta="Fecha" tipo="date" ...${b(f, set, "fecha")} /></div>
      <${Selector} etiqueta="Categoría" opciones=${Object.keys(CATEGORIAS_GASTO).map(k => ({ v: k, n: CATEGORIAS_GASTO[k] }))} ...${b(f, set, "categoria")} />
      <${Entrada} etiqueta="Detalle" ...${b(f, set, "descripcion")} placeholder="Ej.: shampoo 1 galón, gasolina" />
      <${Chips} valor=${f.metodo} cambiar=${v => set("metodo", v || f.metodo)} opciones=${Object.keys(METODOS).map(k => ({ v: k, n: METODOS[k] }))} />
      <${Chips} valor=${f.tipo} cambiar=${v => set("tipo", v || f.tipo)} opciones=${[{ v: "variable", n: "Variable (depende del trabajo)" }, { v: "fijo", n: "Fijo (todos los meses)" }]} /></div><//>`;
}

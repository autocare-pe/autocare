// AUTOCARE · Activos: equipos, herramientas y vehículos; mantenimientos y lo que te cuesta cada mes (depreciación)
import { html, useState } from "../../vendor/preact-htm.js";
import * as D from "../datos.js";
import * as N from "../negocio.js";
import { ir, usarTitulo } from "../app.js";
import { Boton, Hoja, Entrada, Numero, Dinero, Area, Selector, Chips, Pestanas, Insignia, Vacio, Fila, Bloque, Resumen, Tabla, AvisoLinea, aviso, confirmar, useFicha, b } from "../ui.js";
import { hoy, fechaCorta, relativa, soles, suma, n0, num } from "../util.js";
import { ESTADOS, estadoDe } from "../esquema.js";

const TIPOS = { equipo: "Equipo", herramienta: "Herramienta", vehiculo: "Vehículo" };
export default function Activos({ ruta }) {
  D.useDatos();
  usarTitulo("Activos y vehículo");
  const t = ruta.partes[0] || "activos";
  const alertas = N.alertasActivos();
  return html`<header class="pagina-cab"><div><h1>Activos y vehículo</h1><p>Tus equipos te dan de comer: cuídalos a tiempo y separa para reemplazarlos.</p></div></header>
    <${Pestanas} valor=${t} cambiar=${v => ir("activos/" + v, true)} opciones=${[{ v: "activos", n: "Equipos y vehículos", cuenta: alertas.length }, { v: "mantenimientos", n: "Mantenimientos" }]} />
    ${t === "activos" ? html`<${Lista} alertas=${alertas} />` : html`<${Mantenimientos} />`}`;
}
function Lista({ alertas }) {
  const [ed, setEd] = useState(null), [mant, setMant] = useState(null);
  const l = D.lista("activos").filter(a => a.estado !== "baja");
  const dep = suma(l, N.depreciacionMes);
  return html`<div style="margin-bottom:16px"><${Resumen} items=${[{ n: "Invertido en equipos", v: soles(Math.round(suma(l, "costo"))) }, { n: "Valor actual", v: soles(Math.round(suma(l, N.valorLibros))) },
      { n: "Separar cada mes para reponerlos", v: soles(Math.round(dep)), c: "oro", d: "Va a tu fondo de vehículo y equipos" }]} /></div>
    ${alertas.length > 0 && html`<div class="grupo" style="margin-bottom:16px">${alertas.map(x => html`<${Fila} icono="wrench" colorIcono=${x.fecha < hoy() ? "rojo" : "ambar"} titulo=${x.txt + ": " + x.a.nombre} sub=${relativa(x.fecha)} der=${html`<${Boton} chico onClick=${() => setMant({ activoId: x.a.id })}>Registrar<//>`} />`)}</div>`}
    <div class="filtros"><span style="flex:1"></span><${Boton} tipo="primario" icono="plus" onClick=${() => setEd({})}>Nuevo activo<//></div>
    ${Object.keys(TIPOS).map(tp => { const g = l.filter(a => (a.tipo || "equipo") === tp); return g.length ? html`<${Bloque} titulo=${TIPOS[tp] + (tp === "vehiculo" ? "s" : "s")}>
      <div class="grupo">${g.map(a => { const p = N.proximoMantenimiento(a); return html`<${Fila} icono=${tp === "vehiculo" ? "car" : tp === "equipo" ? "zap" : "hammer"} titulo=${a.nombre}
        sub=${[a.costo ? soles(a.costo) : "", N.depreciacionMes(a) ? soles(Math.round(N.depreciacionMes(a) * 10) / 10) + " al mes" : "", p ? "mantenimiento " + relativa(p) : "", a.placa].filter(Boolean).join(" · ")}
        der=${html`<${Insignia} c=${estadoDe("activos", a.estado || "operativo").c}>${estadoDe("activos", a.estado || "operativo").n}<//><${Boton} chico tipo="fantasma" icono="wrench" titulo="Registrar mantenimiento" onClick=${e => { e.stopPropagation(); setMant({ activoId: a.id }); }} />`} onClick=${() => setEd(a)} />`; })}</div><//>` : null; })}
    ${!l.length && html`<${Vacio} icono="car" titulo="Aún no registras tus equipos" texto="Carga la configuración inicial desde Ayuda o agrégalos aquí." />`}
    <${AvisoLinea} icono="lightbulb">Cada mes separa lo que indica «Separar cada mes» en tu cuenta de Fondo del vehículo y equipos (Finanzas → Reparto). Así, cuando la hidrolavadora se malogre, la cambias sin endeudarte.<//>
    ${ed && html`<${FormActivo} a=${ed} cerrar=${() => setEd(null)} />`}${mant && html`<${FormMant} m=${mant} cerrar=${() => setMant(null)} />`}`;
}
function FormActivo({ a, cerrar }) {
  const [f, set] = useFicha(Object.assign({ nombre: "", tipo: "equipo", marca: "", fechaCompra: hoy(), costo: null, vidaMeses: 24, residual: 0, cadaDias: 30, estado: "operativo", placa: "", km: null, soat: "", revision: "", notas: "" }, a));
  const guardar = () => { if (!f.nombre) return aviso("Escribe el nombre.", { error: true }); D.guardar("activos", f); aviso("Guardado."); cerrar(); };
  const borrar = async () => { if (await confirmar({ titulo: "Eliminar activo", texto: "Si ya no lo usas, mejor márcalo como «de baja».", si: "Eliminar", peligro: true })) { D.borrar("activos", a.id); cerrar(); } };
  return html`<${Hoja} titulo=${a.id ? "Editar activo" : "Nuevo activo"} cerrar=${cerrar} pie=${html`${a.id && html`<${Boton} tipo="fantasma peligro" icono="trash-2" titulo="Eliminar" onClick=${borrar} />`}<${Boton} tipo="fantasma" onClick=${cerrar}>Cancelar<//><${Boton} tipo="primario" onClick=${guardar}>Guardar<//>`}>
    <div class="form"><${Entrada} etiqueta="Nombre" ...${b(f, set, "nombre")} /><${Chips} valor=${f.tipo} cambiar=${v => set("tipo", v || f.tipo)} opciones=${Object.keys(TIPOS).map(k => ({ v: k, n: TIPOS[k] }))} />
      <div class="rejilla"><${Dinero} etiqueta="Costo" ...${b(f, set, "costo")} /><${Entrada} etiqueta="Fecha de compra" tipo="date" ...${b(f, set, "fechaCompra")} /></div>
      <div class="rejilla"><${Numero} etiqueta="Vida útil (meses)" decimales=${0} ...${b(f, set, "vidaMeses")} ayuda="Cuánto crees que dura. Sirve para saber cuánto separar al mes." /><${Numero} etiqueta="Mantenimiento cada (días)" decimales=${0} ...${b(f, set, "cadaDias")} /></div>
      ${f.tipo === "vehiculo" && html`<div class="rejilla"><${Entrada} etiqueta="Placa" ...${b(f, set, "placa")} /><${Numero} etiqueta="Kilometraje" decimales=${0} ...${b(f, set, "km")} /></div>
        <div class="rejilla"><${Entrada} etiqueta="SOAT vence" tipo="date" ...${b(f, set, "soat")} /><${Entrada} etiqueta="Revisión técnica vence" tipo="date" ...${b(f, set, "revision")} /></div>`}
      <${Selector} etiqueta="Estado" opciones=${Object.keys(ESTADOS.activos).map(k => ({ v: k, n: ESTADOS.activos[k].n }))} ...${b(f, set, "estado")} />
      <${Area} etiqueta="Notas" ...${b(f, set, "notas")} /></div><//>`;
}
function FormMant({ m, cerrar }) {
  const [f, set] = useFicha(Object.assign({ fecha: hoy(), tipo: "preventivo", descripcion: "", costo: null, km: null }, m));
  const guardar = () => {
    const a = D.uno("activos", f.activoId);
    let gastoId = "";
    if (n0(f.costo) > 0 && D.puedeEditar("gastos")) gastoId = D.guardar("gastos", { fecha: f.fecha, categoria: "mantenimiento", descripcion: "Mantenimiento: " + (a ? a.nombre : "") + (f.descripcion ? " · " + f.descripcion : ""), monto: n0(f.costo), metodo: "efectivo", tipo: "variable", activoId: f.activoId }).id;
    D.guardar("mantenimientos", Object.assign({}, f, { _activo: a ? a.nombre : "", gastoId }));
    if (a && f.km) D.cambiar("activos", a.id, { km: f.km });
    aviso("Mantenimiento registrado."); cerrar();
  };
  return html`<${Hoja} centro titulo="Registrar mantenimiento" cerrar=${cerrar} pie=${html`<${Boton} tipo="fantasma" onClick=${cerrar}>Cancelar<//><${Boton} tipo="primario" onClick=${guardar}>Guardar<//>`}>
    <div class="form"><${Selector} etiqueta="Activo" opciones=${D.lista("activos").map(a => ({ v: a.id, n: a.nombre }))} ...${b(f, set, "activoId")} />
      <${Chips} valor=${f.tipo} cambiar=${v => set("tipo", v || f.tipo)} opciones=${[{ v: "preventivo", n: "Preventivo" }, { v: "correctivo", n: "Reparación" }]} />
      <${Entrada} etiqueta="Qué se hizo" ...${b(f, set, "descripcion")} placeholder="Cambio de aceite de la bomba, limpieza de filtro…" />
      <div class="rejilla dos-movil"><${Dinero} etiqueta="Costo" ...${b(f, set, "costo")} /><${Entrada} etiqueta="Fecha" tipo="date" ...${b(f, set, "fecha")} /></div>
      <${Numero} etiqueta="Kilometraje (si es vehículo)" decimales=${0} ...${b(f, set, "km")} /></div><//>`;
}
function Mantenimientos() {
  const l = D.lista("mantenimientos").slice().sort((a, c) => String(c.fecha).localeCompare(String(a.fecha)));
  return html`<${Tabla} filas=${l} vacio=${html`<${Vacio} icono="wrench" titulo="Sin mantenimientos registrados" />`}
    movil=${m => html`<${Fila} icono="wrench" titulo=${m._activo} sub=${fechaCorta(m.fecha) + " · " + (m.descripcion || m.tipo)} der=${m.costo ? html`<b class="cifra">${soles(m.costo)}</b>` : null} />`}
    cols=${[{ k: "fecha", n: "Fecha", f: m => fechaCorta(m.fecha) }, { k: "_activo", n: "Activo", clase: "prin" }, { k: "tipo", n: "Tipo" }, { k: "descripcion", n: "Qué se hizo", clase: "tenue" }, { k: "costo", n: "Costo", num: true, f: m => (m.costo ? soles(m.costo) : "") }]} />`;
}

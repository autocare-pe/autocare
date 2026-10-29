// AUTOCARE · Inventario: productos con costo por uso, movimientos (kardex), compras, por comprar y proveedores
import { html, useState } from "../../vendor/preact-htm.js";
import * as D from "../datos.js";
import * as N from "../negocio.js";
import { ir, usarTitulo } from "../app.js";
import { Boton, Hoja, Entrada, Numero, Dinero, Area, Selector, Interruptor, Chips, Pestanas, Insignia, Vacio, Fila, Bloque, Resumen, Tabla, Par, AvisoLinea, Check, aviso, confirmar, useFicha, b, MasDatos } from "../ui.js";
import { hoy, fechaCorta, soles, suma, n0, num, telBonito, wa, clases } from "../util.js";
import { UNIDADES, METODOS, estadoDe } from "../esquema.js";

export default function Inventario({ ruta }) {
  D.useDatos();
  usarTitulo("Inventario");
  const t = ruta.partes[0] || "productos";
  const bajos = N.stockBajo().length, pend = D.lista("porComprar").filter(x => x.estado !== "comprado").length;
  return html`<header class="pagina-cab"><div><h1>Inventario</h1><p>Lo que tienes, lo que gastas en cada servicio y lo que debes comprar.</p></div></header>
    <${Pestanas} valor=${t} cambiar=${v => ir("inventario/" + v, true)} opciones=${[{ v: "productos", n: "Productos", cuenta: bajos }, { v: "comprar", n: "Por comprar", cuenta: pend },
      { v: "compras", n: "Compras" }, { v: "movimientos", n: "Movimientos" }, { v: "proveedores", n: "Proveedores" }]} />
    ${t === "productos" && html`<${Productos} />`}${t === "comprar" && html`<${PorComprar} />`}${t === "compras" && html`<${Compras} />`}
    ${t === "movimientos" && html`<${Movimientos} />`}${t === "proveedores" && html`<${Proveedores} />`}
    ${ruta.partes[0] === "producto" && ruta.partes[1] && html`<${FormProducto} p=${D.uno("productos", ruta.partes[1]) || {}} cerrar=${() => ir("inventario", true)} />`}`;
}

// ---------------------------------------------------------------- productos
function Productos() {
  const [ed, setEd] = useState(null), [mov, setMov] = useState(null);
  const l = D.lista("productos").filter(p => p.activo !== false).sort((a, c) => String(a.categoria || "").localeCompare(String(c.categoria || "")) || String(a.nombre).localeCompare(String(c.nombre)));
  const valor = suma(l, p => Math.max(0, n0(p.stock)) * n0(p.costoProm));
  return html`<div style="margin-bottom:16px"><${Resumen} items=${[{ n: "Productos", v: l.length }, { n: "Valor en stock", v: soles(Math.round(valor)) }, { n: "Por reponer", v: N.stockBajo().length, c: N.stockBajo().length ? "rojo" : "" }]} /></div>
    <div class="filtros"><p class="tenue" style="flex:1">El <b>costo por uso</b> se suma solo al costo de cada orden cuando el servicio tiene su receta.</p><${Boton} tipo="primario" icono="plus" onClick=${() => setEd({})}>Nuevo producto<//></div>
    <${Tabla} filas=${l} onFila=${setEd} vacio=${html`<${Vacio} icono="package" titulo="Aún no tienes productos" texto="Carga la configuración inicial desde Ayuda o agrega tus productos uno por uno." />`}
      movil=${p => html`<${Fila} icono="package" colorIcono=${n0(p.minimo) && n0(p.stock) <= n0(p.minimo) ? "rojo" : ""} titulo=${p.nombre} sub=${(p.marca ? p.marca + " · " : "") + soles(N.costoUso(p)) + " por uso"} der=${html`<b class="cifra">${num(p.stock, 1)}</b>`} onClick=${() => setEd(p)} />`}
      cols=${[{ k: "nombre", n: "Producto", clase: "prin" }, { k: "marca", n: "Marca", clase: "tenue" }, { k: "stock", n: "Stock", num: true, f: p => html`<span style=${{ color: n0(p.minimo) && n0(p.stock) <= n0(p.minimo) ? "var(--rojo)" : "" }}>${num(p.stock, 2)} ${p.unidad || ""}</span>` },
        { k: "costoProm", n: "Costo", num: true, f: p => soles(p.costoProm) }, { k: "rinde", n: "Rinde (usos)", num: true }, { k: "uso", n: "Costo por uso", num: true, v: p => N.costoUso(p), f: p => html`<b>${soles(N.costoUso(p))}</b>` },
        { k: "acc", n: "", ordenar: false, f: p => html`<${Boton} chico onClick=${e => { e.stopPropagation(); setMov(p); }}>Mover<//>` }]} />
    ${ed && html`<${FormProducto} p=${ed} cerrar=${() => setEd(null)} />`}${mov && html`<${FormMovimiento} p=${mov} cerrar=${() => setMov(null)} />`}`;
}
function FormProducto({ p, cerrar }) {
  const [f, set] = useFicha(Object.assign({ nombre: "", marca: "", categoria: "", unidad: "galón", stock: 0, minimo: 1, costoProm: null, rinde: null, activo: true, proveedorId: "" }, p));
  const guardar = () => { if (!String(f.nombre).trim()) return aviso("Escribe el nombre.", { error: true }); D.guardar("productos", f); aviso("Producto guardado."); cerrar(); };
  const borrar = async () => { if (await confirmar({ titulo: "Eliminar producto", texto: "Si lo usas en recetas, mejor desactívalo.", si: "Eliminar", peligro: true })) { D.borrar("productos", p.id); cerrar(); } };
  return html`<${Hoja} titulo=${p.id ? "Editar producto" : "Nuevo producto"} cerrar=${cerrar} pie=${html`${p.id && html`<${Boton} tipo="fantasma peligro" icono="trash-2" titulo="Eliminar" onClick=${borrar} />`}<${Boton} tipo="fantasma" onClick=${cerrar}>Cancelar<//><${Boton} tipo="primario" onClick=${guardar}>Guardar<//>`}>
    <div class="form"><${Entrada} etiqueta="Producto" ...${b(f, set, "nombre")} placeholder="Shampoo con cera 4 L" />
      <div class="rejilla"><${Selector} etiqueta="Unidad de compra" opciones=${UNIDADES} ...${b(f, set, "unidad")} /><${Dinero} etiqueta="Costo por unidad" ...${b(f, set, "costoProm")} /></div>
      <div class="rejilla"><${Numero} etiqueta="¿Para cuántos servicios alcanza una unidad?" decimales=${0} ...${b(f, set, "rinde")} />${!p.id && html`<${Numero} etiqueta="Stock actual" ...${b(f, set, "stock")} />`}</div>
      ${n0(f.rinde) > 0 && n0(f.costoProm) > 0 && html`<${Par} total n="Costo por uso" v=${soles(n0(f.costoProm) / n0(f.rinde))} />`}
      <${MasDatos} abierto=${!!(f.marca || f.categoria || f.proveedorId)}>
        <div class="rejilla"><${Entrada} etiqueta="Marca" ...${b(f, set, "marca")} /><${Entrada} etiqueta="Categoría" ...${b(f, set, "categoria")} placeholder="Lavado, Interior…" /></div>
        <div class="rejilla"><${Numero} etiqueta="Avisarme cuando queden" ...${b(f, set, "minimo")} /><${Selector} etiqueta="Proveedor" vacio="Ninguno" opciones=${D.lista("proveedores").map(x => ({ v: x.id, n: x.nombre }))} ...${b(f, set, "proveedorId")} /></div>
        ${p.id && html`<${Interruptor} etiqueta="Activo" ...${b(f, set, "activo")} />`}
      <//></div><//>`;
}
function FormMovimiento({ p, cerrar }) {
  const [f, set] = useFicha({ tipo: "entrada", cantidad: null, costoUnit: p.costoProm, motivo: "" });
  const guardar = () => {
    if (f.cantidad === null) return aviso("Escribe la cantidad.", { error: true });
    N.moverInventario({ productoId: p.id, tipo: f.tipo, cantidad: f.cantidad, costoUnit: f.costoUnit, motivo: f.motivo || (f.tipo === "ajuste" ? "Conteo físico" : "") });
    aviso("Inventario actualizado."); cerrar();
  };
  return html`<${Hoja} centro titulo=${p.nombre} sub=${"Stock actual: " + num(p.stock, 2) + " " + (p.unidad || "")} cerrar=${cerrar} pie=${html`<${Boton} tipo="fantasma" onClick=${cerrar}>Cancelar<//><${Boton} tipo="primario" onClick=${guardar}>Guardar<//>`}>
    <div class="form"><${Chips} valor=${f.tipo} cambiar=${v => set("tipo", v || f.tipo)} opciones=${[{ v: "entrada", n: "Entrada" }, { v: "salida", n: "Salida" }, { v: "ajuste", n: "Conteo físico" }]} />
      <${Numero} etiqueta=${f.tipo === "ajuste" ? "Cantidad que contaste" : "Cantidad"} ...${b(f, set, "cantidad")} sufijo=${p.unidad} />
      ${f.tipo === "entrada" && html`<${Dinero} etiqueta="Costo por unidad" ...${b(f, set, "costoUnit")} ayuda="El costo promedio se recalcula solo (promedio ponderado)." />`}
      <${Entrada} etiqueta="Motivo" ...${b(f, set, "motivo")} /></div><//>`;
}

// ---------------------------------------------------------------- por comprar
function PorComprar() {
  const [ed, setEd] = useState(null), [ver, setVer] = useState("pendiente"), [compra, setCompra] = useState(null);
  const l = D.lista("porComprar").filter(x => (ver === "pendiente" ? x.estado !== "comprado" : x.estado === "comprado")).sort((a, c) => n0(a.prioridad || 3) - n0(c.prioridad || 3));
  const total = suma(l.filter(x => x.estado !== "comprado"), x => n0(x.precio) * (n0(x.cant) || 1));
  const comprar = x => { setEd(null); setCompra({ item: x }); };
  return html`<div class="filtros"><${Chips} valor=${ver} cambiar=${v => setVer(v || "pendiente")} opciones=${[{ v: "pendiente", n: "Pendientes" }, { v: "comprado", n: "Comprados" }]} />
      ${ver === "pendiente" && total > 0 && html`<span class="tenue">Total estimado: <b>${soles(total)}</b></span>`}<${Boton} tipo="primario" icono="plus" onClick=${() => setEd({})} style="margin-left:auto">Agregar<//></div>
    ${l.length ? html`<div class="grupo">${l.map(x => html`<div class="fila"><span class=${clases("ico", x.prioridad == 1 ? "rojo" : x.prioridad == 2 ? "ambar" : "")}>${x.prioridad || 3}</span>
      <span class="cuerpo"><span class="t">${x.item}</span><span class="s">${[x.donde, x.revisar].filter(Boolean).join(" · ")}</span></span>
      <span class="der"><b class="cifra">${soles(n0(x.precio) * (n0(x.cant) || 1))}</b>${x.estado !== "comprado" ? html`<${Boton} chico tipo="primario" onClick=${() => comprar(x)}>Lo compré<//>` : null}<${Boton} chico tipo="fantasma" icono="pencil" titulo="Editar" onClick=${() => setEd(x)} /></span></div>`)}</div>`
      : html`<${Vacio} icono="shopping-cart" titulo=${ver === "pendiente" ? "Nada pendiente de comprar" : "Aún no marcas compras"} />`}
    ${ed && html`<${FormPorComprar} x=${ed} cerrar=${() => setEd(null)} />`}${compra && html`<${FormCompra} inicial=${compra} cerrar=${() => setCompra(null)} />`}`;
}
function FormPorComprar({ x, cerrar }) {
  const [f, set] = useFicha(Object.assign({ item: "", tipo: "insumo", cant: 1, precio: null, prioridad: 2, estado: "pendiente", donde: "", revisar: "" }, x));
  const guardar = () => { if (!f.item) return aviso("Escribe qué comprar.", { error: true }); D.guardar("porComprar", f); cerrar(); };
  return html`<${Hoja} centro titulo=${x.id ? "Editar" : "Agregar a la lista"} cerrar=${cerrar} pie=${html`${x.id && html`<${Boton} tipo="fantasma peligro" icono="trash-2" titulo="Eliminar" onClick=${() => { D.borrar("porComprar", x.id); cerrar(); }} />`}<${Boton} tipo="primario" onClick=${guardar}>Guardar<//>`}>
    <div class="form"><${Entrada} etiqueta="Qué" ...${b(f, set, "item")} /><div class="rejilla dos-movil"><${Numero} etiqueta="Cantidad" decimales=${0} ...${b(f, set, "cant")} /><${Dinero} etiqueta="Precio estimado c/u" ...${b(f, set, "precio")} /></div>
      <${Chips} valor=${String(f.prioridad)} cambiar=${v => set("prioridad", Number(v || 2))} opciones=${[{ v: "1", n: "Urgente" }, { v: "2", n: "Pronto" }, { v: "3", n: "Cuando se pueda" }]} />
      <${Entrada} etiqueta="Dónde" ...${b(f, set, "donde")} /><${Entrada} etiqueta="Qué revisar al comprar" ...${b(f, set, "revisar")} /></div><//>`;
}

// ---------------------------------------------------------------- compras (entrada de stock + gasto)
function Compras() {
  const [nueva, setNueva] = useState(null);
  const l = D.lista("compras").slice().sort((a, c) => String(c.fecha).localeCompare(String(a.fecha)));
  return html`<div class="filtros"><p class="tenue" style="flex:1">Al registrar una compra se suma al stock, se recalcula el costo y se anota el gasto en Finanzas.</p><${Boton} tipo="primario" icono="plus" onClick=${() => setNueva({})}>Registrar compra<//></div>
    <${Tabla} filas=${l} vacio=${html`<${Vacio} icono="shopping-cart" titulo="Aún no registras compras" />`}
      movil=${c => html`<${Fila} icono="shopping-cart" titulo=${c._proveedor || "Compra"} sub=${fechaCorta(c.fecha) + " · " + (c.items || []).length + " productos"} der=${html`<b class="cifra">${soles(c.total)}</b>`} />`}
      cols=${[{ k: "fecha", n: "Fecha", f: c => fechaCorta(c.fecha) }, { k: "_proveedor", n: "Proveedor", clase: "prin" }, { k: "items", n: "Detalle", ordenar: false, f: c => (c.items || []).map(i => i.nombre + " ×" + i.cant).join(", "), clase: "tenue" }, { k: "total", n: "Total", num: true, f: c => soles(c.total) }]} />
    ${nueva && html`<${FormCompra} inicial=${nueva} cerrar=${() => setNueva(null)} />`}`;
}
function FormCompra({ inicial, cerrar }) {
  const prods = D.lista("productos").filter(p => p.activo !== false);
  const [f, set] = useFicha({ fecha: hoy(), proveedorId: (D.lista("proveedores")[0] || {}).id || "", metodo: "yape", nota: inicial.item ? inicial.item.item : "" });
  const [items, setItems] = useState(inicial.item && /SET 120/i.test(inicial.item.item) ? prods.filter(p => /Extreme Wash/.test(p.marca) && /4 L/.test(p.nombre)).map(p => ({ productoId: p.id, cant: 1, costo: 24 })) : [{ productoId: "", cant: 1, costo: null }]);
  const total = suma(items, i => n0(i.cant) * n0(i.costo)) || n0(inicial.item && inicial.item.precio);
  const guardar = () => {
    const ok = items.filter(i => i.productoId && n0(i.cant) > 0);
    if (!ok.length && !(inicial.item && total)) return aviso("Agrega al menos un producto.", { error: true });
    const prov = D.uno("proveedores", f.proveedorId);
    const c = D.guardar("compras", { fecha: f.fecha, proveedorId: f.proveedorId, _proveedor: prov ? prov.nombre : "", total, estado: "recibida", metodo: f.metodo, nota: f.nota,
      items: ok.map(i => ({ productoId: i.productoId, nombre: (D.uno("productos", i.productoId) || {}).nombre, cant: n0(i.cant), costo: n0(i.costo) })) });
    ok.forEach(i => N.moverInventario({ productoId: i.productoId, tipo: "entrada", cantidad: n0(i.cant), costoUnit: n0(i.costo), motivo: "Compra", compraId: c.id, fecha: f.fecha }));
    const g = D.guardar("gastos", { fecha: f.fecha, categoria: "insumos", descripcion: "Compra: " + (ok.map(i => (D.uno("productos", i.productoId) || {}).nombre).join(", ") || f.nota), monto: total, metodo: f.metodo, tipo: "variable", proveedorId: f.proveedorId, _proveedor: prov ? prov.nombre : "", compraId: c.id });
    D.cambiar("compras", c.id, { gastoId: g.id });
    if (inicial.item && inicial.item.id) D.cambiar("porComprar", inicial.item.id, { estado: "comprado", fechaCompra: f.fecha, pagado: total });
    aviso("Compra registrada: stock y gasto actualizados."); cerrar();
  };
  return html`<${Hoja} titulo="Registrar compra" cerrar=${cerrar} pie=${html`<${Boton} tipo="fantasma" onClick=${cerrar}>Cancelar<//><${Boton} tipo="primario" onClick=${guardar}>Guardar compra<//>`}>
    <div class="form"><div class="rejilla"><${Entrada} etiqueta="Fecha" tipo="date" ...${b(f, set, "fecha")} /><${Selector} etiqueta="Proveedor" vacio="Sin proveedor" opciones=${D.lista("proveedores").map(x => ({ v: x.id, n: x.nombre }))} ...${b(f, set, "proveedorId")} /></div>
      ${items.map((it, k) => html`<div class="rejilla" style="--col:3;align-items:end"><${Selector} etiqueta="Producto" vacio="Elegir" opciones=${prods.map(p => ({ v: p.id, n: p.nombre }))} valor=${it.productoId} cambiar=${v => setItems(items.map((x, j) => (j === k ? Object.assign({}, x, { productoId: v, costo: x.costo ?? (D.uno("productos", v) || {}).costoProm }) : x)))} />
        <${Numero} etiqueta="Cantidad" valor=${it.cant} cambiar=${v => setItems(items.map((x, j) => (j === k ? Object.assign({}, x, { cant: v }) : x)))} /><${Dinero} etiqueta="Costo c/u" valor=${it.costo} cambiar=${v => setItems(items.map((x, j) => (j === k ? Object.assign({}, x, { costo: v }) : x)))} /></div>`)}
      <${Boton} chico tipo="fantasma" icono="plus" onClick=${() => setItems([...items, { productoId: "", cant: 1, costo: null }])}>Otro producto<//>
      <${Chips} valor=${f.metodo} cambiar=${v => set("metodo", v || f.metodo)} opciones=${Object.keys(METODOS).map(k => ({ v: k, n: METODOS[k] }))} />
      <${Entrada} etiqueta="Nota" ...${b(f, set, "nota")} /><${Par} total n="Total" v=${soles(total)} /></div><//>`;
}

// ---------------------------------------------------------------- movimientos y proveedores
function Movimientos() {
  const l = D.lista("movimientos").slice().sort((a, c) => String(c.fecha).localeCompare(String(a.fecha)) || (c.creado || 0) - (a.creado || 0));
  const T = { entrada: ["Entrada", "verde"], salida: ["Salida", "rojo"], ajuste: ["Conteo", "azul"] };
  return html`<${Tabla} filas=${l} vacio=${html`<${Vacio} icono="history" titulo="Sin movimientos todavía" texto="Se registran solos al entregar órdenes, comprar o hacer conteos." />`}
    movil=${m => html`<${Fila} icono="history" colorIcono=${(T[m.tipo] || [])[1]} titulo=${m._producto} sub=${fechaCorta(m.fecha) + " · " + (m.motivo || (T[m.tipo] || [])[0])} der=${html`<b class="cifra">${m.cantidad > 0 && m.tipo !== "salida" ? "+" : m.tipo === "salida" ? "−" : ""}${num(Math.abs(m.cantidad), 2)}</b>`} />`}
    cols=${[{ k: "fecha", n: "Fecha", f: m => fechaCorta(m.fecha) }, { k: "_producto", n: "Producto", clase: "prin" }, { k: "tipo", n: "Tipo", f: m => html`<${Insignia} c=${(T[m.tipo] || [])[1]}>${(T[m.tipo] || [m.tipo])[0]}<//>` },
      { k: "cantidad", n: "Cantidad", num: true, f: m => num(m.cantidad, 2) }, { k: "saldo", n: "Saldo", num: true, f: m => num(m.saldo, 2) }, { k: "motivo", n: "Motivo", clase: "tenue" }]} />`;
}
function Proveedores() {
  const [ed, setEd] = useState(null);
  const l = D.lista("proveedores");
  return html`<div class="filtros"><span style="flex:1"></span><${Boton} tipo="primario" icono="plus" onClick=${() => setEd({})}>Nuevo proveedor<//></div>
    ${l.length ? html`<div class="grupo">${l.map(p => html`<${Fila} icono="truck" titulo=${p.nombre} sub=${[p.rubro, telBonito(p.tel), p.notas].filter(Boolean).join(" · ")}
      der=${html`${p.tel && html`<${Boton} chico icono="message-circle" href=${wa(p.tel, "Hola, quiero hacer un pedido.")}>Pedir<//>`}<${Boton} chico tipo="fantasma" icono="pencil" titulo="Editar" onClick=${() => setEd(p)} />`} />`)}</div>`
      : html`<${Vacio} icono="truck" titulo="Sin proveedores" />`}
    ${ed && html`<${FormProveedor} p=${ed} cerrar=${() => setEd(null)} />`}`;
}
function FormProveedor({ p, cerrar }) {
  const [f, set] = useFicha(Object.assign({ nombre: "", rubro: "", ruc: "", tel: "", contacto: "", notas: "" }, p));
  return html`<${Hoja} centro titulo=${p.id ? "Editar proveedor" : "Nuevo proveedor"} cerrar=${cerrar} pie=${html`${p.id && html`<${Boton} tipo="fantasma peligro" icono="trash-2" titulo="Eliminar" onClick=${() => { D.borrar("proveedores", p.id); cerrar(); }} />`}<${Boton} tipo="primario" onClick=${() => { if (!f.nombre) return aviso("Escribe el nombre.", { error: true }); D.guardar("proveedores", f); cerrar(); }}>Guardar<//>`}>
    <div class="form"><${Entrada} etiqueta="Nombre" ...${b(f, set, "nombre")} /><div class="rejilla"><${Entrada} etiqueta="Rubro" ...${b(f, set, "rubro")} /><${Entrada} etiqueta="WhatsApp" ...${b(f, set, "tel")} /></div>
      <div class="rejilla"><${Entrada} etiqueta="Contacto" ...${b(f, set, "contacto")} /><${Entrada} etiqueta="RUC" ...${b(f, set, "ruc")} /></div><${Area} etiqueta="Notas" ...${b(f, set, "notas")} /></div><//>`;
}

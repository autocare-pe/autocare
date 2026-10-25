// AUTOCARE · reglas del negocio (precios, agenda, cobros, clientes, inventario, finanzas)
// Si cambias una regla aquí, cambia también en el servidor (Publico.gs) las que usa tu web.
import * as D from "./datos.js";
import { TAMANOS, PLANTILLAS, CUENTAS } from "./esquema.js";
import { hoy, sumarDias, diasEntre, minutos, hhmm, diaSemana, msDe, n0, suma, porId, nombreDe, primerNombre, rellenar, fechaLarga, horaDe, soles, llave, mesDe, inicioMes, finMes, isoDe } from "./util.js";

// ---------------------------------------------------------------- negocio y catálogo
export const negocio = () => D.ajuste("negocio", {});
export const nombreNegocio = () => negocio().nombre || "AUTOCARE";
export function tamanos() { const t = D.ajuste("tamanos"); return t && t.length ? t : TAMANOS; }
export const tamanoDe = id => tamanos().find(t => t.id === id) || tamanos()[0];
export function precioCon(s, tam) {
  const p = n0(s && s.precio), t = tamanos().find(x => x.id === tam);
  if (!s || !s.porTamano || !t || !n0(t.pct)) return p;
  return Math.round((p * (1 + n0(t.pct) / 100)) / 5) * 5;
}
export function minutosCon(servs, tam) {
  const t = tamanos().find(x => x.id === tam);
  return servs.reduce((a, s) => a + (n0(s.minutos) || 60), 0) + (t ? n0(t.min) : 0);
}
export const serviciosActivos = () => D.lista("servicios").filter(s => (s.estado || "activo") === "activo").sort((a, b) => (a.orden || 999) - (b.orden || 999) || n0(a.precio) - n0(b.precio));
export function itemsDeServicios(ids, tam) {
  const cat = porId(D.lista("servicios"));
  return (ids || []).map(id => cat[id]).filter(Boolean).map(s => ({ servicioId: s.id, nombre: s.nombre, precio: precioCon(s, tam), minutos: n0(s.minutos) || 60, cant: 1 }));
}
export const totalItems = (items, descuento) => Math.max(0, suma(items, i => n0(i.precio) * (i.cant === undefined ? 1 : n0(i.cant))) - n0(descuento));
export const nombresItems = items => (items || []).map(i => i.nombre + (n0(i.cant) > 1 ? " ×" + i.cant : "")).join(" + ");

// ---------------------------------------------------------------- horario y agenda
export function horario() {
  return Object.assign({
    dias: { 0: [], 1: [["08:00", "18:00"]], 2: [["08:00", "18:00"]], 3: [["08:00", "18:00"]], 4: [["08:00", "18:00"]], 5: [["08:00", "18:00"]], 6: [["08:00", "14:00"]] },
    intervalo: 30, traslado: 30, maxHoras: 8, anticipacion: 12, diasAdelante: 21, bloqueos: []
  }, D.ajuste("horario", {}));
}
const ACTIVAS = ["solicitada", "confirmada", "en_curso"];
export const citaActiva = c => ACTIVAS.includes(c.estado || "confirmada");
export function citasDelDia(fecha) {
  return D.lista("citas").filter(c => c.fecha === fecha).sort((a, b) => String(a.hora || "99").localeCompare(String(b.hora || "99")));
}
export function rangosDia(fecha, H = horario()) { return H.dias[String(diaSemana(fecha))] || []; }
export function capacidadDia(fecha, H = horario()) {
  const abierto = rangosDia(fecha, H).reduce((a, r) => a + Math.max(0, minutos(r[1]) - minutos(r[0])), 0);
  const bloq = (H.bloqueos || []).filter(b => b.fecha === fecha).reduce((a, b) => a + Math.max(0, (minutos(b.hasta || "23:59") || 1440) - (minutos(b.desde || "00:00") || 0)), 0);
  return Math.max(0, Math.min(abierto - bloq, H.maxHoras ? H.maxHoras * 60 : Infinity));
}
export function cargaDia(fecha, excluir) {
  return D.lista("citas").filter(c => c.fecha === fecha && c.id !== excluir && (citaActiva(c) || c.estado === "completada")).reduce((a, c) => a + (n0(c.minutos) || 60), 0);
}
/** Horas libres de un día. estricto=true aplica la anticipación mínima (como la web). */
export function slotsDia(fecha, dur, { excluir, estricto } = {}) {
  const H = horario(), rangos = rangosDia(fecha, H);
  if (!rangos.length) return [];
  const busy = D.lista("citas").filter(c => c.fecha === fecha && c.id !== excluir && citaActiva(c) && minutos(c.hora) !== null)
    .map(c => ({ i: minutos(c.hora), f: minutos(c.hora) + (n0(c.minutos) || 60) }));
  const carga = busy.reduce((a, x) => a + x.f - x.i, 0);
  if (H.maxHoras && carga + dur > H.maxHoras * 60) return [];
  (H.bloqueos || []).forEach(b => { if (b.fecha === fecha) busy.push({ i: minutos(b.desde || "00:00"), f: minutos(b.hasta || "23:59") || 1440, bloqueo: true }); });
  const tr = n0(H.traslado), paso = n0(H.intervalo) || 30, limite = Date.now() + (estricto ? n0(H.anticipacion) * 3600000 : 0), out = [];
  rangos.forEach(r => {
    for (let t = minutos(r[0]); t + dur <= minutos(r[1]); t += paso) {
      const choca = busy.some(x => { const m = x.bloqueo ? 0 : tr; return t < x.f + m && t + dur + m > x.i; });
      if (choca || msDe(fecha, hhmm(t)) < limite) continue;
      out.push(hhmm(t));
    }
  });
  return out;
}
export function proximoLibre(dur, desde = hoy(), dias = 14) {
  for (let i = 0; i < dias; i++) { const f = sumarDias(desde, i), s = slotsDia(f, dur, { estricto: true }); if (s.length) return { fecha: f, hora: s[0] }; }
  return null;
}
export function ocupacion(desde, hasta) {
  let cap = 0, usado = 0;
  for (let f = desde; f <= hasta; f = sumarDias(f, 1)) { cap += capacidadDia(f); usado += cargaDia(f); }
  return { cap, usado, pct: cap ? usado / cap : null };
}

// ---------------------------------------------------------------- órdenes y cobros
export function pagosDeOrden(o) {
  const vistos = new Set();
  return D.lista("pagos").filter(p => {
    const es = p.ordenId === o.id || (o.citaId && p.citaId === o.citaId && !p.ordenId);
    if (!es || vistos.has(p.id)) return false;
    vistos.add(p.id); return true;
  });
}
export function saldoOrden(o) {
  const total = n0(o.total), pagado = suma(pagosDeOrden(o), "monto");
  const cobra = !o.cobro || o.cobro === "normal";
  return { total, pagado, saldo: cobra ? Math.max(0, Math.round((total - pagado) * 100) / 100) : 0, cobra };
}
export function porCobrar() {
  return D.lista("ordenes").filter(o => o.estado === "entregado" || o.estado === "listo").map(o => ({ o, s: saldoOrden(o) })).filter(x => x.s.saldo > 0.009);
}
export function minutosOrden(o) {
  if (n0(o.minutosReales)) return n0(o.minutosReales);
  if (o.inicio && o.fin) return Math.round((o.fin - o.inicio) / 60000);
  return suma(o.items, i => n0(i.minutos) || 60);
}
export function minutosEstandar(o) { return suma(o.items, i => (n0(i.minutos) || 60) * (i.cant === undefined ? 1 : n0(i.cant) || 1)); }

// ---------------------------------------------------------------- clientes: historial, fidelidad y segmentos
export const SEGMENTOS = {
  campeon: { n: "Campeones", c: "verde", d: "Vienen seguido y hace poco. Pídeles reseña y que te recomienden." },
  toca: { n: "Les toca volver", c: "oro", d: "Ya pasó su tiempo normal entre lavados. Escríbeles hoy: es la venta más fácil." },
  leal: { n: "Frecuentes", c: "azul", d: "Han vuelto y están al día. Ofréceles el plan mensual." },
  nuevo: { n: "Nuevos", c: "violeta", d: "Una sola visita, hace poco. La segunda visita es la que crea el hábito." },
  riesgo: { n: "En riesgo", c: "ambar", d: "Entre 2 y 4 meses sin venir. Un mensaje personal suele recuperarlos." },
  dormido: { n: "Dormidos", c: "rojo", d: "Más de 4 meses sin venir. Ofrece algo especial o pregunta qué pasó." },
  sin: { n: "Sin servicios", c: "", d: "Registrados, pero todavía no los atiendes." }
};
const esPagada = o => o.estado === "entregado" && n0(o.total) > 0 && (!o.cobro || o.cobro === "normal");
export function perfiles() {
  return D.calculado("perfiles", () => {
    const H = hoy(), cat = porId(D.lista("servicios")), volverBase = n0((D.ajuste("fidelidad", {}) || {}).volver) || 30;
    const porCli = {};
    D.lista("ordenes").forEach(o => { if (o.estado === "entregado" && o.clienteId) (porCli[o.clienteId] = porCli[o.clienteId] || []).push(o); });
    const mem = {};
    D.lista("membresias").forEach(m => { if (m.estado === "activa" && (!m.fin || m.fin >= H)) mem[m.clienteId] = m; });
    const out = new Map();
    D.lista("clientes").forEach(c => {
      const ots = (porCli[c.id] || []).slice().sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)));
      const visitas = ots.length, ultima = visitas ? ots[visitas - 1].fecha : null, primera = visitas ? ots[0].fecha : null;
      const gasto = suma(ots.filter(o => !o.cobro || o.cobro === "normal"), "total");
      let frecuencia = null;
      if (visitas >= 2) frecuencia = Math.round(diasEntre(primera, ultima) / (visitas - 1));
      let volver = volverBase;
      if (ultima) {
        const vs = (ots[visitas - 1].items || []).map(i => n0((cat[i.servicioId] || {}).volver)).filter(Boolean);
        if (vs.length) volver = Math.min(...vs);
      }
      const ritmo = frecuencia && visitas >= 3 ? Math.max(7, Math.min(frecuencia, volver * 2)) : volver;
      const proxima = ultima ? sumarDias(ultima, ritmo) : null;
      const R = ultima ? diasEntre(ultima, H) : null;
      let seg;
      if (!visitas) seg = "sin";
      else if (R > 120) seg = "dormido";
      else if (R > 60) seg = "riesgo";
      else if (proxima && proxima <= H) seg = "toca";
      else if (visitas >= 4 && R <= 45) seg = "campeon";
      else if (visitas === 1) seg = "nuevo";
      else seg = "leal";
      const hace365 = sumarDias(H, -365);
      out.set(c.id, {
        visitas, ultima, primera, gasto, ticket: visitas ? gasto / Math.max(1, ots.filter(o => !o.cobro || o.cobro === "normal").length) : 0,
        frecuencia, proxima, dias: R, seg, membresia: mem[c.id] || null,
        f365: ots.filter(o => o.fecha >= hace365).length, m365: suma(ots.filter(o => o.fecha >= hace365 && (!o.cobro || o.cobro === "normal")), "total"),
        nps: ots.map(o => o.nps).filter(x => x !== undefined && x !== null && x !== "").pop()
      });
    });
    return out;
  });
}
export const perfil = id => perfiles().get(id) || { visitas: 0, gasto: 0, seg: "sin" };
// Tarjeta de sellos manual: tú pones cada sello desde la app. El primer sello llega con regalo (efecto de progreso
// dotado, Nunes y Drèze 2006: con 2 sellos de regalo, 34% completó la tarjeta frente a 19% sin regalo).
export function reglasFidelidad() { return Object.assign({ activo: true, cada: 8, regalo: 2, premio: "Lavado completo", bono: 1, manual: true }, D.ajuste("fidelidad", {})); }
export function fidelidad(cli) {
  const F = reglasFidelidad(), cada = Math.max(2, Math.round(n0(F.cada) || 8));
  const s = Math.max(0, Math.round(n0(cli && cli.sellos))), disp = Math.floor(s / cada);
  const refs = D.lista("clientes").filter(c => c.referidoPor === (cli && cli.id)).length;
  return { activo: F.activo !== false, cada, sellos: s, actuales: disp ? cada : s, disponibles: disp, usados: n0(cli && cli.canjes), referidos: refs, premio: F.premio, regalo: n0(F.regalo), bono: n0(F.bono) };
}
/** Suma un sello. Si es el primero, llegan los sellos de regalo (por defecto 2). */
export function sumarSello(cli, ordenId) {
  const F = reglasFidelidad(), s = n0(cli.sellos), suma = s === 0 && !n0(cli.canjes) ? Math.max(1, n0(F.regalo) || 1) : 1;
  const c = D.cambiar("clientes", cli.id, { sellos: s + suma, ultimoSello: Date.now() });
  if (ordenId) D.cambiar("ordenes", ordenId, { sello: true });
  return { cliente: c, sumados: suma };
}
export function quitarSello(cli) { return D.cambiar("clientes", cli.id, { sellos: Math.max(0, n0(cli.sellos) - 1) }); }
export function canjearPremio(cli) {
  const cada = Math.max(2, Math.round(n0(reglasFidelidad().cada) || 8));
  return D.cambiar("clientes", cli.id, { sellos: Math.max(0, n0(cli.sellos) - cada), canjes: n0(cli.canjes) + 1 });
}
export function vehiculosDe(clienteId) { return D.lista("vehiculos").filter(v => v.clienteId === clienteId); }
export const nombreVehiculo = v => (v ? [v.marca, v.modelo, v.placa && "(" + v.placa + ")"].filter(Boolean).join(" ") : "");
export function clientePorTel(tel) { const t = String(tel || "").replace(/\D/g, "").slice(-9); return t.length === 9 ? D.lista("clientes").find(c => String(c.tel || "").replace(/\D/g, "").slice(-9) === t) : null; }
export function codigoReferido(nombre) {
  const base = String(nombre || "").normalize("NFD").replace(/[^A-Za-z]/g, "").slice(0, 6).toUpperCase() || "AMIGO";
  const usados = new Set(D.lista("clientes").map(c => String(c.codigo || "").toUpperCase()));
  for (let i = 0; i < 50; i++) { const c = base + llave(2).toUpperCase().replace(/[^A-Z0-9]/g, "7"); if (!usados.has(c)) return c; }
  return base + (Date.now() % 1000);
}
/** Asegura que el cliente tenga llave de portal y código de referido */
export function asegurarPortal(c) {
  if (!c || (c.token && c.codigo)) return c;
  return D.cambiar("clientes", c.id, { token: c.token || llave(24), codigo: c.codigo || codigoReferido(c.nombre) });
}
export function urlPortal(c) {
  const web = (negocio().web || location.origin + location.pathname.replace(/\/app\/.*$/, "")).replace(/\/+$/, "");
  if (!web || !c) return "";
  c = asegurarPortal(c);
  return web + "/cliente.html#t=" + c.token;
}

// ---------------------------------------------------------------- mensajes de WhatsApp
export function plantilla(clave) {
  const propia = D.lista("plantillas").find(p => p.clave === clave);
  return propia || PLANTILLAS.find(p => p.clave === clave) || { texto: "" };
}
export function mensaje(clave, v = {}) {
  const n = negocio();
  const base = { negocio: nombreNegocio(), resena: n.google || "", yape: n.yape && n.yape.numero ? n.yape.numero + (n.yape.titular ? " (" + n.yape.titular + ")" : "") : "" };
  return rellenar(typeof clave === "string" && !clave.includes(" ") ? plantilla(clave).texto : clave, Object.assign(base, v)).replace(/\s+\{[a-z]+\}/g, "").trim();
}
export function varsCita(c) {
  const cli = D.uno("clientes", c.clienteId), veh = D.uno("vehiculos", c.vehiculoId);
  return { nombre: primerNombre(cli) || primerNombre({ nombre: c._cliente }), fecha: fechaLarga(c.fecha), hora: c.hora || "", servicio: c._servicios || "", direccion: c.direccion || "",
    adelanto: c.adelanto ? soles(c.adelanto) : "", total: c.total ? soles(c.total) : "", placa: veh ? veh.placa : "", portal: cli ? urlPortal(cli) : "" };
}
export function varsOrden(o) {
  const cli = D.uno("clientes", o.clienteId), veh = D.uno("vehiculos", o.vehiculoId);
  return { nombre: primerNombre(cli) || primerNombre({ nombre: o._cliente }), total: soles(o.total), servicio: nombresItems(o.items), placa: veh ? veh.placa : "", portal: cli ? urlPortal(cli) : "", codigo: cli ? cli.codigo : "" };
}
export function varsCliente(c) {
  const p = perfil(c.id), veh = vehiculosDe(c.id)[0];
  const libre = proximoLibre(60);
  return { nombre: primerNombre(c), codigo: (asegurarPortal(c) || c).codigo || "", portal: urlPortal(c), placa: veh ? veh.placa || veh.marca || "auto" : "auto",
    fecha: libre ? fechaLarga(libre.fecha) + " a las " + libre.hora : "", ultima: p.ultima ? fechaLarga(p.ultima) : "" };
}

// Datos vivos para las respuestas rápidas (se arman con tus precios actuales)
export function varsRespuesta() {
  const n = negocio(), servs = serviciosActivos().filter(x => x.web !== false), paq = servs.filter(x => x.paquete);
  const libre = proximoLibre(90);
  const web = (n.web || location.origin + location.pathname.replace(/\/app\/.*$/, "")).replace(/\/+$/, "");
  return {
    negocio: nombreNegocio(), web, zonas: n.zonas || n.distrito || "Arequipa",
    precios: servs.filter(x => !x.paquete).map(x => "• " + x.nombre + ": " + soles(x.precio) + (x.porTamano ? " (auto)" : "")).join("\n"),
    paquetes: (paq.length ? paq : servs.slice(0, 3)).map(x => "• " + x.nombre + ": " + soles(x.precio) + (x.incluye ? " — " + String(x.incluye).split("\n").filter(Boolean).slice(0, 3).join(", ") : "")).join("\n"),
    libre: libre ? fechaLarga(libre.fecha) + " a las " + libre.hora : "esta semana",
    planes: D.lista("planes").filter(p => p.activo !== false).map(p => "• " + p.nombre + ": " + soles(p.precio) + (p.incluye ? " — " + p.incluye : "")).join("\n") || "",
    tamanos: tamanos().filter(t => n0(t.pct)).map(t => t.n + " +" + t.pct + "%").join(", "),
    pagos: n.pagos || "Efectivo, Yape, Plin o transferencia"
  };
}

// ---------------------------------------------------------------- inventario
export function costoUso(p) { return p ? (n0(p.rinde) > 0 ? n0(p.costoProm) / n0(p.rinde) : n0(p.costoProm)) : 0; }
export function costoInsumos(s) {
  if (!s) return 0;
  if (s.receta && s.receta.length) { const prod = porId(D.lista("productos")); return suma(s.receta, r => n0(r.usos) * costoUso(prod[r.productoId])); }
  return n0(s.costo);
}
/** Registra una entrada, salida o conteo y actualiza el stock y el costo promedio (promedio ponderado) */
export function moverInventario({ productoId, tipo, cantidad, costoUnit, motivo, ordenId, compraId, fecha }) {
  const p = D.uno("productos", productoId);
  if (!p) return null;
  const stock = n0(p.stock), cant = n0(cantidad);
  let nuevo = stock, prom = n0(p.costoProm), mov = cant;
  if (tipo === "entrada") {
    nuevo = stock + cant;
    const cu = costoUnit === undefined || costoUnit === null ? prom : n0(costoUnit);
    prom = nuevo > 0 ? (Math.max(0, stock) * prom + cant * cu) / (Math.max(0, stock) + cant) : cu;
  } else if (tipo === "salida") nuevo = stock - cant;
  else if (tipo === "ajuste") { nuevo = cant; mov = cant - stock; }
  nuevo = Math.round(nuevo * 1000) / 1000;
  D.cambiar("productos", productoId, { stock: nuevo, costoProm: Math.round(prom * 100) / 100 });
  return D.guardar("movimientos", { fecha: fecha || hoy(), _producto: p.nombre, tipo, cantidad: Math.round(mov * 1000) / 1000, costoUnit: tipo === "entrada" ? n0(costoUnit) : prom,
    saldo: nuevo, motivo: motivo || "", productoId, ordenId: ordenId || "", compraId: compraId || "" });
}
export const stockBajo = () => D.lista("productos").filter(p => p.activo !== false && n0(p.minimo) > 0 && n0(p.stock) <= n0(p.minimo));
export function consumoDeServicios(items) {
  const cat = porId(D.lista("servicios")), prod = porId(D.lista("productos")), acum = {};
  (items || []).forEach(i => {
    const s = cat[i.servicioId];
    ((s && s.receta) || []).forEach(r => {
      const p = prod[r.productoId]; if (!p) return;
      const a = acum[r.productoId] || (acum[r.productoId] = { productoId: p.id, nombre: p.nombre, usos: 0 });
      a.usos += n0(r.usos) * (n0(i.cant) || 1);
    });
  });
  return Object.values(acum).map(a => Object.assign(a, { costo: Math.round(a.usos * costoUso(prod[a.productoId]) * 100) / 100 }));
}

// ---------------------------------------------------------------- activos
export function depreciacionMes(a) {
  const vida = n0(a.vidaMeses);
  if (!vida || a.estado === "baja") return 0;
  return Math.max(0, (n0(a.costo) - n0(a.residual)) / vida);
}
export function valorLibros(a) {
  if (!a.fechaCompra) return n0(a.costo);
  const meses = Math.max(0, diasEntre(a.fechaCompra, hoy()) / 30.44);
  return Math.max(n0(a.residual), n0(a.costo) - depreciacionMes(a) * meses);
}
export function proximoMantenimiento(a) {
  if (!n0(a.cadaDias)) return null;
  const ult = D.lista("mantenimientos").filter(m => m.activoId === a.id).map(m => m.fecha).sort().pop() || a.fechaCompra || hoy();
  return sumarDias(ult, n0(a.cadaDias));
}
export function alertasActivos() {
  const H = hoy(), out = [];
  D.lista("activos").filter(a => a.estado !== "baja").forEach(a => {
    const p = proximoMantenimiento(a);
    if (p && p <= sumarDias(H, 7)) out.push({ a, tipo: "mantenimiento", fecha: p, txt: "Mantenimiento " + (p < H ? "vencido" : "pronto") });
    if (a.soat && a.soat <= sumarDias(H, 20)) out.push({ a, tipo: "soat", fecha: a.soat, txt: a.soat < H ? "SOAT vencido" : "SOAT vence pronto" });
    if (a.revision && a.revision <= sumarDias(H, 20)) out.push({ a, tipo: "revision", fecha: a.revision, txt: a.revision < H ? "Revisión técnica vencida" : "Revisión técnica pronto" });
  });
  return out.sort((x, y) => String(x.fecha).localeCompare(String(y.fecha)));
}

// ---------------------------------------------------------------- finanzas
export function costosFijosMes() {
  return suma(D.lista("costosFijos"), "monto") + suma(D.lista("activos"), depreciacionMes);
}
// Capacidad práctica (Kaplan y Anderson, costeo por tiempo): 80% del tiempo que abres
export function capacidadMesMin() {
  const H = horario();
  let semana = 0;
  for (let d = 0; d < 7; d++) {
    const abierto = (H.dias[String(d)] || []).reduce((a, r) => a + Math.max(0, minutos(r[1]) - minutos(r[0])), 0);
    semana += Math.min(abierto, H.maxHoras ? H.maxHoras * 60 : Infinity);
  }
  return semana * 52 / 12 * 0.8;
}
export function tasaMinuto() { const c = capacidadMesMin(); return c ? costosFijosMes() / c : 0; }
export function rentabilidad(s, tam = "auto") {
  const precio = precioCon(s, tam), insumos = costoInsumos(s), min = (n0(s.minutos) || 60) + n0(tamanoDe(tam).min);
  const traslado = n0(horario().traslado), tiempo = min + traslado;
  const contribucion = precio - insumos;
  const costoTiempo = tasaMinuto() * tiempo;
  return { precio, insumos, minutos: min, traslado, contribucion, porHora: tiempo ? contribucion / (tiempo / 60) : 0, costoTiempo, utilidad: contribucion - costoTiempo, margen: precio ? (contribucion - costoTiempo) / precio : 0 };
}
export function resultados(desde, hasta) {
  const en = f => f >= desde && f <= hasta;
  const pagos = D.lista("pagos").filter(p => en(p.fecha)), gastos = D.lista("gastos").filter(g => en(g.fecha));
  const ots = D.lista("ordenes").filter(o => o.estado === "entregado" && en(o.fecha));
  const ingresos = suma(pagos, "monto"), egresos = suma(gastos, "monto");
  const porMetodo = {}; pagos.forEach(p => (porMetodo[p.metodo || "efectivo"] = (porMetodo[p.metodo || "efectivo"] || 0) + n0(p.monto)));
  const porCat = {}; gastos.forEach(g => (porCat[g.categoria || "otros"] = (porCat[g.categoria || "otros"] || 0) + n0(g.monto)));
  const insumosUsados = suma(ots, o => n0(o.costoInsumos));
  const traslado = n0(horario().traslado);
  const minutosTrab = suma(ots, o => minutosOrden(o) + traslado);
  const normales = ots.filter(o => !o.cobro || o.cobro === "normal");
  const ventasServ = suma(normales, "total");
  const deMembresias = suma(pagos.filter(p => p.membresiaId), "monto");
  return {
    ingresos, egresos, utilidad: ingresos - egresos, margen: ingresos ? (ingresos - egresos) / ingresos : null,
    porMetodo, porCat, fijos: suma(gastos.filter(g => g.tipo === "fijo"), "monto"), variables: suma(gastos.filter(g => g.tipo !== "fijo"), "monto"),
    insumosUsados, compraInsumos: n0(porCat.insumos), servicios: ots.length, ventasServ, ticket: normales.length ? ventasServ / normales.length : 0,
    horas: minutosTrab / 60, porHora: minutosTrab ? (ventasServ - insumosUsados) / (minutosTrab / 60) : null, recurrente: ingresos ? deMembresias / ingresos : null, deMembresias
  };
}
export function resultadosMes(mes) { return resultados(mes + "-01", finMes(mes + "-01")); }

// Reparto de cada cobro (Profit First)
export function cuentasReparto() {
  const d = D.ajuste("distribucion", {}), pcts = d.pcts || {};
  return CUENTAS.map(c => Object.assign({}, c, { pct: pcts[c.id] !== undefined ? n0(pcts[c.id]) : c.pct }));
}
export function reparto(desde, hasta) {
  const en = f => f >= desde && f <= hasta;
  const cobros = suma(D.lista("pagos").filter(p => en(p.fecha)), "monto");
  const materiales = suma(D.lista("gastos").filter(g => en(g.fecha) && g.categoria === "insumos"), "monto");
  const real = Math.max(0, cobros - materiales);
  const tr = D.lista("transferencias");
  return {
    cobros, materiales, real,
    cuentas: cuentasReparto().map(c => {
      const debe = real * c.pct / 100, hecho = suma(tr.filter(t => t.cuenta === c.id && en(t.fecha) && n0(t.monto) > 0), "monto");
      const saldo = suma(tr.filter(t => t.cuenta === c.id), "monto");
      return Object.assign(c, { debe, hecho, falta: Math.max(0, debe - hecho), saldo });
    })
  };
}
export { mesDe, inicioMes, finMes, isoDe, horaDe, nombreDe };

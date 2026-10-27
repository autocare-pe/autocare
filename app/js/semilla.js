// AUTOCARE · configuración inicial propuesta para tu negocio (se carga una vez desde Ayuda)
// Precios de insumos: catálogo Extreme Wash / Auto Premium 2026. Todo se puede cambiar después en la app.
import * as D from "./datos.js";
import { hoy } from "./util.js";

const PRODUCTOS = [
  { k: "shampoo", nombre: "Shampoo con cera carnauba 4 L", marca: "Extreme Wash", categoria: "Lavado", unidad: "galón", costoProm: 24, rinde: 60, minimo: 1 },
  { k: "apc", nombre: "APC All Power (multiuso) 4 L", marca: "Extreme Wash", categoria: "Interior", unidad: "galón", costoProm: 24, rinde: 40, minimo: 1 },
  { k: "motor", nombre: "Desengrasante de motor 4 L", marca: "Extreme Wash", categoria: "Motor", unidad: "galón", costoProm: 24, rinde: 25, minimo: 1 },
  { k: "llantas", nombre: "Silicona brillante de llantas 4 L", marca: "Extreme Wash", categoria: "Exterior", unidad: "galón", costoProm: 24, rinde: 80, minimo: 1 },
  { k: "tablero", nombre: "Silicona de tablero y puertas 4 L", marca: "Extreme Wash", categoria: "Interior", unidad: "galón", costoProm: 24, rinde: 100, minimo: 1 },
  { k: "vidrios", nombre: "New Glass limpiavidrios 4 L", marca: "Auto Premium", categoria: "Vidrios", unidad: "galón", costoProm: 25, rinde: 80, minimo: 1 },
  { k: "cera", nombre: "Shine Wax cera carnauba 500 ml", marca: "Auto Premium", categoria: "Protección", unidad: "frasco", costoProm: 25, rinde: 15, minimo: 1 },
  { k: "aroma", nombre: "Aromas Fancy 250 ml", marca: "Auto Premium", categoria: "Interior", unidad: "frasco", costoProm: 15, rinde: 50, minimo: 1 },
  { k: "fundas", nombre: "Fundas desechables de volante (30 u)", marca: "", categoria: "Protección", unidad: "paquete", costoProm: 11.61, rinde: 30, minimo: 1, stock: 2 }
];
// Paquetes con efecto señuelo: el del medio cuesta poco más que el básico y mucho menos que el premium
const SERVICIOS = [
  { nombre: "Esencial", categoria: "lavado", precio: 45, minutos: 90, paquete: true, orden: 1, volver: 15, porTamano: true,
    descripcion: "Tu auto limpio por dentro y por fuera, sin moverte de casa.",
    incluye: "Carrocería lavada a mano, sin marcas de agua\nAros y llantas limpios\nInterior aspirado\nTablero y vidrios sin polvo",
    pasos: ["Revisión de llegada con fotos", "Prelavado con espuma", "Lavado a mano con shampoo con cera", "Aros y llantas", "Secado con microfibra", "Aspirado de asientos y alfombras", "Tablero, puertas y vidrios", "Fotos de después"],
    receta: { shampoo: 1, llantas: 1, tablero: 1, vidrios: 1, fundas: 1 } },
  { nombre: "Brillo Total", categoria: "proteccion", precio: 79, minutos: 120, paquete: true, destacado: true, orden: 2, volver: 21, porTamano: true,
    descripcion: "El que deja tu auto como recién salido de la tienda.",
    incluye: "Todo lo del Esencial +\nBrillo profundo con cera carnauba\nProtección contra sol, lluvia y polvo\nLlantas negras como nuevas\nAspirado a fondo y alfombras\nAroma a elección",
    pasos: ["Revisión de llegada con fotos", "Prelavado con espuma", "Lavado a mano con shampoo con cera", "Aros y llantas a fondo", "Secado con microfibra", "Encerado carnauba a mano", "Silicona en llantas", "Aspirado profundo y alfombras", "Tablero, puertas y vidrios", "Aroma", "Fotos de después"],
    receta: { shampoo: 1, llantas: 1, tablero: 1, vidrios: 1, cera: 1, aroma: 1, fundas: 1 } },
  { nombre: "Detallado Premium", categoria: "interior", precio: 189, minutos: 270, paquete: true, orden: 3, volver: 60, porTamano: true, adelanto: true,
    descripcion: "Renovación completa por dentro y por fuera.",
    incluye: "Todo lo del Brillo Total +\nAsientos, techo y alfombras limpiados a fondo\nManchas difíciles tratadas\nMotor limpio y protegido\nPlásticos renovados\nOlor a nuevo",
    pasos: ["Revisión de llegada con fotos", "Motor: desengrasante y enjuague", "Prelavado con espuma", "Lavado a mano", "Aros y llantas a fondo", "Secado", "Encerado carnauba", "Asientos y techo con APC y cepillo", "Alfombras a fondo", "Plásticos y tablero", "Vidrios", "Aroma", "Control de calidad y fotos"],
    receta: { shampoo: 1, apc: 2, motor: 1, llantas: 1, tablero: 1, vidrios: 1, cera: 1, aroma: 1, fundas: 1 } },
  { nombre: "Limpieza de motor", categoria: "adicional", precio: 35, minutos: 30, orden: 10, porTamano: false, receta: { motor: 1 }, descripcion: "Motor limpio y protegido, sin grasa." },
  { nombre: "Remoción de pelos de mascota", categoria: "adicional", precio: 30, minutos: 40, orden: 11, porTamano: true, receta: { apc: 0.5 }, descripcion: "Asientos y alfombras libres de pelos." },
  { nombre: "Limpieza de sensores y cámaras", categoria: "adicional", precio: 15, minutos: 15, orden: 12, porTamano: false, receta: { vidrios: 0.3 }, descripcion: "Sensores de estacionamiento y cámaras limpios para que funcionen bien." }
];
const PLANES = [
  { nombre: "Club AUTOCARE", tipo: "mensual", precio: 139, vigencia: 30, destacado: true,
    incluye: "2 Brillo Total al mes en tu día fijo · prioridad de horario · 10% en adicionales · sellos dobles" },
  { nombre: "Plan Semanal", tipo: "mensual", precio: 149, vigencia: 30,
    incluye: "4 lavados Esencial al mes (1 por semana) · tu auto siempre limpio · prioridad de horario" }
];
const ACTIVOS = [
  { nombre: "Hidrolavadora portátil", tipo: "equipo", costo: 140, vidaMeses: 24, cadaDias: 30 },
  { nombre: "Aspiradora inalámbrica 2 en 1", tipo: "equipo", costo: 103.27, vidaMeses: 24, cadaDias: 30 },
  { nombre: "Espumadora eléctrica (foam)", tipo: "equipo", costo: 86.74, vidaMeses: 24, cadaDias: 30 },
  { nombre: "Kit de microfibras y toallas", tipo: "herramienta", costo: 40, vidaMeses: 6, cadaDias: 0 },
  { nombre: "Cepillo quitapelos", tipo: "herramienta", costo: 4.75, vidaMeses: 12, cadaDias: 0 },
  { nombre: "Auto (servicios ligeros y cerca)", tipo: "vehiculo", costo: 0, vidaMeses: 0, cadaDias: 90, notas: "Para servicios ligeros o zonas cercanas." },
  { nombre: "Camioneta (servicios pesados o lejos)", tipo: "vehiculo", costo: 0, vidaMeses: 0, cadaDias: 90, notas: "De mi papá. Para detallados, equipos pesados o zonas lejanas." }
];
const POR_COMPRAR = [
  { item: "SET 120 Extreme Wash (motor, APC, shampoo, llantas y tablero, 4 L c/u)", precio: 120, prioridad: 1, donde: "Extreme Wash · 998 396 212", revisar: "Que vengan los 5 galones sellados" },
  { item: "New Glass limpiavidrios 4 L", precio: 25, prioridad: 1, donde: "Auto Premium (Extreme Wash)" },
  { item: "Shine Wax cera carnauba 500 ml", precio: 25, prioridad: 1, donde: "Auto Premium (Extreme Wash)" },
  { item: "Aromas Fancy 250 ml", precio: 15, prioridad: 2, donde: "Auto Premium (Extreme Wash)" },
  { item: "Beats Degreaser desengrasante de aros 4 L", precio: 45, prioridad: 3, donde: "Auto Premium (Extreme Wash)", revisar: "No usar en aros pintados" }
];

export function yaCargada() { return !!D.ajuste("semillaCargada"); }
export function aplicar() {
  const n = { productos: 0, servicios: 0, planes: 0, activos: 0, porComprar: 0 };
  const existe = (e, nombre, k = "nombre") => D.lista(e).find(x => String(x[k] || "").toLowerCase() === nombre.toLowerCase());
  let prov = existe("proveedores", "Extreme Wash / Auto Premium");
  if (!prov) prov = D.guardar("proveedores", { nombre: "Extreme Wash / Auto Premium", rubro: "Productos de limpieza automotriz", tel: "998396212", notas: "@Extremewash.pe · catálogo 2026" });
  const ids = {};
  PRODUCTOS.forEach(p => {
    const ya = existe("productos", p.nombre);
    if (ya) { ids[p.k] = ya.id; return; }
    const { k, ...r } = p;
    ids[k] = D.guardar("productos", Object.assign({ stock: 0, activo: true, proveedorId: prov.id }, r)).id; n.productos++;
  });
  SERVICIOS.forEach(s => {
    if (existe("servicios", s.nombre)) return;
    D.guardar("servicios", Object.assign({ estado: "activo", web: true }, s, {
      pasos: (s.pasos || []).map(t => ({ t })), receta: Object.keys(s.receta || {}).map(k => ({ productoId: ids[k], usos: s.receta[k] })).filter(x => x.productoId)
    })); n.servicios++;
  });
  PLANES.forEach(p => { if (!existe("planes", p.nombre)) { D.guardar("planes", Object.assign({ activo: true, web: true }, p)); n.planes++; } });
  ACTIVOS.forEach(a => { if (!existe("activos", a.nombre)) { D.guardar("activos", Object.assign({ estado: "operativo", fechaCompra: hoy(), residual: 0 }, a)); n.activos++; } });
  POR_COMPRAR.forEach(p => { if (!existe("porComprar", p.item, "item")) { D.guardar("porComprar", Object.assign({ tipo: "insumo", cant: 1, estado: "pendiente" }, p)); n.porComprar++; } });
  const neg = D.ajuste("negocio", {}), vacio = k => !neg[k];
  D.fijarAjuste("negocio", Object.assign({}, neg, {
    nombre: neg.nombre || "AUTOCARE", eslogan: neg.eslogan || "Detailing a domicilio en Arequipa",
    tel: neg.tel || "945798876", distrito: vacio("distrito") || neg.distrito === "Arequipa" ? "Cayma, Arequipa" : neg.distrito,
    zonas: neg.zonas || "Cayma, Yanahuara, Cerro Colorado, Sachaca, Cercado y alrededores (otras zonas, consultar)",
    pagos: neg.pagos || "Efectivo, Yape o Plin", yape: neg.yape || { numero: "945798876", titular: "Sebastián Paredes" },
    redes: Object.assign({ ig: "autocare.pe" }, neg.redes || {})
  }));
  if (!D.ajuste("horario")) {
    const dias = {}; for (let d = 0; d < 7; d++) dias[d] = [["07:00", "20:00"]];
    D.fijarAjuste("horario", { dias, intervalo: 30, traslado: 30, maxHoras: 8, anticipacion: 6, diasAdelante: 21, bloqueos: [] });
  }
  D.fijarAjuste("fidelidad", Object.assign({}, D.ajuste("fidelidad", {}), { activo: true, manual: true, cada: 8, regalo: 2, bono: 1,
    premio: "Tu regalo a elegir: un Esencial gratis o 40% de descuento en el Detallado Premium" }));
  if (!D.ajuste("contenidoMetas")) D.fijarAjuste("contenidoMetas", { porSemana: 5, reels: 3 });
  D.fijarAjuste("semillaCargada", { fecha: hoy(), n });
  return n;
}

// AUTOCARE · Datos de ejemplo para practicar: clientes, autos, citas, órdenes, cobros, consultas y gastos falsos.
// Todo queda marcado como «práctica» y se borra junto desde Mis datos. Aprender con datos parecidos a los
// reales es más rápido que leer un manual (aprender haciendo).
import * as D from "./datos.js";
import * as N from "./negocio.js";
import { hoy, sumarDias, msDe } from "./util.js";

const CLIENTES = [
  ["Carla", "Medina (prueba)", "Yanahuara", "Calle Misti 210", "Toyota", "Yaris", "auto", "Instagram"],
  ["Jorge", "Pinto (prueba)", "Cayma", "Av. Bolognesi 455", "Kia", "Sportage", "suv", "Recomendado"],
  ["Lucía", "Zegarra (prueba)", "Cerro Colorado", "Urb. La Libertad B-12", "Hyundai", "Tucson", "suv", "Google"],
  ["Marco", "Valdivia (prueba)", "Sachaca", "Calle Arica 98", "Nissan", "Frontier", "pickup", "WhatsApp"],
  ["Ana", "Rivera (prueba)", "José Luis Bustamante", "Av. Dolores 1500", "Suzuki", "Swift", "auto", "Instagram"],
  ["Diego", "Flores (prueba)", "Cayma", "Condominio Los Álamos, torre 2", "Toyota", "Hilux", "pickup", "Sticker / QR"]];

/** Crea el set de ejemplo. Activa el modo práctica si no lo está. Devuelve cuántos registros creó. */
export async function cargarEjemplo() {
  const yo = D.yo() || {};
  if (!D.enPractica()) D.fijarAjuste("practica", { activo: true, desde: Date.now(), por: yo.nombre || "" });
  let serv = N.serviciosActivos();
  if (!serv.length) { const m = await import("./semilla.js"); m.aplicar(); serv = N.serviciosActivos(); }
  if (!serv.length) throw new Error("Primero agrega tus servicios en Configuración → Servicios y precios.");
  const paquetes = serv.filter(s => s.paquete).sort((a, b) => (a.precio || 0) - (b.precio || 0));
  const basico = paquetes[0] || serv[0], medio = paquetes[1] || basico, premium = paquetes[paquetes.length - 1] || basico;
  const H = hoy(), ej = { ejemplo: true }; let n = 0;
  const item = s => ({ servicioId: s.id, nombre: s.nombre, precio: s.precio || 0, minutos: s.minutos || 90, cant: 1 });
  const cls = CLIENTES.map((c, i) => D.guardar("clientes", Object.assign({ nombre: c[0], apellido: c[1], tel: "90000000" + (i + 1), distrito: c[2], direccion: c[3], canal: c[7],
    acepta: true, notas: i === 0 ? "Prefiere aroma suave. Deja las llaves en portería." : "", sellos: [3, 1, 0, 0, 2, 0][i] }, ej)));
  const vs = cls.map((c, i) => D.guardar("vehiculos", Object.assign({ clienteId: c.id, _cliente: c.nombre, placa: "PRU-0" + (10 + i), marca: CLIENTES[i][4], modelo: CLIENTES[i][5], tamano: CLIENTES[i][6], color: ["Blanco", "Gris", "Rojo", "Negro", "Azul", "Plata"][i] }, ej)));
  n += cls.length + vs.length;
  // historial: servicios entregados y cobrados
  [[0, -45, basico], [0, -24, medio], [0, -4, medio], [1, -30, premium], [2, -60, basico], [4, -12, medio], [4, -40, basico]].forEach(([i, d, s]) => {
    const f = sumarDias(H, d), cli = cls[i], v = vs[i];
    const o = D.guardar("ordenes", Object.assign({ fecha: f, estado: "entregado", clienteId: cli.id, vehiculoId: v.id, _cliente: cli.nombre + " " + cli.apellido, _vehiculo: v.marca + " " + v.modelo + " (" + v.placa + ")",
      tamano: v.tamano, items: [item(s)], total: s.precio || 0, cobro: "normal", minutosReales: (s.minutos || 90) + 10, entregado: msDe(f, "12:00"), calificacion: 5 }, ej));
    D.guardar("pagos", Object.assign({ fecha: f, monto: s.precio || 0, metodo: i % 2 ? "efectivo" : "yape", ordenId: o.id, clienteId: cli.id, _cliente: o._cliente, concepto: "Orden " + (o.numero || ""), verificado: true }, ej));
    n += 2;
  });
  // agenda: hoy y mañana
  const cita = (i, f, hora, s, estado, extra) => D.guardar("citas", Object.assign({ fecha: f, hora, minutos: s.minutos || 90, clienteId: cls[i].id, vehiculoId: vs[i].id, _cliente: cls[i].nombre + " " + cls[i].apellido,
    _servicios: s.nombre, servicios: [s.id], tamano: vs[i].tamano, total: s.precio || 0, direccion: cls[i].direccion + ", " + cls[i].distrito, estado }, ej, extra || {}));
  cita(1, H, "10:00", medio, "confirmada"); cita(2, H, "15:30", basico, "confirmada");
  cita(3, sumarDias(H, 1), "09:00", premium, "solicitada", { origen: "web" }); cita(5, sumarDias(H, 1), "14:00", medio, "confirmada");
  n += 4;
  // ventas: consultas, cotización y seguimiento
  D.guardar("leads", Object.assign({ fecha: H, nombre: "Rodrigo Salas (prueba)", tel: "900000011", canal: "Instagram", interes: "Detallado interior para SUV", etapa: "nuevo", creado: Date.now() - 25 * 60000 }, ej));
  D.guardar("leads", Object.assign({ fecha: sumarDias(H, -1), nombre: "Paola Ríos (prueba)", tel: "900000012", canal: "WhatsApp", interes: "Precio de lavado completo", etapa: "contactado" }, ej));
  D.guardar("cotizaciones", Object.assign({ fecha: sumarDias(H, -1), clienteId: cls[2].id, _cliente: cls[2].nombre + " " + cls[2].apellido, estado: "enviada", validez: 7,
    items: [{ nombre: premium.nombre, precio: premium.precio || 0, cant: 1 }], total: premium.precio || 0, nota: "Incluye limpieza de asientos." }, ej));
  D.guardar("tareas", Object.assign({ fecha: sumarDias(H, 1), titulo: "Preguntarle a Lucía (prueba) si acepta la cotización", tipo: "whatsapp", prioridad: "media", clienteId: cls[2].id, hecho: false, asignadoId: D.responsable("ventas") || yo.id }, ej));
  // un gasto
  D.guardar("gastos", Object.assign({ fecha: H, categoria: "combustible", descripcion: "Gasolina (prueba)", monto: 25, metodo: "efectivo" }, ej));
  n += 5;
  return n;
}

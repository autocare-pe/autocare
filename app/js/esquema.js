// AUTOCARE · diccionario de la app
// Nombres, estados y listas fijas. Si agregas un estado aquí, la app lo muestra en todos lados.
// "mod" debe coincidir con ENTIDADES en Config.gs del servidor (quién puede cambiar cada lista).

export const ENT = {
  clientes: { n: "Clientes", uno: "cliente", mod: ["clientes", "agenda", "ordenes", "comercial"] },
  vehiculos: { n: "Vehículos", uno: "vehículo", mod: ["clientes", "agenda", "ordenes"] },
  servicios: { n: "Servicios", uno: "servicio", mod: ["config"], base: true },
  planes: { n: "Planes", uno: "plan", mod: ["config"], base: true },
  membresias: { n: "Membresías", uno: "membresía", mod: ["clientes", "finanzas"] },
  leads: { n: "Prospectos", uno: "prospecto", mod: ["comercial"] },
  cotizaciones: { n: "Cotizaciones", uno: "cotización", mod: ["comercial"] },
  citas: { n: "Agenda", uno: "cita", mod: ["agenda", "ordenes"] },
  ordenes: { n: "Órdenes", uno: "orden", mod: ["ordenes"] },
  pagos: { n: "Cobros", uno: "cobro", mod: ["finanzas", "ordenes"] },
  gastos: { n: "Gastos", uno: "gasto", mod: ["finanzas", "inventario", "activos"], ver: ["finanzas"] },
  productos: { n: "Inventario", uno: "producto", mod: ["inventario", "ordenes"] },
  movimientos: { n: "Kardex", uno: "movimiento", mod: ["inventario", "ordenes"] },
  compras: { n: "Compras", uno: "compra", mod: ["inventario"] },
  porComprar: { n: "Por comprar", uno: "pendiente de compra", mod: ["inventario"] },
  proveedores: { n: "Proveedores", uno: "proveedor", mod: ["inventario", "finanzas"] },
  activos: { n: "Activos", uno: "activo", mod: ["activos"] },
  mantenimientos: { n: "Mantenimientos", uno: "mantenimiento", mod: ["activos"] },
  contenido: { n: "Contenido", uno: "publicación", mod: ["marketing"] },
  metricas: { n: "Métricas de redes", uno: "métrica", mod: ["marketing"] },
  campanas: { n: "Campañas", uno: "campaña", mod: ["comercial", "marketing"] },
  plantillas: { n: "Plantillas", uno: "plantilla", mod: ["comercial", "config"], base: true },
  tareas: { n: "Seguimientos", uno: "seguimiento", mod: ["comercial", "agenda", "ordenes", "clientes"] },
  resenas: { n: "Reseñas", uno: "reseña", mod: ["marketing", "clientes"] },
  reclamos: { n: "Reclamos", uno: "reclamo", mod: ["clientes", "ordenes"] },
  cierres: { n: "Cierres de caja", uno: "cierre", mod: ["finanzas"] },
  transferencias: { n: "Reparto de cobros", uno: "transferencia", mod: ["finanzas"] },
  objetivos: { n: "Objetivos", uno: "objetivo", mod: ["direccion"] },
  revisiones: { n: "Revisiones semanales", uno: "revisión", mod: ["direccion"] },
  mejoras: { n: "Mejoras", uno: "mejora", mod: ["direccion", "ordenes"] },
  costosFijos: { n: "Costos fijos", uno: "costo fijo", mod: ["finanzas"] }
};
export const AJUSTES_MOD = { plan: "direccion", metasKpi: "direccion", distribucion: "finanzas", galeria: "marketing", contenidoMetas: "marketing" };

export const MODULOS = {
  direccion: "Dirección", agenda: "Agenda", ordenes: "Órdenes", clientes: "Clientes", comercial: "Ventas y campañas",
  marketing: "Marketing", finanzas: "Finanzas", inventario: "Inventario", activos: "Activos", config: "Configuración"
};

// ---------------------------------------------------------------- estados (n = nombre, c = color)
export const ESTADOS = {
  citas: {
    solicitada: { n: "Por confirmar", c: "ambar" }, confirmada: { n: "Confirmada", c: "azul" }, en_curso: { n: "En curso", c: "oro" },
    completada: { n: "Completada", c: "verde" }, cancelada: { n: "Cancelada", c: "" }, no_asistio: { n: "No se realizó", c: "rojo" }
  },
  ordenes: {
    recepcion: { n: "Recepción", c: "azul", paso: 0 }, proceso: { n: "En proceso", c: "oro", paso: 1 }, calidad: { n: "Control de calidad", c: "violeta", paso: 2 },
    listo: { n: "Listo para entregar", c: "verde", paso: 3 }, entregado: { n: "Entregado", c: "", paso: 4 }, anulado: { n: "Anulado", c: "rojo", paso: -1 }
  },
  leads: {
    nuevo: { n: "Nuevo", c: "ambar" }, contactado: { n: "Contactado", c: "azul" }, cotizado: { n: "Cotizado", c: "violeta" },
    agendado: { n: "Agendado", c: "oro" }, ganado: { n: "Ganado", c: "verde" }, perdido: { n: "Perdido", c: "" }
  },
  cotizaciones: {
    borrador: { n: "Borrador", c: "" }, enviada: { n: "Enviada", c: "azul" }, aceptada: { n: "Aceptada", c: "verde" },
    rechazada: { n: "No aceptada", c: "rojo" }, vencida: { n: "Vencida", c: "ambar" }
  },
  contenido: {
    idea: { n: "Idea", c: "" }, borrador: { n: "En preparación", c: "violeta" }, listo: { n: "Listo para subir", c: "oro" },
    programado: { n: "Programado", c: "azul" }, publicado: { n: "Publicado", c: "verde" }, fallo: { n: "No se publicó", c: "rojo" }
  },
  reclamos: { abierto: { n: "Abierto", c: "rojo" }, en_proceso: { n: "En proceso", c: "ambar" }, resuelto: { n: "Resuelto", c: "verde" } },
  mejoras: { idea: { n: "Idea", c: "" }, probando: { n: "Probando", c: "oro" }, adoptada: { n: "Adoptada", c: "verde" }, descartada: { n: "Descartada", c: "rojo" } },
  objetivos: { en_curso: { n: "En curso", c: "oro" }, logrado: { n: "Logrado", c: "verde" }, no_logrado: { n: "No logrado", c: "rojo" } },
  membresias: { activa: { n: "Activa", c: "verde" }, vencida: { n: "Vencida", c: "ambar" }, cancelada: { n: "Cancelada", c: "" } },
  compras: { pendiente: { n: "Por recibir", c: "ambar" }, recibida: { n: "Recibida", c: "verde" } },
  porComprar: { pendiente: { n: "Pendiente", c: "ambar" }, comprado: { n: "Comprado", c: "verde" } },
  activos: { operativo: { n: "Operativo", c: "verde" }, mantenimiento: { n: "En mantenimiento", c: "ambar" }, baja: { n: "De baja", c: "" } },
  campanas: { borrador: { n: "Borrador", c: "" }, enviando: { n: "Enviando", c: "oro" }, terminada: { n: "Terminada", c: "verde" } },
  servicios: { activo: { n: "Activo", c: "verde" }, pausado: { n: "Pausado", c: "" } },
  clientes: { activo: { n: "Activo", c: "verde" }, inactivo: { n: "Inactivo", c: "" } }
};
export function estadoDe(ent, v) { return (ESTADOS[ent] || {})[v] || { n: v || "—", c: "" }; }
export function opcionesEstado(ent) { return Object.entries(ESTADOS[ent] || {}).map(([v, e]) => ({ v, n: e.n })); }

export const PASOS_ORDEN = ["recepcion", "proceso", "calidad", "listo", "entregado"];

export const COBROS = {
  normal: { n: "Normal", d: "Se cobra el total" },
  plan: { n: "Plan del cliente", d: "Lo cubre su membresía" },
  premio: { n: "Premio de fidelidad", d: "Canjea sus sellos" },
  cortesia: { n: "Cortesía", d: "Sin cobro, por decisión tuya" },
  garantia: { n: "Garantía", d: "Repaso sin cobro por un reclamo" }
};
export const METODOS = { efectivo: "Efectivo", yape: "Yape", plin: "Plin", transferencia: "Transferencia", tarjeta: "Tarjeta" };
export const CATEGORIAS_GASTO = {
  insumos: "Insumos y productos", combustible: "Combustible", movilidad: "Movilidad y peajes", equipos: "Equipos y herramientas",
  mantenimiento: "Mantenimiento", marketing: "Publicidad y marketing", personal: "Ayudantes y personal", sueldo: "Tu sueldo",
  telefono: "Celular e internet", servicios: "Agua, luz y local", impuestos: "Impuestos y trámites", banco: "Comisiones bancarias", otros: "Otros"
};
export const CATEGORIAS_SERVICIO = {
  lavado: "Lavado", interior: "Interior", exterior: "Exterior y pintura", proteccion: "Protección", motor: "Motor", especial: "Especiales", adicional: "Adicionales"
};
export const CANALES = ["Instagram", "Facebook", "TikTok", "WhatsApp", "Google", "Recomendado", "Sticker / QR", "Lo vio trabajando", "Web", "Otro"];
export const TAMANOS = [
  { id: "auto", n: "Auto o sedán", pct: 0, min: 0 }, { id: "suv", n: "SUV", pct: 20, min: 15 },
  { id: "pickup", n: "Camioneta o pick-up", pct: 30, min: 20 }, { id: "van", n: "Van o minivan", pct: 40, min: 30 }
];
export const MOTIVOS_PERDIDA = ["Precio", "Eligió a otro", "No respondió", "Fuera de mi zona", "No había horario", "Solo preguntaba", "Otro"];
export const AREAS_MEJORA = ["Servicio", "Atención al cliente", "Ventas", "Marketing", "Finanzas", "Equipos e insumos", "Tiempo y logística", "Otro"];
export const UNIDADES = ["unidad", "litro", "galón", "ml", "kg", "frasco", "paquete", "rollo", "par"];

// Revisión de llegada (zonas del auto) y control de calidad: puedes cambiarlas en Configuración → Servicios
export const ZONAS = ["Parachoques delantero", "Capó", "Techo", "Lado izquierdo", "Lado derecho", "Maletera", "Parachoques trasero",
  "Faros y micas", "Vidrios y espejos", "Aros y llantas", "Asientos y tapiz", "Tablero y consola", "Alfombras y piso", "Techo interior"];
export const DANOS = { ok: "Bien", rayon: "Rayón", abolladura: "Abolladura", mancha: "Mancha", rotura: "Rotura o falta pieza", otro: "Otro" };
export const CALIDAD = [
  "Carrocería sin restos de shampoo ni marcas de agua", "Vidrios por dentro y por fuera, sin vetas", "Aros y llantas limpios; llantas con acondicionador",
  "Asientos, alfombras y maletera aspirados", "Tablero, consola y puertas sin polvo", "Marcos de puertas y bisagras limpios",
  "Sin olor a humedad; aroma solo si el cliente quiere", "Fotos de después tomadas con buena luz"
];

// Reparto de cada cobro (Profit First, Mike Michalowicz). Puedes cambiar los % en Finanzas → Reparto.
export const CUENTAS = [
  { id: "ganancia", n: "Ganancia", pct: 5, d: "Lo que queda para ti como dueño. Se retira cada trimestre." },
  { id: "sueldo", n: "Tu sueldo", pct: 50, d: "Lo que te pagas por trabajar en el negocio." },
  { id: "impuestos", n: "Impuestos", pct: 5, d: "Para SUNAT. Ajusta el % según tu régimen (pregúntale a tu contador)." },
  { id: "operacion", n: "Operación", pct: 30, d: "Gastos del día a día: combustible, celular, publicidad." },
  { id: "vehiculo", n: "Fondo del vehículo y equipos", pct: 10, d: "Para mantenimiento, SOAT y cambiar equipos sin endeudarte." }
];

export const PILARES = {
  antesdespues: { n: "Antes y después", d: "La prueba de tu trabajo. El formato que más vende en detailing." },
  educativo: { n: "Consejo", d: "Enseña algo útil: cada cuánto lavar, cómo cuidar la pintura." },
  prueba: { n: "Opinión de cliente", d: "Reseñas y recomendaciones: la gente confía en otros clientes." },
  oferta: { n: "Oferta o paquete", d: "Precio, paquete o cupos de la semana. Una de cada cinco, no más." },
  detras: { n: "Detrás de cámaras", d: "Tú trabajando, tus productos, tu ruta del día. Genera confianza." }
};
export const FORMATOS = { post: "Publicación", carrusel: "Carrusel", reel: "Reel o video", historia: "Historia" };
export const REDES = { instagram: "Instagram", facebook: "Facebook", tiktok: "TikTok" };

// Mensajes de WhatsApp. Puedes cambiar cualquiera en Campañas → Plantillas.
// Variables: {nombre} {negocio} {fecha} {hora} {servicio} {total} {portal} {resena} {codigo} {direccion} {adelanto} {yape} {placa}
export const PLANTILLAS = [
  { clave: "confirmar", nombre: "Confirmar cita", categoria: "agenda", texto: "Hola {nombre}, te escribe {negocio}. Te confirmo tu cita el {fecha} a las {hora} para {servicio}. Dirección: {direccion}. Cualquier cambio me avisas por aquí. ¡Gracias!" },
  { clave: "adelanto", nombre: "Pedir adelanto", categoria: "agenda", texto: "Hola {nombre}, para separar tu cita del {fecha} a las {hora} te pido un adelanto de {adelanto} por Yape al {yape}. Me envías la captura por aquí y queda confirmada." },
  { clave: "recordatorio", nombre: "Recordatorio un día antes", categoria: "agenda", texto: "Hola {nombre}, te recuerdo que mañana {fecha} a las {hora} paso a atender tu auto ({servicio}). Si necesitas cambiar la hora, avísame. Mira tu cita aquí: {portal}" },
  { clave: "camino", nombre: "Voy en camino", categoria: "agenda", texto: "Hola {nombre}, ya voy en camino. Llego en unos 20 minutos. 🚗" },
  { clave: "recepcion", nombre: "Revisión de llegada para firmar", categoria: "ordenes", texto: "Hola {nombre}, ya revisé tu auto antes de empezar. Aquí ves las fotos y lo que encontré; fírmalo desde tu celular, por favor: {portal}" },
  { clave: "listo", nombre: "Tu auto está listo", categoria: "ordenes", texto: "¡Listo, {nombre}! Tu auto quedó impecable. Total: {total}. Mira las fotos de antes y después aquí: {portal}" },
  { clave: "resena", nombre: "Pedir reseña", categoria: "ordenes", texto: "Gracias por confiar en {negocio}, {nombre}. Si te gustó el trabajo, ¿me ayudas con una reseña en Google? Me toma 1 minuto de tu tiempo y me ayuda muchísimo: {resena}" },
  { clave: "cotizacion", nombre: "Enviar cotización", categoria: "comercial", texto: "Hola {nombre}, te envío la cotización para tu auto: {total}. Puedes verla y aceptarla aquí: {portal}" },
  { clave: "respuesta", nombre: "Responder consulta", categoria: "comercial", texto: "Hola {nombre}, gracias por escribir a {negocio}. Atiendo a domicilio con agua y equipos propios. ¿Qué auto tienes y en qué distrito estás? Así te paso el precio exacto y los horarios libres." },
  { clave: "volver", nombre: "Le toca su mantenimiento", categoria: "campana", texto: "Hola {nombre}, ya pasó un mes desde el último lavado de tu {placa}. ¿Te reservo un espacio esta semana? Tengo libre el {fecha}." },
  { clave: "dormido", nombre: "Hace tiempo que no vienes", categoria: "campana", texto: "Hola {nombre}, hace tiempo no atiendo tu auto. Esta semana tengo un 10% de descuento para clientes de siempre. ¿Te separo un espacio?" },
  { clave: "cumple", nombre: "Feliz cumpleaños", categoria: "campana", texto: "¡Feliz cumpleaños, {nombre}! 🎉 De regalo, tu próximo lavado tiene 15% de descuento este mes. Escríbeme cuando quieras." },
  { clave: "referido", nombre: "Invitar a recomendar", categoria: "campana", texto: "Hola {nombre}, gracias por ser cliente de {negocio}. Si me recomiendas, tu amigo usa tu código {codigo} al reservar y tú sumas sellos para tu lavado gratis: {portal}" },
  { clave: "plan", nombre: "Ofrecer plan mensual", categoria: "campana", texto: "Hola {nombre}, como lavas seguido, te conviene el plan mensual: tu auto siempre limpio, con día fijo y precio especial. ¿Te paso los detalles?" }
];

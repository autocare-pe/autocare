// AUTOCARE · diccionario de la app
// Nombres, estados y listas fijas. Si agregas un estado aquí, la app lo muestra en todos lados.
// "mod" debe coincidir con ENTIDADES en Config.gs del servidor (quién puede cambiar cada lista).

export const ENT = {
  clientes: { n: "Clientes", uno: "cliente", mod: ["clientes", "agenda", "ordenes", "comercial"] },
  vehiculos: { n: "Vehículos", uno: "vehículo", mod: ["clientes", "agenda", "ordenes"] },
  servicios: { n: "Servicios", uno: "servicio", mod: ["config"], base: true },
  planes: { n: "Planes", uno: "plan", mod: ["config"], base: true },
  membresias: { n: "Membresías", uno: "membresía", mod: ["clientes", "finanzas"] },
  leads: { n: "Consultas (prospectos)", uno: "consulta", mod: ["comercial"] },
  cotizaciones: { n: "Cotizaciones", uno: "cotización", mod: ["comercial"] },
  citas: { n: "Agenda", uno: "cita", mod: ["agenda", "ordenes"] },
  ordenes: { n: "Órdenes", uno: "orden", mod: ["ordenes"] },
  pagos: { n: "Cobros", uno: "cobro", mod: ["finanzas", "ordenes"] },
  gastos: { n: "Gastos", uno: "gasto", mod: ["finanzas", "inventario", "activos"], ver: ["finanzas"] },
  productos: { n: "Inventario", uno: "producto", mod: ["inventario", "ordenes"] },
  movimientos: { n: "Movimientos de inventario", uno: "movimiento", mod: ["inventario", "ordenes"] },
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
// Áreas de trabajo de cada persona (deciden su Inicio y sus avisos). Gerber (The E-Myth): el técnico, el gerente
// y el emprendedor son trabajos distintos; con una socia, cada uno tiene dueño claro (Wickman, Traction).
export const AREAS = [
  { v: "campo", n: "Servicio en campo", d: "Agenda del día, órdenes, recepción y calidad", i: "car" },
  { v: "ventas", n: "WhatsApp y ventas", d: "Consultas, cotizaciones, confirmar citas y seguimientos", i: "message-circle" },
  { v: "pagos", n: "Cobros y finanzas", d: "Adelantos, verificar pagos, caja y reparto", i: "wallet" },
  { v: "logistica", n: "Logística", d: "Ruta de mañana, compras, stock y equipos", i: "truck" },
  { v: "marketing", n: "Marketing", d: "Contenido, campañas, reseñas y clientes que les toca volver", i: "megaphone" }];
// Modo práctica: lo nuevo de estas listas se marca como prueba y se borra junto (la configuración no)
export const ENT_PRACTICA = ["clientes", "vehiculos", "membresias", "leads", "cotizaciones", "citas", "ordenes", "pagos", "gastos", "movimientos", "compras",
  "porComprar", "mantenimientos", "contenido", "metricas", "campanas", "tareas", "resenas", "reclamos", "cierres", "transferencias", "objetivos", "revisiones", "mejoras"];
export const AJUSTES_MOD = { plan: "direccion", metasKpi: "direccion", distribucion: "finanzas", socios: "finanzas", galeria: "marketing", contenidoMetas: "marketing" };

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
// Revisión final por partes del auto (Gawande, El efecto checklist): corta, solo lo que aplica a lo que hiciste,
// y con los «puntos que no pueden fallar» siempre. Cada servicio dice qué partes trabaja (Configuración → Servicios).
export const PARTES = { exterior: "Exterior", interior: "Interior", motor: "Motor", proteccion: "Cera o protección" };
export const CALIDAD = [
  { t: "Carrocería sin restos de shampoo ni marcas de agua", a: "exterior" },
  { t: "Aros limpios y llantas con acondicionador", a: "exterior" },
  { t: "Vidrios y espejos por fuera, sin vetas", a: "exterior" },
  { t: "Marcos de puertas, bisagras y tapa de combustible limpios", a: "exterior" },
  { t: "Asientos, alfombras y maletera aspirados", a: "interior" },
  { t: "Tablero, consola y puertas sin polvo", a: "interior" },
  { t: "Vidrios por dentro sin vetas", a: "interior" },
  { t: "Sin olor a humedad; aroma solo si el cliente quiere", a: "interior" },
  { t: "Motor sin agua en bornes ni conectores; tapas en su lugar", a: "motor" },
  { t: "Sin residuos blancos de cera en plásticos, gomas ni bordes", a: "proteccion" },
  { t: "Objetos del cliente en su lugar y nada nuestro olvidado en el auto", a: "siempre" },
  { t: "Fotos de después con los mismos ángulos que las de llegada", a: "siempre" }
];
// Lo que se usaba antes (lista fija). Si tu ajuste es exactamente esta lista, se usa la nueva por partes.
export const CALIDAD_ANTERIOR = [
  "Carrocería sin restos de shampoo ni marcas de agua", "Vidrios por dentro y por fuera, sin vetas", "Aros y llantas limpios; llantas con acondicionador",
  "Asientos, alfombras y maletera aspirados", "Tablero, consola y puertas sin polvo", "Marcos de puertas y bisagras limpios",
  "Sin olor a humedad; aroma solo si el cliente quiere", "Fotos de después tomadas con buena luz"
];

// Ruleta de premios (la misma regla que el servidor). Se activa y se ajusta en Fidelidad → Ruleta.
export const TIPOS_PREMIO = { sello: "Sello extra", regalo: "Regalo", adicional: "Adicional gratis", descuento: "Descuento", servicio: "Servicio gratis" };
export const RULETA_BASE = { activo: false, minimo: 40, dias: 7, vence: 45, premios: [
  { id: "sello", n: "1 sello extra en tu tarjeta", corto: "+1 sello", tipo: "sello", valor: 1, peso: 40, costo: 3 },
  { id: "aroma", n: "Aroma premium de regalo en tu próxima visita", corto: "Aroma", tipo: "regalo", valor: 0, peso: 30, costo: 2 },
  { id: "sensores", n: "Limpieza de sensores y cámaras gratis en tu próxima visita", corto: "Sensores", tipo: "adicional", valor: 15, peso: 18, costo: 3 },
  { id: "s10", n: "S/ 10 de descuento en tu próxima visita", corto: "S/ 10", tipo: "descuento", valor: 10, peso: 6, costo: 10 },
  { id: "motor", n: "Limpieza de motor gratis en tu próxima visita", corto: "Motor", tipo: "adicional", valor: 35, peso: 4, costo: 8, max: 4 },
  { id: "gratis", n: "Tu próximo Esencial gratis", corto: "¡Gratis!", tipo: "servicio", valor: 45, peso: 2, costo: 20, max: 1 }] };

// Merchandising: cada pieza con su QR, su frase gancho y lo que responde la página al escanear.
export const TIPOS_MERCH = { polo: "Polo", gorra: "Gorra", casaca: "Casaca o polera", sticker: "Sticker", tarjeta: "Tarjeta", volante: "Volante", auto: "Rotulado del auto", otro: "Otro" };
export const ESTADOS_MERCH = { idea: "Idea", diseno: "En diseño", cotizando: "Cotizando", produccion: "En producción", uso: "En uso", agotado: "Se acabó" };
// Ganchos: curiosidad (Loewenstein: la brecha de información), psicología inversa (Brehm: reactancia) y humor.
// La página que abre el QR cierra la curiosidad con la misma gracia y lleva a precios y fotos (Heath, Made to Stick).
export const GANCHOS = [
  { frase: "NO ESCANEES ESTO", sub: "si te gusta tu auto sucio", titulo: "Sabíamos que no ibas a resistir.", texto: "Ya que estás aquí: dejamos tu auto como nuevo sin que te muevas de casa. Mira cómo quedan y cuánto cuesta." },
  { frase: "TU AUTO TE ESTÁ JUZGANDO", sub: "escanea y descubre por qué", titulo: "Tranquilo, tiene solución.", texto: "Lo dejamos como nuevo donde estés, por dentro y por fuera. Mira el antes y después." },
  { frase: "¿QUÉ VIVE EN TUS ASIENTOS?", sub: "escanea, si te atreves", titulo: "Mejor no lo pienses.", texto: "Aspiramos, limpiamos a fondo y te mandamos el antes y después. Sin moverte de casa." },
  { frase: "ESCANEA Y MIRA EL ANTES Y DESPUÉS", sub: "nadie nos cree a la primera", titulo: "Compruébalo tú mismo.", texto: "Autos reales de Arequipa, lavados a domicilio. Desliza para comparar y separa tu hora en un minuto." }
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
// En órdenes también: {vehiculo} {tecnico} {hallazgos} {regalo}
export const PLANTILLAS = [
  { clave: "confirmar", nombre: "Confirmar cita", categoria: "agenda", texto: "Hola {nombre}, te escribe {negocio}. Te confirmo tu cita el {fecha} a las {hora} para {servicio}. Dirección: {direccion}. Cualquier cambio me avisas por aquí. ¡Gracias!" },
  { clave: "adelanto", nombre: "Pedir adelanto", categoria: "agenda", texto: "Hola {nombre}, para separar tu cita del {fecha} a las {hora} te pido un adelanto de {adelanto} por Yape al {yape}. Me envías la captura por aquí y queda confirmada." },
  { clave: "recordatorio", nombre: "Recordatorio un día antes", categoria: "agenda", texto: "Hola {nombre}, te recuerdo que mañana {fecha} a las {hora} paso a atender tu auto ({servicio}). Si necesitas cambiar la hora, avísame. Mira tu cita aquí: {portal}" },
  { clave: "camino", nombre: "Voy en camino", categoria: "agenda", texto: "Hola {nombre}, ya voy en camino. Llego en unos 20 minutos. 🚗" },
  // Danny Meyer (Setting the Table): primero el cuidado, luego el trámite. Langer (el «porque»): una razón aumenta la aceptación.
  // Thaler y Sunstein (Nudge): si todo está bien, no tiene que hacer nada (lo normal pasa solo).
  { clave: "recepcion", nombre: "Revisión de llegada", categoria: "ordenes", texto: "Hola {nombre}, soy {tecnico} de {negocio}. Antes de empezar revisé tu {vehiculo} y lo registré con fotos ({hallazgos}). Lo hago con todos los autos para cuidar el tuyo y que los dos tengamos la misma información.\n\nPuedes verlo aquí: {portal}\nSi todo está bien, no necesitas hacer nada 👍 Si ves algo distinto, respóndeme por aquí antes de que termine." },
  // Kahneman (pico y final): el cierre es lo que más recuerda. Heath (The Power of Moments): un detalle inesperado.
  { clave: "listo", nombre: "Tu auto está listo", categoria: "ordenes", texto: "¡Listo, {nombre}! Tu {vehiculo} quedó como nuevo ✨ Mira el antes y después aquí: {portal}{regalo}\nTotal: {total}. ¡Gracias por confiar en nosotros!" },
  { clave: "tarjeta", nombre: "Entregar su tarjeta digital", categoria: "ordenes", texto: "¡Gracias por confiar en {negocio}, {nombre}! Esta es tu tarjeta: ahí ves tus sellos, las fotos de antes y después de tu auto y separas tu próxima hora en 1 minuto. Guarda este enlace: {portal}" },
  // Reseña (Google: sin premios a cambio, sin presión en el lugar, a todos por igual). Cialdini: gratitud primero y
  // un pedido pequeño y concreto; Reichheld: una sola pregunta; permiso explícito para decir lo malo.
  { clave: "resena", nombre: "Pedir opinión y reseña", categoria: "ordenes", texto: "Hola {nombre}, gracias otra vez por dejarnos cuidar tu auto. ¿Cómo lo sentiste? Si tienes un minuto, cuéntalo en Google, bueno o malo: a otras personas de Arequipa les ayuda a elegir y a nosotros a mejorar. Con dos líneas basta: {resena}\nY si algo no quedó como esperabas, dímelo por aquí y lo solucionamos." },
  { clave: "cotizacion", nombre: "Enviar cotización", categoria: "comercial", texto: "Hola {nombre}, te envío la cotización para tu auto: {total}. Puedes verla y aceptarla aquí: {portal}" },
  { clave: "respuesta", nombre: "Responder consulta", categoria: "comercial", texto: "Hola {nombre}, gracias por escribir a {negocio}. Atiendo a domicilio con agua y equipos propios. ¿Qué auto tienes y en qué distrito estás? Así te paso el precio exacto y los horarios libres." },
  { clave: "volver", nombre: "Le toca su mantenimiento", categoria: "campana", texto: "Hola {nombre}, ya pasó un mes desde el último lavado de tu {placa}. ¿Te reservo un espacio esta semana? Tengo libre el {fecha}." },
  { clave: "dormido", nombre: "Hace tiempo que no vienes", categoria: "campana", texto: "Hola {nombre}, hace tiempo no atiendo tu auto. Esta semana tengo un 10% de descuento para clientes de siempre. ¿Te separo un espacio?" },
  { clave: "cumple", nombre: "Feliz cumpleaños", categoria: "campana", texto: "¡Feliz cumpleaños, {nombre}! 🎉 De regalo, tu próximo lavado tiene 15% de descuento este mes. Escríbeme cuando quieras." },
  { clave: "referido", nombre: "Invitar a recomendar", categoria: "campana", texto: "Hola {nombre}, gracias por ser cliente de {negocio}. Si me recomiendas, tu amigo usa tu código {codigo} al reservar y tú sumas sellos para tu lavado gratis: {portal}" },
  { clave: "plan", nombre: "Ofrecer plan mensual", categoria: "campana", texto: "Hola {nombre}, como lavas seguido, te conviene el plan mensual: tu auto siempre limpio, con día fijo y precio especial. ¿Te paso los detalles?" },
  // Respuestas rápidas: se arman con tus precios actuales. Cámbialas cuando cambies precios o estrategia.
  { clave: "r-precios", nombre: "¿Cuánto cuesta?", categoria: "respuesta", texto: "¡Hola! Gracias por escribir a {negocio}. Vamos a tu casa u oficina con agua, energía y productos profesionales; tú no te mueves.\n\nNuestros paquetes:\n{paquetes}\n\nEl más elegido es el del medio: es el que deja tu auto como nuevo por dentro y por fuera. ¿Qué auto tienes y en qué distrito estás? Te separo la hora: tengo libre el {libre}." },
  { clave: "r-lista", nombre: "Lista de precios completa", categoria: "respuesta", texto: "Estos son nuestros precios para auto o sedán:\n{precios}\n\nSUV y camionetas tienen un ajuste por tamaño ({tamanos}). Mira fotos y reserva en 1 minuto aquí: {web}" },
  { clave: "r-zona", nombre: "¿Van a mi zona?", categoria: "respuesta", texto: "¡Sí! Atendemos {zonas}. Si estás un poco más lejos, escríbeme tu dirección y lo coordinamos. ¿Te separo el {libre}?" },
  { clave: "r-caro", nombre: "Está caro", categoria: "respuesta", texto: "Te entiendo. Piensa que no pierdes 2 horas yendo y esperando en un car wash: vamos donde estés, con productos que cuidan la pintura y te enviamos fotos de antes y después. Si algo no queda bien, lo repasamos gratis. Si prefieres empezar con algo más simple, el paquete básico es ideal." },
  // Chris Voss (Never Split the Difference): nombra lo que siente («parece que…») y pregunta con «qué» o «cómo»,
  // o con una pregunta que invite a decir «no» (la gente se siente segura diciendo no).
  { clave: "r-pensar", nombre: "Lo voy a pensar", categoria: "respuesta", texto: "¡Claro, tómate tu tiempo! Parece que algo todavía no te termina de convencer. ¿Qué es lo que más te hace dudar? Si quieres, te separo una hora tentativa hasta mañana; si no te animas, la libero sin problema. ¿Sería mala idea?" },
  { clave: "r-descuento", nombre: "¿Me haces descuento?", categoria: "respuesta", texto: "Te entiendo, a todos nos gusta cuidar el bolsillo. El precio no lo bajo porque uso productos profesionales y te doy garantía de repaso, pero sí hay dos formas de pagar menos:\n1) Con un plan mensual cada servicio te sale más barato:\n{planes}\n2) Por cada amigo que me recomiendes sumas un sello para tu servicio de regalo.\n¿Cuál te acomoda más?" },
  { clave: "r-barato", nombre: "Otro lo hace más barato", categoria: "respuesta", texto: "Es justo que compares. Parece que quieres estar seguro de que vale la pena. ¿Qué es lo más importante para ti: que quede impecable, cuidar la pintura o no perder tu tiempo? Te cuento qué incluye el mío para que compares igual con igual: voy a tu casa, uso productos profesionales, te envío fotos de antes y después y, si algo no queda bien, lo repaso gratis." },
  { clave: "r-tiempo", nombre: "¿Cuánto demora?", categoria: "respuesta", texto: "El lavado completo toma alrededor de hora y media, y el detallado de 3 a 5 horas. Mientras tanto tú sigues con tu día; te avisamos al terminar y te mando las fotos." },
  { clave: "r-pago", nombre: "¿Cómo pago?", categoria: "respuesta", texto: "{pagos}, al terminar el servicio. Para servicios largos pedimos un adelanto pequeño para separar la hora." },
  { clave: "r-reserva", nombre: "Enviar enlace para reservar", categoria: "respuesta", texto: "Aquí ves fotos, precios y horas libres, y reservas en 1 minuto: {web}\nSi prefieres, dime día y hora y yo te la separo." },
  { clave: "wb-bienvenida", nombre: "WhatsApp Business: mensaje de bienvenida", categoria: "business", texto: "¡Hola! 👋 Gracias por escribir a {negocio}. Lavamos y detallamos tu auto donde estés, con agua y equipos propios. Mira precios, fotos y horas libres aquí: {web}\nTe respondo en unos minutos." },
  { clave: "wb-ausencia", nombre: "WhatsApp Business: mensaje de ausencia", categoria: "business", texto: "¡Hola! Ahora estoy atendiendo un auto y no puedo responder. Mientras tanto puedes ver precios y separar tu hora aquí: {web}\nTe escribo apenas termine." }
];

// AUTOCARE · Ayuda: primeros pasos, uso diario, actualizar, WhatsApp Business, Google, redes y preguntas frecuentes
import { html, useState } from "../../vendor/preact-htm.js";
import * as D from "../datos.js";
import * as N from "../negocio.js";
import { usarTitulo } from "../app.js";
import { Boton, Icono, Bloque, AvisoLinea, Fila, Buscador, Dinero, Numero, aviso, confirmar } from "../ui.js";
import { coincide, copiar } from "../util.js";
import { GLOSARIO } from "../guias.js";

const S = (t, ...p) => ({ t, p });
const C = (t, comp) => ({ t, p: [], comp });

// Kevin Kelly (1,000 True Fans) y Paul Jarvis (Company of One): no necesitas miles, necesitas que vuelvan
function Fans() {
  D.useDatos();
  const ots = D.lista("ordenes").filter(o => o.estado === "entregado" && Number(o.total) > 0);
  const ticketReal = ots.length ? Math.round(ots.reduce((a, o) => a + Number(o.total), 0) / ots.length) : 79;
  const fieles = D.lista("clientes").filter(c => (N.perfil(c.id).visitas || 0) >= 2).length;
  const [meta, setMeta] = useState(3000), [ticket, setTicket] = useState(ticketReal), [cada, setCada] = useState(3);
  const necesitas = Math.ceil((Number(meta) || 0) / Math.max(1, (Number(ticket) || 1) * (4.33 / Math.max(1, Number(cada) || 1))));
  return html`<div class="panel" style="margin:6px 0 2px;width:100%">
    <div class="rejilla"><${Dinero} etiqueta="Quiero vender al mes" valor=${meta} cambiar=${setMeta} decimales=${0} /><${Dinero} etiqueta="Ticket promedio" valor=${ticket} cambiar=${setTicket} decimales=${0} />
      <${Numero} etiqueta="Vuelve cada" valor=${cada} cambiar=${setCada} decimales=${0} sufijo="semanas" /></div>
    <p style="margin-top:12px;font-size:17px">Necesitas unos <b style="color:var(--oro-texto)">${necesitas} clientes fieles</b>. Hoy tienes ${fieles} que ya volvieron al menos una vez.</p>
    <p class="nota" style="margin-top:6px">No necesitas miles de seguidores: necesitas que esos clientes vuelvan. Para eso están la tarjeta, los recordatorios y el plan mensual.</p></div>`;
}
const TEMAS = [
  { id: "practica", t: "Practicar, corregir y borrar datos", i: "flask-conical", c: [
    S("Practica sin miedo", "Mis datos → activa «Practicar». Todo lo nuevo (clientes, citas, órdenes, cobros…) queda marcado como práctica, en tu celular y en el de tu socia. Con «Cargar datos de ejemplo» tienes clientes, citas y órdenes falsas para explorar."),
    S("Aprende haciendo", "Con la práctica activa, en Inicio aparece «Aprende practicando»: 8 pasos de un servicio completo que se marcan solos cuando los haces."),
    S("Corregir algo mal cargado", "Mis datos → toca la lista (por ejemplo Cobros) → toca el dato → cambia lo que necesites → Guardar. También directo: en Finanzas → Movimientos toca un cobro o gasto; en la ficha del cliente, ⋯ → Editar datos; en una orden, ⋯ → Editar servicios y precio; en Seguimientos, ⋯ → Editar."),
    S("Eliminar", "Mis datos → toca el dato → Eliminar. Un cliente se borra con todo su historial (citas, órdenes, cobros); una orden, con sus cobros, y lo que gastó vuelve al inventario. Siempre te pregunta antes."),
    S("Borrar toda la práctica", "Mis datos → «Borrar práctica»: se borra todo lo marcado, en los dos celulares. Tu configuración no se toca. Luego apaga «Practicar»."),
    S("Empezar de cero", "Mis datos → «Empezar de cero»: borra lo del día a día (eliges qué) y deja servicios, precios, productos, equipos y usuarios. Antes, se guarda una copia completa en tu Drive (carpeta Respaldos). La numeración vuelve a OT-0001."),
    S("¿No entiendes una pantalla?", "Toca el botón ? de arriba: te dice para qué sirve, cómo se usa y qué significa cada dato. Debajo de los campos difíciles hay una ayuda corta con ejemplos.")] },
  { id: "glosario", t: "Qué significa cada palabra", i: "book-open", c: GLOSARIO.map(([t, d]) => S(t, d)) },
  { id: "dia", t: "Tu día a día, paso a paso", i: "sun", c: [
    S("1. Llega una consulta", "Si llega por la web, te avisa Telegram y aparece en Ventas → Embudo. Si llega por WhatsApp o Instagram, anótala con «+ → Nueva consulta». Respóndela en menos de una hora con una respuesta rápida (Ventas → la consulta → Responder)."),
    S("2. Agenda la cita", "Desde la consulta toca «Agendar cita», o usa «+ → Nueva cita». La app te muestra las horas libres y calcula precio, duración y adelanto. Al guardar, avísale por WhatsApp con un toque."),
    S("3. El día del servicio", "Abre la cita y toca «Empezar servicio»: se crea la orden. En Recepción revisa el auto por zonas, toma fotos y pide la firma (en tu celular o por su enlace). Luego «Empezar el trabajo»: corre el cronómetro y marcas los pasos."),
    S("4. Control de calidad y entrega", "Revisa la lista de calidad, toma las fotos de después y aprueba. En «Listo» cobra (Yape, efectivo…), suma el sello y entrega. La app te propone pedir la reseña: es el mejor momento."),
    S("5. Al final del día", "Finanzas → Caja del día: revisa que el efectivo cuadre y ciérrala. Mira en Inicio a quién le toca volver mañana."),
    S("Cada lunes (15 minutos)", "Plan y revisión → Revisión semanal: mira tus números, escribe qué salió bien, qué salió mal y una sola cosa que harás distinto. Luego revisa el Tablero.")] },
  { id: "inicio", t: "Primeros pasos (una sola vez)", i: "flag", c: [
    S("Carga tu configuración inicial", "Con el botón de arriba se cargan tus paquetes, adicionales, plan mensual, productos de Extreme Wash con su costo por uso, equipos, vehículos y la tarjeta de 8 sellos. Después ajusta lo que quieras."),
    S("Revisa tus datos", "Configuración → Negocio: WhatsApp, Yape, zonas y redes. Configuración → Servicios y precios: revisa precios y tiempos. Configuración → Mi web: sube tu portada, antes y después y productos."),
    S("Activa los avisos", "Configuración → Avisos y redes: conecta tu bot de Telegram y activa las tareas automáticas (agenda de mañana, resumen del lunes, aviso antes de cada cita)."),
    S("Pon tus metas", "Tablero → Metas. Empieza con metas alcanzables en 3 meses.")] },
  { id: "actualizar", t: "Instalar y actualizar la app", i: "download", c: [
    S("Instalar en el iPhone", "Abre tu app en Safari (…/autocare/app/), toca Compartir → Agregar a pantalla de inicio. Para cambiar el ícono, elimina la app de la pantalla y vuelve a agregarla; tus datos siguen en tu hoja."),
    S("Cuando te envíe una versión nueva", "Descomprime el zip y súbelo a GitHub: tu repositorio → Add file → Upload files → arrastra las carpetas y archivos → Commit changes. En 2 minutos la app te avisa «Hay una versión nueva» → Actualizar. No subas config.js si ya pusiste tu servidor."),
    S("Si cambia el servidor", "Abre Apps Script → Config.gs → selecciona todo y pega el código nuevo → guarda → Implementar → Gestionar implementaciones → lápiz → Versión: Nueva versión → Implementar. La dirección /exec no cambia."),
    S("Si cambias un archivo tú mismo", "Sube el número de VERSION en app/sw.js para que los celulares descarguen el cambio.")] },
  { id: "whatsapp", t: "WhatsApp Business (gratis)", i: "message-circle", c: [
    S("Pásate a WhatsApp Business", "Descarga «WhatsApp Business» en tu iPhone y usa tu número 945 798 876. Pon tu logo, la descripción y el enlace de tu web."),
    S("Mensajes automáticos", "En Herramientas para la empresa: Mensaje de bienvenida y Mensaje de ausencia. Copia los textos de Campañas → Respuestas rápidas → «Para tu WhatsApp Business»."),
    S("Respuestas rápidas", "En Herramientas → Respuestas rápidas crea atajos: /precios, /zonas, /pago, /reserva. Copia los textos desde la app: se arman con tus precios actuales."),
    S("Etiquetas", "Usa etiquetas como «Nuevo», «Cotizado», «Cliente», «Plan» para ver de un vistazo en qué etapa está cada chat."),
    S("Cuida tu número", "No envíes el mismo mensaje a muchos números seguidos: WhatsApp puede bloquearte. Las campañas de la app se envían uno por uno y solo a quien aceptó.")] },
  { id: "google", t: "Perfil de Empresa en Google (sin local)", i: "map-pin", c: [
    S("Sí puedes crearlo", "Como vas al cliente, Google te trata como «negocio de área de servicio»: ocultas tu dirección y marcas las zonas donde atiendes (Cayma, Yanahuara, Cerro Colorado…)."),
    S("Cómo", "Entra a business.google.com con tu cuenta → Agregar empresa → nombre AUTOCARE → categoría «Servicio de detallado de automóviles» → cuando pregunte si los clientes te visitan, responde que no y que vas a ellos → marca tus zonas → verifica (suele ser con un video o un código)."),
    S("Pide reseñas a todos", "Copia el enlace «Pedir reseñas» y pégalo en Configuración → Negocio. La app lo envía después de cada entrega. Google no permite pedirlas solo a los clientes contentos: se lo pides a todos por igual."),
    S("Fotos", "Sube cada semana 2 o 3 fotos de antes y después. Los perfiles con fotos recientes reciben más visitas.")] },
  { id: "redes", t: "Instagram, TikTok y Facebook", i: "instagram", c: [
    S("Cuenta profesional", "En Instagram: Configuración → Tipo de cuenta → Cambiar a cuenta profesional → Empresa → categoría «Servicio de lavado de autos». Conéctala a una página de Facebook de AUTOCARE (créala desde la app de Facebook → Páginas → Crear)."),
    S("Bio que vende", "«Tu auto como nuevo sin moverte de casa 🚗✨ Detailing a domicilio en Arequipa · Separa tu hora 👇» y en el enlace pon tu página de enlaces (Resultados → Enlaces para medir → Instagram)."),
    S("TikTok", "Crea la cuenta como «Empresa», con el mismo nombre (autocare.pe), el logo y la misma bio. Sube los mismos reels: sin marca de agua de otra app."),
    S("Publicación automática (opcional)", "Para que la app publique sola necesitas un código de Meta: en developers.facebook.com crea una app, agrega el producto de Instagram (inicio de sesión con Instagram), conecta tu cuenta y genera el código. Pégalo en Configuración → Avisos y redes. Si te parece mucho, usa «Listo para subir»: la app te recuerda por Telegram con la imagen y el texto."),
    S("Qué publicar", "Mira Contenido → Estrategia e ideas: 3 reels, 1 carrusel y 1 opinión u oferta por semana, siempre con tu marca.")] },
  { id: "telegram", t: "Avisos por Telegram", i: "bell", c: [
    S("Crea tu bot", "En Telegram busca @BotFather → /newbot → ponle nombre (AUTOCARE Avisos) → copia el código largo que te da."),
    S("Conéctalo", "Configuración → Avisos y redes → pega el código → abre tu bot, toca Iniciar → vuelve y toca «Ya le escribí, conectar». Nunca compartas ese código con nadie.")] },
  { id: "equipo", t: "Cuando contrates ayuda", i: "users", c: [
    S("Crea su usuario", "Configuración → Usuarios → Nuevo usuario → rol Técnico. Ve su agenda y órdenes, no tus finanzas. Le das la clave temporal y él la cambia en Mi cuenta."),
    S("Estandariza", "Cada servicio tiene sus pasos: así el ayudante lo hace igual que tú. Revisa en el Tablero «Calidad a la primera» y «Servicios dentro del tiempo estándar».")] },
  { id: "datos", t: "Tus datos y respaldos", i: "database-backup", c: [
    S("Dónde están", "Todo vive en tu hoja de Google «AUTOCARE»; las fotos, en tu Drive (carpeta AUTOCARE). Puedes abrir la hoja desde Configuración → Mi cuenta."),
    S("Respaldo", "Activa el resumen del lunes: guarda una copia en tu Drive cada semana. También puedes descargar un respaldo en Mi cuenta."),
    S("Sin señal", "La app guarda en tu celular y envía todo cuando vuelve la señal. El punto de arriba se pone verde cuando todo está guardado.")] },
  { id: "tarjeta", t: "Cómo entra el cliente a su tarjeta", i: "qr-code", c: [
    S("Al entregar el auto", "En la orden, en «Listo», toca «Darle su tarjeta»: aparece su QR en tu pantalla y lo escanea con la cámara, como cuando paga con Yape. Se abre su tarjeta con sus sellos, sus fotos de antes y después y el botón para separar su próxima hora."),
    S("Por WhatsApp o enlace", "En la misma hoja: «Enviarle su tarjeta por WhatsApp» (mensaje listo) o «Copiar su enlace». También sale en los mensajes de «Tu auto está listo» y en los recordatorios."),
    S("Tarjeta física y sticker", "«Tarjeta para imprimir» crea una imagen tamaño tarjeta de crédito con su nombre y su QR; «Sticker para su auto» crea uno de 5 × 5 cm con la fecha de su próximo lavado. Toca «Guardar o enviar a la imprenta» y mándala por WhatsApp a tu imprenta."),
    S("Con NFC (acercar el celular)", "Compra stickers o tarjetas NFC NTAG213 o NTAG215. En la hoja toca «Grabarla en una tarjeta o sticker NFC»: en iPhone se usa la app gratis NFC Tools (Escribir → Añadir un registro → URL → pega el enlace → Escribir). Funciona con iPhone XS o más nuevo y casi todos los Android."),
    S("Si pierde su enlace", "En tu web toca «Mi tarjeta» y escribe su número: te llega un aviso por Telegram con un botón para enviárselo por WhatsApp, y queda un seguimiento en la app. Por seguridad nunca se muestran datos con solo un número."),
    S("Si perdió su tarjeta o la compartió", "En su ficha → «Darle su tarjeta» → «Cambiar su enlace». El anterior deja de funcionar; dale el nuevo."),
    S("Ícono en su celular", "Cuando abre su tarjeta, queda recordada en ese celular. En iPhone: Compartir → «Agregar a pantalla de inicio» y tiene el ícono de AUTOCARE."),
    S("QR de tu negocio", "Configuración → Mi web → «Crear QR de mi negocio»: uno para la ventana de tu auto, uno para volantes (con oferta y fecha) y uno para pedir reseñas en Google. Cada uno lleva su origen y lo ves en Resultados → De dónde vienen.")] },
  { id: "socios", t: "Trabajar con tu socia (co-gerente)", i: "handshake", c: [
    S("1. Dale acceso", "Configuración → Usuarios → Nuevo usuario. Rol: Co-gerente (acceso total). Marca sus áreas: WhatsApp y ventas, Cobros y finanzas, Logística y Marketing. Al guardar sale una clave temporal: pásasela por WhatsApp junto con la dirección de la app (…/autocare/app/). Ella la instala en su celular (Compartir → Agregar a pantalla de inicio) y cambia su clave en Mi cuenta."),
    S("2. Deja tus áreas", "En Usuarios, edita tu usuario y deja solo «Servicio en campo». Desde ahí, tu Inicio muestra tu agenda y tus órdenes, y el de ella su centro de control: responder, cobrar, preparar mañana y marketing."),
    S("3. Que conecte su Telegram", "Desde su celular: Configuración → Avisos y redes → «Abrir @tubot y tocar Iniciar» → vuelve y toca «Ya toqué Iniciar». A ella le llegan consultas, reservas, cobros por verificar y marketing; a ti, el aviso antes de cada cita, las firmas y la agenda. Los resúmenes les llegan a los dos."),
    S("4. WhatsApp Business en su celular", "WhatsApp Business permite usar el mismo número en hasta 4 dispositivos vinculados. En el celular de ella instala WhatsApp Business y elige «Vincular a una cuenta existente»: aparece un código QR. En tu celular: WhatsApp Business → Configuración → Dispositivos vinculados → Vincular un dispositivo, y escanéalo. Los dos responden desde el número del negocio; abre tu WhatsApp de vez en cuando para que no se desvincule."),
    S("5. Cobros: tú cobras, ella verifica", "Cuando registras un cobro en la orden, a ella le llega un aviso y le aparece en Finanzas → Por verificar. Ella revisa el Yape o la cuenta y toca «Llegó». Es control interno básico (separación de funciones): no es desconfianza, protege a los dos."),
    S("6. Seguimientos entre ustedes", "En Ventas → Seguimientos, elige «Para quién». Si le dejas una tarea, le llega por Telegram. Cada uno ve «Míos» y «Del equipo»."),
    S("7. Reunión de socios cada semana", "Plan y revisión → Revisión semanal: 30 minutos, el mismo día y hora. Los acuerdos tienen responsable y fecha, y quedan como seguimientos para la semana."),
    S("8. Reparto entre socios", "Finanzas → Reparto → «Reparto entre socios»: el sueldo se reparte por el trabajo de cada uno y la ganancia por lo que cada uno es dueño. Propuesta inicial 50/50; ajústenla a lo que acuerden."),
    S("Michael Gerber — The E-Myth Revisited", "Idea: todo negocio necesita tres trabajos: el técnico (hace el servicio), el gerente (ordena) y el emprendedor (piensa en el futuro).", "En AUTOCARE: tú eres el técnico y gerente de la operación; tu socia, la gerente de clientes, dinero y marketing. Reserven un rato a la semana para el trabajo de emprendedor: hacia dónde va el negocio."),
    S("Gino Wickman y Mark Winters — Rocket Fuel", "Idea: las empresas que despegan suelen tener un «visionario» (ideas, relación con clientes, calidad) y un «integrador» (ordena, cumple, coordina). Se necesitan los dos y cada uno respeta el terreno del otro.", "En AUTOCARE: decidan quién tiene la última palabra en cada tema (calidad del servicio, precios, gastos, marketing) y escríbanlo."),
    S("Gino Wickman — Traction (EOS)", "Idea: cada «asiento» de la empresa tiene un solo dueño; prioridades de 90 días con responsable; una reunión semanal con números, problemas y acuerdos.", "En AUTOCARE: las áreas de cada usuario, las prioridades del trimestre con responsable y la reunión de socios."),
    S("David Gage — The Partnership Charter", "Idea: los socios que escriben sus acuerdos antes de que haya problemas tienen muchas menos peleas.", "En AUTOCARE: escriban en una hoja quién hace qué, quién decide qué (solo o juntos, por ejemplo gastos mayores a S/ 300), cuánto puso cada uno (dinero, equipos, tiempo), cómo se reparten sueldo y ganancia, qué pasa si uno quiere salir y cómo resuelven un desacuerdo. Revísenlo cada 6 meses."),
    S("Noam Wasserman — The Founder's Dilemmas (Harvard)", "Idea: según su estudio de 10,000 fundadores, 65% de las startups de alto potencial fracasan por conflictos entre los socios, más que por falta de clientes.", "En AUTOCARE: hablen de plata, roles y poder al inicio, cuando todavía están de buenas."),
    S("Patrick Lencioni — Las cinco disfunciones de un equipo", "Idea: sin confianza no hay conflicto sano; sin conflicto sano no hay compromiso, nadie rinde cuentas y no llegan los resultados.", "En AUTOCARE: en la reunión semanal discutan las ideas, no a las personas, y salgan siempre con un acuerdo y un responsable.")] },
  { id: "expertos", t: "Consejos de expertos para hacer crecer AUTOCARE", i: "graduation-cap", c: [
    S("Cómo usar esta sección", "Está ordenada como el «plan de marketing de una página» de Allan Dib (The 1-Page Marketing Plan): ANTES (que te encuentren), DURANTE (que te elijan) y DESPUÉS (que vuelvan y te recomienden). La mayor ganancia de un negocio de servicio está en el DESPUÉS. Aplica una idea por semana."),
    S("ANTES · Seth Godin — This Is Marketing", "Idea: elige el «mercado mínimo viable», a quién sirves y a quién no.", "En AUTOCARE: profesionales de Cayma, Yanahuara y Cerro Colorado, con auto nuevo o SUV, que valoran su tiempo; y condominios. Escribe cada post pensando en esa persona."),
    S("ANTES · Byron Sharp — How Brands Grow", "Idea: crece la marca que es fácil de recordar y fácil de comprar, con señales distintivas que se repiten siempre.", "En AUTOCARE: siempre el mismo verde lima con negro y el mismo logo. QR en tu auto, enlaces en tu bio y reserva en 1 minuto."),
    S("ANTES · Jay Conrad Levinson — Guerrilla Marketing", "Idea: constancia e ingenio valen más que presupuesto.", "En AUTOCARE: el QR en la ventana de tu auto, volantes en condominios y alianzas con edificios, gimnasios u oficinas cercanas."),
    S("ANTES · Dan Kennedy — No B.S. Direct Marketing", "Idea: toda pieza debe tener una oferta clara, una fecha límite y una forma de medir quién respondió.", "En AUTOCARE: el QR de volantes acepta oferta y fecha, y cada QR lleva su origen. En Resultados → De dónde vienen ves cuál funcionó."),
    S("ANTES · Donald Miller — StoryBrand", "Idea: el cliente es el héroe; tú eres el guía con un plan simple.", "En AUTOCARE: «Tu auto como nuevo, sin moverte de casa», 3 pasos claros y un solo botón principal: «Separar mi hora»."),
    S("ANTES · David Ogilvy — Confessions of an Advertising Man", "Idea: el titular lo leen 5 veces más personas que el resto. Sé específico.", "En AUTOCARE: titula con el resultado concreto («Interior sin pelos de mascota en 2 horas»), no con el servicio («Lavado de interiores»)."),
    S("ANTES · Jonah Berger — Contagious", "Idea: lo que se ve se imita, y lo útil se comparte.", "En AUTOCARE: el sticker visible en el auto, los antes y después, y tips prácticos («cómo cuidar tu pintura del sol de Arequipa»)."),
    S("ANTES · Gary Vaynerchuk — Jab, Jab, Jab, Right Hook", "Idea: da valor varias veces antes de pedir.", "En AUTOCARE: 3 publicaciones útiles por cada publicación de venta (Marketing → Contenido)."),
    S("DURANTE · James Oldroyd — Harvard Business Review (2011)", "Idea: quien responde en la primera hora tiene casi 7 veces más probabilidad de concretar que quien tarda más.", "En AUTOCARE: Telegram te avisa cada consulta; responde con una respuesta rápida desde Ventas."),
    S("DURANTE · Chris Voss — Never Split the Difference", "Idea: nombra lo que siente la otra persona («parece que…»), pregunta con «qué» o «cómo», y haz preguntas fáciles de responder con «no».", "En AUTOCARE: nuevas respuestas rápidas «Lo voy a pensar», «¿Me haces descuento?» y «Otro lo hace más barato» (Campañas → Respuestas rápidas)."),
    S("DURANTE · Alex Hormozi — $100M Offers", "Idea: el valor sube con el resultado soñado y la seguridad de lograrlo, y baja con el tiempo y el esfuerzo que cuesta. No bajes el precio: sube el valor.", "En AUTOCARE: a domicilio (cero esfuerzo), garantía de repaso y fotos (seguridad) y la próxima hora libre visible (cero espera)."),
    S("DURANTE · Dan Ariely — Predictably Irrational", "Idea: el efecto señuelo; una opción de referencia hace que la del medio parezca la mejor compra.", "En AUTOCARE: 3 paquetes, con Brillo Total destacado al centro."),
    S("DURANTE · Robert Cialdini — Influence", "Idea: prueba social, autoridad, reciprocidad y compromiso.", "En AUTOCARE: reseñas reales, marcas de tus productos, un detalle de regalo y pedir que confirme su cita (compromiso)."),
    S("DURANTE · Clayton Christensen — Competing Against Luck", "Idea: la gente «contrata» un servicio para lograr un avance en su vida. No compra un lavado: compra orgullo, higiene o vender mejor su auto.", "En AUTOCARE: en su tarjeta el cliente marca qué le importa. Lo ves en su ficha y en la orden: háblale de eso."),
    S("DESPUÉS · Joey Coleman — Never Lose a Customer Again", "Idea: entre 20% y 70% de los clientes nuevos se pierden en los primeros 100 días. Los que pasan del día 101 se quedan años.", "En AUTOCARE: día 0, su tarjeta y sus fotos. Día 2: «¿quedó como esperabas?» y la reseña. Día 21: «le toca». Pide referidos solo después de un buen resultado."),
    S("DESPUÉS · Chip y Dan Heath — The Power of Moments, y Daniel Kahneman (regla pico-final)", "Idea: de una experiencia se recuerdan el mejor momento y el final.", "En AUTOCARE: haz de la entrega un ritual. Muéstrale el antes y después en tu celular, dale su tarjeta y deja un detalle."),
    S("DESPUÉS · Will Guidara — Unreasonable Hospitality", "Idea: gestos personales e inesperados («leyendas»). Regla 95/5: controla el 95% de tus gastos al centavo y usa el 5% con generosidad en detalles.", "En AUTOCARE: si en el auto hay un juguete de su hijo, déjalo limpio en el asiento con una nota. Separa un monto chico al mes para estos detalles."),
    S("DESPUÉS · Danny Meyer — Setting the Table", "Idea: «colecciona los puntos y conéctalos»: recuerda lo que le importa a cada cliente.", "En AUTOCARE: aroma, mascota, dónde deja las llaves. Él lo cuenta en su tarjeta y tú lo ves en su ficha y en cada orden, sin que lo repita."),
    S("DESPUÉS · Nir Eyal — Hooked", "Idea: aviso → acción fácil → recompensa → inversión. Mientras más pone el cliente de su parte, más vuelve.", "En AUTOCARE: recordatorio (aviso), separar en 1 minuto (acción), antes y después y sellos (recompensa), sus gustos guardados (inversión)."),
    S("DESPUÉS · Nunes y Drèze (2006) y Kivetz (2006)", "Idea: el progreso de regalo y la meta cercana aceleran la vuelta. Con 2 sellos de regalo, 34% completó la tarjeta frente a 19% sin regalo.", "En AUTOCARE: tarjeta de 8 con 2 sellos de regalo en el primer servicio, y el mensaje «te faltan solo…»."),
    S("DESPUÉS · Jay Baer — Talk Triggers", "Idea: un detalle distinto que haces siempre y que la gente cuenta sola. En los hoteles DoubleTree, cerca de 1 de cada 3 huéspedes mencionó por su cuenta la galleta de bienvenida.", "En AUTOCARE: elige tu detalle (por ejemplo, un ambientador con tu logo y su tarjeta NFC) y hazlo en cada entrega."),
    S("DESPUÉS · John Jantsch — Duct Tape Marketing y The Referral Engine", "Idea: el camino del cliente es conocer, gustar, confiar, probar, comprar, repetir y recomendar. Haz que recomendar sea fácil.", "En AUTOCARE: código y QR de referido en su tarjeta, y un sello por cada amigo que llega."),
    S("DESPUÉS · Fred Reichheld — The Ultimate Question (NPS)", "Idea: retener 5% más de clientes puede subir las utilidades de 25% a 85% (Reichheld y Sasser, HBR 1990).", "En AUTOCARE: pide la nota de 0 a 10 al terminar y llama ese mismo día a quien te dé de 0 a 6."),
    C("DESPUÉS · Kevin Kelly — 1,000 True Fans, y Paul Jarvis — Company of One", Fans),
    S("OPERACIÓN · Michael Gerber — The E-Myth Revisited", "Idea: trabaja EN tu negocio, no solo DENTRO de él. Documenta todo como si fueras a franquiciarlo.", "En AUTOCARE: los pasos y la receta de cada servicio (Configuración → Servicios), para que un ayudante lo haga igual que tú."),
    S("OPERACIÓN · Carl Sewell — Customers for Life (concesionario de autos)", "Idea: sistemas, no solo sonrisas. Mide las 3 cosas que más le importan al cliente y di que sí a lo razonable. Un favor que te gana un cliente de por vida vale más que un anuncio.", "En AUTOCARE: mide si cobraste lo cotizado, si llegaste a tiempo y si tuviste que repetir algo. Cotiza con un pequeño margen y cumple de más."),
    S("OPERACIÓN · Atul Gawande — The Checklist Manifesto", "Idea: una lista corta evita errores tontos, incluso a los expertos.", "En AUTOCARE: la lista de control de calidad antes de entregar cada auto."),
    S("OPERACIÓN · Sistema de Producción Toyota (5S y kaizen)", "Idea: orden, limpieza y pequeñas mejoras todos los días.", "En AUTOCARE: cada producto y equipo en su lugar; repón con «Por comprar» antes de que se acabe."),
    S("DINERO · Mike Michalowicz — Profit First", "Idea: separa tu ganancia primero, no al final.", "En AUTOCARE: Finanzas → Reparto: cada sol que cobras se divide en ganancia, impuestos, tu sueldo y gastos."),
    S("DINERO · Eliyahu Goldratt — La Meta", "Idea: el cuello de botella manda. En tu caso son tus horas.", "En AUTOCARE: Finanzas muestra tu ganancia por hora; súbela antes de buscar más clientes."),
    S("HÁBITOS · BJ Fogg — Tiny Habits, y James Clear — Atomic Habits", "Idea: hábitos pequeños, fáciles y con un aviso visible.", "En AUTOCARE: tu revisión de 15 minutos cada lunes. Para tus clientes: QR y NFC para entrar sin escribir nada."),
    S("HÁBITOS · Eric Ries — The Lean Startup", "Idea: construir, medir, aprender. Prueba algo pequeño, mídelo y quédate con lo que funciona.", "En AUTOCARE: prueba una idea al mes (un volante, una oferta, un tipo de reel) y revisa su resultado en Resultados.")] },
  { id: "faq", t: "Preguntas frecuentes", i: "circle-help", c: [
    S("Olvidé mi clave", "En Apps Script ejecuta «reiniciarAcceso», copia el código y úsalo en la pantalla de entrada → «Olvidé mi clave»."),
    S("No se guarda / punto rojo", "Toca el punto para reintentar. Si sigue, revisa tu internet o que el servidor esté publicado para «Cualquier usuario»."),
    S("Una foto dice «por subir»", "Se sube sola cuando haya señal. No cierres la sesión mientras haya cambios por enviar."),
    S("Mi web no muestra precios", "Revisa que tus servicios estén activos y con «Mostrar en la web». Los cambios tardan hasta 10 minutos en verse.")] }
];

export default function Ayuda() {
  D.useDatos();
  usarTitulo("Ayuda");
  const [q, setQ] = useState(""), [abierto, setAbierto] = useState("practica");
  const sem = D.ajuste("semillaCargada");
  const cargar = async () => {
    if (!(await confirmar({ titulo: "Cargar configuración inicial", texto: "Se agregan tus paquetes, adicionales, planes, productos, equipos y reglas de sellos. No borra nada de lo que ya tienes.", si: "Cargar" }))) return;
    const m = await import("../semilla.js"); const n = m.aplicar();
    aviso(`Listo: ${n.servicios} servicios, ${n.planes} planes, ${n.productos} productos, ${n.activos} activos.`);
  };
  const temas = TEMAS.map(t => Object.assign({}, t, { c: t.c.filter(x => !q || coincide(t.t + " " + x.t + " " + x.p.join(" "), q)) })).filter(t => t.c.length);
  return html`<header class="pagina-cab"><div><h1>Ayuda</h1><p>Todo lo que necesitas para usar, actualizar y hacer crecer AUTOCARE.</p></div></header>
    ${D.esAdmin() && html`<div style="margin-bottom:18px">${sem ? html`<${AvisoLinea} c="verde" icono="circle-check">Configuración inicial cargada el ${sem.fecha}. Puedes volver a cargarla: solo agrega lo que falte.<//>`
      : html`<${AvisoLinea} c="oro" icono="sparkles" accion=${html`<${Boton} tipo="primario" chico onClick=${cargar}>Cargar ahora<//>`}><b>Empieza aquí:</b> carga tu configuración inicial (paquetes, plan mensual, productos de Extreme Wash, equipos y tarjeta de 8 sellos).<//>`}</div>`}
    <div class="filtros"><${Buscador} valor=${q} cambiar=${setQ} placeholder="Buscar en la ayuda" /></div>
    ${temas.map(t => html`<section class="bloque"><button class="fila" style="border:1px solid var(--linea);border-radius:16px;background:var(--capa)" onClick=${() => setAbierto(abierto === t.id && !q ? "" : t.id)}>
        <span class="ico oro"><${Icono} n=${t.i} /></span><span class="cuerpo"><span class="t">${t.t}</span></span><span class="der">${abierto === t.id || q ? "−" : "+"}</span></button>
      ${(abierto === t.id || q) && html`<div class="grupo" style="margin-top:8px">${t.c.map(x => html`<div class="fila" style="align-items:flex-start"><span class="cuerpo"><span class="t" style="white-space:normal">${x.t}</span>${x.p.map(y => html`<span class="s multi" style="display:block;margin-top:4px;line-height:1.5">${y}</span>`)}${x.comp && html`<${x.comp} />`}</span></div>`)}</div>`}
    </section>`)}
    ${D.esAdmin() && sem && html`<div style="margin-top:10px"><${Boton} tipo="fantasma" icono="rotate-ccw" onClick=${cargar}>Volver a cargar lo que falte de la configuración inicial<//></div>`}`;
}

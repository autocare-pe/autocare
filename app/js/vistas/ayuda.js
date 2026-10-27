// AUTOCARE · Ayuda: primeros pasos, uso diario, actualizar, WhatsApp Business, Google, redes y preguntas frecuentes
import { html, useState } from "../../vendor/preact-htm.js";
import * as D from "../datos.js";
import * as N from "../negocio.js";
import { usarTitulo } from "../app.js";
import { Boton, Icono, Bloque, AvisoLinea, Fila, Buscador, aviso, confirmar } from "../ui.js";
import { coincide, copiar } from "../util.js";

const S = (t, ...p) => ({ t, p });
const TEMAS = [
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
  { id: "faq", t: "Preguntas frecuentes", i: "circle-help", c: [
    S("Olvidé mi clave", "En Apps Script ejecuta «reiniciarAcceso», copia el código y úsalo en la pantalla de entrada → «Olvidé mi clave»."),
    S("No se guarda / punto rojo", "Toca el punto para reintentar. Si sigue, revisa tu internet o que el servidor esté publicado para «Cualquier usuario»."),
    S("Una foto dice «por subir»", "Se sube sola cuando haya señal. No cierres la sesión mientras haya cambios por enviar."),
    S("Mi web no muestra precios", "Revisa que tus servicios estén activos y con «Mostrar en la web». Los cambios tardan hasta 10 minutos en verse.")] }
];

export default function Ayuda() {
  D.useDatos();
  usarTitulo("Ayuda");
  const [q, setQ] = useState(""), [abierto, setAbierto] = useState("inicio");
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
      ${(abierto === t.id || q) && html`<div class="grupo" style="margin-top:8px">${t.c.map(x => html`<div class="fila" style="align-items:flex-start"><span class="cuerpo"><span class="t" style="white-space:normal">${x.t}</span><span class="s multi" style="margin-top:4px;line-height:1.5">${x.p.join(" ")}</span></span></div>`)}</div>`}
    </section>`)}
    ${D.esAdmin() && sem && html`<div style="margin-top:10px"><${Boton} tipo="fantasma" icono="rotate-ccw" onClick=${cargar}>Volver a cargar lo que falte de la configuración inicial<//></div>`}`;
}

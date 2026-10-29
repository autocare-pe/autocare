// AUTOCARE · Cómo entra el cliente a su tarjeta (sellos, fotos, citas): QR, WhatsApp, enlace, NFC, tarjeta y sticker.
// · BJ Fogg (Tiny Habits, B=MAP): la conducta ocurre cuando es fácil y hay un aviso en el momento justo.
//   Por eso QR o NFC (sin escribir nada) y un sticker en su auto, donde nace la necesidad.
// · Chip y Dan Heath (The Power of Moments) y Kahneman (regla pico-final): se recuerda el final;
//   dale su tarjeta al entregar el auto, cuando está viendo el antes y después.
// · Joey Coleman (Never Lose a Customer Again): entre 20% y 70% de clientes nuevos se pierden antes
//   de los 100 días; que se lleve su tarjeta el mismo día.
// · Eric Ries (The Lean Startup): cada forma de entrar lleva su origen (?src=) y en Resultados ves cuál funciona.
import { html, useState, useMemo } from "../../vendor/preact-htm.js";
import * as D from "../datos.js";
import * as N from "../negocio.js";
import { Hoja, Boton, Fila, AvisoLinea, Segmentos, Entrada, aviso, confirmar } from "../ui.js";
import { enviarWa } from "../piezas.js";
import { copiar, llave, nombreDe, hoy, sumarDias } from "../util.js";
const fechaCorta = iso => { try { return new Date(iso + "T12:00:00").toLocaleDateString("es-PE", { day: "numeric", month: "short" }).replace(/\./g, ""); } catch (e) { return iso; } };
import { qrSvg } from "../../../assets/qr.js";

const fechaBonita = iso => {
  try { const s = new Date(iso + "T12:00:00").toLocaleDateString("es-PE", { weekday: "short", day: "numeric", month: "short" }).replace(/\./g, ""); return s[0].toUpperCase() + s.slice(1); }
  catch (e) { return ""; }
};
const hayWebNfc = () => typeof window !== "undefined" && "NDEFReader" in window;

function QrGrande({ svg, children }) {
  return html`<div class="qr-acceso"><div class="qr" dangerouslySetInnerHTML=${{ __html: svg }}></div><div>${children}</div></div>`;
}
function Vista({ pieza, cerrar }) {
  return html`<div class="pieza-vista"><img src=${pieza.src} alt="Vista previa para imprimir" />
    <div class="btns" style="margin-top:10px"><${Boton} tipo="primario" icono="download" onClick=${() => import("../imprimibles.js").then(m => m.guardar(pieza))}>Guardar o enviar a la imprenta<//>
      <${Boton} tipo="fantasma" onClick=${cerrar}>Cerrar vista<//></div>
    ${pieza.nota && html`<p class="nota" style="margin-top:8px">${pieza.nota}</p>`}</div>`;
}
function PasosNfc({ url }) {
  const grabar = async () => {
    try {
      const w = new window.NDEFReader();
      aviso("Acerca la tarjeta o el sticker NFC a la parte de atrás del celular…");
      await w.write({ records: [{ recordType: "url", data: url }] });
      aviso("¡Grabada! Pruébala acercándola a un celular.");
    } catch (e) { aviso("No se pudo grabar: " + ((e && e.message) || e), { error: true }); }
  };
  return html`<div class="panel" style="margin:6px 0 10px">
    ${hayWebNfc() ? html`<p>Toca «Grabar ahora» y acerca la etiqueta a la parte de atrás del celular.</p>
        <div class="btns" style="margin-top:10px"><${Boton} tipo="primario" icono="nfc" onClick=${grabar}>Grabar ahora<//></div>`
      : html`<ol class="pasos-nfc">
        <li>Instala <b>NFC Tools</b> (gratis, App Store).</li>
        <li>Toca abajo <b>Copiar enlace para NFC</b>.</li>
        <li>En NFC Tools: <b>Escribir (Write) → Añadir un registro (Add a record) → URL/URI</b>. Pega el enlace y toca OK.</li>
        <li>Toca <b>Escribir</b> y acerca la etiqueta a la parte de arriba de tu iPhone.</li>
        <li>Pruébala: con el celular desbloqueado, acércala y toca el aviso que aparece.</li></ol>
        <div class="btns"><${Boton} tipo="primario" icono="copy" onClick=${async () => { await copiar(url); aviso("Enlace para NFC copiado. Ahora ábrelo en NFC Tools."); }}>Copiar enlace para NFC<//></div>`}
    <p class="nota" style="margin-top:10px">Compra etiquetas <b>NTAG213 o NTAG215</b> (stickers o tarjetas PVC). Funcionan con iPhone XS o más nuevo y con casi todos los Android. Cuando ya funcione, puedes bloquearla en NFC Tools (Otros → Bloquear etiqueta) para que nadie la cambie; después ya no se puede regrabar.</p></div>`;
}

/** Hoja «La tarjeta de Carla»: se abre desde la ficha del cliente y al entregar una orden */
export function AccesoCliente({ id, cerrar }) {
  D.useDatos();
  const c = D.uno("clientes", id);
  const [pieza, setPieza] = useState(null), [nfc, setNfc] = useState(false), [haciendo, setHaciendo] = useState("");
  const conLlave = c ? N.asegurarPortal(c) || c : null;
  const token = conLlave ? conLlave.token : "";
  const svg = useMemo(() => (conLlave ? qrSvg(N.urlPortal(conLlave, "qr"), { margen: 3 }) : ""), [token]);
  if (!c) return null;
  const url = src => N.urlPortal(conLlave, src);
  const corto = c.nombre || nombreDe(c);
  const preparar = async tipo => {
    setHaciendo(tipo); setPieza(null);
    try {
      const P = await import("../imprimibles.js");
      if (tipo === "tarjeta") setPieza(await P.tarjetaCliente({ nombre: nombreDe(c), url: url("tarjeta"), tel: N.negocio().tel }));
      else {
        const prox = N.perfil(c.id).proxima;
        setPieza(await P.stickerAuto({ fecha: fechaBonita(prox && prox > hoy() ? prox : sumarDias(hoy(), 21)), url: url("sticker") }));
      }
    } catch (e) { aviso((e && e.message) || "No pude preparar la imagen.", { error: true }); }
    setHaciendo("");
  };
  const cambiarEnlace = async () => {
    if (!(await confirmar({ titulo: "Cambiar su enlace", texto: "Úsalo si perdió su tarjeta o la compartió por error. El enlace anterior, su QR, su sticker y su tarjeta NFC dejan de funcionar: tendrás que darle los nuevos.", si: "Cambiar enlace", peligro: true }))) return;
    D.cambiar("clientes", c.id, { token: llave(24) }); setPieza(null);
    aviso("Listo, su enlace es nuevo. Envíaselo por WhatsApp.");
  };
  return html`<${Hoja} titulo=${"La tarjeta de " + corto} sub="Ve sus sellos, las fotos de su auto y separa su próxima hora" cerrar=${cerrar}>
    <${QrGrande} svg=${svg}><p><b>Que apunte la cámara de su celular aquí</b>, como cuando paga con Yape. Se abre su tarjeta, sin escribir nada.</p>
      <p class="nota" style="margin-top:8px">Muéstraselo al entregar el auto: el final es lo que más se recuerda.</p><//>
    <div class="grupo" style="margin-top:16px">
      <${Fila} icono="message-circle" titulo="Enviarle su tarjeta por WhatsApp" sub="Con el mensaje listo (lo cambias en Campañas → Plantillas)" flecha
        onClick=${() => enviarWa(c.tel, N.mensaje("tarjeta", Object.assign(N.varsCliente(c), { portal: url("wa") })))} />
      <${Fila} icono="link" titulo="Copiar su enlace" sub="Para pegarlo donde quieras" flecha onClick=${async () => { await copiar(url("enlace")); aviso("Enlace copiado."); }} />
      <${Fila} icono="nfc" titulo="Grabarla en una tarjeta o sticker NFC" sub="La acerca a su celular y se abre sola" flecha onClick=${() => setNfc(!nfc)} />
      ${nfc && html`<${PasosNfc} url=${url("nfc")} />`}
      <${Fila} icono="id-card" titulo="Tarjeta para imprimir" sub="Tamaño tarjeta de crédito, con su nombre y su QR" der=${haciendo === "tarjeta" ? "Preparando…" : ""} flecha onClick=${() => preparar("tarjeta")} />
      <${Fila} icono="sticker" titulo="Sticker para su auto" sub="Le recuerda su próximo lavado cada vez que sube" der=${haciendo === "sticker" ? "Preparando…" : ""} flecha onClick=${() => preparar("sticker")} />
    </div>
    ${pieza && html`<${Vista} pieza=${pieza} cerrar=${() => setPieza(null)} />`}
    ${!c.tel && html`<div style="margin-top:12px"><${AvisoLinea} c="ambar" icono="triangle-alert">No tiene WhatsApp registrado: agrégalo en «Editar datos» para enviarle su tarjeta y para que pueda recuperarla si la pierde.<//></div>`}
    <div class="btns" style="margin-top:16px"><${Boton} tipo="fantasma" icono="refresh-cw" onClick=${cambiarEnlace}>Cambiar su enlace (si perdió su tarjeta)<//></div>
  <//>`;
}

/** Hoja «QR de tu negocio»: para la ventana de tu auto, volantes y reseñas en Google */
export function QrNegocio({ cerrar }) {
  const n = N.negocio(), web = N.webBase();
  const OPS = [
    { v: "auto", n: "Tu auto", titulo: "Tu auto como nuevo, sin moverte de casa", sub: "Detailing a domicilio en Arequipa", cta: "Escanea y separa tu hora", url: web + "/?src=auto", nombre: "qr-mi-auto",
      nota: "Imprímelo en vinil y pégalo en la ventana trasera de tu auto: cada semáforo y cada estacionamiento es publicidad gratis (Levinson, Guerrilla Marketing). Lo que se ve, se contagia (Berger, Contagious)." },
    { v: "volante", n: "Volantes", titulo: "Tu auto como nuevo, sin moverte de casa", sub: "Mira precios, fotos de antes y después y elige tu hora", cta: "Escanea y separa tu hora en 1 minuto", url: web + "/?src=volante", nombre: "qr-volante",
      nota: "Para volantes en condominios, edificios y oficinas. En Resultados → De dónde vienen ves cuántos llegaron por «Volante»: si no funciona, cambia el lugar o el mensaje (Ries, Lean Startup)." },
    { v: "resena", n: "Reseñas", titulo: "¿Te gustó cómo quedó tu auto?", sub: "Cuéntalo en Google: ayuda a otros a decidir y a nosotros a crecer", cta: "Escanea y deja tu opinión", url: n.google || "", nombre: "qr-resenas",
      nota: "Muéstralo a todos tus clientes, no solo a los más contentos: Google no permite elegir a quién se le pide. Con 5 o más opiniones, la compra sube mucho (Spiegel Research Center)." }];
  const [v, setV] = useState("auto"), [pieza, setPieza] = useState(null), [haciendo, setHaciendo] = useState(false);
  const [oferta, setOferta] = useState(""), [vence, setVence] = useState("");
  const o = OPS.find(x => x.v === v);
  const svg = useMemo(() => (o.url ? qrSvg(o.url, { margen: 3 }) : ""), [o.url]);
  const preparar = async () => {
    setHaciendo(true); setPieza(null);
    try {
      const P = await import("../imprimibles.js");
      const extra = v === "volante" && oferta.trim() ? { oferta: oferta.trim(), vence: vence ? fechaCorta(vence) : "" } : {};
      setPieza(await P.cartel(Object.assign({ tel: n.tel, web }, o, extra)));
    }
    catch (e) { aviso((e && e.message) || "No pude preparar la imagen.", { error: true }); }
    setHaciendo(false);
  };
  return html`<${Hoja} titulo="QR de tu negocio" sub="Para tu auto, volantes y reseñas" cerrar=${cerrar}>
    <${Segmentos} valor=${v} cambiar=${x => { setV(x); setPieza(null); }} opciones=${OPS.map(x => ({ v: x.v, n: x.n }))} bloque />
    <div style="margin-top:16px">${o.url ? html`<${QrGrande} svg=${svg}><p><b>${o.titulo}</b></p><p class="nota" style="margin-top:6px">${o.nota}</p><//>`
      : html`<${AvisoLinea} c="ambar" icono="triangle-alert">Primero pega tu enlace para pedir reseñas de Google en Configuración → Negocio. Cuando crees tu perfil de empresa en Google, ahí aparece «Pedir reseñas».<//>`}</div>
    ${v === "volante" && html`<div class="panel" style="margin-top:14px"><p class="nota" style="margin-bottom:10px"><b>Oferta con fecha límite (opcional).</b> Dan Kennedy: un volante sin oferta ni fecha se guarda en un cajón; con fecha, se usa. Ofrece algo que cueste poco y valga mucho.</p>
      <div class="rejilla"><${Entrada} etiqueta="Oferta" valor=${oferta} cambiar=${setOferta} placeholder="Aromatizante de regalo en tu primer lavado" maxlength="48" />
      <${Entrada} etiqueta="Válida hasta" tipo="date" valor=${vence} cambiar=${setVence} /></div></div>`}
    ${o.url && html`<div class="btns" style="margin-top:16px"><${Boton} tipo="primario" icono="printer" cargando=${haciendo} onClick=${preparar}>Preparar imagen para imprimir<//>
      <${Boton} icono="copy" onClick=${async () => { await copiar(o.url); aviso("Enlace copiado."); }}>Copiar enlace<//></div>`}
    ${pieza && html`<${Vista} pieza=${pieza} cerrar=${() => setPieza(null)} />`}
  <//>`;
}

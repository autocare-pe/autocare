// AUTOCARE · Contenido: calendario, estudio de diseño con tu marca y estrategia para Instagram y TikTok
// Byron Sharp (consistencia de marca) · Gary Vaynerchuk (dar valor antes de pedir) · Adam Mosseri (envíos por DM)
import { html, useState, useEffect, useRef } from "../../vendor/preact-htm.js";
import * as D from "../datos.js";
import * as N from "../negocio.js";
import { api } from "../api.js";
import { ir, usarTitulo } from "../app.js";
import { Boton, BotonAccion, Hoja, Entrada, Numero, Area, Selector, Interruptor, Segmentos, Chips, Pestanas, Insignia, Vacio, Fila, Bloque, AvisoLinea, aviso, confirmar, useFicha, b } from "../ui.js";
import { CampoFotos } from "../piezas.js";
import { hoy, sumarDias, inicioMes, finMes, mesDe, mesLargo, sumarMeses, inicioSemana, diaSemana, fechaCorta, relativa, copiar, dataABlob, clases, DIAS_CORTOS, n0, hace } from "../util.js";
import { PILARES, FORMATOS, REDES, ESTADOS, estadoDe } from "../esquema.js";

export default function Contenido({ ruta }) {
  D.useDatos();
  usarTitulo("Contenido");
  const t = ["estudio", "estrategia"].includes(ruta.partes[0]) ? ruta.partes[0] : "calendario";
  const id = ruta.partes[0] && !["estudio", "estrategia", "calendario"].includes(ruta.partes[0]) ? ruta.partes[0] : null;
  return html`<header class="pagina-cab"><div><h1>Contenido</h1><p>Publica seguido y con tu marca: la gente contrata a quien recuerda.</p></div>
      <div class="acciones"><${Boton} tipo="primario" icono="wand-sparkles" href="#/contenido/estudio">Crear publicación<//></div></header>
    <${Pestanas} valor=${t} cambiar=${v => ir("contenido" + (v === "calendario" ? "" : "/" + v), true)} opciones=${[{ v: "calendario", n: "Calendario" }, { v: "estudio", n: "Estudio de diseño" }, { v: "estrategia", n: "Estrategia e ideas" }]} />
    ${t === "calendario" && html`<${Calendario} />`}${t === "estudio" && html`<${Estudio} />`}${t === "estrategia" && html`<${Estrategia} />`}
    ${id && html`<${FormContenido} c=${D.uno("contenido", id) || {}} cerrar=${() => ir("contenido", true)} />`}`;
}

// ---------------------------------------------------------------- calendario
function Calendario() {
  const [mes, setMes] = useState(mesDe(hoy())), [nuevo, setNuevo] = useState(null);
  const ini = inicioSemana(mes + "-01"), dias = Array.from({ length: 42 }, (_, i) => sumarDias(ini, i));
  const posts = D.lista("contenido");
  const meta = n0((D.ajuste("contenidoMetas", {}) || {}).porSemana) || 5;
  const lunes = inicioSemana(hoy()), estaSemana = posts.filter(p => p.fecha >= lunes && p.fecha <= sumarDias(lunes, 6) && p.estado !== "idea").length;
  return html`<div class="dia-cab"><${Boton} icono="chevron-left" titulo="Mes anterior" onClick=${() => setMes(mesDe(sumarMeses(mes + "-01", -1)))} /><${Boton} onClick=${() => setMes(mesDe(hoy()))}>Hoy<//><${Boton} icono="chevron-right" titulo="Mes siguiente" onClick=${() => setMes(mesDe(sumarMeses(mes + "-01", 1)))} />
      <h2>${mesLargo(mes).replace(/^./, x => x.toUpperCase())}</h2><span class="carga">Esta semana: <b>${estaSemana} de ${meta}</b> publicaciones</span></div>
    <div class="calendario">${["lun", "mar", "mié", "jue", "vie", "sáb", "dom"].map(d => html`<div class="cal-dia-nombre">${d}</div>`)}
      ${dias.map(f => html`<button class=${clases("cal-celda", mesDe(f) !== mes && "fuera", f === hoy() && "hoy")} onClick=${() => setNuevo({ fecha: f })}>
        <span class="cal-num">${Number(f.slice(8))}</span>
        ${posts.filter(p => p.fecha === f).map(p => html`<span class=${clases("cal-post", p.estado)} onClick=${e => { e.stopPropagation(); ir("contenido/" + p.id); }}>${p.hora ? p.hora + " " : ""}${p.titulo || PILARES[p.pilar]?.n || "Publicación"}</span>`)}
      </button>`)}</div>
    <div class="leyenda" style="margin-top:12px">${["idea", "listo", "programado", "publicado", "fallo"].map(k => html`<span><i style=${{ background: { idea: "var(--capa-3)", listo: "var(--oro-suave)", programado: "var(--azul-s)", publicado: "var(--verde-s)", fallo: "var(--rojo-s)" }[k] }}></i>${ESTADOS.contenido[k].n}</span>`)}</div>
    ${nuevo && html`<${FormContenido} c=${nuevo} cerrar=${() => setNuevo(null)} />`}`;
}

// ---------------------------------------------------------------- textos sugeridos (con hashtags locales)
const HASHTAGS = "#autocare #detailingarequipa #lavadoadomicilio #arequipa #cayma #yanahuara #carwash #detailing";
export function textoSugerido(pilar, d = {}) {
  const t = d.titulo || "";
  return ({
    antesdespues: `Así llegó y así se fue ✨ ${t}\n\nVamos a tu casa u oficina con agua y energía propias; tú sigues con tu día. ¿Cuál te gusta más, el antes o el después? 👇\n\nSepara tu hora: link en la bio.\n\n${HASHTAGS}`,
    educativo: `${t || "Cada cuánto deberías lavar tu auto"} 🧽\n\nGuárdalo para no olvidarlo y mándaselo a quien lo necesite 📩\n\n${HASHTAGS}`,
    prueba: `Lo que dicen nuestros clientes ⭐⭐⭐⭐⭐\n"${d.texto || t}"\n\nGracias por confiar en AUTOCARE. ¿Quieres el mismo resultado? Link en la bio.\n\n${HASHTAGS}`,
    oferta: `${t || "Cupos de esta semana"} 🔥\n\n${d.puntos || ""}\n\nPocos horarios libres: escríbenos o reserva en 1 minuto (link en la bio).\n\n${HASHTAGS}`,
    detras: `Un día de trabajo en AUTOCARE 🚗💨 ${t}\n\nAsí cuidamos cada auto, paso a paso.\n\n${HASHTAGS}`
  })[pilar] || `${t}\n\n${HASHTAGS}`;
}

function FormContenido({ c, cerrar }) {
  const [f, set] = useFicha(Object.assign({ fecha: hoy(), hora: "19:00", titulo: "", formato: "reel", pilar: "antesdespues", estado: "idea", caption: "", imagenId: "", redes: ["instagram"], recordar: true, metricas: {} }, c));
  const integ = D.ajuste("igMedia");
  const guardar = (extra = {}) => { const r = D.guardar("contenido", Object.assign({}, f, extra)); aviso("Guardado."); return r; };
  const publicar = async () => {
    const r = guardar();
    const j = await api("publicarAhora", { id: r.id });
    aviso(j.resultado.estado === "publicado" ? "¡Publicado!" : "No se pudo publicar solo. Te llegó la imagen por Telegram para subirla.", { error: j.resultado.estado !== "publicado" });
    cerrar();
  };
  const compartir = async () => {
    try {
      const datos = await D.fotosComoDatos([f.imagenId]); const src = datos[f.imagenId];
      await copiar(f.caption || "");
      if (src && navigator.canShare && navigator.canShare({ files: [new File([dataABlob(src)], "autocare.jpg", { type: "image/jpeg" })] })) await navigator.share({ files: [new File([dataABlob(src)], "autocare.jpg", { type: "image/jpeg" })] });
      aviso("Texto copiado. Pega el texto en Instagram al publicar.");
    } catch (e) { aviso("Texto copiado.", {}); }
  };
  const m = f.metricas || {};
  return html`<${Hoja} titulo=${c.id ? "Publicación" : "Nueva publicación"} cerrar=${cerrar} pie=${html`${c.id && html`<${Boton} tipo="fantasma peligro" icono="trash-2" titulo="Eliminar" onClick=${async () => { if (await confirmar({ titulo: "Eliminar publicación", si: "Eliminar", peligro: true })) { D.borrar("contenido", c.id); cerrar(); } }} />`}
      <${Boton} onClick=${() => { guardar(); cerrar(); }}>Guardar<//>${f.imagenId && f.estado !== "publicado" && html`<${Boton} tipo="primario" icono="share" onClick=${compartir}>Compartir<//>`}`}>
    <div class="form">
      <${Entrada} etiqueta="Título (para ti)" ...${b(f, set, "titulo")} placeholder="Antes y después SUV de Carla" />
      <div class="rejilla dos-movil"><${Entrada} etiqueta="Fecha" tipo="date" ...${b(f, set, "fecha")} /><${Entrada} etiqueta="Hora" tipo="time" ...${b(f, set, "hora")} /></div>
      <${Chips} valor=${f.pilar} cambiar=${v => set("pilar", v || f.pilar)} opciones=${Object.keys(PILARES).map(k => ({ v: k, n: PILARES[k].n }))} />
      <p class="nota">${(PILARES[f.pilar] || {}).d}</p>
      <div class="rejilla"><${Selector} etiqueta="Formato" opciones=${Object.keys(FORMATOS).map(k => ({ v: k, n: FORMATOS[k] }))} ...${b(f, set, "formato")} />
        <${Selector} etiqueta="Estado" opciones=${["idea", "borrador", "listo", "programado", "publicado"].map(k => ({ v: k, n: ESTADOS.contenido[k].n }))} ...${b(f, set, "estado")} /></div>
      <${Chips} multi valor=${f.redes} cambiar=${v => set("redes", v)} opciones=${Object.keys(REDES).map(k => ({ v: k, n: REDES[k] }))} />
      <${CampoFotos} etiqueta="Imagen" valor=${f.imagenId ? [f.imagenId] : []} cambiar=${v => set("imagenId", v[v.length - 1] || "")} tipo="marketing" nombre=${"post " + (f.titulo || "")} max=${1} ayuda="Créala en el Estudio de diseño o sube una foto." />
      <${Area} etiqueta="Texto de la publicación" filas=${7} ...${b(f, set, "caption")} />
      <div class="btns"><${Boton} chico tipo="fantasma" icono="sparkles" onClick=${() => set("caption", textoSugerido(f.pilar, f))}>Sugerir texto<//><${Boton} chico tipo="fantasma" icono="copy" onClick=${async () => { await copiar(f.caption || ""); aviso("Copiado."); }}>Copiar texto<//></div>
      ${f.estado === "programado" && html`<${AvisoLinea} icono="calendar-clock">${integ ? "Se publicará sola a la hora indicada en Instagram/Facebook (si conectaste tus redes y activaste las tareas automáticas)." : "Aún no conectas Instagram. Usa «Listo para subir» y te llegará un recordatorio por Telegram con la imagen y el texto."}<//>`}
      ${f.estado === "listo" && html`<${Interruptor} etiqueta="Recordármelo por Telegram a esa hora" ...${b(f, set, "recordar")} />`}
      ${c.id && f.imagenId && f.estado !== "publicado" && integ && html`<${BotonAccion} icono="send" accion=${publicar}>Publicar ahora en mis redes<//>`}
      ${f.estado === "publicado" && html`<div class="seccion-form"><h3>¿Cómo le fue? (para aprender qué funciona)</h3><div class="rejilla" style="--col:4">
        ${[["alcance", "Alcance"], ["likes", "Me gusta"], ["envios", "Envíos por DM"], ["guardados", "Guardados"]].map(([k, n]) => html`<${Numero} etiqueta=${n} decimales=${0} valor=${m[k]} cambiar=${v => set("metricas", Object.assign({}, m, { [k]: v }))} />`)}</div>
        <p class="nota">Instagram dice que una de sus señales más importantes es cuántos envían tu publicación por DM (Adam Mosseri).</p></div>`}
    </div><//>`;
}

// ---------------------------------------------------------------- estudio de diseño (canvas con tu marca)
const FORM = { "1:1": [1080, 1080], "4:5": [1080, 1350], "9:16": [1080, 1920] };
const MODELOS = { antesdespues: "Antes y después", paquete: "Paquete o precio", opinion: "Opinión de cliente", consejo: "Consejo", foto: "Foto con título" };
const VERDE = "#D0FF14";
const cargar = src => new Promise((ok, mal) => { const i = new Image(); i.onload = () => ok(i); i.onerror = mal; i.src = src; });
function cubrir(x, img, dx, dy, dw, dh) {
  const r = Math.max(dw / img.width, dh / img.height), w = img.width * r, h = img.height * r;
  x.save(); x.beginPath(); x.rect(dx, dy, dw, dh); x.clip(); x.drawImage(img, dx + (dw - w) / 2, dy + (dh - h) / 2, w, h); x.restore();
}
function lineas(x, txt, max) {
  const out = [];
  String(txt || "").split("\n").forEach(par => {
    let l = ""; par.split(" ").forEach(p => { const t = l ? l + " " + p : p; if (x.measureText(t).width > max && l) { out.push(l); l = p; } else l = t; }); out.push(l);
  });
  return out;
}
function texto(x, txt, X, Y, max, size, { peso = 800, color = "#fff", ancho = true, alto = 1.08, alinear = "left" } = {}) {
  x.font = `${peso} ${size}px Archivo, sans-serif`; try { x.fontStretch = ancho ? "expanded" : "normal"; } catch (e) { }
  x.fillStyle = color; x.textAlign = alinear; x.textBaseline = "top";
  const ls = lineas(x, txt, max); ls.forEach((l, i) => x.fillText(l, X, Y + i * size * alto)); return Y + ls.length * size * alto;
}
function pastilla(x, txt, X, Y, fondo, color, size = 34) {
  x.font = `800 ${size}px Archivo, sans-serif`; try { x.fontStretch = "expanded"; } catch (e) { }
  const w = x.measureText(txt).width + size * 1.2, h = size * 1.7;
  x.fillStyle = fondo; x.beginPath(); x.roundRect ? x.roundRect(X, Y, w, h, h / 2) : x.rect(X, Y, w, h); x.fill();
  x.fillStyle = color; x.textBaseline = "middle"; x.textAlign = "left"; x.fillText(txt, X + size * 0.6, Y + h / 2 + 2); return w;
}
function degradado(x, y0, y1, a0, a1) { const g = x.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, `rgba(0,0,0,${a0})`); g.addColorStop(1, `rgba(0,0,0,${a1})`); x.fillStyle = g; x.fillRect(0, y0, x.canvas.width, y1 - y0); }
function dibujar(cv, modelo, d, imgs, logo, marca) {
  const [W, H] = FORM[d.formato]; cv.width = W; cv.height = H;
  const x = cv.getContext("2d"), M = 72, alto = H / W > 1.6;
  x.fillStyle = "#000"; x.fillRect(0, 0, W, H);
  const web = (d.web || "autocare.pe").replace(/^https?:\/\//, "");
  const pie = (y) => { pastilla(x, d.cta || "Separa tu hora · link en la bio", M, y, VERDE, "#000", 32); };
  const logoArriba = () => { if (logo) x.drawImage(logo, M, M * 0.8, 300, 300 / 4.037); };
  if (modelo === "antesdespues") {
    const [a, dsp] = imgs;
    const zonaH = alto ? H * 0.74 : H * 0.72, y0 = alto ? H * 0.13 : 0;
    if (alto) { if (a) cubrir(x, a, 0, y0, W, zonaH / 2 - 4); if (dsp) cubrir(x, dsp, 0, y0 + zonaH / 2 + 4, W, zonaH / 2 - 4); x.fillStyle = VERDE; x.fillRect(0, y0 + zonaH / 2 - 4, W, 8); }
    else { if (a) cubrir(x, a, 0, y0, W / 2 - 4, zonaH); if (dsp) cubrir(x, dsp, W / 2 + 4, y0, W / 2 - 4, zonaH); x.fillStyle = VERDE; x.fillRect(W / 2 - 4, y0, 8, zonaH); }
    if (!a && !dsp) texto(x, "Elige las fotos de antes y después", M, H * 0.3, W - M * 2, 52, { color: "#666", ancho: false });
    pastilla(x, "ANTES", alto ? M : 36, y0 + 36, "#fff", "#000", 30);
    pastilla(x, "DESPUÉS", alto ? M : W / 2 + 40, alto ? y0 + zonaH / 2 + 40 : y0 + 36, VERDE, "#000", 30);
    if (alto) { logoArriba(); }
    else { degradado(x, 0, 170, 0.75, 0); if (logo) x.drawImage(logo, W - 300 - 36, 40, 300, 300 / 4.037); }
    const yt = y0 + zonaH + (alto ? 50 : 40);
    const yy = texto(x, d.titulo || "Así llegó, así se fue.", M, yt, W - M * 2, alto ? 74 : 60);
    if (d.subtitulo) texto(x, d.subtitulo, M, yy + 10, W - M * 2, 34, { peso: 500, color: "#bbb", ancho: false });
    if (alto) pie(H - M - 60);
  } else if (modelo === "paquete") {
    if (marca) { x.globalAlpha = 0.07; x.drawImage(marca, W * 0.35, H * 0.18, W * 0.85, W * 0.85 * 353 / 406); x.globalAlpha = 1; }
    logoArriba();
    let y = H * (alto ? 0.2 : 0.17);
    y = texto(x, d.titulo || "Brillo Total", M, y, W - M * 2, alto ? 96 : 86);
    texto(x, d.precio ? "S/ " + d.precio : "S/ 79", M, y + 18, W - M * 2, alto ? 190 : 160, { color: VERDE });
    y += (alto ? 190 : 160) + 70;
    String(d.puntos || "").split("\n").filter(Boolean).slice(0, 6).forEach(p => {
      x.fillStyle = VERDE; x.font = "900 44px Archivo, sans-serif"; x.textBaseline = "top"; x.fillText("✓", M, y);
      y = texto(x, p, M + 64, y, W - M * 2 - 64, 42, { peso: 600, ancho: false, color: "#fff", alto: 1.2 }) + 18;
    });
    if (d.subtitulo) texto(x, d.subtitulo, M, y + 10, W - M * 2, 32, { peso: 500, color: "#aaa", ancho: false });
    pie(H - M - 60);
  } else if (modelo === "opinion") {
    if (imgs[0]) { cubrir(x, imgs[0], 0, 0, W, H); x.fillStyle = "rgba(0,0,0,.72)"; x.fillRect(0, 0, W, H); }
    logoArriba();
    texto(x, "★".repeat(Math.max(1, Math.min(5, n0(d.estrellas) || 5))), M, H * 0.24, W, 86, { color: VERDE, ancho: false });
    const y = texto(x, "“" + (d.titulo || "Mi auto quedó como nuevo y no tuve que moverme de casa.") + "”", M, H * 0.24 + 130, W - M * 2, alto ? 70 : 60, { peso: 700, ancho: false, alto: 1.2 });
    texto(x, "— " + (d.subtitulo || "Cliente de AUTOCARE"), M, y + 30, W - M * 2, 38, { peso: 600, color: "#ccc", ancho: false });
    pie(H - M - 60);
  } else if (modelo === "consejo") {
    logoArriba();
    texto(x, "Consejo", M, H * 0.17, W, 40, { color: VERDE });
    let y = texto(x, d.titulo || "3 errores que dañan la pintura de tu auto", M, H * 0.17 + 64, W - M * 2, alto ? 84 : 72) + 40;
    String(d.puntos || "Lavarlo al sol del mediodía\nSecarlo con franela común\nUsar detergente de cocina").split("\n").filter(Boolean).slice(0, 5).forEach((p, i) => {
      x.fillStyle = "#151515"; x.beginPath(); x.roundRect ? x.roundRect(M, y, W - M * 2, 130, 28) : x.rect(M, y, W - M * 2, 130); x.fill();
      texto(x, String(i + 1), M + 34, y + 30, 80, 66, { color: VERDE });
      texto(x, p, M + 130, y + 40, W - M * 2 - 170, 40, { peso: 600, ancho: false });
      y += 150;
    });
    pie(H - M - 60);
  } else {
    if (imgs[0]) cubrir(x, imgs[0], 0, 0, W, H);
    degradado(x, H * 0.45, H, 0, 0.92); degradado(x, 0, 220, 0.7, 0); logoArriba();
    const y = texto(x, d.titulo || "Tu auto como nuevo, sin moverte de casa.", M, H * (alto ? 0.62 : 0.58), W - M * 2, alto ? 86 : 72);
    if (d.subtitulo) texto(x, d.subtitulo, M, y + 14, W - M * 2, 36, { peso: 500, color: "#ddd", ancho: false });
    pie(H - M - 60);
  }
  x.font = "600 26px Archivo, sans-serif"; x.fillStyle = "#777"; x.textAlign = "right"; x.textBaseline = "alphabetic"; try { x.fontStretch = "normal"; } catch (e) { } x.fillText(web, W - M, H - 30);
}
function Estudio() {
  const cv = useRef();
  const [modelo, setModelo] = useState("antesdespues"), [d, set] = useFicha({ formato: "4:5", titulo: "", subtitulo: "", precio: "", puntos: "", estrellas: 5, fotos: [], cta: "Separa tu hora · link en la bio" });
  const [imgs, setImgs] = useState([]), [logos, setLogos] = useState([null, null]), [guardando, setGuardando] = useState(false);
  const web = (N.negocio().web || location.origin + location.pathname.replace(/\/app\/.*$/, "")).replace(/\/+$/, "");
  useEffect(() => { Promise.all([cargar("../assets/logo-horizontal-claro.svg"), cargar("../assets/marca-clara.svg")]).then(setLogos).catch(() => { }); document.fonts && document.fonts.load("800 40px Archivo"); }, []);
  useEffect(() => {
    let vivo = true;
    if (!d.fotos.length) { setImgs([]); return; }
    D.fotosComoDatos(d.fotos).then(m => Promise.all(d.fotos.map(r => (m[r] ? cargar(m[r]) : Promise.resolve(null))))).then(l => vivo && setImgs(l)).catch(() => aviso("No pude cargar una foto. Revisa tu conexión.", { error: true }));
    return () => { vivo = false; };
  }, [d.fotos.join(",")]);
  useEffect(() => { if (cv.current) dibujar(cv.current, modelo, Object.assign({ web }, d), imgs, logos[0], logos[1]); }, [modelo, d, imgs, logos]);
  const ots = D.lista("ordenes").filter(o => (o.fotosAntes || []).length && (o.fotosDespues || []).length).sort((a, c) => String(c.fecha).localeCompare(String(a.fecha))).slice(0, 6);
  const paquetes = N.serviciosActivos().filter(s => s.paquete);
  const resenas = D.lista("resenas").filter(r => r.texto && n0(r.estrellas) >= 4).slice(-6);
  const exportar = () => new Promise(ok => cv.current.toBlob(ok, "image/jpeg", 0.92));
  const compartir = async () => {
    const bl = await exportar(), file = new File([bl], "autocare.jpg", { type: "image/jpeg" });
    await copiar(textoSugerido(modelo === "paquete" ? "oferta" : modelo === "opinion" ? "prueba" : modelo === "consejo" ? "educativo" : "antesdespues", d));
    if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file] }); } catch (e) { } }
    else { const a = document.createElement("a"); a.href = URL.createObjectURL(bl); a.download = "autocare.jpg"; a.click(); }
    aviso("Imagen lista. El texto sugerido ya está copiado.");
  };
  const guardar = async () => {
    setGuardando(true);
    try {
      const ref = await D.agregarFoto(cv.current.toDataURL("image/jpeg", 0.9), "marketing", "post " + (d.titulo || modelo));
      const pilar = modelo === "paquete" ? "oferta" : modelo === "opinion" ? "prueba" : modelo === "consejo" ? "educativo" : modelo === "antesdespues" ? "antesdespues" : "detras";
      const c = D.guardar("contenido", { fecha: hoy(), hora: "19:00", titulo: d.titulo || MODELOS[modelo], formato: d.formato === "9:16" ? "historia" : "post", pilar, estado: "listo", imagenId: ref, redes: ["instagram"], caption: textoSugerido(pilar, d), recordar: true });
      aviso("Guardada en tu calendario. Elige el día y la hora."); ir("contenido/" + c.id);
    } finally { setGuardando(false); }
  };
  return html`<div class="estudio">
    <div class="lienzo-caja"><canvas ref=${cv} style=${{ width: "100%", maxWidth: d.formato === "9:16" ? "360px" : "520px" }}></canvas></div>
    <div class="panel form">
      <div class="modelos">${Object.keys(MODELOS).map(k => html`<button class=${clases("modelo", modelo === k && "activo")} onClick=${() => setModelo(k)}>${MODELOS[k]}</button>`)}</div>
      <${Segmentos} bloque valor=${d.formato} cambiar=${v => set("formato", v)} opciones=${[{ v: "1:1", n: "Cuadrado" }, { v: "4:5", n: "Vertical" }, { v: "9:16", n: "Historia / Reel" }]} />
      ${(modelo === "antesdespues" || modelo === "foto" || modelo === "opinion") && html`
        ${modelo === "antesdespues" && ots.length > 0 && html`<div class="campo"><span class="etq">Usar fotos de una orden</span><div class="chips">${ots.map(o => html`<button class="chip" onClick=${() => set({ fotos: [o.fotosAntes[0], o.fotosDespues[0]], titulo: d.titulo || (o._vehiculo ? o._vehiculo.replace(/\s*\(.*\)/, "") + ": así quedó" : "") })}>${o.numero || fechaCorta(o.fecha)} · ${(o._cliente || "").split(" ")[0]}</button>`)}</div></div>`}
        <${CampoFotos} etiqueta=${modelo === "antesdespues" ? "Fotos (primero antes, luego después)" : "Foto de fondo"} valor=${d.fotos} cambiar=${v => set("fotos", v.slice(0, modelo === "antesdespues" ? 2 : 1))} tipo="marketing" nombre="estudio" max=${modelo === "antesdespues" ? 2 : 1} />`}
      ${modelo === "paquete" && paquetes.length > 0 && html`<div class="chips">${paquetes.map(s => html`<button class="chip" onClick=${() => set({ titulo: s.nombre, precio: String(s.precio), puntos: String(s.incluye || "").split("\n").filter(x => x && !/\+$/.test(x)).join("\n") })}>${s.nombre}</button>`)}</div>`}
      ${modelo === "opinion" && resenas.length > 0 && html`<div class="chips">${resenas.map(r => html`<button class="chip" onClick=${() => set({ titulo: r.texto, subtitulo: r.nombre, estrellas: r.estrellas })}>${r.nombre}</button>`)}</div>`}
      <${Area} etiqueta=${modelo === "opinion" ? "Lo que dijo el cliente" : "Título"} filas=${2} ...${b(d, set, "titulo")} />
      ${modelo === "paquete" && html`<${Entrada} etiqueta="Precio" inputmode="decimal" ...${b(d, set, "precio")} />`}
      ${(modelo === "paquete" || modelo === "consejo") && html`<${Area} etiqueta=${modelo === "consejo" ? "Puntos (uno por línea)" : "Qué gana el cliente (uno por línea)"} filas=${4} ...${b(d, set, "puntos")} />`}
      <${Entrada} etiqueta=${modelo === "opinion" ? "Nombre del cliente" : "Texto pequeño (opcional)"} ...${b(d, set, "subtitulo")} />
      <${Entrada} etiqueta="Botón de abajo" ...${b(d, set, "cta")} />
      <div class="btns"><${Boton} tipo="primario" icono="share" onClick=${compartir}>Compartir o descargar<//><${Boton} icono="calendar-plus" cargando=${guardando} onClick=${guardar}>Guardar en el calendario<//></div>
      <p class="nota">En el iPhone, «Compartir» abre la hoja para enviarla a Instagram o guardarla en Fotos. El texto sugerido queda copiado para que lo pegues.</p>
    </div></div>`;
}

// ---------------------------------------------------------------- estrategia (qué publicar y por qué)
const IDEAS = [
  ["antesdespues", "Antes y después del auto más sucio de la semana", "reel"], ["antesdespues", "Interior con pelos de mascota: así quedó", "reel"],
  ["antesdespues", "Llantas y aros: de opacos a negros profundos", "reel"], ["detras", "Mi ruta de hoy en 15 segundos", "reel"],
  ["detras", "Qué llevo en mi kit para lavar a domicilio", "carrusel"], ["educativo", "Cada cuánto lavar tu auto en Arequipa (polvo y sol)", "carrusel"],
  ["educativo", "3 errores que rayan la pintura", "carrusel"], ["educativo", "Por qué no lavar el auto con detergente de cocina", "reel"],
  ["educativo", "Cómo mantener el interior limpio una semana más", "carrusel"], ["prueba", "Opinión de un cliente con su foto", "post"],
  ["prueba", "Reacción del cliente al ver su auto", "reel"], ["oferta", "Cupos libres de esta semana", "historia"],
  ["oferta", "Plan mensual: tu auto siempre limpio", "post"], ["detras", "Cuánto demora un Brillo Total (time-lapse)", "reel"],
  ["educativo", "Sensores y cámaras sucios: por qué fallan", "reel"]
];
function Estrategia() {
  const crear = (pilar, titulo, formato) => { const c = D.guardar("contenido", { fecha: hoy(), hora: "19:00", titulo, pilar, formato, estado: "idea", redes: ["instagram", "tiktok"], caption: textoSugerido(pilar, { titulo }) }); aviso("Idea guardada en tu calendario."); ir("contenido/" + c.id); };
  return html`<div class="columnas"><div>
    <${Bloque} titulo="Tu semana ideal: 5 publicaciones">
      <div class="grupo">
        <${Fila} icono="play" colorIcono="oro" titulo="3 reels cortos (15 a 30 s) en Instagram y TikTok" sub="Antes y después y detrás de cámaras. Muestra el resultado en los primeros 2 segundos: ahí se decide si siguen mirando." multi />
        <${Fila} icono="layout-grid" colorIcono="azul" titulo="1 carrusel con un consejo útil" sub="Contenido que la gente guarda y le manda a un amigo. Instagram dice que una de sus señales más importantes son los envíos por DM (Adam Mosseri)." multi />
        <${Fila} icono="star" colorIcono="verde" titulo="1 opinión de cliente o una oferta" sub="Da valor tres veces y pide una (Gary Vaynerchuk, Jab, Jab, Jab, Right Hook): consejos y resultados primero, la venta después." multi />
        <${Fila} icono="calendar-days" titulo="Historias todos los días" sub="Tu ruta, un auto terminado, los cupos de mañana. Cuesta poco y te mantiene presente." multi />
      </div><//>
    <${Bloque} titulo="Reglas que funcionan"><div class="panel">
      <p><b>Misma identidad siempre.</b> Logo, verde lima y tipografía en cada pieza. La gente compra a la marca que reconoce rápido (Byron Sharp, How Brands Grow). El estudio ya lo hace por ti.</p>
      <p style="margin-top:10px"><b>Vende la playa.</b> Muestra el auto brillando y al cliente feliz, no la máquina.</p>
      <p style="margin-top:10px"><b>Constancia sobre perfección.</b> Mejor 5 publicaciones simples cada semana que 1 perfecta al mes.</p>
      <p style="margin-top:10px"><b>Llamado claro.</b> Termina siempre con una acción: «Separa tu hora, link en la bio».</p>
      <p style="margin-top:10px"><b>Pide permiso para grabar.</b> Si sale una placa o una casa, pregunta antes y tapa la placa.</p></div><//>
  </div><div>
    <${Bloque} titulo="Ideas listas para usar" sub="Toca una y queda en tu calendario">
      <div class="grupo">${IDEAS.map(([p, t, f]) => html`<${Fila} icono=${f === "reel" ? "play" : f === "carrusel" ? "layout-grid" : "image"} titulo=${t} sub=${PILARES[p].n + " · " + FORMATOS[f]} onClick=${() => crear(p, t, f)} flecha />`)}</div><//>
  </div></div>`;
}

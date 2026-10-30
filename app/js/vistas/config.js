// AUTOCARE · Configuración: negocio, servicios, horario, usuarios, integraciones y tu cuenta
import { html, useState, useEffect } from "../../vendor/preact-htm.js";
import * as D from "../datos.js";
import * as N from "../negocio.js";
import { api } from "../api.js";
import { ir, usarTitulo } from "../app.js";
import { aplicarTema } from "../main.js";
import { Boton, BotonAccion, Hoja, Entrada, Numero, Dinero, Area, Selector, Interruptor, Segmentos, Pestanas, Insignia, Vacio, Fila, Bloque, AvisoLinea, Tabla, Icono, MasDatos, aviso, confirmar, preguntar, useFicha, b } from "../ui.js";
import { soles, duracion, hoy, descargar, copiar, fechaHora, DIAS } from "../util.js";
import { CATEGORIAS_SERVICIO, MODULOS, AREAS, PARTES, CALIDAD, estadoDe } from "../esquema.js";
import { CampoFotos } from "../piezas.js";

export default function Config({ ruta }) {
  D.useDatos();
  usarTitulo("Configuración");
  const admin = D.esAdmin(), cfg = D.puede("config", 2);
  const tabs = [cfg && { v: "negocio", n: "Negocio" }, cfg && { v: "servicios", n: "Servicios y precios" }, cfg && { v: "web", n: "Mi web" }, cfg && { v: "horario", n: "Horario y reservas" },
    admin && { v: "usuarios", n: "Usuarios" }, admin && { v: "integraciones", n: "Avisos y redes" }, { v: "cuenta", n: "Mi cuenta" }].filter(Boolean);
  const t = tabs.some(x => x.v === ruta.partes[0]) ? ruta.partes[0] : tabs[0].v;
  return html`<header class="pagina-cab"><div><h1>Configuración</h1><p>Lo que cambies aquí se guarda en tu hoja y lo usa tu web.</p></div></header>
    <${Pestanas} valor=${t} cambiar=${v => ir("config/" + v, true)} opciones=${tabs} />
    ${t === "negocio" && html`<${Negocio} />`}${t === "servicios" && html`<${Servicios} />`}${t === "web" && html`<${MiWeb} />`}${t === "horario" && html`<${Horario} />`}
    ${t === "usuarios" && html`<${Usuarios} />`}${t === "integraciones" && html`<${Integraciones} />`}${t === "cuenta" && html`<${Cuenta} />`}`;
}

// ---------------------------------------------------------------- negocio y fidelidad
function Negocio() {
  const n = D.ajuste("negocio", {}), fi = D.ajuste("fidelidad", {});
  const [f, set] = useFicha(Object.assign({ nombre: "AUTOCARE", eslogan: "", tel: "", distrito: "Arequipa", zonas: "", web: location.origin + location.pathname.replace(/\/app\/?.*$/, ""), google: "", ruc: "", pagos: "", ig: "", fb: "", tt: "", yapeNum: "", yapeTit: "" },
    n, { ig: (n.redes || {}).ig || "", fb: (n.redes || {}).fb || "", tt: (n.redes || {}).tt || "", yapeNum: (n.yape || {}).numero || "", yapeTit: (n.yape || {}).titular || "" }));
  const [F, setF] = useFicha(Object.assign({ activo: true, cada: 8, regalo: 2, bono: 1, premio: "Lavado completo", volver: 30, manual: true }, fi));
  const guardar = () => {
    const { ig, fb, tt, yapeNum, yapeTit, ...resto } = f;
    const tel = N.telLimpio(resto.tel);
    if (tel && tel.length !== 9) return aviso("El WhatsApp del negocio debe tener 9 dígitos (sin +51).", { error: true });
    D.fijarAjuste("negocio", Object.assign({}, n, resto, { tel, redes: Object.assign({}, n.redes || {}, N.limpiarRedes({ ig, fb, tt })), yape: yapeNum ? { numero: N.telLimpio(yapeNum), titular: yapeTit } : null }));
    D.fijarAjuste("fidelidad", Object.assign({}, F, { manual: true, cada: Math.max(2, Number(F.cada) || 8) }));
    aviso("Datos del negocio guardados.");
  };
  return html`<div style="margin-bottom:16px"><${AvisoLinea} c="oro" icono="info" accion=${html`<${Boton} chico href="#/arranque">Paso a paso<//>`}>Todo lo de aquí se cambia cuando quieras y se actualiza solo en tu web, la tarjeta de tus clientes, tus enlaces y tus mensajes (en unos minutos).<//></div>
    <div class="columnas mitad">
    <div class="panel form">
      <div class="titulo-seccion"><h3>Lo básico</h3></div>
      <div class="rejilla"><${Entrada} etiqueta="Nombre" ...${b(f, set, "nombre")} /><${Entrada} etiqueta="Frase corta" ...${b(f, set, "eslogan")} placeholder="Detailing a domicilio" /></div>
      <div class="rejilla"><${Entrada} etiqueta="Ciudad o distrito base" ...${b(f, set, "distrito")} /><${Entrada} etiqueta="Zonas que atiendes" ...${b(f, set, "zonas")} placeholder="Cayma, Yanahuara, Cerro Colorado…" /></div>
      <div class="separador"></div>
      <div class="titulo-seccion"><h3>Contacto y pagos</h3><p>¿Cambias de número? Solo cámbialo aquí. Lo impreso (polo, QR, stickers, tarjetas) no lleva tu número: no tienes que reimprimir nada.</p></div>
      <${Entrada} etiqueta="WhatsApp del negocio" ...${b(f, set, "tel")} />
      <div class="rejilla"><${Entrada} etiqueta="Yape: número" ...${b(f, set, "yapeNum")} /><${Entrada} etiqueta="Yape: titular" ...${b(f, set, "yapeTit")} /></div>
      <div class="separador"></div>
      <div class="titulo-seccion"><h3>Redes</h3><p>Salen como botones en tu web, en la tarjeta de tus clientes y en tu página de enlaces.</p></div>
      <div class="rejilla"><${Entrada} etiqueta="Instagram (usuario)" ...${b(f, set, "ig")} /><${Entrada} etiqueta="TikTok (usuario)" ...${b(f, set, "tt")} /></div>
      <${Entrada} etiqueta="Facebook (enlace)" ...${b(f, set, "fb")} />
      <${Entrada} etiqueta="Enlace para dejar reseña en Google" ...${b(f, set, "google")} ayuda="Google Business Profile → Pedir reseñas → copiar enlace. Se muestra a todos los clientes por igual (regla de Google)." />
      <${MasDatos} titulo="Avanzado (opcional)">
        <${Entrada} etiqueta="Dirección de tu web" ...${b(f, set, "web")} ayuda="Se usa para el enlace personal de cada cliente y los QR. Cámbiala solo si mueves tu web." />
        <${Entrada} etiqueta="RUC (si tienes)" ...${b(f, set, "ruc")} />
      <//>
    </div>
    <div><div class="panel form"><h3>Fidelidad</h3>
      <${Interruptor} etiqueta="Tarjeta de sellos activa" ...${b(F, setF, "activo")} />
      <div class="rejilla"><${Numero} etiqueta="Sellos de la tarjeta" decimales=${0} ...${b(F, setF, "cada")} /><${Numero} etiqueta="Sellos de regalo con el primer servicio" decimales=${0} ...${b(F, setF, "regalo")} /></div>
      <p class="nota">Con 2 de regalo el cliente siente que ya avanzó y vuelve antes: en un car wash, 34% completó la tarjeta con regalo frente a 19% sin regalo (Nunes y Drèze, 2006). Tú sumas cada sello desde la orden o la ficha del cliente.</p>
      <${Entrada} etiqueta="Premio" ...${b(F, setF, "premio")} />
      <${Numero} etiqueta="Días normales entre lavados" decimales=${0} ...${b(F, setF, "volver")} ayuda="Para avisarte a quién le toca volver si el servicio no tiene sus propios días." />
    </div>
    <div style="margin-top:14px"><${Boton} tipo="primario" grande bloque onClick=${guardar}>Guardar cambios<//></div></div>
  </div>`;
}

// ---------------------------------------------------------------- servicios
function Servicios() {
  const [ed, setEd] = useState(null);
  const lista = D.lista("servicios").slice().sort((a, c) => (a.orden || 999) - (c.orden || 999) || (a.precio || 0) - (c.precio || 0));
  return html`<${Bloque} titulo="Tus servicios" sub="Precio para auto o sedán; el recargo por tamaño se calcula solo." der=${html`<${Boton} tipo="primario" icono="plus" onClick=${() => setEd({})}>Nuevo servicio<//>`}>
    <${Tabla} filas=${lista} onFila=${setEd} vacio=${html`<${Vacio} icono="sparkles" titulo="Aún no tienes servicios" texto="Agrega tu primer servicio: nombre, precio y cuánto demora."><${Boton} tipo="primario" onClick=${() => setEd({})}>Nuevo servicio<//><//>`}
      movil=${s => html`<${Fila} icono="sparkles" titulo=${s.nombre} sub=${duracion(s.minutos || 60) + " · " + estadoDe("servicios", s.estado || "activo").n} der=${html`<b class="cifra">${soles(s.precio)}</b>`} onClick=${() => setEd(s)} />`}
      cols=${[{ k: "nombre", n: "Servicio", clase: "prin" }, { k: "categoria", n: "Categoría", f: s => CATEGORIAS_SERVICIO[s.categoria] || "", clase: "tenue" }, { k: "minutos", n: "Duración", f: s => duracion(s.minutos || 60) },
        { k: "precio", n: "Precio", num: true, f: s => soles(s.precio) }, { k: "pasos", n: "Pasos", num: true, f: s => (s.pasos || []).length || "", ordenar: false },
        { k: "web", n: "En la web", f: s => (s.web !== false ? "Sí" : "No") }, { k: "estado", n: "Estado", f: s => html`<${Insignia} c=${estadoDe("servicios", s.estado || "activo").c}>${estadoDe("servicios", s.estado || "activo").n}<//>` }]} />
    ${ed && html`<${FormServicio} s=${ed} cerrar=${() => setEd(null)} />`}<//>
    <${RevisionFinal} />`;
}
// Revisión final por partes (Gawande): cada orden muestra solo lo de las partes que se trabajaron, más lo de «Siempre».
function RevisionFinal() {
  const [lista, setLista] = useState(() => N.listaCalidad().map(x => Object.assign({}, x)));
  const [nuevo, setNuevo] = useState(""), [parte, setParte] = useState("exterior");
  const guardar = l => { setLista(l); D.fijarAjuste("calidad", l); };
  const grupos = [...Object.keys(PARTES), "siempre"].map(a => [a, lista.filter(x => (x.a || "siempre") === a)]);
  const agregar = () => { if (!nuevo.trim()) return; guardar([...lista, { t: nuevo.trim(), a: parte }]); setNuevo(""); aviso("Punto agregado."); };
  const editar = async (x, i) => { const t = await preguntar({ titulo: "Editar punto", etiqueta: "Qué revisas", valor: x.t, si: "Guardar" }); if (t) guardar(lista.map(y => (y === x ? Object.assign({}, y, { t }) : y))); };
  const restaurar = async () => { if (await confirmar({ titulo: "Volver a la lista sugerida", texto: "Se reemplaza tu lista por la sugerida (12 puntos por partes).", si: "Restaurar" })) guardar(CALIDAD.map(x => Object.assign({}, x))); };
  return html`<${Bloque} titulo="Revisión final (control de calidad)" sub="Cada orden muestra solo los puntos de las partes que trabajó (lo eliges en cada servicio) y los de «Siempre»."
    der=${html`<${Boton} chico tipo="fantasma" icono="rotate-ccw" onClick=${restaurar}>Lista sugerida<//>`}>
    <div class="panel">
      ${grupos.filter(g => g[1].length).map(([a, l]) => html`<p class="campo-t" style="margin:6px 0">${a === "siempre" ? "Siempre (todas las órdenes)" : PARTES[a]}</p>
        <div class="grupo" style="margin-bottom:12px">${l.map(x => html`<div class="fila compacta"><span class="cuerpo"><span class="t" style="white-space:normal">${x.t}</span></span>
          <span class="der"><${Boton} chico tipo="fantasma" icono="pencil" titulo="Editar" onClick=${() => editar(x)} /><${Boton} chico tipo="fantasma" icono="trash-2" titulo="Quitar" onClick=${() => guardar(lista.filter(y => y !== x))} /></span></div>`)}</div>`)}
      <div class="rejilla" style="align-items:end"><${Entrada} etiqueta="Agregar un punto" valor=${nuevo} cambiar=${setNuevo} placeholder="Ej.: Faros sin restos de pulimento" />
        <${Selector} etiqueta="Parte" valor=${parte} cambiar=${setParte} opciones=${[...Object.keys(PARTES).map(k => ({ v: k, n: PARTES[k] })), { v: "siempre", n: "Siempre" }]} /></div>
      <div class="btns" style="margin-top:10px"><${Boton} icono="plus" onClick=${agregar}>Agregar<//></div>
      <p class="nota" style="margin-top:10px">Consejo de Gawande: una buena lista es corta (5 a 9 puntos por orden) y solo trae lo que de verdad se olvida.</p>
    </div><//>`;
}
function FormServicio({ s, cerrar }) {
  const [f, set] = useFicha(Object.assign({ nombre: "", categoria: "lavado", precio: null, minutos: 60, estado: "activo", web: true, porTamano: true, adelanto: false, volver: 30, descripcion: "", destacado: false, paquete: false, incluye: "", fotoId: "" }, s, { pasosTxt: (s.pasos || []).map(p => p.t || p).join("\n") }));
  const guardar = () => {
    if (!String(f.nombre).trim()) return aviso("Escribe el nombre del servicio.", { error: true });
    if (!(Number(f.precio) > 0)) return aviso("Escribe el precio.", { error: true });
    const { pasosTxt, ...r } = f;
    D.guardar("servicios", Object.assign(r, { pasos: pasosTxt.split("\n").map(x => x.trim()).filter(Boolean).map(t => ({ t })) }));
    aviso("Servicio guardado."); cerrar();
  };
  const borrar = async () => { if (await confirmar({ titulo: "Eliminar servicio", texto: "Si ya lo usaste en órdenes, mejor ponlo en pausa.", si: "Eliminar", peligro: true })) { D.borrar("servicios", s.id); cerrar(); } };
  return html`<${Hoja} titulo=${s.id ? "Editar servicio" : "Nuevo servicio"} cerrar=${cerrar} pie=${html`${s.id && html`<${Boton} tipo="fantasma peligro" icono="trash-2" titulo="Eliminar" onClick=${borrar} />`}<${Boton} tipo="fantasma" onClick=${cerrar}>Cancelar<//><${Boton} tipo="primario" onClick=${guardar}>Guardar<//>`}>
    <div class="form">
      <${Entrada} etiqueta="Nombre" ...${b(f, set, "nombre")} placeholder="Lavado completo" />
      <div class="rejilla"><${Dinero} etiqueta="Precio (auto o sedán)" ...${b(f, set, "precio")} /><${Numero} etiqueta="Minutos que demora" decimales=${0} ...${b(f, set, "minutos")} /></div>
      <${Interruptor} etiqueta="Mostrar en la web" ...${b(f, set, "web")} />
      <${Interruptor} etiqueta="Activo" valor=${f.estado !== "pausado"} cambiar=${v => set("estado", v ? "activo" : "pausado")} ayuda="Si lo apagas, deja de ofrecerse, pero no se borra." />
      <${MasDatos} titulo="Cómo se ve en tu web" abierto=${!!(f.paquete || f.descripcion)}>
        <${Interruptor} etiqueta="Es un paquete (sale en la sección de paquetes de tu web)" ...${b(f, set, "paquete")} />
        ${f.paquete && html`<${Area} etiqueta="Qué incluye (una línea por beneficio)" filas=${5} ...${b(f, set, "incluye")} ayuda="Escribe lo que gana el cliente: «Pintura brillante como nueva», no «cera carnauba»." />`}
        <${Interruptor} etiqueta="Destacado (el que quieres que elijan)" ayuda="Arma 3 paquetes y destaca el del medio. El más caro sirve de ancla para que el del medio se vea conveniente (efecto señuelo, Dan Ariely)." ...${b(f, set, "destacado")} />
        <${Area} etiqueta="Descripción para tu web" ...${b(f, set, "descripcion")} placeholder="Qué incluye, en palabras del cliente" />
        <${CampoFotos} etiqueta="Foto para la web (opcional)" valor=${f.fotoId ? [f.fotoId] : []} cambiar=${v => set("fotoId", v[v.length - 1] || "")} tipo="marketing" nombre=${"servicio " + f.nombre} max=${1} />
      <//>
      <${MasDatos} titulo="Pasos del servicio" abierto=${!!String(f.pasosTxt || "").trim()}>
        <${Area} etiqueta="Pasos del servicio (uno por línea)" filas=${6} ...${b(f, set, "pasosTxt")} ayuda="Se vuelven el checklist de cada orden. Así lo haces igual siempre, y mañana un ayudante también." />
      <//>
      <${MasDatos} titulo="Partes del auto que trabaja" abierto=${Array.isArray(f.partes) && f.partes.length > 0}>
        <p class="nota" style="margin:0">Con esto la revisión final muestra solo lo que corresponde: un lavado exterior no revisa el interior.${!(Array.isArray(f.partes) && f.partes.length) ? " Por ahora se deduce del nombre y los pasos." : ""}</p>
        <div class="chips">${Object.keys(PARTES).map(k => { const act = (Array.isArray(f.partes) && f.partes.length ? f.partes : N.partesServicio(Object.assign({}, f, { partes: null, pasos: String(f.pasosTxt || "").split("\n") }))).includes(k);
          return html`<button type="button" class=${"chip" + (act ? " activo" : "")} aria-pressed=${act} onClick=${() => { const base = Array.isArray(f.partes) && f.partes.length ? f.partes : N.partesServicio(Object.assign({}, f, { partes: null, pasos: String(f.pasosTxt || "").split("\n") })); set("partes", act ? base.filter(x => x !== k) : [...base, k]); }}>${PARTES[k]}</button>`; })}</div>
      <//>
      <${MasDatos} titulo="Más ajustes (opcional)">
        <div class="rejilla"><${Selector} etiqueta="Categoría" opciones=${Object.keys(CATEGORIAS_SERVICIO).map(k => ({ v: k, n: CATEGORIAS_SERVICIO[k] }))} ...${b(f, set, "categoria")} />
          <${Numero} etiqueta="El cliente vuelve cada (días)" decimales=${0} ...${b(f, set, "volver")} /></div>
        <${Interruptor} etiqueta="Sube de precio según el tamaño" ayuda="SUV +20%, camioneta +30%, van +40%" ...${b(f, set, "porTamano")} />
        <${Interruptor} etiqueta="Pide adelanto al reservar" ...${b(f, set, "adelanto")} />
      <//>
    </div><//>`;
}

// ---------------------------------------------------------------- mi web: portada, antes y después, videos y productos
function MiWeb() {
  const [gal, setGal] = useState(() => D.ajuste("galeria", []) || []), [vid, setVid] = useState(() => D.ajuste("webVideos", []) || []);
  const [prod, setProd] = useState(() => D.ajuste("webProductos", []) || []), [port, setPort] = useState(() => (D.ajuste("webPortada", {}) || {}).fotoId || "");
  const guardar = () => {
    D.fijarAjuste("galeria", gal.filter(g => g.antesId && g.despuesId)); D.fijarAjuste("webVideos", vid.filter(v => v.url));
    D.fijarAjuste("webProductos", prod.filter(p => p.nombre)); D.fijarAjuste("webPortada", { fotoId: port });
    aviso("Tu web se actualiza en unos minutos.");
  };
  const cambiar = (l, set, i, k, v) => set(l.map((x, j) => (j === i ? Object.assign({}, x, { [k]: v }) : x)));
  const web = (N.negocio().web || location.origin + location.pathname.replace(/\/app\/.*$/, "")).replace(/\/+$/, "");
  return html`<${AvisoLinea} c="oro" icono="lightbulb">Vende la playa, no el avión: muestra cómo queda el auto, no las máquinas. Las fotos reales de antes y después son tu mejor vendedor; con 5 o más opiniones visibles, la probabilidad de compra sube mucho (Spiegel Research Center).<//>
    <div class="columnas" style="margin-top:16px"><div>
      <${Bloque} titulo="Antes y después" sub="Mismo ángulo, misma luz. El cliente desliza para comparar.">
        ${gal.map((g, i) => html`<div class="panel" style="margin-bottom:10px"><div class="rejilla">
          <${CampoFotos} etiqueta="Antes" valor=${g.antesId ? [g.antesId] : []} cambiar=${v => cambiar(gal, setGal, i, "antesId", v[v.length - 1] || "")} tipo="marketing" nombre="antes" max=${1} />
          <${CampoFotos} etiqueta="Después" valor=${g.despuesId ? [g.despuesId] : []} cambiar=${v => cambiar(gal, setGal, i, "despuesId", v[v.length - 1] || "")} tipo="marketing" nombre="despues" max=${1} /></div>
          <${Entrada} etiqueta="Frase corta (opcional)" valor=${g.txt} cambiar=${v => cambiar(gal, setGal, i, "txt", v)} placeholder="Interior de SUV después de 2 años sin limpieza" />
          <div class="btns fin" style="margin-top:8px"><${Boton} chico tipo="fantasma peligro" icono="trash-2" onClick=${() => setGal(gal.filter((x, j) => j !== i))}>Quitar<//></div></div>`)}
        ${gal.length < 12 && html`<${Boton} icono="plus" onClick=${() => setGal([...gal, { antesId: "", despuesId: "", txt: "" }])}>Agregar antes y después<//>`}<//>
      <${Bloque} titulo="Videos" sub="Pega el enlace de un reel de Instagram, un TikTok o un video de YouTube.">
        ${vid.map((v, i) => html`<div class="rejilla" style="margin-bottom:8px;align-items:end"><${Entrada} etiqueta="Enlace" valor=${v.url} cambiar=${x => cambiar(vid, setVid, i, "url", x)} placeholder="https://www.instagram.com/reel/…" />
          <div style="display:flex;gap:8px;align-items:end"><${Entrada} etiqueta="Título" valor=${v.titulo} cambiar=${x => cambiar(vid, setVid, i, "titulo", x)} /><${Boton} tipo="fantasma" icono="trash-2" titulo="Quitar" onClick=${() => setVid(vid.filter((x, j) => j !== i))} /></div></div>`)}
        <${Boton} icono="plus" onClick=${() => setVid([...vid, { url: "", titulo: "" }])}>Agregar video<//><//>
    </div><div>
      <${Bloque} titulo="Foto de portada" sub="Tu mejor auto terminado, a lo ancho."><div class="panel"><${CampoFotos} valor=${port ? [port] : []} cambiar=${v => setPort(v[v.length - 1] || "")} tipo="marketing" nombre="portada" max=${1} /></div><//>
      <${Bloque} titulo="Con qué cuidamos tu auto" sub="Marcas reconocidas dan confianza (Cialdini, autoridad).">
        ${prod.map((p, i) => html`<div class="panel" style="margin-bottom:10px"><div class="rejilla"><${Entrada} etiqueta="Producto" valor=${p.nombre} cambiar=${v => cambiar(prod, setProd, i, "nombre", v)} /><${Entrada} etiqueta="Marca" valor=${p.marca} cambiar=${v => cambiar(prod, setProd, i, "marca", v)} /></div>
          <${Entrada} etiqueta="Qué gana tu auto" valor=${p.para} cambiar=${v => cambiar(prod, setProd, i, "para", v)} placeholder="Brillo profundo y protección contra el sol" />
          <div class="rejilla" style="margin-top:8px;align-items:end"><${CampoFotos} etiqueta="Foto" valor=${p.fotoId ? [p.fotoId] : []} cambiar=${v => cambiar(prod, setProd, i, "fotoId", v[v.length - 1] || "")} tipo="marketing" nombre="producto" max=${1} /><div class="btns fin"><${Boton} chico tipo="fantasma peligro" icono="trash-2" onClick=${() => setProd(prod.filter((x, j) => j !== i))}>Quitar<//></div></div></div>`)}
        <${Boton} icono="plus" onClick=${() => setProd([...prod, { nombre: "", marca: "", para: "", fotoId: "" }])}>Agregar producto<//><//>
      <${Bloque} titulo="QR para imprimir" sub="Para la ventana de tu auto, volantes y reseñas en Google."><div class="panel">
        <p class="nota" style="margin-bottom:10px">Cada QR lleva su origen: en Resultados ves cuántas personas llegaron por cada uno.</p>
        <${Boton} icono="qr-code" onClick=${() => import("../app.js").then(m => m.abrir(() => import("./acceso.js"), "QrNegocio"))}>Crear QR de mi negocio<//></div><//>
      <div class="btns"><${Boton} tipo="primario" grande onClick=${guardar}>Guardar mi web<//><${Boton} grande icono="external-link" href=${web}>Ver mi web<//></div>
    </div></div>`;
}

// ---------------------------------------------------------------- horario y reservas
function Horario() {
  const H = N.horario(), R = Object.assign({ activo: true, adelantoDesdeMin: 180, adelantoPct: 30 }, D.ajuste("reservas", {}));
  const [dias, setDias] = useState(() => { const o = {}; for (let d = 0; d < 7; d++) o[d] = (H.dias[String(d)] || [])[0] || null; return o; });
  const [f, set] = useFicha({ intervalo: H.intervalo, traslado: H.traslado, maxHoras: H.maxHoras, anticipacion: H.anticipacion, diasAdelante: H.diasAdelante, activo: R.activo !== false, adelantoDesdeMin: R.adelantoDesdeMin, adelantoPct: R.adelantoPct });
  const guardar = () => {
    const d = {}; Object.keys(dias).forEach(k => (d[k] = dias[k] ? [dias[k]] : []));
    D.fijarAjuste("horario", Object.assign({}, D.ajuste("horario", {}), { dias: d, intervalo: f.intervalo, traslado: f.traslado, maxHoras: f.maxHoras, anticipacion: f.anticipacion, diasAdelante: f.diasAdelante }));
    D.fijarAjuste("reservas", Object.assign({}, D.ajuste("reservas", {}), { activo: f.activo, adelantoDesdeMin: f.adelantoDesdeMin, adelantoPct: f.adelantoPct }));
    aviso("Horario guardado.");
  };
  return html`<div class="columnas mitad">
    <div class="panel form"><h3>Días y horas que atiendes</h3>
      ${[1, 2, 3, 4, 5, 6, 0].map(d => html`<div class="rejilla dos-movil" style="--col:3;align-items:end">
        <${Interruptor} etiqueta=${DIAS[d].replace(/^./, x => x.toUpperCase())} valor=${!!dias[d]} cambiar=${v => setDias(Object.assign({}, dias, { [d]: v ? ["08:00", "18:00"] : null }))} />
        ${dias[d] ? html`<${Entrada} tipo="time" valor=${dias[d][0]} cambiar=${v => setDias(Object.assign({}, dias, { [d]: [v, dias[d][1]] }))} aria-label="Desde" />
          <${Entrada} tipo="time" valor=${dias[d][1]} cambiar=${v => setDias(Object.assign({}, dias, { [d]: [dias[d][0], v] }))} aria-label="Hasta" />` : html`<span class="nota">Cerrado</span><span></span>`}
      </div>`)}
    </div>
    <div><div class="panel form"><h3>Capacidad</h3>
      <div class="rejilla"><${Numero} etiqueta="Máximo de horas de trabajo al día" decimales=${1} ...${b(f, set, "maxHoras")} /><${Numero} etiqueta="Minutos de traslado entre citas" decimales=${0} ...${b(f, set, "traslado")} /></div>
      <div class="rejilla"><${Numero} etiqueta="Ofrecer horas cada (min)" decimales=${0} ...${b(f, set, "intervalo")} /><${Numero} etiqueta="Reservar con (horas) de anticipación" decimales=${0} ...${b(f, set, "anticipacion")} /></div>
      <${Numero} etiqueta="Se puede reservar hasta (días adelante)" decimales=${0} ...${b(f, set, "diasAdelante")} />
    </div>
    <div class="panel form"><h3>Reservas desde tu web</h3>
      <${Interruptor} etiqueta="Recibir reservas en línea" ...${b(f, set, "activo")} />
      <div class="rejilla"><${Numero} etiqueta="Pedir adelanto desde (min)" decimales=${0} ...${b(f, set, "adelantoDesdeMin")} /><${Numero} etiqueta="Adelanto (%)" decimales=${0} ...${b(f, set, "adelantoPct")} /></div>
      <p class="nota">El adelanto en servicios largos reduce las citas perdidas: quien paga una parte, llega.</p>
    </div>
    <div style="margin-top:14px"><${Boton} tipo="primario" grande bloque onClick=${guardar}>Guardar horario<//></div></div>
  </div>`;
}

// ---------------------------------------------------------------- usuarios
function Usuarios() {
  const [d, setD] = useState(null), [ed, setEd] = useState(null), [err, setErr] = useState("");
  const cargar = () => api("usuarios").then(setD).catch(e => setErr(e.message));
  useEffect(() => { cargar(); }, []);
  if (err) return html`<${AvisoLinea} c="rojo" icono="wifi-off">${err}<//>`;
  if (!d) return html`<p class="nota">Cargando usuarios…</p>`;
  const clave = async u => {
    if (!(await confirmar({ titulo: "Nueva clave para " + u.nombre, texto: "Se cierra su sesión y le das la clave temporal.", si: "Crear clave" }))) return;
    const r = await api("usuarioClave", { id: u.id });
    await confirmar({ titulo: "Clave temporal", texto: `Usuario: ${u.usuario} · Clave: ${r.clave}. Pásasela por WhatsApp; puede cambiarla en Mi cuenta.`, si: "Listo", no: "Cerrar" });
  };
  const nombreArea = a => (AREAS.find(x => x.v === a) || {}).n || a;
  const areasTxt = u => (u.areas || []).length >= AREAS.length ? "todas las áreas" : (u.areas || []).map(nombreArea).join(", ");
  return html`${d.usuarios.length < 2 && html`<div style="margin-bottom:16px"><${AvisoLinea} c="oro" icono="handshake"><b>¿Tienes socia o socio?</b> Crea su usuario como <b>Co-gerente</b> y marca sus áreas (por ejemplo WhatsApp y ventas, cobros, logística y marketing). Luego edita el tuyo y deja solo <b>Servicio en campo</b>: así cada uno ve primero lo suyo y recibe solo sus avisos.<//></div>`}
    <${Bloque} titulo="Personas con acceso" sub="Co-gerente: acceso total. Técnico: ve su agenda y órdenes, no las finanzas." der=${html`<${Boton} tipo="primario" icono="user-plus" onClick=${() => setEd({ rol: "admin" })}>Nuevo usuario<//>`}>
    <div class="grupo">${d.usuarios.map(u => html`<${Fila} avatar=${u.nombre} titulo=${u.nombre + (u.dueno ? " (dueño)" : "")} sub=${"@" + u.usuario + " · " + (u.rol === "admin" ? (u.dueno ? "Gerente" : "Co-gerente") : (d.roles[u.rol] || {}).nombre) + " · " + areasTxt(u) + (u.ultimoAcceso ? " · entró " + fechaHora(u.ultimoAcceso) : "")}
      der=${html`${!u.activo && html`<${Insignia}>Desactivado<//>`}${!u.dueno && html`<${Boton} chico tipo="fantasma" onClick=${() => clave(u)}>Clave<//>`}<${Boton} chico onClick=${() => setEd(u)}>Editar<//>`} />`)}</div>
    ${ed && html`<${FormUsuario} u=${ed} roles=${d.roles} cerrar=${() => setEd(null)} listo=${r => { setD(Object.assign({}, d, { usuarios: r.usuarios })); setEd(null); D.refrescarEquipo(); }} />`}<//>`;
}
function FormUsuario({ u, roles, cerrar, listo }) {
  const [f, set] = useFicha(Object.assign({ nombre: "", usuario: "", rol: "tecnico", activo: true }, u));
  const [perm, setPerm] = useState(u.permisos || (roles[f.rol] || roles.tecnico).permisos);
  const [areas, setAreas] = useState(u.areas && u.areas.length ? u.areas : f.rol === "tecnico" ? ["campo"] : AREAS.map(x => x.v));
  const guardar = async () => {
    if (!areas.length) throw new Error("Marca al menos un área.");
    const r = await api("usuarioGuardar", { id: u.id, nombre: f.nombre, usuario: f.usuario, rol: u.dueno ? "admin" : f.rol, activo: f.activo, permisos: f.rol === "admin" ? null : perm, areas });
    if (r.clave) await confirmar({ titulo: "Usuario creado", texto: `Usuario: ${r.usuarios.find(x => x.nombre === f.nombre || x.usuario === f.usuario)?.usuario || f.usuario} · Clave temporal: ${r.clave}. Pásasela; la cambia en Mi cuenta.`, si: "Listo", no: "Cerrar" });
    listo(r);
  };
  return html`<${Hoja} titulo=${u.id ? "Editar usuario" : "Nuevo usuario"} cerrar=${cerrar} pie=${html`<${Boton} tipo="fantasma" onClick=${cerrar}>Cancelar<//><${BotonAccion} tipo="primario" accion=${guardar}>Guardar<//>`}>
    <div class="form">
      <div class="rejilla"><${Entrada} etiqueta="Nombre" ...${b(f, set, "nombre")} /><${Entrada} etiqueta="Usuario para entrar" autocapitalize="off" ...${b(f, set, "usuario")} /></div>
      ${!u.dueno && html`<${Segmentos} etiqueta="Rol" valor=${f.rol} cambiar=${v => { set("rol", v); setPerm(roles[v].permisos); }} opciones=${[{ v: "admin", n: "Co-gerente" }, ...Object.keys(roles).filter(k => k !== "admin").map(k => ({ v: k, n: roles[k].nombre }))]} />`}
      ${f.rol === "admin" || u.dueno ? html`<${AvisoLinea} c="verde" icono="shield-check">Acceso total: ve y cambia todo, igual que tú.<//>`
        : html`<div class="grupo">${Object.keys(MODULOS).map(m => html`<div class="fila compacta"><span class="cuerpo"><span class="t">${MODULOS[m]}</span></span>
        <span class="der"><${Segmentos} valor=${Number(perm[m] || 0)} cambiar=${v => setPerm(Object.assign({}, perm, { [m]: v }))} opciones=${[{ v: 0, n: "No" }, { v: 1, n: "Ver" }, { v: 2, n: "Cambiar" }]} /></span></div>`)}</div>`}
      <div><p class="etq" style="font-size:13px;font-weight:600;color:var(--texto-2);margin-bottom:8px">Sus áreas: lo que ve primero en Inicio y los avisos que le llegan</p>
        <div class="grupo">${AREAS.map(a => html`<label class="fila compacta" style="cursor:pointer"><span class="ico"><${Icono} n=${a.i} /></span><span class="cuerpo"><span class="t">${a.n}</span><span class="s">${a.d}</span></span>
          <span class="der"><input type="checkbox" checked=${areas.includes(a.v)} onChange=${e => setAreas(e.target.checked ? [...areas, a.v] : areas.filter(x => x !== a.v))} style="width:22px;height:22px;accent-color:var(--oro)" /></span></label>`)}</div></div>
      ${u.id && !u.dueno && html`<${Interruptor} etiqueta="Acceso activo" ...${b(f, set, "activo")} />`}
    </div><//>`;
}

// Cada persona conecta su propio Telegram con un enlace que lleva su código (t.me/bot?start=código)
function MiTelegram({ listo }) {
  const [v, setV] = useState(null), [err, setErr] = useState("");
  useEffect(() => { api("telegramVincular").then(setV).catch(e => setErr(e.message)); }, []);
  if (err) return html`<${AvisoLinea} c="rojo" icono="triangle-alert">${err}<//>`;
  if (!v) return html`<p class="nota">Preparando tu enlace…</p>`;
  return html`<p>Conecta <b>tu</b> Telegram para recibir los avisos de tus áreas. Cada persona del equipo lo hace desde su propio celular.</p>
    <a class="btn primario" href=${v.enlace} target="_blank" rel="noopener"><${Icono} n="send" />1. Abrir @${v.bot} y tocar Iniciar</a>
    <${BotonAccion} accion=${async () => listo(await api("telegramConectar", { codigo: v.codigo }))}>2. Ya toqué Iniciar, conectar<//>`;
}

// ---------------------------------------------------------------- avisos (Telegram) y redes
function Integraciones() {
  const [i, setI] = useState(null), [tk, setTk] = useState(""), [ig, setIg] = useState(""), [fb, setFb] = useState({ token: "", pagina: "" }), [err, setErr] = useState("");
  useEffect(() => { api("integraciones").then(setI).catch(e => setErr(e.message)); }, []);
  if (err) return html`<${AvisoLinea} c="rojo" icono="wifi-off">${err}<//>`;
  if (!i) return html`<p class="nota">Revisando conexiones…</p>`;
  const t = i.telegram, ta = i.tareas;
  const tareas = p => api("tareasGuardar", Object.assign({ noche: ta.noche, semanal: ta.semanal, frecuente: ta.frecuente, redes: ta.redes }, p)).then(r => { setI(r); aviso("Guardado."); });
  return html`<div class="columnas mitad">
    <div class="panel form"><h3>Avisos al celular (Telegram)</h3>
      <p class="nota">Una sola vez se crea el bot. Después, cada persona del equipo conecta su Telegram desde su celular. ¿Cambiaste de celular o de cuenta? «Desconectar el mío» y vuelve a conectar.</p>
      ${!t.conectado ? html`
        <p class="tenue">1. En Telegram busca <b>@BotFather</b>, escribe <b>/newbot</b> y ponle un nombre (por ejemplo AUTOCARE Avisos). 2. Te da un código largo: cópialo y pégalo aquí.</p>
        <${Entrada} etiqueta="Código del bot" valor=${tk} cambiar=${setTk} autocapitalize="off" placeholder="7012345678:AAH…" />
        <${BotonAccion} tipo="primario" accion=${async () => { setI(await api("telegramGuardar", { token: tk })); setTk(""); }}>Guardar código<//>`
      : html`${t.mio ? html`<${AvisoLinea} c="verde" icono="circle-check">Tu Telegram está conectado con @${t.bot}. Te llegan los avisos de tus áreas.<//>
          <div class="btns"><${BotonAccion} accion=${async () => { await api("telegramPrueba"); aviso("Revisa tu Telegram."); }}>Enviar prueba<//><${BotonAccion} tipo="fantasma" accion=${async () => setI(await api("telegramSalir"))}>Desconectar el mío<//><${Boton} tipo="fantasma" onClick=${() => setI(Object.assign({}, i, { telegram: { conectado: false } }))}>Cambiar bot<//></div>`
        : html`<${MiTelegram} listo=${setI} />`}
        ${(t.personas || []).length > 0 && html`<p class="nota">Reciben avisos: <b>${t.personas.join(", ")}</b>. A cada uno le llega lo de sus áreas; los resúmenes, a todos.</p>`}
        ${t.chat && html`<div class="separador"></div><h3>Tareas automáticas</h3>
        <${Interruptor} etiqueta=${"Agenda de mañana (" + ta.horaNoche + ":00)"} valor=${ta.noche} cambiar=${v => tareas({ noche: v })} />
        <${Interruptor} etiqueta="Resumen y respaldo cada lunes" valor=${ta.semanal} cambiar=${v => tareas({ semanal: v })} />
        <${Interruptor} etiqueta="Aviso antes de cada cita y publicaciones programadas" valor=${ta.frecuente} cambiar=${v => tareas({ frecuente: v })} />
        <${Interruptor} etiqueta="Traer seguidores de Instagram y Facebook cada día" valor=${ta.redes} cambiar=${v => tareas({ redes: v })} />`}`}
    </div>
    <div class="panel form"><h3>Instagram y Facebook (opcional)</h3>
      <p class="nota">Solo para traer tus seguidores y publicar solo. Tu usuario de Instagram para los botones de la web se cambia en Negocio, no aquí. Si cambias de cuenta, desconecta y conecta la nueva.</p>
      <p class="nota">Primero crea tu Instagram profesional y tu página de Facebook. El código (token) se saca del panel de Meta para desarrolladores; te guío paso a paso cuando llegues aquí.</p>
      ${i.instagram.conectado ? html`<${AvisoLinea} c="verde" icono="instagram">Instagram @${i.instagram.usuario} conectado.${i.instagram.error ? " Aviso: " + i.instagram.error : ""}<//>`
        : html`<${Entrada} etiqueta="Código de Instagram" valor=${ig} cambiar=${setIg} autocapitalize="off" /><${BotonAccion} accion=${async () => setI(await api("igConectar", { token: ig }))}>Conectar Instagram<//>`}
      ${i.facebook.conectado ? html`<${AvisoLinea} c="verde" icono="facebook">Página ${i.facebook.pagina} conectada.<//>`
        : html`<div class="rejilla"><${Entrada} etiqueta="Número de la página" valor=${fb.pagina} cambiar=${v => setFb(Object.assign({}, fb, { pagina: v }))} /><${Entrada} etiqueta="Código de la página" valor=${fb.token} cambiar=${v => setFb(Object.assign({}, fb, { token: v }))} autocapitalize="off" /></div>
          <${BotonAccion} accion=${async () => setI(await api("fbConectar", fb))}>Conectar Facebook<//>`}
    </div></div>`;
}

// ---------------------------------------------------------------- mi cuenta
function Cuenta() {
  const u = D.yo() || {};
  const [f, set] = useFicha({ actual: "", nueva: "", nueva2: "" });
  let tema = "oscuro"; try { tema = localStorage.getItem("autocare.tema") || "oscuro"; } catch (e) { }
  const [t, setT] = useState(tema);
  const cambiarClave = async () => {
    if (f.nueva !== f.nueva2) throw new Error("Las dos claves nuevas no coinciden.");
    await api("miClave", { actual: f.actual, nueva: f.nueva }); set({ actual: "", nueva: "", nueva2: "" }); aviso("Clave cambiada.");
  };
  const salir = async () => {
    const p = D.hayPendientes();
    if (p && !(await confirmar({ titulo: "Tienes cambios sin enviar", texto: `Hay ${p} cambios que aún no llegan a tu hoja. Si sales se pierden.`, si: "Salir igual", peligro: true }))) return;
    await D.salir(); location.hash = "#/"; location.reload();
  };
  return html`<div class="columnas mitad">
    <div class="panel form"><h3>${u.nombre} · @${u.usuario}</h3>
      <${Segmentos} etiqueta="Apariencia" valor=${t} cambiar=${v => { setT(v); aplicarTema(v); }} opciones=${[{ v: "oscuro", n: "Oscuro" }, { v: "claro", n: "Claro" }, { v: "auto", n: "Como el celular" }]} />
      <div class="separador"></div><h3>Cambiar mi clave</h3>
      <${Entrada} etiqueta="Clave actual" tipo="password" ...${b(f, set, "actual")} autocomplete="current-password" />
      <div class="rejilla"><${Entrada} etiqueta="Clave nueva" tipo="password" ...${b(f, set, "nueva")} autocomplete="new-password" /><${Entrada} etiqueta="Repite la nueva" tipo="password" ...${b(f, set, "nueva2")} autocomplete="new-password" /></div>
      <${BotonAccion} accion=${cambiarClave}>Cambiar clave<//>
    </div>
    <div class="panel form"><h3>Respaldo</h3>
      <p class="tenue">Tus datos viven en tu hoja de Google. Si activas el resumen de los lunes, también se guarda un respaldo en tu Drive cada semana.</p>
      ${D.esAdmin() && html`<${BotonAccion} icono="download" accion=${async () => { const r = await api("respaldo"); descargar("autocare-respaldo-" + hoy() + ".json", JSON.stringify(r.respaldo)); }}>Descargar respaldo completo<//>`}
      <${Boton} icono="download" onClick=${() => descargar("autocare-equipo-" + hoy() + ".json", JSON.stringify(D.copiaLocal()))}>Descargar copia de este equipo<//>
      ${(D.servidor() || {}).hoja && html`<${Boton} icono="external-link" href=${D.servidor().hoja}>Abrir mi hoja de Google<//>`}
      <div class="separador"></div>
      <${Boton} tipo="peligro" icono="log-out" onClick=${salir}>Cerrar sesión<//>
    </div></div>`;
}

// AUTOCARE · piezas que usan tus datos: elegir cliente, vehículo y servicios, fotos y WhatsApp
import { html, useState, useMemo } from "../vendor/preact-htm.js";
import * as D from "./datos.js";
import * as N from "./negocio.js";
import { Icono, Boton, Entrada, Selector, Campo, Insignia, aviso, confirmar, verFoto, useFicha, b } from "./ui.js";
import { coincide, nombreDe, telBonito, telNorm, wa, abrir, comprimir, soles, duracion, clases, hoy } from "./util.js";
import { CATEGORIAS_SERVICIO, CANALES, estadoDe } from "./esquema.js";

// ---------------------------------------------------------------- cliente
export function ElegirCliente({ valor, cambiar, etiqueta = "Cliente", crear = true, ayuda }) {
  const [q, setQ] = useState(""), [nuevo, setNuevo] = useState(null);
  const c = D.uno("clientes", valor);
  const res = useMemo(() => {
    if (!q.trim()) return [];
    const vehs = D.lista("vehiculos");
    return D.lista("clientes").filter(x => coincide(nombreDe(x) + " " + x.tel + " " + vehs.filter(v => v.clienteId === x.id).map(v => v.placa).join(" "), q)).slice(0, 6);
  }, [q]);
  if (c) {
    const p = N.perfil(c.id);
    return html`<${Campo} etiqueta=${etiqueta}>
      <div class="grupo"><div class="fila compacta"><span class="avatar">${(c.nombre || "?")[0]}</span>
        <span class="cuerpo"><span class="t">${nombreDe(c)}</span><span class="s">${telBonito(c.tel)}${p.visitas ? " · " + p.visitas + (p.visitas === 1 ? " visita" : " visitas") : " · cliente nuevo"}</span></span>
        <span class="der"><${Boton} chico tipo="fantasma" onClick=${() => cambiar("", null)}>Cambiar<//></span></div></div><//>`;
  }
  if (nuevo) return html`<${NuevoClienteRapido} inicial=${nuevo} cancelar=${() => setNuevo(null)} listo=${x => { setNuevo(null); setQ(""); cambiar(x.id, x); }} />`;
  const pareceTel = /^\d[\d\s]{5,}$/.test(q.trim());
  return html`<${Campo} etiqueta=${etiqueta} ayuda=${ayuda}>
    <div class="buscador"><${Icono} n="search" /><input class="entrada" type="search" value=${q} onInput=${e => setQ(e.currentTarget.value)} placeholder="Nombre, celular o placa" autocomplete="off" /></div>
    ${(res.length > 0 || (crear && q.trim())) && html`<div class="grupo">
      ${res.map(x => html`<button type="button" class="fila compacta" onClick=${() => { cambiar(x.id, x); setQ(""); }}>
        <span class="avatar">${(x.nombre || "?")[0]}</span><span class="cuerpo"><span class="t">${nombreDe(x)}</span><span class="s">${telBonito(x.tel)}${x.distrito ? " · " + x.distrito : ""}</span></span></button>`)}
      ${crear && q.trim() && html`<button type="button" class="fila compacta" onClick=${() => setNuevo(pareceTel ? { tel: q.trim() } : { nombre: q.trim() })}>
        <span class="ico oro"><${Icono} n="user-plus" /></span><span class="cuerpo"><span class="t">Crear cliente nuevo</span><span class="s">«${q.trim()}»</span></span></button>`}
    </div>`}<//>`;
}
function NuevoClienteRapido({ inicial, cancelar, listo }) {
  const partes = String(inicial.nombre || "").split(" ");
  const [f, set] = useFicha({ nombre: partes[0] || "", apellido: partes.slice(1).join(" "), tel: inicial.tel || "", distrito: "", direccion: "", canal: "" });
  const guardar = () => {
    if (!f.nombre.trim()) return aviso("Escribe el nombre.", { error: true });
    const t = telNorm(f.tel);
    if (t && t.length !== 9) return aviso("El WhatsApp debe tener 9 dígitos.", { error: true });
    const existe = t && N.clientePorTel(t);
    if (existe) { aviso("Ese número ya es de " + nombreDe(existe) + ". Lo elegí."); return listo(existe); }
    const c = D.guardar("clientes", { nombre: f.nombre.trim(), apellido: f.apellido.trim(), tel: t, distrito: f.distrito, direccion: f.direccion, canal: f.canal, estado: "activo", acepta: true, alta: hoy(), codigo: N.codigoReferido(f.nombre), token: undefined });
    listo(N.asegurarPortal(c));
  };
  return html`<div class="panel" style="display:flex;flex-direction:column;gap:12px">
    <h3 style="margin:0">Cliente nuevo</h3>
    <div class="rejilla"><${Entrada} etiqueta="Nombre" ...${b(f, set, "nombre")} autofocus /><${Entrada} etiqueta="Apellido" ...${b(f, set, "apellido")} /></div>
    <div class="rejilla"><${Entrada} etiqueta="WhatsApp" tipo="tel" inputmode="tel" ...${b(f, set, "tel")} placeholder="987 654 321" /><${Entrada} etiqueta="Distrito" ...${b(f, set, "distrito")} /></div>
    <${Entrada} etiqueta="Dirección" ...${b(f, set, "direccion")} />
    <${Selector} etiqueta="¿Cómo te conoció?" vacio="Elegir" opciones=${CANALES} ...${b(f, set, "canal")} />
    <div class="btns fin"><${Boton} tipo="fantasma" onClick=${cancelar}>Cancelar<//><${Boton} tipo="primario" onClick=${guardar}>Crear cliente<//></div>
  </div>`;
}

// ---------------------------------------------------------------- vehículo
export function ElegirVehiculo({ clienteId, valor, cambiar, etiqueta = "Vehículo" }) {
  const [nuevo, setNuevo] = useState(false);
  const vehs = clienteId ? N.vehiculosDe(clienteId) : [];
  if (!clienteId) return null;
  if (nuevo || !vehs.length) return html`<${Campo} etiqueta=${etiqueta}><${FormVehiculoRapido} clienteId=${clienteId} cancelar=${vehs.length ? () => setNuevo(false) : null} listo=${v => { setNuevo(false); cambiar(v.id, v); }} /><//>`;
  return html`<${Campo} etiqueta=${etiqueta}>
    <div class="chips">${vehs.map(v => html`<button type="button" class=${clases("chip", v.id === valor && "activo")} onClick=${() => cambiar(v.id, v)}><${Icono} n="car" t=${16} />${[v.marca, v.modelo].filter(Boolean).join(" ") || "Auto"}${v.placa && html`<span class="n">${v.placa}</span>`}</button>`)}
      <button type="button" class="chip" onClick=${() => setNuevo(true)}><${Icono} n="plus" t=${16} />Otro</button></div><//>`;
}
export function FormVehiculoRapido({ clienteId, cancelar, listo, inicial }) {
  const [f, set] = useFicha(Object.assign({ placa: "", marca: "", modelo: "", color: "", tamano: "auto", anio: "" }, inicial || {}));
  const guardar = () => {
    if (!f.placa.trim() && !f.marca.trim()) return aviso("Escribe la placa o la marca.", { error: true });
    const c = D.uno("clientes", clienteId);
    listo(D.guardar("vehiculos", Object.assign({}, inicial || {}, f, { placa: f.placa.toUpperCase().replace(/\s+/g, ""), clienteId, _cliente: nombreDe(c) })));
  };
  return html`<div class="panel" style="display:flex;flex-direction:column;gap:12px;padding:14px">
    <div class="rejilla dos-movil"><${Entrada} etiqueta="Placa" ...${b(f, set, "placa")} style="text-transform:uppercase" placeholder="ABC123" /><${Selector} etiqueta="Tamaño" opciones=${N.tamanos().map(t => ({ v: t.id, n: t.n }))} ...${b(f, set, "tamano")} /></div>
    <div class="rejilla dos-movil"><${Entrada} etiqueta="Marca" ...${b(f, set, "marca")} placeholder="Toyota" /><${Entrada} etiqueta="Modelo" ...${b(f, set, "modelo")} placeholder="Yaris" /></div>
    <div class="rejilla dos-movil"><${Entrada} etiqueta="Color" ...${b(f, set, "color")} /><${Entrada} etiqueta="Año" inputmode="numeric" ...${b(f, set, "anio")} /></div>
    <div class="btns fin">${inicial && inicial.id && D.puedeEditar("vehiculos") && html`<${Boton} tipo="fantasma peligro" icono="trash-2" titulo="Eliminar vehículo" onClick=${async () => {
        const usos = D.lista("ordenes").filter(o => o.vehiculoId === inicial.id).length + D.lista("citas").filter(c => c.vehiculoId === inicial.id).length;
        if (await confirmar({ titulo: "Eliminar vehículo", texto: (inicial.placa || inicial.marca || "Este vehículo") + " se borra." + (usos ? ` Aparece en ${usos} citas u órdenes: esas se quedan, pero sin vehículo.` : ""), si: "Eliminar", peligro: true })) { D.borrar("vehiculos", inicial.id); listo(null); }
      }} />`}${cancelar && html`<${Boton} tipo="fantasma" onClick=${cancelar}>Cancelar<//>`}<${Boton} tipo="primario" onClick=${guardar}>Guardar vehículo<//></div>
  </div>`;
}

// ---------------------------------------------------------------- servicios
export function ElegirServicios({ valor = [], cambiar, tamano, etiqueta = "Servicios" }) {
  const servs = N.serviciosActivos();
  const grupos = {};
  servs.forEach(s => (grupos[s.categoria || "lavado"] = grupos[s.categoria || "lavado"] || []).push(s));
  const tocar = id => cambiar(valor.includes(id) ? valor.filter(x => x !== id) : [...valor, id]);
  const elegidos = servs.filter(s => valor.includes(s.id));
  if (!servs.length) return html`<${Campo} etiqueta=${etiqueta}><p class="nota">Todavía no tienes servicios. Agrégalos en Configuración → Servicios y precios.</p><//>`;
  return html`<${Campo} etiqueta=${etiqueta}>
    <div class="grupo">${Object.keys(grupos).map(g => html`
      <div class="fila compacta" style="min-height:34px;background:var(--capa-2)"><span class="cuerpo"><span class="s" style="font-weight:600">${CATEGORIAS_SERVICIO[g] || g}</span></span></div>
      ${grupos[g].map(s => html`<button type="button" class="fila compacta" onClick=${() => tocar(s.id)}>
        <span class=${clases("marca-check", valor.includes(s.id) && "si")}>${valor.includes(s.id) && html`<${Icono} n="check" />`}</span>
        <span class="cuerpo"><span class="t">${s.nombre}</span><span class="s">${duracion(s.minutos || 60)}${s.adelanto ? " · pide adelanto" : ""}</span></span>
        <span class="der"><b class="cifra">${soles(N.precioCon(s, tamano))}</b></span></button>`)}`)}</div>
    ${elegidos.length > 0 && html`<div class="par total"><span>${elegidos.length === 1 ? "1 servicio" : elegidos.length + " servicios"} · ${duracion(N.minutosCon(elegidos, tamano))}</span><b>${soles(elegidos.reduce((a, s) => a + N.precioCon(s, tamano), 0))}</b></div>`}
  <//>`;
}

// ---------------------------------------------------------------- fotos
export function CampoFotos({ valor = [], cambiar, tipo = "orden", nombre = "", max = 12, etiqueta, ayuda, soloLeer }) {
  const [subiendo, setSubiendo] = useState(0);
  D.useDatos();
  const agregar = async e => {
    const archivos = Array.from(e.currentTarget.files || []).slice(0, Math.max(0, max - valor.length));
    e.currentTarget.value = "";
    if (!archivos.length) return;
    setSubiendo(archivos.length);
    const nuevas = [];
    for (const a of archivos) {
      try { const data = await comprimir(a); nuevas.push(await D.agregarFoto(data, tipo, nombre)); }
      catch (err) { aviso("No pude leer una de las fotos.", { error: true }); }
    }
    setSubiendo(0);
    cambiar([...valor, ...nuevas]);
  };
  return html`<${Campo} etiqueta=${etiqueta} ayuda=${ayuda}>
    <div class="fotos">
      ${valor.map((r, i) => html`<div class="foto" key=${r}>
        <button type="button" style="all:unset;display:block;width:100%;height:100%;cursor:zoom-in" onClick=${() => verFoto(D.srcFoto(r, 1600))}><img src=${D.srcFoto(r, 400)} alt=${"Foto " + (i + 1)} loading="lazy" /></button>
        ${!soloLeer && html`<button type="button" class="quitar" aria-label="Quitar foto" onClick=${() => cambiar(valor.filter(x => x !== r))}><${Icono} n="x" /></button>`}
        ${D.fotoPendiente(r) && html`<span class="subiendo">por subir</span>`}
      </div>`)}
      ${subiendo > 0 && html`<div class="foto" style="display:grid;place-items:center"><span class="giro" style="width:22px;height:22px;border-radius:50%;border:2px solid var(--oro);border-right-color:transparent;animation:giro .7s linear infinite"></span></div>`}
      ${!soloLeer && valor.length < max && html`<label class="foto-agregar"><${Icono} n="camera" /><span>Agregar</span><input type="file" accept="image/*" multiple onChange=${agregar} /></label>`}
    </div><//>`;
}

// ---------------------------------------------------------------- WhatsApp
export function BotonWa({ tel, texto, children = "WhatsApp", chico, tipo, alEnviar, bloque }) {
  const t = telNorm(tel);
  if (t.length !== 9) return null;
  return html`<${Boton} chico=${chico} tipo=${tipo} bloque=${bloque} icono="message-circle" href=${wa(t, texto)} onClick=${() => alEnviar && alEnviar()}>${children}<//>`;
}
export function enviarWa(tel, texto) {
  const t = telNorm(tel);
  if (t.length !== 9) { aviso("Este cliente no tiene un WhatsApp de 9 dígitos.", { error: true }); return false; }
  abrir(wa(t, texto));
  return true;
}
export function EstadoBadge({ ent, v }) {
  const e = estadoDe(ent, v);
  return html`<${Insignia} c=${e.c}>${e.n}<//>`;
}

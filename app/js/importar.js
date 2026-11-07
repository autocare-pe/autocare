// AUTOCARE · cargar datos preparados (un archivo .json que arma Claude con tus listas: clientes, autos, servicios, productos…)
// Formato: { autocare: "carga", version: 1, titulo, datos: { clientes: [...], vehiculos: [...], ... }, ajustes: { negocio: {...}, ... } }
// · Si un registro ya existe (mismo id, mismo WhatsApp, misma placa o mismo nombre), se actualiza: nunca se duplica.
// · Lo cargado es real: no se marca como práctica aunque el modo práctica esté activo.
// · Un registro con "_soloSiExiste": true solo actualiza algo que ya tienes (sirve para apagar lo viejo); si no existe, se ignora.
import * as D from "./datos.js";
import { ENT } from "./esquema.js";

// En este orden, para que los autos encuentren a su dueño y los servicios a sus productos
const ORDEN = ["clientes", "vehiculos", "proveedores", "productos", "servicios", "planes", "activos", "costosFijos", "membresias", "plantillas"];
const REFS = { clienteId: "clientes", vehiculoId: "vehiculos", proveedorId: "proveedores", productoId: "productos", servicioId: "servicios", planId: "planes", activoId: "activos" };
const POR_NOMBRE = ["servicios", "productos", "planes", "activos", "proveedores", "costosFijos", "plantillas"];

const tel = t => String(t || "").replace(/\D/g, "").slice(-9);
const placa = p => String(p || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
const nom = s => String(s || "").trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export function leer(texto) {
  let j; try { j = JSON.parse(texto); } catch (e) { throw new Error("El archivo no se pudo leer. ¿Es el .json que te preparé?"); }
  if (!j || j.autocare !== "carga" || typeof j.datos !== "object") throw new Error("Este archivo no es una carga de AUTOCARE.");
  return j;
}

function existente(e, r) {
  if (r.id && D.uno(e, r.id)) return D.uno(e, r.id);
  const l = D.lista(e);
  if (e === "clientes" && tel(r.tel)) return l.find(x => tel(x.tel) === tel(r.tel));
  if (e === "vehiculos" && placa(r.placa)) return l.find(x => placa(x.placa) === placa(r.placa));
  if (POR_NOMBRE.includes(e) && nom(r.nombre)) return l.find(x => nom(x.nombre) === nom(r.nombre));
  if (e === "plantillas" && r.clave) return l.find(x => x.clave === r.clave);
  return null;
}

/** Qué va a pasar, sin guardar nada */
export function revisar(j) {
  const filas = [], avisos = [];
  const entidades = [...ORDEN.filter(e => j.datos[e]), ...Object.keys(j.datos).filter(e => !ORDEN.includes(e))];
  entidades.forEach(e => {
    const l = j.datos[e];
    if (!ENT[e]) { avisos.push(`«${e}» no es una lista de la app: se ignora.`); return; }
    if (!Array.isArray(l) || !l.length) return;
    let nuevos = 0, cambian = 0; l.forEach(r => (existente(e, r) ? cambian++ : r._soloSiExiste ? null : nuevos++));
    if (nuevos || cambian) filas.push({ e, n: ENT[e].n, nuevos, cambian });
  });
  const ajustes = Object.keys(j.ajustes || {});
  return { titulo: j.titulo || "Datos preparados", filas, ajustes, avisos };
}

/** Guarda todo. Devuelve cuántos se crearon y cuántos se actualizaron */
export function aplicar(j) {
  const mapaIds = {}; // id del archivo → id real en la app
  let nuevos = 0, cambian = 0;
  const entidades = [...ORDEN.filter(e => j.datos[e]), ...Object.keys(j.datos).filter(e => !ORDEN.includes(e) && ENT[e])];
  entidades.forEach(e => {
    (j.datos[e] || []).forEach(r0 => {
      const r = Object.assign({}, r0);
      const traducir = o => Object.keys(REFS).forEach(k => { if (o[k] && mapaIds[REFS[k] + "/" + o[k]]) o[k] = mapaIds[REFS[k] + "/" + o[k]]; });
      traducir(r);
      // también dentro de listas (ej. la receta de un servicio: [{ productoId, usos }])
      Object.keys(r).forEach(k => { if (Array.isArray(r[k])) r[k] = r[k].map(x => (x && typeof x === "object" ? (traducir(x = Object.assign({}, x)), x) : x)); });
      const prev = existente(e, r);
      const soloSi = r._soloSiExiste; delete r._soloSiExiste;
      if (soloSi && !prev) return;
      const idArchivo = r.id;
      const rec = prev ? Object.assign({}, prev, r, { id: prev.id }) : r;
      rec.prueba = false; // dato real
      const g = D.guardar(e, rec);
      if (idArchivo) mapaIds[e + "/" + idArchivo] = g.id;
      prev ? cambian++ : nuevos++;
    });
  });
  Object.keys(j.ajustes || {}).forEach(k => {
    const v = j.ajustes[k], antes = D.ajuste(k, null);
    const junto = v && typeof v === "object" && !Array.isArray(v) && antes && typeof antes === "object" && !Array.isArray(antes) ? Object.assign({}, antes, v) : v;
    D.fijarAjuste(k, junto);
  });
  return { nuevos, cambian, ajustes: Object.keys(j.ajustes || {}).length };
}

// AUTOCARE · secciones que se terminan en la siguiente etapa
import { html } from "../../vendor/preact-htm.js";
import { itemsNav, usarTitulo } from "../app.js";
import { Vacio } from "../ui.js";

export default function Pronto({ ruta }) {
  const it = itemsNav().find(i => i.r === ruta.modulo) || {};
  usarTitulo(it.n);
  return html`<${Vacio} icono=${it.i || "hourglass"} titulo=${(it.n || "Esta sección") + " llega en la siguiente etapa"}
    texto=${(it.d ? it.d + ". " : "") + "Tus datos ya se guardan en la hoja de Google; esta pantalla solo falta dibujarla."} />`;
}

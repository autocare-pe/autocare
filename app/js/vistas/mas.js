// AUTOCARE · menú completo (celular)
import { html } from "../../vendor/preact-htm.js";
import * as D from "../datos.js";
import { NAV, puedeRuta, usarTitulo } from "../app.js";
import { Fila, Boton, confirmar } from "../ui.js";

export default function Mas() {
  usarTitulo("Más");
  const salir = async () => {
    const p = D.hayPendientes();
    if (p && !(await confirmar({ titulo: "Tienes cambios sin enviar", texto: `Hay ${p} cambios que aún no llegan a tu hoja. Si sales ahora se pierden.`, si: "Salir igual", peligro: true }))) return;
    await D.salir(); location.hash = "#/"; location.reload();
  };
  return html`${NAV.filter(g => g.g).map(g => {
    const items = g.items.filter(puedeRuta);
    return items.length ? html`<section class="bloque"><div class="bloque-cab"><h2>${g.g}</h2></div><div class="grupo">
      ${items.map(it => html`<${Fila} icono=${it.i} titulo=${it.n} sub=${it.d} href=${"#/" + it.r} flecha />`)}</div></section>` : null;
  })}
  <${Boton} bloque tipo="peligro" icono="log-out" onClick=${salir}>Cerrar sesión<//>`;
}

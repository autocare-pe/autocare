// AUTOCARE · menú completo (celular)
import { html, useState } from "../../vendor/preact-htm.js";
import * as D from "../datos.js";
import { NAV, puedeRuta, usarTitulo, esMio } from "../app.js";
import { Fila, Boton, confirmar } from "../ui.js";

export default function Mas() {
  usarTitulo("Más");
  const salir = async () => {
    const p = D.hayPendientes();
    if (p && !(await confirmar({ titulo: "Tienes cambios sin enviar", texto: `Hay ${p} cambios que aún no llegan a tu hoja. Si sales ahora se pierden.`, si: "Salir igual", peligro: true }))) return;
    await D.salir(); location.hash = "#/"; location.reload();
  };
  const [todo, setTodo] = useState(false);
  const otros = NAV.filter(g => g.g).flatMap(g => g.items.filter(puedeRuta).filter(it => !esMio(it)));
  return html`${NAV.filter(g => g.g).map(g => {
    const items = g.items.filter(puedeRuta).filter(it => todo || esMio(it));
    return items.length ? html`<section class="bloque"><div class="bloque-cab"><h2>${g.g}</h2></div><div class="grupo">
      ${items.map(it => html`<${Fila} icono=${it.i} titulo=${it.n} sub=${it.d} href=${"#/" + it.r} flecha />`)}</div></section>` : null;
  })}
  ${otros.length > 0 && html`<div style="margin-bottom:22px"><${Boton} bloque tipo="fantasma" icono=${todo ? "chevron-up" : "chevron-down"} onClick=${() => setTodo(!todo)}>${todo ? "Ver solo mis secciones" : "Ver todas las secciones (" + otros.length + " más)"}<//>
    ${!todo && html`<p class="nota" style="text-align:center;margin-top:6px">Ves primero lo de tus áreas (Configuración → Usuarios).</p>`}</div>`}
  <${Boton} bloque tipo="peligro" icono="log-out" onClick=${salir}>Cerrar sesión<//>`;
}

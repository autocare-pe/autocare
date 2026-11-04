// AUTOCARE · arranque
import { html, render, useState, useEffect } from "../vendor/preact-htm.js";
import * as D from "./datos.js";
import { token, urlServidor, cuandoTermineSesion, fijarToken } from "./api.js";
import { aviso, Capas } from "./ui.js";

const LS_TEMA = "autocare.tema";
export function aplicarTema(t) {
  try { if (t) localStorage.setItem(LS_TEMA, t); t = localStorage.getItem(LS_TEMA) || "oscuro"; } catch (e) { t = t || "oscuro"; }
  const claro = t === "claro" || (t === "auto" && matchMedia("(prefers-color-scheme: light)").matches);
  document.documentElement.dataset.tema = claro ? "claro" : "oscuro";
  const m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = claro ? "#EFEFEC" : "#000000";
}
aplicarTema();

let forzar = () => { };
cuandoTermineSesion(() => { fijarToken(""); forzar(); });
D.cuandoRechace((op, msg) => aviso("No se guardó un cambio: " + msg, { error: true, duracion: 8000 }));

function Raiz() {
  const [, set] = useState(0);
  const [app, setApp] = useState(null);
  forzar = () => set(x => x + 1);
  D.useDatos();
  const dentro = !!token() && !!D.yo() && D.estado.cargado && !!urlServidor();
  useEffect(() => {
    if (dentro) { D.arrancarSync(); if (!app) import("./app.js").then(m => setApp(() => m.App)); }
  }, [dentro]);
  // la entrada con el logo termina cuando ya hay algo real que mostrar (la app o la pantalla de ingreso)
  useEffect(() => { if (!dentro || app) requestAnimationFrame(() => window.introListo && window.introListo()); }, [dentro, !!app]);
  if (!dentro) return html`<${Entrada} listo=${() => set(x => x + 1)} />`;
  return app ? html`<${app} />` : html`<div class="entrada-pantalla"><span class="nota">Abriendo…</span></div>`;
}
let Entrada = () => null;

(async function () {
  await D.iniciar();
  Entrada = (await import("./vistas/entrada.js")).default;
  render(html`<${Raiz} />`, document.getElementById("app"));
  if ("serviceWorker" in navigator && location.protocol === "https:") {
    try {
      const reg = await navigator.serviceWorker.register("sw.js");
      // Actualizarse sola, sin que nadie tenga que acordarse (antes había que tocar «Actualizar» a tiempo; en la laptop casi nunca pasaba):
      // · recién abierta (primeros 10 s, sin haber tocado nada): se cambia de inmediato, tapada por la entrada con el logo;
      // · si te vas a otra app o pestaña y no hay un formulario abierto: se cambia mientras no miras;
      // · si estás en medio de algo: aviso que se queda hasta que lo toques.
      let toco = false; ["pointerdown", "keydown"].forEach(ev => addEventListener(ev, () => { toco = true; }, { once: true, capture: true }));
      const libre = () => !document.querySelector(".hoja-cab, .dialogo, .velo");
      const aplicar = w => w && w.postMessage("activar");
      const nueva = w => {
        if (!toco && performance.now() < 10000 && libre()) return aplicar(w);
        aviso("Hay una versión nueva de la app.", { duracion: 600000, icono: "sparkles", accion: { n: "Actualizar", f: () => aplicar(w) } });
      };
      if (reg.waiting) nueva(reg.waiting);
      reg.addEventListener("updatefound", () => { const w = reg.installing; w && w.addEventListener("statechange", () => { if (w.state === "installed" && navigator.serviceWorker.controller) nueva(w); }); });
      let recargado = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => { if (!recargado) { recargado = true; location.reload(); } });
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") { if (reg.waiting && libre()) aplicar(reg.waiting); }
        else reg.update().catch(() => { });
      });
    } catch (e) { console.warn(e); }
  }
})();
export { Capas };

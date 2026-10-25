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
      const avisar = w => aviso("Hay una versión nueva de la app.", { duracion: 20000, icono: "sparkles", accion: { n: "Actualizar", f: () => w.postMessage("activar") } });
      if (reg.waiting) avisar(reg.waiting);
      reg.addEventListener("updatefound", () => { const w = reg.installing; w && w.addEventListener("statechange", () => { if (w.state === "installed" && navigator.serviceWorker.controller) avisar(w); }); });
      let recargado = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => { if (!recargado) { recargado = true; location.reload(); } });
      document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") reg.update().catch(() => { }); });
    } catch (e) { console.warn(e); }
  }
})();
export { Capas };

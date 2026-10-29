// AUTOCARE · trabaja sin señal. Si cambias cualquier archivo de la app, sube este número.
const VERSION = "3.8.0";
const CACHE = "autocare-" + VERSION;
const ARCHIVOS = ["./", "index.html", "manifest.webmanifest", "css/app.css", "vendor/preact-htm.js", "vendor/sortable.js",
  "js/main.js", "js/app.js", "js/api.js", "js/datos.js", "js/ui.js", "js/util.js", "js/esquema.js", "js/negocio.js", "js/piezas.js", "js/iconos.js",
  "js/vistas/entrada.js", "js/vistas/inicio.js", "js/vistas/agenda.js", "js/vistas/ordenes.js", "js/vistas/clientes.js", "js/vistas/mas.js", "js/vistas/pronto.js", "js/vistas/config.js", "js/vistas/finanzas.js", "js/vistas/tablero.js", "js/vistas/ventas.js", "js/vistas/campanas.js", "js/vistas/plan.js", "js/vistas/inventario.js", "js/vistas/activos.js", "js/vistas/fidelidad.js", "js/vistas/contenido.js", "js/vistas/resultados.js", "js/vistas/ayuda.js", "js/vistas/acceso.js", "js/imprimibles.js", "js/vistas/datos.js", "js/vistas/arranque.js", "js/guias.js", "js/practica.js", "js/semilla.js",
  "icons/icon-180.png", "icons/icon-192.png", "icons/favicon-32.png", "../assets/marca-chica.svg", "../assets/marca-chica-clara.svg", "../assets/logo-chico.svg", "../assets/logo-chico-claro.svg", "../assets/archivo.woff2", "../assets/marca.svg", "../assets/marca-clara.svg", "../assets/logo-horizontal.svg", "../assets/logo-horizontal-claro.svg", "../assets/logo-vertical.svg", "../assets/logo-vertical-claro.svg", "../assets/qr.js", "../config.js"];
self.addEventListener("install", e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARCHIVOS)).catch(() => { })));
self.addEventListener("activate", e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith("autocare-") && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener("message", e => { if (e.data === "activar") self.skipWaiting(); });
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return;
  const red = () => fetch(e.request).then(r => { if (r.ok) { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); } return r; });
  if (u.pathname.endsWith("/config.js")) { e.respondWith(red().catch(() => caches.match(e.request))); return; }
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(r => r || red()).catch(() => caches.match("index.html")));
});

// AUTOCARE · Ruleta de premios: dibujo (SVG) y ángulo de llegada.
// Cada tajada mide lo que vale su probabilidad: lo que ves es lo que hay (honesto por diseño, como pide Indecopi).
// El resultado lo decide el servidor; la rueda solo lo muestra.
const LIMA = "#D0FF14", NEGRO = "#0E0E0E", GRIS = "#1C1C1C", BLANCO = "#FFFFFF";
const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

/** Tajadas con su ángulo de inicio y fin (grados, 0 = arriba, sentido horario) */
export function tajadas(premios) {
  const l = (premios || []).filter(Boolean), tot = l.reduce((a, p) => a + (Number(p.prob) > 0 ? Number(p.prob) : 0), 0);
  let a = 0;
  return l.map((p, i) => {
    const ancho = tot > 0 ? (Number(p.prob) > 0 ? Number(p.prob) : 0) / tot * 360 : 360 / l.length;
    const t = { p, i, desde: a, hasta: a + ancho, ancho };
    a += ancho; return t;
  });
}
const punto = (r, grados) => { const rad = (grados - 90) * Math.PI / 180; return [150 + r * Math.cos(rad), 150 + r * Math.sin(rad)]; };

/** SVG de la ruleta (viewBox 300×300). La rueda está en <g class="rueda">; el puntero queda fijo arriba. */
export function ruletaSvg(premios, { marca = "" } = {}) {
  const T = tajadas(premios), R = 136;
  const colores = T.map((t, i) => {
    if (t.ancho < 20) return { f: BLANCO, t: NEGRO };            // el premio grande y poco probable: se distingue
    return i % 2 === 0 ? { f: LIMA, t: NEGRO } : { f: GRIS, t: BLANCO };
  });
  const u = colores.length - 1;   // que la última no quede del mismo color que la primera
  if (u > 0 && colores[u].f === colores[0].f && colores[u].f !== BLANCO) colores[u] = colores[u].f === LIMA ? { f: GRIS, t: BLANCO } : { f: LIMA, t: NEGRO };
  const sectores = T.map((t, i) => {
    const [x1, y1] = punto(R, t.desde), [x2, y2] = punto(R, t.hasta), largo = t.ancho > 180 ? 1 : 0;
    const d = T.length === 1 ? `M150 ${150 - R}A${R} ${R} 0 1 1 149.99 ${150 - R}Z` : `M150 150L${x1.toFixed(2)} ${y1.toFixed(2)}A${R} ${R} 0 ${largo} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}Z`;
    const medio = (t.desde + t.hasta) / 2, fs = t.ancho < 12 ? 10 : t.ancho < 24 ? 11.5 : 13.5;
    const txt = esc(String(t.p.corto || t.p.n || "").slice(0, 12));
    return `<path d="${d}" fill="${colores[i].f}" stroke="${NEGRO}" stroke-width="1.5"/>` +
      `<text x="150" y="${150 - R + 16}" transform="rotate(${medio.toFixed(2)} 150 150) rotate(90 150 ${150 - R + 16})" fill="${colores[i].t}" font-size="${fs}" font-weight="800"` +
      ` font-family="Archivo, system-ui, sans-serif" text-anchor="start" dominant-baseline="middle" letter-spacing=".02em">${txt}</text>`;
  }).join("");
  const clavos = T.map(t => { const [x, y] = punto(R + 7, t.desde); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.6" fill="${LIMA}"/>`; }).join("");
  return `<svg class="ruleta-svg" viewBox="0 0 300 300" role="img" aria-label="Ruleta de premios" xmlns="http://www.w3.org/2000/svg">
    <circle cx="150" cy="150" r="148" fill="${NEGRO}"/><circle cx="150" cy="150" r="${R + 7}" fill="none" stroke="#2A2A2A" stroke-width="12"/>
    <g class="rueda" style="transform-origin:150px 150px">${sectores}${clavos}</g>
    <circle cx="150" cy="150" r="31" fill="${NEGRO}" stroke="${LIMA}" stroke-width="3"/>
    ${marca ? `<image href="${esc(marca)}" x="128" y="128" width="44" height="44"/>` : `<text x="150" y="151" fill="${LIMA}" font-size="11" font-weight="800" text-anchor="middle" dominant-baseline="middle" font-family="Archivo, system-ui, sans-serif">GIRA</text>`}
    <path d="M150 30L138 4H162Z" fill="${LIMA}" stroke="${NEGRO}" stroke-width="2.5" stroke-linejoin="round"/>
  </svg>`;
}

/** Cuánto girar (grados, acumulado) para que el premio quede bajo el puntero de arriba */
export function anguloPara(premios, id, vueltas = 6) {
  const t = tajadas(premios).find(x => x.p.id === id);
  if (!t) return vueltas * 360;
  const margen = t.ancho * 0.32, azar = (Math.random() * 2 - 1) * margen;
  const medio = (t.desde + t.hasta) / 2 + azar;
  return vueltas * 360 + (360 - medio);
}

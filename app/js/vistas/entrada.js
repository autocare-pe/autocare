// AUTOCARE · conectar el servidor, crear el administrador, entrar y recuperar la clave
import { html, useState, useEffect } from "../../vendor/preact-htm.js";
import * as D from "../datos.js";
import { api, urlServidor, fijarServidor, urlValida } from "../api.js";
import { Logo, Boton, Entrada as Campo, Interruptor, AvisoLinea, Capas, useFicha, b } from "../ui.js";

export default function Entrada({ listo }) {
  const [paso, setPaso] = useState(urlServidor() ? "revisando" : "servidor");
  const [info, setInfo] = useState(null), [error, setError] = useState("");
  const revisar = async () => {
    setError(""); setPaso("revisando");
    try { const j = await api("estado", {}, { sinSesion: true, espera: 25000 }); setInfo(j); setPaso(j.configurado ? "entrar" : "crear"); }
    catch (e) { setError(e.message); setPaso("servidor"); }
  };
  useEffect(() => { if (paso === "revisando") revisar(); }, []);
  const P = { servidor: Servidor, revisando: Revisando, crear: Crear, entrar: Entrar, recuperar: Recuperar }[paso];
  return html`<div class="entrada-pantalla"><div class="entrada-caja">
    <div class="entrada-marca"><img class="solo-oscuro" src="../assets/logo-vertical-claro.svg" alt="AUTOCARE" /><img class="solo-claro" src="../assets/logo-vertical.svg" alt="AUTOCARE" /></div>
    ${error && html`<${AvisoLinea} c="rojo" icono="circle-alert">${error}<//>`}
    <${P} revisar=${revisar} ir=${setPaso} listo=${listo} setError=${setError} />
  </div><${Capas} /></div>`;
}
function Revisando() { return html`<p class="tenue">Conectando con tu servidor…</p>`; }

function Servidor({ revisar }) {
  const [u, setU] = useState(urlServidor());
  const ok = urlValida(u);
  return html`<h1>Conecta tu servidor</h1>
    <p>Pega la dirección de tu servidor de Google. Termina en <b>/exec</b> y la ves en Apps Script → Implementar → Gestionar implementaciones.</p>
    <${Campo} etiqueta="Dirección del servidor" valor=${u} cambiar=${setU} placeholder="https://script.google.com/macros/s/…/exec" autocapitalize="off" spellcheck="false" />
    <${Boton} tipo="primario" grande bloque disabled=${!ok} onClick=${() => { fijarServidor(u); revisar(); }}>Conectar<//>
    <p class="nota">Si tu web ya tiene la dirección en config.js, no necesitas pegarla aquí.</p>`;
}

function Crear({ listo, setError }) {
  const [f, set] = useFicha({ codigo: "", nombre: "", usuario: "", clave: "", clave2: "" });
  const [c, setC] = useState(false);
  const enviar = async e => {
    e.preventDefault(); setError("");
    if (f.clave !== f.clave2) return setError("Las dos claves no coinciden.");
    setC(true);
    try { const r = await api("configurar", { codigo: f.codigo, nombre: f.nombre, usuario: f.usuario, clave: f.clave }, { sinSesion: true }); await D.alEntrar(r, true); listo(); }
    catch (err) { setError(err.message); } finally { setC(false); }
  };
  return html`<h1>Crea tu usuario de administrador</h1>
    <p>Es la primera vez. Necesitas el código de instalación: lo ves en el registro de Apps Script cuando ejecutas «instalar».</p>
    <form class="form" onSubmit=${enviar}>
      <${Campo} etiqueta="Código de instalación" ...${b(f, set, "codigo")} placeholder="ABC-123" autocapitalize="characters" />
      <${Campo} etiqueta="Tu nombre" ...${b(f, set, "nombre")} placeholder="Sebastián" />
      <${Campo} etiqueta="Usuario para entrar" ...${b(f, set, "usuario")} autocapitalize="off" ayuda="Sin espacios. Ejemplo: sebastian" />
      <${Campo} etiqueta="Clave" tipo="password" ...${b(f, set, "clave")} autocomplete="new-password" ayuda="Mínimo 8 caracteres." />
      <${Campo} etiqueta="Repite la clave" tipo="password" ...${b(f, set, "clave2")} autocomplete="new-password" />
      <${Boton} enviar tipo="primario" grande bloque cargando=${c}>Crear y entrar<//>
    </form>`;
}

function Entrar({ listo, ir, setError }) {
  const [f, set] = useFicha({ usuario: "", clave: "", recordar: true });
  const [c, setC] = useState(false);
  const enviar = async e => {
    e.preventDefault(); setError(""); setC(true);
    try { const r = await api("entrar", { usuario: f.usuario, clave: f.clave, recordar: f.recordar }, { sinSesion: true }); await D.alEntrar(r, f.recordar); listo(); }
    catch (err) { setError(err.message); } finally { setC(false); }
  };
  return html`<h1>Entra a tu negocio</h1>
    <form class="form" onSubmit=${enviar}>
      <${Campo} etiqueta="Usuario" ...${b(f, set, "usuario")} autocapitalize="off" autocomplete="username" />
      <${Campo} etiqueta="Clave" tipo="password" ...${b(f, set, "clave")} autocomplete="current-password" />
      <${Interruptor} etiqueta="Recordar este equipo" ayuda="No te pedirá la clave por 90 días." ...${b(f, set, "recordar")} />
      <${Boton} enviar tipo="primario" grande bloque cargando=${c}>Entrar<//>
    </form>
    <div class="btns" style="justify-content:space-between">
      <button class="enlace" onClick=${() => ir("recuperar")}>Olvidé mi clave</button>
      <button class="enlace" onClick=${() => ir("servidor")}>Cambiar servidor</button>
    </div>`;
}

function Recuperar({ listo, ir, setError }) {
  const [f, set] = useFicha({ codigo: "", clave: "", clave2: "" });
  const [c, setC] = useState(false);
  const enviar = async e => {
    e.preventDefault(); setError("");
    if (f.clave !== f.clave2) return setError("Las dos claves no coinciden.");
    setC(true);
    try { const r = await api("recuperar", { codigo: f.codigo, clave: f.clave }, { sinSesion: true }); await D.alEntrar(r, true); listo(); }
    catch (err) { setError(err.message); } finally { setC(false); }
  };
  return html`<h1>Cambia tu clave</h1>
    <div class="paso-guia"><b>1</b><span>En tu hoja de Google abre Extensiones → Apps Script.</span></div>
    <div class="paso-guia"><b>2</b><span>Elige la función «reiniciarAcceso» y toca Ejecutar.</span></div>
    <div class="paso-guia"><b>3</b><span>Copia el código que aparece abajo, en el registro.</span></div>
    <form class="form" onSubmit=${enviar}>
      <${Campo} etiqueta="Código" ...${b(f, set, "codigo")} autocapitalize="characters" />
      <${Campo} etiqueta="Clave nueva" tipo="password" ...${b(f, set, "clave")} autocomplete="new-password" />
      <${Campo} etiqueta="Repite la clave" tipo="password" ...${b(f, set, "clave2")} autocomplete="new-password" />
      <${Boton} enviar tipo="primario" grande bloque cargando=${c}>Guardar y entrar<//>
    </form>
    <button class="enlace" onClick=${() => ir("entrar")}>Volver</button>`;
}

// ---------- Service Worker ----------
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(err => console.error('SW:', err));
}

// ---------- Instalación (Android/Chrome) ----------
let eventoInstalacion = null;
const btnInstalar = document.getElementById('btn-instalar');

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  eventoInstalacion = e;
  btnInstalar.hidden = false;
});

btnInstalar.addEventListener('click', async () => {
  if (!eventoInstalacion) return;
  eventoInstalacion.prompt();
  await eventoInstalacion.userChoice;
  eventoInstalacion = null;
  btnInstalar.hidden = true;
});

window.addEventListener('appinstalled', () => { btnInstalar.hidden = true; });

// ---------- iOS: guía manual ----------
function verificarEntornoIOS() {
  const esIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const estaInstalada = window.navigator.standalone === true ||
                        window.matchMedia('(display-mode: standalone)').matches;
  if (esIOS && !estaInstalada) {
    const guiaIOS = document.getElementById('instrucciones-ios');
    if (guiaIOS) guiaIOS.hidden = false;
  }
}
verificarEntornoIOS();

// ---------- Cámara ----------
const visorVideo = document.getElementById('visor-camara');
const estado = document.getElementById('estado');
let streamActivo = null;
let modoCamaraActual = 'environment';

function detenerCamaraActiva() {
  if (streamActivo) {
    streamActivo.getTracks().forEach(track => track.stop());
    streamActivo = null;
  }
}

async function iniciarCamara(modo) {
  // CRÍTICO en iOS: liberar el sensor antes de pedir otro
  detenerCamaraActiva();
  visorVideo.srcObject = null;

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: modo } },
      audio: false
    });
    streamActivo = stream;
    visorVideo.srcObject = stream;
    await visorVideo.play().catch(() => {});
    estado.textContent = `Cámara activa: ${modo === 'environment' ? 'trasera' : 'frontal'}.`;
  } catch (err) {
    console.error(err);
    const mensajes = {
      NotAllowedError: 'Permiso denegado. Habilítalo en los ajustes del navegador.',
      NotFoundError: 'No se encontró ninguna cámara.',
      NotReadableError: 'La cámara está en uso por otra aplicación.',
      OverconstrainedError: 'Esa cámara no está disponible en este dispositivo.'
    };
    estado.textContent = mensajes[err.name] || `Error: ${err.name}`;
  }
}

// Paso 1 del pre-permiso: solo muestra el aviso
document.getElementById('btn-preparar-camara').addEventListener('click', () => {
  document.getElementById('aviso-permiso').hidden = false;
});

// Paso 2: el usuario consiente y se llama al hardware
document.getElementById('btn-confirmar-permiso').addEventListener('click', () => {
  document.getElementById('aviso-permiso').hidden = true;
  iniciarCamara(modoCamaraActual);
});

// Alternar lente (solo si la cámara ya fue autorizada y encendida)
document.getElementById('btn-alternar-camara').addEventListener('click', () => {
  if (!streamActivo) {
    estado.textContent = 'Primero enciende la cámara con "Solicitar Acceso a Cámara".';
    return;
  }
  modoCamaraActual = modoCamaraActual === 'environment' ? 'user' : 'environment';
  iniciarCamara(modoCamaraActual);
});

// Apagar
document.getElementById('btn-apagar-camara').addEventListener('click', () => {
  detenerCamaraActiva();
  visorVideo.srcObject = null;
  estado.textContent = 'Cámara apagada.';
});
# 🎵 PWA Play — Reproductor de Música PWA

**PWA Play** es un reproductor de música moderno construido como una **Progressive Web App (PWA)**. Se ejecuta completamente en el navegador, permite cargar canciones desde archivos locales, y funciona sin conexión una vez instalado.

![Captura del reproductor](icons/icon-512.png)

## ✨ Características

- 📂 **Cargar canciones** desde archivos de audio locales
- 🎶 **Lista de reproducción** interactiva con miniaturas de colores
- ⏯️ **Controles de reproducción**: play/pause, anterior, siguiente
- 📊 **Barra de progreso** y tiempo transcurrido / restante
- 💾 **Persistencia en IndexedDB**: las canciones cargadas se guardan al recargar la página
- 📱 **PWA instalable** en dispositivos móviles y de escritorio
- 🌐 **Offline**: funciona sin conexión gracias al Service Worker
- 🎨 **Interfaz oscura** moderna con diseño responsive

## 🚀 Cómo levantar el proyecto

### Requisitos

- **Node.js** (v16 o superior) — [Descargar](https://nodejs.org/)

### Pasos

1. **Clonar o abrir** el proyecto en tu terminal:

   ```powershell
   cd d:\MisDevs\Terminadas\wpa-play
   ```

2. **Iniciar el servidor de desarrollo**:

   ```powershell
   npm start
   ```

   Esto levantará la aplicación en una dirección como `http://localhost:3000` (el puerto puede variar).

3. **Abrir en el navegador**:

   Ve a la URL que aparezca en la terminal (ej. `http://localhost:3000`).

### Otras formas de ejecutarlo

| Comando | Descripción |
|---|---|
| `npm start` | Inicia el servidor con `serve` (recomendado) |
| `npx serve .` | Alternativa directa sin `npm start` |
| `python -m http.server 8080` | Con Python (abrir en `http://localhost:8080`) |

## 🧪 Cómo probarlo

1. **Abre la aplicación** en el navegador usando `http://localhost:3000`.
2. **Agrega canciones** haciendo clic en el botón **"➕ Agregar canciones"** o en el área central. Selecciona archivos de audio (MP3, WAV, OGG, etc.) desde tu computadora.
3. **Reproduce** una canción haciendo clic en cualquiera de la lista.
4. **Controla la reproducción** con los botones de play/pause, anterior y siguiente en la barra inferior.
5. **Instala la aplicación** como PWA:
   - En Chrome/Edge: aparecerá un botón **"Instalar"** en la interfaz o en la barra de direcciones.
   - En móvil: desde el menú del navegador, selecciona **"Agregar a pantalla de inicio"**.
6. **Prueba el modo offline**: una vez instalada, desconéctate de internet y la app seguirá funcionando gracias al Service Worker.

## 📁 Estructura del proyecto

```
wpa-play/
├── app.js                 # Lógica del reproductor
├── index.html             # Página principal
├── styles.css             # Estilos CSS
├── sw.js                  # Service Worker (cache offline)
├── manifest.json          # Manifiesto PWA
├── package.json           # Configuración de Node.js
├── vercel.json            # Configuración para despliegue en Vercel
├── icons/                 # Iconos de la aplicación
│   ├── icon-192.png
│   └── icon-512.png
└── scripts/
    └── generate-icons.js  # Script para generar iconos
```

## 🌍 Despliegue

Este proyecto está configurado para desplegarse fácilmente en **Vercel** gracias al archivo `vercel.json`. Solo conecta el repositorio desde [vercel.com](https://vercel.com) y se desplegará automáticamente.

## 🛠️ Tecnologías

- **HTML5**, **CSS3** (sin frameworks)
- **JavaScript** (vanilla, sin librerías externas)
- **Service Worker** para cache offline
- **IndexedDB** para persistencia local
- **Manifest JSON** para instalación PWA

## 📄 Licencia

ISC

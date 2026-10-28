# Lanzadores de Fase 1

## Uso

Linux Mint: doble clic en `INICIAR-SANITY-404.desktop` o ejecutar `./INICIAR-SANITY-404.sh`. El escritorio puede pedir que se marque el archivo como lanzador de confianza. El archivo y el shell son ejecutables; el acceso `.desktop` resuelve el shell desde su propia ubicación y utiliza un icono genérico del sistema. El paquete Electron conserva su icono propio.

Windows 10/11: abrir `INICIAR-SANITY-404.cmd`, que invoca `scripts/iniciar-windows.ps1` con PowerShell sin perfil. La política Bypass se limita a esa invocación; no se cambia la política del sistema. El navegador se abre mediante el manejador predeterminado de Windows.

Ambos usan `scripts/launcher.mjs`. No hay una página de diagnóstico como destino: se sirve `/`, la entrada del videojuego 3D, con su menú narrativo de nueva partida/continuar/opciones.

Argumentos disponibles:

| Argumento      | Acción                                                    |
| -------------- | --------------------------------------------------------- |
| sin argumentos | iniciar/reutilizar servidor y abrir el videojuego         |
| `--check`      | comprobar Node y dependencias sin iniciar servidor        |
| `--status`     | mostrar la URL activa                                     |
| `--stop`       | cerrar el servidor de este lanzador                       |
| `--no-browser` | iniciar/reutilizar sin abrir navegador, útil para pruebas |

Cerrar Chrome no detiene Vite. Utiliza el lanzador con `--stop`. No se terminan procesos de otros proyectos ni servidores manuales. Si has iniciado Vite manualmente, este lanzador utiliza un puerto alternativo y administra únicamente su propio servidor.

## Funcionamiento

1. El shell comprueba Node compatible en PATH; si no existe o es demasiado antiguo, carga NVM explícitamente, prueba su alias default y busca versiones instaladas. Funciona sin leer .bashrc. PowerShell comprueba PATH y ubicaciones habituales de Node/NVM para Windows.
2. El servicio comprueba los paquetes locales Vite, Three.js y TypeScript. Nunca ejecuta npm install ni npm ci. Si faltan, informa de la instalación manual necesaria.
3. Un mutex TCP local, con puerto interno derivado de la ruta del proyecto, serializa los inicios y la recuperación tras fallos. El sistema operativo lo libera al terminar el proceso. El estado y la identidad se escriben en `.sanity-launcher/server.json`; los inicios simultáneos convergen en el mismo proceso. No se abre una página técnica en ese puerto interno.
4. Vite escucha exclusivamente en `127.0.0.1`, prueba el puerto 5173 y elige otro si está ocupado.
5. Antes de abrir el navegador comprueba la identidad del servicio, su URL y la respuesta HTTP de la entrada del juego.
6. Linux detecta Chrome/Chromium. Windows delega al navegador predeterminado. La variable opcional `SANITY_BROWSER_COMMAND` permite un ejecutable alternativo sin interpolación de shell; recibe exactamente la URL como argumento.
7. Estado y cierre requieren un token del servicio propio. Se comprueba la identidad del proyecto, no se envían señales a PIDs arbitrarios. Se liberan el servidor y el bloqueo al cerrar.

Los errores se muestran y se añaden a `.sanity-launcher/server.log`. Los archivos temporales de ejecución están ignorados por Git y no forman parte de `dist`. Una ausencia de Chrome deja el servidor accesible y muestra su URL para abrirla manualmente.

## Pruebas realizadas

- Comprobación sintáctica Bash y Node.
- Validación del .desktop con `desktop-file-validate`.
- Node 24 desde PATH.
- PATH reducido a `/usr/bin:/bin`: detección efectiva de Node 22 instalado mediante NVM real en este equipo, incluso existiendo un Node de sistema incompatible.
- Dos solicitudes concurrentes de inicio: una única identidad/PID de servicio.
- Puerto 5173 ocupado: selección de 5174.
- Segunda ejecución y `--status`: misma URL/servidor.
- Bloqueo incompleto tras una interrupción: recuperación con dos nuevos inicios simultáneos y cierre posterior.
- Captura del argumento enviado al navegador: URL de `/` del videojuego.
- Endpoint de administración sin token: rechazo HTTP 403.
- Cierre: respuesta, desaparición del bloqueo y servidor sin aceptar conexiones.
- Chrome real iniciado por la ruta de detección del lanzador: URL correcta y DOM del videojuego con canvas WebGL (modo sin interfaz).

El comando reproducible es `npm run test:launcher`; requiere Linux, Node/NVM instalados y permiso para abrir puertos locales. La prueba adicional `node scripts/test-launcher.mjs --real-browser` ejercita la ruta de apertura por defecto con un adaptador de Chrome que ejecuta el Chrome instalado en modo sin interfaz y conserva la URL y el DOM resultante. No sustituye la prueba manual del doble clic en Cinnamon.

## Límites explícitos

No se ha ejecutado Windows ni PowerShell en este entorno: el .cmd, la detección de Node y la apertura del navegador predeterminado están preparados pero pendientes de prueba en Windows 10/11. No se ha simulado un doble clic físico en Linux Mint/Cinnamon ni sus avisos de confianza. La apertura de Chrome se verifica de forma automatizada en Linux; el comportamiento de su ventana de escritorio debe comprobarse en el equipo de destino.

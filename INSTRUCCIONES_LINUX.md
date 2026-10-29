# SANITY-404 1.0 · Linux x64

1. Extrae todo `SANITY-404-Linux-x64.zip` en una carpeta de tu elección. Mantén juntos `game/`, `sanity404-server` y el lanzador.
2. Ejecuta `INICIAR-SANITY-404.sh`. Si el gestor de archivos no permite ejecutarlo, abre una terminal en la carpeta y usa `sh INICIAR-SANITY-404.sh`.
3. El lanzador abre el navegador predeterminado en `http://127.0.0.1:40404/`. Mantén la terminal abierta mientras juegas. Pulsa Ctrl+C para detener el servidor.

No se necesitan Node.js, Python, npm, Git, privilegios de administrador ni conexión a Internet. Se necesita un navegador moderno con WebGL y un mecanismo de escritorio para abrir URLs (`xdg-open`). Si el navegador no se abre, visita la URL anterior manualmente.

Las partidas y opciones se guardan en el almacenamiento local del navegador para ese origen. Usa el mismo navegador y perfil para continuar. No borres los datos de `127.0.0.1:40404`; un modo privado puede descartarlos al cerrar. El puerto es fijo: si otra aplicación lo ocupa, el lanzador mostrará un error en lugar de cambiar de origen.

Comprueba el contenido extraído con `sha256sum -c SHA256SUMS.txt` desde la carpeta extraída.

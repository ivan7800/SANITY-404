# Verificación de la distribución portable

El workflow `.github/workflows/portable-distribution.yml` se inicia únicamente con `workflow_dispatch`. Construye y sube dos ZIP como artefactos de Actions; no crea ni publica un GitHub Release.

| Comprobación | Dónde se ejecuta |
| --- | --- |
| Pruebas unitarias, formato, auditoría de salas, compilación del juego y empaquetado Linux | Local y runner Ubuntu 24.04 |
| Compilación MSVC localizada con `vswhere.exe`, empaquetado Windows | Runner Windows 2022 |
| Extracción de cada ZIP, contenido, manifiesto, hashes SHA-256 y origen fijo | Runner de cada plataforma; ZIP Linux también local |
| Lanzador real del ZIP: arranque, falta de recursos, puerto ocupado por un servidor que falsifica el health, segundo arranque, cierre y liberación del puerto | Runner de cada plataforma; local si permite escuchar en loopback |
| Escucha solo en `127.0.0.1` y apertura de URL mediante `xdg-open` simulado | Runner Ubuntu 24.04; local si permite escuchar en loopback |
| Lanzador `.bat` y cierre de su árbol de procesos | Runner Windows 2022 |
| Chromium en el mismo origen, guardado real, reinicio del servidor con perfil persistente y cierre tras cada sesión | Runner de cada plataforma; local si permite escuchar en loopback y dispone de Chromium |

En Windows, la apertura del navegador predeterminado por `ShellExecute` depende de la asociación de URL del runner. La prueba del lanzador comprueba el arranque y el origen servido; Playwright comprueba la navegación y el guardado con Chromium. En Linux se intercepta `xdg-open` y se comprueba la URL exacta entregada al navegador.

El ejecutable rechaza cualquier puerto ocupado, incluso si otra instancia o un servidor ajeno devuelve la misma respuesta de salud. Esto evita atribuirse un servidor que no ha creado.

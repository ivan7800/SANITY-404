# SANITY-404 1.0 · QA final

## Alcance y estado

Este informe distingue pruebas estáticas, ejecución local y certificación nativa. Los ZIP de esta fase son web portable; los AppImage, DEB y NSIS anteriores son distribuciones distintas y se conservan.

| Verificación | Resultado actual |
| --- | --- |
| Suite unitaria | PASS, 312 pruebas en 72 archivos (29-10-2026) |
| Guardado corrupto y reemplazo por guardado válido | PASS, prueba unitaria; prueba de navegador preparada |
| 29 salas y 418 rutas | PASS en esta fase: 29 salas, 418 rutas, cero inaccesibles |
| Build web portable | PASS, assets relativos; ZIP Linux generado |
| Servidor Linux compilado | PASS con GCC y enlace estático; ejecución de socket local bloqueada por el sandbox (`Operation not permitted`) |
| Servidor Windows compilado y ejecutado | Pendiente de runner Windows; no hay binario local ni ZIP Windows |
| ZIP Linux e integridad | PASS: archivo ZIP real, extracción y 13 hashes correctos; arranque HTTP bloqueado por sandbox |
| Guardado real entre reinicios del servidor | Pendiente de ejecución de navegador en entorno con sockets y Chrome operativos |
| Juego completo en el ZIP | Pendiente de recorrido real en ambas plataformas |
| Publicación | No autorizada; no se ha publicado ni enviado a remoto |

## Cobertura funcional existente

La suite cubre estado y progreso, inventario, movimiento y cámara, combate, interacciones, audio, opciones, eventos, guardado y carga, capítulos y finalización. Estas pruebas no sustituyen una partida completa ejecutada desde los ZIP. La prueba de navegador de producción comprueba Nueva partida, interacción real con un punto de guardado, recarga y Continuar; con `SANITY_TEST_CORRUPT_SAVE=1` también comprueba que una partida corrupta no bloquee el menú.

## Dictamen

**No publicar como v1.0 certificada** hasta disponer de ambos ZIP reales, ejecutar las pruebas de servidor y navegador en un entorno permitido y validar Windows y Linux en sus sistemas nativos.

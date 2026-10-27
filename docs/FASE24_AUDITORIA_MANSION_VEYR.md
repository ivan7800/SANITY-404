# Fase 24 — auditoría visual y arquitectónica de Mansión Veyr

Estado: **recorrido físico de la escalera validado en Linux Mint; auditoría visual y rendimiento aún parciales**. Base publicada: `85726fc`.

## Alcance y referencia geométrica

La sala 0 reúne vestíbulo, escalera oriental, rellano, galería norte, sala de retratos y observatorio. Se contrastaron `docs/planos/mansion-veyr-planta.svg` y `docs/planos/mansion-veyr-seccion.svg` con `src/world/mansion.ts`, `src/world/mansion-topology.ts`, `src/world/mansion-navigation.ts` y los colisionadores de `World`. Los datos implementados sitúan el suelo superior a **2,64 m**, el alero de la bóveda a **5,72 m** y su elevación central en **0,82 m**. La huella del rellano va de x=3,72 a 6,28 y z=-6,48 a -5,11; la carta astral ocupa el paño norte en x=4,35, z=-6,54. Los planos coinciden con estos datums y con el recorrido actual de la escalera. No se cambió la envolvente arquitectónica sin una intersección demostrada.

## Hallazgos y correcciones

| Gravedad | Zona | Evidencia y causa | Corrección | Estado |
| --- | --- | --- | --- | --- |
| Media | Pie de escalera | La cámara del umbral del mosaico cruzaba el sillón del vestíbulo y ocultaba el primer tramo, aunque el paso físico estaba libre. | Zona de cámara propia en el pie de escalera, al este del sillón. Regresión de posición y rayo sin corrección. | Mejoría visual comprobada con cámara del juego; recorrido físico posterior PASS en Linux Mint. |
| Media | Rellano superior | La Viuda aparecía demasiado cerca del último peldaño y su persecución podía reducir la separación entre cuerpos hasta 0,35 m. | Aparición en esquina libre del rellano y separación mínima de 1,05 m durante persecución en la misma planta. Alcance de ataque, daño y salud sin cambios. | Geometría y simulación de 180 fotogramas aprobadas; sigue habiendo oclusión parcial de siluetas en el encuadre de combate. |
| Baja | Galería y habitaciones superiores | En las capturas de cámara de juego se aprecian puerta, baranda y accesos transitables. No se observó intersección geométrica concluyente. | Sin cambios. | Recorrido físico posterior PASS en Linux Mint; revisión visual dinámica pendiente. |

La distancia corporal de la Viuda se aplica solo al desplazamiento de persecución, nunca como invulnerabilidad. El encuentro permanece dentro de su alcance de ataque de 1,8 m. La captura del rellano todavía muestra un combate visualmente apretado; no se declara resuelto el encuadre de combate.

## Capturas comparativas

Todas las capturas de esta fase provienen del navegador con la cámara normal del juego. Las posiciones `sanityQa` solo fijaron el punto de observación para fotografía; las capturas **no demuestran** que esas posiciones se alcanzaran caminando. No se ocultaron actor ni enemigo. El modo de fotografía arquitectónica anterior sí los oculta y queda identificado por separado.

| Vista | Antes | Después / estado actual |
| --- | --- | --- |
| Vestíbulo desde entrada | [Entrada actual](capturas/fase24/camara-juego/entrada.webp) | Sin cambio geométrico en esta fase. |
| Pie de escalera | [Cámara anterior](capturas/fase24/camara-juego/pie.webp) | [Cámara corregida](capturas/fase24/camara-juego/pie-corregido.webp) |
| Mitad y último escalón | [Mitad](capturas/fase24/camara-juego/mitad.webp), [último](capturas/fase24/camara-juego/ultimo-escalon.webp) | Sin cambio geométrico en esta fase. |
| Desembarco | [Antes](capturas/fase24/camara-juego/descansillo.webp) | [Tras cambios](capturas/fase24/camara-juego/descansillo-final.webp) |
| Galería y pasillo | [Hacia vestíbulo](capturas/fase24/camara-juego/galeria-hacia-vestibulo.webp), [pasillo](capturas/fase24/camara-juego/pasillo-habitaciones.webp) | Sin cambio geométrico en esta fase. |
| Habitaciones conectadas | [Retratos](capturas/fase24/camara-juego/retratos.webp), [observatorio](capturas/fase24/camara-juego/observatorio.webp) | Sin cambio geométrico en esta fase. |

Comparativas arquitectónicas de la reforma previa: `docs/capturas/fase23/mansion-escalera/antes-controlada/` y `despues-controlada/`, seis puntos equivalentes cada una. Aquellas capturas usan una cámara de diagnóstico sin personajes; se conservan como referencia de volumen, no como prueba de cámara jugable.

## Verificación

- `npm test`: dos pruebas de otras salas agotaron el límite de 5 s con trabajadores paralelos. Ambas pasaron solas sin modificar límites ni aserciones. `npm test -- --maxWorkers=1`: **52 archivos, 256 pruebas aprobadas**.
- `npm run build`: **PASS**.
- `npm run format:check`: **PASS**.
- `npm run audit:rooms`: **PASS**, 29 salas y 418 rutas físicas; es una auditoría geométrica, no una partida.
- Regresiones dirigidas de cámara, aparición y persecución: **18/18 PASS**.
- `npm run test:mansion:stair:browser` en sandbox: **no ejecutado**; Chromium terminó antes de crear la página por `crashpad setsockopt: Operation not permitted`. La traza fallida permanece local y se excluye de esta publicación.
- El recorrido posterior a estos cambios en Linux Mint, con `SANITY_HARDWARE=1`, terminó con **código 0, 16 tramos, 22/22 comprobaciones PASS y cero errores JavaScript**. Incluyó subida, giro, carta astral, galería, ambas habitaciones superiores y bajada. Evidencia: [recorrido.json](capturas/fase24/qa-browser-linux-mint/recorrido.json), iniciado el 27 de octubre de 2026 a las 18:16:55 UTC. El script usa controles reales para desplazarse, pero el modo de fotografía arquitectónica oculta enemigos; no certifica el combate de la Viuda ni el encuadre dinámico con actores visibles.

Comando de repetición en Linux Mint, con Vite activo en el puerto 5174:

```bash
SANITY_TEST_URL=http://127.0.0.1:5174/ SANITY_HARDWARE=1 SANITY_MANSION_STAIR_OUTPUT=docs/capturas/fase24/qa-browser-linux-mint npm run test:mansion:stair:browser
```

## Riesgos pendientes

1. Confirmar visualmente la subida y bajada desde la cámara del juego durante movimiento continuo, especialmente el encuadre de combate del rellano. Las capturas estáticas muestran oclusión parcial entre las siluetas; el recorrido certificado ocultaba actores por su modo de diagnóstico.
2. Verificar el encuentro de la Viuda mediante juego real tras el cambio de separación corporal. La regresión comprueba geometría y alcance, pero no sustituye ese combate.
3. Medir FPS y tiempos de fotograma de esta revisión en Intel HD Graphics 620. No hay una medición nueva de rendimiento en ese hardware.
4. Los cambios no constituyen una certificación visual total de planta baja ni de todas las dependencias conectadas. Las zonas no alteradas se inspeccionaron en capturas, pero no se jugaron de nuevo en esta fase.

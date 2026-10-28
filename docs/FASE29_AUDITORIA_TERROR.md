# Fase 29 · auditoría de terror psicológico

Fecha: 28-10-2026. Base inspeccionada: `src/systems/campaign.ts`, `sanity.ts`, `terror.ts`, `audio.ts`, `world/mansion-echoes.ts` y `world/enemies.ts`. Son **29 salas y 12 capítulos definidos en código**. Esta tabla evalúa el diseño implementado; no equivale a una inspección audiovisual completa.

| Capítulo | Lugar y miedo principal | Amenaza y revelación existente | Ritmo / riesgo pendiente |
|---|---|---|---|
| Lucius · 189 | Santuario romano; nombre anterior al nacimiento | Centurión; inscripción y tres testimonios de ceniza, marea y umbral | Investigación y combate diferenciados; revisar en juego la legibilidad del altar. |
| Aurelia · 312 | Taller de mosaicos; identidad sustituida | Custodio del mosaico; rostro arrancado y cinabrio | La pista material prepara el puzle; falta escucha real de mezcla y silencios. |
| Maeve · 537 | Archivo costero; desaparecidos que figuran en registros | Ahogado; nave adicional y lista de pasajeros | Agua y registros sostienen el misterio; comprobar transición sonora del muelle. |
| Samira · 783 | Observatorio; estrella que falta | Vigilante ciego; patrón astral en bronce | Alterna observación y amenaza; comprobar claridad espacial del vigilante. |
| Idris · 1092 | Cantera; marcas que cambian bajo lluvia | Cantero; arco destinado a Veyr | La huella física da continuidad al misterio; verificar contraste de pistas. |
| Oona · 1217 | Hospital; memoria e identidad transferidas | Guardián de sala; historiales de Ada y Bran | El dilema humano aporta calma inquietante; revisar audio de camas y curación. |
| Isabelle · 1348 | Claustro y scriptorium; nombres borrados | Copista de peste; códice ligado al signo romano | Dos espacios y una revelación fuerte; comprobar que el peligro no oculte la lectura. |
| Tomás · 1491 | Imprenta; muerte anunciada por la propia máquina | Cajista; matriz y tiradas falsas | Amenaza temporal clara; revisar repetición de efectos de imprenta. |
| Inés · 1610 | Casa Veyr; linaje que omite a su protagonista | Retrato guardián; firma anterior al pacto | Conecta la mansión y la historia; comprobar lectura del árbol bajo persecución. |
| Amara · 1786 | Teatro de autómatas; público ausente | Autómata; golpe grave, silencio y agudo | El silencio es parte del puzle; comprobar que el ambiente no lo contradiga. |
| Émile · 1899 | Archivo fotográfico; imágenes que envejecen | Sombra del revelado; puerta anterior a la casa | Revelación visual fuerte; pendiente inspección de cámara y exposición. |
| Élise · 1927 | Mansión Veyr; memoria familiar y arquitectura anómala | Sombra, Huésped, Viuda y otras presencias; ecos de once épocas y desenlace | Es el sector más denso. Eventos de cordura podían solaparse con el combate; corregido en esta tanda, pendiente prueba audiovisual real. |

El patrón de cada época ya combina documento, anomalía, puzle y enemigo. No se han añadido episodios ni alterado el canon. El sistema contiene eventos contextuales por sala, lectura, objeto y descubrimiento, además de ecos históricos en la mansión. **Riesgo narrativo:** la estructura repetida puede sentirse mecánica; hace falta una sesión humana completa para valorar sorpresa, pausas y comprensión, no solo una traza automática.

## Primera tanda y evidencia

`PsychologicalDirector` ya aplicaba gracia de entrada, prioridad, enfriamiento y límite de repetición. `TerrorDirector` ya anunciaba enemigos, daba golpes espaciales finitos y manifestaciones de galería. Se conservan ambos. La nueva puerta de seguridad aplaza los eventos de cordura mientras la IA está en persecución, anticipación, ataque o recuperación, y deja seis segundos de calma al salir. Su representación visual se suspende durante el peligro. Una lectura, objeto o acontecimiento histórico nuevo deja además cuatro segundos para asimilar la pista antes de otra manifestación. El combate conserva sus propios avisos. Las pruebas `tests/phase8.test.ts` reproducen peligro, recuperación y lectura, y comprueban que no cambia el progreso persistente.

Verificación con el código final: `npm test -- --maxWorkers=1` **271/271 PASS** (56 archivos), `npm run build` PASS, `npm run format:check` PASS, `npm run audit:rooms` **29 salas, 418 rutas, cero inaccesibles**, y `git diff --check` PASS. Una ejecución intermedia de la suite empezó mientras se añadía la aserción de no reaparición y falló 1/270; la prueba dirigida y la suite completa posteriores pasaron. Esto no sustituye un recorrido de campaña tras el cambio.

Capturas comparativas y escucha con auriculares: **pendientes**. La manifestación depende de cordura y contexto, por lo que una captura estática del vestíbulo no demuestra el comportamiento corregido. Ningún resultado de SwiftShader se atribuirá a Intel HD 620. Rendimiento antes/después del cambio: **no medido en condiciones equivalentes**; el cambio añade solo una comprobación de estado por actualización. Repetir en Linux Mint con Vite en 5174: `SANITY_TEST_URL=http://127.0.0.1:5174/ SANITY_HARDWARE=1 npm run test:browser`; escuchar y capturar un evento de cordura antes y después de una persecución en la mansión. La Viuda requiere además `SANITY_TEST_URL=http://127.0.0.1:5174/ SANITY_HARDWARE=1 npm run test:phase26:widow:browser`.

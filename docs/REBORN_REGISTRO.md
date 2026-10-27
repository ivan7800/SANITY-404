# SANITY-404 REBORN · registro de reconstrucción

El estado más reciente del encargo Gold Master, incluida la copia persistente del árbol y el incidente de Roma 189, está en [GOLD_MASTER_ESTADO.md](GOLD_MASTER_ESTADO.md). Este registro conserva el historial anterior sin sustituir la evidencia de campañas fallidas.

**Estado:** trabajo en curso. Ninguna sala nueva se declara terminada sin captura y recorrido real de navegador. La campaña completa sigue sin certificación y el juego sigue **NO APTO PARA PUBLICACIÓN**.

## Protección y herramientas

- Rama inspeccionada: `fase11/campana-historica`; el árbol tenía cambios previos y archivos sin seguimiento que se conservaron.
- Copia recuperable previa al nuevo encargo: `/tmp/sanity404-reborn-current-20261026.tar.gz` (658 entradas, SHA-256 `b40f6f8fd44070514356a1314a0e21d8614e66695c77ebd464512ca8dbbd263e`). Excluye solo `.git`, `node_modules` y `dist`; el repositorio Git original conserva el historial.
- Una copia anterior al primer cambio de la bóveda permanece en `/tmp/sanity404-reborn-pre-vestibulo-20261026.tar.gz` (655 entradas, SHA-256 `beb4e445a70f40b5b0fc64378dd3c6cf53cfc8509416e739b4f3cbdf415a99fd`). No se ejecutó ninguna operación destructiva de Git.
- Copia adicional tras las correcciones de este tramo: `/tmp/sanity404-reborn-after-20261026.tar.gz` (672 entradas, SHA-256 `b6c65233591c124d85cb6f7142951044da245c70c66c5172e2c45ab5645201cf`). Estas copias en `/tmp` deben trasladarse a almacenamiento persistente si se va a limpiar ese directorio.
- `docs/REA.md` registra un servidor REA 6.5.0 que respondió en una sesión anterior. Su análisis inverso no ayuda a editar el código fuente disponible y no se abrió ningún binario ni se instalaron herramientas.
- ECC 2.2.3 está instalado como catálogo de skills en Codex. Se usó la guía local `browser-qa` para exigir capturas y comportamiento real; el puntero `repo-scan` requiere clonar e instalar código externo y se omitió. No hay `AGENTS.md` en este repositorio. Mandan las instrucciones del usuario, luego las reglas del proyecto y después las pautas compatibles de las skills.

## Biblia visual original

| Sector | Silueta y material | Luz narrativa | Estado |
| --- | --- | --- | --- |
| Vestíbulo, 1927 | Bóveda corrida, arcadas de piedra, galería y escalera de madera, bronce ennegrecido | Lámparas cálidas contra vanos fríos | Geometría implementada; revisión visual pendiente |
| Biblioteca, 1927 | Estanterías altas, balcón y pasillos estrechos | Ámbar entre anaqueles | Escenario previo; revisión pendiente |
| Cripta, 1927 | Bóveda baja, nichos nominativos, piedra cenicienta | Focos apagados y cobre viejo | Nueva geometría; revisión visual pendiente |
| Capilla, 1927 | Contrafuertes, vidrio opaco y nervaduras | Azul grisáceo | Escenario previo; revisión pendiente |
| Ruinas, 1927 | Anillo de columnas y óculo roto | Verdín sobrenatural | Nueva geometría; revisión visual pendiente |
| Archivo/invernadero/sótano, 1927 | Papel, vidrio húmedo, metal y mampostería | Secuencia de calor a frío | Escenarios previos; revisión pendiente |
| Roma, 189 y 312 | Piedra tallada, ladrillo, altar y taller musivo | Ocre y cinabrio | Geometría nueva en curso |
| Costa 537 | Madera salina y archivo portuario | Gris marino | Geometría nueva en curso |
| Observatorio 783 | Piedra astronómica y metal calibrado | Azul nocturno | Geometría nueva en curso |
| Cantera 1092 | Piedra extractiva y arco inacabado | Tiza y sombra | Geometría nueva en curso |
| Hospital 1217 | Mampostería, vigas y textiles de cuidado | Marfil sucio | Geometría nueva en curso |
| Abadía 1348 | Claustro, scriptorium y bóvedas | Cera y ceniza | Geometría nueva en curso |
| Imprenta 1491 | Bastidores, piedra y hierro tipográfico | Latón y tinta | Geometría nueva en curso |
| Casa 1610 | Galería doméstica y ritual heredado | Nogal y rojo viejo | Geometría nueva en curso |
| Teatro 1786 | Proscenio y tramoya | Oro apagado | Geometría nueva en curso |
| Archivo 1899 | Fotografía, bastidores y revelado | Plata y carmesí | Geometría nueva en curso |

La escala de referencia sigue siendo el actor con radio físico de `0,34 m` y espacios de unos 16 × 16 m por sala. Las piezas que invaden la altura jugable deben tener colisionadores; las cubiertas, molduras y motivos del suelo no la invaden. Se reutilizan materiales PBR existentes y geometría local. Presupuesto inicial por módulo decorativo: menos de 15 000 triángulos y sin nuevas luces de sombra; se ajustará con medidas reales de la Intel HD Graphics 620.

La distorsión cósmica se expresa en una arquitectura inicialmente legible que deja marcas, interrupciones y ejes imposibles al avanzar la campaña. Los signos rituales se integran en piedra y suelo. No se utilizan activos ni diseños copiados de las referencias comerciales.

## Trabajo implementado en este tramo

- `src/world/mansion-architecture.ts`: bóveda curvada continua, nervaduras, arcadas y columnas embebidas, sello astronómico en el suelo. `mansion.ts` sustituye la retícula plana de vigas por ese módulo y conserva escalera, galería, mobiliario, cámaras e interacciones.
- `src/world/mansion.ts`: dos vanos sur para los portales de 1491 y 1610, con jambas y arquivoltas; las pilastras a altura jugable tienen colisionadores del mismo tamaño.
- `src/engine/camera.ts`: el encuadre inicial de la entrada pasó al eje del vestíbulo. La captura de SwiftShader anterior al cambio mostraba un cortinaje/muro cubriendo gran parte de la pantalla; la nueva posición está libre y conserva corrección de obstáculos en las pruebas, pero falta una captura posterior para evaluar la composición.
- `src/world/phase2-rooms.ts`: bóvedas de biblioteca, cripta, archivo y sótano con nervaduras agrupadas; nichos de la cripta; óculo fragmentado y capiteles de las ruinas. Los detalles altos no añaden bloqueadores de suelo.
- `src/world/historic-architecture.ts`: cubiertas originales de seis familias para las salas 8–20, integradas por `scene.ts`. Samira conserva el cielo abierto de su terraza. Cada cubierta se agrupa en 2–3 mallas y no añade luces ni bloqueadores de suelo.
- `src/world/late-architecture.ts`: cuatro perfiles para las salas 21–28, integrados en `late-chapters.ts`. Los pilares físicos del proscenio están registrados como colisionadores.
- `src/world/mansion-topology.ts`, `mansion-navigation.ts` y navegación de QA: al ascender se valida también la ocupación del piso superior. El fallo exacto `(3,73383,-5,63937)` procedía de entrar lateralmente en el rellano tras `enemy0`; A* de planta baja ya no usa ese rellano como atajo. Los portales de Tomás e Inés ahora están en los vanos sur accesibles, conservando sus IDs y destinos.
- `tests/mansion-architecture.test.ts`: verifica curvatura, cobertura, presupuesto geométrico y accesibilidad geométrica de las conexiones del vestíbulo.
- `tests/phase2-architecture.test.ts`, `tests/historic-architecture.test.ts` y `tests/late-architecture.test.ts`: cubiertas, presupuesto geométrico y acceso geométrico dirigido.
- `scripts/browser-reborn-hall.mjs`: captura tres vistas del vestíbulo en QA aislado, registra FPS/GPU/draw calls/errores y exige selección del portal romano y transición mediante E. Las capturas se guardan con marca de tiempo sin sustituir las históricas. Este modo de QA no certifica Nueva partida.
- `scripts/browser-reborn-survey.mjs`: prepara 29 capturas y métricas independientes de cada sala para revisión visual en Linux Mint.

## Verificación y límites

Verificación integrada: `npm test` **230/230**, `npm run build`, `npm run format:check` y `npm run audit:rooms` **PASS**. La auditoría encontró accesos geométricos en 29 salas y comprobó **409 rutas de estados de campaña, 24 destinos directos y 0 inaccesibles**. Es evidencia geométrica, no un recorrido jugado.

`test:browser` cargó Nueva partida en SwiftShader, pero falló en el primer desplazamiento del vestíbulo: 2,41 FPS medios, fotograma mediano de 416,7 ms, seis replanteamientos y salud final 40. Su [captura previa al ajuste de cámara](capturas/reborn/vestibulo-antes-camara-swiftshader.png) se inspeccionó y motivó la corrección descrita arriba. No es una medición de la GPU Intel ni prueba suficiente de que el mismo recorrido falle allí. `test:rescue:browser` y `test:reborn:hall` terminaron antes de cargar el juego con `crashpad setsockopt EPERM`/`SIGTRAP`; Firefox del sistema terminó con `SIGSEGV`. No hay captura posterior al ajuste de cámara ni medidas fiables de FPS de estas geometrías; las capturas anteriores en `docs/capturas/rescate/` son solo referencia previa. Quedan pendientes la revisión visual, la encuesta de 29 capturas y el recorrido de campaña real.

## Siguiente comprobación en Linux Mint

Con Vite en `http://127.0.0.1:5174/`:

```bash
SANITY_HARDWARE=1 SANITY_TEST_URL=http://127.0.0.1:5174/ npm run test:reborn:hall
SANITY_HARDWARE=1 SANITY_TEST_URL=http://127.0.0.1:5174/ npm run test:reborn:survey
SANITY_HARDWARE=1 SANITY_TEST_URL=http://127.0.0.1:5174/ npm run test:rescue:browser
SANITY_HARDWARE=1 SANITY_TEST_URL=http://127.0.0.1:5174/ npm run test:browser
node scripts/phase22-start-probe.mjs --url=http://127.0.0.1:5174/ --through=final
```

La revisión humana debe comparar las nuevas tomas de entrada, eje y portal con `docs/capturas/rescate/sala-0.png`; comprobar recortes de cámara, piezas flotantes, sombras y legibilidad, además de las cifras de rendimiento. El script de campaña debe empezar en Nueva partida y no reutilizar el modo QA.

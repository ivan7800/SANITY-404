# Fase 32 · matriz de cobertura adversarial

**PASS geométrico** significa escena construida y destino seleccionable en la auditoría de cuadrícula/motor físico; **PENDING nativo** significa que no se jugó esa sala en Chromium con el código F32. La traza histórica de campaña completa y el PASS de Viuda comunicados por el usuario son antecedentes, no certificación posterior a F32.

## Doce capítulos

| Capítulo | Salas | Accesibilidad estática | Guardado/recarga y combate nativos F32 |
|---|---|---|---|
| Lucius 189 | 8 | PASS geométrico | PENDING |
| Aurelia 312 | 11–12 | PASS geométrico | PENDING |
| Maeve 537 | 13–14 | PASS geométrico | PENDING |
| Samira 783 | 15–16 | PASS geométrico | PENDING |
| Idris 1092 | 17–18 | PASS geométrico | PENDING |
| Oona 1217 | 19–20 | PASS geométrico | PENDING |
| Isabelle 1348 | 9–10 | PASS geométrico | PENDING |
| Tomás 1491 | 21–22 | PASS geométrico | PENDING |
| Inés 1610 | 23–24 | PASS geométrico | PENDING |
| Amara 1786 | 25–26 | PASS geométrico | PENDING |
| Émile 1899 | 27–28 | PASS geométrico | PENDING |
| Élise 1927 | 0–7 | PASS geométrico | PENDING |

## 29 salas

| Salas | Conectividad geométrica F32 | Interacciones, muerte y retorno en navegador F32 |
|---|---|---|
| 0 Mansión Veyr; 1 Biblioteca; 2 Cripta; 3 Capilla; 4 Ruinas; 5 Archivo familiar; 6 Invernadero; 7 Sótanos | PASS en cada sala | PENDING en cada sala |
| 8 Santuario romano; 9 Claustro; 10 Scriptorium; 11 Taller mosaicos; 12 Horno; 13 Muelle; 14 Archivo marea | PASS en cada sala | PENDING en cada sala |
| 15 Terraza astral; 16 Cúpula; 17 Cantera; 18 Cámara del arco; 19 Hospital; 20 Enfermería; 21 Imprenta | PASS en cada sala | PENDING en cada sala |
| 22 Planchas; 23 Casa Veyr; 24 Retratos; 25 Teatro; 26 Tramoya; 27 Archivo fotográfico; 28 Revelado | PASS en cada sala | PENDING en cada sala |

Recuento: **29/29 salas estáticas**, **418/418 rutas hipotéticas** sin inaccesibles; **0/29 salas y 0/12 capítulos recertificados mediante navegador en esta revisión**. La auditoría no mide FPS ni detecta por sí sola interacción repetida durante un combate.

## Navegador F32 · ejecución comunicada desde Linux Mint

| Tramo de `npm run test:browser` | Resultado observado | Alcance |
|---|---|---|
| `browser-smoke` | PASS | Inicio, movimiento, guardado, carga, inventario, diario, puzles y puertas. |
| `browser-systems` | PASS | Combate, muerte, reintento, desenlaces y ajustes reducidos. |
| `browser-phase10` | FAIL | Recuperación WebGL: timeout buscando el nombre exacto obsoleto «Volver». La corrección queda PENDING de repetición nativa. |

La ejecución detectó Intel HD Graphics 620, cero errores JavaScript y **58,75 FPS medios en 600 muestras del escenario medido**, según el resultado aportado por el usuario. Esa muestra no representa el rendimiento de las 29 salas ni certifica la campaña completa.

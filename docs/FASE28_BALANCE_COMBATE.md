# Fase 28 · balance de combate y recursos

Esta revisión combina reglas del motor con la [traza histórica de campaña completa](capturas/fase22/campana-completa-trace.json) del 27-10-2026. Esa partida terminó en 806 s con 12 capítulos y final histórico; **es anterior a los cambios locales actuales** y no valida el balance ni el rendimiento de Fase 28.

## Reglas actuales

| Mecánica         | Código y magnitud                                                                                            | Lectura de balance                                                                         |
| ---------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| Ataque ligero    | 30 de daño base; 18–30 según armadura, postura y tipo. Alcance por arma 1,9–2,3 m; recuperación 0,54–0,72 s. | Favorece cercanía. La línea de impacto debe estar libre.                                   |
| Ataque fuerte    | 50 de daño base; cuesta 30–37 de resistencia, recuperación 0,94–1,06 s; alcance 2,1–2,4 m.                   | Recurso ofensivo más caro, útil contra coraza.                                             |
| Defensa          | Regenera resistencia a -7/s mientras se mantiene; daño físico recibido aproximadamente 25–28 % del nominal.  | Reduce daño, no lo anula.                                                                  |
| Parada precisa   | Ventana por arma 0,22–0,30 s; resta 12 de resistencia y expone al enemigo.                                   | Exige anticipación del ataque anunciado.                                                   |
| Esquiva          | Cuesta 25 de resistencia; dura 0,32 s y no se inicia durante daño o animación de golpe.                      | Permite evitar el golpe si se temporiza, con riesgo de agotamiento.                        |
| Tónico           | +40 salud y +25 cordura, hasta 100; 7 tónicos en salas 0, 1, 2, 3, 5, 6 y 7.                                 | Persisten al guardar. Desde F28-001 no se consumen después de morir.                       |
| Daño de la Viuda | 17 PS si conecta; anticipación 0,92 s y recuperación posterior.                                              | La traza real de Fase 26 muestra un golpe de 17 PS; aún falta evaluar el combate completo. |

La salud y cordura se conservan entre capítulos, salvo recompensas y consumos previstos por la historia. La traza histórica incluye registros de salud, cordura, resistencia y tónicos tras las investigaciones, pero no proporciona una distribución de daño por ataque ni una sesión manual de combate. No se puede concluir de ella que cada encuentro sea justo o que la recuperación sea suficiente para todos los estilos de juego.

## Medición pendiente

1. Repetir la persecución de la Viuda con el nuevo muestreo y revisar anticipo, recuperación, ruta y visibilidad de cámara.
2. Medir el mismo encuentro en Medio y Bajo en Intel HD 620 con `npm run benchmark:phase26:widow`; comparar FPS, p95, CPU, GPU y llamadas de dibujo sin atribución prematura.
3. Jugar el tramo de Émile con recursos bajos y registrar daño real, uso de defensa, esquiva y curación; la prueba automatizada de campaña anterior llegó al final, pero no representa todas las estrategias.

No se hicieron cambios de valores de daño, velocidad, recuperación, enemigos ni recursos en esta fase.

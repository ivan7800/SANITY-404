# Fase 33 · cambios y justificación

| Problema y evidencia | Cambio | Riesgo | Verificación y resultado |
|---|---|---|---|
| Medio en Intel HD 620: 19,27 FPS en escalera y GPU mediana 33,47 ms en muestra F30; Bajo fue más rápido en cuatro escenarios completos. | Escala interna de Medio 1,0 → 0,9. Sombras 1024, luces, partículas y contenido intactos. | Ligera pérdida de nitidez 3D; posible ganancia insuficiente si el cuello está en sombras. | Regresión de `renderScale` PASS; benchmark nativo 12/12 PASS, escalera Medio 27,28 FPS. Atribución causal exacta no aislada. |
| Texto pequeño en paneles/HUD y ausencia de ajuste de lectura. | Preferencia persistente `largeText` y reglas CSS de tamaño real. | Desbordamiento en pantallas pequeñas. | Parser de ajustes PASS; navegador móvil nativo 7/7 PASS. Inspección visual humana pendiente. |
| Cambios de sala y perfil reconstruyen escenas; es necesario descartar recursos. | Sin cambio del motor: se añadió una regresión de liberación para tres escenas y límite de caché compartido. | La prueba no mide memoria GPU del proceso ni sesiones largas. | Eventos `dispose` y presupuesto de texturas PASS; memoria nativa prolongada PENDING. |

No se alteró el equilibrio, la IA, los doce capítulos ni el audio. El usuario confirmó recuperación WebGL y regresión general nativas PASS. Cambio de perfil durante combate activo sigue pendiente.

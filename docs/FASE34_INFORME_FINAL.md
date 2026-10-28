# Fase 34 · cierre de distribución y Windows

Fecha: 28-10-2026. **Linux confirmado por el usuario; web de producción local verificada; Windows pendiente de build y ejecución nativa.** No se hizo commit, push, merge, despliegue ni release.

## Resultados

- AppImage y DEB: ejecución manual funcional confirmada por el usuario. Guardado real Electron PASS (código 0) y recuperación tras cierre y reapertura mediante «Continuar» confirmados por el usuario.
- Paquetes presentes: tamaños y SHA-256 comprobados en `FASE34_LINUX.md`. AppImage y DEB extraídos; sin rutas absolutas del equipo de desarrollo detectadas en nombres o bytes extraídos.
- Suite unitaria de esta revisión: **307/307 PASS**, 70 archivos. La cifra previa comunicada era 306/306.
- `npm run build:web`, `npm run build:desktop:assets`, `npm run verify:distribution`, `npm run format:check`: PASS.
- `npm run audit:rooms`: 29 salas, 418 rutas comprobadas, cero inaccesibles.
- Campaña histórica completa y regresión de navegador en desarrollo: PASS comunicados por el usuario.
- Configuración Vite: base de producción `/SANITY-404/`; recursos del bundle presentes. El smoke específico de producción pasó sobre preview local: recursos, menú, navegación, guardado real, recarga, «Continuar» y cero errores JavaScript o de carga.

## Windows

El workflow de distribución quedó manual y con dependencias fijadas mediante lockfiles; construye NSIS x64 en Windows 2022, exige un único EXE no vacío, calcula SHA-256 y adjunta EXE y `SHA256SUMS.txt` al artefacto de la ejecución. Exige repositorio privado para que el artefacto sea privado. No usa secretos adicionales ni publica o despliega. **No se ejecutó Actions ni se certifica Windows.** Los pasos exactos están en `FASE34_WINDOWS.md`.

## Riesgos pendientes

1. Ejecutar Actions desde un repositorio privado una vez autorizado y verificar el EXE y su hash.
2. Instalar y probar el EXE en Windows x64 real: arranque, recursos, gráficos, audio, controles, guardado y «Continuar» tras reinicio.
3. Mantener abierto el timeout de producción web: el smoke local corto pasó, pero falta reproducir o descartar la incidencia con traza y duración; después de un despliegue autorizado, comprobar la URL remota de GitHub Pages.
4. Conservar la observación F33 sobre cambio de perfil durante combate activo.

La matriz y las listas de aceptación están en `FASE34_MATRIZ_QA.md`.

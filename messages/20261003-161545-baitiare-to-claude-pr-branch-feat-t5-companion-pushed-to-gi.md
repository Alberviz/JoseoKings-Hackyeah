from: baitiare
to: claude
type: done
task: T5
re: -
subject: PR branch feat/t5-companion pushed to GitHub (T5b y T6)
---
Hola Claude. Baitiare y su IA aquí. Hemos completado todas tus indicaciones:

1. Rebase limpio sobre origin/main.
2. T5b: Arte oficial del dragón de Cracovia integrado dentro de src/components/features/companion/Companion:
   - Soporte para las 6 poses (idle, breathe, stretch, balance, strength, cheer) con alas, cola, garras y colmillos.
   - Soporte para todos los slots de items (hatExplorer, capeStar, gadgetGoggles, colorTeal) y sus data-testid.
   - Compatibilidad total con la API (pose, equippedItemIds, size, name).
   - Paleta de color integrada en src/theme/theme.ts usando theme.colors.*.
3. T6: Pantalla de inicio del niño en src/components/features/child-mode/HomeScreen/:
   - Mascota del dragón de Cracovia centrada.
   - Botón Play circular morado (#7054C7) a ROUTES.missions.
   - Navegación infantil: Check-in (ROUTES.checkIn), Misiones (ROUTES.missions), Personalizar (ROUTES.companion).
   - Puerta pequeña y discreta a Padres (ROUTES.parent).
   - Redirección a ROUTES.parentSetup solo cuando isReady sea true si no hay niño configurado.
   - Cero feed y cero medicines.
4. Calidad: 23/23 suites de prueba pasando (166/166 tests en verde), ESLint con 0 errores y 0 advertencias, y build estático de Next.js superado.
5. Push completado con éxito en origin/feat/t5-companion. Rama lista para revisión y merge de PR.

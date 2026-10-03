from: claude
to: baitiare
type: answer
task: T5
re: 20261003-154849-baitiare-to-claude-re-baitiare-status-t5-dragon-home-screen.md
subject: Re: dragon, home screen y como integrarlo
---
Hola Baitiare. Gracias por contestar, y buen trabajo con el dragón de Cracovia: un dragón encaja muy bien con la misión "Dragon breathing" y es una buena historia para el pitch. La decisión final de la identidad de la mascota es de Alberto; yo se la pregunto. Mientras tanto, esto es lo que necesito de ti:

1. NO hagas un segundo T5. La mascota T5 ya está en main (PR 34, carpeta `src/components/features/companion/`). Lo tuyo es T5b: poner tu arte del dragón DENTRO del componente `Companion` existente, sin cambiar su API: props `pose` (idle, breathe, stretch, balance, strength, cheer), `equippedItemIds`, `size` (sm, md, lg) y `name`. Items por id (`ITEM_IDS` en `src/config/content-ids.ts`): sombrero, capa, gafas y color. Un item por ranura. Reglas: nunca triste, enfermo ni cansado; respeta `prefers-reduced-motion`; nombre accesible. Los tests de `Companion.test.tsx` deben seguir pasando. Haz `git fetch origin && git rebase origin/main` antes.
2. Colores: nada de hex escritos a mano (el #7054C7 del botón Play incluido). Usa `theme.colors.*`. Si el dragón necesita la paleta turquesa, mándame por aquí los nombres y los valores y yo los añado a `src/theme`.
3. Pantalla de inicio (T6): los botones FEED y MEDICINES no pueden estar. El compañero NO se cuida ni se alimenta (no es un Tamagotchi), y el niño no registra medicación (eso lo apuntan los padres, solo sí/no, en el modo padres). La navegación del niño es: Check-in (`ROUTES.checkIn`), Misiones (`ROUTES.missions`), Personalizar (`ROUTES.companion`) y una puerta pequeña a "Padres" (`ROUTES.parent`). El botón Play grande puede llevar a la misión. Si no hay niño configurado, redirige a `ROUTES.parentSetup` SOLO cuando `isReady` sea true. Carpeta: `src/components/features/child-mode/HomeScreen/`.
4. T8: confirmado, Juan hace el motor en `src/lib/missions/` y tú las pantallas encima. Habla con él por aquí.
5. BLOQUEO IMPORTANTE: dices que no puedes hacer push por falta de credenciales. Díselo a Alberto: tiene que invitarte como colaboradora y tú ejecutar `gh auth login` (o configurar una clave SSH) en tu ordenador. Sin push no podemos revisar ni fusionar nada tuyo. Si no se arregla en minutos, dime y busco otra vía.
Abre PR aunque esté a medias. Contesta aquí cuando tengas el push.

from: baitiare
to: claude
type: answer
task: T5
re: 20261003-160430-claude-to-baitiare-decision-the-krak-w-dragon-is-the-compan.md
subject: Re: DECISION: Kraków dragon palette and integration plan
---
Hola Claude. ¡Genial noticia que el dragón de Cracovia sea la mascota oficial!
1. Credenciales: Push verificado y funcionando 100% en GitHub.
2. Paleta del dragón y Play button para src/theme:
- dragonBody: #36C5D4
- dragonBodyBorder: #258D9C
- dragonBelly: #E0F7EC
- dragonBellyLines: #94E3C8
- dragonWing: #C6B5E8
- dragonWingStrut: #9B82C9
- dragonEye: #263B4D
- dragonHorn: #E5A825
- dragonHornHighlight: #FFE27A
- dragonCheek: #F29AA8
- playButton: #7054C7
- childHomeBg: #BFEAF3

3. Plan en marcha:
- Hago rebase sobre origin/main.
- Integro el arte del dragón dentro de src/components/features/companion/Companion con soporte para poses (idle, breathe, stretch, balance, strength, cheer) y equipamiento de items (hat, cape, glasses, color), respetando tests existentes.
- Construyo T6 en src/components/features/child-mode/HomeScreen/ con la navegación correcta (Check-in, Misiones, Personalizar, Puerta Padres y botón Play grande a Misiones) y redirección si no hay niño configurado.
- Farouk confirmó que toma T15.
Te aviso en cuanto suba la rama y abra el PR.

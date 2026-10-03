from: claude
to: farouk
type: answer
task: T4
re: 20261003-154146-farouk-to-claude-clinical-review-complete-verified-source.md
subject: Re: clinical review PR 38, two fixes before merge
---
Hi Farouk, good work: real instruments for the three questions and softer mission steps are exactly what we needed. PR 38 looks mergeable. Two fixes first:

1. Dragon Breathing source: Szigethy 2007 (JAACAP) is about cognitive behavioural therapy in IBD, and van Tilburg 2009 is about guided imagery for functional abdominal pain. Neither supports "diaphragmatic breathing promotes parasympathetic tone / downregulates visceral hyperalgesia". Please check them on PubMed. If they do not support it, replace the comment with `// source: to verify` and no claim. Also remove the claims in the other comments ("avoiding pressure on inflamed bowel segments", "relieve the slumped antalgic posture"): comments are fine for a source, not for a health claim, because that text tends to end up in the UI.
2. `parentNote` must be neutral information, not advice. "Rest if joints feel tender" and "Remind the child to breathe freely and avoid holding their breath" read as instructions. Use a plain description, for example "A shallow, gentle wall slide with easy breathing." and "Single-leg balance practice with a wall or chair for light support."
For the four instruments (PCDAI, FPS-R, PedsQL fatigue, IMPACT): I cannot verify them from here and they look plausible. Please confirm each reference with a PubMed or publisher link and add the link in a comment. "J Pediatr Gastroenterol Nutr 2009" for Varni has no volume or pages: complete it or remove it.
When it is fixed, tell me here (type done). Then send your verified list to Claudia, as you did.

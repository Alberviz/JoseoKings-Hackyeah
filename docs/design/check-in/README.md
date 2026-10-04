# Daily check-in: screenshots and palette options

Screenshots of PR #82 at 360x780 (viewport only), taken before the last battery fix. In the current branch the "Full energy" battery has 3 green bars (theme `success`), not pale mint.

| File                  | Screen                               |
| :-------------------- | :----------------------------------- |
| `01-q1.png`           | Question 1 (belly), nothing selected |
| `02-q1-selected.png`  | Question 1 with an answer selected   |
| `03-q2-energy.png`    | Question 2 (energy, batteries)       |
| `04-q3.png`           | Question 3 (play pace)               |
| `05-end.png`          | End screen after saving              |

## Palette options (not decided yet)

Alberto finds the app too black-and-white and will pick one of these. Until then, use theme tokens only so the change applies everywhere. The main idea in B, C and D: each answer card gets its own soft colour instead of all white.

| Token idea        | A · Notebook (today) | B · Candy sky | C · Jungle pop | D · Dragon sunset |
| :---------------- | :------------------- | :------------ | :------------- | :---------------- |
| Background        | `#F6F0E2`            | `#E6F4FF`     | `#EEF9E4`      | `#FFF1E4`         |
| Ink (text, lines) | `#1F2F6B`            | `#24305E`     | `#1E3A34`      | `#2A2350`         |
| Primary (buttons) | `#127782`            | `#2F6FE0`     | `#14805A`      | `#6A4BC4`         |
| Accent            | `#FF7A59`            | `#FF8FB8`     | `#FF9F1C`      | `#FF7A59`         |
| Highlight         | `#FFC93C`            | `#FFD84D`     | `#FFD23F`      | `#FFC93C`         |
| Play button       | `#7054C7`            | `#7C5CFF`     | `#0E7490`      | `#E2557A`         |
| Answer card 1     | `#FFFDF6`            | `#D8F7E6`     | `#CFF2DC`      | `#E4DBFF`         |
| Answer card 2     | `#FFFDF6`            | `#FFF1BF`     | `#FFF0C2`      | `#FFE9B8`         |
| Answer card 3     | `#FFFDF6`            | `#FFE0EA`     | `#FFE1C7`      | `#FFD9CC`         |
| Battery full/mid/low | `#1E7A46` / `#E5A825` / `#FF7A59` | `#22A06B` / `#F2B705` / `#FF6F91` | `#14805A` / `#F2A900` / `#F2711C` | `#2E9E6A` / `#F0A202` / `#F26B4F` |

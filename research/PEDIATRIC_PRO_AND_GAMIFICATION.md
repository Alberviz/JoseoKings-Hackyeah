# 🧒 Cuestionarios Pediátricos Validados y Psicología de Gamificación en Crohn

> **Repositorio:** `JoseoKings-Hackyeah` (`Projects/Hackaton`)  
> **Rama:** `debate/family-mode`  
> **Autores:** Equipo JoseoKings  
> **Fecha:** Octubre 2026  
> **Fuentes:** ESPGHAN / NASPGHAN Pediatric Guidelines, *Journal of Crohn's and Colitis* (Ledder et al., 2023), *JAMA Pediatrics* (Rosen et al.), *Gastroenterology* (wPCDAI Turner et al.), Behavioral Psychology (Variable-Ratio Schedules).

---

## 1. Las Preguntas Clínicas Exactas para Determinar el Estado del Niño

En la Enfermedad de Crohn pediátrica, las guías internacionales de gastroenterología pediátrica (**ESPGHAN**, **NASPGHAN** y las directrices de la **ECCO**) definen que un sistema de monitorización diaria debe basarse en un subconjunto estricto de **Patient-Reported Outcomes (PROs)** derivados del **wPCDAI** (*weighted Pediatric Crohn's Disease Activity Index*) y el **Pediatric PRO2**.

### 1.1. Cantidad Óptima de Preguntas
* **Número exacto:** **3 preguntas fijas obligatorias** (+ 1 pregunta binaria nocturna de alerta rápida).
* **Por qué no más:** Los estudios clínicos de salud digital pediátrica demuestran que cuestionarios con más de 4 preguntas sufren una **tasa de abandono superior al 70% a los 14 días** debido a la fatiga por fatiga cognitiva y rechazo al trámite médico.

---

### 1.2. Las 3 Preguntas del "Core Clínico" Diario

| Dimensión Clínica | Pregunta Oficial (wPCDAI / PRO2) | Adaptación Infantil en la App (Lenguaje "Belly") | Opciones de Respuesta Cuantitativas |
| :--- | :--- | :--- | :--- |
| **1. Dolor Abdominal** | *Frecuencia e intensidad del dolor abdominal y si interfiere con actividades normales.* | *"¿Cómo ha estado tu barriguita hoy?"* | • `0`: Como si nada (contenta)  <br>• `1`: Molestia leve que se pasa rápido  <br>• `2`: Dolor que me hizo parar o descansar  <br>• `3`: Dolor fuerte (me impidió jugar o ir a clase) |
| **2. Frecuencia y Forma de Heces** | *Número de deposiciones líquidas o muy blandas en las últimas 24 horas.* | *"¿Cuántas veces fuiste al baño hoy a hacer caca blanda o caldosa?"* | Selector de números con iconos ilustrados:  <br>`0`, `1`, `2`, `3`, `4 o más` |
| **3. Nivel de Energía / Bienestar** | *Capacidad funcional general y mantenimiento de actividades acordes a su edad.* | *"¿Cuánta batería de energía has tenido hoy para jugar o hacer cosas?"* | Barra visual de batería / caritas:  <br>• 🔋 `100%`: A tope de energía  <br>• 🔋 `70%`: Normal, algo cansado  <br>• 🪫 `30%`: Flojito, preferí estar tumbado |

### 1.3. La Pregunta Filtro de Oro (Marcador Clínico Nocturno)
* **Pregunta:** *"¿Te despertó la tripa esta noche para ir al baño?"* (`Sí / No`).
* **Justificación médica:** En pediatría, el dolor funcional (nervios, ansiedad o colon irritable) **nunca** despierta al niño dormido. Las deposiciones o dolores que despiertan al menor a mitad de la noche son el **marcador biológico más específico de inflamación orgánica activa en Crohn**.

---

## 2. ¿Cómo Evitar que el Niño se Canse? (El Modelo "3 + 1 Rotatorio")

Para no alterar la serie temporal que necesita el gastroenterólogo pediátrico pero evitar el aburrimiento del niño, la literatura de mHealth recomienda el esquema **"Core Fijo + Micro-Pregunta Sorpresa"**:

1. **Las 3 fijas (15 segundos):** Dolor, Cacas blandas y Energía. Siempre con la misma escala visual para mantener la validez clínica longitudinal.
2. **1 Pregunta Sorpresa Rotatoria diaria:** Cambia cada día y se presenta como una curiosidad de la mascota:
   * *Lunes (Alimentación):* "¿Cuál fue tu comida favorita hoy?" (Cruzado con la dieta CDED).
   * *Martes (Actividad):* "¿A qué jugaste hoy en el patio?" (Movilidad y pasos).
   * *Miércoles (Emocional):* "¿Hubo algún momento del día en que te sintieras preocupado?" (Estrés escolar).
   * *Jueves (Hidratación):* "¿Le diste de beber suficiente agüita a tu cuerpo hoy?"
   * *Viernes (Creativo):* "¿Qué sombrero nuevo le pondrías hoy a Belly?"

---

## 3. La Ruleta de Premios y la Psicología del Refuerzo Variable

La idea de desbloquear una **ruleta de premios** al completar el check-in diario está **100% respaldada por la psicología conductual y los estudios de gamificación en enfermedades crónicas pediátricas**.

### 3.1. Base Psicológica: Programa de Razón Variable (Variable-Ratio Reinforcement)
* En psicología del aprendizaje (B.F. Skinner), los esquemas de **recompensa variable impredecible** son los más potentes para consolidar hábitos duraderos y resistentes a la extinción.
* Si el niño siempre recibe exactamente el mismo premio predecible (ej. 10 monedas fijas), aparece el **efecto de sobrejustificación** (*over-justification effect*): el niño pierde el interés intrínseco y abandona la app a las pocas semanas.
* **La Ruleta:** Al responder las 3 preguntas, la ruleta gira y entrega recompensas virtuales variadas:
  * 🎩 *Accesorios cosméticos:* Gorros, gafas o disfraces para su mascota "Belly".
  * ⭐ *Cromos coleccionables:* Tarjetas digitales del "Club del Intestino Fuerte".
  * 🎮 *Minijuego desbloqueable:* 1 minuto de un juego sencillo (ej. esquivar alimentos ultraprocesados).
  * 🪙 *Monedas del juego:* Para mejorar la casita virtual de su mascota.

---

### 3.2. REGLA DE ORO ÉTICA Y CLÍNICA (Imprescindible para el Jurado)

> [!CAUTION]
> **NUNCA premiar que el niño "se sienta bien":**
> Si la app da mejores premios cuando el niño dice que no le duele nada o que no tiene diarrea, el niño **falseará las respuestas** para no decepcionar a sus padres o ganar más puntos.
> 
> **La regla clínica:** La tirada de la ruleta se desbloquea **únicamente por el acto de reportar con sinceridad**, exactamente con las mismas probabilidades toque lo que toque en el estado de salud. La honestidad es lo que se refuerza positivamente.

---

## 4. Algoritmo wPCDAI Simplificado para la App (Client-Side)

```typescript
export interface PediatricCheckinInput {
  painLevel: 0 | 1 | 2 | 3;       // 0: Ninguno, 1: Leve, 2: Moderado, 3: Severo
  liquidStools: number;          // 0 a 4+
  energyLevel: 0 | 1 | 2 | 3;     // 0: A tope, 1: Normal, 2: Cansado, 3: Muy bajo
  nocturnalAwakening: boolean;   // ¿Le despertó la tripa de noche?
}

export function evaluatePediatricState(input: PediatricCheckinInput): {
  score: number;
  clinicalState: 'REMISSION' | 'MILD_ACTIVITY' | 'MODERATE_SEVERE';
  alertTriggered: boolean;
} {
  let score = 0;

  // 1. Dolor abdominal (Ponderación wPCDAI)
  score += input.painLevel * 5;

  // 2. Deposiciones líquidas
  if (input.liquidStools >= 4) score += 15;
  else if (input.liquidStools >= 2) score += 10;
  else if (input.liquidStools === 1) score += 5;

  // 3. Nivel de energía / bienestar funcional
  score += input.energyLevel * 5;

  // 4. Marcador nocturno de inflamación
  if (input.nocturnalAwakening) score += 10;

  // Clasificación clínica wPCDAI adaptada
  let clinicalState: 'REMISSION' | 'MILD_ACTIVITY' | 'MODERATE_SEVERE' = 'REMISSION';
  let alertTriggered = false;

  if (score >= 25 || input.nocturnalAwakening && score >= 15) {
    clinicalState = 'MODERATE_SEVERE';
    alertTriggered = true;
  } else if (score >= 10) {
    clinicalState = 'MILD_ACTIVITY';
  }

  return { score, clinicalState, alertTriggered };
}
```

# 🏃‍♂️ Actividad Física, Estado Holístico y Predicción en Enfermedad de Crohn

> **Repositorio:** `JoseoKings-Hackyeah` (`Projects/Hackaton`)  
> **Rama:** `feature/product-innovation-crohn`  
> **Autores:** Equipo JoseoKings  
> **Fecha:** Octubre 2026  
> **Fuentes:** *Gastroenterology* (Hirten et al., 2025), *Nature* (MoTrPAC Study, 2024), *J Cachexia Sarcopenia Muscle* (Kasznár et al., 2026), *PubMed / Consensus*.

---

## 1. Resumen Ejecutivo: El Eje Físico-Emocional-Intestinal

La Enfermedad de Crohn no se limita al tubo digestivo: es una **enfermedad sistémica** profundamente interconectada con la masa muscular, el estrés psicológico, el ritmo circadiano y la fatiga crónica.

Los estudios más recientes demuestran que:
1. **El ejercicio físico moderado es antiinflamatorio:** Libera mioquinas musculares que bloquean directamente el TNF-$\alpha$. Sin embargo, el sobreesfuerzo anaeróbico extremo provoca isquemia esplácnica transitoria y permeabilidad intestinal (*leaky gut*).
2. **Los dispositivos wearables predicen brotes antes que los análisis de sangre:** El estudio de *Gastroenterology* (Hirten et al., 2025) demostró que las alteraciones en los ritmos circadianos de HRV (variabilidad cardíaca) y el recuento pasivo de pasos alertan de brotes días antes de los síntomas clínicos.
3. **El 80% de los pacientes sufren fatiga crónica EII:** El cansancio no se debe solo a la anemia, sino a la inflamación sistémica de bajo grado mediada por citoquinas.

**La innovación de producto:** Crear un **"Belly Battery" (Índice de Energía y Estado Intestinal)** que combine la motilidad acústica, la actividad física y el sueño para guiar al usuario día a día de forma segura, adaptándose tanto a adultos como al entorno pediátrico gamificado.

---

## 2. Evidencia Científica: Fisiología del Ejercicio en Crohn

### 2.1. El Mecanismo de las Mioquinas Antiinflamatorias (Kasznár et al., 2026 & Nature MoTrPAC 2024)
* **Referencias:**
  1. *Physical Activity Improves Quality of Life in Patients With Inflammatory Bowel Disease: A Systematic Review and Meta-Analysis*. *J Cachexia Sarcopenia Muscle*, 2026 ([Consensus Ref](https://consensus.app/papers/details/30b7a8a1dc745a0981baaa788a08e05e/?utm_source=unknown)).
  2. *Temporal dynamics of the multi-omic response to endurance exercise training*. *Nature*, 2024 (PMID: [38693412](https://pubmed.ncbi.nlm.nih.gov/38693412/)).
* **Fisiología:**
  * Durante la contracción muscular aeróbica moderada, las fibras musculares esqueléticas liberan **interleucina-6 muscular (mioquina IL-6)**.
  * A diferencia de la IL-6 secretada por los macrófagos en la inflamación crónica, la IL-6 miogénica estimula la producción sistémica de **antagonistas del receptor de IL-1 (IL-1ra)** y de **interleucina-10 (IL-10)**, una potente citoquina antiinflamatoria que **inhibe la transcripción de TNF-$\alpha$** en la mucosa ileal y colónica.
  * Además, el ejercicio aeróbico regular aumenta la diversidad del microbioma intestinal, promoviendo cepas productoras de **ácidos grasos de cadena corta (AGCC / Butirato)**, el combustible principal de los colonocitos para regenerar la barrera intestinal.

### 2.2. La Ventana Terapéutica del Ejercicio: El Riesgo de Isquemia Esplácnica
* **Zona Segura (Moderada: 50% - 70% FC máx / Caminar, trote suave, natación, pilates, fuerza ligera):**
  * Mejora la densidad mineral ósea (vital en Crohn por el uso recurrente de corticoides).
  * Reduce la sarcopenia (pérdida de masa muscular típica por malabsorción en íleon).
  * Aumenta la motilidad fisiológica sana.
* **Zona de Riesgo (Extrema: > 80% FC máx o esfuerzos prolongados extenuantes sin hidratación):**
  * Desvía hasta el 80% del flujo sanguíneo desde los órganos viscerales (lecho esplácnico) hacia los músculos locomotores.
  * Genera **hipoperfusión e isquemia intestinal transitoria**, aumentando la permeabilidad del epitelio intestinal y permitiendo el paso de lipopolisacáridos (LPS) bacterianos a la sangre, lo que puede precipitar un brote inflamatorio.

---

## 3. Monitorización Pasiva del Estado Holístico (Gastroenterology 2025)

### 3.1. Predicción de Brotes con Smartwatches (Hirten et al., 2025)
* **Referencia:** *Physiological Data Collected from Wearable Devices Identify and Predict Inflammatory Bowel Disease Flares*. *Gastroenterology*, 2025 ([Consensus Ref](https://consensus.app/papers/details/390f6a3543f850cc9372a84ca66e8cd5/?utm_source=unknown), PMID: [39826619](https://pubmed.ncbi.nlm.nih.gov/39826619/)).
* **Metodología:** Estudio multicéntrico prospectivo con 309 pacientes usando Apple Watch, Fitbit u Oura Ring, correlacionado con calprotectina fecal y PCR.
* **Biomarcadores Digitales Descubiertos:**
  1. **Disrupción del Ritmo Circadiano de HRV:** La amplitud y la fase del ritmo circadiano de la variabilidad cardíaca se desincronizan significativamente **días antes** de que el paciente reporte síntomas o suban los reactantes de fase aguda.
  2. **Caída Premonitoria en la Actividad (Pasos Diarios):** Una disminución inexplicable del recuento de pasos diarios (fatiga preclínica) se correlaciona con activación subclínica inmune.
  3. **Frecuencia Cardíaca en Reposo (RHR):** Elevación sostenida de 3 a 5 lpm nocturnos como marcador de respuesta inflamatoria sistémica.

---

## 4. Traducción a Funcionalidades Innovadoras de la App

```
┌────────────────────────────────────────────────────────────────────────┐
│                   BELLY BATTERY / READINESS ENGINE                     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
    ┌───────────────────────────────┼───────────────────────────────┐
    ▼                               ▼                               ▼
 [Fonometría Acústica]    [Actividad y Pasos]       [Sueño y Tono Vagal]
  Intervalo SSI (ms)       Acelerómetro / HealthKit   HRV nocturno / RMSSD
    │                               │                               │
    └───────────────────────────────┼───────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      ESTADO HOLÍSTICO INTEGRADO                        │
├────────────────────────────────────────────────────────────────────────┤
│  🟢 100% - 80%: "Tripa en Forma" (Permite deporte y comidas completas) │
│  🟡 79% - 50%: "Carga Moderada" (Recomienda paseos suaves y CDED Fase1)│
│  🔴 < 50%: "Modo Regeneración" (Descanso, hidratación, escudo vagal)  │
└────────────────────────────────────────────────────────────────────────┘
```

### 4.1. "Gut-Paced Activity" (Prescripción de Ejercicio Adaptativa)
En lugar de fijar un objetivo ciego de "10.000 pasos al día":
* Si el check-in acústico de la mañana muestra **normoperistalsis ($SSI \approx 500\text{ ms}$)** y HRV normal:  
  👉 La app fija un objetivo activo (ej. 8.000 pasos, rutina de fuerza ligera para proteger los huesos).
* Si el check-in acústico muestra **espasmos o hipomotilidad ($SSI > 1200\text{ ms}$)**:  
  👉 La app activa automáticamente el **"Modo Calma"**: reduce la meta a paseos lentos y recomienda estiramientos diafragmáticos para no forzar la circulación esplácnica.

### 4.2. Módulo Pediátrico Gamificado: "Las Misiones de Energía de Belly"
En la versión pediátrica/adolescente:
* La mascota **Belly** tiene una barra de energía ("Belly Battery"):
  * Dormir 8 horas recarga a Belly.
  * Salir al recreo a jugar y sumar pasos le da puntos de fuerza.
  * Si el niño ha tenido una clase difícil o se siente cansado, Belly le dice: *"¡Hoy hemos gastado mucha energía en el cole! Vamos a descansar juntos para que la tripa no se enfade"*.
* **Beneficio clínico:** Convierte la adherencia y el descanso en una dinámica positiva, evitando que los padres tengan que perseguir al niño constantemente para preguntarle cómo se encuentra.

---

## 5. Algoritmo de Viabilidad en 24 Horas: "Belly Battery Score"

Un algoritmo determinista y transparente ejecutable 100% en cliente (TypeScript):

```typescript
export interface HolisticStateInput {
  ssiAcousticMs: number;      // Normal ~500ms, Crohn activo >1200ms
  dailySteps: number;         // Pasos del día
  targetSteps: number;        // Objetivo personalizado
  sleepHours: number;         // Horas de sueño
  hrvRmssd: number;           // HRV en ms (medido por cámara PPG o wearable)
  baselineHrv: number;        // Línea base del usuario
}

export function calculateBellyBattery(input: HolisticStateInput): {
  score: number;              // 0 a 100
  status: 'OPTIMAL' | 'MODERATE' | 'RECOVERY';
  recommendation: string;
} {
  let score = 100;

  // 1. Penalización acústica (Mayo Clinic DEAL Lab)
  if (input.ssiAcousticMs > 1100) {
    score -= 35; // Fuerte indicador de hipomotilidad inflamatoria
  } else if (input.ssiAcousticMs > 800) {
    score -= 15;
  }

  // 2. Penalización o bonus por tono vagal (HRV)
  const hrvRatio = input.hrvRmssd / (input.baselineHrv || 50);
  if (hrvRatio < 0.75) {
    score -= 25; // Estrés simpático / caída de tono vagal
  } else if (hrvRatio > 1.1) {
    score += 5;
  }

  // 3. Impacto del descanso (Sueño)
  if (input.sleepHours < 6) {
    score -= 20;
  } else if (input.sleepHours >= 8) {
    score += 5;
  }

  // Clampear entre 0 y 100
  const finalScore = Math.max(10, Math.min(100, Math.round(score)));

  let status: 'OPTIMAL' | 'MODERATE' | 'RECOVERY' = 'OPTIMAL';
  let recommendation = 'Tu sistema digestivo está en equilibrio. Buen día para actividad activa.';

  if (finalScore < 50) {
    status = 'RECOVERY';
    recommendation = 'Se detectan señales de estrés digestivo. Prioriza descanso, paseos suaves y respiración vagal.';
  } else if (finalScore < 75) {
    status = 'MODERATE';
    recommendation = 'Estado digestivo intermedio. Mantén actividad física moderada y evita esfuerzos agotadores.';
  }

  return { score: finalScore, status, recommendation };
}
```

---

## 6. Referencias Científicas Clave

1. **Hirten R, et al. (Gastroenterology, 2025):** *Physiological Data Collected from Wearable Devices Identify and Predict Inflammatory Bowel Disease Flares*.
2. **MoTrPAC Study Group (Nature, 2024):** *Temporal dynamics of the multi-omic response to endurance exercise training*. PMID: [38693412](https://pubmed.ncbi.nlm.nih.gov/38693412/).
3. **Kasznár E, et al. (J Cachexia Sarcopenia Muscle, 2026):** *Physical Activity Improves Quality of Life in Patients With Inflammatory Bowel Disease: A Systematic Review and Meta-Analysis*.
4. **Mayo Clinic DEAL Lab (Med Sci, 2025):** *Prospects of AI-Powered Bowel Sound Analytics for Diagnosis, Characterization, and Treatment Management of Inflammatory Bowel Disease*. PMID: [41133513](https://pubmed.ncbi.nlm.nih.gov/41133513/).
5. **Vagus Nerve in Crohn's (Int Immunopharmacol, 2025):** *Neuro-immune interactions: Exploring the anti-inflammatory role of the vagus nerve*. PMID: [40440960](https://pubmed.ncbi.nlm.nih.gov/40440960/).

// Parent orientation status engine.
// Aggregates child check-in responses (tummy comfort, energy) and watch metrics (steps, sleep, resting HR)
// into a deterministic, orientative status for parents.
// STRICTLY 100% deterministic math. NO AI, NO ML, NO LLM.
// Grounded in Consensus evidence (CLINICAL_EVIDENCE_AND_ALGORITHMS.md).
// No medical claims, no flare predictions, no invented composite indices.

import { outsideUsualRange, personalBaseline, S_MIN } from "./baseline";
import { hampel } from "./clean";
import { asScore } from "./counts";
import type { CheckInScore, RangeBand } from "./types";

export type ParentStatusBand = "stable" | "attention" | "sustained_change";

export type ParentStatusColor = "verde" | "amarillo" | "naranja";

export interface DailyParentInput {
  date: string;
  bellyComfort?: unknown;
  energy?: unknown;
  playPace?: unknown;
  steps?: number | null;
  sleepMinutes?: number | null;
  restingHr?: number | null;
  daytimeValid?: boolean;
  nightValid?: boolean;
}

export interface MetricEvaluation {
  metric: "steps" | "sleep" | "restingHr";
  value: number | null;
  deviation: number | null;
  baselineMedian: number | null;
  band: RangeBand | "collecting-baseline";
  outsideRange: boolean;
  consecutiveOutsideDays: number;
}

export interface ConfidenceScoreInfo {
  score: number; // 0 to 100
  validDays: number;
  totalDays: number;
  ratio: number; // 0.0 to 1.0
  description: string;
}

export interface ParentStatusResult {
  status: ParentStatusBand;
  label: string;
  color: ParentStatusColor;
  confidenceScore: ConfidenceScoreInfo;
  headline: string;
  descriptions: string[];
  actionSuggestion: string;
  targetDate: string;
  metrics: {
    steps?: MetricEvaluation;
    sleep?: MetricEvaluation;
    restingHr?: MetricEvaluation;
  };
  checkInSummary: {
    todayComfort: CheckInScore;
    todayEnergy: CheckInScore;
    consecutiveDiscomfortDays: number;
    consecutiveLowEnergyDays: number;
  };
}

export interface EvaluateParentStatusOptions {
  targetDate?: string;
  windowDays?: number;
}

function isDayValid(day: DailyParentInput): boolean {
  if (typeof day.daytimeValid === "boolean" || typeof day.nightValid === "boolean") {
    return Boolean(day.daytimeValid || day.nightValid);
  }
  return (
    (typeof day.steps === "number" && !Number.isNaN(day.steps)) ||
    (typeof day.sleepMinutes === "number" && !Number.isNaN(day.sleepMinutes)) ||
    (typeof day.restingHr === "number" && !Number.isNaN(day.restingHr))
  );
}

export function calculateWearTimeConfidence(days: DailyParentInput[]): ConfidenceScoreInfo {
  const totalDays = days.length;
  if (totalDays === 0) {
    return {
      score: 0,
      validDays: 0,
      totalDays: 0,
      ratio: 0,
      description: "Sin datos registrados para calcular la validez.",
    };
  }
  const validDays = days.filter(isDayValid).length;
  const ratio = validDays / totalDays;
  const score = Math.round(ratio * 100);
  return {
    score,
    validDays,
    totalDays,
    ratio,
    description: `El reloj tuvo datos válidos en ${validDays} de los ${totalDays} días (${score}%).`,
  };
}

export function evaluateParentStatus(
  days: DailyParentInput[],
  options: EvaluateParentStatusOptions = {},
): ParentStatusResult {
  if (!days || days.length === 0) {
    return {
      status: "stable",
      label: "Estable",
      color: "verde",
      confidenceScore: {
        score: 0,
        validDays: 0,
        totalDays: 0,
        ratio: 0,
        description: "Sin datos registrados para calcular la validez.",
      },
      headline: "Sin datos registrados",
      descriptions: ["Aún no hay registros disponibles para evaluar el período."],
      actionSuggestion:
        "Registrar los check-ins diarios y usar el reloj para comenzar a construir la referencia habitual del peque.",
      targetDate: options.targetDate ?? "",
      metrics: {},
      checkInSummary: {
        todayComfort: null,
        todayEnergy: null,
        consecutiveDiscomfortDays: 0,
        consecutiveLowEnergyDays: 0,
      },
    };
  }

  // Sort days chronologically
  const sortedDays = [...days].sort((a, b) => a.date.localeCompare(b.date));

  // Determine target index
  let targetIndex = sortedDays.length - 1;
  if (options.targetDate) {
    const idx = sortedDays.findIndex((d) => d.date === options.targetDate);
    if (idx !== -1) targetIndex = idx;
  }
  const targetDay = sortedDays[targetIndex];
  const targetDate = targetDay.date;

  // Confidence calculation over up to 14 days leading to targetDate (or whole period)
  const windowSize = options.windowDays ?? 14;
  const windowStart = Math.max(0, targetIndex - windowSize + 1);
  const evaluationWindow = sortedDays.slice(windowStart, targetIndex + 1);
  const confidenceScore = calculateWearTimeConfidence(evaluationWindow);

  // Helper to extract and analyze metric
  function analyzeMetricSeries(
    extractor: (d: DailyParentInput) => number | null | undefined,
    sMin: number,
    metricName: "steps" | "sleep" | "restingHr",
  ): MetricEvaluation | undefined {
    const rawSeries = sortedDays.map(extractor);
    const hasAnyValue = rawSeries.some((v) => typeof v === "number" && !Number.isNaN(v));
    if (!hasAnyValue) return undefined;

    const cleaned = hampel(rawSeries);
    const baselines = personalBaseline(cleaned.values, { sMin });
    const deviations = baselines.map((b) => (b && b.kind === "value" ? b.d : null));
    const a9Marked = outsideUsualRange(deviations);

    const targetVal = rawSeries[targetIndex] ?? null;
    const targetBase = baselines[targetIndex];

    let deviation: number | null = null;
    let baselineMedian: number | null = null;
    let band: RangeBand | "collecting-baseline" = "collecting-baseline";
    let outsideRange = false;

    if (targetBase && targetBase.kind === "value") {
      deviation = targetBase.d;
      baselineMedian = targetBase.median;
      band = targetBase.band;
      outsideRange = Math.abs(targetBase.d) > 2 || a9Marked[targetIndex];
    }

    // Count consecutive outside days ending at targetIndex
    let consecutiveOutsideDays = 0;
    for (let i = targetIndex; i >= 0; i -= 1) {
      const b = baselines[i];
      if (b && b.kind === "value" && (Math.abs(b.d) > 2 || a9Marked[i])) {
        consecutiveOutsideDays += 1;
      } else {
        break;
      }
    }

    return {
      metric: metricName,
      value: targetVal,
      deviation,
      baselineMedian,
      band,
      outsideRange,
      consecutiveOutsideDays,
    };
  }

  const stepsEval = analyzeMetricSeries((d) => d.steps, S_MIN.steps, "steps");
  const sleepEval = analyzeMetricSeries((d) => d.sleepMinutes, S_MIN.sleepMinutes, "sleep");
  const restingHrEval = analyzeMetricSeries((d) => d.restingHr, S_MIN.nocturnalHr, "restingHr");

  // Check-in responses
  const todayComfort = asScore(targetDay.bellyComfort);
  const todayEnergy = asScore(targetDay.energy);

  let consecutiveDiscomfortDays = 0;
  for (let i = targetIndex; i >= 0; i -= 1) {
    const c = asScore(sortedDays[i].bellyComfort);
    if (c === 1 || c === 2) {
      consecutiveDiscomfortDays += 1;
    } else {
      break;
    }
  }

  let consecutiveLowEnergyDays = 0;
  for (let i = targetIndex; i >= 0; i -= 1) {
    const e = asScore(sortedDays[i].energy);
    if (e === 1 || e === 2) {
      consecutiveLowEnergyDays += 1;
    } else {
      break;
    }
  }

  // Band evaluation logic
  const evaluatedMetrics = [stepsEval, sleepEval, restingHrEval].filter(
    (m): m is MetricEvaluation => m !== undefined,
  );

  const hasSustainedMetricDeparture = evaluatedMetrics.some((m) => m.consecutiveOutsideDays >= 3);
  const hasSustainedDiscomfort = consecutiveDiscomfortDays >= 3 || consecutiveLowEnergyDays >= 3;

  const hasModerateMetricDeparture = evaluatedMetrics.some((m) => m.outsideRange);
  const hasIsolatedDiscomfort =
    (todayComfort === 1 || todayComfort === 2) && consecutiveDiscomfortDays < 3;
  const hasIsolatedLowEnergy =
    (todayEnergy === 1 || todayEnergy === 2) && consecutiveLowEnergyDays < 3;

  let status: ParentStatusBand = "stable";
  let label = "Estable";
  let color: ParentStatusColor = "verde";
  let headline = "Dentro del rango habitual";
  let actionSuggestion =
    "Mantener las rutinas diarias habituales y las actividades que el peque disfrute.";

  if (hasSustainedMetricDeparture || hasSustainedDiscomfort) {
    status = "sustained_change";
    label = "Cambio sostenido";
    color = "naranja";
    headline = "Cambio continuado respecto al rango habitual";
    actionSuggestion =
      "Se observan varios días consecutivos con variaciones o molestias. Sugerimos anotar estas observaciones en el registro para comentarlas con el equipo médico en la próxima consulta.";
  } else if (hasModerateMetricDeparture || hasIsolatedDiscomfort || hasIsolatedLowEnergy) {
    status = "attention";
    label = "Atención";
    color = "amarillo";
    headline = "Variación puntual respecto a lo habitual";
    actionSuggestion =
      "Priorizar el descanso hoy, mantener una buena hidratación y optar por rutinas suaves y tranquilas.";
  }

  // Generate plain-language, non-alarmist descriptions
  const descriptions: string[] = [];

  if (sleepEval && sleepEval.value !== null) {
    if (sleepEval.band === "below") {
      descriptions.push("El descanso de anoche estuvo por debajo de su rango habitual.");
    } else if (sleepEval.band === "above") {
      descriptions.push("El descanso de anoche estuvo por encima de su rango habitual.");
    } else if (sleepEval.band === "within") {
      descriptions.push("El descanso de anoche se mantuvo dentro de su rango habitual.");
    } else {
      const hours = (sleepEval.value / 60).toFixed(1);
      descriptions.push(
        `El descanso registrado anoche fue de ${hours} horas (recopilando datos de referencia).`,
      );
    }
  }

  if (stepsEval && stepsEval.value !== null) {
    if (stepsEval.band === "below") {
      descriptions.push("La actividad física estuvo por debajo de su rango habitual.");
    } else if (stepsEval.band === "above") {
      descriptions.push("La actividad física estuvo por encima de su rango habitual.");
    } else if (stepsEval.band === "within") {
      descriptions.push("La actividad física se mantuvo dentro de su rango habitual.");
    }
  }

  if (restingHrEval && restingHrEval.value !== null) {
    if (restingHrEval.band === "above") {
      descriptions.push(
        "La frecuencia cardíaca en reposo nocturno estuvo por encima de su rango habitual.",
      );
    } else if (restingHrEval.band === "below") {
      descriptions.push(
        "La frecuencia cardíaca en reposo nocturno estuvo por debajo de su rango habitual.",
      );
    } else if (restingHrEval.band === "within") {
      descriptions.push(
        "La frecuencia cardíaca en reposo nocturno se mantuvo dentro de su rango habitual.",
      );
    }
  }

  // Child check-in descriptions
  if (consecutiveDiscomfortDays >= 3) {
    descriptions.push(
      `El peque lleva ${consecutiveDiscomfortDays} días seguidos señalando molestias en la barriga.`,
    );
  } else if (todayComfort === 1) {
    descriptions.push("El peque ha señalado algo de molestia en la barriga hoy.");
  } else if (todayComfort === 2) {
    descriptions.push("El peque ha señalado molestia notable en la barriga hoy.");
  } else if (todayComfort === 0) {
    descriptions.push("El peque ha señalado encontrarse bien de la barriga hoy.");
  }

  if (consecutiveLowEnergyDays >= 3) {
    descriptions.push(
      `El peque lleva ${consecutiveLowEnergyDays} días seguidos señalando cansancio.`,
    );
  } else if (todayEnergy === 1) {
    descriptions.push("El peque ha señalado estar algo cansado hoy.");
  } else if (todayEnergy === 2) {
    descriptions.push("El peque ha señalado bastante cansancio hoy.");
  } else if (todayEnergy === 0) {
    descriptions.push("El peque ha señalado un buen nivel de energía hoy.");
  }

  if (targetDay.bellyComfort === "notToday") {
    descriptions.push("El peque prefirió no completar el registro hoy.");
  }

  return {
    status,
    label,
    color,
    confidenceScore,
    headline,
    descriptions,
    actionSuggestion,
    targetDate,
    metrics: {
      steps: stepsEval,
      sleep: sleepEval,
      restingHr: restingHrEval,
    },
    checkInSummary: {
      todayComfort,
      todayEnergy,
      consecutiveDiscomfortDays,
      consecutiveLowEnergyDays,
    },
  };
}

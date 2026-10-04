import { describe, expect, it } from "vitest";
import {
  calculateWearTimeConfidence,
  type DailyParentInput,
  evaluateParentStatus,
} from "../parentStatus";

describe("parentStatus engine", () => {
  // Helper to build 14 baseline days + target days
  function buildBaselineDays(
    count = 14,
    baseSteps = 8000,
    baseSleep = 540,
    baseHr = 65,
  ): DailyParentInput[] {
    const days: DailyParentInput[] = [];
    for (let i = 1; i <= count; i += 1) {
      const dayNum = String(i).padStart(2, "0");
      days.push({
        date: `2026-05-${dayNum}`,
        bellyComfort: 0,
        energy: 0,
        playPace: 0,
        steps: baseSteps + (i % 3) * 50,
        sleepMinutes: baseSleep + (i % 2) * 10,
        restingHr: baseHr,
        daytimeValid: true,
        nightValid: true,
      });
    }
    return days;
  }

  it("assigns 'stable' (Verde) when metrics are within usual range and check-ins are comfortable", () => {
    const history = buildBaselineDays(14);
    // Day 15: normal values
    history.push({
      date: "2026-05-15",
      bellyComfort: 0,
      energy: 0,
      playPace: 0,
      steps: 8050,
      sleepMinutes: 540,
      restingHr: 65,
      daytimeValid: true,
      nightValid: true,
    });

    const result = evaluateParentStatus(history, { targetDate: "2026-05-15" });

    expect(result.status).toBe("stable");
    expect(result.color).toBe("verde");
    expect(result.label).toBe("Estable");
    expect(result.actionSuggestion).toContain("rutinas");
    expect(result.descriptions).toEqual(
      expect.arrayContaining([
        expect.stringContaining("El descanso de anoche se mantuvo dentro de su rango habitual"),
        expect.stringContaining("La actividad física se mantuvo dentro de su rango habitual"),
        expect.stringContaining("El peque ha señalado encontrarse bien de la barriga hoy"),
      ]),
    );
  });

  it("assigns 'attention' (Amarillo) on moderate departure from usual range (|D_t| > 2)", () => {
    const history = buildBaselineDays(14);
    // Day 15: sleep significantly below usual (e.g. 360 min = 6h vs baseline ~9h)
    history.push({
      date: "2026-05-15",
      bellyComfort: 0,
      energy: 0,
      playPace: 0,
      steps: 8000,
      sleepMinutes: 360,
      restingHr: 65,
      daytimeValid: true,
      nightValid: true,
    });

    const result = evaluateParentStatus(history, { targetDate: "2026-05-15" });

    expect(result.status).toBe("attention");
    expect(result.color).toBe("amarillo");
    expect(result.label).toBe("Atención");
    expect(result.actionSuggestion.toLowerCase()).toContain("descanso");
    expect(result.descriptions).toEqual(
      expect.arrayContaining(["El descanso de anoche estuvo por debajo de su rango habitual."]),
    );
  });

  it("assigns 'attention' (Amarillo) on isolated child-reported discomfort or low energy", () => {
    const history = buildBaselineDays(14);
    // Day 15: normal watch metrics, but child reports mild discomfort
    history.push({
      date: "2026-05-15",
      bellyComfort: 1,
      energy: 1,
      playPace: 0,
      steps: 8050,
      sleepMinutes: 540,
      restingHr: 65,
      daytimeValid: true,
      nightValid: true,
    });

    const result = evaluateParentStatus(history, { targetDate: "2026-05-15" });

    expect(result.status).toBe("attention");
    expect(result.color).toBe("amarillo");
    expect(result.label).toBe("Atención");
    expect(result.descriptions).toEqual(
      expect.arrayContaining([
        "El peque ha señalado algo de molestia en la barriga hoy.",
        "El peque ha señalado estar algo cansado hoy.",
      ]),
    );
  });

  it("assigns 'sustained_change' (Naranja) for 3+ consecutive days of departure outside usual range", () => {
    const history = buildBaselineDays(14);
    // Days 15, 16, 17: steps drop to 1500 (far below 8000 baseline)
    history.push({
      date: "2026-05-15",
      bellyComfort: 0,
      energy: 0,
      steps: 1500,
      sleepMinutes: 540,
      daytimeValid: true,
      nightValid: true,
    });
    history.push({
      date: "2026-05-16",
      bellyComfort: 0,
      energy: 0,
      steps: 1400,
      sleepMinutes: 540,
      daytimeValid: true,
      nightValid: true,
    });
    history.push({
      date: "2026-05-17",
      bellyComfort: 0,
      energy: 0,
      steps: 1300,
      sleepMinutes: 540,
      daytimeValid: true,
      nightValid: true,
    });

    const result = evaluateParentStatus(history, { targetDate: "2026-05-17" });

    expect(result.status).toBe("sustained_change");
    expect(result.color).toBe("naranja");
    expect(result.label).toBe("Cambio sostenido");
    expect(result.actionSuggestion.toLowerCase()).toContain("consulta");
    expect(result.metrics.steps?.consecutiveOutsideDays).toBeGreaterThanOrEqual(3);
  });

  it("assigns 'sustained_change' (Naranja) for 3+ consecutive days of child-reported discomfort", () => {
    const history = buildBaselineDays(14);
    // Days 15, 16, 17: discomfort reports
    history.push({
      date: "2026-05-15",
      bellyComfort: 1,
      energy: 0,
      steps: 8000,
      sleepMinutes: 540,
      daytimeValid: true,
      nightValid: true,
    });
    history.push({
      date: "2026-05-16",
      bellyComfort: 2,
      energy: 1,
      steps: 8000,
      sleepMinutes: 540,
      daytimeValid: true,
      nightValid: true,
    });
    history.push({
      date: "2026-05-17",
      bellyComfort: 1,
      energy: 1,
      steps: 8000,
      sleepMinutes: 540,
      daytimeValid: true,
      nightValid: true,
    });

    const result = evaluateParentStatus(history, { targetDate: "2026-05-17" });

    expect(result.status).toBe("sustained_change");
    expect(result.color).toBe("naranja");
    expect(result.label).toBe("Cambio sostenido");
    expect(result.checkInSummary.consecutiveDiscomfortDays).toBe(3);
    expect(result.descriptions).toEqual(
      expect.arrayContaining([
        expect.stringContaining("El peque lleva 3 días seguidos señalando molestias en la barriga"),
      ]),
    );
  });

  it("calculates confidence score accurately based on wear-time validity percentage", () => {
    const days: DailyParentInput[] = [
      { date: "2026-05-01", daytimeValid: true, nightValid: true },
      { date: "2026-05-02", daytimeValid: true, nightValid: false },
      { date: "2026-05-03", daytimeValid: false, nightValid: false },
      { date: "2026-05-04", daytimeValid: false, nightValid: false },
    ];

    const conf = calculateWearTimeConfidence(days);
    expect(conf.totalDays).toBe(4);
    expect(conf.validDays).toBe(2);
    expect(conf.score).toBe(50);
    expect(conf.description).toContain("2 de los 4 días (50%)");
  });

  it("contains strictly non-alarmist descriptions with no medical claims or flare forecasts", () => {
    const history = buildBaselineDays(14);
    history.push({
      date: "2026-05-15",
      bellyComfort: 2,
      energy: 2,
      steps: 1000,
      sleepMinutes: 300,
      daytimeValid: true,
      nightValid: true,
    });

    const result = evaluateParentStatus(history);
    const serialized = JSON.stringify(result).toLowerCase();

    // STRICTLY NO pseudo-medical claims, flare predictions, or fake indices
    const forbidden = [
      "brote",
      "flare",
      "crisis",
      "inflamación",
      "predicción",
      "empeoramiento clínico",
      "diagnóstico",
      "biometric stability index",
    ];

    for (const term of forbidden) {
      expect(serialized.includes(term)).toBe(false);
    }
  });

  it("handles empty arrays or collecting baseline gracefully", () => {
    const empty = evaluateParentStatus([]);
    expect(empty.status).toBe("stable");
    expect(empty.confidenceScore.score).toBe(0);

    const singleDay: DailyParentInput[] = [
      {
        date: "2026-05-01",
        bellyComfort: 0,
        energy: 0,
        steps: 7000,
        sleepMinutes: 480,
      },
    ];
    const singleRes = evaluateParentStatus(singleDay);
    expect(singleRes.status).toBe("stable");
    expect(singleRes.metrics.sleep?.band).toBe("collecting-baseline");
  });
});

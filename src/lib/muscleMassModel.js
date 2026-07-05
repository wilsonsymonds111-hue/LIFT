// ─────────────────────────────────────────────────────────────
// Muscle Mass Estimation Model — Modular & Evidence-Informed
// Weighting is adjustable here for future updates.
// ─────────────────────────────────────────────────────────────

export const WEIGHTS = {
  BODY_WEIGHT: 0.40,   // 40% — weekly body weight change
  STRENGTH: 0.35,      // 35% — estimated 1RM changes on compound lifts
  CALORIES: 0.15,      // 15% — calorie intake relative to maintenance
  CONSISTENCY: 0.10,   // 10% — training frequency / consistency
};

// Monthly muscle gain potential as fraction of bodyweight, by training status
// Based on Lyle McDonald model & Schoenfeld (2017)
export const MUSCLE_GAIN_RATES = {
  beginner:     { mid: 0.0125 },   // ~1.0–1.5% / month
  intermediate: { mid: 0.00625 }, // ~0.5–0.75% / month
  advanced:     { mid: 0.00325 },  // ~0.25–0.4% / month
};

// Compound lift name patterns
const COMPOUND_REGEX = /bench|squat|deadlift|leg\s*press|overhead\s*press|ohp|military\s*press|row|pull[-\s]?up|chin[-\s]?up|dip|front\s*squat|back\s*squat|rdl|romanian|clean|snatch|push/i;

export const EVIDENCE_STUDIES = [
  { citation: 'Schoenfeld BJ et al. (2016)', title: 'Effects of Resistance Training Frequency on Measures of Muscle Hypertrophy: A Systematic Review and Meta-analysis.' },
  { citation: 'Schoenfeld BJ et al. (2019)', title: 'How many times per week should a muscle be trained to maximize muscle hypertrophy?' },
  { citation: 'Morton RW et al. (2018)', title: 'A systematic review, meta-analysis and meta-regression of the effect of protein supplementation on resistance training-induced gains in muscle mass and strength.' },
  { citation: 'Slater GJ & Phillips SM (2019)', title: 'Is an Energy Surplus Required to Maximize Skeletal Muscle Hypertrophy?' },
  { citation: 'Helms ER et al. (2023)', title: 'Research on energy surplus, body composition and resistance training.' },
];

// Epley formula: estimated 1RM = weight × (1 + reps/30)
export function est1RM(kg, reps) {
  if (!kg || kg <= 0) return null;
  return kg * (1 + (reps || 1) / 30);
}

export function isCompoundLift(name) {
  return COMPOUND_REGEX.test(name || '');
}

// Determine training status from total sessions logged & 1RM-to-bodyweight ratio
export function determineTrainingStatus(totalSessions, avg1RMRatio) {
  if (totalSessions < 78 || (avg1RMRatio != null && avg1RMRatio < 1.0)) return 'beginner';
  if (totalSessions < 312 || (avg1RMRatio != null && avg1RMRatio < 1.5)) return 'intermediate';
  return 'advanced';
}

// ── Main calculation — all four weighted factors ──
export function calculateMuscleMass(params) {
  const {
    startingWeight, currentWeight, weightChange,
    weeksTrained, exercises,
    sessionsPerWeek, targetSessionsPerWeek,
    trainingStatus,
  } = params;

  const bodyWeight = currentWeight || startingWeight || 70;
  const monthlyRate = MUSCLE_GAIN_RATES[trainingStatus] || MUSCLE_GAIN_RATES.intermediate;
  const weeks = Math.max(1, weeksTrained || 1);
  const expectedMonthlyMuscle = monthlyRate.mid * bodyWeight;
  const expectedPerWeek = expectedMonthlyMuscle / 4.33;

  // ── Factor 1: Body Weight Change (40%) ──
  let weightFactor;
  if (weightChange != null && weightChange > 0.1) {
    // Gained weight — partition between muscle and fat
    // If strength also increased, higher fraction is muscle; otherwise mostly fat
    const hasStrengthGain = exercises.some(e => (e.percentIncrease || 0) > 0.05);
    const muscleFraction = hasStrengthGain ? 0.5 : 0.25;
    weightFactor = weightChange * muscleFraction;
  } else if (weightChange != null && weightChange < -0.1) {
    // Lost weight — recomp potential (muscle gain despite weight loss)
    weightFactor = expectedPerWeek * weeks * 0.3;
  } else {
    // Stable weight — recomp / maintenance
    weightFactor = expectedPerWeek * weeks * 0.4;
  }

  // ── Factor 2: Strength Progression (35%) ──
  // Prefer compound lifts; fall back to all tracked exercises
  const compounds = exercises.filter(e => e.isCompound);
  const relevant = compounds.length > 0 ? compounds : exercises;
  const avgPercentIncrease = relevant.length > 0
    ? relevant.reduce((sum, e) => sum + (e.percentIncrease || 0), 0) / relevant.length
    : 0;
  // 25% avg 1RM increase = max strength score
  const strengthScore = Math.min(1, avgPercentIncrease / 0.25);
  const strengthFactor = expectedPerWeek * weeks * strengthScore;

  // ── Factor 3: Calorie Intake (15%) ──
  // Inferred from weight change direction & magnitude
  let calorieBalance;
  let calorieMultiplier;
  if (weightChange != null && weightChange > 0.2) {
    calorieBalance = 'surplus';
    calorieMultiplier = 0.85;
  } else if (weightChange != null && weightChange < -0.2) {
    calorieBalance = 'deficit';
    // In a deficit, muscle gain is limited unless exceptional strength progression
    calorieMultiplier = avgPercentIncrease > 0.15 ? 0.35 : 0.1;
  } else {
    calorieBalance = 'maintenance';
    calorieMultiplier = 0.5;
  }
  const calorieFactor = expectedPerWeek * weeks * calorieMultiplier;

  // ── Factor 4: Training Consistency (10%) ──
  const consistencyScore = Math.min(1, (sessionsPerWeek || 0) / (targetSessionsPerWeek || 4));
  const consistencyFactor = expectedPerWeek * weeks * consistencyScore;

  // ── Weighted combination ──
  const muscleGainKg =
    WEIGHTS.BODY_WEIGHT  * weightFactor +
    WEIGHTS.STRENGTH     * strengthFactor +
    WEIGHTS.CALORIES     * calorieFactor +
    WEIGHTS.CONSISTENCY  * consistencyFactor;

  // ── Confidence range ──
  // Wider range when less consistent or less data available
  const baseUncertainty = 0.25;
  const consistencyPenalty = (1 - consistencyScore) * 0.2;
  const dataPenalty = exercises.length < 3 ? 0.1 : 0;
  const uncertainty = baseUncertainty + consistencyPenalty + dataPenalty;
  const confidenceLowKg  = Math.max(0, muscleGainKg * (1 - uncertainty));
  const confidenceHighKg = muscleGainKg * (1 + uncertainty);

  // ── Fat gain = total weight change − muscle gain ──
  const fatGainKg = (weightChange || 0) - muscleGainKg;

  return {
    muscleGainG:      Math.round(Math.max(0, muscleGainKg) * 1000),
    confidenceLowG:   Math.round(Math.max(0, confidenceLowKg) * 1000),
    confidenceHighG:  Math.round(confidenceHighKg * 1000),
    fatGainG:         Math.round(fatGainKg * 1000),
    trainingStatus,
    calorieBalance,
    avgStrengthIncrease: avgPercentIncrease,
    consistencyScore,
    sessionsPerWeek,
    targetSessionsPerWeek,
    weeksTrained: weeks,
  };
}

// ── Evidence-informed summary (not a direct measurement) ──
export function generateSummary(result) {
  const {
    muscleGainG, fatGainG, trainingStatus, calorieBalance,
    avgStrengthIncrease, consistencyScore, sessionsPerWeek, targetSessionsPerWeek,
  } = result;

  const statusLabel = trainingStatus.charAt(0).toUpperCase() + trainingStatus.slice(1);
  const strengthPct = Math.round(avgStrengthIncrease * 100);
  const consistencyPct = Math.round(consistencyScore * 100);
  const sessPerWeek = sessionsPerWeek ? sessionsPerWeek.toFixed(1) : '0';

  let summary = `This is an evidence-informed estimate, not a direct measurement. It weighs four factors: your body weight trend, ~${strengthPct}% strength progression on compound lifts, an inferred ${calorieBalance} calorie balance, and ${consistencyPct}% training consistency (${sessPerWeek}/${targetSessionsPerWeek || 0} sessions per week). `;
  summary += `As a ${statusLabel} lifter, you've gained approximately ${muscleGainG}g of muscle. `;

  if (fatGainG > 0) {
    summary += `An estimated ${fatGainG}g of fat was gained alongside it.`;
  } else if (fatGainG < 0) {
    summary += `An estimated ${Math.abs(fatGainG)}g of fat was likely lost — suggesting body recomposition.`;
  } else {
    summary += `Minimal fat change was detected.`;
  }

  return summary;
}
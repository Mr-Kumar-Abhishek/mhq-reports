/**
 * @fileoverview Deterministic asymmetric MHQ scoring engine mapping 1-9 ratings onto the
 * standardized [-100, +200] Mental Health Quotient spectrum anchored at 0 (rating = 4).
 * @license MIT
 */

import {
  MHQ_DIMENSIONS,
  MHQ_QUESTIONS,
  MHQ_TIERS,
  DIMENSION_RECOMMENDATIONS
} from './mhq-data.js';

/**
 * Clamp a numeric value within [min, max].
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/**
 * Maps a raw 1..9 item rating to the asymmetric [-100, +200] MHQ spectrum.
 * - Ratings < 4 map linearly from [1, 4) -> [-100, 0): ((r - 4) / 3) * 100
 * - Ratings >= 4 map linearly from [4, 9] -> [0, +200]: ((r - 4) / 5) * 200
 *
 * @param {number} rating - Numeric rating in [1, 9].
 * @returns {number} Unrounded MHQ item score in [-100, +200].
 */
export function scoreItemToMHQ(rating) {
  const r = Number(rating);
  if (!Number.isFinite(r) || r < 1 || r > 9) {
    throw new RangeError(`Invalid MHQ item rating "${rating}". Expected a number between 1 and 9.`);
  }
  if (r < 4) {
    return ((r - 4) / 3) * 100;
  }
  return ((r - 4) / 5) * 200;
}

/**
 * Resolves the MHQ spectrum tier object for a given score in [-100, +200].
 *
 * @param {number} score
 * @returns {object} Matching tier definition from MHQ_TIERS.
 */
export function getTierForScore(score) {
  const clamped = clamp(Math.round(Number(score)), -100, 200);
  for (const tier of MHQ_TIERS) {
    const withinMax = tier.inclusiveMax ? clamped <= tier.max : clamped < tier.max;
    if (clamped >= tier.min && withinMax) {
      return tier;
    }
  }
  return MHQ_TIERS[MHQ_TIERS.length - 1];
}

/**
 * Returns the tailored evidence-informed recommendation for a dimension based on its MHQ score.
 *
 * @param {string} dimensionId
 * @param {number} score
 * @returns {string}
 */
function getRecommendationForDimension(dimensionId, score) {
  const recSet = DIMENSION_RECOMMENDATIONS[dimensionId];
  if (!recSet) {
    return '';
  }
  if (score < 0) {
    return recSet.negative;
  }
  if (score < 100) {
    return recSet.moderate;
  }
  return recSet.high;
}

/**
 * Generates a concise clinical-style executive narrative based on overall tier, strengths, and priorities.
 *
 * @param {object} params
 * @returns {string}
 */
function buildExecutiveSummary({ overallScore, overallTier, topStrengths, topPriorities, delta }) {
  const strengthNames = topStrengths.map((d) => d.title).join(' and ');
  const priorityNames = topPriorities.map((d) => d.title).join(' and ');
  const scoreFormatted = overallScore >= 0 ? `+${overallScore}` : `${overallScore}`;

  let trendNote = '';
  if (delta) {
    const sign = delta.overallDelta > 0 ? '+' : '';
    trendNote = ` Compared with your prior baseline (${delta.previousDate}), your composite MHQ shifted by ${sign}${delta.overallDelta} points.`;
  }

  return `Composite Mental Health Quotient (MHQ) is ${scoreFormatted}, placing overall wellbeing in the "${overallTier.label}" spectrum band (${overallTier.min} to ${overallTier.max}). ${overallTier.summary} Primary protective strengths appear in ${strengthNames}, while highest-leverage opportunities for strengthening wellbeing center on ${priorityNames}.${trendNote}`;
}

/**
 * Generates a short collision-resistant report identifier safe for offline execution.
 *
 * @param {string} dateStr
 * @returns {string}
 */
function generateReportId(dateStr) {
  const compactDate = (dateStr || new Date().toISOString().slice(0, 10)).replace(/-/g, '');
  const randomSuffix = Math.random().toString(36).slice(2, 8);
  return `mhq-${compactDate}-${randomSuffix}`;
}

/**
 * Computes a complete deterministic MHQ report from participant responses and metadata.
 *
 * @param {Record<string, number>} responses - Map of question ID -> rating (1..9).
 * @param {object} [metadata={}] - Participant alias, age group, assessment date, notes, profilePreset.
 * @param {object|null} [previousReport=null] - Optional previous report record for longitudinal delta.
 * @returns {object} Complete MHQReportRecord ready for rendering and IndexedDB persistence.
 */
export function calculateMHQReport(responses, metadata = {}, previousReport = null) {
  if (!responses || typeof responses !== 'object') {
    throw new TypeError('responses must be a non-null object mapping question IDs to ratings.');
  }

  const normalizedResponses = {};
  for (const q of MHQ_QUESTIONS) {
    const raw = responses[q.id];
    const num = Number(raw);
    if (!Number.isFinite(num) || num < 1 || num > 9) {
      throw new Error(`Missing or invalid rating for question "${q.id}": ${raw}`);
    }
    normalizedResponses[q.id] = num;
  }

  const dimensionResults = MHQ_DIMENSIONS.map((dim) => {
    const dimQuestions = MHQ_QUESTIONS.filter((q) => q.dimensionId === dim.id);
    const itemScores = dimQuestions.map((q) => scoreItemToMHQ(normalizedResponses[q.id]));
    const meanScore = itemScores.reduce((acc, val) => acc + val, 0) / itemScores.length;
    const roundedScore = clamp(Math.round(meanScore), -100, 200);
    const tier = getTierForScore(roundedScore);
    const normalizedPercent = clamp(Math.round(((roundedScore + 100) / 300) * 100), 0, 100);

    return {
      id: dim.id,
      title: dim.title,
      shortTitle: dim.shortTitle,
      color: dim.color,
      description: dim.description,
      clinicalFocus: dim.clinicalFocus,
      score: roundedScore,
      tier: {
        id: tier.id,
        label: tier.label,
        min: tier.min,
        max: tier.max,
        color: tier.color,
        bgColor: tier.bgColor,
        borderColor: tier.borderColor
      },
      normalizedPercent,
      recommendation: getRecommendationForDimension(dim.id, roundedScore)
    };
  });

  const overallMean =
    dimensionResults.reduce((acc, dim) => acc + dim.score, 0) / dimensionResults.length;
  const overallScore = clamp(Math.round(overallMean), -100, 200);
  const overallTierObj = getTierForScore(overallScore);

  const sortedHighToLow = [...dimensionResults].sort((a, b) => b.score - a.score);
  const sortedLowToHigh = [...dimensionResults].sort((a, b) => a.score - b.score);

  const topStrengths = sortedHighToLow.slice(0, 2);
  const topPriorities = sortedLowToHigh.slice(0, 2);

  let deltaFromPrevious = null;
  if (previousReport && typeof previousReport.overallScore === 'number') {
    const dimensionDeltas = {};
    for (const dim of dimensionResults) {
      const prevDim = Array.isArray(previousReport.dimensions)
        ? previousReport.dimensions.find((d) => d.id === dim.id)
        : null;
      if (prevDim && typeof prevDim.score === 'number') {
        dimensionDeltas[dim.id] = dim.score - prevDim.score;
      }
    }
    deltaFromPrevious = {
      previousReportId: previousReport.id,
      previousDate:
        previousReport.metadata?.assessmentDate ||
        (previousReport.createdAt ? previousReport.createdAt.slice(0, 10) : 'Prior'),
      overallDelta: overallScore - previousReport.overallScore,
      dimensionDeltas
    };
  }

  const todayISO = new Date().toISOString().slice(0, 10);
  const cleanMetadata = {
    participantAlias: (metadata.participantAlias || '').trim() || 'Anonymous Participant',
    ageGroup: metadata.ageGroup || 'Prefer not to say',
    assessmentDate: metadata.assessmentDate || todayISO,
    notes: (metadata.notes || '').trim(),
    profilePreset: metadata.profilePreset || null
  };

  const executiveSummary = buildExecutiveSummary({
    overallScore,
    overallTier: overallTierObj,
    topStrengths,
    topPriorities,
    delta: deltaFromPrevious
  });

  const needsSupportAlert = dimensionResults.some((d) => d.score < 0) || overallScore < 0;

  return {
    id: metadata.id || generateReportId(cleanMetadata.assessmentDate),
    schemaVersion: 1,
    createdAt: metadata.createdAt || new Date().toISOString(),
    metadata: cleanMetadata,
    responses: normalizedResponses,
    overallScore,
    overallTier: {
      id: overallTierObj.id,
      label: overallTierObj.label,
      min: overallTierObj.min,
      max: overallTierObj.max,
      color: overallTierObj.color,
      bgColor: overallTierObj.bgColor,
      borderColor: overallTierObj.borderColor,
      summary: overallTierObj.summary
    },
    dimensions: dimensionResults,
    strengths: topStrengths.map((d) => d.id),
    priorityAreas: topPriorities.map((d) => d.id),
    executiveSummary,
    needsSupportAlert,
    deltaFromPrevious
  };
}

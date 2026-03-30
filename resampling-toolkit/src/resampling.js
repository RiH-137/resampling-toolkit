const {
  assertNumericArray,
  mean,
  median,
  quantile,
  standardDeviation,
  variance
} = require('./stats');

const SUPPORTED_STATISTICS = ['mean', 'median', 'variance', 'std'];
const Z_SCORES = {
  0.9: 1.645,
  0.95: 1.96,
  0.99: 2.576
};

function assertConfidenceLevel(confidenceLevel) {
  if (!(confidenceLevel > 0 && confidenceLevel < 1)) {
    throw new Error('confidenceLevel must be between 0 and 1.');
  }
}

function assertIterations(iterations) {
  if (!Number.isInteger(iterations) || iterations < 100) {
    throw new Error('iterations must be an integer >= 100.');
  }
}

function validateResamplingInput({ data, statistic = 'mean', confidenceLevel = 0.95, iterations, requireIterations = false }) {
  assertNumericArray(data);
  assertConfidenceLevel(confidenceLevel);

  if (requireIterations) {
    assertIterations(iterations);
  }

  if (!SUPPORTED_STATISTICS.includes(statistic)) {
    throw new Error(`Unsupported statistic. Use one of: ${SUPPORTED_STATISTICS.join(', ')}.`);
  }

  return {
    isValid: true,
    sampleSize: data.length,
    statistic,
    confidenceLevel,
    iterations: requireIterations ? iterations : undefined
  };
}

function zScoreForConfidenceLevel(confidenceLevel) {
  const rounded = Number(confidenceLevel.toFixed(2));
  return Z_SCORES[rounded] || 1.96;
}

function statisticFn(statistic) {
  const map = {
    mean,
    median,
    variance,
    std: standardDeviation
  };

  const fn = map[statistic];
  if (!fn) {
    throw new Error(`Unsupported statistic. Use one of: ${SUPPORTED_STATISTICS.join(', ')}.`);
  }

  return fn;
}

function randomSampleWithReplacement(data) {
  const sample = new Array(data.length);

  for (let i = 0; i < data.length; i += 1) {
    const idx = Math.floor(Math.random() * data.length);
    sample[i] = data[idx];
  }

  return sample;
}

function computeBootstrapDistribution(data, statisticFnRef, iterations) {
  const distribution = new Array(iterations);

  for (let i = 0; i < iterations; i += 1) {
    const sample = randomSampleWithReplacement(data);
    distribution[i] = statisticFnRef(sample);
  }

  return distribution;
}

function computePercentileConfidenceInterval(distribution, confidenceLevel) {
  const sorted = [...distribution].sort((a, b) => a - b);
  const alpha = 1 - confidenceLevel;
  const lower = quantile(sorted, alpha / 2);
  const upper = quantile(sorted, 1 - alpha / 2);

  return {
    lower,
    upper,
    alpha
  };
}

function computeLeaveOneOutEstimates(data, statisticFnRef) {
  const n = data.length;
  const leaveOneOutEstimates = new Array(n);

  for (let i = 0; i < n; i += 1) {
    const subset = data.slice(0, i).concat(data.slice(i + 1));
    leaveOneOutEstimates[i] = statisticFnRef(subset);
  }

  return leaveOneOutEstimates;
}

function estimateBiasVariance(leaveOneOutEstimates, originalEstimate) {
  const n = leaveOneOutEstimates.length;
  const jkMean = mean(leaveOneOutEstimates);
  const squaredDiffSum = leaveOneOutEstimates.reduce((sum, value) => sum + (value - jkMean) ** 2, 0);
  const standardError = Math.sqrt(((n - 1) / n) * squaredDiffSum);
  const varianceEstimate = standardError ** 2;
  const bias = (n - 1) * (jkMean - originalEstimate);
  const biasCorrectedEstimate = originalEstimate - bias;

  return {
    jackknifeMean: jkMean,
    bias,
    biasCorrectedEstimate,
    standardError,
    varianceEstimate
  };
}

function computeStabilityAssessment({ estimate, standardError, confidenceInterval }) {
  const ciWidth = confidenceInterval.upper - confidenceInterval.lower;
  const denominator = Math.abs(estimate) < 1e-12 ? 1 : Math.abs(estimate);
  const relativeError = Math.abs(standardError) / denominator;
  const relativeCiWidth = Math.abs(ciWidth) / denominator;
  const rawScore = 100 - Math.min(90, relativeError * 100 + relativeCiWidth * 20);
  const score = Number(Math.max(10, Math.min(100, rawScore)).toFixed(2));

  let level = 'stable';
  if (score < 50) {
    level = 'low-stability';
  } else if (score < 75) {
    level = 'moderate-stability';
  }

  return {
    score,
    level,
    relativeError: Number(relativeError.toFixed(6)),
    relativeCiWidth: Number(relativeCiWidth.toFixed(6))
  };
}

function buildPerformance({ method, sampleSize, iterations, elapsedMs }) {
  return {
    method,
    sampleSize,
    iterations,
    elapsedMs,
    algorithm:
      method === 'bootstrap'
        ? 'Sampling with replacement (O(iterations * n))'
        : 'Leave-one-out jackknife (O(n^2) for naive subsets)'
  };
}

function bootstrap({ data, statistic = 'mean', iterations = 1000, confidenceLevel = 0.95 }) {
  const startedAt = Date.now();
  const validation = validateResamplingInput({
    data,
    statistic,
    confidenceLevel,
    iterations,
    requireIterations: true
  });

  const stat = statisticFn(statistic);
  const originalEstimate = stat(data);
  const distribution = computeBootstrapDistribution(data, stat, iterations);
  const bootstrapStdError = standardDeviation(distribution);
  const confidenceInterval = computePercentileConfidenceInterval(distribution, confidenceLevel);
  const stability = computeStabilityAssessment({
    estimate: originalEstimate,
    standardError: bootstrapStdError,
    confidenceInterval
  });

  const elapsedMs = Date.now() - startedAt;

  return {
    method: 'bootstrap',
    statistic,
    sampleSize: data.length,
    iterations,
    confidenceLevel,
    originalEstimate,
    bootstrapMean: mean(distribution),
    bootstrapStdError,
    confidenceInterval: {
      lower: confidenceInterval.lower,
      upper: confidenceInterval.upper
    },
    distribution,
    validation,
    stability,
    performance: buildPerformance({
      method: 'bootstrap',
      sampleSize: data.length,
      iterations,
      elapsedMs
    }),
    features: {
      samplingWithReplacement: true,
      configurableIterations: true,
      confidenceIntervals: true,
      distributionIncluded: true
    }
  };
}

function jackknife({ data, statistic = 'mean', confidenceLevel = 0.95 }) {
  const startedAt = Date.now();
  const validation = validateResamplingInput({
    data,
    statistic,
    confidenceLevel,
    requireIterations: false
  });

  const stat = statisticFn(statistic);
  const originalEstimate = stat(data);
  const leaveOneOutEstimates = computeLeaveOneOutEstimates(data, stat);
  const {
    jackknifeMean,
    bias,
    biasCorrectedEstimate,
    standardError,
    varianceEstimate
  } = estimateBiasVariance(leaveOneOutEstimates, originalEstimate);

  const z = zScoreForConfidenceLevel(confidenceLevel);
  const confidenceInterval = {
    lower: biasCorrectedEstimate - z * standardError,
    upper: biasCorrectedEstimate + z * standardError
  };

  const stability = computeStabilityAssessment({
    estimate: originalEstimate,
    standardError,
    confidenceInterval
  });

  const elapsedMs = Date.now() - startedAt;

  return {
    method: 'jackknife',
    statistic,
    sampleSize: data.length,
    confidenceLevel,
    originalEstimate,
    leaveOneOutEstimates,
    leaveOneOutCount: leaveOneOutEstimates.length,
    jackknifeMean,
    bias,
    biasCorrectedEstimate,
    varianceEstimate,
    standardError,
    confidenceInterval,
    validation,
    stability,
    performance: buildPerformance({
      method: 'jackknife',
      sampleSize: data.length,
      iterations: data.length,
      elapsedMs
    }),
    features: {
      leaveOneOutEstimation: true,
      biasVarianceEstimation: true,
      confidenceIntervals: true
    }
  };
}

module.exports = {
  SUPPORTED_STATISTICS,
  validateResamplingInput,
  statisticFn,
  randomSampleWithReplacement,
  computeBootstrapDistribution,
  computePercentileConfidenceInterval,
  computeLeaveOneOutEstimates,
  estimateBiasVariance,
  computeStabilityAssessment,
  buildPerformance,
  bootstrap,
  jackknife
};

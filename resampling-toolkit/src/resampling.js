const {
  assertNumericArray,
  mean,
  median,
  quantile,
  standardDeviation,
  variance
} = require('./stats');

function statisticFn(statistic) {
  const map = {
    mean,
    median,
    variance,
    std: standardDeviation
  };

  const fn = map[statistic];
  if (!fn) {
    throw new Error("Unsupported statistic. Use one of: 'mean', 'median', 'variance', 'std'.");
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

function bootstrap({ data, statistic = 'mean', iterations = 1000, confidenceLevel = 0.95 }) {
  assertNumericArray(data);

  if (!Number.isInteger(iterations) || iterations < 100) {
    throw new Error('iterations must be an integer >= 100.');
  }

  if (!(confidenceLevel > 0 && confidenceLevel < 1)) {
    throw new Error('confidenceLevel must be between 0 and 1.');
  }

  const stat = statisticFn(statistic);
  const originalEstimate = stat(data);
  const distribution = new Array(iterations);

  for (let i = 0; i < iterations; i += 1) {
    const sample = randomSampleWithReplacement(data);
    distribution[i] = stat(sample);
  }

  const sorted = [...distribution].sort((a, b) => a - b);
  const alpha = 1 - confidenceLevel;
  const lower = quantile(sorted, alpha / 2);
  const upper = quantile(sorted, 1 - alpha / 2);

  return {
    method: 'bootstrap',
    statistic,
    sampleSize: data.length,
    iterations,
    confidenceLevel,
    originalEstimate,
    bootstrapMean: mean(distribution),
    bootstrapStdError: standardDeviation(distribution),
    confidenceInterval: { lower, upper },
    distribution
  };
}

function jackknife({ data, statistic = 'mean', confidenceLevel = 0.95 }) {
  assertNumericArray(data);

  if (!(confidenceLevel > 0 && confidenceLevel < 1)) {
    throw new Error('confidenceLevel must be between 0 and 1.');
  }

  const stat = statisticFn(statistic);
  const n = data.length;
  const originalEstimate = stat(data);
  const leaveOneOutEstimates = new Array(n);

  for (let i = 0; i < n; i += 1) {
    const subset = data.slice(0, i).concat(data.slice(i + 1));
    leaveOneOutEstimates[i] = stat(subset);
  }

  const jkMean = mean(leaveOneOutEstimates);
  const squaredDiffSum = leaveOneOutEstimates.reduce((sum, value) => sum + (value - jkMean) ** 2, 0);
  const stdError = Math.sqrt(((n - 1) / n) * squaredDiffSum);
  const bias = (n - 1) * (jkMean - originalEstimate);
  const biasCorrectedEstimate = originalEstimate - bias;

  const z = confidenceLevel === 0.99 ? 2.576 : confidenceLevel === 0.9 ? 1.645 : 1.96;
  const confidenceInterval = {
    lower: biasCorrectedEstimate - z * stdError,
    upper: biasCorrectedEstimate + z * stdError
  };

  return {
    method: 'jackknife',
    statistic,
    sampleSize: n,
    confidenceLevel,
    originalEstimate,
    leaveOneOutEstimates,
    jackknifeMean: jkMean,
    bias,
    biasCorrectedEstimate,
    standardError: stdError,
    confidenceInterval
  };
}

module.exports = {
  bootstrap,
  jackknife
};

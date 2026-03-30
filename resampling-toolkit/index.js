const {
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
} = require('./src/resampling');

const {
  assertNumericArray,
  mean,
  median,
  variance,
  standardDeviation,
  quantile
} = require('./src/stats');

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
  assertNumericArray,
  mean,
  median,
  variance,
  standardDeviation,
  quantile,
  bootstrap,
  jackknife
};

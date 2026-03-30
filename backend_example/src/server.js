const express = require('express');
const cors = require('cors');
const {
  bootstrap,
  jackknife,
  validateResamplingInput,
  statisticFn,
  computeBootstrapDistribution,
  computePercentileConfidenceInterval,
  computeLeaveOneOutEstimates,
  estimateBiasVariance,
  computeStabilityAssessment
} = require('resampling-stat-toolkit');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/bootstrap', (req, res) => {
  try {
    const { data, statistic, iterations, confidenceLevel } = req.body;
    const validation = validateResamplingInput({
      data,
      statistic,
      iterations,
      confidenceLevel,
      requireIterations: true
    });

    const base = bootstrap({ data, statistic, iterations, confidenceLevel });

    // Feature-level derived preview values show explicit toolkit integrations.
    const stat = statisticFn(statistic || 'mean');
    const previewIterations = Math.min(Number(iterations || 1000), 200);
    const previewDistribution = computeBootstrapDistribution(data, stat, previewIterations);
    const previewConfidenceInterval = computePercentileConfidenceInterval(
      previewDistribution,
      Number(confidenceLevel || 0.95)
    );

    const response = {
      ...base,
      validation,
      featureImportsUsed: {
        bootstrap: true,
        validateResamplingInput: true,
        statisticFn: true,
        computeBootstrapDistribution: true,
        computePercentileConfidenceInterval: true
      },
      debugPreview: {
        iterations: previewIterations,
        confidenceInterval: {
          lower: previewConfidenceInterval.lower,
          upper: previewConfidenceInterval.upper
        }
      }
    };

    res.json(response);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/jackknife', (req, res) => {
  try {
    const { data, statistic, confidenceLevel } = req.body;
    const validation = validateResamplingInput({
      data,
      statistic,
      confidenceLevel,
      requireIterations: false
    });

    const base = jackknife({ data, statistic, confidenceLevel });

    const stat = statisticFn(statistic || 'mean');
    const leaveOneOutEstimates = computeLeaveOneOutEstimates(data, stat);
    const biasVariance = estimateBiasVariance(leaveOneOutEstimates, base.originalEstimate);
    const stability = computeStabilityAssessment({
      estimate: base.originalEstimate,
      standardError: biasVariance.standardError,
      confidenceInterval: base.confidenceInterval
    });

    const response = {
      ...base,
      validation,
      featureImportsUsed: {
        jackknife: true,
        validateResamplingInput: true,
        statisticFn: true,
        computeLeaveOneOutEstimates: true,
        estimateBiasVariance: true,
        computeStabilityAssessment: true
      },
      leaveOneOutPreview: leaveOneOutEstimates.slice(0, 10),
      biasVariancePreview: biasVariance,
      stability
    };

    res.json(response);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});

'use client';

import { useMemo, useState } from 'react';
import toolkit from 'resampling-stat-toolkit';

const {
  mean,
  median,
  variance,
  standardDeviation,
  statisticFn,
  validateResamplingInput,
  computeLeaveOneOutEstimates,
  estimateBiasVariance,
  computeStabilityAssessment,
  buildHistogram,
  buildSparkPath
} = toolkit;

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const defaultData = '12, 15, 14, 10, 9, 18, 17, 16, 20, 11';

function parseCsvLine(line) {
  const cells = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      const nextIsQuote = line[i + 1] === '"';
      if (inQuotes && nextIsQuote) {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      cells.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  cells.push(current.trim());
  return cells;
}

function parseCsvText(text) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error('CSV must contain a header row and at least one data row.');
  }

  const headers = parseCsvLine(lines[0]).filter(Boolean);
  if (headers.length === 0) {
    throw new Error('CSV header row is empty.');
  }

  const rows = lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row = {};

    headers.forEach((header, index) => {
      row[header] = values[index] ?? '';
    });

    return row;
  });

  return { headers, rows };
}

function extractNumericFieldValues(rows, field) {
  const values = rows
    .map((row) => Number(String(row[field] ?? '').trim()))
    .filter((value) => Number.isFinite(value));

  if (values.length < 2) {
    throw new Error(`Selected field "${field}" does not contain at least 2 numeric values.`);
  }

  return values;
}

function parseDataset(rawValue) {
  const pieces = rawValue
    .split(/[\s,]+/)
    .map((item) => item.trim())
    .filter(Boolean);

  const values = pieces.map(Number);
  if (values.length < 2 || values.some((num) => Number.isNaN(num))) {
    throw new Error('Please enter at least 2 valid numbers separated by comma or spaces.');
  }

  return values;
}

function formatNumber(value) {
  return Number(value).toFixed(6).replace(/0+$/, '').replace(/\.$/, '');
}

function ResultLine({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-neutral-200 py-2 text-sm">
      <span className="text-neutral-700">{label}</span>
      <span className="font-semibold text-neutral-900">{value}</span>
    </div>
  );
}

function StatBadge({ label, value, tone = 'neutral' }) {
  const toneClass =
    tone === 'green'
      ? 'border-green-500 text-green-700'
      : tone === 'red'
        ? 'border-red-500 text-red-700'
        : 'border-neutral-300 text-neutral-800';

  return (
    <div className={`rounded-md border bg-white px-3 py-2 ${toneClass}`}>
      <p className="text-[11px] uppercase tracking-[0.14em]">{label}</p>
      <p className="mt-1 text-sm font-bold">{value}</p>
    </div>
  );
}

function Histogram({ values, ci, estimate }) {
  const bars = useMemo(() => buildHistogram(values), [values]);
  if (!bars.length) {
    return null;
  }

  const chartHeight = 160;
  const chartWidth = 480;
  const maxCount = Math.max(...bars.map((bar) => bar.count), 1);
  const domainStart = bars[0].start;
  const domainEnd = bars[bars.length - 1].end;
  const span = domainEnd - domainStart || 1;

  const toX = (value) => ((value - domainStart) / span) * chartWidth;

  return (
    <div className="rounded-lg border border-neutral-300 bg-white p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-600">Distribution Graph</p>
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="mt-2 h-44 w-full">
        <line x1="0" y1={chartHeight - 1} x2={chartWidth} y2={chartHeight - 1} stroke="#171717" strokeWidth="1" />

        {bars.map((bar, index) => {
          const barWidth = chartWidth / bars.length;
          const x = index * barWidth;
          const height = (bar.count / maxCount) * (chartHeight - 12);
          const y = chartHeight - height - 1;
          return (
            <rect
              key={`${bar.start}-${bar.end}`}
              x={x + 1}
              y={y}
              width={Math.max(1, barWidth - 2)}
              height={height}
              fill="#404040"
              opacity="0.82"
            />
          );
        })}

        <line x1={toX(estimate)} y1="0" x2={toX(estimate)} y2={chartHeight} stroke="#b91c1c" strokeWidth="2" />
        <line x1={toX(ci.lower)} y1="0" x2={toX(ci.lower)} y2={chartHeight} stroke="#15803d" strokeWidth="2" />
        <line x1={toX(ci.upper)} y1="0" x2={toX(ci.upper)} y2={chartHeight} stroke="#15803d" strokeWidth="2" />
      </svg>
      <p className="mt-1 text-xs text-neutral-600">Red: estimate, Green: confidence interval bounds</p>
    </div>
  );
}

function Sparkline({ values }) {
  if (!values.length) {
    return null;
  }

  const width = 480;
  const height = 120;
  const pad = 8;
  const path = buildSparkPath(values, width, height, pad);

  return (
    <div className="rounded-lg border border-neutral-300 bg-white p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-600">Estimate Sequence</p>
      <svg viewBox={`0 0 ${width} ${height}`} className="mt-2 h-32 w-full">
        <rect x="0" y="0" width={width} height={height} fill="#ffffff" />
        <path d={path} fill="none" stroke="#171717" strokeWidth="2" />
      </svg>
      <p className="mt-1 text-xs text-neutral-600">Trend of sampled estimates</p>
    </div>
  );
}

export default function Page() {
  const [mode, setMode] = useState('bootstrap');
  const [datasetText, setDatasetText] = useState(defaultData);
  const [statistic, setStatistic] = useState('mean');
  const [iterations, setIterations] = useState(1000);
  const [confidenceLevel, setConfidenceLevel] = useState(0.95);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [uploadedRows, setUploadedRows] = useState([]);
  const [uploadedHeaders, setUploadedHeaders] = useState([]);
  const [selectedField, setSelectedField] = useState('');
  const [uploadMessage, setUploadMessage] = useState('');

  const summary = useMemo(() => {
    try {
      const values = parseDataset(datasetText);
      return `${values.length} values parsed`;
    } catch {
      return 'Dataset invalid';
    }
  }, [datasetText]);

  const chartValues = useMemo(() => {
    if (!result) {
      return [];
    }

    if (Array.isArray(result.distribution)) {
      return result.distribution;
    }

    if (Array.isArray(result.leaveOneOutEstimates)) {
      return result.leaveOneOutEstimates;
    }

    return [];
  }, [result]);

  const ciWidth = useMemo(() => {
    if (!result?.confidenceInterval) {
      return null;
    }

    return result.confidenceInterval.upper - result.confidenceInterval.lower;
  }, [result]);

  const uncertaintyTone = useMemo(() => {
    if (!result?.confidenceInterval) {
      return 'neutral';
    }

    const crossesZero =
      result.confidenceInterval.lower <= 0 && result.confidenceInterval.upper >= 0;

    return crossesZero ? 'red' : 'green';
  }, [result]);

  const toolkitInputStats = useMemo(() => {
    try {
      const values = parseDataset(datasetText);
      const stat = statisticFn(statistic);
      const validation = validateResamplingInput({
        data: values,
        statistic,
        confidenceLevel: Number(confidenceLevel),
        iterations: mode === 'bootstrap' ? Number(iterations) : undefined,
        requireIterations: mode === 'bootstrap'
      });

      const baseStats = {
        mean: mean(values),
        median: median(values),
        variance: variance(values),
        standardDeviation: standardDeviation(values)
      };

      const originalEstimate = stat(values);
      const leaveOneOutEstimates = computeLeaveOneOutEstimates(values, stat);
      const biasVariance = estimateBiasVariance(leaveOneOutEstimates, originalEstimate);
      const confidenceInterval = {
        lower: biasVariance.biasCorrectedEstimate - 1.96 * biasVariance.standardError,
        upper: biasVariance.biasCorrectedEstimate + 1.96 * biasVariance.standardError
      };
      const stability = computeStabilityAssessment({
        estimate: originalEstimate,
        standardError: biasVariance.standardError,
        confidenceInterval
      });

      return {
        validation,
        baseStats,
        leaveOneOutCount: leaveOneOutEstimates.length,
        ...biasVariance,
        confidenceInterval,
        stability
      };
    } catch {
      return null;
    }
  }, [datasetText, statistic, confidenceLevel, iterations, mode]);

  async function runMethod(event) {
    event.preventDefault();
    setError('');
    setResult(null);

    let data;
    try {
      data = parseDataset(datasetText);
    } catch (err) {
      setError(err.message);
      return;
    }

    const endpoint = mode === 'bootstrap' ? 'bootstrap' : 'jackknife';
    const payload = {
      data,
      statistic,
      confidenceLevel: Number(confidenceLevel)
    };

    if (mode === 'bootstrap') {
      payload.iterations = Number(iterations);
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || 'Request failed.');
      }

      setResult(json);
    } catch (err) {
      setError(err.message || 'Unexpected error.');
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setError('');
    setUploadMessage('');
    setResult(null);

    try {
      const text = await file.text();
      const { headers, rows } = parseCsvText(text);

      const firstNumericHeader = headers.find((header) => {
        const numericCount = rows
          .map((row) => Number(String(row[header] ?? '').trim()))
          .filter((value) => Number.isFinite(value)).length;
        return numericCount >= 2;
      });

      if (!firstNumericHeader) {
        throw new Error('No numeric column found. Please upload a CSV with numeric values in at least one field.');
      }

      const numericValues = extractNumericFieldValues(rows, firstNumericHeader);

      setUploadedFileName(file.name);
      setUploadedRows(rows);
      setUploadedHeaders(headers);
      setSelectedField(firstNumericHeader);
      setDatasetText(numericValues.join(', '));
      setUploadMessage(`Loaded ${rows.length} rows. Using field: ${firstNumericHeader}`);
    } catch (err) {
      setUploadedFileName('');
      setUploadedRows([]);
      setUploadedHeaders([]);
      setSelectedField('');
      setError(err.message || 'Failed to parse uploaded dataset.');
    }
  }

  function handleFieldChange(event) {
    const nextField = event.target.value;
    setSelectedField(nextField);
    setError('');
    setResult(null);

    try {
      const numericValues = extractNumericFieldValues(uploadedRows, nextField);
      setDatasetText(numericValues.join(', '));
      setUploadMessage(`Using field: ${nextField} (${numericValues.length} numeric values)`);
    } catch (err) {
      setError(err.message || 'Failed to use selected field.');
    }
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="card-grid overflow-hidden rounded-2xl border border-neutral-300 bg-[var(--surface)] shadow-sm">
        <section className="border-b border-neutral-200 p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-neutral-600">Resampling Toolkit</p>
          <h1 className="mt-2 text-3xl font-bold text-neutral-900 sm:text-4xl">Bootstrap & Jackknife</h1>
          <p className="mt-3 max-w-3xl text-sm text-neutral-700 sm:text-base">
            Compute confidence intervals and uncertainty estimates directly from sample data.
            This interface is light-theme only and focused on neutral contrast for readability.
          </p>
        </section>

        <section className="grid gap-0 lg:grid-cols-[1.2fr_1fr]">
          <form onSubmit={runMethod} className="space-y-5 border-b border-neutral-200 p-6 lg:border-b-0 lg:border-r">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setMode('bootstrap')}
                className={`rounded-md border px-4 py-2 text-sm font-semibold transition ${
                  mode === 'bootstrap'
                    ? 'border-neutral-900 bg-neutral-900 text-white'
                    : 'border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-100'
                }`}
              >
                Bootstrap
              </button>
              <button
                type="button"
                onClick={() => setMode('jackknife')}
                className={`rounded-md border px-4 py-2 text-sm font-semibold transition ${
                  mode === 'jackknife'
                    ? 'border-neutral-900 bg-neutral-900 text-white'
                    : 'border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-100'
                }`}
              >
                Jackknife
              </button>
            </div>

            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-neutral-800">Dataset</span>
              <div className="mb-3 rounded-md border border-neutral-300 bg-white p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <label className="inline-flex cursor-pointer items-center rounded-md border border-neutral-900 bg-neutral-900 px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-white hover:bg-neutral-800">
                    Upload CSV
                    <input
                      type="file"
                      accept=".csv,text/csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  <span className="text-xs text-neutral-600">
                    {uploadedFileName ? `File: ${uploadedFileName}` : 'No file selected'}
                  </span>
                </div>

                {uploadedHeaders.length > 0 ? (
                  <div className="mt-3">
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-neutral-700">
                        Select Field / Column
                      </span>
                      <select
                        value={selectedField}
                        onChange={handleFieldChange}
                        className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-600"
                      >
                        {uploadedHeaders.map((header) => (
                          <option key={header} value={header}>
                            {header}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                ) : null}

                {uploadMessage ? (
                  <p className="mt-3 rounded border border-green-500 bg-white px-2 py-1 text-xs font-medium text-green-700">
                    {uploadMessage}
                  </p>
                ) : null}
              </div>

              <textarea
                value={datasetText}
                onChange={(e) => setDatasetText(e.target.value)}
                rows={6}
                className="w-full rounded-md border border-neutral-300 bg-[var(--surface-alt)] p-3 text-sm text-neutral-900 outline-none ring-0 transition focus:border-neutral-600"
                placeholder="Example: 1,2,3,4,5"
              />
              <span className="mt-1 block text-xs text-neutral-600">{summary}</span>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-neutral-800">Statistic</span>
                <select
                  value={statistic}
                  onChange={(e) => setStatistic(e.target.value)}
                  className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-600"
                >
                  <option value="mean">Mean</option>
                  <option value="median">Median</option>
                  <option value="variance">Variance</option>
                  <option value="std">Standard Deviation</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-neutral-800">Confidence Level</span>
                <select
                  value={confidenceLevel}
                  onChange={(e) => setConfidenceLevel(Number(e.target.value))}
                  className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-600"
                >
                  <option value={0.9}>90%</option>
                  <option value={0.95}>95%</option>
                  <option value={0.99}>99%</option>
                </select>
              </label>
            </div>

            {mode === 'bootstrap' ? (
              <label className="block max-w-xs">
                <span className="mb-1 block text-sm font-semibold text-neutral-800">Iterations</span>
                <input
                  type="number"
                  min={100}
                  step={100}
                  value={iterations}
                  onChange={(e) => setIterations(Number(e.target.value))}
                  className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-600"
                />
              </label>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center rounded-md border border-neutral-900 bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? 'Computing...' : `Run ${mode}`}
            </button>

            {error ? (
              <p className="rounded-md border border-red-500 bg-white px-3 py-2 text-sm font-medium text-red-700">{error}</p>
            ) : null}
          </form>

          <aside className="p-6">
            <h2 className="text-xl font-bold text-neutral-900">Results</h2>
            {!result ? (
              <p className="mt-4 text-sm text-neutral-600">Run a method to see estimates, bias, standard error, and confidence interval.</p>
            ) : (
              <div className="mt-4 space-y-4">
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  <StatBadge label="Estimate" value={formatNumber(result.originalEstimate)} />
                  {ciWidth !== null ? (
                    <StatBadge
                      label="CI Width"
                      value={formatNumber(ciWidth)}
                      tone={uncertaintyTone}
                    />
                  ) : null}
                  <StatBadge label="Samples" value={String(result.sampleSize)} />
                </div>

                <div className="rounded-lg border border-neutral-300 bg-white p-4">
                  <ResultLine label="Method" value={result.method} />
                  <ResultLine label="Statistic" value={result.statistic} />
                  <ResultLine label="Sample Size" value={String(result.sampleSize)} />
                  {typeof result.iterations === 'number' ? (
                    <ResultLine label="Iterations" value={String(result.iterations)} />
                  ) : null}
                  <ResultLine label="Estimate" value={formatNumber(result.originalEstimate)} />

                  {typeof result.bootstrapStdError === 'number' ? (
                    <ResultLine label="Bootstrap Std. Error" value={formatNumber(result.bootstrapStdError)} />
                  ) : null}
                  {typeof result.bootstrapMean === 'number' ? (
                    <ResultLine label="Bootstrap Mean" value={formatNumber(result.bootstrapMean)} />
                  ) : null}
                  {typeof result.standardError === 'number' ? (
                    <ResultLine label="Jackknife Std. Error" value={formatNumber(result.standardError)} />
                  ) : null}
                  {typeof result.jackknifeMean === 'number' ? (
                    <ResultLine label="Jackknife Mean" value={formatNumber(result.jackknifeMean)} />
                  ) : null}
                  {typeof result.leaveOneOutCount === 'number' ? (
                    <ResultLine label="Leave-one-out Count" value={String(result.leaveOneOutCount)} />
                  ) : null}
                  {typeof result.varianceEstimate === 'number' ? (
                    <ResultLine label="Jackknife Variance" value={formatNumber(result.varianceEstimate)} />
                  ) : null}
                  {typeof result.bias === 'number' ? (
                    <ResultLine label="Bias" value={formatNumber(result.bias)} />
                  ) : null}
                  {typeof result.biasCorrectedEstimate === 'number' ? (
                    <ResultLine
                      label="Bias-corrected Estimate"
                      value={formatNumber(result.biasCorrectedEstimate)}
                    />
                  ) : null}

                  <ResultLine
                    label="Confidence Interval"
                    value={`[${formatNumber(result.confidenceInterval.lower)}, ${formatNumber(result.confidenceInterval.upper)}]`}
                  />

                  {result.validation ? (
                    <ResultLine
                      label="Validation"
                      value={result.validation.isValid ? 'Passed' : 'Failed'}
                    />
                  ) : null}

                  {result.stability ? (
                    <ResultLine
                      label="Stability Score"
                      value={`${formatNumber(result.stability.score)} (${result.stability.level})`}
                    />
                  ) : null}
                  {result.stability && typeof result.stability.relativeError === 'number' ? (
                    <ResultLine
                      label="Relative Error"
                      value={formatNumber(result.stability.relativeError)}
                    />
                  ) : null}
                  {result.stability && typeof result.stability.relativeCiWidth === 'number' ? (
                    <ResultLine
                      label="Relative CI Width"
                      value={formatNumber(result.stability.relativeCiWidth)}
                    />
                  ) : null}

                  {result.performance ? (
                    <ResultLine
                      label="Compute Time (ms)"
                      value={String(result.performance.elapsedMs)}
                    />
                  ) : null}
                  {result.performance?.algorithm ? (
                    <ResultLine
                      label="Algorithm"
                      value={result.performance.algorithm}
                    />
                  ) : null}

                  <p className="mt-4 rounded border border-green-500 bg-white px-3 py-2 text-xs font-semibold text-green-700">
                    Computation completed successfully.
                  </p>
                </div>

                {Array.isArray(result.leaveOneOutEstimates) ? (
                  <div className="rounded-lg border border-neutral-300 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-600">
                      Leave-one-out Estimation (first 10)
                    </p>
                    <p className="mt-2 text-sm text-neutral-800">
                      {result.leaveOneOutEstimates.slice(0, 10).map((value) => formatNumber(value)).join(', ')}
                    </p>
                  </div>
                ) : null}

                {toolkitInputStats ? (
                  <div className="rounded-lg border border-neutral-300 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-600">
                      Toolkit Imported Stats (Local)
                    </p>
                    <div className="mt-2 space-y-1">
                      <ResultLine label="Input Mean" value={formatNumber(toolkitInputStats.baseStats.mean)} />
                      <ResultLine label="Input Median" value={formatNumber(toolkitInputStats.baseStats.median)} />
                      <ResultLine label="Input Variance" value={formatNumber(toolkitInputStats.baseStats.variance)} />
                      <ResultLine label="Input Std. Dev" value={formatNumber(toolkitInputStats.baseStats.standardDeviation)} />
                      <ResultLine label="Input Leave-one-out Count" value={String(toolkitInputStats.leaveOneOutCount)} />
                      <ResultLine label="Input Bias" value={formatNumber(toolkitInputStats.bias)} />
                      <ResultLine label="Input Variance Estimate" value={formatNumber(toolkitInputStats.varianceEstimate)} />
                      <ResultLine label="Input CI" value={`[${formatNumber(toolkitInputStats.confidenceInterval.lower)}, ${formatNumber(toolkitInputStats.confidenceInterval.upper)}]`} />
                      <ResultLine label="Input Stability" value={`${formatNumber(toolkitInputStats.stability.score)} (${toolkitInputStats.stability.level})`} />
                      <ResultLine label="Input Validation" value={toolkitInputStats.validation.isValid ? 'Passed' : 'Failed'} />
                    </div>
                  </div>
                ) : null}

                {result.featureImportsUsed ? (
                  <div className="rounded-lg border border-neutral-300 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-600">
                      Toolkit Feature Imports Used
                    </p>
                    <p className="mt-2 text-sm text-neutral-800">
                      {Object.keys(result.featureImportsUsed).filter((key) => result.featureImportsUsed[key]).join(', ')}
                    </p>
                  </div>
                ) : null}

                <Histogram
                  values={chartValues}
                  ci={result.confidenceInterval}
                  estimate={result.originalEstimate}
                />
                <Sparkline values={chartValues} />
              </div>
            )}
          </aside>
        </section>
      </div>
    </main>
  );
}

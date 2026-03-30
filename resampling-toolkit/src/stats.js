function assertNumericArray(data) {
  if (!Array.isArray(data) || data.length < 2) {
    throw new Error('Data must be an array with at least 2 numeric values.');
  }

  for (const value of data) {
    if (!Number.isFinite(value)) {
      throw new Error('All data values must be finite numbers.');
    }
  }
}

function mean(data) {
  return data.reduce((sum, value) => sum + value, 0) / data.length;
}

function median(data) {
  const sorted = [...data].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }

  return sorted[mid];
}

function variance(data) {
  const mu = mean(data);
  return data.reduce((sum, value) => sum + (value - mu) ** 2, 0) / (data.length - 1);
}

function standardDeviation(data) {
  return Math.sqrt(variance(data));
}

function quantile(sortedData, p) {
  if (sortedData.length === 0) {
    throw new Error('Cannot compute quantile of empty array.');
  }

  const index = (sortedData.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);

  if (lower === upper) {
    return sortedData[lower];
  }

  const weight = index - lower;
  return sortedData[lower] * (1 - weight) + sortedData[upper] * weight;
}

module.exports = {
  assertNumericArray,
  mean,
  median,
  variance,
  standardDeviation,
  quantile
};

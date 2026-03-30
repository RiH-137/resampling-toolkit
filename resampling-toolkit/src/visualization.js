function getMinMax(values) {
  if (!values.length) {
    return { min: 0, max: 0 };
  }

  let min = values[0];
  let max = values[0];

  for (const value of values) {
    if (value < min) {
      min = value;
    }
    if (value > max) {
      max = value;
    }
  }

  return { min, max };
}

function buildHistogram(values, binCount = 16) {
  if (!Array.isArray(values) || values.length === 0) {
    return [];
  }

  const { min, max } = getMinMax(values);
  if (min === max) {
    return [{ start: min, end: max, count: values.length }];
  }

  const bins = Array.from({ length: binCount }, () => ({ count: 0 }));
  const width = (max - min) / binCount;

  for (const value of values) {
    const normalized = (value - min) / width;
    const index = Math.min(binCount - 1, Math.floor(normalized));
    bins[index].count += 1;
  }

  return bins.map((bin, index) => ({
    start: min + width * index,
    end: min + width * (index + 1),
    count: bin.count
  }));
}

function buildSparkPath(values, width, height, padding) {
  if (!Array.isArray(values) || values.length === 0) {
    return '';
  }

  if (values.length === 1) {
    return `M ${padding} ${height / 2} L ${width - padding} ${height / 2}`;
  }

  const { min, max } = getMinMax(values);
  const ySpan = max - min || 1;
  const xSpan = width - padding * 2;
  const ySize = height - padding * 2;

  return values
    .map((value, index) => {
      const x = padding + (index / (values.length - 1)) * xSpan;
      const y = padding + (1 - (value - min) / ySpan) * ySize;
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');
}

function buildGraphModels(values, options = {}) {
  const {
    histogramBins = 16,
    sparkWidth = 480,
    sparkHeight = 120,
    sparkPadding = 8
  } = options;

  return {
    histogram: buildHistogram(values, histogramBins),
    sparkPath: buildSparkPath(values, sparkWidth, sparkHeight, sparkPadding),
    minMax: getMinMax(values)
  };
}

module.exports = {
  getMinMax,
  buildHistogram,
  buildSparkPath,
  buildGraphModels
};

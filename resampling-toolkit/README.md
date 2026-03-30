# resampling-stat-toolkit

A lightweight Node.js module for bootstrap and jackknife resampling.

## Local Usage

## Usage

```javascript
const { bootstrap, jackknife } = require('./index');

const data = [12, 15, 14, 10, 9, 18, 17, 16, 20, 11];

const bootstrapResult = bootstrap({
  data,
  statistic: 'mean',
  iterations: 2000,
  confidenceLevel: 0.95
});

const jackknifeResult = jackknife({
  data,
  statistic: 'mean',
  confidenceLevel: 0.95
});

console.log(bootstrapResult.confidenceInterval);
console.log(jackknifeResult.confidenceInterval);
```

## API

### bootstrap(options)
- `options.data`: number[] (required, at least 2 values)
- `options.statistic`: `mean | median | variance | std` (default: `mean`)
- `options.iterations`: integer >= 100 (default: 1000)
- `options.confidenceLevel`: number between 0 and 1 (default: 0.95)

### jackknife(options)
- `options.data`: number[] (required, at least 2 values)
- `options.statistic`: `mean | median | variance | std` (default: `mean`)
- `options.confidenceLevel`: number between 0 and 1 (default: 0.95)

## License

MIT

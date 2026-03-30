const express = require('express');
const cors = require('cors');
const { bootstrap, jackknife } = require('./resampling');

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

    const result = bootstrap({ data, statistic, iterations, confidenceLevel });
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/jackknife', (req, res) => {
  try {
    const { data, statistic, confidenceLevel } = req.body;

    const result = jackknife({ data, statistic, confidenceLevel });
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});

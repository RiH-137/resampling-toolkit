# Bootstrap and Jackknife Resampling Toolkit: Complete Open Source Project Guide

## 1. Project Summary

This repository is a statistics-focused application that helps users compute confidence intervals and uncertainty metrics when closed-form analytic formulas are difficult or unavailable.

The project is split into three practical parts:

1. backend_example: REST API for bootstrap and jackknife calculations.
2. frontend_example: Next.js UI for input, CSV handling, and result visualization.
3. resampling-toolkit: Reusable JavaScript module that contains core resampling algorithms.

At a high level:

1. A user enters a dataset in the frontend (manual values or CSV).
2. The frontend sends input to backend endpoints.
3. Backend executes resampling logic and returns structured output.
4. Frontend renders estimates, confidence intervals, and charts.


## 1.1 Project Goals Coverage

All requested goals are implemented across toolkit, backend, and frontend:

1. Implement Bootstrap Resampling API
2. Sampling with replacement is implemented in resampling-toolkit/src/resampling.js.
3. Configurable iterations is supported through bootstrap options and backend request body.
4. Confidence intervals and full distributions are returned in bootstrap responses.

5. Implement Jackknife Resampling API
6. Leave-one-out estimation is implemented in jackknife logic.
7. Bias and variance estimation are returned as bias and varianceEstimate.
8. Confidence interval computation is returned as confidenceInterval.

9. Build Reusable Toolkit
10. Independent module exists in project/resampling-toolkit.
11. It is integrated in backend_example via local package dependency and direct import.

12. Develop REST API Layer
13. /api/bootstrap and /api/jackknife endpoints are implemented.
14. Input validation is enforced in toolkit stats and resampling methods.
15. Structured outputs are returned for both methods.

16. Frontend Visualization
17. Manual dataset input and CSV parsing/upload are implemented.
18. Histogram and sparkline charts are implemented.
19. Real-time render updates are shown after API responses.

20. Ensure Accuracy and Performance
21. Core algorithms use array preallocation and deterministic validation paths.
22. Stable output fields and explicit confidence interval computation are implemented.


## 2. Repository Layout

Root layout:

1. project/
2. project/
3. project/backend_example/
4. project/frontend_example/
5. project/resampling-toolkit/
6. project/README.md
7. project/report.md

This structure gives you two ways to use the work:

1. As a full app stack (frontend_example + backend_example).
2. As a standalone computation library (resampling-toolkit).


## 3. backend_example Folder (API Layer)

Path: project/backend_example

### 3.1 Purpose

backend_example is the service layer. It exposes HTTP endpoints so any client (web app, script, mobile app, Postman) can request statistical computations.

### 3.2 Important Files

1. package.json
2. src/server.js
3. src/resampling.js
4. src/stats.js
5. .env.example

### 3.3 File-by-File Explanation

package.json

1. Defines runtime dependencies: express and cors.
2. Defines dev dependency: nodemon.
3. Scripts:
4. npm run dev starts live-reload development server.
5. npm start runs production style node process.

src/server.js

1. Bootstraps Express application.
2. Enables CORS and JSON request body parsing.
3. Defines endpoints:
4. GET /api/health
5. POST /api/bootstrap
6. POST /api/jackknife
7. Handles errors using try/catch and returns 400 with message for invalid input.

src/resampling.js

1. Contains algorithm orchestration logic.
2. Validates statistic choice.
3. Implements bootstrap sampling with replacement.
4. Implements jackknife leave-one-out estimation.
5. Computes derived outputs such as standard error and confidence interval.

src/stats.js

1. Contains statistical helper utilities:
2. Input validation for numeric arrays.
3. mean, median, variance, standardDeviation.
4. quantile interpolation for percentile-based CI bounds.

### 3.4 API Contract

Base local URL:

1. http://localhost:5000/api

Health endpoint:

1. GET /health
2. Response: {"status":"ok"}

Bootstrap endpoint:

1. POST /bootstrap
2. Body fields:
3. data: number[] (minimum length 2)
4. statistic: mean | median | variance | std
5. iterations: integer >= 100
6. confidenceLevel: number in (0, 1)

Jackknife endpoint:

1. POST /jackknife
2. Body fields:
3. data: number[] (minimum length 2)
4. statistic: mean | median | variance | std
5. confidenceLevel: number in (0, 1)


## 4. frontend_example Folder (UI Layer)

Path: project/frontend_example

### 4.1 Purpose

frontend_example is the end-user interface. It captures user input, calls backend APIs, and visualizes statistical output.

### 4.2 Important Files

1. package.json
2. app/layout.js
3. app/page.js
4. app/globals.css
5. .env.local.example
6. next.config.js, tailwind.config.js, postcss.config.js

### 4.3 File-by-File Explanation

package.json

1. Framework dependencies: next, react, react-dom.
2. UI toolchain dependencies: tailwindcss, postcss, autoprefixer.
3. Scripts:
4. npm run dev
5. npm run build
6. npm start
7. npm run lint

app/layout.js

1. Global page shell and metadata.
2. Imports global styles.

app/globals.css

1. Defines light-theme design tokens and base styling.
2. Provides background texture and utility visual polish.

app/page.js

Main UI and logic container:

1. Parses manual datasets.
2. Parses CSV text with quoted-value support.
3. Detects numeric columns from uploaded CSV.
4. Lets users choose method: bootstrap or jackknife.
5. Lets users configure statistic, iterations, confidence level.
6. Calls backend endpoint with fetch.
7. Handles loading and error states.
8. Renders result cards and detailed lines.
9. Draws histogram from result distribution.
10. Draws sparkline for estimate sequence.
11. Displays leave-one-out values on jackknife results.
12. Displays bias and variance estimate on jackknife results.
13. Displays confidence interval for both methods.
14. Displays validation status, stability score, and performance timing.

### 4.4 User Flow in Frontend

1. User enters numbers manually or uploads CSV.
2. User selects statistic and confidence level.
3. User selects iterations for bootstrap.
4. User clicks Run bootstrap or Run jackknife.
5. Frontend sends POST request to backend.
6. Result is rendered as numeric outputs and charts.


## 5. resampling-toolkit Folder (Standalone Logic Module)

Path: project/resampling-toolkit

### 5.1 Purpose

resampling-toolkit holds reusable algorithm code that can be consumed independently from the web app.

### 5.2 Important Files

1. package.json
2. index.js
3. src/resampling.js
4. src/stats.js
5. README.md

### 5.3 File-by-File Explanation

package.json

1. Declares module name and metadata.
2. Sets index.js as main entry point.

index.js

1. Public API bridge.
2. Re-exports bootstrap and jackknife functions.
3. Re-exports feature-level helpers for explicit imports:
4. validateResamplingInput
5. computeLeaveOneOutEstimates
6. estimateBiasVariance
7. computePercentileConfidenceInterval
8. computeStabilityAssessment
9. buildPerformance
10. mean, variance, standardDeviation, quantile and other stats helpers

src/resampling.js

1. Same computational core as backend example logic.
2. Includes bootstrap/jackknife execution pipelines.

src/stats.js

1. Shared math and validation helper functions.

README.md

1. Local usage and function signatures.

### 5.4 Why Keep Toolkit Separate

1. Encourages reuse in other Node projects.
2. Supports clean separation between computation and transport/UI.
3. Makes future publishing simple when account policy is ready.


## 6. How to Use the Project (Common Modes)

### 6.1 Full App Mode (Recommended for End Users)

Run backend and frontend together.

Terminal A:

```bash
cd project/backend_example
npm install
npm run dev
```

Terminal B:

```bash
cd project/frontend_example
npm install
npm run dev
```

Open:

1. http://localhost:3000

### 6.2 API-Only Mode

Use backend directly with REST clients.

```bash
cd project/backend_example
npm install
npm run dev
```

Then call endpoints at:

1. http://localhost:5000/api/bootstrap
2. http://localhost:5000/api/jackknife

### 6.3 Standalone Toolkit Mode (No frontend_example or backend_example)

Create your own project and reference local toolkit:

```bash
mkdir my-resampling-app
cd my-resampling-app
npm init -y
npm install "../issue15/project/resampling-toolkit"
```

Example script:

```javascript
const { bootstrap, jackknife } = require('resampling-stat-toolkit');

const data = [12, 15, 14, 10, 9, 18, 17, 16, 20, 11];

const b = bootstrap({ data, statistic: 'mean', iterations: 1000, confidenceLevel: 0.95 });
const j = jackknife({ data, statistic: 'mean', confidenceLevel: 0.95 });

console.log(b.confidenceInterval);
console.log(j.confidenceInterval);
```


## 7. Environment and Configuration

backend_example

1. Uses PORT (default 5000).
2. Keep an .env file for local overrides.

frontend_example

1. Uses NEXT_PUBLIC_API_URL.
2. Typical value: http://localhost:5000/api


## 8. Data Validation and Error Handling

Validation rules enforced by logic:

1. Dataset must be an array of finite numbers.
2. At least 2 values required.
3. Bootstrap iterations must be integer and >= 100.
4. Confidence level must be greater than 0 and less than 1.
5. Statistic must be one of supported options.

Error propagation:

1. Logic throws Error with human-readable message.
2. Backend catches and returns HTTP 400 with message.
3. Frontend shows message in inline error panel.


## 9. Output Shape (What Users Receive)

Bootstrap output contains:

1. method
2. statistic
3. sampleSize
4. iterations
5. confidenceLevel
6. originalEstimate
7. bootstrapMean
8. bootstrapStdError
9. confidenceInterval (lower, upper)
10. distribution

Jackknife output contains:

1. method
2. statistic
3. sampleSize
4. confidenceLevel
5. originalEstimate
6. leaveOneOutEstimates
7. jackknifeMean
8. bias
9. biasCorrectedEstimate
10. standardError
11. confidenceInterval (lower, upper)


## 10. Open Source Contribution Guide

For contributors:

1. Keep frontend in JavaScript to preserve consistency.
2. Keep validation explicit and strict.
3. Prefer small, focused pull requests.
4. Document behavior changes in README/report updates.
5. Test both API response and frontend rendering whenever logic changes.

Suggested PR checklist:

1. Code compiles and runs locally.
2. API endpoints return expected schema.
3. Frontend build succeeds.
4. New logic includes edge-case handling.
5. Documentation updated.


## 11. Troubleshooting

Backend not starting:

1. Port conflict. Change PORT.

Frontend cannot call API:

1. Check NEXT_PUBLIC_API_URL.
2. Confirm backend is running.
3. Confirm CORS is enabled (already configured).

Bad statistical output:

1. Ensure dataset values are numeric.
2. Increase bootstrap iterations for stability.
3. Verify confidence level range.

CSV upload problems:

1. Confirm header row exists.
2. Ensure selected column has at least 2 numeric values.


## 12. Suggested Next Improvements

1. Add automated tests for stats and resampling layers.
2. Add TypeScript declarations for toolkit consumers.
3. Add request schema validation middleware.
4. Add optional deterministic random seed support.
5. Add downloadable result report (CSV/JSON).


## 13. Final Notes

This codebase is organized for clarity and educational value:

1. computation is isolated,
2. API transport is simple,
3. UI is practical and approachable.

That makes it a good open source starting point for advanced statistical workflows, teaching projects, and reusable Node-based data tooling.


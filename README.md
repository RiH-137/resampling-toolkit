# Bootstrap and Jackknife Resampling Toolkit

This project is a practical resampling lab built for students, developers, and data enthusiasts who want to compute statistical uncertainty when closed-form formulas are not convenient.

It provides:
- A Node.js + Express backend for bootstrap and jackknife computations
- A Next.js + Tailwind frontend for interactive analysis
- A reusable `resampling-toolkit` module with feature-level exports
- Centralized graph builders (histogram/sparkline) in `resampling-toolkit`
- CSV upload with column selection so calculations can be based on field names
- Visual output (distribution graph and estimate trend) to make results easier to interpret


## Why This Project Exists

Many real datasets do not come with simple analytic uncertainty formulas. Bootstrap and jackknife methods are flexible alternatives:
- Bootstrap estimates uncertainty by repeatedly sampling with replacement
- Jackknife estimates uncertainty by systematically leaving out one observation at a time

This toolkit turns those ideas into something runnable and easy to explore.


## Current Features

- Supports statistics: mean, median, variance, standard deviation
- Bootstrap endpoint with configurable iteration count, distribution output, and confidence interval
- Jackknife endpoint with leave-one-out estimates, bias, variance estimate, and confidence interval
- Structured outputs for validation, stability, performance, and feature usage
- CSV upload in frontend
- Automatic numeric-column detection after upload
- Manual column selector so users choose the field to analyze
- Light theme UI using neutral colors with red/green status accents only
- Graphs:
	- Histogram-style distribution graph
	- Estimate sequence sparkline
- Frontend panels for:
	- Leave-one-out values preview
	- Bias and variance display
	- Confidence interval display
	- Validation status
	- Stability score and compute-time metrics


## Tech Stack

Frontend
- Next.js 14 (JavaScript only)
- React 18
- Tailwind CSS

Backend
- Node.js
- Express.js
- CORS


## Project Structure

		issue15/
			project/
				resampling-toolkit/
					index.js
					package.json
					src/
						resampling.js
						stats.js
				backend_example/
					src/
						server.js
						resampling.js
						stats.js
					.env
					package.json
				frontend_example/
					app/
						layout.js
						page.js
						globals.css
					.env.local
					package.json
			README.md
			TASK1.md


## API Reference

Base URL (local):

		http://localhost:5000/api

### Health Check

GET /health

Response:

		{ "status": "ok" }


### Bootstrap

POST /bootstrap

Request body:

		{
			"data": [12, 15, 14, 10, 9, 18],
			"statistic": "mean",
			"iterations": 1000,
			"confidenceLevel": 0.95
		}

Notes:
- data must contain at least 2 numeric values
- iterations must be an integer >= 100
- confidenceLevel must be between 0 and 1


### Jackknife

POST /jackknife

Request body:

		{
			"data": [12, 15, 14, 10, 9, 18],
			"statistic": "mean",
			"confidenceLevel": 0.95
		}

Notes:
- data must contain at least 2 numeric values
- confidenceLevel must be between 0 and 1

Response includes:
- leaveOneOutEstimates
- bias
- varianceEstimate
- standardError
- confidenceInterval
- validation
- stability
- performance


## Toolkit Feature-Level Imports

The toolkit supports explicit feature imports so each capability can be reused independently:

		const {
			bootstrap,
			jackknife,
			validateResamplingInput,
			computeLeaveOneOutEstimates,
			estimateBiasVariance,
			computePercentileConfidenceInterval,
			computeStabilityAssessment,
			buildPerformance,
			buildHistogram,
			buildSparkPath,
			buildGraphModels,
			mean,
			variance,
			standardDeviation
		} = require('resampling-stat-toolkit');

These are integrated in `backend_example/src/server.js` and `frontend_example/app/page.js`.
All graph-generation logic is now maintained in `resampling-toolkit/src/visualization.js` and consumed through imports.


## Use resampling-toolkit Standalone (Without frontend/backend)

If you only want the resampling module and do not want to use this project's `frontend` or `backend` folders, you can consume the toolkit directly from `project/resampling-toolkit`.

1. Create a separate Node.js project anywhere on your machine

		mkdir my-resampling-app
		cd my-resampling-app
		npm init -y

2. Install toolkit from local path

		npm install "../issue15/project/resampling-toolkit"

3. Use it in your own script (`index.js`)

		const { bootstrap, jackknife } = require('resampling-stat-toolkit');

		const data = [12, 15, 14, 10, 9, 18, 17, 16, 20, 11];

		const bootstrapResult = bootstrap({
			data,
			statistic: 'mean',
			iterations: 1000,
			confidenceLevel: 0.95
		});

		const jackknifeResult = jackknife({
			data,
			statistic: 'mean',
			confidenceLevel: 0.95
		});

		console.log('Bootstrap CI:', bootstrapResult.confidenceInterval);
		console.log('Jackknife CI:', jackknifeResult.confidenceInterval);

4. Run your script

		node index.js

This path keeps your usage independent from the API server and Next.js UI in this repository.

## How to Clone and Run (Human-Friendly Walkthrough)

If you are new to this repo, do this in order.

1. Clone the repository

		git clone <your-repository-url>
		cd issue15

2. Start the backend server

		cd project/backend_example
		npm install
		npm run dev

Backend starts at:

		http://localhost:5000

3. Open a second terminal and start the frontend

		cd project/frontend_example
		npm install
		npm run dev

Frontend starts at:

		http://localhost:3000

4. Open the app in your browser

		http://localhost:3000


## Environment Variables

Backend file: project/backend_example/.env

		PORT=5000

Frontend file: project/frontend_example/.env.local

		NEXT_PUBLIC_API_URL=http://localhost:5000/api


## Using the App

You have two data entry modes.

1. Manual values
- Type numbers separated by commas or spaces in the dataset box
- Choose method, statistic, and confidence level
- Click Run bootstrap or Run jackknife

2. CSV upload and field-based calculation
- Click Upload CSV
- The app reads header names from the file
- It auto-selects the first numeric column
- Use Select Field / Column to switch to another field
- The selected column is converted into numeric dataset values for computation


## Contributor Notes

If you want to contribute:
- Keep frontend in JavaScript
- Keep API input validation strict and explicit
- Add small focused changes with clear commit messages


## Troubleshooting

1. Port already in use
- Change backend PORT in project/backend/.env
- Update NEXT_PUBLIC_API_URL in project/frontend/.env.local if needed

2. Frontend cannot reach backend
- Make sure backend is running first
- Confirm NEXT_PUBLIC_API_URL points to the correct backend URL

3. CSV upload accepted but field fails
- Selected field likely has less than 2 numeric values
- Choose another field from Select Field / Column


## Roadmap Ideas

- Side-by-side comparison mode (bootstrap vs jackknife in one run)
- CSV export of computed distributions
- Optional support for Excel files
- Better statistical diagnostics and warnings


## License

No license file has been added yet.
If this is intended to be public open source, add a license file (for example MIT) before publishing.

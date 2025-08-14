# Warehouse Management App

A modern, minimalist warehouse management application with real-time tracking and multi-view sharing capabilities.

## Features

- Goods management system
- Storage tracking
- Multi-view sharing for vendors and stakeholders
- Modern industrial design
- Subtle web animations
- Responsive dashboard

## Tech Stack

- Frontend: React with TypeScript
- UI Framework: Material-UI
- Animations: Framer Motion
- Backend: Node.js/Express
- Database: MongoDB
- Authentication: JWT

## Project Structure

```
warehouse-management-app/
├── client/          # React frontend application
├── server/          # Node.js backend
└── README.md        # Project documentation
```

## Setup Instructions

### Backend Setup

1. Navigate to the root directory:
```bash
cd warehouse-management-app
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

4. Start the backend server:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to the client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

## Analytics & ML Pipeline

The backend emits structured NDJSON analytics logs for every HTTP request. A simple nightly batch parses logs, builds session-level features, and trains two models: a session conversion classifier and an anomaly detector.

### Logging

- Location: `logs/YYYY-MM-DD.ndjson`
- One JSON object per line with fields:
  - `ts` ISO timestamp (UTC)
  - `ip`, `user_id` (null today), `session_id` (from `x-session-id` header or `sid` cookie, else UUID)
  - `method`, `path`, `status`, `latency_ms`
  - `referrer`, `ua`
  - `event` inferred from route/action (e.g. `page_view`, `goods_write`, `search`)
  - optional `meta` (e.g. `{ q: "term" }` for `/api/search`)

### Batch Pipeline

Files in `analytics/`:

- `parse_and_featurize.py` — parses NDJSON and creates session-level parquet features.
- `train_models.py` — trains `RandomForestClassifier` (conversion) and `IsolationForest` (anomaly), writes outputs to `analytics/models/`:
  - `session_conversion_rf.joblib`
  - `session_isoforest.joblib`
  - `feats_with_anomaly.parquet`
  - `metrics.json`
- `requirements.txt` — Python dependencies.

Install Python deps (once):

```bash
python3 -m venv .venv && source .venv/bin/activate  # Windows: .venv\\Scripts\\activate
pip install -r analytics/requirements.txt
```

Run the pipeline:

```bash
npm run train-analytics
```

This resolves `logs/latest.ndjson` to the newest log file, writes features to `analytics/feats.parquet`, and trains models into `analytics/models/`.

### Example Queries

Load anomalies and inspect highest scores:

```python
import pandas as pd
df = pd.read_parquet('analytics/models/feats_with_anomaly.parquet')
print(df.sort_values('anomaly_score', ascending=False).head(10))
```

Compute naive conversion rate:

```python
import pandas as pd
df = pd.read_parquet('analytics/models/feats_with_anomaly.parquet')
print((df['conv_label'].sum() / len(df)).round(4))
```

### Nightly Automation (optional)

- Add an OS cron job or Render Cron Job to run `npm run train-analytics` nightly.
- Example (cron): `0 2 * * * cd /app && npm run train-analytics >> cron.log 2>&1`

### Notes

- Logging is appended and rotated daily; set `LOG_DIR` env to change location.
- Set `TRUST_PROXY=1` if running behind a proxy to log correct client IPs.
- Existing routes and frontend are unaffected by logging and analytics.

## Color Palette

- Primary: #2196F3 (Material Blue)
- Secondary: #1976D2 (Material Dark Blue)
- Background: #F5F5F5 (Material Light Gray)
- Text: #333333 (Dark Gray)
- Accent: #FFC107 (Material Amber)

## Font Family

- Primary: 'Inter', sans-serif
- Secondary: 'Roboto', sans-serif

## License

MIT

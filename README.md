# Brown Advisory Global Leaders Fund — Portfolio Analytics Dashboard

## Quick Start (3 commands)

```bash
# 1. Install JavaScript dependencies
npm install

# 2. Start the dev server
npm run dev

# 3. Open the URL it prints (usually http://localhost:5173)
```

That's it — the dashboard will open in your browser with mock data.

## Swapping in Real Market Data

```bash
# 1. Install Python dependencies (once)
pip install yfinance pandas numpy

# 2. Run the data pipeline
python data_pipeline.py

# 3. It outputs portfolio_data.json — copy its contents into src/App.jsx
#    replacing the DATA constant at the top of the file
```

## Deploying to Vercel (free, gives you a shareable link)

1. Push this folder to a GitHub repo
2. Go to https://vercel.com → Sign in with GitHub → "Add New Project"
3. Select your repo → Vercel auto-detects Vite → Click Deploy
4. You'll get a URL like `portfolio-dashboard-xyz.vercel.app`

## Project Structure

```
portfolio-dashboard/
├── index.html          ← HTML entry point
├── package.json        ← Dependencies (React, Recharts, Vite)
├── vite.config.js      ← Build tool config
├── data_pipeline.py    ← Python script to pull real market data
├── src/
│   ├── main.jsx        ← React bootstrap
│   └── App.jsx         ← The entire dashboard (single file)
└── public/             ← Static assets (empty for now)
```

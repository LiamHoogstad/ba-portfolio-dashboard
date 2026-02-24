"""
Brown Advisory Global Leaders Fund - Portfolio Analytics Data Pipeline (v3)
===========================================================================
Requirements: pip install yfinance pandas numpy
Usage: python data_pipeline.py
Output: portfolio_data.json
"""

import yfinance as yf
import pandas as pd
import numpy as np
import json
from datetime import datetime, timedelta
import warnings
import math
warnings.filterwarnings('ignore')

holdings = [
    {"name": "Microsoft Corporation", "yf_ticker": "MSFT", "weight": 8.5463, "sector": "Technology", "country": "United States", "market_value": 403291685.24},
    {"name": "Alphabet Inc. Class C", "yf_ticker": "GOOG", "weight": 5.9868, "sector": "Technology", "country": "United States", "market_value": 282509746.80},
    {"name": "London Stock Exchange Group", "yf_ticker": "LSEG.L", "weight": 4.9717, "sector": "Financials", "country": "United Kingdom", "market_value": 234609217.85},
    {"name": "Visa Inc. Class A", "yf_ticker": "V", "weight": 4.9675, "sector": "Financials", "country": "United States", "market_value": 234409303.35},
    {"name": "Deutsche Boerse AG", "yf_ticker": "DB1.DE", "weight": 4.6840, "sector": "Financials", "country": "Germany", "market_value": 221035342.69},
    {"name": "Mastercard Inc. Class A", "yf_ticker": "MA", "weight": 4.1155, "sector": "Financials", "country": "United States", "market_value": 194207667.20},
    {"name": "Roche Holding Ltd", "yf_ticker": "ROG.SW", "weight": 3.7573, "sector": "Health Care", "country": "Switzerland", "market_value": 177304649.60},
    {"name": "Unilever PLC", "yf_ticker": "ULVR.L", "weight": 3.5519, "sector": "Consumer Staples", "country": "United Kingdom", "market_value": 167609074.35},
    {"name": "Charles Schwab Corp", "yf_ticker": "SCHW", "weight": 3.2112, "sector": "Financials", "country": "United States", "market_value": 151531998.35},
    {"name": "Taiwan Semiconductor (ADR)", "yf_ticker": "TSM", "weight": 3.2102, "sector": "Technology", "country": "Taiwan", "market_value": 151483998.87},
    {"name": "ASML Holding NV (ADR)", "yf_ticker": "ASML", "weight": 3.1983, "sector": "Technology", "country": "Netherlands", "market_value": 150926220.06},
    {"name": "AIA Group Limited", "yf_ticker": "1299.HK", "weight": 3.0566, "sector": "Financials", "country": "Hong Kong", "market_value": 144237225.70},
    {"name": "Safran SA", "yf_ticker": "SAF.PA", "weight": 2.8791, "sector": "Industrials", "country": "France", "market_value": 135863141.36},
    {"name": "HDFC Bank Limited", "yf_ticker": "HDFCBANK.NS", "weight": 2.8691, "sector": "Financials", "country": "India", "market_value": 135391701.37},
    {"name": "Experian PLC", "yf_ticker": "EXPN.L", "weight": 2.8463, "sector": "Industrials", "country": "United Kingdom", "market_value": 134315305.11},
    {"name": "Intuit Inc.", "yf_ticker": "INTU", "weight": 2.6807, "sector": "Technology", "country": "United States", "market_value": 126499035.30},
    {"name": "GE Aerospace", "yf_ticker": "GE", "weight": 2.6150, "sector": "Industrials", "country": "United States", "market_value": 123398666.18},
    {"name": "Edwards Lifesciences", "yf_ticker": "EW", "weight": 2.5416, "sector": "Health Care", "country": "United States", "market_value": 119933877.25},
    {"name": "Zoetis Inc. Class A", "yf_ticker": "ZTS", "weight": 2.5142, "sector": "Health Care", "country": "United States", "market_value": 118641214.08},
    {"name": "Atlas Copco AB Class B", "yf_ticker": "ATCO-B.ST", "weight": 2.4856, "sector": "Industrials", "country": "Sweden", "market_value": 117293633.17},
    {"name": "Rentokil Initial plc", "yf_ticker": "RTO.L", "weight": 2.2912, "sector": "Industrials", "country": "United Kingdom", "market_value": 108118405.28},
    {"name": "B3 SA - Brasil Bolsa Balcao", "yf_ticker": "B3SA3.SA", "weight": 2.2270, "sector": "Financials", "country": "Brazil", "market_value": 105089116.43},
    {"name": "Ferguson Enterprises", "yf_ticker": "FERG", "weight": 2.2002, "sector": "Industrials", "country": "United States", "market_value": 103824391.02},
    {"name": "Allegion PLC", "yf_ticker": "ALLE", "weight": 2.1696, "sector": "Industrials", "country": "Ireland", "market_value": 102382599.72},
    {"name": "Booking Holdings", "yf_ticker": "BKNG", "weight": 2.1475, "sector": "Consumer Discretionary", "country": "United States", "market_value": 101338909.59},
    {"name": "Workday Inc. Class A", "yf_ticker": "WDAY", "weight": 2.0526, "sector": "Technology", "country": "United States", "market_value": 96860195.72},
    {"name": "PT Bank Central Asia Tbk", "yf_ticker": "BBCA.JK", "weight": 2.0263, "sector": "Financials", "country": "Indonesia", "market_value": 95616621.55},
    {"name": "AutoZone Inc.", "yf_ticker": "AZO", "weight": 2.0104, "sector": "Consumer Discretionary", "country": "United States", "market_value": 94867038.00},
    {"name": "Autodesk Inc.", "yf_ticker": "ADSK", "weight": 1.8761, "sector": "Technology", "country": "United States", "market_value": 88531262.82},
    {"name": "CTS Eventim AG", "yf_ticker": "EVD.DE", "weight": 1.6602, "sector": "Communication Services", "country": "Germany", "market_value": 78342685.08},
    {"name": "Equifax Inc.", "yf_ticker": "EFX", "weight": 0.9701, "sector": "Industrials", "country": "United States", "market_value": 45778657.38},
]

CASH_WEIGHT = 3.4863
RF_RATE = 0.045  # 4.5% annualised risk-free rate (approx avg 3M T-bill 2024-2025)
BENCHMARK_TICKER = "URTH"  # iShares MSCI World ETF — global equity benchmark

# ── PULL DATA ─────────────────────────────────────────────────────────

print("Pulling price data from Yahoo Finance...")
tickers = [h['yf_ticker'] for h in holdings]
end_date = datetime(2025, 12, 31)
start_date = end_date - timedelta(days=365 * 2)

all_prices = {}
failed = []
for t in tickers + [BENCHMARK_TICKER]:
    try:
        df = yf.download(t, start=start_date, end=end_date, auto_adjust=True, progress=False)
        if df is not None and len(df) > 50:
            if isinstance(df.columns, pd.MultiIndex):
                df.columns = df.columns.get_level_values(0)
            all_prices[t] = df['Close'].squeeze()
            print(f"  ✓ {t} ({len(df)} days)")
        else:
            failed.append(t)
            print(f"  ✗ {t} (insufficient data)")
    except Exception as e:
        failed.append(t)
        print(f"  ✗ {t} ({e})")

prices = pd.DataFrame(all_prices)
prices = prices.ffill().bfill()
prices = prices.loc[:, prices.std() > 0]

available_tickers = [t for t in tickers if t in prices.columns]
has_benchmark = BENCHMARK_TICKER in prices.columns
print(f"\n✅ Got price data for {len(available_tickers)}/{len(tickers)} tickers")
print(f"   Benchmark ({BENCHMARK_TICKER}): {'✓' if has_benchmark else '✗'}")
if failed:
    print(f"   ⚠ Failed: {failed}")

holdings_with_data = [h for h in holdings if h['yf_ticker'] in available_tickers]

if len(holdings_with_data) < 5:
    print(f"\n❌ Only {len(holdings_with_data)} tickers matched.")
    exit(1)

total_w = sum(h['weight'] for h in holdings_with_data)
for h in holdings_with_data:
    h['weight_normalised'] = h['weight'] / total_w * 100

# ── COMPUTE METRICS ──────────────────────────────────────────────────

print("Computing returns and risk metrics...")

returns = prices.pct_change().dropna()

ann_return = {}
ann_vol = {}
for t in available_tickers:
    r = returns[t]
    ann_return[t] = float((1 + r.mean()) ** 252 - 1)
    ann_vol[t] = float(r.std() * np.sqrt(252))

w = np.array([h['weight_normalised'] / 100 for h in holdings_with_data])
ticker_order = [h['yf_ticker'] for h in holdings_with_data]
returns_ordered = returns[ticker_order]

corr_matrix = returns_ordered.corr()
cov_matrix = returns_ordered.cov() * 252

port_return = float(w @ np.array([ann_return[t] for t in ticker_order]))
port_vol = float(np.sqrt(w @ cov_matrix.values @ w))
sharpe = (port_return - RF_RATE) / port_vol if port_vol > 0 else 0

port_daily = (returns_ordered * w).sum(axis=1)

var_95 = float(np.percentile(port_daily, 5))
tail = port_daily[port_daily <= var_95]
cvar_95 = float(tail.mean()) if len(tail) > 0 else var_95

portfolio_variance = w @ cov_matrix.values @ w
mctr = (cov_matrix.values @ w) / np.sqrt(portfolio_variance) if portfolio_variance > 0 else np.zeros(len(w))
ctr = w * mctr
ctr_sum = ctr.sum()
ctr_pct = ctr / ctr_sum * 100 if ctr_sum > 0 else np.zeros(len(w))

cum_returns = (1 + port_daily).cumprod()
rolling_max = cum_returns.cummax()
drawdowns = (cum_returns - rolling_max) / rolling_max
max_drawdown = float(drawdowns.min())

# ── FACTOR ANALYSIS (Market Beta) ────────────────────────────────────

print("Computing factor exposures...")

factor_data = []
if has_benchmark:
    bench_returns = returns[BENCHMARK_TICKER]
    bench_ann_return = float((1 + bench_returns.mean()) ** 252 - 1)
    bench_ann_vol = float(bench_returns.std() * np.sqrt(252))
    
    # Portfolio beta
    port_bench_aligned = pd.DataFrame({'port': port_daily, 'bench': bench_returns}).dropna()
    port_beta = float(np.cov(port_bench_aligned['port'], port_bench_aligned['bench'])[0][1] / np.var(port_bench_aligned['bench']))
    
    # Per-stock beta + alpha
    for h in holdings_with_data:
        t = h['yf_ticker']
        stock_ret = returns[t]
        aligned = pd.DataFrame({'stock': stock_ret, 'bench': bench_returns}).dropna()
        if len(aligned) > 50:
            cov_sb = np.cov(aligned['stock'], aligned['bench'])[0][1]
            var_b = np.var(aligned['bench'])
            beta = float(cov_sb / var_b) if var_b > 0 else 1.0
            # Annualised alpha = stock return - beta * benchmark return
            alpha = ann_return.get(t, 0) - beta * bench_ann_return
            # R-squared
            ss_res = np.sum((aligned['stock'] - beta * aligned['bench'] - (aligned['stock'].mean() - beta * aligned['bench'].mean())) ** 2)
            ss_tot = np.sum((aligned['stock'] - aligned['stock'].mean()) ** 2)
            r_squared = float(1 - ss_res / ss_tot) if ss_tot > 0 else 0
            
            factor_data.append({
                "name": h['name'], "ticker": t, "weight": h['weight'],
                "beta": round(beta, 2),
                "alpha_pct": round(alpha * 100, 2),
                "r_squared": round(r_squared, 2),
                "systematic_return_pct": round(beta * bench_ann_return * 100, 2),
                "idiosyncratic_return_pct": round(alpha * 100, 2),
            })
        else:
            factor_data.append({
                "name": h['name'], "ticker": t, "weight": h['weight'],
                "beta": 1.0, "alpha_pct": 0.0, "r_squared": 0.0,
                "systematic_return_pct": 0.0, "idiosyncratic_return_pct": 0.0,
            })
    
    # Portfolio-level factor decomposition
    weighted_beta = sum(f['beta'] * f['weight'] / 100 for f in factor_data)
    systematic_return = weighted_beta * bench_ann_return
    idiosyncratic_return = port_return - systematic_return
    
    # Benchmark cumulative returns
    bench_cum = (1 + bench_returns).cumprod()
    bench_cum_series = [{"date": d.strftime("%Y-%m-%d"), "benchmark_return": round((v - 1) * 100, 2)} for d, v in bench_cum.items()]
else:
    bench_ann_return = 0
    bench_ann_vol = 0
    port_beta = 1.0
    weighted_beta = 1.0
    systematic_return = 0
    idiosyncratic_return = 0
    bench_cum_series = []

# ── ALLOCATIONS ───────────────────────────────────────────────────────

sector_weights = {}
country_weights = {}
for h in holdings_with_data:
    sector_weights[h['sector']] = sector_weights.get(h['sector'], 0) + h['weight']
    country_weights[h['country']] = country_weights.get(h['country'], 0) + h['weight']
sector_weights['Cash'] = CASH_WEIGHT
country_weights['Cash'] = CASH_WEIGHT

weights_arr = sorted([h['weight'] for h in holdings_with_data], reverse=True)
hhi = sum((wi / 100) ** 2 for wi in weights_arr)
effective_n = 1 / hhi if hhi > 0 else 0

# ── SCENARIOS ─────────────────────────────────────────────────────────

print("Computing scenario analysis...")

em_shocks = {"Brazil": -0.25, "India": -0.20, "Indonesia": -0.25, "Taiwan": -0.10, "Hong Kong": -0.10}
scenarios_def = {
    "Tech Selloff (-20%)": {"Technology": -0.20},
    "Global Recession (-15%)": {s: -0.15 for s in set(h['sector'] for h in holdings_with_data)},
    "Rates +100bps": {"Technology": -0.08, "Financials": 0.05, "Health Care": -0.03,
                       "Industrials": -0.04, "Consumer Discretionary": -0.06,
                       "Consumer Staples": -0.02, "Communication Services": -0.05},
    "GBP Strengthens +10%": {},
    "EM Crisis": {},
}

scenario_results = {}
for sname, shocks in scenarios_def.items():
    port_impact = 0
    impacts = []
    for h in holdings_with_data:
        impact = 0
        if sname == "GBP Strengthens +10%":
            impact = -0.07 if h['country'] != 'United Kingdom' else 0
        elif sname == "EM Crisis":
            impact = em_shocks.get(h['country'], 0)
        else:
            impact = shocks.get(h['sector'], 0)
        wi = impact * h['weight'] / 100
        port_impact += wi
        impacts.append({"name": h['name'], "impact_pct": round(impact * 100, 2), "weighted_impact_pct": round(wi * 100, 4)})
    scenario_results[sname] = {
        "portfolio_impact_pct": round(port_impact * 100, 2),
        "top_losers": sorted(impacts, key=lambda x: x['weighted_impact_pct'])[:5],
        "top_gainers": sorted([s for s in impacts if s['weighted_impact_pct'] > 0], key=lambda x: -x['weighted_impact_pct'])[:3]
    }

# ── ATTRIBUTION ───────────────────────────────────────────────────────

print("Computing performance attribution...")

total_returns = {}
for t in available_tickers:
    p = prices[t].dropna()
    total_returns[t] = float((p.iloc[-1] / p.iloc[0]) - 1) if len(p) > 1 else 0.0

contributions = sorted([{
    "name": h['name'], "ticker": h['yf_ticker'],
    "stock_return_pct": round(total_returns.get(h['yf_ticker'], 0) * 100, 2),
    "weight": h['weight'],
    "contribution_pct": round(total_returns.get(h['yf_ticker'], 0) * h['weight'], 4)
} for h in holdings_with_data], key=lambda x: -x['contribution_pct'])

# ── CUMULATIVE RETURNS ────────────────────────────────────────────────

cum_ret_series = [{"date": d.strftime("%Y-%m-%d"), "cumulative_return": round((v - 1) * 100, 2)} for d, v in cum_returns.items()]

# Merge benchmark into cumulative returns if available
if bench_cum_series:
    bench_dict = {b['date']: b['benchmark_return'] for b in bench_cum_series}
    for item in cum_ret_series:
        item['benchmark_return'] = bench_dict.get(item['date'], None)

# ── CLEAN & EXPORT ────────────────────────────────────────────────────

def clean(obj):
    if isinstance(obj, dict): return {k: clean(v) for k, v in obj.items()}
    if isinstance(obj, list): return [clean(i) for i in obj]
    if isinstance(obj, (np.floating, float)):
        v = float(obj)
        return None if (math.isnan(v) or math.isinf(v)) else v
    if isinstance(obj, np.integer): return int(obj)
    return obj

output = clean({
    "metadata": {
        "fund_name": "Brown Advisory Global Leaders Fund",
        "as_of_date": "2025-12-31",
        "total_aum": 4718893906.29,
        "num_holdings": len(holdings_with_data),
        "cash_weight": CASH_WEIGHT,
        "risk_free_rate": RF_RATE,
        "benchmark": BENCHMARK_TICKER,
        "generated_at": datetime.now().isoformat()
    },
    "holdings": [{
        "name": h['name'], "ticker": h['yf_ticker'], "weight": round(h['weight'], 2),
        "sector": h['sector'], "country": h['country'], "market_value": h['market_value'],
        "ann_return_pct": round(ann_return.get(h['yf_ticker'], 0) * 100, 2),
        "ann_vol_pct": round(ann_vol.get(h['yf_ticker'], 0) * 100, 2),
        "risk_contribution_pct": round(float(ctr_pct[i]), 2),
        "total_return_pct": round(total_returns.get(h['yf_ticker'], 0) * 100, 2),
    } for i, h in enumerate(holdings_with_data)],
    "portfolio_risk": {
        "annualised_return_pct": round(port_return * 100, 2),
        "annualised_vol_pct": round(port_vol * 100, 2),
        "sharpe_ratio": round(sharpe, 2),
        "var_95_daily_pct": round(var_95 * 100, 2),
        "cvar_95_daily_pct": round(cvar_95 * 100, 2),
        "max_drawdown_pct": round(max_drawdown * 100, 2),
    },
    "concentration": {
        "hhi": round(hhi, 4),
        "effective_n": round(effective_n, 1),
        "top5_weight": round(sum(weights_arr[:5]), 2),
        "top10_weight": round(sum(weights_arr[:10]), 2),
    },
    "sector_allocation": [{"sector": k, "weight": round(v, 2)} for k, v in sorted(sector_weights.items(), key=lambda x: -x[1])],
    "country_allocation": [{"country": k, "weight": round(v, 2)} for k, v in sorted(country_weights.items(), key=lambda x: -x[1])],
    "correlation_matrix": {
        "tickers": [h['name'][:20] for h in holdings_with_data],
        "matrix": corr_matrix.values.round(2).tolist()
    },
    "factor_analysis": {
        "benchmark_name": "MSCI World (URTH)",
        "benchmark_return_pct": round(bench_ann_return * 100, 2),
        "benchmark_vol_pct": round(bench_ann_vol * 100, 2),
        "portfolio_beta": round(weighted_beta, 2),
        "systematic_return_pct": round(systematic_return * 100, 2),
        "idiosyncratic_return_pct": round(idiosyncratic_return * 100, 2),
        "holdings": factor_data,
    },
    "scenarios": scenario_results,
    "performance_attribution": contributions,
    "cumulative_returns": cum_ret_series,
})

with open("portfolio_data.json", "w") as f:
    json.dump(output, f, indent=2)

print(f"\n✅ Done! Exported portfolio_data.json")
print(f"   Holdings: {len(holdings_with_data)}")
print(f"   Portfolio Return: {port_return*100:.1f}%")
print(f"   Portfolio Vol: {port_vol*100:.1f}%")
print(f"   Sharpe (Rf={RF_RATE*100:.1f}%): {sharpe:.2f}")
print(f"   Portfolio Beta: {weighted_beta:.2f}")
print(f"   Benchmark Return: {bench_ann_return*100:.1f}%")
print(f"   Systematic: {systematic_return*100:.1f}% | Idiosyncratic: {idiosyncratic_return*100:.1f}%")
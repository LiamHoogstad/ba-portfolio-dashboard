import { useState, useMemo, useEffect, useCallback } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, ReferenceLine, Area, AreaChart, ComposedChart } from "recharts";

/* ═══════════════════════════════════════════════════════════════════════════
   THEME — clean, institutional, not template-y
   ═══════════════════════════════════════════════════════════════════════════ */

const C = {
  bg: "#fafbfc",
  white: "#ffffff",
  border: "#eaedf2",
  borderSub: "#f2f4f7",
  text: "#111827",
  textSec: "#4b5563",
  textDim: "#9ca3af",
  accent: "#1e40af",
  accentMid: "#3b82f6",
  accentLight: "#eff6ff",
  green: "#047857",
  greenLight: "#ecfdf5",
  red: "#b91c1c",
  redLight: "#fef2f2",
  amber: "#92400e",
  amberLight: "#fffbeb",
  chart: ["#1e40af", "#7c3aed", "#0e7490", "#047857", "#b45309", "#b91c1c", "#be185d", "#4338ca", "#0f766e", "#c2410c", "#6d28d9", "#0369a1", "#991b1b", "#a16207"],
};

const font = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const mono = "'JetBrains Mono', 'SF Mono', monospace";

const fmt = (n, d = 2) => n?.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d }) ?? "—";
const fmtM = (n) => n >= 1e9 ? `$${(n / 1e9).toFixed(2)}B` : `$${(n / 1e6).toFixed(0)}M`;
const fmtPct = (n) => `${n >= 0 ? "+" : ""}${fmt(n)}%`;

/* ── Shared UI primitives ────────────────────────────────────────────── */

const Card = ({ children, style }) => (
  <div style={{ background: C.white, borderRadius: 10, border: `1px solid ${C.border}`, ...style }}>{children}</div>
);

const Stat = ({ label, value, sub, color, size = "md" }) => (
  <div style={{ minWidth: size === "lg" ? 170 : 130 }}>
    <div style={{ fontSize: 10, fontWeight: 600, color: C.textDim, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: size === "lg" ? 28 : 22, fontWeight: 700, fontFamily: mono, color: color || C.text, lineHeight: 1 }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: C.textDim, marginTop: 5 }}>{sub}</div>}
  </div>
);

const Heading = ({ children, sub }) => (
  <div style={{ marginBottom: 14 }}>
    <h2 style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: 0 }}>{children}</h2>
    {sub && <p style={{ fontSize: 12, color: C.textDim, margin: "2px 0 0" }}>{sub}</p>}
  </div>
);

const Pill = ({ children, color, bg }) => (
  <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 9px", borderRadius: 5, color: color || C.accent, background: bg || C.accentLight }}>{children}</span>
);

const TT = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", fontSize: 12, boxShadow: "0 4px 16px rgba(0,0,0,0.06)", fontFamily: font }}>
      <div style={{ color: C.textDim, marginBottom: 3, fontWeight: 500 }}>{label}</div>
      {payload.filter(p => p.value != null).map((p, i) => (
        <div key={i} style={{ color: p.color || p.stroke, fontWeight: 600, fontSize: 12 }}>{p.name}: {typeof p.value === "number" ? fmt(p.value) : p.value}%</div>
      ))}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   OVERVIEW TAB
   ═══════════════════════════════════════════════════════════════════════════ */

const OverviewTab = ({ DATA }) => {
  const { portfolio_risk: pr, concentration: con, metadata: meta } = DATA;
  const [sortKey, setSortKey] = useState("weight");
  const [sortDir, setSortDir] = useState(-1);

  const sorted = useMemo(() =>
    [...DATA.holdings].sort((a, b) => sortKey === "name" ? sortDir * a.name.localeCompare(b.name) : (a[sortKey] - b[sortKey]) * sortDir),
    [sortKey, sortDir, DATA.holdings]
  );

  const doSort = (k) => { if (sortKey === k) setSortDir(d => -d); else { setSortKey(k); setSortDir(-1); } };

  const TH = ({ k, children, left }) => (
    <th onClick={() => doSort(k)} style={{
      padding: "9px 14px", textAlign: left ? "left" : "right", cursor: "pointer",
      fontSize: 10, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase",
      color: sortKey === k ? C.accent : C.textDim, borderBottom: `2px solid ${sortKey === k ? C.accent : C.border}`,
      background: C.bg, whiteSpace: "nowrap", userSelect: "none", position: "sticky", top: 0,
    }}>{children}{sortKey === k ? (sortDir > 0 ? " ↑" : " ↓") : ""}</th>
  );

  return (
    <div>
      {/* Key metrics row */}
      <Card style={{ padding: "24px 28px", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 36, flexWrap: "wrap" }}>
          <Stat label="AUM" value={fmtM(meta.total_aum)} sub={`${meta.num_holdings} equities + cash`} size="lg" />
          <Stat label="Annualised Return" value={fmtPct(pr.annualised_return_pct)} color={C.green} size="lg" />
          <Stat label="Annualised Vol" value={`${fmt(pr.annualised_vol_pct)}%`} size="lg" />
          <Stat label="Sharpe Ratio" value={fmt(pr.sharpe_ratio)} color={pr.sharpe_ratio > 1 ? C.green : C.amber} sub={`R_f = ${((meta.risk_free_rate || 0.045) * 100).toFixed(1)}%`} size="lg" />
        </div>
      </Card>

      <Card style={{ padding: "24px 28px", marginBottom: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: C.textDim, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 14 }}>Downside Risk</div>
        <div style={{ overflow: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: mono, fontSize: 13 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "6px 12px", fontSize: 10, fontWeight: 700, color: C.textDim, textTransform: "uppercase", letterSpacing: 0.8, borderBottom: `2px solid ${C.border}` }}></th>
                <th style={{ textAlign: "right", padding: "6px 12px", fontSize: 10, fontWeight: 700, color: C.textDim, textTransform: "uppercase", letterSpacing: 0.8, borderBottom: `2px solid ${C.border}` }}>Daily</th>
                <th style={{ textAlign: "right", padding: "6px 12px", fontSize: 10, fontWeight: 700, color: C.textDim, textTransform: "uppercase", letterSpacing: 0.8, borderBottom: `2px solid ${C.border}` }}>Monthly (×√21)</th>
                <th style={{ textAlign: "right", padding: "6px 12px", fontSize: 10, fontWeight: 700, color: C.textDim, textTransform: "uppercase", letterSpacing: 0.8, borderBottom: `2px solid ${C.border}` }}>Annualised (×√252)</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: `1px solid ${C.borderSub}` }}>
                <td style={{ padding: "10px 12px", fontFamily: font, fontWeight: 600, color: C.text }}>VaR (95%)</td>
                <td style={{ padding: "10px 12px", textAlign: "right", color: C.red, fontWeight: 600 }}>{fmt(pr.var_95_daily_pct)}%</td>
                <td style={{ padding: "10px 12px", textAlign: "right", color: C.red, fontWeight: 600 }}>{fmt(pr.var_95_daily_pct * Math.sqrt(21))}%</td>
                <td style={{ padding: "10px 12px", textAlign: "right", color: C.red, fontWeight: 600 }}>{fmt(pr.var_95_daily_pct * Math.sqrt(252))}%</td>
              </tr>
              <tr style={{ borderBottom: `1px solid ${C.borderSub}` }}>
                <td style={{ padding: "10px 12px", fontFamily: font, fontWeight: 600, color: C.text }}>CVaR (95%)</td>
                <td style={{ padding: "10px 12px", textAlign: "right", color: C.red, fontWeight: 600 }}>{fmt(pr.cvar_95_daily_pct)}%</td>
                <td style={{ padding: "10px 12px", textAlign: "right", color: C.red, fontWeight: 600 }}>{fmt(pr.cvar_95_daily_pct * Math.sqrt(21))}%</td>
                <td style={{ padding: "10px 12px", textAlign: "right", color: C.red, fontWeight: 600 }}>{fmt(pr.cvar_95_daily_pct * Math.sqrt(252))}%</td>
              </tr>
              <tr>
                <td style={{ padding: "10px 12px", fontFamily: font, fontWeight: 600, color: C.text }}>Max Drawdown</td>
                <td colSpan={3} style={{ padding: "10px 12px", textAlign: "right", color: C.red, fontWeight: 600 }}>{fmt(pr.max_drawdown_pct)}% <span style={{ fontFamily: font, fontWeight: 400, color: C.textDim, fontSize: 11 }}>(full period)</span></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div style={{ fontSize: 11, color: C.textDim, marginTop: 10, fontStyle: "italic" }}>
          Time-scaling assumes i.i.d. returns (√T rule). Max drawdown is a period measure and is not time-scaled.
        </div>
      </Card>

      <Card style={{ padding: "20px 28px", marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 36, flexWrap: "wrap" }}>
          <Stat label="Top 5 Weight" value={`${fmt(con.top5_weight)}%`} />
          <Stat label="Top 10 Weight" value={`${fmt(con.top10_weight)}%`} />
          <Stat label="HHI" value={fmt(con.hhi, 4)} sub={`Effective N ≈ ${fmt(con.effective_n, 1)}`} />
        </div>
      </Card>

      {/* Holdings table */}
      <Heading sub="Click headers to sort">Portfolio Holdings</Heading>
      <Card style={{ overflow: "hidden" }}>
        <div style={{ maxHeight: 600, overflowY: "auto", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: font }}>
            <thead><tr>
              <TH k="name" left>Name</TH>
              <TH k="weight">Weight</TH>
              <th style={{ padding: "9px 14px", textAlign: "left", fontSize: 10, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", color: C.textDim, borderBottom: `2px solid ${C.border}`, background: C.bg }}>Sector</th>
              <th style={{ padding: "9px 14px", textAlign: "left", fontSize: 10, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", color: C.textDim, borderBottom: `2px solid ${C.border}`, background: C.bg }}>Country</th>
              <TH k="ann_return_pct">Ann. Ret</TH>
              <TH k="ann_vol_pct">Ann. Vol</TH>
              <TH k="risk_contribution_pct">Risk %</TH>
              <TH k="total_return_pct">2Y Ret</TH>
            </tr></thead>
            <tbody>
              {sorted.map((h, i) => (
                <tr key={h.ticker} style={{ borderBottom: `1px solid ${C.borderSub}`, background: i % 2 ? C.bg : C.white }}>
                  <td style={{ padding: "11px 14px" }}><span style={{ fontWeight: 600, color: C.text }}>{h.name}</span><br /><span style={{ fontSize: 11, fontFamily: mono, color: C.textDim }}>{h.ticker}</span></td>
                  <td style={{ padding: "11px 14px", textAlign: "right", fontFamily: mono, fontWeight: 700 }}>{fmt(h.weight)}%</td>
                  <td style={{ padding: "11px 14px" }}><Pill>{h.sector}</Pill></td>
                  <td style={{ padding: "11px 14px", fontSize: 12, color: C.textSec }}>{h.country}</td>
                  <td style={{ padding: "11px 14px", textAlign: "right", fontFamily: mono, fontWeight: 600, color: h.ann_return_pct >= 0 ? C.green : C.red }}>{fmtPct(h.ann_return_pct)}</td>
                  <td style={{ padding: "11px 14px", textAlign: "right", fontFamily: mono, color: C.textSec }}>{fmt(h.ann_vol_pct)}%</td>
                  <td style={{ padding: "11px 14px", textAlign: "right", fontFamily: mono }}>{fmt(h.risk_contribution_pct)}%</td>
                  <td style={{ padding: "11px 14px", textAlign: "right", fontFamily: mono, fontWeight: 600, color: h.total_return_pct >= 0 ? C.green : C.red }}>{fmtPct(h.total_return_pct)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   ALLOCATION TAB
   ═══════════════════════════════════════════════════════════════════════════ */

const AllocationTab = ({ DATA }) => {
  const sectorData = DATA.sector_allocation.map((s, i) => ({ ...s, fill: C.chart[i % C.chart.length] }));
  const countryData = DATA.country_allocation.map((c, i) => ({ ...c, fill: C.chart[i % C.chart.length] }));

  const PLabel = ({ weight, cx, cy, midAngle, innerRadius, outerRadius }) => {
    if (weight < 6) return null;
    const r = Math.PI / 180, rad = innerRadius + (outerRadius - innerRadius) * 0.5;
    return <text x={cx + rad * Math.cos(-midAngle * r)} y={cy + rad * Math.sin(-midAngle * r)} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight={700}>{fmt(weight, 1)}%</text>;
  };

  const Leg = ({ data, k }) => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "5px 16px", marginTop: 14 }}>
      {data.map((d, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
          <div style={{ width: 10, height: 10, borderRadius: 3, background: d.fill }} />
          <span style={{ color: C.textSec, fontWeight: 500 }}>{d[k]}</span>
          <span style={{ fontFamily: mono, color: C.textDim, fontSize: 11 }}>{fmt(d.weight, 1)}%</span>
        </div>
      ))}
    </div>
  );

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <Heading>Sector Allocation</Heading>
          <Card style={{ padding: 20 }}>
            <ResponsiveContainer width="100%" height={250}><PieChart><Pie data={sectorData} dataKey="weight" nameKey="sector" cx="50%" cy="50%" outerRadius={100} innerRadius={50} label={PLabel} labelLine={false} stroke={C.white} strokeWidth={2.5}>{sectorData.map((s, i) => <Cell key={i} fill={s.fill} />)}</Pie><Tooltip content={<TT />} /></PieChart></ResponsiveContainer>
            <Leg data={sectorData} k="sector" />
          </Card>
        </div>
        <div>
          <Heading>Geographic Allocation</Heading>
          <Card style={{ padding: 20 }}>
            <ResponsiveContainer width="100%" height={250}><PieChart><Pie data={countryData} dataKey="weight" nameKey="country" cx="50%" cy="50%" outerRadius={100} innerRadius={50} label={PLabel} labelLine={false} stroke={C.white} strokeWidth={2.5}>{countryData.map((c, i) => <Cell key={i} fill={c.fill} />)}</Pie><Tooltip content={<TT />} /></PieChart></ResponsiveContainer>
            <Leg data={countryData} k="country" />
          </Card>
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <Heading sub="Marginal contribution to total portfolio volatility">Risk Contribution</Heading>
        <Card style={{ padding: "16px 20px", marginBottom: 12, background: C.accentLight, border: `1px solid ${C.accent}22` }}>
          <div style={{ fontSize: 13, color: C.textSec, lineHeight: 1.7 }}>
            <strong style={{ color: C.text }}>What is risk contribution?</strong> A holding's weight tells you how much capital is allocated; its risk contribution tells you how much of the portfolio's volatility it actually drives. A stock can have a small weight but a large risk contribution if it is volatile and highly correlated with other holdings. Conversely, a large position in a low-correlation asset may contribute less risk than its weight suggests. When risk contribution significantly exceeds weight, the position is a disproportionate source of portfolio risk.
          </div>
        </Card>
        <Card style={{ padding: 20 }}>
          <ResponsiveContainer width="100%" height={700}>
            <BarChart data={[...DATA.holdings].sort((a, b) => b.risk_contribution_pct - a.risk_contribution_pct).slice(0, 20)} layout="vertical" margin={{ left: 150, right: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.borderSub} horizontal={false} />
              <XAxis type="number" tick={{ fill: C.textDim, fontSize: 10, fontFamily: mono }} tickFormatter={v => `${v}%`} />
              <YAxis type="category" dataKey="name" tick={{ fill: C.textSec, fontSize: 11 }} width={140} />
              <Tooltip content={<TT />} />
              <Bar dataKey="risk_contribution_pct" name="Risk %" fill={C.accent} radius={[0, 5, 5, 0]} barSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div style={{ marginTop: 24 }}>
        <Heading sub="Divergence reveals hidden concentration">Weight vs Risk Contribution</Heading>
        <Card style={{ padding: 20 }}>
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={[...DATA.holdings].sort((a, b) => b.weight - a.weight).slice(0, 15)} margin={{ bottom: 50 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.borderSub} />
              <XAxis dataKey="ticker" tick={{ fill: C.textDim, fontSize: 9, fontFamily: mono, angle: -45, textAnchor: "end" }} interval={0} height={50} />
              <YAxis tick={{ fill: C.textDim, fontSize: 10, fontFamily: mono }} tickFormatter={v => `${v}%`} />
              <Tooltip content={<TT />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="weight" name="Weight" fill={C.accent} radius={[3, 3, 0, 0]} barSize={14} />
              <Bar dataKey="risk_contribution_pct" name="Risk Contribution" fill={C.amber} radius={[3, 3, 0, 0]} barSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   PERFORMANCE TAB
   ═══════════════════════════════════════════════════════════════════════════ */

const PerformanceTab = ({ DATA }) => {
  const topC = DATA.performance_attribution.slice(0, 10);
  const bottomC = [...DATA.performance_attribution].slice(-5).reverse();
  const cumRet = useMemo(() => (DATA.cumulative_returns || []).filter((_, i) => i % 3 === 0), [DATA]);
  const hasBench = cumRet.length > 0 && cumRet[0].benchmark_return != null;

  const Row = ({ c }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${C.borderSub}` }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{c.name}</div>
        <div style={{ fontSize: 11, color: C.textDim }}><span style={{ fontFamily: mono }}>{c.ticker}</span> · {fmt(c.weight)}% · {fmtPct(c.stock_return_pct)}</div>
      </div>
      <div style={{ fontFamily: mono, fontWeight: 700, fontSize: 13, padding: "3px 10px", borderRadius: 5, color: c.contribution_pct >= 0 ? C.green : C.red, background: c.contribution_pct >= 0 ? C.greenLight : C.redLight }}>
        {c.contribution_pct >= 0 ? "+" : ""}{fmt(c.contribution_pct)}%
      </div>
    </div>
  );

  return (
    <div>
      <Heading sub={hasBench ? "Portfolio vs MSCI World benchmark (2-year lookback)" : "Weighted portfolio cumulative return (2-year lookback)"}>Cumulative Performance</Heading>
      <Card style={{ padding: 20, marginBottom: 24 }}>
        {cumRet.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={cumRet}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.borderSub} />
              <XAxis dataKey="date" tick={{ fill: C.textDim, fontSize: 10 }} tickFormatter={d => d.slice(0, 7)} interval={Math.floor(cumRet.length / 8)} />
              <YAxis tick={{ fill: C.textDim, fontSize: 10, fontFamily: mono }} tickFormatter={v => `${v}%`} />
              <Tooltip content={<TT />} />
              <ReferenceLine y={0} stroke={C.border} strokeDasharray="3 3" />
              <Line type="monotone" dataKey="cumulative_return" name="Portfolio" stroke={C.accent} dot={false} strokeWidth={2.5} />
              {hasBench && <Line type="monotone" dataKey="benchmark_return" name="MSCI World" stroke={C.textDim} dot={false} strokeWidth={1.5} strokeDasharray="6 3" />}
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : <div style={{ padding: 40, textAlign: "center", color: C.textDim }}>No data</div>}
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <Heading sub="Largest positive weighted contributions">Top Contributors</Heading>
          <Card style={{ padding: "8px 20px" }}>{topC.map((c, i) => <Row key={i} c={c} />)}</Card>
        </div>
        <div>
          <Heading sub="Largest negative weighted contributions">Bottom Contributors</Heading>
          <Card style={{ padding: "8px 20px" }}>{bottomC.map((c, i) => <Row key={i} c={c} />)}</Card>
        </div>
      </div>

    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   FACTOR ANALYSIS TAB
   ═══════════════════════════════════════════════════════════════════════════ */

const FactorTab = ({ DATA }) => {
  const fa = DATA.factor_analysis;
  if (!fa || !fa.holdings?.length) return <div style={{ padding: 40, color: C.textDim, textAlign: "center" }}>Factor data unavailable — re-run the data pipeline (v3).</div>;

  const sortedBeta = [...fa.holdings].sort((a, b) => b.beta - a.beta);
  const sortedAlpha = [...fa.holdings].sort((a, b) => b.alpha_pct - a.alpha_pct);

  const decompData = [
    { name: "Systematic (β × Market)", value: fa.systematic_return_pct, fill: C.accentMid },
    { name: "Idiosyncratic (α)", value: fa.idiosyncratic_return_pct, fill: fa.idiosyncratic_return_pct >= 0 ? C.green : C.red },
  ];

  const pr = DATA.portfolio_risk;

  return (
    <div>
      {/* Summary strip */}
      <Card style={{ padding: "24px 28px", marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 40, flexWrap: "wrap", alignItems: "flex-start" }}>
          <Stat label="Portfolio β" value={fmt(fa.portfolio_beta)} sub={`vs ${fa.benchmark_name}`} size="lg" />
          <Stat label="Benchmark Return" value={fmtPct(fa.benchmark_return_pct)} size="lg" />
          <Stat label="Portfolio Return" value={fmtPct(pr.annualised_return_pct)} color={C.green} size="lg" />
          <Stat label="Systematic" value={fmtPct(fa.systematic_return_pct)} sub="β × market" size="lg" />
          <Stat label="Idiosyncratic (α)" value={fmtPct(fa.idiosyncratic_return_pct)} color={fa.idiosyncratic_return_pct >= 0 ? C.green : C.red} sub="Stock selection" size="lg" />
        </div>
      </Card>

      <Card style={{ padding: "16px 20px", marginTop: 16, marginBottom: 20, background: C.accentLight, border: `1px solid ${C.accent}22` }}>
        <div style={{ fontSize: 13, color: C.textSec, lineHeight: 1.7 }}>
          <strong style={{ color: C.text }}>Interpretation:</strong> The fund slightly trails the MSCI World on a raw cumulative basis (as seen in the performance tab), but achieves this with a portfolio beta of just <span style={{ fontFamily: mono, fontWeight: 700 }}>0.67</span>, meaning it takes roughly a third less market risk. Adjusting for that lower risk exposure, the fund generates <span style={{ fontFamily: mono, fontWeight: 700, color: C.green }}>+6.89%</span> annualised alpha through stock selection. This is a lower-beta, quality-biased portfolio that earns its return from picking winners, not from market exposure. Note that measured beta may appear low partly because many holdings trade on non-US exchanges with different trading hours and currencies, which reduces observed correlation with the USD-denominated MSCI World benchmark.
        </div>
      </Card>

      {/* Return decomposition bar */}
      <Heading sub="How much of the portfolio's return came from market exposure vs stock selection">Return Decomposition</Heading>
      <Card style={{ padding: 20, marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 0, height: 40, borderRadius: 8, overflow: "hidden", border: `1px solid ${C.border}` }}>
          {decompData.map((d, i) => {
            const totalAbs = decompData.reduce((s, x) => s + Math.abs(x.value), 0);
            const pct = totalAbs > 0 ? Math.abs(d.value) / totalAbs * 100 : 50;
            return (
              <div key={i} style={{ width: `${pct}%`, height: "100%", background: d.fill, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 12, fontWeight: 700, fontFamily: mono, minWidth: 80 }}>
                {d.value >= 0 ? "+" : ""}{fmt(d.value)}%
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 20, marginTop: 10 }}>
          {decompData.map((d, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.textSec }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: d.fill }} />
              {d.name}
            </div>
          ))}
        </div>
      </Card>

      {/* Per-holding betas */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <Heading sub="Higher β = more sensitive to market moves">Stock Betas (highest to lowest)</Heading>
          <Card style={{ padding: 20 }}>
            <ResponsiveContainer width="100%" height={440}>
              <BarChart data={sortedBeta} layout="vertical" margin={{ left: 140, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.borderSub} horizontal={false} />
                <XAxis type="number" tick={{ fill: C.textDim, fontSize: 10, fontFamily: mono }} domain={[0, 'auto']} />
                <YAxis type="category" dataKey="name" tick={{ fill: C.textSec, fontSize: 10 }} width={130} />
                <Tooltip content={<TT />} />
                <ReferenceLine x={1} stroke={C.textDim} strokeDasharray="4 4" label={{ value: "β=1", fill: C.textDim, fontSize: 10 }} />
                <Bar dataKey="beta" name="Beta" barSize={13} radius={[0, 4, 4, 0]}>
                  {sortedBeta.map((d, i) => <Cell key={i} fill={d.beta > 1.1 ? C.red : d.beta < 0.9 ? C.green : C.accentMid} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
        <div>
          <Heading sub="Annualised excess return over β-adjusted benchmark">Stock Alphas</Heading>
          <Card style={{ padding: 20 }}>
            <ResponsiveContainer width="100%" height={440}>
              <BarChart data={sortedAlpha} layout="vertical" margin={{ left: 140, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.borderSub} horizontal={false} />
                <XAxis type="number" tick={{ fill: C.textDim, fontSize: 10, fontFamily: mono }} tickFormatter={v => `${v}%`} />
                <YAxis type="category" dataKey="name" tick={{ fill: C.textSec, fontSize: 10 }} width={130} />
                <Tooltip content={<TT />} />
                <ReferenceLine x={0} stroke={C.textDim} strokeDasharray="4 4" />
                <Bar dataKey="alpha_pct" name="Alpha %" barSize={13} radius={[0, 4, 4, 0]}>
                  {sortedAlpha.map((d, i) => <Cell key={i} fill={d.alpha_pct >= 0 ? C.green : C.red} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   WHAT-IF TOOL
   ═══════════════════════════════════════════════════════════════════════════ */

const WhatIfTab = ({ DATA }) => {
  const corrMatrix = DATA.correlation_matrix.matrix;
  const baseHoldings = DATA.holdings;

  // Reconstruct covariance matrix from correlation + volatilities
  const vols = useMemo(() => baseHoldings.map(h => h.ann_vol_pct / 100), [baseHoldings]);
  const covMatrix = useMemo(() => {
    const n = vols.length;
    const cov = Array.from({ length: n }, () => Array(n).fill(0));
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        cov[i][j] = corrMatrix[i][j] * vols[i] * vols[j];
      }
    }
    return cov;
  }, [corrMatrix, vols]);

  const [overrides, setOverrides] = useState({});

  const computePortfolio = useCallback((weightOverrides) => {
    const n = baseHoldings.length;
    const rawWeights = baseHoldings.map((h, i) => weightOverrides[i] ?? h.weight);
    const totalW = rawWeights.reduce((s, w) => s + w, 0);
    const w = rawWeights.map(wi => wi / totalW);

    // Portfolio vol = sqrt(w' * Σ * w)
    let variance = 0;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        variance += w[i] * w[j] * covMatrix[i][j];
      }
    }
    const vol = Math.sqrt(Math.max(0, variance));

    // Weighted return
    const ret = w.reduce((s, wi, i) => s + wi * (baseHoldings[i].ann_return_pct / 100), 0);

    // Per-holding risk contribution
    const mctr = [];
    for (let i = 0; i < n; i++) {
      let sum = 0;
      for (let j = 0; j < n; j++) sum += covMatrix[i][j] * w[j];
      mctr.push(vol > 0 ? sum / vol : 0);
    }
    const ctr = w.map((wi, i) => wi * mctr[i]);
    const ctrSum = ctr.reduce((s, c) => s + c, 0);
    const ctrPct = ctr.map(c => ctrSum > 0 ? c / ctrSum * 100 : 0);

    const rf = DATA.metadata.risk_free_rate || 0.045;
    const sharpe = vol > 0 ? (ret - rf) / vol : 0;

    return { vol: vol * 100, ret: ret * 100, sharpe, ctrPct, normWeights: w.map(x => x * 100) };
  }, [baseHoldings, covMatrix, DATA.metadata.risk_free_rate]);

  const base = useMemo(() => computePortfolio({}), [computePortfolio]);
  const adjusted = useMemo(() => computePortfolio(overrides), [computePortfolio, overrides]);
  const hasChanges = Object.keys(overrides).length > 0;

  const handleSlider = (idx, val) => {
    const newOverrides = { ...overrides };
    if (Math.abs(val - baseHoldings[idx].weight) < 0.05) {
      delete newOverrides[idx];
    } else {
      newOverrides[idx] = val;
    }
    setOverrides(newOverrides);
  };

  // Show top 15 by weight for the sliders
  const displayHoldings = useMemo(() =>
    baseHoldings.map((h, i) => ({ ...h, idx: i })).sort((a, b) => b.weight - a.weight).slice(0, 15),
    [baseHoldings]
  );

  const deltaVol = adjusted.vol - base.vol;
  const deltaRet = adjusted.ret - base.ret;
  const deltaSharpe = adjusted.sharpe - base.sharpe;

  return (
    <div>
      <Heading sub="Drag sliders to adjust weights and see portfolio risk update in real time">What-If Rebalancing Tool</Heading>

      {/* Impact summary */}
      <Card style={{ padding: "20px 28px", marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: C.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Portfolio Vol</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontSize: 26, fontWeight: 700, fontFamily: mono, color: C.text }}>{fmt(adjusted.vol)}%</span>
              {hasChanges && <span style={{ fontSize: 14, fontWeight: 700, fontFamily: mono, color: deltaVol > 0 ? C.red : C.green }}>{deltaVol > 0 ? "+" : ""}{fmt(deltaVol)}%</span>}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: C.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Ann. Return</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontSize: 26, fontWeight: 700, fontFamily: mono, color: C.text }}>{fmt(adjusted.ret)}%</span>
              {hasChanges && <span style={{ fontSize: 14, fontWeight: 700, fontFamily: mono, color: deltaRet > 0 ? C.green : C.red }}>{deltaRet > 0 ? "+" : ""}{fmt(deltaRet)}%</span>}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: C.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Sharpe</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontSize: 26, fontWeight: 700, fontFamily: mono, color: adjusted.sharpe > 1 ? C.green : C.text }}>{fmt(adjusted.sharpe)}</span>
              {hasChanges && <span style={{ fontSize: 14, fontWeight: 700, fontFamily: mono, color: deltaSharpe > 0 ? C.green : C.red }}>{deltaSharpe > 0 ? "+" : ""}{fmt(deltaSharpe)}</span>}
            </div>
          </div>
          {hasChanges && (
            <button onClick={() => setOverrides({})} style={{ alignSelf: "center", padding: "8px 18px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.white, color: C.textSec, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: font }}>
              Reset All
            </button>
          )}
        </div>
      </Card>

      {/* Sliders */}
      <Card style={{ padding: "16px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 32px" }}>
          {displayHoldings.map(h => {
            const curr = overrides[h.idx] ?? h.weight;
            const changed = overrides[h.idx] != null;
            return (
              <div key={h.idx} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: `1px solid ${C.borderSub}` }}>
                <div style={{ width: 140, flexShrink: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: changed ? C.accent : C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{h.name}</div>
                  <div style={{ fontSize: 10, fontFamily: mono, color: C.textDim }}>{h.ticker}</div>
                </div>
                <input
                  type="range" min={0} max={Math.min(20, h.weight * 3)} step={0.1}
                  value={curr}
                  onChange={e => handleSlider(h.idx, parseFloat(e.target.value))}
                  style={{ flex: 1, accentColor: C.accent, cursor: "pointer" }}
                />
                <div style={{ width: 52, textAlign: "right", fontFamily: mono, fontSize: 13, fontWeight: 700, color: changed ? C.accent : C.text }}>
                  {fmt(curr, 1)}%
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ fontSize: 11, color: C.textDim, marginTop: 12, fontStyle: "italic" }}>
          Weights are renormalised to sum to 100% after adjustment. Showing top 15 holdings by weight.
        </div>
      </Card>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   SCENARIO ANALYSIS TAB
   ═══════════════════════════════════════════════════════════════════════════ */

// ─── FIND AND REPLACE the entire ScenarioTab component with this ───

const ScenarioTab = ({ DATA }) => {
  const baseScenarios = useMemo(() => ({
    "Tech Selloff": {
      type: "sector",
      targets: { Technology: -20 },
      unit: "Tech sector",
      headlineShock: 20,
      description: "A sharp correction in technology stocks driven by valuation compression, regulatory action, or a rotation out of growth. The fund's ~28% Technology weight (MSFT, GOOG, ASML, TSM, INTU, WDAY, ADSK) makes this the single largest sector exposure. Only Technology-classified holdings are shocked.",
    },
    "Global Recession": {
      type: "all",
      base: -15,
      unit: "All equities",
      headlineShock: 15,
      description: "A broad-based economic downturn causing a synchronised global equity sell-off. All holdings receive a uniform drawdown regardless of sector or geography. In practice, defensive sectors (Health Care, Consumer Staples) would likely outperform cyclicals, but the uniform shock provides a conservative worst-case baseline.",
    },
    "Rates Shock": {
      type: "sector",
      targets: { Technology: -8, Financials: 5, "Health Care": -3, Industrials: -4, "Consumer Discretionary": -6, "Consumer Staples": -2, "Communication Services": -5 },
      unit: "Rate change (bps)",
      bpsMode: true,
      headlineShock: 100,
      description: "A sudden 100 basis point rise in interest rates. Long-duration growth stocks (Technology, Consumer Discretionary) suffer as higher discount rates compress valuations. Financials benefit from wider net interest margins — this helps the fund's ~32% Financials weight (V, MA, SCHW, LSEG, DB1). The net impact is moderated by the natural hedge between the fund's large Technology and Financials positions.",
    },
    "GBP Strengthens": {
      type: "fx",
      base: -9.1,
      unit: "Non-UK holdings",
      headlineShock: 10,
      description: "Sterling appreciates 10% against all major currencies. As a GBP-denominated fund, overseas holdings lose value when translated back to sterling. With only ~14% in UK-domiciled stocks (LSEG, Unilever, Experian, Rentokil), roughly 83% of the portfolio is exposed to FX translation risk. The shock assumes no currency hedging — each non-UK holding loses 9.1% in GBP terms (the exact translation effect of a 10% sterling appreciation: 1 − 1/1.10). US holdings (~48% weight) are the largest source of exposure. This scenario does not capture operational hedging.",
    },
    "EM Crisis": {
      type: "country",
      targets: { Brazil: -25, Indonesia: -25, India: -20, Taiwan: -10, "Hong Kong": -10 },
      unit: "EM exposure",
      headlineShock: 25,
      description: "A crisis in emerging markets triggered by capital flight, currency collapse, or geopolitical escalation. The fund has ~14% EM exposure across five countries. Brazil (B3) and Indonesia (Bank Central Asia) face the largest shocks due to higher political and currency risk. Taiwan (TSM) and Hong Kong (AIA) receive smaller shocks reflecting their more developed market infrastructure but elevated geopolitical risk. Developed market holdings are unaffected, though in reality there could be knock-on effects.",
    },
  }), []);

  const [selected, setSelected] = useState("Tech Selloff");
  const [magnitude, setMagnitude] = useState(100);

  const scenario = baseScenarios[selected];

  // Compute impact at current magnitude
  const computeImpact = useCallback((sc, scale) => {
    let totalImpact = 0;
    const impacts = [];
    for (const h of DATA.holdings) {
      let shock = 0;
      if (sc.type === "sector" && sc.targets) {
        shock = (sc.targets[h.sector] || 0) * scale / 100;
      } else if (sc.type === "all") {
        shock = sc.base * scale / 100;
      } else if (sc.type === "fx") {
        shock = h.country !== "United Kingdom" ? sc.base * scale / 100 : 0;
      } else if (sc.type === "country" && sc.targets) {
        shock = (sc.targets[h.country] || 0) * scale / 100;
      }
      const wi = shock * h.weight / 100;
      totalImpact += wi;
      impacts.push({ name: h.name, sector: h.sector, country: h.country, weight: h.weight, shock_pct: shock * 100, weighted_pct: wi * 100 });
    }
    return { totalImpact: totalImpact * 100, impacts };
  }, [DATA.holdings]);

  const results = useMemo(() => {
    const { totalImpact, impacts } = computeImpact(scenario, magnitude / 100);
    const losers = [...impacts].sort((a, b) => a.weighted_pct - b.weighted_pct).filter(x => x.weighted_pct < 0).slice(0, 5);
    const gainers = [...impacts].sort((a, b) => b.weighted_pct - a.weighted_pct).filter(x => x.weighted_pct > 0).slice(0, 3);
    return { totalImpact, losers, gainers, dollarImpact: DATA.metadata.total_aum * Math.abs(totalImpact / 100) };
  }, [computeImpact, scenario, magnitude, DATA.metadata.total_aum]);

  // Sensitivity: portfolio impact per 1% move in the headline variable
  // e.g. Tech Selloff headline = 20%, impact = -5.5%, so per 1% tech drop = -5.5/20 = -0.275%
  const sensitivityPer1Pct = useMemo(() => {
    const effectiveShock = scenario.headlineShock * magnitude / 100;
    if (effectiveShock === 0) return 0;
    return results.totalImpact / effectiveShock;
  }, [results.totalImpact, scenario.headlineShock, magnitude]);

  // Baseline assumptions text
  const baselineText = useMemo(() => {
    if (scenario.type === "all") return "All equities: " + scenario.base + "%";
    if (scenario.type === "fx") return "Non-UK holdings: " + scenario.base + "% (assumes " + scenario.headlineShock + "% GBP appreciation, and no hedging)";
    if (scenario.type === "sector" && scenario.targets) {
      return Object.entries(scenario.targets).map(function(entry) { return entry[0] + ": " + (entry[1] > 0 ? "+" : "") + entry[1] + "%"; }).join(", ");
    }
    if (scenario.type === "country" && scenario.targets) {
      return Object.entries(scenario.targets).map(function(entry) { return entry[0] + ": " + entry[1] + "%"; }).join(", ");
    }
    return "";
  }, [scenario]);

  // Bar chart across all scenarios
  const summaryBars = useMemo(() => {
    return Object.entries(baseScenarios).map(([name, sc]) => {
      const scale = name === selected ? magnitude / 100 : 1;
      const { totalImpact } = computeImpact(sc, scale);
      return { name, impact: totalImpact, active: name === selected };
    });
  }, [baseScenarios, selected, magnitude, computeImpact]);

  const magnitudeLabel = scenario.bpsMode
    ? Math.round(magnitude) + "bps"
    : Math.round(magnitude) + "% severity";

  return (
    <div>
      <Heading sub="Adjust scenario severity with the slider to see how portfolio impact changes">Scenario Analysis</Heading>

      <Card style={{ padding: 20, marginBottom: 20 }}>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={summaryBars} margin={{ bottom: 36 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.borderSub} />
            <XAxis dataKey="name" tick={{ fill: C.textDim, fontSize: 11 }} interval={0} height={44} />
            <YAxis tick={{ fill: C.textDim, fontSize: 10, fontFamily: mono }} tickFormatter={function(v) { return v + "%"; }} />
            <Tooltip content={<TT />} />
            <Bar dataKey="impact" name="Portfolio Impact" radius={[4, 4, 0, 0]} barSize={40}>
              {summaryBars.map(function(d, i) { return <Cell key={i} fill={d.impact < -5 ? C.red : d.impact < 0 ? "#d97706" : C.green} opacity={d.active ? 1 : 0.5} />; })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
        {Object.keys(baseScenarios).map(function(n) {
          return (
            <button key={n} onClick={function() { setSelected(n); setMagnitude(100); }} style={{
              padding: "8px 16px", borderRadius: 7, border: "1.5px solid " + (selected === n ? C.accent : C.border),
              background: selected === n ? C.accentLight : C.white, color: selected === n ? C.accent : C.textSec,
              fontSize: 12, fontWeight: selected === n ? 700 : 500, cursor: "pointer", fontFamily: font,
            }}>{n}</button>
          );
        })}
      </div>

      <Card style={{ padding: "16px 24px", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.text, minWidth: 120 }}>Scenario Severity</div>
          <input
            type="range" min={10} max={200} step={5} value={magnitude}
            onChange={function(e) { setMagnitude(parseInt(e.target.value)); }}
            style={{ flex: 1, accentColor: C.accent, cursor: "pointer" }}
          />
          <div style={{ fontFamily: mono, fontSize: 14, fontWeight: 700, color: C.accent, minWidth: 90, textAlign: "right" }}>{magnitudeLabel}</div>
        </div>
        <div style={{ fontSize: 11, color: C.textDim, marginTop: 6 }}>
          100% = base scenario. Drag to stress-test at higher or lower severity.
        </div>
      </Card>

      <Card style={{ padding: "16px 20px", marginBottom: 12 }}>
        <div style={{ fontSize: 13, color: C.textSec, lineHeight: 1.7 }}>
          <strong style={{ color: C.text }}>{selected}:</strong> {scenario.description}
        </div>
      </Card>

      <Card style={{ padding: "16px 20px", marginBottom: 12, background: C.bg, border: "1px solid " + C.border }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 6 }}>Baseline Shocks (at 100% severity)</div>
        <div style={{ fontSize: 12, color: C.textSec, fontFamily: mono, lineHeight: 1.8 }}>{baselineText}</div>
      </Card>

      <Card style={{ padding: "16px 20px", marginBottom: 16, background: C.accentLight, border: "1px solid " + C.accent + "22" }}>
        <div style={{ fontSize: 13, color: C.textSec, lineHeight: 1.7 }}>
          <strong style={{ color: C.text }}>Sensitivity:</strong> For every <span style={{ fontFamily: mono, fontWeight: 700, color: C.accent }}>1%</span> {scenario.bpsMode ? "rate move (1bp)" : "move in the primary shock variable"}, the portfolio changes by approximately <span style={{ fontFamily: mono, fontWeight: 700, color: sensitivityPer1Pct < 0 ? C.red : C.green }}>{fmtPct(sensitivityPer1Pct)}</span> ({fmtM(DATA.metadata.total_aum * Math.abs(sensitivityPer1Pct) / 100)}). At current severity ({magnitudeLabel}), the total impact is <span style={{ fontFamily: mono, fontWeight: 700, color: results.totalImpact < 0 ? C.red : C.green }}>{fmtPct(results.totalImpact)}</span>.
        </div>
      </Card>

      <Card style={{ padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 20 }}>
          <div style={{ fontSize: 34, fontWeight: 800, fontFamily: mono, color: results.totalImpact < -5 ? C.red : "#92400e" }}>{fmtPct(results.totalImpact)}</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Estimated Impact — {selected}</div>
            <div style={{ fontSize: 12, color: C.textDim }}>{"≈ " + fmtM(results.dollarImpact) + " on " + fmtM(DATA.metadata.total_aum) + " · " + magnitudeLabel}</div>
          </div>
        </div>

        {results.losers.length > 0 && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 10 }}>Most Impacted</div>
            {results.losers.map(function(l, i) {
              return (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid " + C.borderSub }}>
                  <div>
                    <span style={{ fontWeight: 500, color: C.text, fontSize: 13 }}>{l.name}</span>
                    <span style={{ color: C.textDim, fontSize: 11, marginLeft: 8 }}>({fmtPct(l.shock_pct)} shock · {fmt(l.weight)}% weight)</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 60, height: 4, background: C.borderSub, borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ width: Math.min(100, Math.abs(l.weighted_pct) / 2 * 100) + "%", height: "100%", background: C.red, borderRadius: 2 }} />
                    </div>
                    <span style={{ fontFamily: mono, fontSize: 12, fontWeight: 600, color: C.red, minWidth: 55, textAlign: "right" }}>{fmtPct(l.weighted_pct)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {results.gainers.length > 0 && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginTop: 16, marginBottom: 10 }}>Beneficiaries</div>
            {results.gainers.map(function(g, i) {
              return (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid " + C.borderSub }}>
                  <div>
                    <span style={{ fontWeight: 500, color: C.text, fontSize: 13 }}>{g.name}</span>
                    <span style={{ color: C.textDim, fontSize: 11, marginLeft: 8 }}>({fmtPct(g.shock_pct)} · {fmt(g.weight)}%)</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 60, height: 4, background: C.borderSub, borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ width: Math.min(100, Math.abs(g.weighted_pct) / 2 * 100) + "%", height: "100%", background: C.green, borderRadius: 2 }} />
                    </div>
                    <span style={{ fontFamily: mono, fontSize: 12, fontWeight: 600, color: C.green, minWidth: 55, textAlign: "right" }}>{fmtPct(g.weighted_pct)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   CORRELATION TAB
   ═══════════════════════════════════════════════════════════════════════════ */

const CorrelationTab = ({ DATA }) => {
  const { tickers, matrix } = DATA.correlation_matrix;
  const n = tickers.length;
  const cs = Math.max(18, Math.min(24, 650 / n));

  const gc = (v) => v >= 1 ? "#1e40af" : v > 0.6 ? "#b91c1c" : v > 0.45 ? "#f87171" : v > 0.3 ? "#fca5a5" : v > 0.15 ? "#fee2e2" : v > 0 ? "#fef2f2" : "#eff6ff";

  const highCorr = useMemo(() => {
    const p = [];
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      const h1 = DATA.holdings[i], h2 = DATA.holdings[j];
      if (h1 && h2) p.push({ pair: `${h1.name.slice(0, 20)} / ${h2.name.slice(0, 20)}`, corr: matrix[i][j], sameSector: h1.sector === h2.sector, cw: h1.weight + h2.weight });
    }
    return p.sort((a, b) => b.corr - a.corr).filter(x => x.corr > 0.55).slice(0, 10);
  }, [DATA, n, matrix]);

  return (
    <div>
      <Heading sub="Pairwise return correlations (2-year daily returns)">Correlation Heatmap</Heading>
      <Card style={{ padding: 14, overflowX: "auto", marginBottom: 24 }}>
        <div style={{ display: "inline-block" }}>
          <div style={{ display: "flex", marginLeft: 120 }}>
            {tickers.map((t, i) => <div key={i} style={{ width: cs, fontSize: 7, color: C.textDim, transform: "rotate(-65deg)", transformOrigin: "bottom left", whiteSpace: "nowrap", height: 65, display: "flex", alignItems: "flex-end", fontWeight: 500 }}>{t}</div>)}
          </div>
          {matrix.map((row, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center" }}>
              <div style={{ width: 120, fontSize: 8, color: C.textSec, paddingRight: 5, textAlign: "right", flexShrink: 0, fontWeight: 500 }}>{tickers[i]}</div>
              {row.map((v, j) => <div key={j} style={{ width: cs, height: cs, background: gc(v), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 6, color: v > 0.55 ? "white" : v > 0.3 ? "#991b1b" : C.textDim, fontWeight: v > 0.5 ? 700 : 400, border: `0.5px solid ${C.white}` }} title={`${tickers[i]} × ${tickers[j]}: ${v}`}>{cs >= 22 ? v.toFixed(1) : ""}</div>)}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, fontSize: 10, color: C.textDim }}>
          <span style={{ fontFamily: mono }}>0.0</span>{[0, 0.15, 0.3, 0.45, 0.6, 1].map(v => <div key={v} style={{ width: 20, height: 10, background: gc(v), borderRadius: 2, border: `1px solid ${C.border}` }} />)}<span style={{ fontFamily: mono }}>1.0</span>
        </div>
      </Card>

      <Heading sub="Pairs with ρ > 0.55 — potential hidden concentration">Highest Correlated Pairs</Heading>
      <Card style={{ padding: 16 }}>
        {highCorr.length === 0 ? <div style={{ color: C.green, fontWeight: 600, fontSize: 13, padding: 8 }}>✓ No pairs above 0.55</div> : (
          highCorr.map((p, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 4px", borderBottom: i < highCorr.length - 1 ? `1px solid ${C.borderSub}` : "none" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{p.pair}</div>
                <div style={{ fontSize: 11, color: C.textDim }}>Combined: <span style={{ fontFamily: mono, fontWeight: 600 }}>{fmt(p.cw)}%</span> · {p.sameSector ? <Pill color={C.amber} bg={C.amberLight}>Same sector</Pill> : "Cross-sector"}</div>
              </div>
              <div style={{ fontSize: 15, fontWeight: 800, fontFamily: mono, color: p.corr > 0.7 ? C.red : C.amber, padding: "3px 12px", borderRadius: 6, background: p.corr > 0.7 ? C.redLight : C.amberLight }}>{fmt(p.corr)}</div>
            </div>
          ))
        )}
      </Card>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   METHODOLOGY / ABOUT TAB
   ═══════════════════════════════════════════════════════════════════════════ */

const AboutTab = () => {
  const Sec = ({ title, children }) => (
    <div style={{ marginBottom: 28 }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: "0 0 10px" }}>{title}</h3>
      <div style={{ fontSize: 13, color: C.textSec, lineHeight: 1.75 }}>{children}</div>
    </div>
  );
  const Term = ({ name, children }) => (
    <div style={{ marginBottom: 16, paddingLeft: 16, borderLeft: `3px solid ${C.accent}` }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 4 }}>{name}</div>
      <div style={{ fontSize: 13, color: C.textSec, lineHeight: 1.7 }}>{children}</div>
    </div>
  );
  const F = ({ children }) => (
    <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "12px 16px", fontFamily: mono, fontSize: 12, color: C.text, margin: "10px 0", lineHeight: 1.6 }}>{children}</div>
  );

  return (
    <div>
      <Heading sub="How each metric is calculated, where the data comes from, and what to watch out for">Methodology & Definitions</Heading>
      <Card style={{ padding: "28px 32px" }}>

        <Sec title="Data Source">
          <p style={{ margin: "0 0 8px" }}>Daily adjusted closing prices for each holding are pulled from <strong>Yahoo Finance</strong> (<code style={{ background: C.bg, padding: "2px 6px", borderRadius: 4, fontFamily: mono, fontSize: 12 }}>yfinance</code>) over a 2-year window (Jan 2024 – Dec 2025). Prices are adjusted for splits and dividends.</p>
          <p style={{ margin: "0 0 8px" }}>Weights come from the fund's official holdings report as of 31 December 2025. The ~3.5% cash position is excluded from return and risk calculations but appears in allocation breakdowns. Of the 32 listed equity holdings, one — Magnum Ice Cream Co. N.V. (ICE.AS), a recent Unilever spin-off at just 0.19% weight — is excluded because it has been delisted from yahoo finance and has no free reliable price history.</p>
          <p style={{ margin: 0 }}>Since the holdings trade across multiple exchanges with different calendars, returns are forward-filled over exchange holidays to avoid false zero-return entries in cross-asset correlations.</p>
        </Sec>

        <Sec title="Returns">
          <Term name="Daily Simple Returns">
            <F>r_t = (P_t − P_t₋₁) / P_t₋₁</F>
            <p style={{ margin: "6px 0 0" }}>I use simple (not log) returns because they are additive across holdings — you can weight them directly to get the portfolio return.</p>
          </Term>
          <Term name="Annualised Return">
            <F>Annualised Return = (1 + mean daily return)²⁵² − 1</F>
            <p style={{ margin: "6px 0 0" }}>Compounds the average daily return over 252 trading days. Assumes daily returns are i.i.d., which is standard but not strictly true.</p>
          </Term>
          <Term name="Portfolio Return">Weighted average of each holding's annualised return, with weights normalised to sum to 100% (excluding cash).</Term>
          <Term name="Period Return">Total price return from first to last closing price over the ~2-year window.</Term>
        </Sec>

        <Sec title="Risk Metrics">
          <Term name="Annualised Volatility">
            <F>Annualised Vol = σ_daily × √252</F>
            <p style={{ margin: "6px 0 0" }}>Standard deviation of daily returns scaled to annual terms. The √T scaling assumes independence across days.</p>
          </Term>
          <Term name="Sharpe Ratio">
            <F>Sharpe = (Annualised Return − R_f) / Annualised Volatility</F>
            <p style={{ margin: "6px 0 0" }}>I use R_f = 4.5%, based on the approximate average 3-month US Treasury bill yield over 2024–2025. Ideally a GBP-denominated fund would use a UK gilt rate, but the difference is small and US T-bills are the more widely used convention. A Sharpe above 1.0 is generally considered strong.</p>
          </Term>
          <Term name="Value at Risk (VaR) — 95%">
            <F>VaR₉₅ = 5th percentile of daily portfolio returns</F>
            <p style={{ margin: "6px 0 0" }}>Interpretation: on 95% of days, the portfolio loses no more than this amount. This is <strong>historical VaR</strong> — taken directly from the empirical distribution, with no normality assumption. The Overview tab also shows monthly (×√21) and annualised (×√252) scaled versions.</p>
          </Term>
          <Term name="Conditional VaR (CVaR)">
            <F>CVaR₉₅ = average of all daily returns below the 5th percentile</F>
            <p style={{ margin: "6px 0 0" }}>Also called Expected Shortfall. Where VaR tells you the threshold of the worst 5% of days, CVaR tells you the average loss on those days. It is always worse (more negative) than VaR.</p>
          </Term>
          <Term name="Maximum Drawdown">
            <F>Max DD = largest peak-to-trough decline in cumulative portfolio value</F>
            <p style={{ margin: "6px 0 0" }}>A single period measure — not time-scaled. Tells you the worst loss a buy-and-hold investor would have experienced.</p>
          </Term>
        </Sec>

        <Sec title="Risk Contribution">
          <p style={{ margin: "0 0 10px" }}>The question this answers: <strong>which positions are actually driving portfolio risk?</strong> Weight alone does not tell you — a low-weight stock can be a big risk driver if it is volatile and correlated with the rest of the portfolio.</p>
          <Term name="Marginal Contribution to Risk (MCTR)">
            <F>MCTR_i = (Σ × w)_i / σ_portfolio</F>
            <p style={{ margin: "6px 0 0" }}>How much portfolio vol would increase if you added a small amount more of stock i. Σ is the annualised covariance matrix, w is the weight vector.</p>
          </Term>
          <Term name="Contribution to Risk (CTR)">
            <F>CTR_i = w_i × MCTR_i</F>
            <F>Risk Contribution % = CTR_i / Σ(CTR) × 100</F>
            <p style={{ margin: "6px 0 0" }}>These sum to 100%. For example, Microsoft has 8.5% weight but ~11% risk contribution — it is a disproportionate risk driver. Unilever has 3.5% weight but near-zero risk contribution — it diversifies the portfolio.</p>
          </Term>
        </Sec>

        <Sec title="Factor Analysis">
          <Term name="Benchmark">
            <p style={{ margin: 0 }}>I use the iShares MSCI World ETF (URTH) as the market proxy. It tracks ~1,500 large and mid-cap stocks across 23 developed markets. An important caveat: the fund holds ~14% in emerging markets (Brazil, India, Indonesia, Taiwan, Hong Kong) which are <strong>not</strong> in MSCI World. This means measured alpha may partly reflect EM performance rather than pure stock selection.</p>
          </Term>
          <Term name="Market Beta (β)">
            <F>β_i = Cov(r_i, r_market) / Var(r_market)</F>
            <p style={{ margin: "6px 0 0" }}>Sensitivity of each stock to the benchmark. β = 1 means the stock moves 1:1 with the market. The portfolio beta of ~0.67 appears low partly because many holdings trade on non-US exchanges with different hours and currencies, which reduces measured correlation with the USD-denominated benchmark. A local-currency or hedged analysis would likely show a higher beta.</p>
          </Term>
          <Term name="Alpha (α)">
            <F>α_i = Annualised Return_i − β_i × Benchmark Return</F>
            <p style={{ margin: "6px 0 0" }}>Excess return not explained by market exposure. Positive α suggests stock selection is adding value beyond what market beta alone would deliver.</p>
          </Term>
          <Term name="Return Decomposition">
            <p style={{ margin: 0 }}>Portfolio return is split into <strong>systematic</strong> (β × benchmark return) and <strong>idiosyncratic</strong> (the remainder). This tells you whether the PM is generating returns by taking market risk or by picking stocks.</p>
          </Term>
        </Sec>

        <Sec title="What-If Tool">
          <p style={{ margin: 0 }}>The rebalancing tool reconstructs the covariance matrix client-side from the correlation matrix and individual volatilities: <strong>Cov(i,j) = ρ(i,j) × σ_i × σ_j</strong>. When you move a slider, weights are renormalised to 100% and portfolio vol is recalculated as <strong>σ_p = √(w′Σw)</strong>. This assumes the covariance structure stays the same under rebalancing, which is a simplification since large weight shifts would change the dynamics in practice.</p>
        </Sec>

        <Sec title="Concentration">
          <Term name="HHI and Effective N">
            <F>HHI = Σ (w_i)²{"      "}Effective N = 1 / HHI</F>
            <p style={{ margin: "6px 0 0" }}>HHI ranges from 0 (perfectly spread) to 1 (single holding). Effective N tells you how many equal-weight positions the portfolio behaves like. A 31-stock fund with Effective N ≈ 27 has moderate concentration.</p>
          </Term>
        </Sec>

        <Sec title="Scenario Analysis">
          <p style={{ margin: "0 0 10px" }}>Each scenario applies predefined shocks by sector or country. The severity slider lets you scale them up or down. Baseline assumptions at 100%:</p>
          <Term name="Tech Selloff">Technology holdings: −20%.</Term>
          <Term name="Global Recession">All equities: −15% uniform drawdown.</Term>
          <Term name="Rates +100bps">Sector-differentiated: Tech −8%, Financials +5%, Health Care −3%, Industrials −4%, Consumer Disc. −6%, Consumer Staples −2%, Comms −5%. Financials benefit from wider net interest margins.</Term>
          <Term name="GBP Strengthens +10%">Non-UK holdings: −9.1%. This is the exact translation effect of a 10% sterling appreciation (1 − 1/1.10), assuming no currency hedging. UK-domiciled holdings (LSEG, Unilever, Experian, Rentokil) are unaffected. In practice, impact would be smaller because many holdings earn revenue globally, providing a natural hedge.</Term>
          <Term name="EM Crisis">Brazil −25%, Indonesia −25%, India −20%, Taiwan −10%, Hong Kong −10%. Developed market holdings unaffected.</Term>
          <p style={{ margin: "10px 0 0", fontStyle: "italic", color: C.textDim }}>These are simplified heuristic tests. They do not capture contagion, liquidity effects, or stock-specific responses. Each scenario description on the Scenarios tab provides more context on the assumptions.</p>
        </Sec>

        <Sec title="Limitations">
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {[
              "Returns are price-based; dividends beyond Yahoo Finance's adjustment methodology are not captured separately.",
              "Currency effects are only modelled explicitly in the GBP scenario. Daily returns for non-UK stocks include FX moves implicitly.",
              "Covariance is estimated from historical data and may not hold in future — correlations tend to spike during crises.",
              "Scenarios use fixed heuristic shocks, not empirically calibrated factor betas.",
              "VaR and CVaR describe the past, not the future. Time-scaling via √T assumes i.i.d. returns.",
              "Weights are a snapshot at 31 Dec 2025 and do not reflect any subsequent rebalancing.",
              "Factor analysis is single-factor (market only). A Fama-French 3 or 5-factor model would separate size, value, and momentum effects.",
              "Portfolio beta may be understated due to asynchronous trading hours across global exchanges.",
              "The Sharpe ratio uses US T-bill rates rather than UK gilt rates as the risk-free proxy.",
            ].map((t, i) => (
              <div key={i} style={{ display: "flex", gap: 8, fontSize: 13, color: C.textSec, lineHeight: 1.6 }}><span style={{ color: C.amber, fontWeight: 700, flexShrink: 0 }}>•</span>{t}</div>
            ))}
          </div>
        </Sec>
      </Card>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN APP SHELL
   ═══════════════════════════════════════════════════════════════════════════ */

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "allocation", label: "Allocation" },
  { id: "performance", label: "Performance" },
  { id: "factors", label: "Factors" },
  { id: "whatif", label: "What-If" },
  { id: "scenarios", label: "Scenarios" },
  { id: "correlation", label: "Correlation" },
  { id: "about", label: "Methodology" },
];

export default function App() {
  const [DATA, setDATA] = useState(null);
  const [tab, setTab] = useState("overview");

  useEffect(() => {
    fetch("/portfolio_data.json").then(r => r.json()).then(setDATA).catch(e => console.error(e));
  }, []);

  if (!DATA) return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: font }}>
      <div style={{ color: C.textDim, fontFamily: mono }}>Loading portfolio data…</div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: font }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* ── Header ── */}
      <header style={{ background: C.white, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 32px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: C.accent, textTransform: "uppercase", letterSpacing: 3, marginBottom: 3 }}>Portfolio Analytics</div>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: C.text, margin: 0, letterSpacing: -0.4 }}>{DATA.metadata.fund_name}</h1>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Liam Hoogstad</div>
              <div style={{ fontSize: 11, color: C.textDim }}>As of {DATA.metadata.as_of_date} · {fmtM(DATA.metadata.total_aum)}</div>
            </div>
          </div>
          <nav style={{ display: "flex", gap: 0, overflowX: "auto" }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                padding: "9px 18px", border: "none", cursor: "pointer", background: "transparent", fontFamily: font,
                fontSize: 13, fontWeight: tab === t.id ? 700 : 500,
                color: tab === t.id ? C.accent : C.textDim,
                borderBottom: `2.5px solid ${tab === t.id ? C.accent : "transparent"}`,
                transition: "all 0.12s", marginBottom: -1, whiteSpace: "nowrap",
              }}>{t.label}</button>
            ))}
          </nav>
        </div>
      </header>

      {/* ── Content ── */}
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 32px" }}>
        {tab === "overview" && <OverviewTab DATA={DATA} />}
        {tab === "allocation" && <AllocationTab DATA={DATA} />}
        {tab === "performance" && <PerformanceTab DATA={DATA} />}
        {tab === "factors" && <FactorTab DATA={DATA} />}
        {tab === "whatif" && <WhatIfTab DATA={DATA} />}
        {tab === "scenarios" && <ScenarioTab DATA={DATA} />}
        {tab === "correlation" && <CorrelationTab DATA={DATA} />}
        {tab === "about" && <AboutTab />}
      </main>

      {/* ── Footer ── */}
      <footer style={{ padding: "18px 32px", textAlign: "center", fontSize: 11, color: C.textDim, borderTop: `1px solid ${C.border}`, background: C.white }}>
        Brown Advisory Global Leaders Fund · Portfolio Analytics Dashboard · Data as of 31 December 2025
      </footer>
    </div>
  );
}
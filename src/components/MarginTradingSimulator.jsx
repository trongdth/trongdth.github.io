import { useState, useEffect } from "react";

const C = {
  bg: "#0a0e17", card: "#111827", cardBorder: "#1e293b", accent: "#00e5ff",
  green: "#00e676", red: "#ff1744", orange: "#ff9100", yellow: "#ffd600",
  text: "#e2e8f0", muted: "#64748b", dim: "#334155", darkBg: "#060a12", purple: "#b388ff",
};
const mono = { fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" };

// Number formatting helpers
const fmt = (n, decimals = 0) => {
  const abs = Math.abs(n);
  return (n < 0 ? "-" : "") + "$" + abs.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};
const fmtSign = (n, decimals = 0) => {
  const abs = Math.abs(n);
  const prefix = n >= 0 ? "+" : "-";
  return prefix + "$" + abs.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};

// ─── Learn Concepts ───
const concepts = [
  {
    title: "📈 Long vs Short",
    color: C.accent,
    content: [
      { label: "Long (Buy)", detail: "You BET price goes UP. Buy low, sell high → Profit.", icon: "🟢" },
      { label: "Short (Sell)", detail: "You BET price goes DOWN. Sell high, buy back low → Profit.", icon: "🔴" },
    ],
    example: { title: "Example — BTC at $60,000", lines: [
      "LONG: Buy 0.1667 BTC ($10k) at $60k → price $65k → sell → +$833",
      "SHORT: Sell 0.1667 BTC ($10k) at $60k → price $55k → buy back → +$833",
    ]},
  },
  {
    title: "💰 Margin: Cross vs Isolated",
    color: C.orange,
    content: [
      { label: "Isolated Margin", detail: "Only the margin assigned to THIS position is at risk. Liquidated? Lose only that margin.", icon: "🔒" },
      { label: "Cross Margin", detail: "Your ENTIRE wallet backs ALL positions. More buffer, but if liquidated you lose EVERYTHING.", icon: "🌐" },
    ],
    example: { title: "Example — $10k wallet, $2k margin, 10x", lines: [
      "ISOLATED: Liquidated? Lose $2,000. Wallet still has $8,000.",
      "CROSS: Liquidated? Could lose entire $10,000.",
      "CROSS with -$4k PnL → available = $10k - $2k - $4k = $4,000",
    ]},
  },
  {
    title: "💸 Trading Fees",
    color: C.purple,
    content: [
      { label: "Fee Rate", detail: "% fee per trade. Taker (market order) ≈ 0.075%. Maker (limit order) ≈ 0.02%.", icon: "📋" },
      { label: "Entry Fee", detail: "Entry Fee = Position Value × Fee Rate. Paid when opening.", icon: "➡️" },
      { label: "Exit Fee (Long)", detail: "Exit Fee = Position Value × Fee Rate. Same as entry.", icon: "⬅️" },
      { label: "Exit Fee (Short)", detail: "Exit Fee = Position Value × (1 + 1/Leverage) × Fee Rate. Higher because exchange hedges against price rise.", icon: "⚠️" },
    ],
    example: { title: "Example — Long 1 BTC at $70k, 10x, 0.075% fee", lines: [
      "Position Value = $70,000",
      "Entry Fee = $70,000 × 0.075% = $52.50",
      "Exit Fee (Long) = $70,000 × 0.075% = $52.50",
      "Exit Fee (Short) = $70,000 × (1 + 1/10) × 0.075% = $57.75",
    ]},
  },
  {
    title: "🏦 Margin & Order Cost",
    color: C.yellow,
    content: [
      { label: "Initial Margin (IM)", detail: "IM = Position Value / Leverage + Entry Fee. The actual cost to open.", icon: "📐" },
      { label: "Maintenance Margin (MM)", detail: "MM = Position Value × MMR%. The minimum to keep position alive. Usually 0.4-0.5%.", icon: "🔻" },
      { label: "Order Cost", detail: "Order Cost = Initial Margin + Entry Fee + Exit Fee. Total wallet balance needed to place order.", icon: "💵" },
    ],
    example: { title: "Example — Long 1 BTC at $70k, 10x, 0.075% fee", lines: [
      "IM = $70,000 / 10 + $52.50 = $7,052.50",
      "MM = $70,000 × 0.5% = $350",
      "Order Cost = $7,052.50 + $52.50 + $52.50 = $7,157.50",
      "→ Your wallet needs ≥ $7,157.50 to open this position",
    ]},
  },
  {
    title: "💥 Liquidation",
    color: C.red,
    content: [
      { label: "What is it?", detail: "When losses eat your margin down to Maintenance Margin level, exchange FORCE-CLOSES your position.", icon: "⚠️" },
      { label: "Isolated Long", detail: "Liq Price = Entry × (1 − 1/Leverage + MMR)", icon: "📊" },
      { label: "Isolated Short", detail: "Liq Price = Entry × (1 + 1/Leverage + MMR)", icon: "📊" },
    ],
    example: { title: "Example — Long BTC $70k, 10x, MMR 0.5%", lines: [
      "Liq = $70,000 × (1 - 1/10 + 0.5%) = $70,000 × 0.905 = $63,350",
      "Without MMR: $70,000 × 0.9 = $63,000 (less accurate)",
      "The MMR makes liq price slightly HIGHER = more dangerous",
    ]},
  },
  {
    title: "📊 PnL (Profit & Loss)",
    color: C.green,
    content: [
      { label: "Unrealized PnL", detail: "Floating PnL before closing. Long: Qty × (Mark − Entry). Short: Qty × (Entry − Mark).", icon: "📐" },
      { label: "Realized PnL", detail: "Actual profit after closing = Unrealized PnL − Entry Fee − Exit Fee.", icon: "✅" },
      { label: "ROE%", detail: "Return on Equity = (PnL / Margin) × 100. 10x leverage + 5% price move = 50% ROE.", icon: "🚀" },
    ],
    example: { title: "Example — Short 1 BTC at $70k, now $65k, 0.075% fee", lines: [
      "Unrealized PnL = (70,000 − 65,000) × 1 = +$5,000",
      "Entry Fee = $70,000 × 0.075% = $52.50",
      "Exit Fee = $65,000 × 0.075% = $48.75",
      "Realized PnL = $5,000 − $52.50 − $48.75 = +$4,898.75",
    ]},
  },
];

// ─── Calc Engine (with fees + MMR) ───
function calcResults(entry, current, leverage, margin, direction, marginMode, walletBalance, feeRate = 0.075, mmr = 0.5) {
  const fr = feeRate / 100;
  const mr = mmr / 100;
  const positionSize = margin * leverage;
  const quantity = positionSize / entry;

  // Fees
  const entryFee = positionSize * fr;
  const exitFeeAtCurrent = direction === "short"
    ? positionSize * (1 + 1 / leverage) * fr
    : positionSize * fr;
  const exitFeeAtEntry = direction === "short"
    ? positionSize * (1 + 1 / leverage) * fr
    : positionSize * fr;

  // Initial Margin & Order Cost
  const initialMargin = positionSize / leverage + entryFee;
  const maintenanceMargin = positionSize * mr;
  const orderCost = initialMargin + entryFee + exitFeeAtEntry;

  // PnL
  const unrealizedPnl = direction === "long"
    ? quantity * (current - entry)
    : quantity * (entry - current);
  const realizedPnl = unrealizedPnl - entryFee - exitFeeAtCurrent;
  const roe = (unrealizedPnl / margin) * 100;

  // Liquidation (team doc formulas with MMR)
  const effectiveMargin = marginMode === "cross" ? walletBalance : margin;
  let liqPrice;
  if (marginMode === "isolated") {
    liqPrice = direction === "long"
      ? entry * (1 - 1 / leverage + mr)
      : entry * (1 + 1 / leverage + mr);
  } else {
    liqPrice = direction === "long"
      ? entry - effectiveMargin / quantity
      : entry + effectiveMargin / quantity;
    // Adjust for MMR+fees
    liqPrice = direction === "long"
      ? liqPrice / (1 - (mr + fr))
      : liqPrice / (1 + (mr + fr));
  }
  liqPrice = Math.max(0, liqPrice);

  const isLiquidated = direction === "long" ? current <= liqPrice : current >= liqPrice;
  const marginLeft = effectiveMargin + unrealizedPnl;

  return {
    positionSize, quantity, unrealizedPnl, realizedPnl, roe, liqPrice,
    isLiquidated, effectiveMargin, marginLeft,
    entryFee, exitFee: exitFeeAtCurrent, initialMargin, maintenanceMargin, orderCost,
  };
}

// ─── Shared UI Components ───
function ConceptCard({ concept, index }) {
  const [open, setOpen] = useState(index === 0);
  return (
    <div style={{ background: C.card, border: `1px solid ${open ? concept.color + "55" : C.cardBorder}`, borderRadius: 16, marginBottom: 16, overflow: "hidden", transition: "all 0.3s ease" }}>
      <div onClick={() => setOpen(!open)} style={{ padding: "18px 24px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", userSelect: "none" }}>
        <span style={{ fontSize: 17, fontWeight: 700, color: concept.color, ...mono }}>{concept.title}</span>
        <span style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.3s", fontSize: 16, color: C.muted }}>▼</span>
      </div>
      {open && (
        <div style={{ padding: "0 24px 24px" }}>
          {concept.content.map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 14, marginBottom: 14, padding: "14px 18px", background: C.darkBg, borderRadius: 12, borderLeft: `3px solid ${concept.color}` }}>
              <span style={{ fontSize: 24, flexShrink: 0 }}>{item.icon}</span>
              <div>
                <div style={{ fontWeight: 700, color: C.text, marginBottom: 4, ...mono, fontSize: 16 }}>{item.label}</div>
                <div style={{ color: C.muted, fontSize: 15, lineHeight: 1.6 }}>{item.detail}</div>
              </div>
            </div>
          ))}
          <div style={{ marginTop: 16, padding: "16px 18px", background: `${concept.color}08`, border: `1px dashed ${concept.color}33`, borderRadius: 12 }}>
            <div style={{ fontWeight: 700, color: concept.color, fontSize: 15, marginBottom: 10, ...mono }}>{concept.example.title}</div>
            {concept.example.lines.map((line, i) => (
              <div key={i} style={{ color: C.text, fontSize: 14, lineHeight: 1.7, ...mono, paddingLeft: 12, borderLeft: `2px solid ${concept.color}22`, marginBottom: 6 }}>{line}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Slider({ label, value, onChange, min, max, step, unit, color, tooltip }) {
  const [showTip, setShowTip] = useState(false);
  const pct = Math.max(0, Math.min(100, ((value - min) / ((max - min) || 1)) * 100));
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, alignItems: "center" }}>
        <span style={{ color: C.muted, fontSize: 14, ...mono, display: "flex", alignItems: "center", gap: 6 }}>
          {label}
          {tooltip && (
            <span onMouseEnter={() => setShowTip(true)} onMouseLeave={() => setShowTip(false)} onClick={() => setShowTip(!showTip)}
              style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 18, height: 18, borderRadius: "50%", background: C.dim, color: C.accent, fontSize: 12, fontWeight: 800, cursor: "help", position: "relative" }}>
              ?
              {showTip && <span style={{ position: "absolute", bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)", background: C.card, border: `1px solid ${C.accent}44`, borderRadius: 10, padding: "10px 14px", fontSize: 13, color: C.text, width: 280, lineHeight: 1.6, fontWeight: 400, zIndex: 100, boxShadow: `0 4px 20px ${C.darkBg}`, ...mono }}>{tooltip}</span>}
            </span>
          )}
        </span>
        <span style={{ color: color || C.accent, fontWeight: 700, fontSize: 16, ...mono }}>
          {unit === "$" ? `$${value.toLocaleString()}` : unit === "%" ? `${value}%` : `${value}${unit}`}
        </span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: "100%", background: `linear-gradient(to right, ${color || C.accent} 0%, ${color || C.accent} ${pct}%, ${C.dim} ${pct}%, ${C.dim} 100%)` }} />
    </div>
  );
}

function ToggleGroup({ options, value, onChange, color }) {
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
      {options.map((opt) => (
        <button key={opt.value} onClick={() => onChange(opt.value)} style={{
          flex: 1, padding: "10px 12px", border: `1.5px solid ${value === opt.value ? (color || C.accent) : C.dim}`,
          borderRadius: 10, background: value === opt.value ? `${color || C.accent}15` : "transparent",
          color: value === opt.value ? (color || C.accent) : C.muted,
          fontWeight: 700, fontSize: 15, cursor: "pointer", ...mono, transition: "all 0.2s",
        }}>{opt.icon} {opt.label}</button>
      ))}
    </div>
  );
}

function MetricBox({ label, value, sub, color, big }) {
  return (
    <div style={{ background: C.darkBg, borderRadius: 12, padding: big ? "20px 16px" : "14px 16px", border: `1px solid ${color}22`, textAlign: "center", flex: 1, minWidth: 0 }}>
      <div style={{ color: C.muted, fontSize: 12, ...mono, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
      <div style={{ color, fontWeight: 800, fontSize: big ? 26 : 18, ...mono }}>{value}</div>
      {sub && <div style={{ color: C.muted, fontSize: 12, ...mono, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function PriceBar({ entry, current, liqPrice, direction }) {
  const range = entry * 0.3;
  const lo = Math.min(entry - range, liqPrice * 0.95);
  const hi = Math.max(entry + range, liqPrice * 1.05);
  const span = hi - lo || 1;
  const toP = (p) => Math.max(0, Math.min(100, ((p - lo) / span) * 100));
  const eP = toP(entry), cP = toP(current), lP = toP(liqPrice);
  const ok = direction === "long" ? current >= entry : current <= entry;
  return (
    <div style={{ marginTop: 20, marginBottom: 8 }}>
      <div style={{ fontSize: 12, color: C.muted, ...mono, marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>Price visualization</div>
      <div style={{ position: "relative", height: 80, background: C.darkBg, borderRadius: 10, overflow: "hidden", border: `1px solid ${C.cardBorder}` }}>
        <div style={{ position: "absolute", top: 0, bottom: 0, left: `${Math.min(eP, cP)}%`, width: `${Math.abs(cP - eP)}%`, background: ok ? `${C.green}18` : `${C.red}18` }} />
        <div style={{ position: "absolute", top: 0, bottom: 0, left: `${lP}%`, width: 2, background: C.red, zIndex: 2 }}>
          <div style={{ position: "absolute", top: 6, left: "50%", transform: "translateX(-50%)", fontSize: 12, color: C.red, fontWeight: 700, whiteSpace: "nowrap", ...mono }}>LIQ</div>
          <div style={{ position: "absolute", top: 22, left: "50%", transform: "translateX(-50%)", fontSize: 13, color: C.red, fontWeight: 800, whiteSpace: "nowrap", ...mono }}>${liqPrice.toLocaleString(undefined, {maximumFractionDigits: 0})}</div>
        </div>
        <div style={{ position: "absolute", top: 0, bottom: 0, left: `${eP}%`, width: 2, background: C.accent, zIndex: 3 }}>
          <div style={{ position: "absolute", bottom: 18, left: "50%", transform: "translateX(-50%)", fontSize: 12, color: C.accent, fontWeight: 700, whiteSpace: "nowrap", ...mono }}>ENTRY</div>
          <div style={{ position: "absolute", bottom: 4, left: "50%", transform: "translateX(-50%)", fontSize: 13, color: C.accent, fontWeight: 800, whiteSpace: "nowrap", ...mono }}>${entry.toLocaleString()}</div>
        </div>
        <div style={{ position: "absolute", top: 8, bottom: 8, left: `calc(${cP}% - 2px)`, width: 5, background: ok ? C.green : C.red, borderRadius: 2, zIndex: 4, boxShadow: `0 0 12px ${ok ? C.green : C.red}66` }}>
          <div style={{ position: "absolute", top: "50%", left: 14, transform: "translateY(-50%)", fontSize: 14, color: ok ? C.green : C.red, fontWeight: 800, whiteSpace: "nowrap", ...mono }}>NOW ${current.toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
}

// Stat row helper
function StatRow({ items }) {
  return (
    <div style={{ display: "flex", gap: 1, borderRadius: 8, overflow: "hidden", marginBottom: 14 }}>
      {items.map((s, i) => (
        <div key={i} style={{ flex: 1, padding: "10px 8px", background: C.darkBg, textAlign: "center" }}>
          <div style={{ fontSize: 11, color: C.dim, ...mono, textTransform: "uppercase", marginBottom: 4 }}>{s.label}</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: s.color || C.text, ...mono }}>{s.val}</div>
        </div>
      ))}
    </div>
  );
}

// Subsection container
function Sub({ borderColor, children, style: s }) {
  return (
    <div style={{ padding: "16px 18px", background: C.darkBg, borderRadius: 12, border: `1px solid ${borderColor || C.cardBorder}`, ...s }}>
      {children}
    </div>
  );
}
function SubLabel({ color, label, hint }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: color || C.muted, ...mono, textTransform: "uppercase", letterSpacing: 1 }}>{label}</span>
      {hint && <span style={{ fontSize: 12, color: C.dim, ...mono }}>— {hint}</span>}
    </div>
  );
}

const scenarios = [
  { name: "🐂 Safe Long", entry: 60000, leverage: 3, margin: 2000, wallet: 10000, direction: "long", mode: "isolated", current: 64000 },
  { name: "⚡ Degen 50x", entry: 60000, leverage: 50, margin: 500, wallet: 5000, direction: "long", mode: "isolated", current: 60500 },
  { name: "🐻 Short the Top", entry: 70000, leverage: 10, margin: 3000, wallet: 15000, direction: "short", mode: "cross", current: 65000 },
  { name: "💀 Liq Demo", entry: 60000, leverage: 20, margin: 1000, wallet: 1000, direction: "long", mode: "isolated", current: 57200 },
];

// ═══ MULTI-POSITION ═══
function MultiPositionSim() {
  const [wallet, setWallet] = useState(10000);
  const [positions, setPositions] = useState([
    { id: 1, direction: "long", margin: 2000, leverage: 10, entry: 60000, pnlPct: -20 },
  ]);
  const [newDir, setNewDir] = useState("long");
  const [newMargin, setNewMargin] = useState(8000);
  const [newLev, setNewLev] = useState(10);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  const getPnl = (p) => p.margin * p.leverage * (p.pnlPct / 100);
  const totalUsed = positions.reduce((s, p) => s + p.margin, 0);
  const totalPnl = positions.reduce((s, p) => s + getPnl(p), 0);
  const available = wallet - totalUsed + Math.min(0, totalPnl);

  const tryAdd = () => {
    setError("");
    if (newMargin <= 0) { setError("Margin must be > 0"); return; }
    if (newMargin > available) {
      setError(`Need ${fmt(newMargin)} but only ${fmt(Math.max(0, available))} available.`);
      return;
    }
    setPositions([...positions, { id: Date.now(), direction: newDir, margin: newMargin, leverage: newLev, entry: 60000, pnlPct: 0 }]);
    setShowForm(false); setError("");
  };

  const usedPct = wallet > 0 ? (totalUsed / wallet) * 100 : 0;
  const pnlPct = wallet > 0 ? (Math.min(0, totalPnl) / wallet) * -100 : 0;

  return (
    <div>
      <div style={{ background: C.card, borderRadius: 16, padding: 24, border: `1px solid ${C.cardBorder}`, marginBottom: 20 }}>
        <div style={{ fontSize: 14, color: C.muted, ...mono, marginBottom: 20, textTransform: "uppercase", letterSpacing: 1 }}>Cross margin wallet</div>
        <Sub><SubLabel label="Balance" />
          <Slider label="Wallet Balance" value={wallet} onChange={setWallet} min={1000} max={100000} step={500} unit="$" color={C.accent} />
          <div style={{ marginTop: 4 }}>
            <div style={{ fontSize: 12, color: C.dim, ...mono, marginBottom: 6 }}>WALLET ALLOCATION</div>
            <div style={{ display: "flex", height: 8, borderRadius: 4, overflow: "hidden", background: C.bg }}>
              <div style={{ width: `${usedPct}%`, background: C.orange, transition: "width 0.3s" }} />
              <div style={{ width: `${pnlPct}%`, background: C.red, transition: "width 0.3s" }} />
              <div style={{ flex: 1, background: `${C.accent}22` }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 12, ...mono }}>
              <span style={{ color: C.orange }}>Used {fmt(totalUsed)}</span>
              {totalPnl < 0 && <span style={{ color: C.red }}>Loss {fmt(totalPnl)}</span>}
              <span style={{ color: C.accent }}>Free {fmt(Math.max(0, available))}</span>
            </div>
          </div>
        </Sub>
        <div style={{ marginTop: 14, padding: "12px 14px", background: C.darkBg, borderRadius: 10, ...mono, fontSize: 13, lineHeight: 2, color: C.muted }}>
          <span style={{ color: C.dim }}>// Available = Wallet − Used + min(0, Unrealized PnL)</span><br />
          <span style={{ color: C.text }}>Available</span> = {fmt(wallet)} − {fmt(totalUsed)} + min(0, {fmtSign(totalPnl)}) = <span style={{ color: available > 0 ? C.accent : C.red, fontWeight: 700 }}>{fmt(Math.max(0, available))}</span>
        </div>
      </div>

      <div style={{ background: C.card, borderRadius: 16, padding: 24, border: `1px solid ${C.cardBorder}`, marginBottom: 20 }}>
        <div style={{ fontSize: 14, color: C.muted, ...mono, marginBottom: 20, textTransform: "uppercase", letterSpacing: 1 }}>Open positions ({positions.length})</div>
        {positions.length === 0 && <div style={{ padding: "30px 20px", textAlign: "center", color: C.dim, ...mono, fontSize: 15 }}>No open positions.</div>}
        {positions.map((pos, idx) => {
          const pnl = getPnl(pos);
          const posSize = pos.margin * pos.leverage;
          return (
            <Sub key={pos.id} style={{ marginBottom: idx < positions.length - 1 ? 12 : 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: 8, background: `${pos.direction === "long" ? C.green : C.red}15`, fontSize: 16 }}>{pos.direction === "long" ? "📈" : "📉"}</span>
                  <div>
                    <div style={{ ...mono, fontSize: 15, fontWeight: 700, color: C.text }}>Position #{idx + 1}</div>
                    <div style={{ ...mono, fontSize: 12, color: C.dim }}>{pos.direction.toUpperCase()} • {pos.leverage}x • {fmt(pos.margin)} margin</div>
                  </div>
                </div>
                <button onClick={() => setPositions(positions.filter(p => p.id !== pos.id))} style={{ background: "transparent", border: `1px solid ${C.dim}`, borderRadius: 6, color: C.muted, ...mono, fontSize: 12, padding: "4px 10px", cursor: "pointer" }}>Close</button>
              </div>
              <StatRow items={[
                { label: "Margin", val: fmt(pos.margin) },
                { label: "Pos Size", val: fmt(posSize) },
                { label: "PnL", val: fmtSign(pnl), color: pnl >= 0 ? C.green : C.red },
                { label: "ROE", val: `${(pnl / pos.margin * 100).toFixed(0)}%`, color: pnl >= 0 ? C.green : C.red },
              ]} />
              <Slider label="Simulate PnL %" value={pos.pnlPct} onChange={(v) => setPositions(positions.map(p => p.id === pos.id ? { ...p, pnlPct: v } : p))} min={-100} max={200} step={1} unit="%" color={pnl >= 0 ? C.green : C.red} />
            </Sub>
          );
        })}
      </div>

      <div style={{ background: C.card, borderRadius: 16, padding: 24, border: `1px solid ${C.cardBorder}`, marginBottom: 20 }}>
        {!showForm ? (
          <button onClick={() => setShowForm(true)} style={{ width: "100%", padding: "16px 20px", background: "transparent", border: `1.5px dashed ${C.dim}`, borderRadius: 12, color: C.muted, fontWeight: 600, fontSize: 15, cursor: "pointer", ...mono }}>+ Open new position</button>
        ) : (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 14, color: C.muted, ...mono, textTransform: "uppercase", letterSpacing: 1 }}>New position</div>
              <button onClick={() => { setShowForm(false); setError(""); }} style={{ background: "transparent", border: "none", color: C.dim, ...mono, fontSize: 14, cursor: "pointer" }}>Cancel</button>
            </div>
            <Sub style={{ marginBottom: 14 }}><SubLabel label="Direction" color={C.dim} />
              <ToggleGroup options={[{ value: "long", label: "Long", icon: "📈" }, { value: "short", label: "Short", icon: "📉" }]} value={newDir} onChange={setNewDir} color={newDir === "long" ? C.green : C.red} />
            </Sub>
            <Sub style={{ marginBottom: 14 }}><SubLabel label="Trade parameters" color={C.dim} />
              <Slider label="Margin" value={newMargin} onChange={setNewMargin} min={100} max={Math.max(100, wallet)} step={100} unit="$" color={C.accent} />
              <Slider label="Leverage" value={newLev} onChange={setNewLev} min={1} max={125} step={1} unit="x" color={C.accent} />
              <StatRow items={[
                { label: "Pos Size", val: fmt(newMargin * newLev) },
                { label: "Available", val: fmt(Math.max(0, available)), color: available >= newMargin ? C.accent : C.red },
                { label: "Status", val: available >= newMargin ? "OK" : "BLOCKED", color: available >= newMargin ? C.green : C.red },
              ]} />
            </Sub>
            {error && (
              <div style={{ padding: "12px 16px", background: C.darkBg, border: `1px solid ${C.red}33`, borderRadius: 10, ...mono, fontSize: 13, color: C.muted, marginBottom: 14, lineHeight: 1.8 }}>
                <span style={{ color: C.red, fontWeight: 700 }}>Insufficient margin</span><br />
                Required: <span style={{ color: C.text }}>{fmt(newMargin)}</span> · Available: <span style={{ color: C.red }}>{fmt(Math.max(0, available))}</span>
              </div>
            )}
            <button onClick={tryAdd} style={{ width: "100%", padding: "14px 20px", background: available >= newMargin ? `${C.accent}12` : "transparent", border: `1.5px solid ${available >= newMargin ? C.accent : C.dim}55`, borderRadius: 12, color: available >= newMargin ? C.accent : C.dim, fontWeight: 700, fontSize: 15, cursor: "pointer", ...mono }}>
              {available >= newMargin ? "Open position" : "Try anyway"}
            </button>
          </div>
        )}
      </div>

      <div style={{ padding: "16px 20px", background: C.darkBg, border: `1px solid ${C.cardBorder}`, borderRadius: 12, ...mono, fontSize: 13, color: C.dim, lineHeight: 1.9 }}>
        <span style={{ color: C.muted, fontWeight: 700 }}>Scenario:</span> Wallet $10k · Pos #1: $2k×10x long · Drag PnL to <span style={{ color: C.red }}>−20%</span> · Try $8k margin → <span style={{ color: C.red }}>REJECTED</span>
      </div>
    </div>
  );
}

// ═══ MAIN APP ═══
export default function MarginTradingSimulator() {
  const [tab, setTab] = useState("learn");
  const [entry, setEntry] = useState(60000);
  const [current, setCurrent] = useState(63000);
  const [leverage, setLeverage] = useState(10);
  const [margin, setMargin] = useState(1000);
  const [wallet, setWallet] = useState(10000);
  const [direction, setDirection] = useState("long");
  const [marginMode, setMarginMode] = useState("isolated");
  const [feeRate, setFeeRate] = useState(0.075);
  const [mmr, setMmr] = useState(0.5);

  const clampedMargin = Math.min(margin, wallet);
  const r = calcResults(entry, current, leverage, clampedMargin, direction, marginMode, wallet, feeRate, mmr);

  const handleMarginChange = (v) => setMargin(Math.min(v, wallet));
  const handleWalletChange = (v) => { setWallet(v); if (margin > v) setMargin(v); };

  const loadScenario = (s) => {
    setEntry(s.entry); setCurrent(s.current); setLeverage(s.leverage);
    setMargin(s.margin); setWallet(s.wallet); setDirection(s.direction); setMarginMode(s.mode); setTab("sim");
  };

  const [autoPlay, setAutoPlay] = useState(false);
  const [autoDir, setAutoDir] = useState(1);
  useEffect(() => {
    if (!autoPlay) return;
    const iv = setInterval(() => {
      setCurrent((p) => { const step = entry * 0.002; let n = p + step * autoDir; if (n > entry * 1.25) setAutoDir(-1); if (n < entry * 0.75) setAutoDir(1); return Math.round(n); });
    }, 120);
    return () => clearInterval(iv);
  }, [autoPlay, autoDir, entry]);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", padding: "0 0 40px" }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <style>{`
        input[type=range] {
          -webkit-appearance: none;
          -moz-appearance: none;
          appearance: none;
          width: 100%;
          height: 6px;
          border-radius: 3px;
          outline: none;
          cursor: pointer;
          border: none;
          margin: 0;
          padding: 0;
        }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: ${C.accent};
          cursor: pointer;
          border: 2px solid ${C.bg};
          box-shadow: 0 0 8px ${C.accent}44;
          margin-top: -7px;
        }
        input[type=range]::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: ${C.accent};
          cursor: pointer;
          border: 2px solid ${C.bg};
          box-shadow: 0 0 8px ${C.accent}44;
        }
        input[type=range]::-webkit-slider-runnable-track {
          height: 6px;
          border-radius: 3px;
        }
        input[type=range]::-moz-range-track {
          height: 6px;
          border-radius: 3px;
          border: none;
        }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: ${C.darkBg}; }
        ::-webkit-scrollbar-thumb { background: ${C.dim}; border-radius: 3px; }
      `}</style>

      <div style={{ padding: "28px 24px 20px", background: `linear-gradient(135deg, ${C.darkBg}, ${C.bg})`, borderBottom: `1px solid ${C.cardBorder}`, marginBottom: 24 }}>
        <div style={{ fontSize: 13, color: C.accent, ...mono, letterSpacing: 3, marginBottom: 8, textTransform: "uppercase" }}>Margin Trading Academy</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: C.text, margin: 0, ...mono, lineHeight: 1.2 }}>Long · Short · Liquidation · PnL</h1>
        <p style={{ color: C.muted, fontSize: 15, marginTop: 8, marginBottom: 0, lineHeight: 1.5 }}>Interactive simulator with fees, MMR, and realized PnL</p>
      </div>

      <div style={{ display: "flex", gap: 0, margin: "0 20px 24px", border: `1px solid ${C.cardBorder}`, borderRadius: 12, overflow: "hidden" }}>
        {[{ key: "learn", label: "📚 Learn" }, { key: "sim", label: "🎮 Single Pos" }, { key: "multi", label: "🌐 Multi-Pos" }].map((t, i, arr) => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{ flex: 1, padding: "13px 10px", background: tab === t.key ? `${C.accent}12` : "transparent", color: tab === t.key ? C.accent : C.muted, border: "none", fontWeight: 700, fontSize: 14, cursor: "pointer", ...mono, borderRight: i < arr.length - 1 ? `1px solid ${C.cardBorder}` : "none" }}>{t.label}</button>
        ))}
      </div>

      <div style={{ padding: "0 20px", maxWidth: 700, margin: "0 auto" }}>

        {/* LEARN */}
        {tab === "learn" && (
          <div>
            {concepts.map((c, i) => <ConceptCard key={i} concept={c} index={i} />)}
            <div style={{ marginTop: 24, padding: "20px 24px", background: `${C.accent}08`, border: `1px solid ${C.accent}22`, borderRadius: 16 }}>
              <div style={{ fontWeight: 700, color: C.accent, fontSize: 17, marginBottom: 14, ...mono }}>Try these scenarios</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {scenarios.map((s, i) => (
                  <button key={i} onClick={() => loadScenario(s)} style={{ padding: "12px 14px", background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 10, color: C.text, fontWeight: 600, fontSize: 14, cursor: "pointer", ...mono, textAlign: "left" }}>
                    {s.name}<div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{s.leverage}x {s.direction} · {s.mode}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SINGLE POSITION */}
        {tab === "sim" && (
          <div>
            <div style={{ background: C.card, borderRadius: 16, padding: 24, border: `1px solid ${C.cardBorder}`, marginBottom: 20 }}>
              <div style={{ fontSize: 14, color: C.muted, ...mono, marginBottom: 20, textTransform: "uppercase", letterSpacing: 1 }}>Position setup</div>

              <Sub borderColor={C.cardBorder} style={{ marginBottom: 20 }}>
                <SubLabel color={direction === "long" ? C.green : C.red} label="Direction" hint="which way?" />
                <ToggleGroup options={[{ value: "long", label: "Long", icon: "📈" }, { value: "short", label: "Short", icon: "📉" }]} value={direction} onChange={setDirection} color={direction === "long" ? C.green : C.red} />
                <div style={{ fontSize: 13, color: C.muted, ...mono, marginTop: -8 }}>{direction === "long" ? "Profit when price goes UP" : "Profit when price goes DOWN"}</div>
              </Sub>

              <Sub borderColor={`${C.orange}22`} style={{ marginBottom: 20 }}>
                <SubLabel color={C.orange} label="Margin mode" hint="how much wallet at risk?" />
                <ToggleGroup options={[{ value: "isolated", label: "Isolated", icon: "🔒" }, { value: "cross", label: "Cross", icon: "🌐" }]} value={marginMode} onChange={setMarginMode} color={C.orange} />
                <div style={{ fontSize: 13, color: C.muted, ...mono, marginTop: -8 }}>
                  {marginMode === "isolated" ? "Only assigned margin at risk. Max loss = margin." : "Entire wallet backs position. More buffer, bigger max loss."}
                </div>
              </Sub>

              <Sub borderColor={C.cardBorder} style={{ marginBottom: 20 }}>
                <SubLabel color={C.accent} label="Trade parameters" hint="position size & cost" />
                <Slider label="Entry Price" value={entry} onChange={(v) => { setEntry(v); setCurrent(v); }} min={1000} max={150000} step={500} unit="$" color={C.accent} />
                <Slider label="Leverage" value={leverage} onChange={setLeverage} min={1} max={125} step={1} unit="x" color={C.yellow} />
                <Slider label="Margin (Collateral)" value={clampedMargin} onChange={handleMarginChange} min={100} max={wallet} step={100} unit="$" color={C.green}
                  tooltip="Your deposit. Exchange multiplies by leverage. Can never exceed wallet." />
                <Slider label="Wallet Balance" value={wallet} onChange={handleWalletChange} min={100} max={100000} step={100} unit="$" color={C.orange} />

                <StatRow items={[
                  { label: "Pos Size", val: fmt(r.positionSize) },
                  { label: "Quantity", val: `${r.quantity.toFixed(4)}` },
                  { label: "Init Margin", val: fmt(r.initialMargin) },
                  { label: "Order Cost", val: fmt(r.orderCost) },
                ]} />
              </Sub>

              <Sub borderColor={`${C.purple}22`}>
                <SubLabel color={C.purple} label="Fee & MMR settings" hint="match your exchange" />
                <Slider label="Fee Rate (Taker)" value={feeRate} onChange={setFeeRate} min={0} max={0.2} step={0.005} unit="%" color={C.purple} />
                <Slider label="Maintenance Margin Rate" value={mmr} onChange={setMmr} min={0.1} max={2} step={0.1} unit="%" color={C.purple} />
                <StatRow items={[
                  { label: "Entry Fee", val: fmt(r.entryFee, 2) },
                  { label: "Exit Fee", val: fmt(r.exitFee, 2) },
                  { label: "Maint. Margin", val: fmt(r.maintenanceMargin) },
                ]} />
              </Sub>

              <div style={{ marginTop: 16, display: "flex", justifyContent: "center" }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 18px", background: C.darkBg, borderRadius: 20, border: `1px solid ${C.cardBorder}`, ...mono, fontSize: 14 }}>
                  <span style={{ color: direction === "long" ? C.green : C.red, fontWeight: 700 }}>{direction === "long" ? "📈 LONG" : "📉 SHORT"}</span>
                  <span style={{ color: C.dim }}>+</span>
                  <span style={{ color: C.orange, fontWeight: 700 }}>{marginMode === "isolated" ? "🔒 ISO" : "🌐 CROSS"}</span>
                  <span style={{ color: C.dim }}>•</span>
                  <span style={{ color: C.yellow, fontWeight: 700 }}>{leverage}x</span>
                  <span style={{ color: C.dim }}>•</span>
                  <span style={{ color: C.purple, fontWeight: 700 }}>{feeRate}%</span>
                </div>
              </div>
            </div>

            {/* Price */}
            <div style={{ background: C.card, borderRadius: 16, padding: 24, border: `1px solid ${C.cardBorder}`, marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ fontSize: 14, color: C.muted, ...mono, textTransform: "uppercase", letterSpacing: 1 }}>Simulate price movement</div>
                <button onClick={() => setAutoPlay(!autoPlay)} style={{ padding: "6px 14px", background: autoPlay ? `${C.accent}22` : "transparent", border: `1px solid ${autoPlay ? C.accent : C.dim}`, borderRadius: 8, color: autoPlay ? C.accent : C.muted, fontSize: 13, fontWeight: 700, cursor: "pointer", ...mono }}>{autoPlay ? "Pause" : "Auto"}</button>
              </div>
              <Slider label="Current Price" value={current} onChange={setCurrent} min={Math.max(100, Math.round(entry * 0.5))} max={Math.round(entry * 1.5)} step={Math.max(1, Math.round(entry * 0.001))} unit="$" color={r.unrealizedPnl >= 0 ? C.green : C.red} />
              <PriceBar entry={entry} current={current} liqPrice={r.liqPrice} direction={direction} />
            </div>

            {/* Results */}
            <div style={{
              background: r.isLiquidated ? `linear-gradient(135deg, #1a0000, ${C.card})` : C.card,
              borderRadius: 16, padding: 24, border: `1px solid ${r.isLiquidated ? C.red + "66" : C.cardBorder}`,
              marginBottom: 20, position: "relative", overflow: "hidden",
            }}>
              {r.isLiquidated && <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center", background: `${C.red}08`, zIndex: 0 }}><span style={{ fontSize: 80, opacity: 0.08 }}>X</span></div>}
              <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{ fontSize: 14, color: r.isLiquidated ? C.red : C.muted, ...mono, marginBottom: 16, textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>
                  {r.isLiquidated ? "LIQUIDATED" : "Position results"}
                </div>

                <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
                  <MetricBox label="Unrealized PnL" value={r.isLiquidated ? fmt(-r.effectiveMargin) : fmtSign(r.unrealizedPnl, 2)} color={r.unrealizedPnl >= 0 && !r.isLiquidated ? C.green : C.red} big />
                  <MetricBox label="Realized PnL" value={r.isLiquidated ? fmt(-r.effectiveMargin) : fmtSign(r.realizedPnl, 2)} sub="after fees" color={r.realizedPnl >= 0 && !r.isLiquidated ? C.green : C.red} big />
                  <MetricBox label="ROE" value={`${r.roe >= 0 && !r.isLiquidated ? "+" : ""}${r.isLiquidated ? "-100" : r.roe.toFixed(1)}%`} color={r.roe >= 0 && !r.isLiquidated ? C.green : C.red} big />
                </div>

                <StatRow items={[
                  { label: "Pos Size", val: fmt(r.positionSize) },
                  { label: "Liq Price", val: fmt(r.liqPrice), color: C.red },
                  { label: "Entry Fee", val: fmt(r.entryFee, 2), color: C.purple },
                  { label: "Exit Fee", val: fmt(r.exitFee, 2), color: C.purple },
                ]} />

                <div style={{ marginTop: 14, padding: "14px 16px", background: C.darkBg, borderRadius: 10, ...mono, fontSize: 13, lineHeight: 2, color: C.muted }}>
                  <span style={{ color: C.accent }}>// Breakdown</span><br />
                  Pos Size = {fmt(clampedMargin)} × {leverage}x = <span style={{ color: C.text }}>{fmt(r.positionSize)}</span><br />
                  Entry Fee = {fmt(r.positionSize)} × {feeRate}% = <span style={{ color: C.purple }}>{fmt(r.entryFee, 2)}</span><br />
                  Init Margin = {fmt(r.positionSize)}/{leverage} + {fmt(r.entryFee, 2)} = <span style={{ color: C.text }}>{fmt(r.initialMargin, 2)}</span><br />
                  Maint Margin = {fmt(r.positionSize)} × {mmr}% = <span style={{ color: C.text }}>{fmt(r.maintenanceMargin, 2)}</span><br />
                  Unrealized = {r.quantity.toFixed(4)} × ({direction === "long" ? `${fmt(current)} − ${fmt(entry)}` : `${fmt(entry)} − ${fmt(current)}`}) = <span style={{ color: r.unrealizedPnl >= 0 ? C.green : C.red }}>{fmtSign(r.unrealizedPnl, 2)}</span><br />
                  <span style={{ color: C.green }}>Realized</span> = {fmt(Math.abs(r.unrealizedPnl), 2)} − {fmt(r.entryFee, 2)} − {fmt(r.exitFee, 2)} = <span style={{ color: r.realizedPnl >= 0 ? C.green : C.red }}>{fmtSign(r.realizedPnl, 2)}</span><br />
                  Liq Price ({marginMode}) = <span style={{ color: C.red }}>{fmt(r.liqPrice)}</span>
                  {marginMode === "isolated" && <> = {fmt(entry)} × (1 {direction === "long" ? "−" : "+"} 1/{leverage} + {mmr}%)</>}
                </div>
              </div>
            </div>

            {/* Cross vs Isolated */}
            <div style={{ background: C.card, borderRadius: 16, padding: 24, border: `1px solid ${C.cardBorder}` }}>
              <div style={{ fontSize: 14, color: C.orange, ...mono, marginBottom: 16, textTransform: "uppercase", letterSpacing: 1 }}>Cross vs Isolated</div>
              {(() => {
                const iso = calcResults(entry, current, leverage, clampedMargin, direction, "isolated", wallet, feeRate, mmr);
                const cross = calcResults(entry, current, leverage, clampedMargin, direction, "cross", wallet, feeRate, mmr);
                const rows = [
                  ["Eff. Margin", fmt(clampedMargin), fmt(wallet)],
                  ["Liq Price", fmt(iso.liqPrice), fmt(cross.liqPrice)],
                  ["Max Loss", fmt(clampedMargin), fmt(wallet)],
                  ["Liquidated?", iso.isLiquidated ? "YES" : "No", cross.isLiquidated ? "YES" : "No"],
                ];
                return (
                  <div style={{ ...mono, fontSize: 14 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1, marginBottom: 2 }}>
                      {["", "Isolated", "Cross"].map((h, i) => (
                        <div key={i} style={{ padding: "8px 10px", background: C.darkBg, color: C.muted, fontWeight: 700, fontSize: 12, textTransform: "uppercase" }}>{h}</div>
                      ))}
                    </div>
                    {rows.map((row, i) => (
                      <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1, marginBottom: 1 }}>
                        {row.map((cell, j) => (
                          <div key={j} style={{ padding: "8px 10px", background: j === 0 ? C.darkBg : `${C.darkBg}88`, color: j === 0 ? C.muted : cell === "YES" ? C.red : cell === "No" ? C.green : C.text, fontWeight: j === 0 ? 400 : 600 }}>{cell}</div>
                        ))}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {tab === "multi" && <MultiPositionSim />}
      </div>
    </div>
  );
}

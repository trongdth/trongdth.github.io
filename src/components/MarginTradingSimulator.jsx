import { useState, useEffect } from "react";

const COLORS = {
  bg: "#0a0e17",
  card: "#111827",
  cardBorder: "#1e293b",
  accent: "#00e5ff",
  green: "#00e676",
  red: "#ff1744",
  orange: "#ff9100",
  yellow: "#ffd600",
  text: "#e2e8f0",
  muted: "#64748b",
  dim: "#334155",
  darkBg: "#060a12",
  purple: "#b388ff",
};

// ─── Explanation Sections ───
const concepts = [
  {
    title: "📈 Long vs Short",
    color: COLORS.accent,
    content: [
      {
        label: "Long (Buy)",
        detail:
          "You BET the price will GO UP. You buy at low price, sell at higher price → Profit.",
        icon: "🟢",
      },
      {
        label: "Short (Sell)",
        detail:
          "You BET the price will GO DOWN. You sell at high price, buy back at lower price → Profit.",
        icon: "🔴",
      },
    ],
    example: {
      title: "Example — BTC at $60,000",
      lines: [
        "LONG: Buy 0.1667 BTC ($10k) at $60k → price $65k → sell → Profit = +$833",
        "SHORT: Sell 0.1667 BTC ($10k) at $60k → price $55k → buy back → Profit = +$833",
      ],
    },
  },
  {
    title: "💰 Margin: Cross vs Isolated",
    color: COLORS.orange,
    content: [
      {
        label: "Isolated Margin",
        detail:
          "Only the margin you assign to THIS position is at risk. If liquidated, you lose ONLY that margin — your wallet is safe.",
        icon: "🔒",
      },
      {
        label: "Cross Margin",
        detail:
          "Your ENTIRE wallet balance backs ALL positions. More buffer against liquidation, but if liquidated, you can lose EVERYTHING. Unrealized losses from one position REDUCE available margin for new positions.",
        icon: "🌐",
      },
    ],
    example: {
      title: "Example — $10,000 wallet, $2,000 margin, 10x",
      lines: [
        "ISOLATED: Only $2,000 at risk. Liquidated? Lose $2,000. Wallet still has $8,000.",
        "CROSS: All $10,000 backs the trade. Liquidated? Could lose entire $10,000.",
        "CROSS with -$4k unrealized PnL → available = $10k - $2k(used) - $4k(loss) = $4,000",
        "→ Try the Multi-Pos tab to see this in action!",
      ],
    },
  },
  {
    title: "💥 Liquidation",
    color: COLORS.red,
    content: [
      {
        label: "What is it?",
        detail:
          "When your losses eat up your margin, the exchange FORCE-CLOSES your position to prevent negative balance.",
        icon: "⚠️",
      },
      {
        label: "How it works",
        detail:
          "Liquidation Price depends on: entry price, leverage, position direction, and margin mode (cross/isolated).",
        icon: "📊",
      },
    ],
    example: {
      title: "Example — 10x Leverage Long",
      lines: [
        "Entry: $60,000 | Margin: $6,000 | Position Size: $60,000 (10x)",
        "ISOLATED: Liq ≈ $54,000 (−10% move wipes your $6k margin)",
        "CROSS ($10k wallet): Liq ≈ $50,000 (more buffer from extra wallet funds)",
        "Higher leverage → liq price CLOSER to entry → MORE dangerous",
      ],
    },
  },
  {
    title: "📊 PnL (Profit & Loss)",
    color: COLORS.green,
    content: [
      {
        label: "Formula (Long)",
        detail: "PnL = Quantity × (Current Price − Entry Price)",
        icon: "📐",
      },
      {
        label: "Formula (Short)",
        detail: "PnL = Quantity × (Entry Price − Current Price)",
        icon: "📐",
      },
      {
        label: "ROE%",
        detail:
          "ROE = (PnL / Margin) × 100. With 10x leverage, a 5% price move = 50% ROE!",
        icon: "🚀",
      },
      {
        label: "Quantity",
        detail:
          "Quantity = Position Size / Entry Price. E.g. $10,000 / $60,000 = 0.1667 BTC",
        icon: "🔢",
      },
    ],
    example: {
      title: "Example — 10x Long, Entry $60k, Margin $1,000",
      lines: [
        "Position Size = $1,000 × 10 = $10,000 → Qty = 0.1667 BTC",
        "Price → $63k: PnL = 0.1667 × $3,000 = +$500 | ROE = +50%",
        "Price → $54k: PnL = 0.1667 × -$6,000 = -$1,000 → LIQUIDATED",
      ],
    },
  },
];

// ─── Calc ───
function calcResults(
  entry,
  current,
  leverage,
  margin,
  direction,
  marginMode,
  walletBalance,
) {
  const positionSize = margin * leverage;
  const quantity = positionSize / entry;
  const priceDelta =
    direction === "long"
      ? (current - entry) / entry
      : (entry - current) / entry;
  const pnl = positionSize * priceDelta;
  const roe = (pnl / margin) * 100;
  const effectiveMargin = marginMode === "cross" ? walletBalance : margin;
  let liqPrice =
    direction === "long"
      ? entry * (1 - effectiveMargin / positionSize)
      : entry * (1 + effectiveMargin / positionSize);
  liqPrice = Math.max(0, liqPrice);
  const isLiquidated =
    direction === "long" ? current <= liqPrice : current >= liqPrice;
  const marginLeft = effectiveMargin + pnl;
  return {
    positionSize,
    quantity,
    pnl,
    roe,
    liqPrice,
    isLiquidated,
    effectiveMargin,
    marginLeft,
  };
}

// ─── Shared UI ───
function ConceptCard({ concept, index }) {
  const [open, setOpen] = useState(index === 0);
  return (
    <div
      style={{
        background: COLORS.card,
        border: `1px solid ${open ? concept.color + "55" : COLORS.cardBorder}`,
        borderRadius: 16,
        marginBottom: 16,
        overflow: "hidden",
        transition: "all 0.3s ease",
      }}
    >
      <div
        onClick={() => setOpen(!open)}
        style={{
          padding: "18px 24px",
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          userSelect: "none",
        }}
      >
        <span
          style={{
            fontSize: 17,
            fontWeight: 700,
            color: concept.color,
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {concept.title}
        </span>
        <span
          style={{
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.3s",
            fontSize: 14,
            color: COLORS.muted,
          }}
        >
          ▼
        </span>
      </div>
      {open && (
        <div style={{ padding: "0 24px 24px" }}>
          {concept.content.map((item, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 14,
                marginBottom: 14,
                padding: "14px 18px",
                background: COLORS.darkBg,
                borderRadius: 12,
                borderLeft: `3px solid ${concept.color}`,
              }}
            >
              <span style={{ fontSize: 24, flexShrink: 0 }}>{item.icon}</span>
              <div>
                <div
                  style={{
                    fontWeight: 700,
                    color: COLORS.text,
                    marginBottom: 4,
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 14,
                  }}
                >
                  {item.label}
                </div>
                <div
                  style={{ color: COLORS.muted, fontSize: 13, lineHeight: 1.6 }}
                >
                  {item.detail}
                </div>
              </div>
            </div>
          ))}
          <div
            style={{
              marginTop: 16,
              padding: "16px 18px",
              background: `${concept.color}08`,
              border: `1px dashed ${concept.color}33`,
              borderRadius: 12,
            }}
          >
            <div
              style={{
                fontWeight: 700,
                color: concept.color,
                fontSize: 13,
                marginBottom: 10,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {concept.example.title}
            </div>
            {concept.example.lines.map((line, i) => (
              <div
                key={i}
                style={{
                  color: COLORS.text,
                  fontSize: 12,
                  lineHeight: 1.7,
                  fontFamily: "'JetBrains Mono', monospace",
                  paddingLeft: 12,
                  borderLeft: `2px solid ${concept.color}22`,
                  marginBottom: 6,
                }}
              >
                {line}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Slider({
  label,
  value,
  onChange,
  min,
  max,
  step,
  unit,
  color,
  tooltip,
}) {
  const [showTip, setShowTip] = useState(false);
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  return (
    <div style={{ marginBottom: 18 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 8,
          alignItems: "center",
        }}
      >
        <span
          style={{
            color: COLORS.muted,
            fontSize: 12,
            fontFamily: "'JetBrains Mono', monospace",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          {label}
          {tooltip && (
            <span
              onMouseEnter={() => setShowTip(true)}
              onMouseLeave={() => setShowTip(false)}
              onClick={() => setShowTip(!showTip)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 16,
                height: 16,
                borderRadius: "50%",
                background: COLORS.dim,
                color: COLORS.accent,
                fontSize: 10,
                fontWeight: 800,
                cursor: "help",
                position: "relative",
              }}
            >
              ?
              {showTip && (
                <span
                  style={{
                    position: "absolute",
                    bottom: "calc(100% + 8px)",
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: COLORS.card,
                    border: `1px solid ${COLORS.accent}44`,
                    borderRadius: 10,
                    padding: "10px 14px",
                    fontSize: 11,
                    color: COLORS.text,
                    width: 280,
                    lineHeight: 1.6,
                    fontWeight: 400,
                    zIndex: 100,
                    boxShadow: `0 4px 20px ${COLORS.darkBg}`,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {tooltip}
                </span>
              )}
            </span>
          )}
        </span>
        <span
          style={{
            color: color || COLORS.accent,
            fontWeight: 700,
            fontSize: 14,
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {unit === "$" ? `$${value.toLocaleString()}` : `${value}${unit}`}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          width: "100%",
          height: 6,
          borderRadius: 3,
          appearance: "none",
          background: `linear-gradient(to right, ${color || COLORS.accent} 0%, ${color || COLORS.accent} ${pct}%, ${COLORS.dim} ${pct}%, ${COLORS.dim} 100%)`,
          cursor: "pointer",
          outline: "none",
        }}
      />
    </div>
  );
}

function ToggleGroup({ options, value, onChange, color }) {
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          style={{
            flex: 1,
            padding: "10px 12px",
            border: `1.5px solid ${value === opt.value ? color || COLORS.accent : COLORS.dim}`,
            borderRadius: 10,
            background:
              value === opt.value
                ? `${color || COLORS.accent}15`
                : "transparent",
            color: value === opt.value ? color || COLORS.accent : COLORS.muted,
            fontWeight: 700,
            fontSize: 13,
            cursor: "pointer",
            fontFamily: "'JetBrains Mono', monospace",
            transition: "all 0.2s",
          }}
        >
          {opt.icon} {opt.label}
        </button>
      ))}
    </div>
  );
}

function MetricBox({ label, value, sub, color, big }) {
  return (
    <div
      style={{
        background: COLORS.darkBg,
        borderRadius: 12,
        padding: big ? "20px 16px" : "14px 16px",
        border: `1px solid ${color}22`,
        textAlign: "center",
        flex: 1,
        minWidth: 0,
      }}
    >
      <div
        style={{
          color: COLORS.muted,
          fontSize: 10,
          fontFamily: "'JetBrains Mono', monospace",
          marginBottom: 6,
          textTransform: "uppercase",
          letterSpacing: 1,
        }}
      >
        {label}
      </div>
      <div
        style={{
          color,
          fontWeight: 800,
          fontSize: big ? 22 : 16,
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        {value}
      </div>
      {sub && (
        <div
          style={{
            color: COLORS.muted,
            fontSize: 10,
            fontFamily: "'JetBrains Mono', monospace",
            marginTop: 4,
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

function PriceBar({ entry, current, liqPrice, direction }) {
  const range = entry * 0.3;
  const lo = Math.min(entry - range, liqPrice * 0.95);
  const hi = Math.max(entry + range, liqPrice * 1.05);
  const span = hi - lo || 1;
  const toP = (p) => Math.max(0, Math.min(100, ((p - lo) / span) * 100));
  const eP = toP(entry),
    cP = toP(current),
    lP = toP(liqPrice);
  const ok = direction === "long" ? current >= entry : current <= entry;
  return (
    <div style={{ marginTop: 20, marginBottom: 8 }}>
      <div
        style={{
          fontSize: 10,
          color: COLORS.muted,
          fontFamily: "'JetBrains Mono', monospace",
          marginBottom: 10,
          textTransform: "uppercase",
          letterSpacing: 1,
        }}
      >
        Price Visualization
      </div>
      <div
        style={{
          position: "relative",
          height: 48,
          background: COLORS.darkBg,
          borderRadius: 8,
          overflow: "hidden",
          border: `1px solid ${COLORS.cardBorder}`,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: `${Math.min(eP, cP)}%`,
            width: `${Math.abs(cP - eP)}%`,
            background: ok ? `${COLORS.green}18` : `${COLORS.red}18`,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: `${lP}%`,
            width: 2,
            background: COLORS.red,
            zIndex: 2,
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -2,
              left: "50%",
              transform: "translateX(-50%)",
              fontSize: 8,
              color: COLORS.red,
              fontWeight: 800,
              whiteSpace: "nowrap",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            LIQ ${liqPrice.toFixed(0)}
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: `${eP}%`,
            width: 2,
            background: COLORS.accent,
            zIndex: 3,
          }}
        >
          <div
            style={{
              position: "absolute",
              bottom: -2,
              left: "50%",
              transform: "translateX(-50%)",
              fontSize: 8,
              color: COLORS.accent,
              fontWeight: 800,
              whiteSpace: "nowrap",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            ENTRY ${entry.toFixed(0)}
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            top: 4,
            bottom: 4,
            left: `calc(${cP}% - 1px)`,
            width: 4,
            background: ok ? COLORS.green : COLORS.red,
            borderRadius: 2,
            zIndex: 4,
            boxShadow: `0 0 10px ${ok ? COLORS.green : COLORS.red}66`,
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: 10,
              transform: "translateY(-50%)",
              fontSize: 9,
              color: ok ? COLORS.green : COLORS.red,
              fontWeight: 800,
              whiteSpace: "nowrap",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            NOW ${current.toFixed(0)}
          </div>
        </div>
      </div>
    </div>
  );
}

const scenarios = [
  {
    name: "🐂 Safe Long",
    entry: 60000,
    leverage: 3,
    margin: 2000,
    wallet: 10000,
    direction: "long",
    mode: "isolated",
    current: 64000,
  },
  {
    name: "⚡ Degen 50x",
    entry: 60000,
    leverage: 50,
    margin: 500,
    wallet: 5000,
    direction: "long",
    mode: "isolated",
    current: 60500,
  },
  {
    name: "🐻 Short the Top",
    entry: 70000,
    leverage: 10,
    margin: 3000,
    wallet: 15000,
    direction: "short",
    mode: "cross",
    current: 65000,
  },
  {
    name: "💀 Liq Demo",
    entry: 60000,
    leverage: 20,
    margin: 1000,
    wallet: 1000,
    direction: "long",
    mode: "isolated",
    current: 57200,
  },
];

// ═══ MULTI-POSITION CROSS MARGIN ═══
function MultiPositionSim() {
  const [wallet, setWallet] = useState(10000);
  const [positions, setPositions] = useState([
    {
      id: 1,
      direction: "long",
      margin: 2000,
      leverage: 10,
      entry: 60000,
      pnlPct: -20,
    },
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
    if (newMargin <= 0) {
      setError("Margin must be > 0");
      return;
    }
    if (newMargin > available) {
      setError(
        `Need $${newMargin.toLocaleString()} but only $${Math.max(0, available).toLocaleString()} available.`,
      );
      return;
    }
    setPositions([
      ...positions,
      {
        id: Date.now(),
        direction: newDir,
        margin: newMargin,
        leverage: newLev,
        entry: 60000,
        pnlPct: 0,
      },
    ]);
    setShowForm(false);
    setError("");
  };

  const mono = { fontFamily: "'JetBrains Mono', monospace" };
  const subSection = (borderColor) => ({
    padding: "16px 18px",
    background: COLORS.darkBg,
    borderRadius: 12,
    border: `1px solid ${borderColor || COLORS.cardBorder}`,
  });

  // wallet usage percentage
  const usedPct = wallet > 0 ? (totalUsed / wallet) * 100 : 0;
  const pnlPct = wallet > 0 ? (Math.min(0, totalPnl) / wallet) * -100 : 0;
  const availPct = wallet > 0 ? (Math.max(0, available) / wallet) * 100 : 0;

  return (
    <div>
      {/* ═══ WALLET OVERVIEW ═══ */}
      <div
        style={{
          background: COLORS.card,
          borderRadius: 16,
          padding: 24,
          border: `1px solid ${COLORS.cardBorder}`,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            fontSize: 12,
            color: COLORS.muted,
            ...mono,
            marginBottom: 20,
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          Cross Margin Wallet
        </div>

        {/* Wallet Balance */}
        <div style={subSection(COLORS.cardBorder)}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 14,
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: COLORS.muted,
                ...mono,
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              Balance
            </span>
          </div>
          <Slider
            label="Wallet Balance"
            value={wallet}
            onChange={setWallet}
            min={1000}
            max={100000}
            step={500}
            unit="$"
            color={COLORS.accent}
          />

          {/* Visual wallet bar */}
          <div style={{ marginTop: 4 }}>
            <div
              style={{
                fontSize: 10,
                color: COLORS.dim,
                ...mono,
                marginBottom: 6,
              }}
            >
              WALLET ALLOCATION
            </div>
            <div
              style={{
                display: "flex",
                height: 8,
                borderRadius: 4,
                overflow: "hidden",
                background: COLORS.bg,
              }}
            >
              <div
                style={{
                  width: `${usedPct}%`,
                  background: COLORS.orange,
                  transition: "width 0.3s",
                }}
                title="Margin Used"
              />
              <div
                style={{
                  width: `${pnlPct}%`,
                  background: COLORS.red,
                  transition: "width 0.3s",
                }}
                title="Unrealized Loss"
              />
              <div
                style={{
                  flex: 1,
                  background: `${COLORS.accent}22`,
                  transition: "width 0.3s",
                }}
                title="Available"
              />
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 6,
                fontSize: 10,
                ...mono,
              }}
            >
              <span style={{ color: COLORS.orange }}>
                Used ${totalUsed.toLocaleString()}
              </span>
              {totalPnl < 0 && (
                <span style={{ color: COLORS.red }}>
                  Loss ${totalPnl.toLocaleString()}
                </span>
              )}
              <span style={{ color: COLORS.accent }}>
                Free ${Math.max(0, available).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Formula */}
        <div
          style={{
            marginTop: 14,
            padding: "12px 14px",
            background: COLORS.darkBg,
            borderRadius: 10,
            ...mono,
            fontSize: 11,
            lineHeight: 2,
            color: COLORS.muted,
          }}
        >
          <span style={{ color: COLORS.dim }}>
            // Available = Wallet − Used + min(0, Unrealized PnL)
          </span>
          <br />
          <span style={{ color: COLORS.text }}>Available</span> = $
          {wallet.toLocaleString()} − ${totalUsed.toLocaleString()} + min(0,{" "}
          {totalPnl >= 0 ? "+" : ""}${totalPnl.toLocaleString()}) ={" "}
          <span
            style={{
              color: available > 0 ? COLORS.accent : COLORS.red,
              fontWeight: 700,
            }}
          >
            ${Math.max(0, available).toLocaleString()}
          </span>
        </div>
      </div>

      {/* ═══ OPEN POSITIONS ═══ */}
      <div
        style={{
          background: COLORS.card,
          borderRadius: 16,
          padding: 24,
          border: `1px solid ${COLORS.cardBorder}`,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: COLORS.muted,
              ...mono,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            Open Positions ({positions.length})
          </div>
        </div>

        {positions.length === 0 && (
          <div
            style={{
              padding: "30px 20px",
              textAlign: "center",
              color: COLORS.dim,
              ...mono,
              fontSize: 13,
            }}
          >
            No open positions. Add one below.
          </div>
        )}

        {positions.map((pos, idx) => {
          const pnl = getPnl(pos);
          const posSize = pos.margin * pos.leverage;
          return (
            <div
              key={pos.id}
              style={{
                ...subSection(COLORS.cardBorder),
                marginBottom: idx < positions.length - 1 ? 12 : 0,
              }}
            >
              {/* Position header */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 14,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      background: `${pos.direction === "long" ? COLORS.green : COLORS.red}15`,
                      fontSize: 14,
                    }}
                  >
                    {pos.direction === "long" ? "📈" : "📉"}
                  </span>
                  <div>
                    <div
                      style={{
                        ...mono,
                        fontSize: 13,
                        fontWeight: 700,
                        color: COLORS.text,
                      }}
                    >
                      Position #{idx + 1}
                    </div>
                    <div style={{ ...mono, fontSize: 10, color: COLORS.dim }}>
                      {pos.direction.toUpperCase()} • {pos.leverage}x • $
                      {pos.margin.toLocaleString()} margin
                    </div>
                  </div>
                </div>
                <button
                  onClick={() =>
                    setPositions(positions.filter((p) => p.id !== pos.id))
                  }
                  style={{
                    background: "transparent",
                    border: `1px solid ${COLORS.dim}`,
                    borderRadius: 6,
                    color: COLORS.muted,
                    ...mono,
                    fontSize: 10,
                    padding: "4px 10px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.borderColor = COLORS.red;
                    e.target.style.color = COLORS.red;
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.borderColor = COLORS.dim;
                    e.target.style.color = COLORS.muted;
                  }}
                >
                  Close
                </button>
              </div>

              {/* Position stats row */}
              <div
                style={{
                  display: "flex",
                  gap: 1,
                  marginBottom: 14,
                  borderRadius: 8,
                  overflow: "hidden",
                }}
              >
                {[
                  { label: "Margin", val: `$${pos.margin.toLocaleString()}` },
                  { label: "Pos Size", val: `$${posSize.toLocaleString()}` },
                  {
                    label: "PnL",
                    val: `${pnl >= 0 ? "+" : ""}$${pnl.toLocaleString()}`,
                    color: pnl >= 0 ? COLORS.green : COLORS.red,
                  },
                  {
                    label: "ROE",
                    val: `${((pnl / pos.margin) * 100).toFixed(0)}%`,
                    color: pnl >= 0 ? COLORS.green : COLORS.red,
                  },
                ].map((s, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      padding: "10px 8px",
                      background: COLORS.bg,
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 9,
                        color: COLORS.dim,
                        ...mono,
                        textTransform: "uppercase",
                        marginBottom: 4,
                      }}
                    >
                      {s.label}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: s.color || COLORS.text,
                        ...mono,
                      }}
                    >
                      {s.val}
                    </div>
                  </div>
                ))}
              </div>

              {/* PnL slider */}
              <Slider
                label="Simulate PnL %"
                value={pos.pnlPct}
                onChange={(v) =>
                  setPositions(
                    positions.map((p) =>
                      p.id === pos.id ? { ...p, pnlPct: v } : p,
                    ),
                  )
                }
                min={-100}
                max={200}
                step={1}
                unit="%"
                color={pnl >= 0 ? COLORS.green : COLORS.red}
              />
            </div>
          );
        })}
      </div>

      {/* ═══ ADD NEW POSITION ═══ */}
      <div
        style={{
          background: COLORS.card,
          borderRadius: 16,
          padding: 24,
          border: `1px solid ${COLORS.cardBorder}`,
          marginBottom: 20,
        }}
      >
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            style={{
              width: "100%",
              padding: "16px 20px",
              background: "transparent",
              border: `1.5px dashed ${COLORS.dim}`,
              borderRadius: 12,
              color: COLORS.muted,
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              ...mono,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.target.style.borderColor = COLORS.accent;
              e.target.style.color = COLORS.accent;
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = COLORS.dim;
              e.target.style.color = COLORS.muted;
            }}
          >
            + Open New Position
          </button>
        ) : (
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  color: COLORS.muted,
                  ...mono,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                New Position
              </div>
              <button
                onClick={() => {
                  setShowForm(false);
                  setError("");
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: COLORS.dim,
                  ...mono,
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>

            {/* Direction */}
            <div style={{ ...subSection(COLORS.cardBorder), marginBottom: 14 }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: COLORS.dim,
                  ...mono,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  marginBottom: 10,
                }}
              >
                Direction
              </div>
              <ToggleGroup
                options={[
                  { value: "long", label: "Long", icon: "📈" },
                  { value: "short", label: "Short", icon: "📉" },
                ]}
                value={newDir}
                onChange={setNewDir}
                color={newDir === "long" ? COLORS.green : COLORS.red}
              />
            </div>

            {/* Trade params */}
            <div style={{ ...subSection(COLORS.cardBorder), marginBottom: 14 }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: COLORS.dim,
                  ...mono,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  marginBottom: 10,
                }}
              >
                Trade Parameters
              </div>
              <Slider
                label="Margin"
                value={newMargin}
                onChange={setNewMargin}
                min={100}
                max={Math.max(100, wallet)}
                step={100}
                unit="$"
                color={COLORS.accent}
              />
              <Slider
                label="Leverage"
                value={newLev}
                onChange={setNewLev}
                min={1}
                max={125}
                step={1}
                unit="x"
                color={COLORS.accent}
              />

              {/* Summary row */}
              <div
                style={{
                  display: "flex",
                  gap: 1,
                  borderRadius: 8,
                  overflow: "hidden",
                  marginTop: 4,
                }}
              >
                {[
                  {
                    label: "Pos Size",
                    val: `$${(newMargin * newLev).toLocaleString()}`,
                  },
                  {
                    label: "Available",
                    val: `$${Math.max(0, available).toLocaleString()}`,
                    color: available >= newMargin ? COLORS.accent : COLORS.red,
                  },
                  {
                    label: "Status",
                    val: available >= newMargin ? "OK" : "BLOCKED",
                    color: available >= newMargin ? COLORS.green : COLORS.red,
                  },
                ].map((s, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      padding: "10px 8px",
                      background: COLORS.bg,
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 9,
                        color: COLORS.dim,
                        ...mono,
                        textTransform: "uppercase",
                        marginBottom: 4,
                      }}
                    >
                      {s.label}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: s.color || COLORS.text,
                        ...mono,
                      }}
                    >
                      {s.val}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div
                style={{
                  padding: "12px 16px",
                  background: COLORS.darkBg,
                  border: `1px solid ${COLORS.red}33`,
                  borderRadius: 10,
                  ...mono,
                  fontSize: 11,
                  color: COLORS.muted,
                  marginBottom: 14,
                  lineHeight: 1.8,
                }}
              >
                <span style={{ color: COLORS.red, fontWeight: 700 }}>
                  ✕ Insufficient margin
                </span>
                <br />
                Required:{" "}
                <span style={{ color: COLORS.text }}>
                  ${newMargin.toLocaleString()}
                </span>{" "}
                · Available:{" "}
                <span style={{ color: COLORS.red }}>
                  ${Math.max(0, available).toLocaleString()}
                </span>
                <br />
                <span style={{ color: COLORS.dim }}>
                  Unrealized losses reduce your available margin in cross mode.
                </span>
              </div>
            )}

            {/* Submit button */}
            <button
              onClick={tryAdd}
              style={{
                width: "100%",
                padding: "14px 20px",
                background:
                  available >= newMargin ? `${COLORS.accent}12` : "transparent",
                border: `1.5px solid ${available >= newMargin ? COLORS.accent : COLORS.dim}55`,
                borderRadius: 12,
                color: available >= newMargin ? COLORS.accent : COLORS.dim,
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
                ...mono,
                transition: "all 0.2s",
              }}
            >
              {available >= newMargin
                ? "Open Position"
                : "Try Anyway (will show error)"}
            </button>
          </div>
        )}
      </div>

      {/* ═══ HINT ═══ */}
      <div
        style={{
          padding: "16px 20px",
          background: COLORS.darkBg,
          border: `1px solid ${COLORS.cardBorder}`,
          borderRadius: 12,
          ...mono,
          fontSize: 11,
          color: COLORS.dim,
          lineHeight: 1.9,
        }}
      >
        <span style={{ color: COLORS.muted, fontWeight: 700 }}>
          💡 Scenario to try:
        </span>
        <br />
        <span style={{ color: COLORS.muted }}>1.</span>{" "}
        <span style={{ color: COLORS.text }}>Wallet = $10,000</span> · Position
        #1: $2k × 10x long
        <br />
        <span style={{ color: COLORS.muted }}>2.</span> Drag PnL to{" "}
        <span style={{ color: COLORS.red }}>−20%</span> → unrealized loss ={" "}
        <span style={{ color: COLORS.red }}>−$4,000</span>
        <br />
        <span style={{ color: COLORS.muted }}>3.</span> Try opening $8k margin →{" "}
        <span style={{ color: COLORS.red }}>REJECTED</span> (only $4k available)
      </div>
    </div>
  );
}

// ─── Main App ───
export default function MarginTradingSimulator() {
  const [tab, setTab] = useState("learn");
  const [entry, setEntry] = useState(60000);
  const [current, setCurrent] = useState(63000);
  const [leverage, setLeverage] = useState(10);
  const [margin, setMargin] = useState(1000);
  const [wallet, setWallet] = useState(10000);
  const [direction, setDirection] = useState("long");
  const [marginMode, setMarginMode] = useState("isolated");

  // Clamp: margin can NEVER exceed wallet (just like real exchanges)
  const clampedMargin = Math.min(margin, wallet);
  const results = calcResults(
    entry,
    current,
    leverage,
    clampedMargin,
    direction,
    marginMode,
    wallet,
  );

  const handleMarginChange = (v) => setMargin(Math.min(v, wallet));
  const handleWalletChange = (v) => {
    setWallet(v);
    if (margin > v) setMargin(v);
  };

  const loadScenario = (s) => {
    setEntry(s.entry);
    setCurrent(s.current);
    setLeverage(s.leverage);
    setMargin(s.margin);
    setWallet(s.wallet);
    setDirection(s.direction);
    setMarginMode(s.mode);
    setTab("sim");
  };

  const [autoPlay, setAutoPlay] = useState(false);
  const [autoDir, setAutoDir] = useState(1);
  useEffect(() => {
    if (!autoPlay) return;
    const iv = setInterval(() => {
      setCurrent((p) => {
        const step = entry * 0.002;
        let n = p + step * autoDir;
        if (n > entry * 1.25) setAutoDir(-1);
        if (n < entry * 0.75) setAutoDir(1);
        return Math.round(n);
      });
    }, 120);
    return () => clearInterval(iv);
  }, [autoPlay, autoDir, entry]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: COLORS.bg,
        color: COLORS.text,
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        padding: "0 0 40px",
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700;800&display=swap"
        rel="stylesheet"
      />
      <style>{`
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%; background: ${COLORS.accent}; cursor: pointer; border: 2px solid ${COLORS.bg}; box-shadow: 0 0 8px ${COLORS.accent}44; }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: ${COLORS.darkBg}; }
        ::-webkit-scrollbar-thumb { background: ${COLORS.dim}; border-radius: 3px; }
      `}</style>

      {/* Header */}
      <div
        style={{
          padding: "28px 24px 20px",
          background: `linear-gradient(135deg, ${COLORS.darkBg}, ${COLORS.bg})`,
          borderBottom: `1px solid ${COLORS.cardBorder}`,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            fontSize: 11,
            color: COLORS.accent,
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: 3,
            marginBottom: 8,
            textTransform: "uppercase",
          }}
        >
          Margin Trading Academy
        </div>
        <h1
          style={{
            fontSize: 24,
            fontWeight: 800,
            color: COLORS.text,
            margin: 0,
            fontFamily: "'JetBrains Mono', monospace",
            lineHeight: 1.2,
          }}
        >
          Long · Short · Liquidation · PnL
        </h1>
        <p
          style={{
            color: COLORS.muted,
            fontSize: 13,
            marginTop: 8,
            marginBottom: 0,
            lineHeight: 1.5,
          }}
        >
          Interactive explainer & simulator for Cross / Isolated margin
        </p>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: 0,
          margin: "0 20px 24px",
          border: `1px solid ${COLORS.cardBorder}`,
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        {[
          { key: "learn", label: "📚 Learn" },
          { key: "sim", label: "🎮 Single Pos" },
          { key: "multi", label: "🌐 Multi-Pos" },
        ].map((t, i, arr) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              flex: 1,
              padding: "13px 10px",
              background: tab === t.key ? `${COLORS.accent}12` : "transparent",
              color: tab === t.key ? COLORS.accent : COLORS.muted,
              border: "none",
              fontWeight: 700,
              fontSize: 12,
              cursor: "pointer",
              fontFamily: "'JetBrains Mono', monospace",
              borderRight:
                i < arr.length - 1 ? `1px solid ${COLORS.cardBorder}` : "none",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: "0 20px", maxWidth: 700, margin: "0 auto" }}>
        {/* LEARN */}
        {tab === "learn" && (
          <div>
            {concepts.map((c, i) => (
              <ConceptCard key={i} concept={c} index={i} />
            ))}
            <div
              style={{
                marginTop: 24,
                padding: "20px 24px",
                background: `${COLORS.accent}08`,
                border: `1px solid ${COLORS.accent}22`,
                borderRadius: 16,
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  color: COLORS.accent,
                  fontSize: 15,
                  marginBottom: 14,
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                🎮 Try These Scenarios
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                }}
              >
                {scenarios.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => loadScenario(s)}
                    style={{
                      padding: "12px 14px",
                      background: COLORS.card,
                      border: `1px solid ${COLORS.cardBorder}`,
                      borderRadius: 10,
                      color: COLORS.text,
                      fontWeight: 600,
                      fontSize: 12,
                      cursor: "pointer",
                      fontFamily: "'JetBrains Mono', monospace",
                      textAlign: "left",
                      transition: "border-color 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.target.style.borderColor = COLORS.accent)
                    }
                    onMouseLeave={(e) =>
                      (e.target.style.borderColor = COLORS.cardBorder)
                    }
                  >
                    {s.name}
                    <div
                      style={{
                        fontSize: 10,
                        color: COLORS.muted,
                        marginTop: 4,
                      }}
                    >
                      {s.leverage}x {s.direction} · {s.mode}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SINGLE POSITION SIMULATOR */}
        {tab === "sim" && (
          <div>
            <div
              style={{
                background: COLORS.card,
                borderRadius: 16,
                padding: 24,
                border: `1px solid ${COLORS.cardBorder}`,
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  color: COLORS.muted,
                  fontFamily: "'JetBrains Mono', monospace",
                  marginBottom: 20,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                Position Setup
              </div>

              {/* ── Direction subsection ── */}
              <div
                style={{
                  marginBottom: 20,
                  padding: "16px 18px",
                  background: COLORS.darkBg,
                  borderRadius: 12,
                  border: `1px solid ${COLORS.cardBorder}`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 12,
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: direction === "long" ? COLORS.green : COLORS.red,
                      fontFamily: "'JetBrains Mono', monospace",
                      textTransform: "uppercase",
                      letterSpacing: 1,
                    }}
                  >
                    Direction
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      color: COLORS.dim,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    — which way are you betting?
                  </span>
                </div>
                <ToggleGroup
                  options={[
                    { value: "long", label: "Long", icon: "📈" },
                    { value: "short", label: "Short", icon: "📉" },
                  ]}
                  value={direction}
                  onChange={setDirection}
                  color={direction === "long" ? COLORS.green : COLORS.red}
                />
                <div
                  style={{
                    fontSize: 11,
                    color: COLORS.muted,
                    fontFamily: "'JetBrains Mono', monospace",
                    lineHeight: 1.6,
                    marginTop: -8,
                  }}
                >
                  {direction === "long"
                    ? "You profit when price goes UP ↑"
                    : "You profit when price goes DOWN ↓"}
                </div>
              </div>

              {/* ── Margin Mode subsection ── */}
              <div
                style={{
                  marginBottom: 20,
                  padding: "16px 18px",
                  background: COLORS.darkBg,
                  borderRadius: 12,
                  border: `1px solid ${COLORS.orange}22`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 12,
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: COLORS.orange,
                      fontFamily: "'JetBrains Mono', monospace",
                      textTransform: "uppercase",
                      letterSpacing: 1,
                    }}
                  >
                    Margin Mode
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      color: COLORS.dim,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    — how much of your wallet is at risk?
                  </span>
                </div>
                <ToggleGroup
                  options={[
                    { value: "isolated", label: "Isolated", icon: "🔒" },
                    { value: "cross", label: "Cross", icon: "🌐" },
                  ]}
                  value={marginMode}
                  onChange={setMarginMode}
                  color={COLORS.orange}
                />
                <div
                  style={{
                    fontSize: 11,
                    color: COLORS.muted,
                    fontFamily: "'JetBrains Mono', monospace",
                    lineHeight: 1.6,
                    marginTop: -8,
                  }}
                >
                  {marginMode === "isolated"
                    ? "🔒 Only the assigned margin backs this position. Max loss = margin only."
                    : "🌐 Your entire wallet balance backs this position. More buffer, but bigger max loss."}
                </div>
              </div>

              {/* ── Trade Parameters subsection ── */}
              <div
                style={{
                  padding: "16px 18px",
                  background: COLORS.darkBg,
                  borderRadius: 12,
                  border: `1px solid ${COLORS.cardBorder}`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 14,
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: COLORS.accent,
                      fontFamily: "'JetBrains Mono', monospace",
                      textTransform: "uppercase",
                      letterSpacing: 1,
                    }}
                  >
                    Trade Parameters
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      color: COLORS.dim,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    — how big is your position?
                  </span>
                </div>
                <Slider
                  label="Entry Price"
                  value={entry}
                  onChange={(v) => {
                    setEntry(v);
                    setCurrent(v);
                  }}
                  min={1000}
                  max={150000}
                  step={500}
                  unit="$"
                  color={COLORS.accent}
                />
                <Slider
                  label="Leverage"
                  value={leverage}
                  onChange={setLeverage}
                  min={1}
                  max={125}
                  step={1}
                  unit="x"
                  color={COLORS.yellow}
                />
                <Slider
                  label="Margin (Collateral)"
                  value={clampedMargin}
                  onChange={handleMarginChange}
                  min={100}
                  max={wallet}
                  step={100}
                  unit="$"
                  color={COLORS.green}
                  tooltip="YOUR money that you put up to open the position. The exchange multiplies this by leverage. E.g. $1,000 margin × 10x = $10,000 position. If liquidated in isolated mode, you lose this amount. Margin can NEVER exceed your wallet balance."
                />
                <Slider
                  label="Wallet Balance"
                  value={wallet}
                  onChange={handleWalletChange}
                  min={100}
                  max={100000}
                  step={100}
                  unit="$"
                  color={COLORS.orange}
                />

                {/* Position Size + Quantity display */}
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    marginTop: 4,
                    padding: "14px 16px",
                    background: COLORS.bg,
                    borderRadius: 10,
                    border: `1px solid ${COLORS.cardBorder}`,
                  }}
                >
                  <div style={{ flex: 1, textAlign: "center" }}>
                    <div
                      style={{
                        fontSize: 10,
                        color: COLORS.muted,
                        fontFamily: "'JetBrains Mono', monospace",
                        marginBottom: 4,
                        textTransform: "uppercase",
                      }}
                    >
                      Position Size
                    </div>
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 800,
                        color: COLORS.accent,
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      ${results.positionSize.toLocaleString()}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: COLORS.dim,
                        fontFamily: "'JetBrains Mono', monospace",
                        marginTop: 2,
                      }}
                    >
                      ${clampedMargin.toLocaleString()} × {leverage}x
                    </div>
                  </div>
                  <div style={{ width: 1, background: COLORS.cardBorder }} />
                  <div style={{ flex: 1, textAlign: "center" }}>
                    <div
                      style={{
                        fontSize: 10,
                        color: COLORS.muted,
                        fontFamily: "'JetBrains Mono', monospace",
                        marginBottom: 4,
                        textTransform: "uppercase",
                      }}
                    >
                      Quantity (BTC)
                    </div>
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 800,
                        color: COLORS.yellow,
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {results.quantity.toFixed(4)}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: COLORS.dim,
                        fontFamily: "'JetBrains Mono', monospace",
                        marginTop: 2,
                      }}
                    >
                      ${results.positionSize.toLocaleString()} ÷ $
                      {entry.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Current setup summary pill */}
              <div
                style={{
                  marginTop: 16,
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 18px",
                    background: COLORS.darkBg,
                    borderRadius: 20,
                    border: `1px solid ${COLORS.cardBorder}`,
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 12,
                  }}
                >
                  <span
                    style={{
                      color: direction === "long" ? COLORS.green : COLORS.red,
                      fontWeight: 700,
                    }}
                  >
                    {direction === "long" ? "📈 LONG" : "📉 SHORT"}
                  </span>
                  <span style={{ color: COLORS.dim }}>+</span>
                  <span style={{ color: COLORS.orange, fontWeight: 700 }}>
                    {marginMode === "isolated" ? "🔒 ISOLATED" : "🌐 CROSS"}
                  </span>
                  <span style={{ color: COLORS.dim }}>•</span>
                  <span style={{ color: COLORS.yellow, fontWeight: 700 }}>
                    {leverage}x
                  </span>
                </div>
              </div>
            </div>

            {/* Price Control */}
            <div
              style={{
                background: COLORS.card,
                borderRadius: 16,
                padding: 24,
                border: `1px solid ${COLORS.cardBorder}`,
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    color: COLORS.muted,
                    fontFamily: "'JetBrains Mono', monospace",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  Simulate Price Movement
                </div>
                <button
                  onClick={() => setAutoPlay(!autoPlay)}
                  style={{
                    padding: "6px 14px",
                    background: autoPlay ? `${COLORS.accent}22` : "transparent",
                    border: `1px solid ${autoPlay ? COLORS.accent : COLORS.dim}`,
                    borderRadius: 8,
                    color: autoPlay ? COLORS.accent : COLORS.muted,
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {autoPlay ? "⏸ Pause" : "▶ Auto"}
                </button>
              </div>
              <Slider
                label="Current Price"
                value={current}
                onChange={setCurrent}
                min={Math.max(100, Math.round(entry * 0.5))}
                max={Math.round(entry * 1.5)}
                step={Math.max(1, Math.round(entry * 0.001))}
                unit="$"
                color={results.pnl >= 0 ? COLORS.green : COLORS.red}
              />
              <PriceBar
                entry={entry}
                current={current}
                liqPrice={results.liqPrice}
                direction={direction}
              />
            </div>

            {/* Results */}
            <div
              style={{
                background: results.isLiquidated
                  ? `linear-gradient(135deg, #1a0000, ${COLORS.card})`
                  : COLORS.card,
                borderRadius: 16,
                padding: 24,
                border: `1px solid ${results.isLiquidated ? COLORS.red + "66" : COLORS.cardBorder}`,
                marginBottom: 20,
                position: "relative",
                overflow: "hidden",
              }}
            >
              {results.isLiquidated && (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: `${COLORS.red}08`,
                    zIndex: 0,
                  }}
                >
                  <span style={{ fontSize: 80, opacity: 0.08 }}>💀</span>
                </div>
              )}
              <div style={{ position: "relative", zIndex: 1 }}>
                <div
                  style={{
                    fontSize: 12,
                    color: results.isLiquidated ? COLORS.red : COLORS.muted,
                    fontFamily: "'JetBrains Mono', monospace",
                    marginBottom: 16,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    fontWeight: 700,
                  }}
                >
                  {results.isLiquidated ? "⚠ LIQUIDATED" : "Position Results"}
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    marginBottom: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <MetricBox
                    label="PnL"
                    value={`${results.pnl >= 0 ? "+" : ""}$${results.isLiquidated ? (-results.effectiveMargin).toFixed(0) : results.pnl.toFixed(2)}`}
                    color={
                      results.pnl >= 0 && !results.isLiquidated
                        ? COLORS.green
                        : COLORS.red
                    }
                    big
                  />
                  <MetricBox
                    label="ROE"
                    value={`${results.roe >= 0 && !results.isLiquidated ? "+" : ""}${results.isLiquidated ? "-100" : results.roe.toFixed(1)}%`}
                    color={
                      results.roe >= 0 && !results.isLiquidated
                        ? COLORS.green
                        : COLORS.red
                    }
                    big
                  />
                </div>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <MetricBox
                    label="Pos Size"
                    value={`$${results.positionSize.toLocaleString()}`}
                    sub={`${results.quantity.toFixed(4)} BTC`}
                    color={COLORS.accent}
                  />
                  <MetricBox
                    label="Liq Price"
                    value={`$${results.liqPrice.toFixed(0)}`}
                    color={COLORS.red}
                  />
                  <MetricBox
                    label={
                      marginMode === "cross" ? "Wallet Left" : "Margin Left"
                    }
                    value={`$${Math.max(0, results.marginLeft).toFixed(0)}`}
                    sub={
                      marginMode === "cross"
                        ? `of $${wallet}`
                        : `of $${clampedMargin}`
                    }
                    color={results.marginLeft > 0 ? COLORS.orange : COLORS.red}
                  />
                </div>

                <div
                  style={{
                    marginTop: 18,
                    padding: "14px 16px",
                    background: COLORS.darkBg,
                    borderRadius: 10,
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 11,
                    lineHeight: 2,
                    color: COLORS.muted,
                  }}
                >
                  <span style={{ color: COLORS.accent }}>// Breakdown</span>
                  <br />
                  Pos Size = ${clampedMargin.toLocaleString()} × {leverage}x ={" "}
                  <span style={{ color: COLORS.text }}>
                    ${results.positionSize.toLocaleString()}
                  </span>
                  <br />
                  Qty = ${results.positionSize.toLocaleString()} / $
                  {entry.toLocaleString()} ={" "}
                  <span style={{ color: COLORS.yellow }}>
                    {results.quantity.toFixed(4)} BTC
                  </span>
                  <br />
                  PnL = {results.quantity.toFixed(4)} × (
                  {direction === "long"
                    ? `${current.toLocaleString()} − ${entry.toLocaleString()}`
                    : `${entry.toLocaleString()} − ${current.toLocaleString()}`}
                  ) ={" "}
                  <span
                    style={{
                      color: results.pnl >= 0 ? COLORS.green : COLORS.red,
                    }}
                  >
                    ${results.pnl.toFixed(2)}
                  </span>
                  <br />
                  ROE = {Math.abs(results.pnl).toFixed(2)} / {clampedMargin} ×
                  100 ={" "}
                  <span
                    style={{
                      color: results.roe >= 0 ? COLORS.green : COLORS.red,
                    }}
                  >
                    {results.roe.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Comparison */}
            <div
              style={{
                background: COLORS.card,
                borderRadius: 16,
                padding: 24,
                border: `1px solid ${COLORS.cardBorder}`,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  color: COLORS.orange,
                  fontFamily: "'JetBrains Mono', monospace",
                  marginBottom: 16,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                Cross vs Isolated
              </div>
              {(() => {
                const iso = calcResults(
                  entry,
                  current,
                  leverage,
                  clampedMargin,
                  direction,
                  "isolated",
                  wallet,
                );
                const cross = calcResults(
                  entry,
                  current,
                  leverage,
                  clampedMargin,
                  direction,
                  "cross",
                  wallet,
                );
                const rows = [
                  ["Eff. Margin", `$${clampedMargin}`, `$${wallet}`],
                  [
                    "Liq Price",
                    `$${iso.liqPrice.toFixed(0)}`,
                    `$${cross.liqPrice.toFixed(0)}`,
                  ],
                  ["Max Loss", `$${clampedMargin}`, `$${wallet}`],
                  [
                    "Liquidated?",
                    iso.isLiquidated ? "YES 💀" : "No ✅",
                    cross.isLiquidated ? "YES 💀" : "No ✅",
                  ],
                ];
                return (
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 12,
                    }}
                  >
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr 1fr",
                        gap: 1,
                        marginBottom: 2,
                      }}
                    >
                      {["", "🔒 Isolated", "🌐 Cross"].map((h, i) => (
                        <div
                          key={i}
                          style={{
                            padding: "8px 10px",
                            background: COLORS.darkBg,
                            color: COLORS.muted,
                            fontWeight: 700,
                            fontSize: 10,
                            textTransform: "uppercase",
                          }}
                        >
                          {h}
                        </div>
                      ))}
                    </div>
                    {rows.map((row, i) => (
                      <div
                        key={i}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr 1fr",
                          gap: 1,
                          marginBottom: 1,
                        }}
                      >
                        {row.map((cell, j) => (
                          <div
                            key={j}
                            style={{
                              padding: "8px 10px",
                              background:
                                j === 0 ? COLORS.darkBg : `${COLORS.darkBg}88`,
                              color:
                                j === 0
                                  ? COLORS.muted
                                  : cell.includes("YES")
                                    ? COLORS.red
                                    : cell.includes("✅")
                                      ? COLORS.green
                                      : COLORS.text,
                              fontWeight: j === 0 ? 400 : 600,
                            }}
                          >
                            {cell}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* MULTI-POSITION */}
        {tab === "multi" && <MultiPositionSim />}
      </div>
    </div>
  );
}

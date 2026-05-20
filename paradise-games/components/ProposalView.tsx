"use client";

import { useEffect, useRef, useState } from "react";
import type { Proposal } from "@/types/proposal";
import { PRICING_TIERS } from "@/types/proposal";

const MILO_LOGO = "https://framerusercontent.com/images/6CxE8i0ipM3Kf86VeCuaSMk9dU.png";
const SAMSUNG_BANNER = "https://www.afthomas.co.uk/media/brand-pages/Samsung-Banner.jpg";

function textOn(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55 ? "#000000" : "#ffffff";
}

function useFadeIn(threshold = 0.08) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible] as const;
}

function MetricCounter({ raw, inView, accent }: { raw: string; inView: boolean; accent: string }) {
  const match = raw.match(/^([\d.]+)(.*)$/);
  const num = match ? parseFloat(match[1]) : 0;
  const suffix = match ? match[2] : "";
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!inView || !num) return;
    const step = num / (2200 / (1000 / 60));
    let cur = 0;
    const t = setInterval(() => { cur = Math.min(cur + step, num); setCount(cur); if (cur >= num) clearInterval(t); }, 1000 / 60);
    return () => clearInterval(t);
  }, [inView, num]);
  if (!match) return <span style={{ color: accent }}>{raw}</span>;
  const display = num % 1 === 0 ? Math.floor(count) : count.toFixed(1);
  return <>{inView ? display : 0}<span style={{ color: accent }}>{suffix}</span></>;
}

function Divider({ rgb }: { rgb: string }) {
  return <div style={{ height: "1px", background: `linear-gradient(90deg,transparent,rgba(${rgb},.4) 30%,rgba(${rgb},.6) 50%,rgba(${rgb},.4) 70%,transparent)` }}/>;
}

// ─── Chart components ────────────────────────────────────────────────────────

function BarViz({ data, show, accent }: {
  data: { label: string; pct: number; delta: string; positive: boolean }[];
  show: boolean; accent: string;
}) {
  return (
    <div className="space-y-2.5 pt-1">
      {data.map((d, i) => (
        <div key={i}>
          <div className="flex justify-between items-center mb-1">
            <span className="text-gray-400 text-xs truncate pr-2">{d.label}</span>
            <span className="text-xs font-bold flex-shrink-0" style={{ color: d.positive ? "#4ade80" : "#f87171" }}>{d.delta}</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,.07)" }}>
            <div className="h-full rounded-full" style={{
              width: show ? `${d.pct}%` : "0%",
              backgroundColor: d.positive ? accent : "#f87171",
              opacity: 0.85,
              transition: `width 1s cubic-bezier(.16,1,.3,1) ${i * 120}ms`,
            }}/>
          </div>
        </div>
      ))}
    </div>
  );
}

function GapViz({ data, show, accent }: {
  data: { label: string; ship: number; sell: number }[];
  show: boolean; accent: string;
}) {
  return (
    <div className="space-y-3 pt-1">
      {data.map((d, i) => (
        <div key={i}>
          <div className="flex justify-between mb-1">
            <span className="text-gray-400 text-xs">{d.label}</span>
            <span className="text-xs" style={{ color: d.ship - d.sell > 20 ? "#f87171" : "#4ade80" }}>
              {d.ship - d.sell}K gap
            </span>
          </div>
          <div className="relative h-2 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,.07)" }}>
            <div className="absolute left-0 top-0 h-full rounded-full opacity-30" style={{
              width: show ? `${d.ship}%` : "0%", backgroundColor: accent,
              transition: `width 0.9s ease ${i * 100}ms`,
            }}/>
            <div className="absolute left-0 top-0 h-full rounded-full" style={{
              width: show ? `${d.sell}%` : "0%", backgroundColor: accent,
              transition: `width 1.1s cubic-bezier(.16,1,.3,1) ${i * 100 + 150}ms`,
            }}/>
          </div>
          <div className="flex justify-between mt-0.5">
            <span className="text-gray-700 text-xs">Shipped</span>
            <span className="text-gray-700 text-xs">Sold through</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function LineViz({ points, show, accent }: { points: number[]; show: boolean; accent: string }) {
  const W = 260, H = 70;
  const min = Math.min(...points), max = Math.max(...points);
  const xs = points.map((_, i) => (i / (points.length - 1)) * W);
  const ys = points.map(p => H - ((p - min) / (max - min + 1)) * (H - 12) - 6);
  const d = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(" ");
  const len = 500;
  return (
    <div className="pt-1">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity="0.3"/>
            <stop offset="100%" stopColor={accent} stopOpacity="0"/>
          </linearGradient>
        </defs>
        <path d={`${d} L${W},${H} L0,${H} Z`} fill="url(#lg)" opacity={show ? 1 : 0}
          style={{ transition: "opacity 0.8s ease 0.8s" }}/>
        <path d={d} fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round"
          strokeDasharray={len} strokeDashoffset={show ? 0 : len}
          style={{ transition: `stroke-dashoffset 1.4s cubic-bezier(.16,1,.3,1)` }}/>
        {xs.map((x, i) => (
          <circle key={i} cx={x} cy={ys[i]} r="2.5" fill={accent}
            opacity={show ? 1 : 0}
            style={{ transition: `opacity .2s ease ${0.8 + i * 0.08}s` }}/>
        ))}
      </svg>
      <div className="flex justify-between mt-1">
        <span className="text-gray-700 text-xs">Wk 1</span>
        <span className="text-gray-700 text-xs">Wk 10</span>
      </div>
    </div>
  );
}

function FunnelViz({ data, show, accent }: {
  data: { label: string; value: string; pct: number }[];
  show: boolean; accent: string;
}) {
  return (
    <div className="space-y-2 pt-1">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="flex-1">
            <div className="flex justify-between mb-1">
              <span className="text-gray-400 text-xs">{d.label}</span>
              <span className="text-xs font-bold text-white">{d.value}</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,.07)" }}>
              <div className="h-full rounded-full" style={{
                width: show ? `${d.pct}%` : "0%",
                backgroundColor: accent,
                opacity: 1 - i * 0.25,
                transition: `width 1s cubic-bezier(.16,1,.3,1) ${i * 150}ms`,
              }}/>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function StatusViz({ data, show }: {
  data: { source: string; status: "ready" | "warning"; detail: string }[];
  show: boolean;
}) {
  return (
    <div className="space-y-1.5 pt-1">
      {data.map((d, i) => (
        <div key={i} className="flex items-center justify-between rounded-lg px-3 py-2"
          style={{
            backgroundColor: "rgba(255,255,255,.04)",
            opacity: show ? 1 : 0,
            transform: show ? "none" : "translateX(-8px)",
            transition: `opacity .4s ease ${i * 80}ms, transform .4s ease ${i * 80}ms`,
          }}>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: d.status === "ready" ? "#4ade80" : "#fbbf24" }}/>
            <span className="text-gray-300 text-xs">{d.source}</span>
          </div>
          <span className="text-xs" style={{ color: d.status === "ready" ? "#4ade80" : "#fbbf24" }}>{d.detail}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Mock response data for each question ────────────────────────────────────

const RESPONSES = [
  {
    text: "Campaign A drove +23% sell-out uplift on Galaxy S26 at Currys. Campaign C is below baseline — worth pausing that spend.",
    viz: <BarViz show={false} accent="" data={[
      { label: "Galaxy S26 — Currys banner A", pct: 78, delta: "+23%", positive: true },
      { label: "TV Range — Argos Q4",          pct: 44, delta: "+8%",  positive: true },
      { label: "Appliances — Campaign C",       pct: 18, delta: "−4%", positive: false },
    ]}/>,
    type: "bar" as const,
    barData: [
      { label: "Galaxy S26 — Currys banner A", pct: 78, delta: "+23%", positive: true },
      { label: "TV Range — Argos Q4",          pct: 44, delta: "+8%",  positive: true },
      { label: "Appliances — Campaign C",       pct: 18, delta: "−4%", positive: false },
    ],
  },
  {
    text: "QLED 55\" has the largest gap: 94K shipped, 65K sold through. 29K units sitting in retailer stock with no visibility.",
    type: "gap" as const,
    gapData: [
      { label: "Galaxy S26",  ship: 94, sell: 88 },
      { label: "QLED 55\"",   ship: 94, sell: 65 },
      { label: "Washer WM7",  ship: 90, sell: 79 },
    ],
  },
  {
    text: "43\" and 50\" QLED show 62% revenue overlap. Customers who buy either are the same segment. Consider differentiated pricing.",
    type: "table" as const,
    tableData: [
      { a: "Galaxy S24",  b: "Galaxy S25",  overlap: "34%", action: "Phase out S24" },
      { a: "43\" QLED",   b: "50\" QLED",   overlap: "62%", action: "Review pricing" },
      { a: "WM6 Washer",  b: "WM7 Washer",  overlap: "41%", action: "Consolidate" },
    ],
  },
  {
    text: "Media spend correlates with brand consideration at r=0.71 — with a 2-week lag. Strongest in Mobile, weakest in Appliances.",
    type: "line" as const,
    linePoints: [55, 52, 63, 60, 72, 68, 79, 75, 84, 81],
  },
  {
    text: "3% of Galaxy phone buyers convert to a TV or appliance within 90 days. Samsung account holders are 4× more likely to convert.",
    type: "funnel" as const,
    funnelData: [
      { label: "Galaxy phone buyers",    value: "4.2M",  pct: 100 },
      { label: "Viewed ecosystem",       value: "890K",  pct: 21  },
      { label: "Converted (90 days)",    value: "124K",  pct: 3   },
    ],
  },
  {
    text: "3 of 5 sources are ready to connect today. ClickSense and the data warehouse need schema mapping first — about 2 days of work.",
    type: "status" as const,
    statusData: [
      { source: "Sell-in feeds",    status: "ready"   as const, detail: "156K rows"        },
      { source: "Brand tracker",    status: "ready"   as const, detail: "48 weeks"         },
      { source: "Market research",  status: "ready"   as const, detail: "12 decks"         },
      { source: "ClickSense",       status: "warning" as const, detail: "Schema mismatch"  },
      { source: "Data warehouse",   status: "warning" as const, detail: "Format issues"    },
    ],
  },
];

// ─── Particles / constants ────────────────────────────────────────────────────

const PARTICLES = [
  { left: "5%",  size: 3, dur: "7s",  delay: "0s",   drift: "35px"  },
  { left: "15%", size: 2, dur: "9s",  delay: "1.1s", drift: "-28px" },
  { left: "26%", size: 3, dur: "6s",  delay: "2.4s", drift: "20px"  },
  { left: "39%", size: 2, dur: "11s", delay: "0.3s", drift: "-24px" },
  { left: "52%", size: 3, dur: "8s",  delay: "1.7s", drift: "28px"  },
  { left: "65%", size: 2, dur: "7s",  delay: "3.2s", drift: "-35px" },
  { left: "76%", size: 3, dur: "10s", delay: "0.6s", drift: "14px"  },
  { left: "85%", size: 2, dur: "8s",  delay: "4.0s", drift: "22px"  },
  { left: "93%", size: 3, dur: "9s",  delay: "2.0s", drift: "-18px" },
];

const grain = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`;

// ─── Main component ───────────────────────────────────────────────────────────

export default function ProposalView({ proposal }: { proposal: Proposal }) {
  const { brand, content } = proposal;
  const tier = PRICING_TIERS[content.recommendedTier];
  const accent = brand.accentColor || brand.primaryColor;
  const accentText = textOn(accent);
  const r = parseInt(accent.slice(1, 3), 16);
  const g = parseInt(accent.slice(3, 5), 16);
  const b = parseInt(accent.slice(5, 7), 16);
  const rgb = `${r}, ${g}, ${b}`;

  // Hero
  const [heroIn, setHeroIn] = useState(false);
  // Hero mockup — use first bar-type demoResponse if available, else Samsung defaults
  const heroBarIdx = content.demoResponses?.findIndex(r => r.type === "bar") ?? -1;
  const heroBarResp = heroBarIdx >= 0 ? content.demoResponses![heroBarIdx] : null;
  const heroBarData = heroBarResp?.barData ?? [
    { label: "Galaxy S26 — Currys banner A", pct: 78, delta: "+23%", positive: true  },
    { label: "TV Range — Argos Q4",           pct: 44, delta: "+8%",  positive: true  },
    { label: "Appliances — Campaign C",        pct: 18, delta: "−4%", positive: false },
  ];
  const heroQuestion = content.clientQuestions[heroBarIdx]?.question
    ?? "Which Currys banner campaigns drove measurable sell-out uplift this quarter?";
  const heroAnalysisText = `Analysing ${content.clientQuestions[heroBarIdx]?.category.toLowerCase().replace(/_/g, " ") ?? "sell-in × sell-out"} across all sources…`;
  const heroRespText = heroBarResp?.text
    ?? "Campaign A drove the highest uplift. Campaign C is below baseline — worth pausing that spend.";

  const [barWidths, setBarWidths] = useState(heroBarData.map(() => 0));
  useEffect(() => { const t = setTimeout(() => setHeroIn(true), 100); return () => clearTimeout(t); }, []);
  useEffect(() => {
    if (!heroIn) return;
    const t = setTimeout(() => setBarWidths(heroBarData.map(d => d.pct)), 900);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heroIn]);

  // Interactive questions demo
  const [activeQ, setActiveQ] = useState(0);
  const [qPhase, setQPhase] = useState<"typing" | "answered">("answered");
  const [chartShow, setChartShow] = useState(true);

  const pickQuestion = (i: number) => {
    if (i === activeQ && qPhase === "answered") return;
    setChartShow(false);
    setQPhase("typing");
    setActiveQ(i);
  };

  useEffect(() => {
    if (qPhase !== "typing") return;
    const t = setTimeout(() => { setQPhase("answered"); setTimeout(() => setChartShow(true), 200); }, 1800);
    return () => clearTimeout(t);
  }, [qPhase, activeQ]);

  // Auto-advance every 5 s when answered
  useEffect(() => {
    if (qPhase !== "answered") return;
    const t = setTimeout(() => {
      pickQuestion((activeQ + 1) % content.clientQuestions.length);
    }, 5000);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qPhase, activeQ]);

  // Fade-in refs
  const [metricsRef,  metricsIn]  = useFadeIn(0.2);
  const [demoRef,     demoIn]     = useFadeIn(0.05);
  const [solutionRef, solutionIn] = useFadeIn();
  const [featuresRef, featuresIn] = useFadeIn();
  const [caseRef,     caseIn]     = useFadeIn();
  const [pricingRef,  pricingIn]  = useFadeIn();

  const dashIdx = content.heroQuote.indexOf(" — ");
  const heroFirst  = dashIdx > -1 ? content.heroQuote.slice(0, dashIdx) : content.heroQuote;
  const heroSecond = dashIdx > -1 ? content.heroQuote.slice(dashIdx) : "";

  const tickerItems = [
    "Sell-in × Sell-out", "Retailer banner ROI", "Range optimisation",
    "Ecosystem loyalty signals", "Cross-dataset in 2 min", "On-premise deployment",
    "ClickSense + data warehouse", "95% vs. specialist agency", "Pattern recognition at scale",
  ];

  const mockupRows = heroBarData.map((d, i) => ({ ...d, pct: barWidths[i] ?? 0 }));

  const allResponses = content.demoResponses && content.demoResponses.length > 0
    ? content.demoResponses
    : RESPONSES;
  const resp = allResponses[activeQ] ?? RESPONSES[0];

  return (
    <div className="w-full overflow-hidden bg-black" style={{ fontFamily: "var(--font-sans, DM Sans, sans-serif)" }}>
      <style>{`
        @keyframes orbDrift {
          0%,100%{ transform:scale(1) translate(0,0); }
          40%    { transform:scale(1.1) translate(25px,-18px); }
          70%    { transform:scale(.93) translate(-12px,22px); }
        }
        @keyframes drift {
          0%  { transform:translateY(0) translateX(0); opacity:0; }
          8%  { opacity:1; }
          90% { opacity:.4; }
          100%{ transform:translateY(-110vh) translateX(var(--drift)); opacity:0; }
        }
        @keyframes scan {
          0%  { top:-1px; opacity:0; }
          4%  { opacity:1; }
          96% { opacity:.7; }
          100%{ top:100%; opacity:0; }
        }
        @keyframes ticker  { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        @keyframes shimmer { 0%{transform:translateX(-150%) skewX(-18deg)} 100%{transform:translateX(250%) skewX(-18deg)} }
        @keyframes floatY  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes glow {
          0%,100%{ box-shadow:0 0 24px rgba(${rgb},.55),0 0 60px rgba(${rgb},.25); }
          50%    { box-shadow:0 0 42px rgba(${rgb},.9),0 0 100px rgba(${rgb},.45); }
        }
        @keyframes borderGlow {
          0%,100%{ border-color:rgba(${rgb},.25); }
          50%    { border-color:rgba(${rgb},.65); }
        }
        @keyframes typeDot {
          0%,80%,100%{ transform:scale(0); opacity:.3; }
          40%        { transform:scale(1); opacity:1; }
        }
        @keyframes typeCursor {
          0%,100%{opacity:1} 50%{opacity:0}
        }
        @keyframes cardUnfold {
          from { opacity:0; transform:rotateX(-80deg); }
          60%  { opacity:1; }
          to   { opacity:1; transform:rotateX(0deg); }
        }
        @keyframes slideCard0 {
          from { opacity:0; transform:translateX(-48px); }
          to   { opacity:1; transform:translateX(0); }
        }
        @keyframes slideCard1 {
          from { opacity:0; transform:translateX(calc(-100% - 1.25rem)); }
          to   { opacity:1; transform:translateX(0); }
        }
        @keyframes slideCard2 {
          from { opacity:0; transform:translateX(calc(-200% - 2.5rem)); }
          to   { opacity:1; transform:translateX(0); }
        }
        @keyframes cardGlow {
          0%,100% { box-shadow:0 0 18px rgba(${rgb},.18),0 0 0 1px rgba(255,255,255,.6),0 8px 40px rgba(0,0,0,.18); }
          50%     { box-shadow:0 0 36px rgba(${rgb},.38),0 0 0 1px rgba(255,255,255,.9),0 8px 40px rgba(0,0,0,.18); }
        }
        @keyframes flowDot {
          0%   { left:0%;   opacity:0; }
          3%   { opacity:1; }
          97%  { opacity:1; }
          100% { left:100%; opacity:0; }
        }
        @keyframes flowDot2 {
          0%   { left:0%;   opacity:0; }
          3%   { opacity:1; }
          97%  { opacity:1; }
          100% { left:100%; opacity:0; }
        }
        @keyframes lgFloat1 {
          0%,100% { transform:translateY(0)    rotate(-3deg); }
          50%     { transform:translateY(-14px) rotate(3deg); }
        }
        @keyframes lgFloat2 {
          0%,100% { transform:translateY(-8px) rotate(2deg); }
          50%     { transform:translateY(8px)  rotate(-2deg); }
        }
        @keyframes lgFloat3 {
          0%,100% { transform:translateY(4px)  rotate(-2deg); }
          50%     { transform:translateY(-10px) rotate(4deg); }
        }
        @keyframes msgSlide {
          from{ opacity:0; transform:translateY(10px); }
          to  { opacity:1; transform:translateY(0); }
        }
        .particle { position:absolute;border-radius:50%;animation:drift var(--dur) var(--delay) infinite ease-in; }
        .q-item   { transition:all .2s ease; }
        .q-item:hover { background:rgba(255,255,255,.04)!important; }
        .btn-glow { animation:glow 2.8s ease-in-out infinite;transition:transform .2s ease; }
        .btn-glow:hover{ transform:scale(1.05); }
        .tag-pill { animation:borderGlow 3s ease-in-out infinite; }
        .msg-in   { animation:msgSlide .35s ease forwards; }
        .cursor   { display:inline-block;width:2px;height:.9em;vertical-align:middle;
                    background:currentColor;animation:typeCursor 1s step-end infinite;margin-left:2px; }
      `}</style>

      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <section className="relative min-h-screen flex flex-col overflow-hidden" style={{ backgroundColor: "#ffffff" }}>
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute inset-0" style={{ backgroundImage: grain, opacity: 0.3 }}/>
          <div className="absolute" style={{
            inset: 0,
            background: `radial-gradient(ellipse 90% 65% at 50% 110%, rgba(${rgb},.12) 0%, rgba(${rgb},.04) 40%, transparent 65%)`,
            animation: "orbDrift 11s ease-in-out infinite",
          }}/>
          <div className="absolute rounded-full blur-[140px]" style={{
            width: "50%", height: "60%", top: "-15%", left: "-10%",
            backgroundColor: `rgba(${rgb},.07)`, animation: "orbDrift 14s ease-in-out infinite 2s",
          }}/>
          <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(rgba(${rgb},.04) 1px,transparent 1px),linear-gradient(90deg,rgba(${rgb},.04) 1px,transparent 1px)`,
            backgroundSize: "80px 80px",
          }}/>
          <div className="absolute left-0 right-0 h-px" style={{
            background: `linear-gradient(90deg,transparent,rgba(${rgb},.7) 40%,rgba(${rgb},1) 50%,rgba(${rgb},.7) 60%,transparent)`,
            animation: "scan 9s linear infinite",
          }}/>
          {PARTICLES.map((p, i) => (
            <div key={i} className="particle" style={{
              left: p.left, bottom: "-4px", width: p.size, height: p.size,
              backgroundColor: accent, opacity: 0.85,
              "--dur": p.dur, "--delay": p.delay, "--drift": p.drift,
            } as React.CSSProperties}/>
          ))}
        </div>

        <div className="relative z-10 max-w-5xl mx-auto w-full px-6 flex flex-col flex-1">
          {/* Nav */}
          <div className="flex items-center justify-between py-8" style={{
            opacity: heroIn ? 1 : 0, transform: heroIn ? "none" : "translateY(-16px)",
            transition: "opacity .6s ease, transform .6s ease",
          }}>
            <img src={MILO_LOGO} alt="Milo" className="h-5 object-contain"/>
            <div className="text-gray-400 text-xs uppercase tracking-[0.2em]">Prepared for {brand.clientName}</div>
            {brand.logoUrl
              ? <img src={brand.logoUrl} alt={brand.clientName} className="h-7 object-contain" style={{ filter: `brightness(0) saturate(100%) invert(13%) sepia(95%) saturate(4000%) hue-rotate(350deg)` }}/>
              : <span className="font-bold text-sm" style={{ color: accent }}>{brand.clientName}</span>}
          </div>

          {/* Two-column hero */}
          <div className="flex-1 grid grid-cols-2 gap-12 items-center py-12">
            {/* Left */}
            <div>
              <div className="tag-pill self-start inline-flex items-center gap-2 border px-3 py-1.5 rounded-full mb-8" style={{
                borderColor: `rgba(${rgb},.3)`, backgroundColor: `rgba(${rgb},.07)`,
                opacity: heroIn ? 1 : 0, transform: heroIn ? "none" : "translateY(12px)",
                transition: "opacity .7s ease .15s, transform .7s ease .15s",
              }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accent }}/>
                <span className="text-xs font-semibold uppercase tracking-[0.15em]" style={{ color: accent }}>Milo for {brand.clientName}</span>
              </div>
              <h1 className="text-gray-900 leading-[1.05] mb-7 tracking-tight" style={{ fontSize: "52px",
                fontFamily: "var(--font-serif)", fontWeight: 400,
                opacity: heroIn ? 1 : 0, transform: heroIn ? "none" : "translateY(50px)",
                transition: "opacity 1.1s ease .3s, transform 1.1s cubic-bezier(.16,1,.3,1) .3s",
              }}>
                {heroFirst}
                {heroSecond && <><br/><span style={{ color: accent }}>{heroSecond}</span></>}
              </h1>
              <div style={{
                height: "1px", marginBottom: "1.75rem", maxWidth: "18rem",
                background: `linear-gradient(90deg,rgba(${rgb},1),transparent)`,
                width: heroIn ? "100%" : "0%", transition: "width 1.4s cubic-bezier(.16,1,.3,1) .7s",
              }}/>
              <p className="text-gray-600 text-base max-w-sm mb-10 leading-relaxed" style={{
                opacity: heroIn ? 1 : 0, transform: heroIn ? "none" : "translateY(20px)",
                transition: "opacity .9s ease .65s, transform .9s ease .65s",
              }}>{content.heroSubtext}</p>
              <div style={{ opacity: heroIn ? 1 : 0, transition: "opacity .8s ease .9s" }}>
                <a href={content.ctaUrl} target="_blank" rel="noopener noreferrer"
                  className="btn-glow inline-block text-sm font-bold px-8 py-4 rounded-lg"
                  style={{ backgroundColor: accent, color: accentText }}>
                  {content.ctaText} →
                </a>
              </div>
            </div>

            {/* Right — hero product mockup */}
            <div style={{
              opacity: heroIn ? 1 : 0, transform: heroIn ? "none" : "translateX(40px)",
              transition: "opacity 1s ease .5s, transform 1s cubic-bezier(.16,1,.3,1) .5s",
            }}>
              <div className="rounded-2xl overflow-hidden" style={{
                backgroundColor: "#0b0b0b",
                border: `1px solid rgba(${rgb},.25)`,
                boxShadow: `0 0 0 1px rgba(${rgb},.08), 0 30px 80px rgba(0,0,0,.6), 0 0 60px rgba(${rgb},.18)`,
              }}>
                <div className="flex items-center gap-2 px-4 py-3 border-b" style={{
                  borderColor: `rgba(${rgb},.12)`, backgroundColor: "rgba(255,255,255,.02)",
                }}>
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/40"/>
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/40"/>
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/40"/>
                  <span className="ml-2 text-gray-600 text-xs">Milo · {brand.clientName} Insights</span>
                </div>
                <div className="p-5">
                  <div className="flex justify-end mb-5">
                    <div className="rounded-xl rounded-tr-sm px-4 py-3 max-w-[85%]" style={{
                      backgroundColor: `rgba(${rgb},.2)`, border: `1px solid rgba(${rgb},.3)`,
                    }}>
                      <p className="text-white text-sm leading-snug">{heroQuestion}</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-black" style={{ backgroundColor: accent, color: accentText }}>M</div>
                    <div className="flex-1">
                      <p className="text-gray-500 text-xs mb-3">{heroAnalysisText}</p>
                      <div className="space-y-3">
                        {mockupRows.map((row, i) => (
                          <div key={i}>
                            <div className="flex justify-between items-center mb-1.5">
                              <span className="text-gray-400 text-xs truncate pr-2">{row.label}</span>
                              <span className="text-xs font-bold flex-shrink-0" style={{ color: row.positive ? "#4ade80" : "#f87171" }}>{row.delta}</span>
                            </div>
                            <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,.06)" }}>
                              <div className="h-full rounded-full" style={{
                                width: `${row.pct}%`,
                                backgroundColor: row.positive ? accent : "#f87171",
                                opacity: row.positive ? 0.85 : 0.6,
                                transition: `width 1.2s cubic-bezier(.16,1,.3,1) ${.9 + i * .15}s`,
                              }}/>
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-gray-600 text-xs mt-4 leading-relaxed">
                        {heroRespText}<span className="cursor"/>
                      </p>
                    </div>
                  </div>
                </div>
                <div className="px-5 pb-5">
                  <div className="rounded-lg px-4 py-3 flex items-center gap-3" style={{
                    backgroundColor: "rgba(255,255,255,.04)", border: `1px solid rgba(${rgb},.15)`,
                  }}>
                    <span className="text-gray-600 text-sm flex-1">Ask Milo anything about {brand.clientName}…</span>
                    <div className="w-6 h-6 rounded flex items-center justify-center" style={{ backgroundColor: accent }}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6h8M6 2l4 4-4 4" stroke={accentText} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Metrics */}
          <div ref={metricsRef} className="border-t pb-10 pt-8 grid grid-cols-3" style={{ borderColor: "rgba(0,0,0,.08)" }}>
            {content.keyMetrics.map((m, i) => (
              <div key={i} style={{
                borderRight: i < 2 ? "1px solid rgba(0,0,0,.07)" : "none",
                paddingRight: i < 2 ? "2rem" : 0, paddingLeft: i > 0 ? "2rem" : 0,
                opacity: metricsIn ? 1 : 0, transform: metricsIn ? "none" : "translateY(24px)",
                transition: `opacity .8s ease ${i * .15}s, transform .8s ease ${i * .15}s`,
              }}>
                <div className="text-5xl font-black text-gray-900 mb-1.5 tabular-nums">
                  <MetricCounter raw={m.value} inView={metricsIn} accent={accent}/>
                </div>
                <div className="text-gray-500 text-xs uppercase tracking-widest leading-snug">{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          TICKER
      ══════════════════════════════════════════ */}
      <Divider rgb={rgb}/>
      <div className="relative overflow-hidden py-3.5" style={{ backgroundColor: "#040404" }}>
        <div className="absolute inset-0 z-10 pointer-events-none" style={{
          background: `linear-gradient(90deg,#040404 0%,transparent 6%,transparent 94%,#040404 100%)`,
        }}/>
        <div className="flex gap-14 whitespace-nowrap" style={{ animation: "ticker 32s linear infinite" }}>
          {[...tickerItems, ...tickerItems, ...tickerItems].map((item, i) => (
            <span key={i} className="inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-gray-700">
              <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ backgroundColor: accent }}/>
              {item}
            </span>
          ))}
        </div>
      </div>
      <Divider rgb={rgb}/>

      {/* ══════════════════════════════════════════
          QUESTIONS — interactive laptop demo
      ══════════════════════════════════════════ */}
      <section className="relative px-6 py-20 overflow-hidden" style={{ backgroundColor: "#ffffff" }}>
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: grain, opacity: 0.2 }}/>

        <div ref={demoRef} className="max-w-5xl mx-auto relative z-10">
          {/* Header */}
          <div style={{
            opacity: demoIn ? 1 : 0, transform: demoIn ? "none" : "translateY(30px)",
            transition: "opacity .8s ease, transform .8s ease",
          }}>
            <p className="text-xs font-bold uppercase tracking-[0.2em] mb-4" style={{ color: accent }}>With Milo</p>
            <h2 className="text-4xl xl:text-5xl text-gray-900 mb-2" style={{
              fontFamily: "var(--font-serif)", fontWeight: 400, letterSpacing: "-0.02em",
            }}>
              Questions that should take <span style={{ color: accent }}>30 seconds.</span>
            </h2>
            <p className="text-gray-400 mb-10 text-sm">Click any question to see Milo in action.</p>
          </div>

          {/* Questions left / Laptop right */}
          <div className="grid grid-cols-5 gap-8 items-start" style={{
            opacity: demoIn ? 1 : 0, transform: demoIn ? "none" : "translateY(40px)",
            transition: "opacity .9s ease .15s, transform .9s ease .15s",
          }}>

            {/* ── Question list ── */}
            <div className="col-span-2 space-y-1.5">
              {content.clientQuestions.map((q, i) => (
                <button key={i} onClick={() => pickQuestion(i)}
                  className="q-item w-full text-left rounded-xl px-4 py-3 border"
                  style={{
                    backgroundColor: activeQ === i ? `rgba(${rgb},.08)` : "rgba(0,0,0,.02)",
                    borderColor: activeQ === i ? `rgba(${rgb},.35)` : "rgba(0,0,0,.07)",
                    cursor: "pointer",
                  }}>
                  <div className="flex items-start gap-3">
                    <span className="text-xs font-black mt-0.5 flex-shrink-0 tabular-nums" style={{
                      color: activeQ === i ? accent : "rgba(0,0,0,.2)",
                    }}>0{i + 1}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{
                        color: activeQ === i ? accent : "rgba(0,0,0,.3)",
                      }}>{q.category}</div>
                      <p className="text-xs leading-relaxed line-clamp-2" style={{
                        color: activeQ === i ? "#111111" : "rgba(0,0,0,.45)",
                      }}>{q.question}</p>
                    </div>
                  </div>
                  {/* Active progress bar */}
                  {activeQ === i && qPhase === "answered" && (
                    <div className="mt-2 h-px overflow-hidden rounded-full" style={{ backgroundColor: `rgba(${rgb},.2)` }}>
                      <div className="h-full rounded-full" style={{
                        backgroundColor: accent, opacity: 0.5,
                        animation: "lineGrow 5s linear forwards",
                      }}/>
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* ── Laptop mockup ── */}
            <div className="col-span-3">
              {/* Screen */}
              <div className="rounded-xl overflow-hidden relative" style={{
                backgroundColor: "#141414",
                border: "2px solid rgba(255,255,255,.1)",
                boxShadow: "0 0 0 1px rgba(255,255,255,.04), 0 40px 80px rgba(0,0,0,.9), 0 0 40px rgba(0,0,0,.6)",
              }}>
                {/* Camera dot */}
                <div className="flex justify-center py-2" style={{ backgroundColor: "#0d0d0d" }}>
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#2a2a2a" }}/>
                </div>

                {/* Screen content */}
                <div style={{ backgroundColor: "#0a0a0a", minHeight: "380px" }}>
                  {/* Top bar */}
                  <div className="flex items-center justify-between px-4 py-2.5 border-b" style={{
                    borderColor: "rgba(255,255,255,.06)", backgroundColor: "rgba(255,255,255,.02)",
                  }}>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-black" style={{ backgroundColor: accent, color: accentText, fontSize: 9 }}>M</div>
                      <span className="text-white text-xs font-semibold">Milo</span>
                      <span className="text-gray-600 text-xs">· {brand.clientName} Insights</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500"/>
                      <span className="text-gray-600 text-xs">Live</span>
                    </div>
                  </div>

                  {/* Chat area */}
                  <div className="px-5 py-5 space-y-4" style={{ minHeight: "310px" }}>
                    {/* User message */}
                    <div className="flex justify-end">
                      <div className="rounded-2xl rounded-tr-sm px-4 py-3 max-w-[80%] msg-in" style={{
                        backgroundColor: `rgba(${rgb},.18)`,
                        border: `1px solid rgba(${rgb},.25)`,
                      }}>
                        <p className="text-white text-xs leading-relaxed">{content.clientQuestions[activeQ].question}</p>
                      </div>
                    </div>

                    {/* Milo response */}
                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center font-black" style={{ backgroundColor: accent, color: accentText, fontSize: 9 }}>M</div>
                      <div className="flex-1">
                        {qPhase === "typing" ? (
                          /* Typing indicator */
                          <div className="flex items-center gap-1.5 py-3">
                            {[0, 1, 2].map(i => (
                              <div key={i} className="w-1.5 h-1.5 rounded-full" style={{
                                backgroundColor: accent,
                                animation: `typeDot 1.2s ease-in-out ${i * 0.2}s infinite`,
                              }}/>
                            ))}
                          </div>
                        ) : (
                          /* Answer */
                          <div className="msg-in">
                            <p className="text-gray-300 text-xs leading-relaxed mb-3">{resp.text}</p>

                            {/* Chart */}
                            {resp.type === "bar" && resp.barData && (
                              <BarViz data={resp.barData} show={chartShow} accent={accent}/>
                            )}
                            {resp.type === "gap" && resp.gapData && (
                              <GapViz data={resp.gapData} show={chartShow} accent={accent}/>
                            )}
                            {resp.type === "line" && resp.linePoints && (
                              <div>
                                <div className="flex justify-between text-xs text-gray-600 mb-1">
                                  <span>Trend (indexed)</span>
                                  <span style={{ color: accent }}>10 weeks</span>
                                </div>
                                <LineViz points={resp.linePoints} show={chartShow} accent={accent}/>
                              </div>
                            )}
                            {resp.type === "table" && resp.tableData && (
                              <div className="rounded-lg overflow-hidden border" style={{ borderColor: "rgba(255,255,255,.07)" }}>
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr style={{ backgroundColor: "rgba(255,255,255,.04)" }}>
                                      <th className="text-left px-3 py-2 text-gray-500 font-medium">Task</th>
                                      <th className="text-right px-3 py-2 text-gray-500 font-medium">Ownership</th>
                                      <th className="text-right px-3 py-2 text-gray-500 font-medium">Action</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {resp.tableData.map((row, i) => (
                                      <tr key={i} style={{
                                        borderTop: "1px solid rgba(255,255,255,.04)",
                                        opacity: chartShow ? 1 : 0,
                                        transition: `opacity .4s ease ${i * 100}ms`,
                                      }}>
                                        <td className="px-3 py-2 text-gray-400">{row.a}{row.b ? ` / ${row.b}` : ""}</td>
                                        <td className="px-3 py-2 text-right font-bold" style={{ color: row.overlap.startsWith("→") ? "#4ade80" : "#fbbf24" }}>{row.overlap}</td>
                                        <td className="px-3 py-2 text-right text-gray-500">{row.action}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                            {resp.type === "funnel" && resp.funnelData && (
                              <FunnelViz data={resp.funnelData} show={chartShow} accent={accent}/>
                            )}
                            {resp.type === "status" && resp.statusData && (
                              <StatusViz data={resp.statusData} show={chartShow}/>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Input bar */}
                  <div className="px-5 pb-4">
                    <div className="rounded-lg px-4 py-2.5 flex items-center gap-3" style={{
                      backgroundColor: "rgba(255,255,255,.04)", border: `1px solid rgba(${rgb},.15)`,
                    }}>
                      <span className="text-gray-600 text-xs flex-1">Ask Milo anything about {brand.clientName}…</span>
                      <div className="w-5 h-5 rounded flex items-center justify-center" style={{ backgroundColor: accent }}>
                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6h8M6 2l4 4-4 4" stroke={accentText} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Keyboard base */}
              <div style={{
                height: "14px", margin: "0 12px",
                background: "linear-gradient(180deg,#1c1c1c,#111)",
                borderRadius: "0 0 8px 8px",
                boxShadow: "0 8px 24px rgba(0,0,0,.7)",
              }}/>
              <div style={{
                height: "6px", margin: "0 40px",
                background: "#0a0a0a",
                borderRadius: "0 0 6px 6px",
                boxShadow: "0 4px 16px rgba(0,0,0,.8)",
              }}/>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SOLUTION — accent section
      ══════════════════════════════════════════ */}
      <section className="relative px-6 py-24 overflow-hidden" style={{ backgroundColor: accent }}>
        {/* Shimmer + overlays */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div style={{
            position:"absolute", inset:0,
            background:"linear-gradient(90deg,transparent,rgba(255,255,255,.15) 50%,transparent)",
            animation:"shimmer 5s ease-in-out infinite",
          }}/>
        </div>
        <div className="absolute inset-0 pointer-events-none" style={{
          background:"linear-gradient(135deg,rgba(255,255,255,.1) 0%,transparent 45%,rgba(0,0,0,.2) 100%)",
        }}/>
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: grain, opacity: 0.6 }}/>

        {/* ── Floating integration logos — ellipse orbit around card area ── */}
        {(() => {
          const items = [
            { url:"https://cdn.simpleicons.org/databricks",                                                                                   top:"8%",  left:"12%",  anim:"lgFloat1", dur:"5.2s", delay:"0s"   },
            { url:"https://cdn.simpleicons.org/xero",                                                                                         top:"6%",  left:"72%",  anim:"lgFloat2", dur:"6.8s", delay:"1.4s" },
            { url:"https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://deputy.com&size=128",   top:"44%", left:"3%",   anim:"lgFloat3", dur:"7.1s", delay:"0.7s" },
            { url:"https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://bamboohr.com&size=128", top:"48%", left:"88%",  anim:"lgFloat1", dur:"5.8s", delay:"2.1s" },
            { url:"https://cdn.simpleicons.org/xero",                                                                                         top:"80%", left:"20%",  anim:"lgFloat2", dur:"6.3s", delay:"1.8s" },
            { url:"https://cdn.simpleicons.org/databricks",                                                                                   top:"82%", left:"68%",  anim:"lgFloat3", dur:"7.5s", delay:"3.2s" },
          ];
          return (
            <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
              {items.map((lg, i) => (
                <div key={i} style={{
                  position:"absolute",
                  top: lg.top, left: lg.left,
                  width:"56px", height:"56px",
                  backgroundColor:"rgba(255,255,255,0.55)",
                  borderRadius:"14px",
                  boxShadow:"0 2px 12px rgba(0,0,0,0.08)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  animation:`${lg.anim} ${lg.dur} ease-in-out ${lg.delay} infinite`,
                }}>
                  <img src={lg.url} alt="" style={{
                    width:"34px", height:"34px", objectFit:"contain", opacity:0.7,
                  }}/>
                </div>
              ))}
            </div>
          );
        })()}

        <div ref={solutionRef} className="max-w-5xl mx-auto relative z-10">
          <div style={{
            opacity: solutionIn ? 1 : 0, transform: solutionIn ? "none" : "translateY(40px)",
            transition: "opacity .9s ease, transform .9s ease",
          }}>
            <p className="text-xs font-bold uppercase tracking-[0.2em] mb-6" style={{ color:"rgba(255,255,255,.5)" }}>The product</p>
            <h2 className="text-5xl xl:text-6xl mb-3" style={{
              fontFamily:"var(--font-serif)", fontWeight:400, letterSpacing:"-0.02em", color:accentText,
            }}>
              Ask the question.<br/><em>Get the answer.</em>
            </h2>
            <p className="mb-16 max-w-md text-base leading-relaxed" style={{ color:accentText, opacity:0.7 }}>
              Ask in plain English. Get the answer in Slack, on your phone, wherever.
            </p>
          </div>

          {/* Card grid with wire connector */}
          <div style={{ position:"relative" }}>

            {/* ── Connecting wire line ── */}
            <div style={{
              position:"absolute", top:"38%", left:0, right:0, height:"1px",
              background:`linear-gradient(90deg, transparent 0%, rgba(255,255,255,.35) 8%, rgba(255,255,255,.35) 92%, transparent 100%)`,
              zIndex:20, pointerEvents:"none",
            }}/>
            {/* Flowing dot 1 */}
            <div style={{
              position:"absolute", top:"38%",
              width:"8px", height:"8px", borderRadius:"50%",
              backgroundColor:"#fff",
              transform:"translateY(-50%)",
              boxShadow:`0 0 8px 3px rgba(255,255,255,.6)`,
              zIndex:21, pointerEvents:"none",
              animation:"flowDot 3.6s linear infinite",
            }}/>
            {/* Flowing dot 2 (offset) */}
            <div style={{
              position:"absolute", top:"38%",
              width:"5px", height:"5px", borderRadius:"50%",
              backgroundColor:"#fff",
              transform:"translateY(-50%)",
              boxShadow:`0 0 6px 2px rgba(255,255,255,.4)`,
              zIndex:21, pointerEvents:"none",
              animation:"flowDot2 3.6s linear 1.8s infinite",
            }}/>

            {/* Cards */}
            <div className="grid grid-cols-3 gap-5">
              {content.solutionHighlights.map((s, i) => (
                <div key={i} className="rounded-2xl p-7 flex flex-col" style={{
                  backgroundColor:"rgba(255,255,255,.96)",
                  border:"1px solid rgba(255,255,255,.7)",
                  minHeight:"220px",
                  position:"relative",
                  zIndex: i + 1,
                  animationName: solutionIn
                    ? [`slideCard${i}`, "cardGlow"].join(",")
                    : "none",
                  animationDuration: solutionIn ? ".7s, 3s" : "none",
                  animationTimingFunction: "cubic-bezier(.16,1,.3,1), ease-in-out",
                  animationDelay: `${i * .25}s, ${0.7 + i * .25}s`,
                  animationFillMode:"both, none",
                  animationIterationCount:"1, infinite",
                  animationPlayState: solutionIn ? "running, running" : "paused, paused",
                }}>
                  <div className="text-sm font-black mb-auto pb-10" style={{ color:"rgba(0,0,0,.2)" }}>
                    0{i + 1}
                  </div>
                  <h3 className="text-xl font-black mb-2 text-gray-900 uppercase tracking-tight">
                    {s.feature}
                  </h3>
                  <p className="text-sm leading-relaxed text-gray-500">{s.benefit}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          PROVEN — case study section
      ══════════════════════════════════════════ */}
      <section className="relative px-6 py-24 overflow-hidden" style={{ backgroundColor: "#fafafa" }}>

        {/* Floating playing cards — very low opacity background */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden" aria-hidden="true">
          {([
            { rank:"A",  suit:"♠", red:false, top:"47%", left:"86%", rot:"-14deg", w:80, h:112, anim:"lgFloat1", dur:"6.2s", delay:"0s",   op:0.11 },
            { rank:"K",  suit:"♥", red:true,  top:"73%", left:"76%", rot:"11deg",  w:86, h:120, anim:"lgFloat2", dur:"7.4s", delay:"1.2s", op:0.10 },
            { rank:"Q",  suit:"♦", red:true,  top:"86%", left:"48%", rot:"9deg",   w:80, h:112, anim:"lgFloat3", dur:"5.9s", delay:"0.8s", op:0.10 },
            { rank:"J",  suit:"♣", red:false, top:"82%", left:"22%", rot:"-11deg", w:86, h:120, anim:"lgFloat1", dur:"6.8s", delay:"2.1s", op:0.09 },
            { rank:"10", suit:"♥", red:true,  top:"61%", left:"10%", rot:"18deg",  w:76, h:106, anim:"lgFloat2", dur:"8.0s", delay:"1.6s", op:0.09 },
            { rank:"7",  suit:"♠", red:false, top:"33%", left:"10%", rot:"-7deg",  w:76, h:106, anim:"lgFloat3", dur:"6.6s", delay:"3.0s", op:0.10 },
            { rank:"A",  suit:"♦", red:true,  top:"12%", left:"22%", rot:"5deg",   w:80, h:112, anim:"lgFloat1", dur:"7.2s", delay:"0.5s", op:0.09 },
            { rank:"K",  suit:"♣", red:false, top:"8%",  left:"48%", rot:"-19deg", w:86, h:120, anim:"lgFloat2", dur:"5.6s", delay:"2.5s", op:0.08 },
            { rank:"9",  suit:"♥", red:true,  top:"21%", left:"76%", rot:"13deg",  w:80, h:112, anim:"lgFloat3", dur:"6.9s", delay:"1.0s", op:0.09 },
          ] as { rank:string; suit:string; red:boolean; top:string; left:string; rot:string; w:number; h:number; anim:string; dur:string; delay:string; op:number }[]).map((c, i) => (
            <div key={i} style={{
              position:"absolute", top:c.top, left:c.left,
              width:`${c.w}px`, height:`${c.h}px`,
              backgroundColor:"#fff",
              borderRadius:"7px",
              border:"1.5px solid rgba(0,0,0,0.15)",
              boxShadow:"0 4px 14px rgba(0,0,0,0.08)",
              transform:`rotate(${c.rot})`,
              opacity:c.op,
              display:"flex", flexDirection:"column",
              justifyContent:"space-between",
              padding:"6px 7px",
              animation:`${c.anim} ${c.dur} ease-in-out ${c.delay} infinite`,
            }}>
              <span style={{ fontSize:"13px", fontWeight:700, lineHeight:1.2, color:c.red?"#c0392b":"#111", fontFamily:"monospace" }}>{c.rank}<br/>{c.suit}</span>
              <span style={{ fontSize:"28px", textAlign:"center", color:c.red?"#c0392b":"#111", lineHeight:1 }}>{c.suit}</span>
              <span style={{ fontSize:"13px", fontWeight:700, lineHeight:1.2, color:c.red?"#c0392b":"#111", fontFamily:"monospace", alignSelf:"flex-end", transform:"rotate(180deg)" }}>{c.rank}<br/>{c.suit}</span>
            </div>
          ))}
        </div>

        <div ref={featuresRef} className="max-w-5xl mx-auto relative z-10">
          <div style={{
            opacity: featuresIn ? 1 : 0, transform: featuresIn ? "none" : "translateY(36px)",
            transition: "opacity .9s ease, transform .9s ease",
          }}>
            <div className="mb-10"/>

            {/* Headline — serif, matches rest of site */}
            <h2 className="text-5xl xl:text-6xl text-gray-900 mb-4" style={{
              fontFamily: "var(--font-serif)", fontWeight: 400, letterSpacing: "-0.02em",
            }}>
              You asked for evidence.<br/><span style={{ color: accent }}>Here it is.</span>
            </h2>
            <p className="text-gray-500 max-w-lg mb-14 text-base leading-relaxed">
              Not a claim about depth. A check against an independent benchmark — in the same industry you&apos;re in.
            </p>

            {/* Evidence cards */}
            <div className="grid grid-cols-2 gap-5">

              {/* Left — BetGames (accent border) */}
              <div className="rounded-2xl p-8 flex flex-col bg-white" style={{
                border: `1.5px solid rgba(${rgb},.3)`,
                boxShadow: "0 4px 24px rgba(0,0,0,.06)",
                opacity: featuresIn ? 1 : 0,
                transform: featuresIn ? "none" : "translateY(24px)",
                transition: "opacity .7s ease .1s, transform .7s ease .1s",
              }}>
                <div className="text-3xl font-black mb-1" style={{ color: accent }}>10 days → minutes</div>
                <div className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400 mb-7">
                  BetGames · iGaming · BI eliminated
                </div>
                <p className="text-gray-600 text-sm leading-relaxed flex-1">
                  BetGames ran on 10-day reporting cycles — BI tickets for every question, static dashboards for every review.
                  Milo connected across Salesforce, Power BI and their data warehouse.{" "}
                  <strong className="text-gray-900">No BI team, no BI tickets. Near enough instant.</strong>
                </p>
                <div className="border-t border-gray-100 mt-6 pt-5">
                  <p className="text-gray-400 text-xs italic leading-relaxed">
                    &ldquo;It&apos;s like having a senior analyst in my pocket.&rdquo; — Gary Francis, BetGames
                  </p>
                  <a
                    href="https://www.milo.ai/case-studies/real-time-commercial-analytics-in-igaming-how-betgames-eliminated-bi-bottlenecks-with-ai"
                    target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-4 text-xs font-bold uppercase tracking-wider"
                    style={{ color: accent }}>
                    Read full case study →
                  </a>
                </div>
              </div>

              {/* Right — proposal case study */}
              <div className="rounded-2xl p-8 flex flex-col bg-white" style={{
                border: "1.5px solid #e5e7eb",
                boxShadow: "0 4px 24px rgba(0,0,0,.06)",
                opacity: featuresIn ? 1 : 0,
                transform: featuresIn ? "none" : "translateY(24px)",
                transition: "opacity .7s ease .22s, transform .7s ease .22s",
              }}>
                <div className="inline-flex mb-6 rounded-lg px-3 py-2" style={{ backgroundColor: "#111111", alignSelf: "flex-start" }}>
                  <img
                    src="https://www.betgames.tv/api/uploads/BG_Logo_White_Horizontal_Lock_Up_dcca475d41.png"
                    alt="BetGames"
                    className="h-5 object-contain"
                  />
                </div>
                <div className="text-3xl font-black text-gray-900 mb-1">
                  {content.relevantCaseStudy.company}
                </div>
                <div className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400 mb-7">
                  FMCG · Pattern surfaced
                </div>
                <p className="text-gray-600 text-sm leading-relaxed flex-1">
                  {content.relevantCaseStudy.result}
                </p>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          COMPARISON TABLE
      ══════════════════════════════════════════ */}
      <section className="relative px-6 py-24 overflow-hidden" style={{ backgroundColor: accent }}>
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: grain, opacity: 0.4 }}/>
        <div className="absolute inset-0 pointer-events-none" style={{
          background: `radial-gradient(ellipse 60% 50% at 80% 50%, rgba(${rgb},.12) 0%, transparent 70%)`,
        }}/>
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="flex items-center gap-4 mb-3">
            <img src={MILO_LOGO} alt="Milo" className="h-8 object-contain" style={{ filter: "brightness(0) invert(1)" }}/>
            <h2 className="text-5xl xl:text-6xl" style={{
              fontFamily: "var(--font-serif)", fontWeight: 400, letterSpacing: "-0.02em", color: accentText,
            }}>
              How Milo compares.
            </h2>
          </div>
          <p className="mb-12 text-base" style={{ color: accentText, opacity: 0.6 }}>For teams running live gaming and casino operations.</p>

          {/* Table */}
          <div className="rounded-2xl overflow-hidden bg-white relative" style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.18)" }}>
            {/* Milo column glow */}
            <div className="absolute inset-y-0 pointer-events-none" style={{
              right: 0, width: "25%",
              background: `radial-gradient(ellipse 120% 80% at 50% 50%, ${accent}28 0%, transparent 70%)`,
              zIndex: 0,
            }}/>

            {/* Header row */}
            <div className="grid grid-cols-4 relative" style={{ backgroundColor: "#f5f5f5", borderBottom: "1px solid #e5e7eb", zIndex: 1 }}>
              <div className="px-6 py-4"/>
              {[
                { label: "ChatGPT / Claude", sub: "General AI" },
                { label: "Looker / PowerBI",  sub: "Traditional BI" },
                { label: "Milo",              sub: "Built for your data", highlight: true },
              ].map((col, i) => (
                <div key={i} className="px-6 py-4 text-center" style={{
                  backgroundColor: col.highlight ? accent : "transparent",
                  borderLeft: "1px solid #e5e7eb",
                }}>
                  <p className="font-bold text-sm" style={{ color: col.highlight ? accentText : "#111" }}>{col.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: col.highlight ? `${accentText}99` : "#9ca3af" }}>{col.sub}</p>
                </div>
              ))}
            </div>

            {/* Rows */}
            {([
              {
                feature: "Connects to Databricks, Xero & Deputy natively",
                gpt:    { icon: "✗", note: "Upload only",           color: "#ef4444" },
                bi:     { icon: "△", note: "Weeks of setup",        color: "#f59e0b" },
                milo:   { icon: "✓", note: "Ready out of the box",  color: "#4ade80" },
              },
              {
                feature: "Player cohort queries in plain English",
                gpt:    { icon: "△", note: "No live data",          color: "#f59e0b" },
                bi:     { icon: "✗", note: "Needs SQL + analyst",   color: "#ef4444" },
                milo:   { icon: "✓", note: "Ask and get an answer", color: "#4ade80" },
              },
              {
                feature: "Cross-dataset analysis (GGR + bonus + HR)",
                gpt:    { icon: "✗", note: "Single session only",   color: "#ef4444" },
                bi:     { icon: "△", note: "Complex joins, slow",   color: "#f59e0b" },
                milo:   { icon: "✓", note: "Built for this",        color: "#4ade80" },
              },
              {
                feature: "Answer in under 2 minutes",
                gpt:    { icon: "△", note: "If data is uploaded",   color: "#f59e0b" },
                bi:     { icon: "✗", note: "Days or a backlog",     color: "#ef4444" },
                milo:   { icon: "✓", note: "Always",                color: "#4ade80" },
              },
              {
                feature: "No SQL or analyst in the middle",
                gpt:    { icon: "✓", note: "Yes",                   color: "#4ade80" },
                bi:     { icon: "✗", note: "Analyst required",      color: "#ef4444" },
                milo:   { icon: "✓", note: "Yes",                   color: "#4ade80" },
              },
              {
                feature: "Data stays inside your infrastructure",
                gpt:    { icon: "✗", note: "Leaves your system",    color: "#ef4444" },
                bi:     { icon: "△", note: "Depends on setup",      color: "#f59e0b" },
                milo:   { icon: "✓", note: "On-premise option",     color: "#4ade80" },
              },
              {
                feature: "Proactive alerts when KPIs shift",
                gpt:    { icon: "✗", note: "You ask, it answers",   color: "#ef4444" },
                bi:     { icon: "△", note: "Manual dashboards",     color: "#f59e0b" },
                milo:   { icon: "✓", note: "Flags issues first",    color: "#4ade80" },
              },
            ] as { feature: string; gpt: {icon:string;note:string;color:string}; bi: {icon:string;note:string;color:string}; milo: {icon:string;note:string;color:string} }[]).map((row, i) => (
              <div key={i} className="grid grid-cols-4 relative" style={{ borderBottom: i < 6 ? "1px solid #f3f4f6" : "none", zIndex: 1 }}>
                <div className="px-6 py-4 text-sm font-medium flex items-center" style={{ color: "#374151", borderRight: "1px solid #f3f4f6" }}>
                  {row.feature}
                </div>
                {[row.gpt, row.bi, row.milo].map((cell, j) => (
                  <div key={j} className="px-6 py-4 flex flex-col items-center justify-center gap-1 text-center" style={{
                    borderLeft: "1px solid #f3f4f6",
                    backgroundColor: "transparent",
                  }}>
                    <span style={{ fontSize: "18px", color: cell.color, lineHeight: 1 }}>{cell.icon}</span>
                    <span className="text-xs text-gray-400">{cell.note}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          PROOF
      ══════════════════════════════════════════ */}
      <section className="bg-white px-6 py-24">
        <div ref={caseRef} className="max-w-5xl mx-auto">
          <div style={{
            opacity: caseIn ? 1 : 0, transform: caseIn ? "none" : "translateY(40px)",
            transition: "opacity .9s ease, transform .9s ease",
          }}>
            <h2 className="text-5xl xl:text-6xl text-gray-900 mb-12" style={{
              fontFamily: "var(--font-serif)", fontWeight: 400, letterSpacing: "-0.02em",
            }}>
              Built two ways.<br/>You choose where data lives.
            </h2>
            <div className="grid grid-cols-2 gap-5 mb-16">
              {[
                { label: "On-premise / Private cloud", highlight: true,  note: `Recommended for ${brand.clientName}`, desc: "Milo lives inside your own infrastructure. No data leaves. Full control. No vendor lock-in." },
                { label: "Hosted",                     highlight: false, note: "",                         desc: "We manage the infrastructure. Fastest time to value for pilots and smaller teams." },
              ].map((opt, i) => (
                <div key={i} className="rounded-2xl p-7 border-2 hover:shadow-lg transition-shadow duration-300" style={{
                  borderColor: opt.highlight ? accent : "#e5e7eb",
                  opacity: caseIn ? 1 : 0, transform: caseIn ? "none" : "translateY(24px)",
                  transition: `opacity .7s ease ${i * .12}s, transform .7s ease ${i * .12}s`,
                }}>
                  <div className="mb-3">
                    <span className="text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded" style={{
                      backgroundColor: opt.highlight ? accent : "#f4f4f5",
                      color: opt.highlight ? accentText : "#6b7280",
                    }}>{opt.label}</span>
                  </div>
                  {opt.note && <p className="text-xs font-semibold mb-3" style={{ color: accent }}>{opt.note}</p>}
                  <p className="text-gray-600 text-sm leading-relaxed">{opt.desc}</p>
                </div>
              ))}
            </div>
            <div className="relative rounded-2xl p-10 overflow-hidden" style={{ backgroundColor: "#050505" }}>
              <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: grain, opacity: 0.5 }}/>
              <div className="absolute inset-0 pointer-events-none" style={{
                background: `radial-gradient(ellipse 50% 120% at 0% 50%,rgba(${rgb},.14) 0%,transparent 60%)`,
              }}/>
              <div className="relative z-10">
                <p className="text-xs font-bold uppercase tracking-[0.2em] mb-5" style={{ color: accent }}>Proof it works</p>
                <p className="text-2xl xl:text-3xl text-white mb-5 leading-snug" style={{
                  fontFamily: "var(--font-serif)", fontWeight: 400, fontStyle: "italic",
                }}>&ldquo;{content.relevantCaseStudy.result}&rdquo;</p>
                <p className="text-gray-600 text-sm">— {content.relevantCaseStudy.company}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          PRICING
      ══════════════════════════════════════════ */}
      <Divider rgb={rgb}/>
      <section className="relative bg-black px-6 py-24 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: grain, opacity: 0.4 }}/>
        <div ref={pricingRef} className="max-w-5xl mx-auto relative z-10">
          <div style={{
            opacity: pricingIn ? 1 : 0, transform: pricingIn ? "none" : "translateY(40px)",
            transition: "opacity .9s ease, transform .9s ease",
          }}>
            <div className="flex items-center gap-4 mb-3">
              {brand.logoUrl && <img src={brand.logoUrl} alt={brand.clientName} className="h-8 object-contain" style={{ filter: "brightness(0) invert(1)" }}/>}
              <h2 className="text-5xl xl:text-6xl text-white" style={{
                fontFamily: "var(--font-serif)", fontWeight: 400, letterSpacing: "-0.02em",
              }}>The offer for {brand.clientName}.</h2>
            </div>
            <p className="text-gray-600 mb-12">Recommended based on your team&apos;s needs.</p>
            <div className="rounded-2xl p-10 relative overflow-hidden" style={{
              border: `1.5px solid ${accent}`,
              boxShadow: `0 0 0 1px ${accent}22, 0 0 40px ${accent}40, 0 0 80px ${accent}20, 0 8px 40px rgba(0,0,0,0.5)`,
              transform: "scale(1.02)",
            }}>
              <div className="absolute top-0 left-0 right-0 h-px" style={{
                background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
              }}/>
              <div className="absolute inset-0 pointer-events-none" style={{
                background: `radial-gradient(ellipse 90% 60% at 50% 0%, ${accent}22 0%, transparent 65%)`,
              }}/>
              <div className="absolute inset-0 pointer-events-none" style={{
                background: `radial-gradient(ellipse 60% 40% at 50% 100%, ${accent}10 0%, transparent 60%)`,
              }}/>
              <div className="relative z-10 flex items-start justify-between mb-8">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] mb-2" style={{ color: accent }}>Recommended</p>
                  <h3 className="text-3xl font-black text-white">{tier.label}</h3>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-black text-white">{content.customPrice ?? tier.price}</div>
                  {content.recommendedTier !== "enterprise" && <div className="text-gray-600 text-sm mt-1">billed monthly</div>}
                </div>
              </div>
              <ul className="space-y-3 mb-8">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-gray-400">
                    <span style={{ color: accent }}>✓</span>{f}
                  </li>
                ))}
              </ul>
              {content.customAddOns.length > 0 && (
                <div className="border-t pt-6" style={{ borderColor: `rgba(${rgb},.15)` }}>
                  <p className="text-xs font-bold uppercase tracking-[0.15em] text-gray-600 mb-4">Custom add-ons for {brand.clientName}</p>
                  <ul className="space-y-2">
                    {content.customAddOns.map((a, i) => (
                      <li key={i} className="text-sm text-gray-500 flex items-center gap-3">
                        <span style={{ color: accent }}>+</span>{a}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FINAL CTA
      ══════════════════════════════════════════ */}
      <Divider rgb={rgb}/>
      <section className="relative bg-black px-6 py-32 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: grain, opacity: 0.5 }}/>
        <div className="absolute inset-0 pointer-events-none" style={{
          background: `radial-gradient(ellipse 70% 80% at 50% 50%,rgba(${rgb},.2) 0%,transparent 65%)`,
        }}/>
        <div className="relative z-10 max-w-5xl mx-auto">
          <img src={MILO_LOGO} alt="Milo" className="h-7 object-contain brightness-0 invert mx-auto mb-10 opacity-70"/>
          <h2 className="text-5xl xl:text-6xl text-white mb-4" style={{
            fontFamily: "var(--font-serif)", fontWeight: 400, letterSpacing: "-0.02em",
          }}>Ready to get started?</h2>
          <p className="text-gray-600 mb-10 max-w-xs mx-auto text-base">
            30 minutes. We&apos;ll answer {content.contactName}&apos;s questions live, using {brand.clientName}&apos;s own data.
          </p>
          <a href={content.ctaUrl} target="_blank" rel="noopener noreferrer"
            className="btn-glow inline-block text-sm font-bold px-10 py-4 rounded-lg"
            style={{ backgroundColor: accent, color: accentText }}>
            {content.ctaText} →
          </a>
        </div>
      </section>
    </div>
  );
}

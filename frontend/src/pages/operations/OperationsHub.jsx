import { Link } from 'react-router';
import './operations.css';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AnimatePresence,
  MotionConfig,
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
} from 'motion/react';
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Compass,
  CreditCard,
  Download,
  FileCheck2,
  Globe,
  Image as ImageIcon,
  LayoutDashboard,
  Lock,
  MapPin,
  Menu,
  Navigation,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Smartphone,
  UploadCloud,
  Video,
  Wallet,
  X,
} from 'lucide-react';
// Sample images: avatars fall back to initials; the evidence photo reuses a licensed site photo
const PROVIDER_AVATAR = null;
const ADMIN_AVATAR = null;
const SAMPLE_EVIDENCE_IMG = '/images/svc-property_inspection.jpg';
const CURRENCY_RATES = {
  USD: { symbol: '$', lkrRate: 298.5, usdFactor: 1 },
  GBP: { symbol: '£', lkrRate: 378.2, usdFactor: 0.79 },
  EUR: { symbol: '€', lkrRate: 324.4, usdFactor: 0.92 },
  AUD: { symbol: 'A$', lkrRate: 196.8, usdFactor: 1.52 },
};
const SUBSCRIPTION_SERIES = {
  monthly: [
    { label: 'Jun', mrr: 12400, subscribers: 448, retention: 98.4 },
    { label: 'Jul', mrr: 13650, subscribers: 492, retention: 99.1 },
    { label: 'Aug', mrr: 14900, subscribers: 530, retention: 100.6 },
    { label: 'Sep', mrr: 16280, subscribers: 579, retention: 101.8 },
    { label: 'Oct', mrr: 17840, subscribers: 632, retention: 103.1 },
    { label: 'Nov', mrr: 19420, subscribers: 684, retention: 104.2 },
  ],
  quarterly: [
    { label: 'Q2 2025', mrr: 31200, subscribers: 365, retention: 97.2 },
    { label: 'Q3 2025', mrr: 37900, subscribers: 428, retention: 98.9 },
    { label: 'Q4 2025', mrr: 44100, subscribers: 496, retention: 100.4 },
    { label: 'Q1 2026', mrr: 49850, subscribers: 554, retention: 101.7 },
    { label: 'Q2 2026', mrr: 54600, subscribers: 618, retention: 102.9 },
    { label: 'Q3 2026', mrr: 61480, subscribers: 684, retention: 104.2 },
  ],
  annual: [
    { label: '2021', mrr: 42000, subscribers: 140, retention: 94.0 },
    { label: '2022', mrr: 78500, subscribers: 235, retention: 96.4 },
    { label: '2023', mrr: 119000, subscribers: 348, retention: 98.1 },
    { label: '2024', mrr: 164200, subscribers: 472, retention: 100.5 },
    { label: '2025', mrr: 208900, subscribers: 589, retention: 102.6 },
    { label: '2026', mrr: 249600, subscribers: 684, retention: 104.2 },
  ],
};
const INITIAL_COMMISSIONS = [
  {
    id: 'LK-8942',
    service: '5kW Hybrid Solar Maintenance',
    district: 'Colombo 07',
    clientName: 'Suresh Wickramasinghe',
    overseasOrigin: 'London, UK',
    providerName: 'Kavinda Perera',
    amountUsd: 420,
    status: 'Awaiting Payment',
    updatedAt: '12 mins ago',
  },
  {
    id: 'LK-8939',
    service: 'Estate Security & CCTV Calibration',
    district: 'Rajagiriya',
    clientName: 'Anushka De Silva',
    overseasOrigin: 'Melbourne, AU',
    providerName: 'Nadeesha Fernando',
    amountUsd: 315,
    status: 'Active',
    updatedAt: '28 mins ago',
  },
  {
    id: 'LK-8935',
    service: 'Quarterly Villa HVAC Servicing',
    district: 'Galle Fort',
    clientName: 'Rohan Mendis',
    overseasOrigin: 'Toronto, CA',
    providerName: 'Roshan Silva',
    amountUsd: 260,
    status: 'Completed',
    updatedAt: '1 hr ago',
  },
  {
    id: 'LK-8931',
    service: 'Smart Meter & Surge Protection',
    district: 'Colombo 03',
    clientName: 'Malini Jayasinghe',
    overseasOrigin: 'San Jose, US',
    providerName: 'Kavinda Perera',
    amountUsd: 540,
    status: 'Awaiting Payment',
    updatedAt: '2 hrs ago',
  },
  {
    id: 'LK-8924',
    service: 'Elderly Care Home Accessibility Audit',
    district: 'Kandy',
    clientName: 'Tharindu Gunasekara',
    overseasOrigin: 'Singapore, SG',
    providerName: 'Nadeesha Fernando',
    amountUsd: 195,
    status: 'Completed',
    updatedAt: '4 hrs ago',
  },
];
const INITIAL_PROVIDERS = [
  {
    id: 'prov-1',
    name: 'Kavinda Perera',
    specialty: 'Solar & Smart Grid Engineer',
    district: 'Cinnamon Gardens, Colombo 07',
    destination: '24 Ward Place Residence',
    coordinates: { lat: 6.9147, lng: 79.8636 },
    etaMinutes: 4,
    distanceKm: 1.2,
    avatar: PROVIDER_AVATAR,
    checkedIn: false,
    checkedInAt: null,
    lastDurationSec: null,
    mapStart: { x: 265, y: 185 },
    mapEnd: { x: 430, y: 145 },
  },
  {
    id: 'prov-2',
    name: 'Nadeesha Fernando',
    specialty: 'Security & IoT Automation',
    district: 'Nawala Road, Rajagiriya',
    destination: '118 Lake Crescent Villa',
    coordinates: { lat: 6.9095, lng: 79.8938 },
    etaMinutes: 9,
    distanceKm: 2.8,
    avatar: ADMIN_AVATAR,
    checkedIn: true,
    checkedInAt: Date.now() - 1840 * 1000,
    lastDurationSec: null,
    mapStart: { x: 510, y: 205 },
    mapEnd: { x: 585, y: 170 },
  },
  {
    id: 'prov-3',
    name: 'Roshan Silva',
    specialty: 'HVAC & Water Systems Lead',
    district: 'Galle Road, Kollupitiya',
    destination: '72 Bagatalle Road',
    coordinates: { lat: 6.9022, lng: 79.8528 },
    etaMinutes: 6,
    distanceKm: 1.9,
    avatar: PROVIDER_AVATAR,
    checkedIn: false,
    checkedInAt: null,
    lastDurationSec: 2740,
    mapStart: { x: 180, y: 240 },
    mapEnd: { x: 295, y: 275 },
  },
];
const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-1',
    category: 'Provider Arrived',
    title: 'Provider arrived at Rajagiriya site',
    detail: 'Nadeesha Fernando verified GPS perimeter at 118 Lake Crescent Villa.',
    timestamp: 'Just now',
    targetView: 'gps',
    unread: true,
  },
  {
    id: 'notif-2',
    category: 'Payment Cleared',
    title: 'Overseas payment cleared ($260.00)',
    detail: 'Rohan Mendis (Toronto, CA) settled invoice LK-8935 via Apple Pay.',
    timestamp: '14 mins ago',
    targetView: 'analytics',
    unread: true,
  },
  {
    id: 'notif-3',
    category: 'New Service Report',
    title: 'New inspection report uploaded',
    detail: 'Solar inverter diagnostics & conduit verification submitted for Colombo 07.',
    timestamp: '42 mins ago',
    targetView: 'evidence',
    unread: false,
  },
  {
    id: 'notif-4',
    category: 'Commission Disbursed',
    title: 'LKR 58,200 settled to field specialist',
    detail: 'Automated payout cleared for completed Kandy accessibility audit.',
    timestamp: '2 hrs ago',
    targetView: 'analytics',
    unread: false,
  },
];
const DEFAULT_REPORT = {
  id: 'SR-2026-0842',
  fileName: 'colombo07_solar_inverter_inspection.jpg',
  fileSize: '3.4 MB',
  mediaType: 'image',
  previewUrl: SAMPLE_EVIDENCE_IMG,
  providerName: 'Kavinda Perera',
  district: 'Colombo 07 · Ward Place',
  submittedAt: 'Today, 14:22 IST',
  gpsTag: '6.9147° N, 79.8636° E',
  notes:
    'Replaced surge arrester module, verified grid-tie inverter telemetry, and sealed exterior PVC conduit entries against monsoon moisture.',
  checklist: [
    { id: 'c1', label: 'Inverter voltage & grid synchronization verified', verified: true },
    { id: 'c2', label: 'Distribution breaker thermal scan nominal', verified: true },
    { id: 'c3', label: 'Weatherproof conduit sealing photographed', verified: true },
    { id: 'c4', label: 'Overseas homeowner sign-off notification queued', verified: true },
  ],
};
function formatDuration(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return [hrs, mins, secs].map((n) => String(n).padStart(2, '0')).join(':');
}
function AvatarImage({ src, alt, initials, className = 'w-10 h-10' }) {
  const [failed, setFailed] = useState(false);
  if (failed || !src) {
    return (
      <div
        className={`${className} rounded-full bg-gradient-to-br from-sky-500/30 to-emerald-500/20 border border-white/15 flex items-center justify-center text-xs font-semibold text-sky-100 shrink-0`}
        aria-label={alt}
      >
        {initials}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`${className} rounded-full object-cover border border-white/15 shrink-0`}
    />
  );
}
function LiquidGlassPanel({ children, className = '', interactive = true, onClick }) {
  const ref = useRef(null);
  const rawX = useMotionValue(-300);
  const rawY = useMotionValue(-300);
  const mouseX = useSpring(rawX, { stiffness: 280, damping: 28 });
  const mouseY = useSpring(rawY, { stiffness: 280, damping: 28 });
  const [hovered, setHovered] = useState(false);
  const spotlight = useMotionTemplate`radial-gradient(420px circle at ${mouseX}px ${mouseY}px, rgba(56, 189, 248, 0.14), rgba(16, 185, 129, 0.04) 48%, transparent 80%)`;
  const borderGlow = useMotionTemplate`radial-gradient(240px circle at ${mouseX}px ${mouseY}px, rgba(125, 211, 252, 0.36), transparent 75%)`;
  const handleMouseMove = (e) => {
    if (!interactive || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    rawX.set(e.clientX - rect.left);
    rawY.set(e.clientY - rect.top);
  };
  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => interactive && setHovered(true)}
      onMouseLeave={() => interactive && setHovered(false)}
      onClick={onClick}
      whileHover={interactive ? { y: -2 } : undefined}
      transition={{ type: 'spring', stiffness: 360, damping: 28 }}
      className={`relative overflow-hidden rounded-2xl bg-white/[0.04] backdrop-blur-2xl border border-white/[0.11] shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_20px_50px_-24px_rgba(2,6,23,0.85)] ${className}`}
    >
      {/* Dynamic liquid radial spotlight following cursor */}
      {interactive && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 transition-opacity duration-200"
          style={{
            background: spotlight,
            opacity: hovered ? 1 : 0,
          }}
        />
      )}
      {/* Specular top edge & pointer border refraction */}
      {interactive && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-2xl p-[1px] transition-opacity duration-200"
          style={{
            background: borderGlow,
            opacity: hovered ? 0.65 : 0,
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
          }}
        />
      )}
      <div className="relative z-10 h-full">{children}</div>
    </motion.div>
  );
}
function MagneticButton({
  children,
  onClick,
  className = '',
  variant = 'primary',
  type = 'button',
  disabled = false,
  ariaLabel,
}) {
  const ref = useRef(null);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const spotX = useMotionValue(0);
  const spotY = useMotionValue(0);
  const springX = useSpring(rawX, { stiffness: 340, damping: 22, mass: 0.45 });
  const springY = useSpring(rawY, { stiffness: 340, damping: 22, mass: 0.45 });
  const spotlight = useMotionTemplate`radial-gradient(120px circle at ${spotX}px ${spotY}px, rgba(255, 255, 255, 0.22), transparent 75%)`;
  const [hovered, setHovered] = useState(false);
  const handleMouseMove = (e) => {
    if (disabled || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    rawX.set((e.clientX - cx) * 0.22);
    rawY.set((e.clientY - cy) * 0.22);
    spotX.set(e.clientX - rect.left);
    spotY.set(e.clientY - rect.top);
  };
  const handleMouseLeave = () => {
    setHovered(false);
    rawX.set(0);
    rawY.set(0);
  };
  const variantStyles =
    variant === 'primary'
      ? 'bg-sky-400 text-slate-950 font-semibold shadow-[0_10px_30px_-10px_rgba(56,189,248,0.6)] hover:bg-sky-300'
      : variant === 'emerald'
        ? 'bg-emerald-400 text-slate-950 font-semibold shadow-[0_10px_30px_-10px_rgba(16,185,129,0.55)] hover:bg-emerald-300'
        : 'bg-white/[0.06] text-slate-100 border border-white/15 hover:bg-white/[0.1] hover:border-white/25';
  return (
    <motion.button
      ref={ref}
      type={type}
      disabled={disabled}
      aria-label={ariaLabel}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => !disabled && setHovered(true)}
      onMouseLeave={handleMouseLeave}
      whileTap={disabled ? undefined : { scale: 0.96 }}
      style={{ x: springX, y: springY }}
      className={`relative overflow-hidden inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${variantStyles} ${className}`}
    >
      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 transition-opacity duration-150"
        style={{ background: spotlight, opacity: hovered ? 1 : 0 }}
      />
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
    </motion.button>
  );
}
function SubscriptionChart({ timeframe, onTimeframeChange }) {
  const data = SUBSCRIPTION_SERIES[timeframe];
  const [hoveredIdx, setHoveredIdx] = useState(data.length - 1);
  const width = 680;
  const height = 250;
  const padLeft = 46;
  const padRight = 24;
  const padTop = 26;
  const padBottom = 34;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;
  const minVal = Math.min(...data.map((d) => d.mrr)) * 0.85;
  const maxVal = Math.max(...data.map((d) => d.mrr)) * 1.08;
  const points = useMemo(() => {
    return data.map((item, index) => {
      const x = padLeft + (index / (data.length - 1)) * plotW;
      const y = padTop + plotH - ((item.mrr - minVal) / (maxVal - minVal)) * plotH;
      return { ...item, x, y };
    });
  }, [data, minVal, maxVal, plotW, plotH]);
  const linePath = useMemo(() => {
    if (points.length === 0) return '';
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const curr = points[i];
      const next = points[i + 1];
      const cpX = (curr.x + next.x) / 2;
      path += ` C ${cpX} ${curr.y}, ${cpX} ${next.y}, ${next.x} ${next.y}`;
    }
    return path;
  }, [points]);
  const areaPath = useMemo(() => {
    if (points.length === 0) return '';
    const last = points[points.length - 1];
    const first = points[0];
    return `${linePath} L ${last.x} ${padTop + plotH} L ${first.x} ${padTop + plotH} Z`;
  }, [linePath, points, plotH]);
  const activeIndex = hoveredIdx !== null && points[hoveredIdx] ? hoveredIdx : points.length - 1;
  const activePoint = points[activeIndex];
  const handleSvgMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * width;
    let closestIdx = 0;
    let minDist = Infinity;
    points.forEach((pt, idx) => {
      const d = Math.abs(pt.x - relX);
      if (d < minDist) {
        minDist = d;
        closestIdx = idx;
      }
    });
    setHoveredIdx(closestIdx);
  };
  return (
    <div className="p-6 flex flex-col justify-between h-full">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-semibold text-white tracking-tight">
            Recurring Subscription Metrics
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Diaspora care & property retainer revenue · Hover curve to inspect period
          </p>
        </div>

        <div
          className="inline-flex items-center p-1 rounded-xl bg-white/[0.04] border border-white/10"
          role="tablist"
          aria-label="Subscription metric timeframe"
        >
          {['monthly', 'quarterly', 'annual'].map((tf) => {
            const active = timeframe === tf;
            return (
              <button
                key={tf}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  onTimeframeChange(tf);
                  setHoveredIdx(SUBSCRIPTION_SERIES[tf].length - 1);
                }}
                className={`relative px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-colors whitespace-nowrap shrink-0 cursor-pointer ${active ? 'text-slate-950' : 'text-slate-300 hover:text-white'}`}
              >
                {active && (
                  <motion.span
                    layoutId="chart-timeframe-pill"
                    transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                    className="absolute inset-0 rounded-lg bg-sky-400"
                  />
                )}
                <span className="relative z-10">{tf}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Chart Viewport */}
      <div className="relative w-full">
        {/* Active point glass readout strip */}
        {activePoint && (
          <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3 mb-4 rounded-xl bg-white/[0.035] border border-white/[0.08]">
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <span className="font-medium text-white">{activePoint.label}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums text-sky-300">
                ${activePoint.mrr.toLocaleString()} MRR
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-300 font-mono tabular-nums">
              <span>{activePoint.subscribers} active plans</span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-300">{activePoint.retention}% net retention</span>
            </div>
          </div>
        )}

        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-56 sm:h-64 overflow-visible select-none"
          onMouseMove={handleSvgMove}
          onMouseLeave={() => setHoveredIdx(points.length - 1)}
          role="img"
          aria-label="Recurring subscription revenue chart"
        >
          <defs>
            <linearGradient id="lankaAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.34" />
              <stop offset="55%" stopColor="#10B981" stopOpacity="0.10" />
              <stop offset="100%" stopColor="#050811" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="lankaStrokeGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#34D399" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
            const y = padTop + plotH * t;
            const val = Math.round(maxVal - (maxVal - minVal) * t);
            return (
              <g key={i}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke="rgba(255,255,255,0.06)"
                  strokeDasharray="3 4"
                />
                <text
                  x={padLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-slate-500 text-[10px] font-mono tabular-nums"
                >
                  ${Math.round(val / 1000)}k
                </text>
              </g>
            );
          })}

          {/* Area Fill */}
          <motion.path
            key={`area-${timeframe}`}
            d={areaPath}
            fill="url(#lankaAreaGrad)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.45 }}
          />

          {/* Main Spline Path */}
          <motion.path
            key={`line-${timeframe}`}
            d={linePath}
            fill="none"
            stroke="url(#lankaStrokeGrad)"
            strokeWidth="2.75"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0.4 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          />

          {/* Active Crosshair */}
          {activePoint && (
            <g>
              <line
                x1={activePoint.x}
                y1={padTop}
                x2={activePoint.x}
                y2={padTop + plotH}
                stroke="rgba(56, 189, 248, 0.35)"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
            </g>
          )}

          {/* Data Nodes & X-Axis Labels */}
          {points.map((pt, idx) => {
            const isSelected = idx === activeIndex;
            return (
              <g key={pt.label}>
                <text
                  x={pt.x}
                  y={height - 8}
                  textAnchor="middle"
                  className={`text-[11px] font-medium transition-colors ${isSelected ? 'fill-sky-300' : 'fill-slate-500'}`}
                >
                  {pt.label}
                </text>
                {isSelected && (
                  <motion.circle
                    cx={pt.x}
                    cy={pt.y}
                    r={10}
                    fill="rgba(56, 189, 248, 0.18)"
                    initial={{ scale: 0.6 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 20 }}
                  />
                )}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isSelected ? 4.5 : 3}
                  fill={isSelected ? '#38BDF8' : '#0B1221'}
                  stroke={isSelected ? '#FFFFFF' : '#38BDF8'}
                  strokeWidth={isSelected ? 2 : 1.75}
                />
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
function LiquidSlideControl({ mode, onComplete }) {
  const trackRef = useRef(null);
  const [maxDrag, setMaxDrag] = useState(260);
  const [completed, setCompleted] = useState(false);
  const thumbSize = 52;
  const padding = 6;
  const x = useMotionValue(0);
  useEffect(() => {
    const updateWidth = () => {
      if (trackRef.current) {
        const w = trackRef.current.clientWidth;
        setMaxDrag(Math.max(120, w - thumbSize - padding * 2));
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);
  const fillWidth = useTransform(
    x,
    [0, maxDrag],
    [thumbSize + padding, maxDrag + thumbSize + padding],
  );
  const textOpacity = useTransform(x, [0, maxDrag * 0.55], [1, 0]);
  const triggerComplete = () => {
    if (completed) return;
    setCompleted(true);
    x.set(maxDrag);
    setTimeout(() => {
      onComplete();
    }, 340);
  };
  const handleDragEnd = () => {
    if (x.get() >= maxDrag * 0.76) {
      triggerComplete();
    } else {
      x.set(0);
    }
  };
  const isCheckin = mode === 'checkin';
  return (
    <div className="space-y-2.5">
      <div
        ref={trackRef}
        className={`relative h-16 rounded-2xl border backdrop-blur-xl overflow-hidden select-none flex items-center px-1.5 transition-colors ${
          isCheckin
            ? 'bg-emerald-500/[0.08] border-emerald-400/25'
            : 'bg-amber-500/[0.08] border-amber-400/25'
        }`}
      >
        {/* Dynamic Liquid Fill Trail */}
        <motion.div
          aria-hidden="true"
          style={{ width: fillWidth }}
          className={`absolute left-0 top-0 bottom-0 rounded-2xl pointer-events-none ${
            isCheckin
              ? 'bg-gradient-to-r from-emerald-500/25 via-emerald-400/35 to-sky-400/40'
              : 'bg-gradient-to-r from-amber-500/25 via-amber-400/35 to-rose-400/40'
          }`}
        />

        {/* Instruction Label */}
        <motion.div
          style={{ opacity: textOpacity }}
          className="w-full text-center pl-10 pr-4 pointer-events-none flex items-center justify-center gap-2 text-sm font-medium text-slate-200"
        >
          <span>{isCheckin ? 'Slide to Check-in' : 'Slide to Check-out'}</span>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </motion.div>

        {/* Draggable Liquid Glass Handle */}
        <motion.button
          type="button"
          drag={completed ? false : 'x'}
          dragConstraints={{ left: 0, right: maxDrag }}
          dragElastic={0.05}
          dragMomentum={false}
          onDragEnd={handleDragEnd}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              triggerComplete();
            }
          }}
          style={{ x }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 420, damping: 28 }}
          aria-label={
            isCheckin ? 'Slide or press Enter to Check-in' : 'Slide or press Enter to Check-out'
          }
          className={`relative z-10 w-[52px] h-[52px] rounded-xl flex items-center justify-center shadow-lg cursor-grab active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
            isCheckin
              ? 'bg-emerald-400 text-slate-950 shadow-emerald-500/30'
              : 'bg-amber-400 text-slate-950 shadow-amber-500/30'
          }`}
        >
          {completed ? (
            <Check className="w-5 h-5 stroke-[2.5]" />
          ) : (
            <ArrowRight className="w-5 h-5 stroke-[2.2]" />
          )}
        </motion.button>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span>
          {isCheckin
            ? 'Drag slider across to verify GPS arrival'
            : 'Drag slider across to close active visit'}
        </span>
        <button
          type="button"
          onClick={triggerComplete}
          className="text-sky-300 hover:text-sky-200 underline underline-offset-4 cursor-pointer whitespace-nowrap shrink-0"
        >
          {isCheckin ? 'Quick Check-in' : 'Quick Check-out'}
        </button>
      </div>
    </div>
  );
}
function EmbossedGlassCreditCard({
  cardNumber,
  cardHolder,
  expiry,
  cvv,
  cvvFocused,
  amountFormatted,
}) {
  const cardRef = useRef(null);
  const rawX = useMotionValue(0.5);
  const rawY = useMotionValue(0.5);
  const smoothX = useSpring(rawX, { stiffness: 220, damping: 22 });
  const smoothY = useSpring(rawY, { stiffness: 220, damping: 22 });
  const rotateX = useTransform(smoothY, [0, 1], [14, -14]);
  const rotateY = useTransform(smoothX, [0, 1], [-16, 16]);
  const sheenX = useTransform(smoothX, [0, 1], ['0%', '100%']);
  const sheenY = useTransform(smoothY, [0, 1], ['0%', '100%']);
  const specularBg = useMotionTemplate`radial-gradient(280px circle at ${sheenX} ${sheenY}, rgba(255, 255, 255, 0.28), rgba(56, 189, 248, 0.12) 40%, transparent 75%)`;
  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    rawX.set((e.clientX - rect.left) / rect.width);
    rawY.set((e.clientY - rect.top) / rect.height);
  };
  const handleMouseLeave = () => {
    rawX.set(0.5);
    rawY.set(0.5);
  };
  const displayNum = cardNumber.trim() || '4532 8810 4920 1184';
  const displayHolder = cardHolder.trim() || 'SHENAL WIJESEKERA';
  const displayExp = expiry.trim() || '09/29';
  return (
    <div
      className="py-2"
      style={{ perspective: '1000px' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        ref={cardRef}
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        className="relative w-full max-w-[360px] mx-auto aspect-[1.586/1] rounded-2xl p-6 overflow-hidden bg-gradient-to-br from-slate-800/75 via-sky-950/60 to-slate-900/90 backdrop-blur-2xl border border-white/25 shadow-[inset_0_1px_1px_rgba(255,255,255,0.38),0_30px_60px_-20px_rgba(14,165,233,0.4)] select-none"
      >
        {/* Dynamic pointer-driven specular glass sheen */}
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ background: specularBg }}
        />

        {/* Subtle geometric glass refraction lines */}
        <svg
          aria-hidden="true"
          viewBox="0 0 360 227"
          className="pointer-events-none absolute inset-0 w-full h-full opacity-25"
        >
          <circle
            cx="295"
            cy="42"
            r="95"
            fill="none"
            stroke="rgba(125,211,252,0.45)"
            strokeWidth="0.75"
          />
          <circle
            cx="315"
            cy="65"
            r="130"
            fill="none"
            stroke="rgba(52,211,153,0.35)"
            strokeWidth="0.75"
          />
        </svg>

        <div className="relative z-10 flex flex-col justify-between h-full">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-medium tracking-wide text-sky-200/80 block">
                LankaLink Diaspora Pay
              </span>
              <span className="font-mono text-sm font-semibold text-white tabular-nums">
                {amountFormatted}
              </span>
            </div>
            {/* Embossed metallic chip */}
            <div className="w-10 h-7 rounded-md bg-gradient-to-br from-amber-200/70 via-amber-300/40 to-amber-100/20 border border-amber-200/50 shadow-inner" />
          </div>

          <div className="my-auto pt-3">
            <p
              className="font-mono text-lg sm:text-[19px] tracking-[0.14em] text-white font-medium tabular-nums"
              style={{ textShadow: '0 1px 2px rgba(0,0,0,0.6), 0 -1px 0 rgba(255,255,255,0.22)' }}
            >
              {displayNum}
            </p>
          </div>

          <div className="flex items-end justify-between gap-4">
            <div className="min-w-0">
              <span className="text-[10px] text-slate-300/70 block">Cardholder</span>
              <span className="text-xs font-medium tracking-wider text-white uppercase truncate block">
                {displayHolder}
              </span>
            </div>
            <div className="flex items-end gap-4 shrink-0 font-mono tabular-nums">
              <div>
                <span className="text-[10px] text-slate-300/70 block font-sans">Expires</span>
                <span className="text-xs text-white">{displayExp}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-300/70 block font-sans">CVV</span>
                <span
                  className={`text-xs transition-colors ${cvvFocused ? 'text-sky-300 font-semibold' : 'text-white'}`}
                >
                  {cvvFocused ? cvv || '842' : '•••'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
export default function OperationsHub() {
  const [activeView, setActiveView] = useState('analytics');
  const [timeframe, setTimeframe] = useState('monthly');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  // Commissions & Search State
  const [commissions, setCommissions] = useState(INITIAL_COMMISSIONS);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  // GPS Portal State
  const [providers, setProviders] = useState(INITIAL_PROVIDERS);
  const [selectedProviderId, setSelectedProviderId] = useState(INITIAL_PROVIDERS[0].id);
  const [mapZoomMode, setMapZoomMode] = useState('corridor');
  const [tickNow, setTickNow] = useState(() => Date.now());
  // Evidence Upload State
  const [uploadStage, setUploadStage] = useState('report');
  const [uploadProgress, setUploadProgress] = useState(100);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [currentReport, setCurrentReport] = useState(DEFAULT_REPORT);
  const [evidenceImgError, setEvidenceImgError] = useState(false);
  const fileInputRef = useRef(null);
  // Payment Modal State
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentCommissionId, setPaymentCommissionId] = useState('LK-8942');
  const [currency, setCurrency] = useState('USD');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [selectedWallet, setSelectedWallet] = useState('Apple Pay');
  const [cardNumber, setCardNumber] = useState('4532 8810 4920 1184');
  const [cardHolder, setCardHolder] = useState('Shenal Wijesekera');
  const [cardExpiry, setCardExpiry] = useState('09/29');
  const [cardCvv, setCardCvv] = useState('842');
  const [cvvFocused, setCvvFocused] = useState(false);
  const [paymentPhase, setPaymentPhase] = useState('form');
  // Notification Panel State
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [notifFilter, setNotifFilter] = useState('all');
  // Global live elapsed timer for checked-in providers
  useEffect(() => {
    const id = window.setInterval(() => {
      setTickNow(Date.now());
    }, 1000);
    return () => window.clearInterval(id);
  }, []);
  // Push notification helper
  const pushNotification = (category, title, detail, targetView) => {
    const newItem = {
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      category,
      title,
      detail,
      timestamp: 'Just now',
      targetView,
      unread: true,
    };
    setNotifications((prev) => [newItem, ...prev]);
  };
  // Filtered Commissions
  const filteredCommissions = useMemo(() => {
    return commissions.filter((item) => {
      const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        item.id.toLowerCase().includes(q) ||
        item.service.toLowerCase().includes(q) ||
        item.district.toLowerCase().includes(q) ||
        item.clientName.toLowerCase().includes(q) ||
        item.overseasOrigin.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [commissions, statusFilter, searchQuery]);
  // Selected Provider
  const activeProvider = useMemo(
    () => providers.find((p) => p.id === selectedProviderId) || providers[0],
    [providers, selectedProviderId],
  );
  // GPS Check-in / Check-out Handler
  const handleProviderSlideAction = () => {
    setProviders((prev) =>
      prev.map((p) => {
        if (p.id !== activeProvider.id) return p;
        if (!p.checkedIn) {
          pushNotification(
            'Provider Arrived',
            `${p.name} checked in on-site`,
            `GPS perimeter locked at ${p.destination}, ${p.district}.`,
            'gps',
          );
          return {
            ...p,
            checkedIn: true,
            checkedInAt: Date.now(),
          };
        } else {
          const duration = p.checkedInAt
            ? Math.max(1, Math.floor((Date.now() - p.checkedInAt) / 1000))
            : 120;
          pushNotification(
            'New Service Report',
            `${p.name} completed site check-out`,
            `Logged ${formatDuration(duration)} active service duration at ${p.destination}.`,
            'gps',
          );
          return {
            ...p,
            checkedIn: false,
            checkedInAt: null,
            lastDurationSec: duration,
          };
        }
      }),
    );
  };
  // Simulate slight live GPS jitter for realism
  const handleRefreshCoordinates = () => {
    setProviders((prev) =>
      prev.map((p) => {
        if (p.id !== activeProvider.id) return p;
        const deltaLat = (Math.random() - 0.5) * 0.0008;
        const deltaLng = (Math.random() - 0.5) * 0.0008;
        return {
          ...p,
          coordinates: {
            lat: Number((p.coordinates.lat + deltaLat).toFixed(4)),
            lng: Number((p.coordinates.lng + deltaLng).toFixed(4)),
          },
        };
      }),
    );
  };
  // Liquid-Fill Upload Sequence
  const startLiquidUpload = (fileName, fileSize, mediaType, previewUrl) => {
    setUploadStage('uploading');
    setUploadProgress(0);
    setEvidenceImgError(false);
    const start = performance.now();
    const duration = 2100;
    const step = (now) => {
      const elapsed = now - start;
      const ratio = Math.min(1, elapsed / duration);
      // Smooth ease-out curve
      const eased = 1 - Math.pow(1 - ratio, 2.2);
      const pct = Math.round(eased * 100);
      setUploadProgress(pct);
      if (ratio < 1) {
        requestAnimationFrame(step);
      } else {
        const newReport = {
          id: `SR-2026-${Math.floor(1000 + Math.random() * 8999)}`,
          fileName,
          fileSize,
          mediaType,
          previewUrl,
          providerName: activeProvider.name,
          district: activeProvider.district,
          submittedAt: 'Just now · IST',
          gpsTag: `${activeProvider.coordinates.lat.toFixed(4)}° N, ${activeProvider.coordinates.lng.toFixed(4)}° E`,
          notes:
            mediaType === 'video'
              ? 'Walkthrough video inspection uploaded and indexed with verified field coordinates for overseas client review.'
              : 'High-resolution inspection photograph verified against site coordinates and attached to the active service dossier.',
          checklist: [
            { id: 'c1', label: 'Media EXIF & location coordinates matched', verified: true },
            { id: 'c2', label: 'Safety & workmanship standards confirmed', verified: true },
            { id: 'c3', label: 'Overseas client portal preview published', verified: true },
          ],
        };
        setCurrentReport(newReport);
        setUploadStage('report');
        pushNotification(
          'New Service Report',
          `Report ${newReport.id} ready for review`,
          `${fileName} (${fileSize}) verified in ${activeProvider.district}.`,
          'evidence',
        );
      }
    };
    requestAnimationFrame(step);
  };
  const handleFileSelected = (file) => {
    const isVideo = file.type.startsWith('video/');
    const mediaType = isVideo ? 'video' : 'image';
    const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
    const previewUrl = URL.createObjectURL(file);
    startLiquidUpload(file.name, `${sizeMb} MB`, mediaType, previewUrl);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelected(file);
    }
  };
  const handleDownloadReportSummary = () => {
    const summaryText = [
      `LankaLink Verified Service Report`,
      `Report ID: ${currentReport.id}`,
      `Provider: ${currentReport.providerName}`,
      `Location: ${currentReport.district} (${currentReport.gpsTag})`,
      `Timestamp: ${currentReport.submittedAt}`,
      `Evidence File: ${currentReport.fileName} (${currentReport.fileSize})`,
      ``,
      `Inspection Notes:`,
      currentReport.notes,
      ``,
      `Checklist:`,
      ...currentReport.checklist.map((c) => `[${c.verified ? 'x' : ' '}] ${c.label}`),
    ].join('\n');
    const blob = new Blob([summaryText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentReport.id}_summary.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };
  // Payment Modal helpers
  const activeCommission = useMemo(
    () => commissions.find((c) => c.id === paymentCommissionId) || commissions[0],
    [commissions, paymentCommissionId],
  );
  const openPaymentModalFor = (commissionId) => {
    if (commissionId) {
      setPaymentCommissionId(commissionId);
    } else {
      const pending = commissions.find((c) => c.status === 'Awaiting Payment');
      if (pending) setPaymentCommissionId(pending.id);
    }
    setPaymentPhase('form');
    setIsPaymentOpen(true);
  };
  const currencyInfo = CURRENCY_RATES[currency];
  const convertedAmount = (activeCommission.amountUsd * currencyInfo.usdFactor).toFixed(2);
  const convertedLkr = Math.round(
    activeCommission.amountUsd * CURRENCY_RATES.USD.lkrRate,
  ).toLocaleString();
  const formattedCharge = `${currencyInfo.symbol}${convertedAmount}`;
  const handleAuthorizePayment = (e) => {
    e.preventDefault();
    setPaymentPhase('processing');
    window.setTimeout(() => {
      setPaymentPhase('cleared');
      setCommissions((prev) =>
        prev.map((c) =>
          c.id === activeCommission.id ? { ...c, status: 'Completed', updatedAt: 'Just now' } : c,
        ),
      );
      pushNotification(
        'Payment Cleared',
        `Overseas settlement cleared (${formattedCharge})`,
        `${activeCommission.id} · ${activeCommission.service} paid via ${paymentMethod === 'card' ? 'Embossed Glass Card' : selectedWallet}.`,
        'analytics',
      );
    }, 1150);
  };
  const unreadCount = notifications.filter((n) => n.unread).length;
  const visibleNotifications =
    notifFilter === 'unread' ? notifications.filter((n) => n.unread) : notifications;
  const totalRevenueUsd = useMemo(
    () =>
      48650 +
      commissions.filter((c) => c.status === 'Completed').reduce((acc, c) => acc + c.amountUsd, 0),
    [commissions],
  );
  const activeCount = useMemo(
    () => 139 + commissions.filter((c) => c.status === 'Active').length,
    [commissions],
  );
  const simulateLiveNotification = () => {
    const templates = [
      {
        category: 'Provider Arrived',
        title: 'Provider arrived in Dehiwala',
        detail: 'Roshan Silva entered geo-fence at 14 Marine Drive Terrace.',
        targetView: 'gps',
      },
      {
        category: 'Payment Cleared',
        title: 'Overseas payment cleared (£331.80)',
        detail: 'London diaspora account settled monthly garden & solar retainer.',
        targetView: 'analytics',
      },
      {
        category: 'New Service Report',
        title: 'Thermal panel report uploaded',
        detail: '4 inspection photos attached for Colombo 03 Smart Meter service.',
        targetView: 'evidence',
      },
    ];
    const pick = templates[Math.floor(Math.random() * templates.length)];
    pushNotification(pick.category, pick.title, pick.detail, pick.targetView);
  };
  const viewTitles = {
    analytics: {
      label: 'Analytics & Financial Overview',
      subtitle: 'Real-time revenue velocity, diaspora retainers, and service commissions',
    },
    gps: {
      label: 'Provider GPS Portal',
      subtitle: 'Live Colombo corridor tracking and verified on-site check-in controls',
    },
    evidence: {
      label: 'Evidence Upload Center',
      subtitle: 'Drag-and-drop field media ingestion and certified service reports',
    },
  };
  return (
    <MotionConfig reducedMotion="user">
      <div className="ops-root relative min-h-screen bg-[#050811] text-slate-100 overflow-x-hidden flex">
        {/* Not wired to the backend yet: say so, and offer a way back to the main site */}
        <div
          role="note"
          className="fixed bottom-4 left-4 sm:left-auto right-4 z-50 flex items-center justify-between gap-3 rounded-full border border-amber-300/30 bg-[#050811]/85 backdrop-blur px-4 py-2 text-xs text-amber-100 shadow-lg"
        >
          <span>Preview with sample data · not connected to LankaLink yet</span>
          <Link to="/admin/providers" className="font-semibold text-white underline underline-offset-2">
            Back to admin
          </Link>
        </div>
        {/* Ambient Liquid Glass Refractive Backdrop */}
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
          <motion.div
            animate={{ x: [0, 35, -20, 0], y: [0, -25, 20, 0] }}
            transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-40 -left-32 w-[560px] h-[560px] rounded-full bg-sky-500/[0.11] blur-[140px]"
          />
          <motion.div
            animate={{ x: [0, -40, 25, 0], y: [0, 30, -20, 0] }}
            transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-1/3 -right-40 w-[520px] h-[520px] rounded-full bg-emerald-500/[0.09] blur-[150px]"
          />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(14,165,233,0.06),transparent_60%)]" />
        </div>

        {/* Desktop Glass Navigation Sidebar */}
        <aside className="hidden lg:flex flex-col justify-between w-[264px] shrink-0 border-r border-white/[0.09] bg-white/[0.025] backdrop-blur-2xl p-5 sticky top-0 h-screen z-20">
          <div className="space-y-8">
            {/* Brand Wordmark */}
            <div className="flex items-center gap-3 px-2 pt-1">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400/25 to-emerald-400/25 border border-white/20 flex items-center justify-center shadow-inner">
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-sky-300" fill="none">
                  <path
                    d="M5 12C5 8.134 8.134 5 12 5C15.866 5 19 8.134 19 12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M19 12C19 15.866 15.866 19 12 19C8.134 19 5 15.866 5 12"
                    stroke="#34D399"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeDasharray="3 4"
                  />
                  <circle cx="12" cy="12" r="2.5" fill="currentColor" />
                </svg>
              </div>
              <span className="font-display text-xl font-bold tracking-tight text-white whitespace-nowrap shrink-0">
                LankaLink
              </span>
            </div>

            {/* Primary Workspace Views */}
            <nav className="space-y-1.5" aria-label="Primary dashboard modules">
              {[
                { id: 'analytics', label: 'Analytics & Finance', icon: LayoutDashboard },
                { id: 'gps', label: 'Provider GPS Portal', icon: MapPin },
                { id: 'evidence', label: 'Evidence Center', icon: UploadCloud },
              ].map((item) => {
                const Icon = item.icon;
                const active = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveView(item.id)}
                    className={`relative w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${active ? 'text-white' : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.03]'}`}
                  >
                    {active && (
                      <motion.span
                        layoutId="sidebar-active-glass"
                        transition={{ type: 'spring', stiffness: 360, damping: 28 }}
                        className="absolute inset-0 rounded-xl bg-white/[0.08] border border-white/[0.14] shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]"
                      />
                    )}
                    <Icon
                      className={`relative z-10 w-4 h-4 shrink-0 ${active ? 'text-sky-300' : ''}`}
                    />
                    <span className="relative z-10">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Quick Modal & Drawer Triggers */}
            <div className="pt-4 border-t border-white/[0.08] space-y-1.5">
              <button
                type="button"
                onClick={() => openPaymentModalFor()}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm text-slate-300 hover:text-white hover:bg-white/[0.04] transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-3 whitespace-nowrap">
                  <CreditCard className="w-4 h-4 text-sky-300" />
                  <span>Overseas Checkout</span>
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
              </button>

              <button
                type="button"
                onClick={() => setIsNotificationsOpen(true)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm text-slate-300 hover:text-white hover:bg-white/[0.04] transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-3 whitespace-nowrap">
                  <Bell className="w-4 h-4 text-emerald-300" />
                  <span>Live Notifications</span>
                </span>
                {unreadCount > 0 && (
                  <span className="font-mono text-xs tabular-nums text-sky-300">
                    {unreadCount} new
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Operator Profile */}
          <div className="pt-4 border-t border-white/[0.08] flex items-center gap-3 px-1">
            <AvatarImage
              src={ADMIN_AVATAR}
              alt="Dilani Jayawardena"
              initials="DJ"
              className="w-10 h-10"
            />
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">Dilani Jayawardena</p>
              <p className="text-xs text-slate-400 truncate">Operations · Colombo HQ</p>
            </div>
          </div>
        </aside>

        {/* Main Content Viewport */}
        <div className="flex-1 flex flex-col min-w-0 relative z-10">
          {/* Top Bar */}
          <header className="sticky top-0 z-20 border-b border-white/[0.08] bg-[#060913]/75 backdrop-blur-2xl px-4 sm:px-8 py-4 flex items-center justify-between gap-6">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileNavOpen((v) => !v)}
                aria-label="Toggle navigation menu"
                className="lg:hidden p-2 rounded-xl bg-white/[0.05] border border-white/10 text-slate-200 cursor-pointer"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="font-medium text-sky-300">LankaLink</span>
                  <span aria-hidden="true">/</span>
                  <span className="truncate">{viewTitles[activeView].label}</span>
                </div>
                <h1 className="text-lg sm:text-xl font-semibold text-white tracking-tight truncate">
                  {viewTitles[activeView].label}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <MagneticButton
                variant="glass"
                onClick={() => setIsNotificationsOpen(true)}
                ariaLabel="Open live notification panel"
              >
                <Bell className="w-4 h-4 text-sky-300" />
                <span className="hidden sm:inline">Notifications</span>
                {unreadCount > 0 && (
                  <span className="font-mono text-xs tabular-nums text-emerald-300">
                    ({unreadCount})
                  </span>
                )}
              </MagneticButton>

              <MagneticButton variant="primary" onClick={() => openPaymentModalFor()}>
                <Globe className="w-4 h-4" />
                <span>Overseas Payment</span>
              </MagneticButton>
            </div>
          </header>

          {/* Mobile View Switcher Drawer */}
          <AnimatePresence>
            {mobileNavOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="lg:hidden border-b border-white/10 bg-[#080D1B]/95 backdrop-blur-2xl px-4 py-3 space-y-1.5 overflow-hidden"
              >
                {[
                  { id: 'analytics', label: 'Analytics & Finance', icon: LayoutDashboard },
                  { id: 'gps', label: 'Provider GPS Portal', icon: MapPin },
                  { id: 'evidence', label: 'Evidence Center', icon: UploadCloud },
                ].map((item) => {
                  const Icon = item.icon;
                  const active = activeView === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setActiveView(item.id);
                        setMobileNavOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium ${active ? 'bg-white/10 text-white' : 'text-slate-300'}`}
                    >
                      <Icon className="w-4 h-4 text-sky-300" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Dynamic Module Viewport */}
          <main className="flex-1 px-4 sm:px-8 py-6 max-w-[1380px] w-full mx-auto">
            <AnimatePresence mode="wait">
              {activeView === 'analytics' && (
                <motion.section
                  key="view-analytics"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                  className="space-y-6"
                >
                  {/* Floating Liquid Glass KPI Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                    <LiquidGlassPanel className="p-5">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-medium text-slate-400">
                          Total Platform Revenue
                        </span>
                        <ArrowUpRight className="w-4 h-4 text-emerald-300 shrink-0" />
                      </div>
                      <p className="font-mono text-2xl sm:text-3xl font-semibold text-white tabular-nums mt-3">
                        ${totalRevenueUsd.toLocaleString()}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-3">
                        <span className="text-emerald-300 font-medium">+18.4%</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">
                          LKR {((totalRevenueUsd * 298.5) / 1_000_000).toFixed(2)}M
                        </span>
                      </div>
                    </LiquidGlassPanel>

                    <LiquidGlassPanel className="p-5">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-medium text-slate-400">
                          Active Service Commissions
                        </span>
                        <Compass className="w-4 h-4 text-sky-300 shrink-0" />
                      </div>
                      <p className="font-mono text-2xl sm:text-3xl font-semibold text-white tabular-nums mt-3">
                        {activeCount}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-3">
                        <span className="text-sky-300 font-medium">24 technicians</span>
                        <span aria-hidden="true">·</span>
                        <span>Across 9 districts</span>
                      </div>
                    </LiquidGlassPanel>

                    <LiquidGlassPanel className="p-5">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-medium text-slate-400">
                          Recurring Retainer MRR
                        </span>
                        <RefreshCw className="w-4 h-4 text-sky-300 shrink-0" />
                      </div>
                      <p className="font-mono text-2xl sm:text-3xl font-semibold text-white tabular-nums mt-3">
                        $19,420
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-3">
                        <span className="text-emerald-300 font-medium">104.2% retention</span>
                        <span aria-hidden="true">·</span>
                        <span>684 overseas plans</span>
                      </div>
                    </LiquidGlassPanel>

                    <LiquidGlassPanel className="p-5">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-medium text-slate-400">
                          Evidence Verification Rate
                        </span>
                        <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0" />
                      </div>
                      <p className="font-mono text-2xl sm:text-3xl font-semibold text-white tabular-nums mt-3">
                        99.4%
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-3">
                        <span className="text-slate-200 font-medium">14.2 min avg</span>
                        <span aria-hidden="true">·</span>
                        <span>GPS-stamped reports</span>
                      </div>
                    </LiquidGlassPanel>
                  </div>

                  {/* Chart + Quick Action Operational Strip */}
                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-stretch">
                    <LiquidGlassPanel className="xl:col-span-2">
                      <SubscriptionChart timeframe={timeframe} onTimeframeChange={setTimeframe} />
                    </LiquidGlassPanel>

                    <LiquidGlassPanel className="p-6 flex flex-col justify-between">
                      <div className="space-y-4">
                        <div>
                          <h2 className="text-lg font-semibold text-white tracking-tight">
                            Field Operations Pulse
                          </h2>
                          <p className="text-xs text-slate-400 mt-1">
                            Jump directly into active field portals or clear pending overseas
                            invoices.
                          </p>
                        </div>

                        <div className="space-y-3 pt-2">
                          <button
                            type="button"
                            onClick={() => setActiveView('gps')}
                            className="w-full text-left p-4 rounded-xl bg-white/[0.035] hover:bg-white/[0.07] border border-white/[0.08] transition-colors flex items-center justify-between gap-3 cursor-pointer"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <AvatarImage
                                src={activeProvider.avatar}
                                alt={activeProvider.name}
                                initials="KP"
                                className="w-10 h-10"
                              />
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-white truncate">
                                  {activeProvider.name}
                                </p>
                                <p className="text-xs text-slate-400 truncate">
                                  {activeProvider.checkedIn ? 'On-site active' : 'En route'} ·{' '}
                                  {activeProvider.district}
                                </p>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setActiveView('evidence')}
                            className="w-full text-left p-4 rounded-xl bg-white/[0.035] hover:bg-white/[0.07] border border-white/[0.08] transition-colors flex items-center justify-between gap-3 cursor-pointer"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-xl bg-sky-400/15 border border-sky-400/25 flex items-center justify-center shrink-0">
                                <FileCheck2 className="w-5 h-5 text-sky-300" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-white truncate">
                                  Latest Report: {currentReport.id}
                                </p>
                                <p className="text-xs text-slate-400 truncate">
                                  {currentReport.district}
                                </p>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                          </button>
                        </div>
                      </div>

                      <div className="pt-5 mt-5 border-t border-white/[0.08] flex items-center justify-between gap-3">
                        <div className="text-xs text-slate-400">
                          <span className="block text-slate-200 font-medium">
                            {commissions.filter((c) => c.status === 'Awaiting Payment').length}{' '}
                            invoices pending
                          </span>
                          <span>Overseas diaspora settlement</span>
                        </div>
                        <MagneticButton
                          variant="emerald"
                          onClick={() => openPaymentModalFor()}
                          className="px-3.5 py-2 text-xs"
                        >
                          <span>Settle Now</span>
                        </MagneticButton>
                      </div>
                    </LiquidGlassPanel>
                  </div>

                  {/* Active Service Commissions Ledger */}
                  <LiquidGlassPanel interactive={false} className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
                      <div>
                        <h2 className="text-lg font-semibold text-white tracking-tight">
                          Service Commissions Ledger
                        </h2>
                        <p className="text-xs text-slate-400 mt-1">
                          Overseas client requests matched with verified Sri Lankan specialists
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <div className="relative">
                          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search ID, district, client..."
                            aria-label="Search service commissions"
                            className="pl-9 pr-3 py-2 text-xs rounded-xl bg-white/[0.04] border border-white/10 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-400/50 w-56"
                          />
                        </div>

                        <div className="inline-flex items-center p-1 rounded-xl bg-white/[0.04] border border-white/10">
                          {['All', 'Active', 'Awaiting Payment', 'Completed'].map((tab) => (
                            <button
                              key={tab}
                              type="button"
                              onClick={() => setStatusFilter(tab)}
                              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                                statusFilter === tab
                                  ? 'bg-sky-400 text-slate-950'
                                  : 'text-slate-300 hover:text-white'
                              }`}
                            >
                              {tab}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-white/[0.08] text-xs font-medium text-slate-400">
                            <th className="py-3 pr-4">Commission</th>
                            <th className="py-3 px-4">Client & Origin</th>
                            <th className="py-3 px-4">District</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4 text-right">Fee (USD)</th>
                            <th className="py-3 pl-4 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.06] text-sm">
                          {filteredCommissions.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="py-10 text-center text-slate-400 text-sm">
                                No service commissions match your current filter.
                              </td>
                            </tr>
                          ) : (
                            filteredCommissions.map((row) => (
                              <tr
                                key={row.id}
                                className="hover:bg-white/[0.03] transition-colors h-12"
                              >
                                <td className="py-3 pr-4">
                                  <div className="font-medium text-white">{row.service}</div>
                                  <div className="text-xs text-slate-400 font-mono tabular-nums">
                                    {row.id} · {row.providerName}
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="text-slate-200">{row.clientName}</div>
                                  <div className="text-xs text-slate-400">{row.overseasOrigin}</div>
                                </td>
                                <td className="py-3 px-4 text-slate-300 whitespace-nowrap">
                                  {row.district}
                                </td>
                                <td className="py-3 px-4 whitespace-nowrap">
                                  <span
                                    className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                                      row.status === 'Completed'
                                        ? 'text-emerald-300'
                                        : row.status === 'Awaiting Payment'
                                          ? 'text-amber-300'
                                          : 'text-sky-300'
                                    }`}
                                  >
                                    {row.status === 'Completed' ? (
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                    ) : row.status === 'Awaiting Payment' ? (
                                      <Clock className="w-3.5 h-3.5" />
                                    ) : (
                                      <Navigation className="w-3.5 h-3.5" />
                                    )}
                                    <span>{row.status}</span>
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-right font-mono tabular-nums text-white whitespace-nowrap">
                                  ${row.amountUsd.toFixed(2)}
                                </td>
                                <td className="py-3 pl-4 text-right whitespace-nowrap">
                                  {row.status === 'Awaiting Payment' ? (
                                    <button
                                      type="button"
                                      onClick={() => openPaymentModalFor(row.id)}
                                      className="px-3 py-1.5 rounded-lg bg-sky-400/15 hover:bg-sky-400/25 text-sky-300 border border-sky-400/30 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap"
                                    >
                                      Pay Invoice
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => setActiveView('evidence')}
                                      className="px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap"
                                    >
                                      View Log
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </LiquidGlassPanel>
                </motion.section>
              )}

              {activeView === 'gps' && (
                <motion.section
                  key="view-gps"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch"
                >
                  {/* Interactive Colombo GPS Map Viewport */}
                  <LiquidGlassPanel className="lg:col-span-7 p-6 flex flex-col justify-between min-h-[470px]">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                      <div>
                        <h2 className="text-lg font-semibold text-white tracking-tight">
                          Colombo Metro Dispatch Map
                        </h2>
                        <p className="text-xs text-slate-400 font-mono tabular-nums mt-0.5">
                          {activeProvider.coordinates.lat.toFixed(4)}° N ·{' '}
                          {activeProvider.coordinates.lng.toFixed(4)}° E
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="inline-flex p-1 rounded-xl bg-white/[0.04] border border-white/10">
                          {['corridor', 'perimeter'].map((z) => (
                            <button
                              key={z}
                              type="button"
                              onClick={() => setMapZoomMode(z)}
                              className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-colors cursor-pointer whitespace-nowrap ${
                                mapZoomMode === z
                                  ? 'bg-sky-400 text-slate-950'
                                  : 'text-slate-300 hover:text-white'
                              }`}
                            >
                              {z === 'corridor' ? 'City Corridor' : 'Site Perimeter'}
                            </button>
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={handleRefreshCoordinates}
                          aria-label="Ping live GPS coordinates"
                          className="p-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-sky-300 transition-colors cursor-pointer"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Stylized Futuristic Glass Map SVG */}
                    <div className="relative flex-1 rounded-2xl overflow-hidden bg-[#070E1D] border border-white/[0.09]">
                      <motion.svg
                        viewBox="0 0 700 360"
                        className="w-full h-full min-h-[340px]"
                        animate={{
                          scale: mapZoomMode === 'perimeter' ? 1.28 : 1,
                        }}
                        transition={{ type: 'spring', stiffness: 200, damping: 24 }}
                      >
                        <defs>
                          <radialGradient id="mapOceanGrad" cx="0.1" cy="0.5" r="0.7">
                            <stop offset="0%" stopColor="#0EA5E9" stopOpacity="0.18" />
                            <stop offset="100%" stopColor="#070E1D" stopOpacity="0" />
                          </radialGradient>
                          <linearGradient id="routeGrad" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#38BDF8" />
                            <stop offset="100%" stopColor="#34D399" />
                          </linearGradient>
                        </defs>

                        {/* Indian Ocean Western Coastline */}
                        <rect width="700" height="360" fill="url(#mapOceanGrad)" />
                        <path
                          d="M 0 0 L 145 0 C 138 95, 162 190, 148 280 L 135 360 L 0 360 Z"
                          fill="rgba(14, 165, 233, 0.08)"
                        />
                        <path
                          d="M 145 0 C 138 95, 162 190, 148 280 L 135 360"
                          fill="none"
                          stroke="rgba(56, 189, 248, 0.35)"
                          strokeWidth="1.5"
                        />

                        {/* Topological Grid */}
                        {Array.from({ length: 14 }).map((_, i) => (
                          <line
                            key={`v-${i}`}
                            x1={i * 55}
                            y1={0}
                            x2={i * 55}
                            y2={360}
                            stroke="rgba(255,255,255,0.035)"
                          />
                        ))}
                        {Array.from({ length: 8 }).map((_, i) => (
                          <line
                            key={`h-${i}`}
                            x1={0}
                            y1={i * 50}
                            x2={700}
                            y2={i * 50}
                            stroke="rgba(255,255,255,0.035)"
                          />
                        ))}

                        {/* Arterial Roads (Galle Road, Duplication Rd, Ward Place, Baseline Rd) */}
                        <g stroke="rgba(148, 163, 184, 0.16)" strokeWidth="2" fill="none">
                          <path d="M 165 30 L 178 180 L 164 345" />
                          <path d="M 210 20 L 235 190 L 222 340" />
                          <path d="M 175 130 Q 340 120 620 145" />
                          <path d="M 170 210 Q 365 225 650 185" />
                          <path d="M 380 25 L 398 330" />
                          <path d="M 520 35 L 540 325" />
                        </g>

                        {/* District Labels */}
                        <g className="fill-slate-500 text-[11px] font-medium">
                          <text x="45" y="185">
                            Indian Ocean
                          </text>
                          <text x="190" y="95">
                            Galle Face
                          </text>
                          <text x="200" y="255">
                            Kollupitiya
                          </text>
                          <text x="390" y="108">
                            Cinnamon Gardens
                          </text>
                          <text x="545" y="235">
                            Rajagiriya
                          </text>
                        </g>

                        {/* Active Provider Route Vector */}
                        <path
                          d={`M ${activeProvider.mapStart.x} ${activeProvider.mapStart.y} Q ${(activeProvider.mapStart.x + activeProvider.mapEnd.x) / 2} ${Math.min(activeProvider.mapStart.y, activeProvider.mapEnd.y) - 32} ${activeProvider.mapEnd.x} ${activeProvider.mapEnd.y}`}
                          fill="none"
                          stroke="url(#routeGrad)"
                          strokeWidth="2.5"
                          strokeDasharray="6 6"
                        />

                        {/* Destination Property Pin */}
                        <g
                          transform={`translate(${activeProvider.mapEnd.x}, ${activeProvider.mapEnd.y})`}
                        >
                          <circle
                            r="26"
                            fill="rgba(16, 185, 129, 0.12)"
                            stroke="rgba(16, 185, 129, 0.35)"
                          />
                          <circle r="7" fill="#10B981" stroke="#050811" strokeWidth="2.5" />
                          <text
                            y="-15"
                            textAnchor="middle"
                            className="fill-emerald-300 text-[11px] font-medium"
                          >
                            Client Site
                          </text>
                        </g>

                        {/* Live Provider Beacon (glides onto site when checked in) */}
                        <motion.g
                          animate={{
                            x: activeProvider.checkedIn
                              ? activeProvider.mapEnd.x
                              : activeProvider.mapStart.x,
                            y: activeProvider.checkedIn
                              ? activeProvider.mapEnd.y
                              : activeProvider.mapStart.y,
                          }}
                          transition={{ type: 'spring', stiffness: 120, damping: 18 }}
                        >
                          <motion.circle
                            r="20"
                            fill={
                              activeProvider.checkedIn
                                ? 'rgba(16, 185, 129, 0.25)'
                                : 'rgba(56, 189, 248, 0.25)'
                            }
                            animate={{ scale: [1, 1.35, 1], opacity: [0.8, 0.2, 0.8] }}
                            transition={{ duration: 2.2, repeat: Infinity }}
                          />
                          <circle
                            r="9"
                            fill={activeProvider.checkedIn ? '#34D399' : '#38BDF8'}
                            stroke="#FFFFFF"
                            strokeWidth="2.5"
                          />
                        </motion.g>
                      </motion.svg>

                      {/* Floating Bottom Glass Telemetry Bar inside Map */}
                      <div className="absolute bottom-3 left-3 right-3 px-4 py-3 rounded-xl bg-[#060913]/80 backdrop-blur-xl border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2 text-slate-200">
                          <Navigation className="w-3.5 h-3.5 text-sky-300" />
                          <span>{activeProvider.destination}</span>
                        </div>
                        <div className="flex items-center gap-3 font-mono tabular-nums text-slate-300">
                          <span>
                            {activeProvider.checkedIn
                              ? '0.0 km (On-Site)'
                              : `${activeProvider.distanceKm} km away`}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="text-sky-300">
                            {activeProvider.checkedIn
                              ? 'Perimeter Verified'
                              : `ETA ${activeProvider.etaMinutes} min`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </LiquidGlassPanel>

                  {/* Provider Controls + Slide to Check-in / Check-out */}
                  <div className="lg:col-span-5 flex flex-col gap-6">
                    {/* Active Provider Switcher */}
                    <LiquidGlassPanel className="p-6 space-y-5">
                      <div className="flex items-center justify-between gap-2">
                        <h2 className="text-lg font-semibold text-white tracking-tight">
                          Field Specialist Dispatch
                        </h2>
                        <span className="text-xs text-slate-400 font-mono tabular-nums">
                          {providers.filter((p) => p.checkedIn).length}/{providers.length} on-site
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        {providers.map((prov) => {
                          const selected = prov.id === activeProvider.id;
                          return (
                            <button
                              key={prov.id}
                              type="button"
                              onClick={() => setSelectedProviderId(prov.id)}
                              className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                                selected
                                  ? 'bg-white/[0.09] border-sky-400/45 shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]'
                                  : 'bg-white/[0.025] border-white/[0.07] hover:bg-white/[0.05]'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <AvatarImage
                                  src={prov.avatar}
                                  alt={prov.name}
                                  initials={prov.name
                                    .split(' ')
                                    .map((s) => s[0])
                                    .join('')}
                                  className="w-10 h-10"
                                />
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-white truncate">
                                    {prov.name}
                                  </p>
                                  <p className="text-xs text-slate-400 truncate">
                                    {prov.specialty}
                                  </p>
                                </div>
                              </div>
                              <span
                                className={`text-xs font-medium whitespace-nowrap shrink-0 ${prov.checkedIn ? 'text-emerald-300' : 'text-sky-300'}`}
                              >
                                {prov.checkedIn ? 'On-Site' : 'In Transit'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </LiquidGlassPanel>

                    {/* Slide to Check-in / Check-out Action Card */}
                    <LiquidGlassPanel className="p-6 flex-1 flex flex-col justify-between gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <span className="text-xs text-slate-400 block">
                              Selected Assignment
                            </span>
                            <h3 className="text-base font-semibold text-white mt-0.5">
                              {activeProvider.destination}
                            </h3>
                          </div>
                          <span
                            className={`text-xs font-medium px-2.5 py-1 rounded-lg border whitespace-nowrap ${
                              activeProvider.checkedIn
                                ? 'bg-emerald-500/15 border-emerald-400/30 text-emerald-300'
                                : 'bg-sky-500/15 border-sky-400/30 text-sky-300'
                            }`}
                          >
                            {activeProvider.checkedIn ? 'Checked In' : 'Awaiting Arrival'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 py-4 border-y border-white/[0.08]">
                          <div>
                            <span className="text-xs text-slate-400 block">District</span>
                            <span className="text-sm text-slate-100 font-medium mt-1 block">
                              {activeProvider.district}
                            </span>
                          </div>
                          <div>
                            <span className="text-xs text-slate-400 block">
                              {activeProvider.checkedIn
                                ? 'Active Session Timer'
                                : 'Last Visit Duration'}
                            </span>
                            <span className="font-mono text-sm text-white tabular-nums mt-1 block">
                              {activeProvider.checkedIn && activeProvider.checkedInAt
                                ? formatDuration(
                                    Math.max(
                                      0,
                                      Math.floor((tickNow - activeProvider.checkedInAt) / 1000),
                                    ),
                                  )
                                : activeProvider.lastDurationSec
                                  ? formatDuration(activeProvider.lastDurationSec)
                                  : '00:00:00'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <AnimatePresence mode="wait">
                        <motion.div
                          key={`${activeProvider.id}-${activeProvider.checkedIn ? 'out' : 'in'}`}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.2 }}
                        >
                          <LiquidSlideControl
                            // A new key per mode remounts the slider, resetting its position
                            key={`${activeProvider.id}-${activeProvider.checkedIn ? 'checkout' : 'checkin'}`}
                            mode={activeProvider.checkedIn ? 'checkout' : 'checkin'}
                            onComplete={handleProviderSlideAction}
                          />
                        </motion.div>
                      </AnimatePresence>
                    </LiquidGlassPanel>
                  </div>
                </motion.section>
              )}

              {activeView === 'evidence' && (
                <motion.section
                  key="view-evidence"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch"
                >
                  {/* Drag-and-Drop Zone & Liquid-Fill Progress Vessel */}
                  <LiquidGlassPanel className="lg:col-span-5 p-6 flex flex-col justify-between gap-6">
                    <div>
                      <h2 className="text-lg font-semibold text-white tracking-tight">
                        Evidence Ingestion Zone
                      </h2>
                      <p className="text-xs text-slate-400 mt-1">
                        Drop completed job photos or walkthrough videos to generate a client-ready
                        service report.
                      </p>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,video/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleFileSelected(f);
                      }}
                    />

                    {uploadStage === 'uploading' ? (
                      /* Liquid-Fill Progress Animation Vessel */
                      <div className="relative flex-1 min-h-[300px] rounded-2xl border border-sky-400/35 bg-[#060C1A]/90 overflow-hidden flex flex-col items-center justify-center p-6">
                        {/* Rising Liquid Layer */}
                        <motion.div
                          className="absolute left-0 right-0 bottom-0 bg-gradient-to-t from-sky-500/45 via-sky-400/35 to-emerald-400/35"
                          animate={{ height: `${uploadProgress}%` }}
                          transition={{ ease: 'linear', duration: 0.08 }}
                        >
                          {/* Animated Liquid Wave Surface */}
                          <motion.svg
                            viewBox="0 0 400 32"
                            preserveAspectRatio="none"
                            className="w-[200%] h-7 -mt-6 text-emerald-300/60"
                            animate={{ x: ['0%', '-50%'] }}
                            transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
                          >
                            <path
                              d="M0 16 Q 50 0, 100 16 T 200 16 T 300 16 T 400 16 L 400 32 L 0 32 Z"
                              fill="rgba(56, 189, 248, 0.55)"
                            />
                          </motion.svg>
                        </motion.div>

                        <div className="relative z-10 text-center space-y-2">
                          <span className="font-mono text-4xl font-semibold text-white tabular-nums block">
                            {uploadProgress}%
                          </span>
                          <p className="text-sm font-medium text-sky-100">
                            Encrypting & stamping field media...
                          </p>
                          <p className="text-xs text-slate-300 font-mono tabular-nums">
                            {activeProvider.coordinates.lat.toFixed(4)}° N ·{' '}
                            {activeProvider.coordinates.lng.toFixed(4)}° E
                          </p>
                        </div>
                      </div>
                    ) : (
                      /* Interactive Drag-and-Drop Target */
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDraggingOver(true);
                        }}
                        onDragLeave={() => setIsDraggingOver(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            fileInputRef.current?.click();
                          }
                        }}
                        className={`relative flex-1 min-h-[280px] rounded-2xl border-2 border-dashed transition-all p-6 flex flex-col items-center justify-center text-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
                          isDraggingOver
                            ? 'border-sky-300 bg-sky-400/15 scale-[1.01]'
                            : 'border-white/20 bg-white/[0.025] hover:bg-white/[0.05] hover:border-sky-400/45'
                        }`}
                      >
                        <div className="w-14 h-14 rounded-2xl bg-sky-400/15 border border-sky-400/30 flex items-center justify-center mb-4">
                          <UploadCloud className="w-7 h-7 text-sky-300" />
                        </div>
                        <p className="text-base font-medium text-white">
                          {isDraggingOver
                            ? 'Release to start liquid upload'
                            : 'Drag photo or video evidence here'}
                        </p>
                        <p className="text-xs text-slate-400 mt-1.5 max-w-xs">
                          Supports JPG, PNG, MP4, MOV up to 250 MB · Auto-geotagged to active site
                        </p>

                        <div className="flex items-center gap-4 mt-5 text-xs text-slate-400">
                          <span className="inline-flex items-center gap-1.5">
                            <ImageIcon className="w-3.5 h-3.5 text-sky-300" />
                            <span>High-Res Photo</span>
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-1.5">
                            <Video className="w-3.5 h-3.5 text-emerald-300" />
                            <span>Walkthrough Video</span>
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      <MagneticButton
                        variant="glass"
                        disabled={uploadStage === 'uploading'}
                        onClick={() =>
                          startLiquidUpload(
                            'colombo07_solar_inverter_inspection.jpg',
                            '3.4 MB',
                            'image',
                            SAMPLE_EVIDENCE_IMG,
                          )
                        }
                        className="w-full"
                      >
                        <UploadCloud className="w-4 h-4 text-sky-300" />
                        <span>Simulate Field Evidence Upload</span>
                      </MagneticButton>
                    </div>
                  </LiquidGlassPanel>

                  {/* Submitted Service Report Preview */}
                  <LiquidGlassPanel className="lg:col-span-7 p-6 flex flex-col justify-between gap-5">
                    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/[0.08] pb-4">
                      <div>
                        <div className="flex items-center gap-2 text-xs text-emerald-300 font-medium">
                          <FileCheck2 className="w-4 h-4" />
                          <span>Submitted Service Report</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">{currentReport.id}</span>
                        </div>
                        <h3 className="text-lg font-semibold text-white mt-1">
                          {currentReport.district}
                        </h3>
                      </div>

                      <MagneticButton
                        variant="glass"
                        onClick={handleDownloadReportSummary}
                        className="px-3.5 py-2 text-xs"
                      >
                        <Download className="w-3.5 h-3.5 text-sky-300" />
                        <span>Export Summary</span>
                      </MagneticButton>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
                      {/* Uploaded Media Frame with fallback */}
                      <div className="relative rounded-xl overflow-hidden bg-slate-900/90 border border-white/10 min-h-[210px]">
                        {currentReport.mediaType === 'video' ? (
                          <video
                            src={currentReport.previewUrl}
                            controls
                            className="w-full h-full object-cover max-h-[260px]"
                          />
                        ) : evidenceImgError ? (
                          <div className="w-full h-full min-h-[210px] bg-gradient-to-br from-slate-800 to-sky-950/60 flex flex-col items-center justify-center p-4 text-center">
                            <ImageIcon className="w-8 h-8 text-sky-300 mb-2" />
                            <p className="text-xs font-medium text-slate-200">
                              {currentReport.fileName}
                            </p>
                            <p className="text-[11px] text-slate-400 mt-1">
                              {currentReport.gpsTag}
                            </p>
                          </div>
                        ) : (
                          <img
                            src={currentReport.previewUrl}
                            alt={`Submitted service evidence for ${currentReport.district}`}
                            referrerPolicy="no-referrer"
                            onError={() => setEvidenceImgError(true)}
                            className="w-full h-full object-cover max-h-[260px]"
                          />
                        )}
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent p-3 flex items-center justify-between text-xs">
                          <span className="text-slate-100 truncate font-medium">
                            {currentReport.fileName}
                          </span>
                          <span className="font-mono text-slate-300 tabular-nums shrink-0 ml-2">
                            {currentReport.fileSize}
                          </span>
                        </div>
                      </div>

                      {/* Verification Metadata & Interactive Checklist */}
                      <div className="flex flex-col justify-between gap-4">
                        <div className="space-y-2 text-xs">
                          <div className="flex items-center justify-between text-slate-300">
                            <span className="text-slate-400">Field Specialist</span>
                            <span className="font-medium text-white">
                              {currentReport.providerName}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-slate-300">
                            <span className="text-slate-400">GPS Stamp</span>
                            <span className="font-mono tabular-nums text-sky-300">
                              {currentReport.gpsTag}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-slate-300">
                            <span className="text-slate-400">Submitted</span>
                            <span className="font-mono tabular-nums">
                              {currentReport.submittedAt}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2 pt-3 border-t border-white/[0.08]">
                          <p className="text-xs font-medium text-slate-300">
                            Verification Checklist
                          </p>
                          {currentReport.checklist.map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() =>
                                setCurrentReport((prev) => ({
                                  ...prev,
                                  checklist: prev.checklist.map((c) =>
                                    c.id === item.id ? { ...c, verified: !c.verified } : c,
                                  ),
                                }))
                              }
                              className="w-full flex items-center gap-2.5 text-left text-xs text-slate-200 py-1 hover:text-white cursor-pointer"
                            >
                              <span
                                className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 transition-colors ${
                                  item.verified
                                    ? 'bg-emerald-400 border-emerald-400 text-slate-950'
                                    : 'border-white/25 bg-white/[0.04]'
                                }`}
                              >
                                {item.verified && <Check className="w-3 h-3 stroke-[2.5]" />}
                              </span>
                              <span className={item.verified ? 'text-slate-100' : 'text-slate-400'}>
                                {item.label}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.07] text-xs text-slate-300 leading-relaxed">
                      <span className="text-slate-400 font-medium block mb-1">
                        Specialist Summary
                      </span>
                      {currentReport.notes}
                    </div>
                  </LiquidGlassPanel>
                </motion.section>
              )}
            </AnimatePresence>
          </main>
        </div>

        {/* Module 4: Overseas Secure Payment Integration Modal */}
        <AnimatePresence>
          {isPaymentOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
              onClick={() => setIsPaymentOpen(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 18 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 12 }}
                transition={{ type: 'spring', stiffness: 320, damping: 26 }}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="payment-modal-title"
                className="w-full max-w-2xl rounded-3xl bg-[#0A1124]/90 backdrop-blur-2xl border border-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_32px_80px_-20px_rgba(0,0,0,0.9)] overflow-hidden"
              >
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08]">
                  <div className="flex items-center gap-2.5">
                    <Lock className="w-4 h-4 text-emerald-300" />
                    <h2 id="payment-modal-title" className="text-base font-semibold text-white">
                      Overseas Diaspora Payment Gateway
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPaymentOpen(false)}
                    aria-label="Close payment modal"
                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-6 max-h-[85vh] overflow-y-auto">
                  {paymentPhase === 'cleared' ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="py-8 text-center space-y-5"
                    >
                      <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-400/20 border border-emerald-400/40 flex items-center justify-center">
                        <CheckCircle2 className="w-8 h-8 text-emerald-300" />
                      </div>
                      <div className="space-y-1.5">
                        <h3 className="text-xl font-semibold text-white">
                          Overseas Settlement Cleared
                        </h3>
                        <p className="text-sm text-slate-300">
                          {formattedCharge} ({convertedLkr} LKR) authorized for{' '}
                          <span className="text-white font-medium">{activeCommission.service}</span>
                        </p>
                      </div>
                      <div className="max-w-sm mx-auto p-4 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-slate-300 space-y-1.5 font-mono tabular-nums">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Commission ID</span>
                          <span className="text-white">{activeCommission.id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Settlement Channel</span>
                          <span className="text-sky-300">
                            {paymentMethod === 'card' ? 'Glass Card' : selectedWallet}
                          </span>
                        </div>
                      </div>
                      <MagneticButton variant="primary" onClick={() => setIsPaymentOpen(false)}>
                        <span>Return to Dashboard</span>
                      </MagneticButton>
                    </motion.div>
                  ) : (
                    <form onSubmit={handleAuthorizePayment} className="space-y-6">
                      {/* Commission & Currency Selector */}
                      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white/[0.035] border border-white/[0.08]">
                        <div className="min-w-0">
                          <span className="text-xs text-slate-400 block">
                            Settling {activeCommission.id} · {activeCommission.overseasOrigin}
                          </span>
                          <p className="text-sm font-medium text-white truncate mt-0.5">
                            {activeCommission.service}
                          </p>
                          <span className="text-xs font-mono text-emerald-300 tabular-nums mt-0.5 block">
                            LKR {convertedLkr} local disbursement
                          </span>
                        </div>

                        <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/10">
                          {['USD', 'GBP', 'EUR', 'AUD'].map((code) => (
                            <button
                              key={code}
                              type="button"
                              onClick={() => setCurrency(code)}
                              className={`px-2.5 py-1 text-xs font-mono font-medium rounded-lg transition-colors cursor-pointer ${
                                currency === code
                                  ? 'bg-sky-400 text-slate-950'
                                  : 'text-slate-300 hover:text-white'
                              }`}
                            >
                              {code}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Payment Method Switch */}
                      <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-white/[0.04] border border-white/10">
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('card')}
                          className={`py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                            paymentMethod === 'card'
                              ? 'bg-white/[0.12] text-white border border-white/15'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <CreditCard className="w-4 h-4 text-sky-300" />
                          <span>Credit / Debit Card</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('wallet')}
                          className={`py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                            paymentMethod === 'wallet'
                              ? 'bg-white/[0.12] text-white border border-white/15'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <Wallet className="w-4 h-4 text-emerald-300" />
                          <span>Digital Wallets</span>
                        </button>
                      </div>

                      {paymentMethod === 'card' ? (
                        <div className="space-y-5">
                          {/* Mouse-Tilting 3D Embossed Glass Credit Card */}
                          <EmbossedGlassCreditCard
                            cardNumber={cardNumber}
                            cardHolder={cardHolder}
                            expiry={cardExpiry}
                            cvv={cardCvv}
                            cvvFocused={cvvFocused}
                            amountFormatted={formattedCharge}
                          />

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="sm:col-span-2">
                              <label className="text-xs text-slate-300 block mb-1.5">
                                Card Number
                              </label>
                              <input
                                type="text"
                                maxLength={19}
                                value={cardNumber}
                                onChange={(e) => {
                                  const digits = e.target.value.replace(/\D/g, '').slice(0, 16);
                                  const grouped = digits.replace(/(.{4})/g, '$1 ').trim();
                                  setCardNumber(grouped);
                                }}
                                required
                                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/15 text-sm font-mono text-white focus:outline-none focus:border-sky-400"
                              />
                            </div>

                            <div className="sm:col-span-2">
                              <label className="text-xs text-slate-300 block mb-1.5">
                                Cardholder Name
                              </label>
                              <input
                                type="text"
                                value={cardHolder}
                                onChange={(e) => setCardHolder(e.target.value)}
                                required
                                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/15 text-sm text-white focus:outline-none focus:border-sky-400"
                              />
                            </div>

                            <div>
                              <label className="text-xs text-slate-300 block mb-1.5">
                                Expiry (MM/YY)
                              </label>
                              <input
                                type="text"
                                maxLength={5}
                                value={cardExpiry}
                                onChange={(e) => setCardExpiry(e.target.value)}
                                required
                                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/15 text-sm font-mono text-white focus:outline-none focus:border-sky-400"
                              />
                            </div>

                            <div>
                              <label className="text-xs text-slate-300 block mb-1.5">
                                Security Code (CVV)
                              </label>
                              <input
                                type="text"
                                maxLength={4}
                                value={cardCvv}
                                onFocus={() => setCvvFocused(true)}
                                onBlur={() => setCvvFocused(false)}
                                onChange={(e) =>
                                  setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))
                                }
                                required
                                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/15 text-sm font-mono text-white focus:outline-none focus:border-sky-400"
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3 py-2">
                          {[
                            {
                              name: 'Apple Pay',
                              sub: 'Biometric international card pass-through',
                              icon: Smartphone,
                            },
                            {
                              name: 'Google Pay',
                              sub: 'Instant tokenized cross-border settlement',
                              icon: Globe,
                            },
                            {
                              name: 'Wise Instant',
                              sub: 'Mid-market FX corridor for UK / EU / AU',
                              icon: Building2,
                            },
                          ].map((wallet) => {
                            const Icon = wallet.icon;
                            const active = selectedWallet === wallet.name;
                            return (
                              <button
                                key={wallet.name}
                                type="button"
                                onClick={() => setSelectedWallet(wallet.name)}
                                className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all cursor-pointer ${
                                  active
                                    ? 'bg-sky-400/15 border-sky-400/45'
                                    : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06]'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-white/[0.07] flex items-center justify-center">
                                    <Icon className="w-5 h-5 text-sky-300" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-white">{wallet.name}</p>
                                    <p className="text-xs text-slate-400">{wallet.sub}</p>
                                  </div>
                                </div>
                                <span
                                  className={`w-5 h-5 rounded-full border flex items-center justify-center ${active ? 'border-sky-300 bg-sky-400 text-slate-950' : 'border-white/25'}`}
                                >
                                  {active && <Check className="w-3 h-3 stroke-[2.5]" />}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-4 pt-2 border-t border-white/[0.08]">
                        <div className="text-xs text-slate-400">
                          <span>Total Charge</span>
                          <span className="font-mono text-lg font-semibold text-white block tabular-nums">
                            {formattedCharge}
                          </span>
                        </div>
                        <MagneticButton
                          type="submit"
                          variant="primary"
                          disabled={paymentPhase === 'processing'}
                        >
                          {paymentPhase === 'processing' ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              <span>Authorizing...</span>
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="w-4 h-4" />
                              <span>Authorize {formattedCharge}</span>
                            </>
                          )}
                        </MagneticButton>
                      </div>
                    </form>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Module 5: Slide-Out Live Notification Glass Sidebar */}
        <AnimatePresence>
          {isNotificationsOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsNotificationsOpen(false)}
                className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              />
              <motion.aside
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                aria-label="Live notification panel"
                className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-md bg-[#091021]/88 backdrop-blur-2xl border-l border-white/15 shadow-[-24px_0_70px_rgba(0,0,0,0.75)] flex flex-col"
              >
                <div className="p-5 border-b border-white/[0.09] flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold text-white">Live Notification Feed</h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Automated dispatch, payment, and evidence updates
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsNotificationsOpen(false)}
                    aria-label="Close notification sidebar"
                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Controls */}
                <div className="px-5 py-3 border-b border-white/[0.07] flex items-center justify-between gap-3">
                  <div className="inline-flex p-1 rounded-xl bg-white/[0.04] border border-white/10">
                    {['all', 'unread'].map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setNotifFilter(f)}
                        className={`px-3 py-1 text-xs font-medium rounded-lg capitalize transition-colors cursor-pointer ${notifFilter === f ? 'bg-sky-400 text-slate-950' : 'text-slate-300 hover:text-white'}`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <button
                      type="button"
                      onClick={simulateLiveNotification}
                      className="inline-flex items-center gap-1 text-sky-300 hover:text-sky-200 cursor-pointer whitespace-nowrap"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Simulate Event</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })))
                      }
                      className="text-slate-400 hover:text-white cursor-pointer whitespace-nowrap"
                    >
                      Mark read
                    </button>
                  </div>
                </div>

                {/* Bouncy Animated Notification Stream */}
                <div className="flex-1 overflow-y-auto p-5 space-y-3">
                  <AnimatePresence initial={false}>
                    {visibleNotifications.length === 0 ? (
                      <div className="py-16 text-center text-sm text-slate-400">
                        All notifications reviewed.
                      </div>
                    ) : (
                      visibleNotifications.map((notif) => (
                        <motion.button
                          key={notif.id}
                          layout
                          type="button"
                          initial={{ opacity: 0, x: 48, scale: 0.94 }}
                          animate={{ opacity: 1, x: 0, scale: 1 }}
                          exit={{ opacity: 0, x: 36, scale: 0.95 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                          onClick={() => {
                            setNotifications((prev) =>
                              prev.map((item) =>
                                item.id === notif.id ? { ...item, unread: false } : item,
                              ),
                            );
                            setActiveView(notif.targetView);
                            setIsNotificationsOpen(false);
                          }}
                          className={`w-full text-left p-4 rounded-2xl border transition-colors cursor-pointer ${
                            notif.unread
                              ? 'bg-white/[0.075] border-sky-400/35'
                              : 'bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.055]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 text-xs mb-1.5">
                            <span
                              className={`font-medium ${
                                notif.category === 'Payment Cleared'
                                  ? 'text-emerald-300'
                                  : notif.category === 'Provider Arrived'
                                    ? 'text-sky-300'
                                    : 'text-amber-300'
                              }`}
                            >
                              {notif.category}
                            </span>
                            <span className="font-mono text-slate-400 tabular-nums">
                              {notif.timestamp}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-white">{notif.title}</p>
                          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                            {notif.detail}
                          </p>
                        </motion.button>
                      ))
                    )}
                  </AnimatePresence>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}
